/**
 * RME Kit Builder - Scroll Variant Controller
 *
 * Single-page flow where all sections are visible and unlock progressively.
 * Reuses product data, cart logic, and render functions from kit-builder.js.
 */

(function() {
  'use strict';

  // Guard: only activate on scroll variant pages
  if (!document.getElementById('rme-kit-builder-scroll')) return;

  // Signal to kit-builder.js that step-based navigation should not fire
  window._rmeScrollMode = true;

  // Move price bar to document.body so no parent transform/filter can break position:fixed
  var _priceBar = document.getElementById('kb-scroll-price-bar');
  if (_priceBar && _priceBar.parentElement !== document.body) {
    document.body.appendChild(_priceBar);
  }

  // Track whether a radio has been selected in THIS flow (not leftover from base JS)
  let kbsRadioSelected = false;

  // Multi-category tracking: all categories the user selected, and which are done
  let kbsAllCategories = [];    // e.g. ['handheld', 'vehicle', 'base']
  let kbsCompletedCategories = [];
  let kbsCompletedKits = [];    // e.g. [{category:'mobile', radioKey:'uv50pro'}, ...]
  let kbsKitInCart = false;      // true after successful add-to-cart (prevents duplicate adds on back-nav)

  // ── Section State Machine ──────────────────────
  const SECTIONS = ['email', 'interview', 'radio', 'mounting', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'];
  const sectionState = {};
  SECTIONS.forEach((s, i) => { sectionState[s] = i === 0 ? 'active' : 'locked'; });

  function applyAllStates() {
    SECTIONS.forEach(s => {
      const el = document.getElementById('sec-' + s);
      if (!el) return;
      el.classList.remove('kb-section--locked', 'kb-section--active', 'kb-section--complete', 'kb-section--loading', 'kb-section--fading');
      el.classList.add('kb-section--' + sectionState[s]);
      // Summary/content visibility handled entirely by CSS classes
    });
  }

  function scrollToSection(name) {
    const el = document.getElementById('sec-' + name);
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // On desktop, scroll so the previous completed section is visible above
    setTimeout(() => {
      if (window.innerWidth >= 768) {
        var idx = SECTIONS.indexOf(name);
        var prevEl = null;
        for (var pi = idx - 1; pi >= 0; pi--) {
          var candidate = document.getElementById('sec-' + SECTIONS[pi]);
          if (candidate && candidate.style.display !== 'none') { prevEl = candidate; break; }
        }
        if (prevEl) {
          prevEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          return;
        }
      }
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }, 400);
  }

  // ── Public: Complete a section ─────────────────
  window.kbsCompleteSection = function(name) {
    const currentEl = document.getElementById('sec-' + name);
    const nextIdx = SECTIONS.indexOf(name) + 1;
    if (nextIdx >= SECTIONS.length) {
      sectionState[name] = 'complete';
      renderSummary(name);
      applyAllStates();
      updateScrollPriceBar();
      return;
    }

    const next = SECTIONS[nextIdx];
    const nextEl = document.getElementById('sec-' + next);

    // Render product content for next section (if needed)
    function renderNext() {
      // Skip mounting step for non-vehicle/base categories
      if (next === 'mounting' && kbsCurrentCategory !== 'mobile' && kbsCurrentCategory !== 'base') {
        document.getElementById('sec-mounting').style.display = 'none';
        sectionState['mounting'] = 'complete';
        renumberSections();
        // Immediately advance to antennas
        var antEl = document.getElementById('sec-antennas');
        if (antEl) { antEl.classList.remove('kb-section--locked'); antEl.classList.add('kb-section--loading'); }
        scrollToSection('antennas');
        setTimeout(function() {
          if (kbsCurrentCategory === 'handheld') renderAllAntennas();
          else renderCategoryProducts('antennas', kbsCurrentCategory, selectedRadioKey);
          sectionState['antennas'] = 'active';
          if (antEl) antEl.classList.remove('kb-section--loading');
          applyAllStates();
          updateScrollPriceBar();
          updateConsultLinks();
        }, 800);
        return;
      }
      // Skip battery step for scanner category (scanners have no batteries)
      if (next === 'battery' && kbsCurrentCategory === 'scanner') {
        document.getElementById('sec-battery').style.display = 'none';
        sectionState['battery'] = 'complete';
        renumberSections();
        // Immediately advance to accessories
        var accEl = document.getElementById('sec-accessories');
        if (accEl) { accEl.classList.remove('kb-section--locked'); accEl.classList.add('kb-section--loading'); }
        scrollToSection('accessories');
        setTimeout(function() {
          renderCategoryProducts('accessories', kbsCurrentCategory, selectedRadioKey);
          sectionState['accessories'] = 'active';
          if (accEl) accEl.classList.remove('kb-section--loading');
          applyAllStates();
          updateScrollPriceBar();
          updateConsultLinks();
        }, 800);
        return;
      }
      if (next === 'mounting') {
        document.getElementById('sec-mounting').style.display = '';
        renumberSections();
        renderMountingOptions();
        return;
      }
      // Skip battery step when hidden (e.g. scanner category)
      if (next === 'battery' && document.getElementById('sec-battery').style.display === 'none') {
        sectionState['battery'] = 'complete';
        // Advance to accessories
        var accEl = document.getElementById('sec-accessories');
        if (accEl) { accEl.classList.remove('kb-section--locked'); accEl.classList.add('kb-section--loading'); }
        scrollToSection('accessories');
        setTimeout(function() {
          if (kbsCurrentCategory === 'handheld') renderAccessories();
          else renderCategoryProducts('accessories', kbsCurrentCategory, selectedRadioKey);
          sectionState['accessories'] = 'active';
          if (accEl) accEl.classList.remove('kb-section--loading');
          applyAllStates();
          updateScrollPriceBar();
          updateConsultLinks();
        }, 800);
        return;
      }
      if (next === 'quantity') { renderQuantityPicker(); if (!kbsKitInCart) enableCartBtn(); return; }
      if (kbsCurrentCategory === 'handheld') {
        if (next === 'antennas') renderAllAntennas();
        if (next === 'battery') renderBatteryUpgrades();
        if (next === 'accessories') renderAccessories();
        if (next === 'programming') renderProgrammingWithCarryForward();
        if (next === 'review') { renderReview(); fixReviewButtons(); }
      } else {
        renderCategoryProducts(next, kbsCurrentCategory, selectedRadioKey);
        if (next === 'programming' && typeof renderProgramming === 'function') renderProgrammingWithCarryForward();
        if (next === 'review') { renderNonHandheldReview(); }
      }
    }

    // Phase 1: Add fading-out class to current section (CSS handles the fade)
    if (currentEl) currentEl.classList.add('kb-section--fading');

    // Phase 2: After fade-out completes, collapse current + show spinner
    setTimeout(function() {
      sectionState[name] = 'complete';
      renderSummary(name);
      applyAllStates();

      // Show loading spinner on next section
      if (nextEl) {
        nextEl.classList.remove('kb-section--locked');
        nextEl.classList.add('kb-section--loading');
      }
      scrollToSection(next);

      // Phase 3: Render content behind spinner, then reveal
      setTimeout(function() {
        renderNext();

        // Phase 4: Switch from loading to active (CSS fades in)
        // Skip if renderNext() already handled a section skip (e.g. mounting→antennas)
        if (sectionState[next] !== 'complete') {
          sectionState[next] = 'active';
          if (nextEl) nextEl.classList.remove('kb-section--loading');
          applyAllStates();
          updateScrollPriceBar();
          updateConsultLinks();
          addKeyboardSupport();
          // Move focus to new section for screen readers
          setTimeout(function() { focusSection(next); }, 200);
        }
      }, 1200);
    }, 800);
  };

  // ── Public: Go back to previous section ────────
  window.kbsGoBack = function(currentName) {
    const idx = SECTIONS.indexOf(currentName);
    if (idx <= 0) return;
    // Find the most recent completed section before this one
    let prevIdx = idx - 1;
    while (prevIdx >= 0 && sectionState[SECTIONS[prevIdx]] !== 'complete') prevIdx--;
    if (prevIdx < 0) return;
    kbsEditSection(SECTIONS[prevIdx]);
  };

  // ── Public: Edit a completed section (animated) ──────────
  window.kbsEditSection = function(name) {
    // Find the current active section to fade it out first
    const activeSection = SECTIONS.find(s => sectionState[s] === 'active');
    const activeEl = activeSection ? document.getElementById('sec-' + activeSection) : null;

    function doEdit() {
      // If editing radio section in guided handheld mode, go to interview instead
      // (recommendation cards live in the interview section, not radio grid)
      if (name === 'radio' && kbsGuidedMode && kbsCurrentCategory === 'handheld') {
        name = 'interview';
      }

      sectionState[name] = 'active';
      const idx = SECTIONS.indexOf(name);
      for (let i = idx + 1; i < SECTIONS.length; i++) {
        sectionState[SECTIONS[i]] = 'locked';
      }
      disableCartBtn();
      applyAllStates();
      scrollToSection(name);
      // Re-render if product section (category-aware)
      if (name === 'mounting') renderMountingOptions();
      if (kbsCurrentCategory === 'handheld') {
        if (name === 'antennas') renderAllAntennas();
        if (name === 'battery') renderBatteryUpgrades();
        if (name === 'accessories') renderAccessories();
        if (name === 'programming') renderProgrammingWithCarryForward();
      } else {
        if (name === 'antennas' || name === 'battery' || name === 'accessories') {
          renderCategoryProducts(name, kbsCurrentCategory, selectedRadioKey);
        }
        if (name === 'programming') renderProgrammingWithCarryForward();
      }
    }

    // If there's an active section to fade out, animate the transition
    if (activeEl && activeSection !== name) {
      activeEl.classList.add('kb-section--fading');
      setTimeout(doEdit, 500);
    } else {
      doEdit();
    }
  };

  // ── Click handler: complete sections click header to edit ──
  function attachHeaderClicks() {
    SECTIONS.forEach(s => {
      const header = document.querySelector('#sec-' + s + ' .kb-section__header');
      if (header) {
        header.addEventListener('click', function() {
          if (sectionState[s] === 'complete') kbsEditSection(s);
        });
      }
    });
  }

  // ── Summary Renderers ─────────────────────────
  function renderSummary(name) {
    const el = document.querySelector('#sec-' + name + ' .kb-section__summary');
    if (!el) return;

    let html = '';
    switch (name) {
      case 'email': {
        const email = document.getElementById('kbs-lead-email')?.value || 'Skipped';
        html = `<span class="kbs-sel">${email === '' ? 'Skipped' : email}</span>`;
        break;
      }
      case 'interview': {
        const usage = kbsAnswers['usage'] || [];
        const setup = kbsAnswers['setup'] || [];
        const prefs = kbsInterviewTags.slice(0, 3);
        const parts = [];
        const typeLabels = { handheld: 'Handheld', vehicle: 'Vehicle', base: 'Base Station', scanner: 'Scanner' };
        if (setup.length) parts.push(setup.map(s => typeLabels[s] || s).join(', '));
        else if (usage.length) parts.push(usage.map(u => u.charAt(0).toUpperCase() + u.slice(1)).join(', '));
        if (prefs.length) parts.push(prefs.join(', '));
        html = `<span class="kbs-sel">${parts.join(' / ') || 'General use'}</span>`;
        break;
      }
      case 'radio': {
        const lineup = kbsGetRadioLineup();
        const r = lineup.find(x => x.key === selectedRadioKey) || radioLineup.find(x => x.key === selectedRadioKey);
        if (r) html = `<span class="kbs-sel">${r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '')} - $${r.price}</span>`;
        break;
      }
      case 'mounting': {
        html = kbsSelectedMount === 'ramwedge'
          ? `<span class="kbs-sel">RAM Wedge Mount</span>`
          : `<span class="kbs-none">Factory bracket</span>`;
        break;
      }
      case 'antennas': {
        const count = selectedAntennas.size + selectedAddlAntennas.size;
        html = count > 0
          ? `<span class="kbs-sel">${count} antenna${count > 1 ? 's' : ''} added</span>`
          : `<span class="kbs-none">Factory antenna only</span>`;
        break;
      }
      case 'battery': {
        const count = [...selectedBatteries.values()].reduce((a, b) => a + b, 0);
        html = count > 0
          ? `<span class="kbs-sel">${count} batter${count > 1 ? 'ies' : 'y'} added</span>`
          : `<span class="kbs-none">Factory battery only</span>`;
        break;
      }
      case 'accessories': {
        const count = selectedAccessories.size;
        html = count > 0
          ? `<span class="kbs-sel">${count} accessor${count > 1 ? 'ies' : 'y'} added</span>`
          : `<span class="kbs-none">No extras</span>`;
        break;
      }
      case 'programming': {
        const labels = { standard: 'Standard', multi: 'Multi-Location (+$10)', skip: 'Skipped' };
        html = `<span class="kbs-sel">${labels[programmingChoice] || 'Standard'}</span>`;
        break;
      }
      case 'review': {
        const unitPrice = calcKitUnitPrice();
        html = `<span class="kbs-sel">Kit total: $${unitPrice}</span>`;
        break;
      }
      case 'quantity': {
        const tier = (kbsKitQty >= 2 && typeof getVolumeTier === 'function') ? getVolumeTier(kbsKitQty) : null;
        html = `<span class="kbs-sel">${kbsKitQty} kit${kbsKitQty > 1 ? 's' : ''}${tier ? ' (' + tier.label + ' - ' + tier.pct + '% off)' : ''}</span>`;
        break;
      }
    }
    html += `<span class="kbs-edit" onclick="kbsEditSection('${name}')">Edit</span>`;
    el.innerHTML = html;
  }

  // ── Kit Quantity & Volume Discount ─────────────
  let kbsKitQty = 1;

  function renderQuantityPicker() {
    var container = document.getElementById('kbs-qty-picker');
    if (!container) return;

    // If kit was already added to cart, show confirmation instead of qty picker
    if (kbsKitInCart) {
      var catMap = { vehicle: 'mobile', mobile: 'mobile', handheld: 'handheld', base: 'base', hf: 'hf', scanner: 'scanner' };
      var completedMapped = kbsCompletedCategories.map(function(c) { return catMap[c] || c; });
      var remaining = kbsAllCategories.filter(function(c) {
        return !completedMapped.includes(catMap[c] || c);
      });
      if (remaining.length > 0) {
        kbsPromptNextCategory(remaining);
      } else {
        container.innerHTML =
          '<div style="text-align:center;padding:20px 0">' +
            '<div style="font-size:18px;color:var(--rme-gold);margin-bottom:8px;font-family:var(--rme-font-heading);text-transform:uppercase;letter-spacing:1px">Kit Already in Cart</div>' +
            '<p style="color:#ccc;font-size:15px;margin-bottom:16px">This kit has been added to your cart. You can go to cart to check out, or make changes and re-add.</p>' +
            '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
              '<a href="/cart/" class="kb-btn kb-btn--primary" style="text-decoration:none;display:inline-flex;align-items:center">Go to Cart</a>' +
              '<button class="kb-btn kb-btn--secondary" onclick="kbsResetCartState()">Make Changes</button>' +
            '</div>' +
          '</div>';
      }
      disableCartBtn();
      var cartBtn = document.getElementById('kbs-cart-btn');
      if (cartBtn) cartBtn.style.display = 'none';
      updateScrollPriceBar();
      return;
    }

    var tier = typeof getVolumeTier === 'function' ? getVolumeTier(kbsKitQty) : null;
    var nextTier = typeof getNextTier === 'function' ? getNextTier(kbsKitQty) : null;
    var unitPrice = calcKitUnitPrice();

    var html = '<div class="kbs-qty-row">';
    html += '<button class="kbs-qty-btn" onclick="kbsAdjustQty(-1)"' + (kbsKitQty <= 1 ? ' disabled' : '') + '>&minus;</button>';
    html += '<span class="kbs-qty-value">' + kbsKitQty + '</span>';
    html += '<button class="kbs-qty-btn" onclick="kbsAdjustQty(1)"' + (kbsKitQty >= 20 ? ' disabled' : '') + '>+</button>';
    html += '</div>';

    if (tier) {
      html += '<div class="kbs-tier-badge">' + tier.label + ': ' + tier.pct + '% off each kit</div>';
    }
    if (nextTier) {
      var needed = nextTier.min - kbsKitQty;
      html += '<div class="kbs-tier-nudge">Add ' + needed + ' more for ' + nextTier.pct + '% off (' + nextTier.label + ')</div>';
    }

    // Pricing breakdown
    if (kbsKitQty > 1) {
      var discount = tier ? Math.round(BASE_PRICE * tier.pct / 100) : 0;
      var perKit = unitPrice - discount;
      var grandTotal = perKit * kbsKitQty;
      html += '<div class="kbs-qty-pricing">';
      html += '<div class="kbs-qty-line"><span>' + kbsKitQty + ' kits @ $' + perKit + ' each</span><span>$' + grandTotal + '</span></div>';
      if (discount > 0) {
        html += '<div class="kbs-qty-line kbs-qty-savings"><span>You save $' + (discount * kbsKitQty) + ' total</span></div>';
      }
      html += '</div>';
    }

    // Show cart button
    var cartBtn = document.getElementById('kbs-cart-btn');
    if (cartBtn) { cartBtn.style.display = ''; }

    container.innerHTML = html;
    updateScrollPriceBar();
  }

  function calcKitUnitPrice() {
    if (kbsCurrentCategory === 'handheld') {
      return typeof calcTotal === 'function' ? calcTotal() : BASE_PRICE;
    }
    // Non-handheld: calculate from category products
    var lineup = kbsGetRadioLineup();
    var radio = lineup.find(function(r) { return r.key === selectedRadioKey; });
    var total = radio ? radio.price : BASE_PRICE;
    // Mount upgrade
    if (kbsSelectedMount === 'ramwedge' && typeof mobileProducts !== 'undefined' && mobileProducts.vehicleMounts) {
      var ram = mobileProducts.vehicleMounts.find(function(m) { return m.key === 'ramwedge'; });
      if (ram) total += ram.price;
    }
    var antennaList = [], powerList = [], accList = [];
    if (kbsCurrentCategory === 'mobile' || kbsCurrentCategory === 'base') {
      if (typeof mobileProducts !== 'undefined') {
        antennaList = [].concat(mobileProducts.antennaMounts || [], mobileProducts.vehicleAntennas || []);
        powerList = mobileProducts.power || [];
        accList = (mobileProducts.accessories || []).filter(function(a) { return !a.compatRadios || a.compatRadios.includes(selectedRadioKey); });
      }
      if (kbsCurrentCategory === 'base' && typeof baseProducts !== 'undefined') {
        antennaList = [].concat(baseProducts.antennaPath.quick.items || [], baseProducts.antennaPath.permanent.antennas || []);
      }
    } else if (kbsCurrentCategory === 'hf') {
      if (typeof hfProducts !== 'undefined') { antennaList = hfProducts.antennas || []; accList = (hfProducts.accessories || []).filter(function(a) { return !a.radioMatch || a.radioMatch === selectedRadioKey; }); }
      if (typeof mobileProducts !== 'undefined') { powerList = mobileProducts.power || []; }
    } else if (kbsCurrentCategory === 'scanner') {
      if (typeof scannerProducts !== 'undefined') { antennaList = scannerProducts.antennas || []; accList = (scannerProducts.accessories || []).filter(function(a) { return !a.compatRadios || a.compatRadios.includes(selectedRadioKey); }); }
    }
    selectedAntennas.forEach(function(key) { var p = antennaList.find(function(x) { return x.key === key; }); if (p) total += p.price; });
    selectedBatteries.forEach(function(qty, key) { var p = powerList.find(function(x) { return x.key === key; }); if (p) total += p.price * qty; });
    selectedAccessories.forEach(function(key) { var a = accList.find(function(x) { return x.key === key; }); if (a) total += (a.price || 0); });
    if (programmingChoice === 'multi') total += 10;
    // Cross-category 5% discount on base price
    if (kbsCompletedCategories.length > 0) {
      total -= Math.round(BASE_PRICE * 5 / 100);
    }
    return total;
  }

  window.kbsAdjustQty = function(delta) {
    kbsKitQty = Math.max(1, Math.min(20, kbsKitQty + delta));
    renderQuantityPicker();
  };

  window.kbsResetCartState = function() {
    kbsKitInCart = false;
    renderQuantityPicker();
    enableCartBtn();
  };

  // Render programming with carry-forward banner for 2nd+ category
  function renderProgrammingWithCarryForward() {
    renderProgramming();
    if (kbsCompletedCategories.length > 0) {
      var container = document.getElementById('programming-options');
      if (container) {
        var banner = document.createElement('div');
        banner.style.cssText = 'background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#5c5;text-align:left';
        banner.innerHTML = '<strong>Matched to your other radios.</strong> Programming settings carried forward from your previous kit. Change below if needed.';
        container.insertBefore(banner, container.firstChild);
      }
    }
  }

  // ── Price Bar ─────────────────────────────────
  function updateScrollPriceBar() {
    const bar = document.getElementById('kb-scroll-price-bar');
    const floatBtn = document.getElementById('kbs-consult-float');
    if (!bar) return;
    if (!kbsRadioSelected) { bar.style.display = 'none'; if (floatBtn) floatBtn.style.display = 'none'; return; }
    bar.style.display = '';
    if (floatBtn) floatBtn.style.display = '';

    const lineup = kbsGetRadioLineup();
    const r = lineup.find(x => x.key === selectedRadioKey) || radioLineup.find(x => x.key === selectedRadioKey);
    var catLabels = { handheld: 'Handheld', mobile: 'Vehicle Mobile', base: 'Base Station', hf: 'HF', scanner: 'Scanner' };
    var catLabel = catLabels[kbsCurrentCategory] || '';
    var radioName = r ? r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : '';
    document.getElementById('kbs-radio-name').textContent = catLabel ? catLabel + ': ' + radioName : radioName;

    // Calculate total using existing calcTotal if available, otherwise manual
    let total = r ? r.price : 0;
    // Add mount upgrade if selected
    if (kbsSelectedMount === 'ramwedge' && typeof mobileProducts !== 'undefined' && mobileProducts.vehicleMounts) {
      var ram = mobileProducts.vehicleMounts.find(function(m) { return m.key === 'ramwedge'; });
      if (ram) total += ram.price;
    }
    if (kbsCurrentCategory === 'handheld') {
      // Handheld: antenna upgrades + BNC adapter + additional antennas
      if (typeof antennaUpgrades !== 'undefined') {
        antennaUpgrades.forEach(a => { if (selectedAntennas.has(a.key)) total += a.price; });
      }
      if (selectedAntennas.size > 0 && !adapterSuppressed) total += 5; // BNC adapter
      if (typeof additionalAntennas !== 'undefined') {
        additionalAntennas.forEach(a => { if (selectedAddlAntennas.has(a.key)) total += a.price; });
      }
    } else {
      // Non-handheld: antennas are tracked via selectedAntennas but use category-specific product lists
      selectedAntennas.forEach(key => {
        const lists = [
          typeof mobileProducts !== 'undefined' ? [...(mobileProducts.antennaMounts || []), ...(mobileProducts.vehicleAntennas || [])] : [],
          typeof baseProducts !== 'undefined' ? [...(baseProducts.antennaPath?.quick?.items || []), ...(baseProducts.antennaPath?.permanent?.antennas || [])] : [],
          typeof hfProducts !== 'undefined' ? (hfProducts.antennas || []) : [],
          typeof scannerProducts !== 'undefined' ? (scannerProducts.antennas || []) : [],
        ].flat();
        const product = lists.find(p => p.key === key);
        if (product) total += product.price;
      });
    }
    if (kbsCurrentCategory === 'handheld') {
      if (typeof batteryUpgrades !== 'undefined') {
        batteryUpgrades.forEach(b => {
          const qty = selectedBatteries.get(b.key) || 0;
          total += b.price * qty;
        });
      }
      if (typeof accessories !== 'undefined') {
        accessories.forEach(a => { if (selectedAccessories.has(a.key)) total += (a.price || 0); });
      }
    } else {
      // Non-handheld: power/accessories from category-specific product lists
      const catProducts = kbsCurrentCategory === 'scanner' ? (typeof scannerProducts !== 'undefined' ? scannerProducts : {})
        : kbsCurrentCategory === 'hf' ? (typeof hfProducts !== 'undefined' ? hfProducts : {})
        : (typeof mobileProducts !== 'undefined' ? mobileProducts : {});
      const powerOpts = catProducts.power || [];
      selectedBatteries.forEach((qty, key) => {
        const p = powerOpts.find(x => x.key === key);
        if (p) total += p.price * qty;
      });
      const accOpts = catProducts.accessories || [];
      selectedAccessories.forEach(key => {
        const a = accOpts.find(x => x.key === key);
        if (a) total += (a.price || 0);
      });
    }
    if (programmingChoice === 'multi') total += 10;

    // Apply cross-category 5% discount when building 2nd+ category
    var crossCatDiscount = kbsCompletedCategories.length > 0 ? Math.round(total * 5 / 100) : 0;
    total -= crossCatDiscount;

    // Apply quantity and volume discount (on full kit total, not just base price)
    var tier = (kbsKitQty >= 2 && typeof getVolumeTier === 'function') ? getVolumeTier(kbsKitQty) : null;
    var preDiscountTotal = total + crossCatDiscount; // full per-kit total before any discounts
    var perKitDiscount = tier ? Math.round(preDiscountTotal * tier.pct / 100) : 0;
    var grandTotal = (total - perKitDiscount) * kbsKitQty;

    var totalEl = document.getElementById('kbs-total');
    var radioPrice = r ? r.price : 0;
    // Compute addons from pre-discount total so individual prices display correctly
    var addonsPrice = (total + crossCatDiscount) - radioPrice;

    if (kbsKitQty > 1) {
      totalEl.innerHTML = '$' + grandTotal;
      var label = document.getElementById('kbs-radio-name');
      if (label) {
        var rName = r ? r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : '';
        label.textContent = rName + ' x' + kbsKitQty + (tier ? ' (' + tier.pct + '% off)' : '');
      }
    } else {
      totalEl.innerHTML = '$' + total;
    }

    // Consult link
    const consultBtn = document.getElementById('kbs-consult-btn');
    if (consultBtn && typeof getCalendlyUrl === 'function') {
      consultBtn.href = getCalendlyUrl();
    }
  }

  function enableCartBtn() {
    const btn = document.getElementById('kbs-cart-btn');
    if (btn) btn.disabled = false;
  }
  function disableCartBtn() {
    const btn = document.getElementById('kbs-cart-btn');
    if (btn) btn.disabled = true;
  }

  // ── Cart ──────────────────────────────────────
  // Collect cart items for non-handheld categories from category-specific product arrays
  function collectCategoryCartItems() {
    var cat = kbsCurrentCategory;
    var lineup = kbsGetRadioLineup();
    var radio = lineup.find(function(r) { return r.key === selectedRadioKey; });
    if (!radio) return [];
    var items = [{ name: radio.name, price: radio.price, id: radio.id, qty: 1 }];

    // Add mount upgrade if selected
    if (kbsSelectedMount === 'ramwedge' && typeof mobileProducts !== 'undefined' && mobileProducts.vehicleMounts) {
      var ram = mobileProducts.vehicleMounts.find(function(m) { return m.key === 'ramwedge'; });
      if (ram && ram.id) items.push({ name: ram.name, price: ram.price, id: ram.id, qty: 1 });
    }

    var antennaList = [];
    var powerList = [];
    var accList = [];

    if (cat === 'mobile' || cat === 'base') {
      if (typeof mobileProducts !== 'undefined') {
        antennaList = [...(mobileProducts.antennaMounts || []), ...(mobileProducts.vehicleAntennas || [])];
        powerList = mobileProducts.power || [];
        accList = (mobileProducts.accessories || []).filter(function(a) { return !a.compatRadios || a.compatRadios.includes(selectedRadioKey); });
      }
      if (cat === 'base' && typeof baseProducts !== 'undefined') {
        antennaList = [...(baseProducts.antennaPath.quick.items || []), ...(baseProducts.antennaPath.permanent.antennas || [])];
      }
    } else if (cat === 'hf') {
      if (typeof hfProducts !== 'undefined') {
        antennaList = hfProducts.antennas || [];
        accList = (hfProducts.accessories || []).filter(function(a) { return !a.radioMatch || a.radioMatch === selectedRadioKey; });
      }
      if (typeof mobileProducts !== 'undefined') {
        powerList = mobileProducts.power || [];
      }
    } else if (cat === 'scanner') {
      if (typeof scannerProducts !== 'undefined') {
        antennaList = scannerProducts.antennas || [];
        accList = (scannerProducts.accessories || []).filter(function(a) { return !a.compatRadios || a.compatRadios.includes(selectedRadioKey); });
      }
    }

    selectedAntennas.forEach(function(key) {
      var p = antennaList.find(function(x) { return x.key === key; });
      if (p && p.id) items.push({ name: p.name, price: p.price, id: p.id, qty: 1 });
    });

    selectedBatteries.forEach(function(qty, key) {
      var p = powerList.find(function(x) { return x.key === key; });
      if (p && p.id) items.push({ name: p.name, price: p.price * qty, id: p.id, qty: qty });
    });

    selectedAccessories.forEach(function(key) {
      var a = accList.find(function(x) { return x.key === key; });
      if (a && a.id) items.push({ name: a.name, price: a.price || 0, id: a.id, qty: 1 });
    });

    if (programmingChoice === 'multi') items.push({ name: 'Multi-Location Programming', price: 10, id: 624, qty: 1 });

    return items;
  }

  var _kbsCartBusy = false;
  window.kbsAddToCart = function() {
    if (_kbsCartBusy) return;
    _kbsCartBusy = true;
    // Disable all cart buttons and show loading state
    document.querySelectorAll('.kb-btn--cart').forEach(function(btn) {
      btn.disabled = true;
      btn._origText = btn.textContent;
      btn.textContent = 'Adding to cart\u2026';
      btn.style.opacity = '0.6';
    });
    var items;
    if (kbsCurrentCategory === 'handheld') {
      if (typeof collectHandheldCartItems !== 'function') return;
      items = collectHandheldCartItems();
    } else {
      items = collectCategoryCartItems();
    }
    // Multiply quantities by kit count
    if (kbsKitQty > 1) {
      items = items.map(function(item) {
        return { name: item.name, price: item.price, id: item.id, qty: (item.qty || 1) * kbsKitQty };
      });
    }
    var lineup = kbsGetRadioLineup();
    var radio = lineup.find(function(r) { return r.key === selectedRadioKey; }) || radioLineup.find(function(r) { return r.key === selectedRadioKey; });
    var catLabelsCart = { handheld: 'Handheld', mobile: 'Vehicle Mobile', base: 'Base Station', hf: 'HF', scanner: 'Scanner' };
    var catPrefix = catLabelsCart[kbsCurrentCategory] || '';
    var radioName = radio ? radio.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : 'Kit';
    var kitName = catPrefix ? catPrefix + ': ' + radioName : radioName;
    if (kbsKitQty > 1) kitName += ' x' + kbsKitQty;

    // Track completed category
    var catMap = { vehicle: 'mobile', mobile: 'mobile', handheld: 'handheld', base: 'base', hf: 'hf', scanner: 'scanner' };
    if (!kbsCompletedCategories.includes(kbsCurrentCategory)) {
      kbsCompletedCategories.push(kbsCurrentCategory);
    }
    kbsCompletedKits.push({ category: kbsCurrentCategory, radioKey: selectedRadioKey });
    var completedMapped = kbsCompletedCategories.map(function(c) { return catMap[c] || c; });

    // Check for remaining categories
    var remaining = kbsAllCategories.filter(function(c) {
      return !completedMapped.includes(catMap[c] || c);
    });

    kbsKitInCart = true;

    // Calculate any applicable discount (based on full kit total, not just base price)
    var discountAmount = 0;
    var discountLabel = '';
    var kitTotal = (typeof calcTotal === 'function') ? calcTotal() : BASE_PRICE;
    // Cross-category discount: 5% off full kit on 2nd+ category
    if (kbsCompletedKits.length > 1 && typeof kitTotal !== 'undefined') {
      discountAmount = Math.round(kitTotal * 5 / 100) * kbsKitQty;
      discountLabel = 'Multi-Kit Discount (5%)';
    }
    // Volume discount: same category qty 2+
    if (kbsKitQty >= 2 && typeof getVolumeTier === 'function' && typeof kitTotal !== 'undefined') {
      var volTier = getVolumeTier(kbsKitQty);
      if (volTier) {
        var volDiscount = Math.round(kitTotal * kbsKitQty * volTier.pct / 100);
        if (volDiscount > discountAmount) {
          discountAmount = volDiscount;
          discountLabel = volTier.label + ' Discount (' + volTier.pct + '%)';
        }
      }
    }
    // Store discount for the cart handler
    window._kbsDiscount = { amount: discountAmount, label: discountLabel };

    if (remaining.length > 0) {
      // Suppress the cart redirect: add items via AJAX but stay on page
      window._kbsSuppressCartRedirect = true;
      rmeKbAddToCart(items, kitName).then(function() {
        _kbsCartBusy = false;
        document.querySelectorAll('.kb-btn--cart').forEach(function(btn) {
          btn.disabled = false;
          if (btn._origText) btn.textContent = btn._origText;
          btn.style.opacity = '';
        });
      });
    } else {
      rmeKbAddToCart(items, kitName);
      // Single kit: button stays disabled — page redirects to cart
    }
  };

  // ── Multi-category: prompt to build next kit type ──
  function kbsPromptNextCategory(remaining) {
    var catLabels = { handheld: 'Handheld', vehicle: 'Vehicle / Mobile', base: 'Base Station', hf: 'HF', scanner: 'Scanner' };
    var nextCat = remaining[0];
    var nextLabel = catLabels[nextCat] || nextCat;
    var moreCount = remaining.length;

    // Show prompt in the quantity section content area
    var container = document.getElementById('kbs-qty-picker');
    if (!container) return;
    var nudgeHtml = '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#5c5;text-align:left">' +
      '<strong>5% multi-kit discount:</strong> Since we program and test all your radios together, you save 5% on the base price of your ' + nextLabel.toLowerCase() + ' kit.' +
      '</div>';

    container.innerHTML =
      '<div style="text-align:center;padding:20px 0">' +
        '<div style="font-size:18px;color:var(--rme-gold);margin-bottom:8px;font-family:var(--rme-font-heading);text-transform:uppercase;letter-spacing:1px">Kit Added to Cart</div>' +
        '<p style="color:#ccc;font-size:15px;margin-bottom:4px">You also selected <strong style="color:var(--rme-gold)">' + nextLabel + '</strong>' +
          (moreCount > 1 ? ' and ' + (moreCount - 1) + ' more type' + (moreCount > 2 ? 's' : '') : '') + '. Ready to build ' + (moreCount === 1 ? 'it' : 'the next one') + '?</p>' +
        nudgeHtml +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
          '<button class="kb-btn kb-btn--primary" onclick="kbsStartNextCategory(\'' + nextCat + '\')">Build ' + nextLabel + ' Kit</button>' +
          '<a href="/cart/" class="kb-btn kb-btn--secondary" style="text-decoration:none;display:inline-flex;align-items:center">Go to Cart</a>' +
        '</div>' +
      '</div>';

    // Hide the cart button since we already added
    disableCartBtn();
    var cartBtn = document.getElementById('kbs-cart-btn');
    if (cartBtn) cartBtn.style.display = 'none';
    // Hide the back button
    var backBtn = document.querySelector('#sec-quantity .kb-btn--secondary');
    if (backBtn) backBtn.style.display = 'none';
  }

  window.kbsStartNextCategory = function(catKey) {
    // Map direct category keys to internal ones
    var catMap = { vehicle: 'mobile', handheld: 'handheld', base: 'base', hf: 'hf', scanner: 'scanner' };
    kbsCurrentCategory = catMap[catKey] || catKey;

    // Reset product selections (keep programmingChoice + location data to carry forward)
    selectedAntennas = new Set();
    selectedAddlAntennas = new Set();
    selectedBatteries = new Map();
    selectedAccessories = new Set();
    adapterSuppressed = false;
    kbsRadioSelected = false;
    kbsKitQty = 1;
    kbsKitInCart = false;
    kbsSelectedMount = 'factory';
    selectedRadioKey = '';

    // Set answers so category detection returns the right type
    kbsAnswers['usage'] = [catKey];

    // Reset all product sections to locked, activate radio section
    ['radio', 'mounting', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'].forEach(function(s) {
      sectionState[s] = 'locked';
    });
    sectionState['radio'] = 'active';

    // Adapt section headings for the new category
    adaptSectionsForCategory(kbsCurrentCategory);

    // Render radio grid for the new category
    renderScrollRadioGrid();

    // Show cart button again
    var cartBtn = document.getElementById('kbs-cart-btn');
    if (cartBtn) { cartBtn.style.display = ''; cartBtn.disabled = true; }
    // Show back button again
    var backBtns = document.querySelectorAll('#sec-quantity .kb-btn--secondary');
    backBtns.forEach(function(b) { b.style.display = ''; });

    applyAllStates();
    scrollToSection('radio');
    updateScrollPriceBar();
  };

  // ── Email Section ─────────────────────────────
  window.kbsSubmitEmail = function() {
    const emailInput = document.getElementById('kbs-lead-email');
    const email = emailInput.value.trim();
    const name = document.getElementById('kbs-lead-name').value.trim();
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.style.borderColor = 'var(--rme-red, #e55)';
      return;
    }
    emailInput.style.borderColor = '';
    // Prevent double-submit
    var btn = document.querySelector('.kb-email-form .kb-btn--primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    // Save to session
    if (typeof kitSession !== 'undefined') {
      kitSession.email = email;
      kitSession.name = name;
    }
    if (email && typeof rmeKitBuilder !== 'undefined') {
      fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_capture_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, name: name, nonce: rmeKitBuilder.nonce })
      }).catch(() => {});
    }
    if (typeof initConsultationFeatures === 'function') initConsultationFeatures();
    kbsCompleteSection('email');
  };

  window.kbsSkipEmail = function() {
    try {
      if (typeof kitSession !== 'undefined') {
        kitSession.email = '';
        kitSession.name = '';
      }
      if (typeof initConsultationFeatures === 'function') initConsultationFeatures();
    } catch(e) { console.warn('kbsSkipEmail init error:', e); }
    kbsCompleteSection('email');
  };

  // ── Interview Choice (Help Me Choose vs I Know What I Want) ──
  let kbsGuidedMode = false;

  window.kbsStartGuided = function() {
    kbsGuidedMode = true;
    document.getElementById('kbs-interview-choice').style.display = 'none';
    document.getElementById('kbs-interview-stack').style.display = '';
    renderInterviewStack();
    setTimeout(updateUrlState, 100);
  };

  window.kbsStartDirect = function() {
    // Show category multi-select before radio grid
    document.getElementById('kbs-interview-choice').style.display = 'none';
    document.getElementById('kbs-interview-stack').style.display = '';
    var catOpts = [
      { key: 'handheld', icon: ICO.handheld, label: 'Handheld', detail: 'Portable, carried on your person' },
      { key: 'vehicle', icon: ICO.vehicle, label: 'Vehicle / Mobile', detail: 'Mounted in a car, truck, or RV' },
      { key: 'base', icon: ICO.base, label: 'Base Station', detail: 'Fixed location with outdoor antenna' },
      { key: 'hf', icon: ICO.hf, label: 'HF (Long-Distance)', detail: 'Nationwide or worldwide' },
      { key: 'scanner', icon: ICO.scanner, label: 'Scanner / SDR', detail: 'Listen to public safety, weather, and more' },
    ];
    var catHtml = catOpts.map(function(o) {
      return '<div class="kbs-iq-opt" onclick="kbsDirectToggleCat(this,&quot;' + o.key + '&quot;)">' +
        (o.icon ? '<span class="kbs-iq-icon">' + o.icon + '</span>' : '') +
        '<span class="kbs-iq-text">' + o.label + '<span class="kbs-iq-detail">' + o.detail + '</span></span></div>';
    }).join('');
    document.getElementById('kbs-interview-stack').innerHTML =
      '<div class="kbs-iq">' +
        '<h3>What type of radio do you need?</h3>' +
        '<p>Select all that apply.</p>' +
        '<div class="kbs-iq-options">' + catHtml + '</div>' +
        '<div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<button class="kb-btn kb-btn--secondary" onclick="kbsBackToChoices()">Back</button>' +
          '<button class="kb-btn kb-btn--primary" id="kbs-direct-next" disabled onclick="kbsDirectProceed()">Next</button>' +
        '</div>' +
      '</div>';
    kbsDirectCategories = [];
  };

  let kbsDirectCategories = [];

  window.kbsDirectToggleCat = function(el, cat) {
    const idx = kbsDirectCategories.indexOf(cat);
    if (idx >= 0) { kbsDirectCategories.splice(idx, 1); el.classList.remove('selected'); }
    else { kbsDirectCategories.push(cat); el.classList.add('selected'); }
    const btn = document.getElementById('kbs-direct-next');
    if (btn) btn.disabled = kbsDirectCategories.length === 0;
    setTimeout(updateUrlState, 100);
  };

  window.kbsDirectProceed = function() {
    // Set usage answers so category detection works
    kbsAnswers['usage'] = kbsDirectCategories;
    // Track all selected categories in canonical order for multi-kit flow
    kbsAllCategories = CATEGORY_ORDER.filter(function(c) { return kbsDirectCategories.includes(c); });
    // Pre-render radio grid before transition
    renderScrollRadioGrid();
    // Use the standard animated transition
    kbsCompleteSection('interview');
  };

  // ── Interview Section ─────────────────────────
  // Combined flow: needsQuestions (usage/distance/location/preferences) then interviewQuestions (radio-specific)
  window.kbsStep = 0;
  window.kbsAnswers = {};
  window.kbsInterviewTags = [];
  let kbsAllQuestions = []; // built dynamically based on conditional logic

  // Radio type question inserted after budget + reach in guided flow
  const setupQuestion = {
    id: 'setup',
    question: "What type of setup do you need?",
    sub: "Select all that apply.",
    multi: true,
    options: [
      { key: 'handheld', icon: ICO.handheld, label: 'Handheld', detail: 'Portable, carried on your person', tags: [] },
      { key: 'vehicle', icon: ICO.vehicle, label: 'Vehicle / Mobile', detail: 'Mounted in a car, truck, or RV', tags: [] },
      { key: 'base', icon: ICO.base, label: 'Base Station', detail: 'Fixed location with outdoor antenna', tags: [] },
      { key: 'hf', icon: ICO.hf, label: 'HF (Long-Distance)', detail: 'Nationwide or worldwide communication', tags: [] },
      { key: 'scanner', icon: ICO.scanner, label: 'Scanner / SDR', detail: 'Listen to public safety, weather, and more', tags: [] },
    ]
  };

  // Pre-select setup options based on reach answers
  function preSelectSetup() {
    if (kbsAnswers['setup']) return; // already answered
    const reach = kbsAnswers['reach'] || [];
    var preSelected = [];
    if (reach.includes('nearby') || reach.includes('local')) preSelected.push('handheld');
    if (reach.includes('far')) preSelected.push('hf');
    if (reach.includes('listen')) preSelected.push('scanner');
    if (preSelected.length === 0) preSelected.push('handheld');
    kbsAnswers['setup'] = preSelected;
  }

  function buildQuestionList() {
    kbsAllQuestions = [];
    if (kbsGuidedMode) {
      // Guided path: budget → reach → setup type → features (handheld only)
      if (typeof interviewQuestions !== 'undefined') {
        // Always include budget and reach
        interviewQuestions.forEach(q => {
          if (q.id === 'budget' || q.id === 'reach') {
            kbsAllQuestions.push({ ...q, phase: 'interview' });
          }
        });

        // Insert setup type question after reach
        // Pre-select based on reach when we arrive at this step
        if (kbsStep >= 2 && !kbsAnswers['setup']) preSelectSetup();
        kbsAllQuestions.push({ ...setupQuestion, phase: 'interview' });

        // Only include features (needs) for handheld category
        var guidedCat = kbsDetectCategory();
        if (guidedCat === 'handheld') {
          interviewQuestions.forEach(q => {
            if (q.id === 'needs') kbsAllQuestions.push({ ...q, phase: 'interview' });
          });
        }
      }
    } else {
      // Direct/needs path: show needs assessment questions first
      if (typeof needsQuestions !== 'undefined') {
        needsQuestions.forEach(q => {
          if (q.condition && !q.condition(kbsAnswers)) return;
          var opts = q.getOptions ? q.getOptions(kbsAnswers) : q.options;
          kbsAllQuestions.push({ ...q, options: opts, phase: 'needs' });
        });
      }
      var detectedCategory = kbsDetectCategory();
      if (detectedCategory === 'handheld' && typeof interviewQuestions !== 'undefined') {
        interviewQuestions.forEach(q => {
          kbsAllQuestions.push({ ...q, phase: 'interview' });
        });
      }
    }
  }

  // Canonical category display order (matches the option lists in UI)
  var CATEGORY_ORDER = ['handheld', 'vehicle', 'base', 'hf', 'scanner'];
  var CAT_KEY_MAP = { vehicle: 'mobile', handheld: 'handheld', base: 'base', hf: 'hf', scanner: 'scanner' };

  // Determine which radio category the user needs based on their needs answers
  window.kbsDetectCategory = function() {
    // Direct path uses 'usage' from category multi-select
    const usage = kbsAnswers['usage'] || [];
    if (usage.length > 0) {
      // Return first selected category in canonical order
      for (var i = 0; i < CATEGORY_ORDER.length; i++) {
        if (usage.includes(CATEGORY_ORDER[i])) return CAT_KEY_MAP[CATEGORY_ORDER[i]];
      }
      return 'handheld';
    }
    // Guided path uses 'setup' from the new radio type question
    const setup = kbsAnswers['setup'] || [];
    if (setup.length > 0) {
      for (var j = 0; j < CATEGORY_ORDER.length; j++) {
        if (setup.includes(CATEGORY_ORDER[j])) return CAT_KEY_MAP[CATEGORY_ORDER[j]];
      }
      return 'handheld';
    }
    // Fallback: infer from reach answers
    const reach = kbsAnswers['reach'] || [];
    if (reach.includes('far')) return 'hf';
    if (reach.includes('listen')) return 'scanner';
    return 'handheld';
  }

  // Get the right radio lineup for the detected category
  window.kbsGetRadioLineup = function() {
    const cat = kbsDetectCategory();
    switch (cat) {
      case 'mobile':
      case 'base':
        return typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : radioLineup;
      case 'hf':
        return typeof hfRadioLineup !== 'undefined' ? hfRadioLineup : radioLineup;
      case 'scanner':
        return typeof scannerRadioLineup !== 'undefined' ? scannerRadioLineup : radioLineup;
      default:
        return radioLineup;
    }
  }

  function renderInterviewStack() {
    const container = document.getElementById('kbs-interview-stack');
    if (!container) return;
    buildQuestionList();

    let html = '';
    for (let i = 0; i <= kbsStep && i < kbsAllQuestions.length; i++) {
      const q = kbsAllQuestions[i];
      const answer = kbsAnswers[q.id];
      const isAnswered = i < kbsStep;
      const opts = q.options || [];

      if (isAnswered) {
        const selectedOpts = opts.filter(o => {
          if (q.multi) return (answer || []).includes(o.key);
          return answer === o.key;
        });
        const ansText = selectedOpts.map(o => o.label).join(', ');
        html += `<div class="kbs-iq kbs-iq--answered">
          <h3>${q.question} <span class="kbs-iq-answer">${ansText}</span></h3>
        </div>`;
      } else {
        const hasAnswer = answer !== undefined && answer !== null && (Array.isArray(answer) ? answer.length > 0 : true);
        html += `<div class="kbs-iq">
          <h3>${q.question}</h3>
          ${q.sub ? '<p>' + q.sub + '</p>' : ''}
          <div class="kbs-iq-options">
            ${opts.map(o => {
              const sel = q.multi
                ? (answer || []).includes(o.key)
                : answer === o.key;
              return `<div class="kbs-iq-opt ${sel ? 'selected' : ''}"
                onclick="kbsAnswer('${q.id}','${o.key}',${!!q.multi})">
                ${o.icon ? '<span class="kbs-iq-icon">' + o.icon + '</span>' : ''}
                <span class="kbs-iq-text">${o.label}${o.detail ? '<span class="kbs-iq-detail">' + o.detail + '</span>' : ''}</span>
              </div>`;
            }).join('')}
          </div>
          <div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            ${i === 0
              ? '<button class="kb-btn kb-btn--secondary" onclick="kbsBackToChoices()">Back</button>'
              : '<button class="kb-btn kb-btn--secondary" onclick="kbsPrevQ()">Back</button>'
            }
            <button class="kb-btn kb-btn--primary" onclick="kbsNextQ()" ${!hasAnswer ? 'disabled' : ''}>
              ${i === kbsAllQuestions.length - 1 && kbsAllQuestions[i].phase === 'interview' && kbsAllQuestions[i].id !== 'setup' ? 'See Results' : 'Next'}
            </button>
            <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
          </div>
        </div>`;
      }
    }
    container.innerHTML = html;
  }

  window.kbsAnswer = function(qId, optKey, multi) {
    if (multi) {
      if (!kbsAnswers[qId]) kbsAnswers[qId] = [];
      const idx = kbsAnswers[qId].indexOf(optKey);
      if (idx >= 0) {
        // Don't deselect the last remaining option — user must select something else first
        if (kbsAnswers[qId].length > 1) {
          kbsAnswers[qId].splice(idx, 1);
        }
      } else {
        kbsAnswers[qId].push(optKey);
      }
    } else {
      kbsAnswers[qId] = optKey;
    }
    renderInterviewStack();
    setTimeout(updateUrlState, 100);
  };

  window.kbsNextQ = function() {
    // Fade out current question with slide
    var stack = document.getElementById('kbs-interview-stack');
    if (stack) {
      stack.style.opacity = '0';
      stack.style.transform = 'translateY(-12px)';
    }

    setTimeout(function() {
      kbsStep++;
      buildQuestionList();
      if (kbsStep >= kbsAllQuestions.length) {
        showScrollResults();
        if (stack) {
          stack.style.transform = 'translateY(12px)';
          stack.offsetHeight; // force reflow
          stack.style.opacity = '1';
          stack.style.transform = 'translateY(0)';
        }
        // Scroll to the results heading so it's visible (especially on mobile)
        setTimeout(function() {
          var heading = document.querySelector('.kbs-results-heading');
          if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 800);
        setTimeout(updateUrlState, 100);
        return;
      }
      renderInterviewStack();
      setTimeout(updateUrlState, 100);
      // Slide + fade in from below
      if (stack) {
        stack.style.transform = 'translateY(12px)';
        stack.offsetHeight; // force reflow
        stack.style.opacity = '1';
        stack.style.transform = 'translateY(0)';
      }
      setTimeout(function() {
        var qs = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
        if (qs.length) qs[qs.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }, 400);
  };

  // Resolve answer text for a question, with fallback labels for setup/category questions
  var CATEGORY_LABELS = { handheld: 'Handheld', vehicle: 'Vehicle / Mobile', base: 'Base Station', hf: 'HF (Long-Distance)', scanner: 'Scanner / SDR' };
  function resolveAnswerText(q, answer) {
    var opts = q.options || [];
    var selectedOpts = opts.filter(function(o) {
      if (q.multi) return (answer || []).includes(o.key);
      return answer === o.key;
    });
    var text = selectedOpts.map(function(o) { return o.label; }).join(', ');
    // Fallback for setup/usage questions whose options may not resolve
    if (!text && (q.id === 'setup' || q.id === 'usage')) {
      var keys = Array.isArray(answer) ? answer : [answer];
      text = keys.map(function(k) { return CATEGORY_LABELS[k] || k; }).join(', ');
    }
    return text;
  }

  function renderAnsweredQuestions() {
    buildQuestionList();
    var html = '';
    kbsAllQuestions.forEach(function(q) {
      var answer = kbsAnswers[q.id];
      if (answer === undefined || answer === null) return;
      if (Array.isArray(answer) && answer.length === 0) return;
      var ansText = resolveAnswerText(q, answer);
      if (!ansText) return;
      html += '<div class="kbs-iq kbs-iq--answered">' +
        '<h3>' + q.question + ' <span class="kbs-iq-answer">' + ansText + '</span></h3>' +
        '</div>';
    });
    return html;
  }

  function showScrollResults() {
    // Push history state so Android back returns to quiz instead of leaving
    pushSectionState('interview-results');
    const category = kbsDetectCategory();
    const lineup = kbsGetRadioLineup();

    // Track all selected categories in canonical order (guided path)
    if (kbsAllCategories.length === 0) {
      var setup = kbsAnswers['setup'] || [];
      var usage = kbsAnswers['usage'] || [];
      var selected = setup.length > 0 ? setup : usage;
      kbsAllCategories = CATEGORY_ORDER.filter(function(c) { return selected.includes(c); });
    }

    // For non-handheld categories, the wizard steps are different (vehicle setup, coax, etc.)
    // Route to V1's category-specific flow for now
    if (category !== 'handheld') {
      showNonHandheldResult(category, lineup);
      return;
    }

    // Score radios using all answers (needs prefs + interview tags)
    const scores = {};
    radioLineup.forEach(r => { scores[r.key] = 0; });

    // Collect tags from all answers
    kbsInterviewTags = [];
    // From needs preferences
    const prefs = kbsAnswers['preferences'] || [];
    prefs.forEach(p => { if (p && p !== 'nopreference') kbsInterviewTags.push(p); });

    // From interview questions
    kbsAllQuestions.filter(q => q.phase === 'interview').forEach(q => {
      const answer = kbsAnswers[q.id];
      if (!answer) return;
      const keys = Array.isArray(answer) ? answer : [answer];
      keys.forEach(key => {
        const opt = q.options.find(o => o.key === key);
        if (opt && opt.tags) {
          opt.tags.forEach(tag => {
            if (!kbsInterviewTags.includes(tag)) kbsInterviewTags.push(tag);
            radioLineup.forEach(r => {
              if (r.tags.includes(tag)) scores[r.key] += 10;
            });
          });
        }
      });
    });

    // Also score from needs preferences
    prefs.forEach(pref => {
      radioLineup.forEach(r => {
        if (r.tags.includes(pref)) scores[r.key] += 10;
      });
    });

    const ranked = radioLineup.slice().sort((a, b) => scores[b.key] - scores[a.key]);
    const top = ranked[0];
    const runner = ranked[1];

    const topReasons = typeof getPersonalizedReasons === 'function' ? getPersonalizedReasons(top) : [];
    const runnerReasons = typeof getPersonalizedReasons === 'function' ? getPersonalizedReasons(runner) : [];

    function resultCard(radio, reasons, isPrimary) {
      const name = radio.name.replace(' Essentials Kit', '');
      const reasonsHtml = reasons.length > 0
        ? '<ul style="list-style:none;padding:0;margin:0">' + reasons.map(r => '<li style="padding:3px 0">&#10003; ' + r + '</li>').join('') + '</ul>'
        : '<ul style="list-style:none;padding:0;margin:0">' + radio.features.map(f => '<li style="padding:3px 0">&#10003; ' + f + '</li>').join('') + '</ul>';
      return `
        <div class="result-card ${isPrimary ? 'recommended' : ''}" onclick="kbsSelectRadio('${radio.key}')">
          ${isPrimary ? '<div class="result-badge">Best Match</div>' : ''}
          <div class="rc-img"><img src="${radio.img}" alt="${radio.name}"></div>
          <h3>${name}</h3>
          <div class="rc-price">$${radio.price}</div>
          <div class="rc-why">${reasonsHtml}</div>
          <p class="rc-pitch">${radio.pitch}</p>
          <button class="rc-btn" onclick="event.stopPropagation();kbsSelectRadio('${radio.key}')">${isPrimary ? 'Select This Radio' : 'Choose This Instead'}</button>
        </div>`;
    }

    // Show answered questions + results in interview section
    let html = renderAnsweredQuestions();

    // Recommendation
    html += `
      <div class="kbs-results-heading">
        <h3>Our Recommendation</h3>
        <p>Based on what you told us, here's what we'd pick for you.</p>
        <div class="result-cards">
          ${resultCard(top, topReasons, true)}
          ${resultCard(runner, runnerReasons, false)}
        </div>
        <div class="kbs-results-actions">
          <button class="kb-btn kb-btn--secondary" onclick="kbsBackToLastQuestion()">Back</button>
          <button class="kb-btn kb-btn--secondary" onclick="kbsRetakeQuiz()">Retake Quiz</button>
          <button class="kb-btn kb-btn--secondary" onclick="kbsShowAllRadios()">See All Radios</button>
        </div>
        <div class="kbs-results-consult">
          <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
        </div>
      </div>
    `;

    document.getElementById('kbs-interview-stack').innerHTML = html;

    // Also populate the radio grid in radio section (hidden until "See All Radios")
    renderScrollRadioGrid();
  }

  window.kbsPrevQ = function() {
    if (kbsStep > 0) {
      var stack = document.getElementById('kbs-interview-stack');
      if (stack) {
        stack.style.opacity = '0';
        stack.style.transform = 'translateY(12px)';
      }
      setTimeout(function() {
        kbsStep--;
        buildQuestionList();
        if (kbsStep < kbsAllQuestions.length) {
          delete kbsAnswers[kbsAllQuestions[kbsStep].id];
        }
        renderInterviewStack();
        // Slide in from above (reverse direction for back)
        if (stack) {
          stack.style.transform = 'translateY(-12px)';
          stack.offsetHeight;
          stack.style.opacity = '1';
          stack.style.transform = 'translateY(0)';
        }
        scrollToSection('interview');
      }, 400);
    }
  };

  window.kbsBackToLastQuestion = function() {
    // Go back from results to the last interview question
    var stack = document.getElementById('kbs-interview-stack');
    if (stack) {
      stack.style.opacity = '0';
      stack.style.transform = 'translateY(12px)';
    }
    setTimeout(function() {
      buildQuestionList();
      kbsStep = kbsAllQuestions.length - 1;
      renderInterviewStack();
      if (stack) {
        stack.style.transform = 'translateY(-12px)';
        stack.offsetHeight;
        stack.style.opacity = '1';
        stack.style.transform = 'translateY(0)';
      }
      scrollToSection('interview');
    }, 400);
  };

  window.kbsBackToChoices = function() {
    // Reset everything and show the choice screen again
    kbsStep = 0;
    kbsAnswers = {};
    kbsInterviewTags = [];
    kbsGuidedMode = false;
    document.getElementById('kbs-interview-stack').style.display = 'none';
    document.getElementById('kbs-interview-stack').innerHTML = '';
    document.getElementById('kbs-interview-choice').style.display = '';
    scrollToSection('interview');
  };

  window.kbsRetakeQuiz = function() {
    // Reset interview answers and step, re-render questions
    kbsStep = 0;
    var keepUsage = kbsAnswers['usage'];
    var keepSetup = kbsAnswers['setup'];
    kbsAnswers = {};
    if (keepUsage) kbsAnswers['usage'] = keepUsage;
    if (keepSetup) kbsAnswers['setup'] = keepSetup;
    kbsInterviewTags = [];
    document.getElementById('kbs-interview-stack').style.display = '';
    renderInterviewStack();
    scrollToSection('interview');
  };

  // ── Radio Selection ───────────────────────────
  window.kbsSelectRadio = function(key) {
    // Use existing confirmRadioSelection to set up product state
    if (typeof loadRadioProducts === 'function') loadRadioProducts(key);
    selectedRadioKey = key;
    kbsRadioSelected = true;
    kbsKitQty = 1;
    kbsKitInCart = false;
    kbsSelectedMount = 'factory';
    const radio = radioLineup.find(r => r.key === key);
    if (radio) BASE_PRICE = radio.price;

    // Reset selections
    selectedAntennas = new Set();
    selectedAddlAntennas = new Set();
    selectedBatteries = new Map();
    selectedAccessories = new Set();
    uvproRadioColor = 'black';
    uvproBatteryColors = new Map();
    programmingChoice = 'standard';
    progZipPrimary = '';
    progZipsExtra = [];
    progNotes = '';
    progBrandmeisterId = '';
    progUseShipping = true;
    adapterSuppressed = false;

    // Complete interview if not already done
    if (sectionState['interview'] !== 'complete') {
      sectionState['interview'] = 'complete';
      renderSummary('interview');
      applyAllStates();
    }

    // UV-PRO: show color picker before proceeding
    if (key === 'uv-pro') {
      // Activate radio section so color picker is visible
      sectionState['radio'] = 'active';
      applyAllStates();
      scrollToSection('radio');
      kbsShowColorPicker();
      return;
    }

    // Use animated transition for radio → antennas
    // Pre-render antennas content
    renderAllAntennas();
    kbsCompleteSection('radio');
  };

  function kbsShowColorPicker() {
    var container = document.querySelector('#sec-radio .kb-section__content');
    if (!container) return;
    // Clear any existing grid content so only the color picker shows
    var grid = document.getElementById('kbs-radio-grid');
    if (grid) grid.style.display = 'none';
    var S = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.uploadsUrl) ? rmeKitBuilder.uploadsUrl : '/wp-content/uploads/';

    var html = '<div id="kbs-color-picker" style="margin-top:24px">' +
      '<h3 style="font-family:var(--rme-font-heading);font-size:1.1rem;margin:0 0 16px;color:var(--rme-text)">Choose Your Color</h3>' +
      '<div style="max-width:400px;margin:0 auto 20px">' +
        '<img src="' + S + '2025/09/20250904_100414-EDIT.jpg" alt="UV-PRO Black and Tan" ' +
          'style="width:100%;border-radius:8px;border:1px solid var(--rme-border)">' +
      '</div>' +
      '<div class="color-picker" style="justify-content:center;margin-bottom:20px">' +
        '<span class="color-picker-label">Color:</span>' +
        '<div class="color-swatch color-swatch--tan' + (uvproRadioColor === 'tan' ? ' active' : '') + '" ' +
          'onclick="kbsPickColor(\'tan\')" title="Tan / Coyote"></div>' +
        '<div class="color-swatch color-swatch--black' + (uvproRadioColor === 'black' ? ' active' : '') + '" ' +
          'onclick="kbsPickColor(\'black\')" title="Black"></div>' +
        '<span class="color-swatch-name">' + (uvproRadioColor === 'black' ? 'Black' : 'Tan / Coyote') + '</span>' +
      '</div>' +
      '<div style="text-align:center">' +
        '<button class="kb-btn kb-btn--primary" onclick="kbsConfirmColor()">Continue</button>' +
      '</div>' +
    '</div>';

    // Append below existing content
    var existing = document.getElementById('kbs-color-picker');
    if (existing) existing.remove();
    container.insertAdjacentHTML('beforeend', html);
    var picker = document.getElementById('kbs-color-picker');
    if (picker) picker.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.kbsPickColor = function(color) {
    uvproRadioColor = color;
    kbsShowColorPicker(); // re-render to update selected state
  };

  window.kbsConfirmColor = function() {
    var picker = document.getElementById('kbs-color-picker');
    if (picker) picker.remove();
    var grid = document.getElementById('kbs-radio-grid');
    if (grid) grid.style.display = '';
    renderAllAntennas();
    kbsCompleteSection('radio');
  };

  window.kbsShowAllRadios = function() {
    // Complete interview, activate radio section to show grid
    sectionState['interview'] = 'complete';
    renderSummary('interview');
    sectionState['radio'] = 'active';
    applyAllStates();
    scrollToSection('radio');
    renderScrollRadioGrid();
  };

  function renderScrollRadioGrid() {
    const grid = document.getElementById('kbs-radio-grid');
    if (!grid) return;
    const lineup = kbsGetRadioLineup();
    const category = kbsDetectCategory();

    // Check if a completed kit from a related category used one of these radios
    var matchLabels = { mobile: 'vehicle', base: 'vehicle', handheld: null, hf: null, scanner: null };
    var relatedCat = matchLabels[category];
    var matchedRadioKey = null;
    var matchLabel = '';
    if (relatedCat) {
      kbsCompletedKits.forEach(function(kit) {
        // mobile and base share a lineup; check if prior kit used a radio from this lineup
        if ((relatedCat === 'vehicle' && kit.category === 'mobile') ||
            (relatedCat === 'base' && kit.category === 'base')) {
          if (lineup.find(function(r) { return r.key === kit.radioKey; })) {
            matchedRadioKey = kit.radioKey;
            matchLabel = 'Matches your ' + relatedCat + ' radio';
          }
        }
      });
    }

    grid.innerHTML = lineup.map(r => {
      var isMatch = r.key === matchedRadioKey;
      var oos = r.outOfStock;
      return `
      <div class="radio-pick${isMatch ? ' radio-pick--match' : ''}${oos ? ' radio-pick--oos' : ''}" ${oos ? '' : 'onclick="' + (category === 'handheld' ? "kbsSelectRadio('" + r.key + "')" : "kbsSelectNonHandheld('" + r.key + "','" + category + "')") + '"'}>
        <div class="rp-img"><img src="${r.img}" alt="${r.name}"></div>
        <div class="rp-info">
          <h4>${r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '')}</h4>
          ${oos ? '<div class="rp-match" style="color:var(--rme-red);background:rgba(238,85,85,0.12);border-color:var(--rme-red)">Out of Stock</div>' : ''}
          ${isMatch ? '<div class="rp-match">' + matchLabel + '</div>' : ''}
          <div class="rp-price">$${r.price}</div>
          <div class="rp-tag">${r.tagline}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Non-handheld categories: show recommendation with link to V1's specialized flow
  function showNonHandheldResult(category, lineup) {
    const catNames = { mobile: 'Vehicle / Mobile', base: 'Base Station', hf: 'HF (Long-Distance)', scanner: 'Scanner' };
    const catName = catNames[category] || category;
    const available = lineup.filter(r => !r.outOfStock);

    let html = renderAnsweredQuestions();

    const catDetailText = category === 'mobile' ? 'vehicle mounting, antenna installation, and power wiring' :
      category === 'base' ? 'antenna mounting, coax cabling, and power supply' :
      category === 'hf' ? 'HF antennas, coax, and power setup' :
      'scanner antennas and programming';

    html += `
      <div class="kbs-results-heading">
        <h3>${catName} Radios</h3>
        <p>Based on your answers, you need a ${catName.toLowerCase()} setup.</p>
        <p style="color:#888;font-size:13px;margin-bottom:24px">The ${catName.toLowerCase()} kit builder includes specialized options for ${catDetailText}.</p>
        <div class="result-cards">
          ${available.map((r, i) => {
            const name = r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '');
            const vehicleMatch = kbsCompletedKits.find(k => k.category === 'mobile' && k.radioKey === r.key);
            const matchBadge = vehicleMatch ? '<div class="result-badge" style="background:#1a2a1a;color:#4caf50;border:1px solid #2a3a2a">Matches Your Vehicle Radio</div>' : '';
            const isTop = i === 0 && !vehicleMatch;
            return `
              <div class="result-card ${vehicleMatch ? 'recommended' : (isTop ? 'recommended' : '')}" onclick="kbsSelectNonHandheld('${r.key}','${category}')">
                ${vehicleMatch ? matchBadge : (isTop ? '<div class="result-badge">Recommended</div>' : '')}
                <div class="rc-img"><img src="${r.img}" alt="${r.name}"></div>
                <h3>${name}</h3>
                <div class="rc-price">$${r.price}</div>
                <div class="rc-why"><ul style="list-style:none;padding:0;margin:0">${r.features.map(f => '<li style="padding:3px 0">&#10003; ' + f + '</li>').join('')}</ul></div>
                <p class="rc-pitch">${r.pitch || ''}</p>
                <button class="rc-btn" onclick="event.stopPropagation();kbsSelectNonHandheld('${r.key}','${category}')">${i === 0 ? 'Build This Kit' : 'Choose This'}</button>
              </div>`;
          }).join('')}
        </div>
        <div class="kbs-results-actions">
          <button class="kb-btn kb-btn--secondary" onclick="kbsBackToLastQuestion()">Back</button>
          <button class="kb-btn kb-btn--secondary" onclick="kbsRetakeQuiz()">Retake Quiz</button>
        </div>
        <div class="kbs-results-consult">
          <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">Still feeling overwhelmed? We're here for you.<br>Book a consultation with a live person.</a>
        </div>
      </div>`;

    document.getElementById('kbs-interview-stack').innerHTML = html;
  }

  // Handle non-handheld radio selection: stay in V2, adapt sections (animated)
  window.kbsSelectNonHandheld = function(radioKey, category) {
    kbsCurrentCategory = category;

    // Find radio in the appropriate lineup
    const lineup = kbsGetRadioLineup();
    const radio = lineup.find(r => r.key === radioKey);
    if (!radio) return;

    selectedRadioKey = radioKey;
    kbsRadioSelected = true;
    kbsKitQty = 1;
    kbsKitInCart = false;
    kbsSelectedMount = 'factory';
    BASE_PRICE = radio.price;

    // Reset selections
    selectedAntennas = new Set();
    selectedAddlAntennas = new Set();
    selectedBatteries = new Map();
    selectedAccessories = new Set();
    programmingChoice = 'standard';

    // Complete interview + radio sections
    if (sectionState['interview'] !== 'complete') {
      sectionState['interview'] = 'complete';
      renderSummary('interview');
    }

    // Adapt section labels for this category
    adaptSectionsForCategory(category);

    // Determine first product section: mounting for vehicle/base, antennas for others
    var showMounting = (category === 'mobile' || category === 'base');
    var firstSection = showMounting ? 'mounting' : 'antennas';
    var firstEl = document.getElementById('sec-' + firstSection);

    if (showMounting) {
      document.getElementById('sec-mounting').style.display = '';
    }

    // Find current active section to fade out
    const activeSection = SECTIONS.find(s => sectionState[s] === 'active');
    const activeEl = activeSection ? document.getElementById('sec-' + activeSection) : null;

    // Phase 1: Fade out current section
    if (activeEl) activeEl.classList.add('kb-section--fading');

    setTimeout(function() {
      sectionState['radio'] = 'complete';
      renderSummary('radio');
      applyAllStates();

      // Show loading spinner on first product section
      if (firstEl) {
        firstEl.classList.remove('kb-section--locked');
        firstEl.classList.add('kb-section--loading');
      }
      scrollToSection(firstSection);

      // Phase 2: Render content behind spinner, then reveal
      setTimeout(function() {
        if (showMounting) {
          renderMountingOptions();
        } else {
          renderCategoryProducts('antennas', category, radioKey);
        }
        sectionState[firstSection] = 'active';
        if (firstEl) firstEl.classList.remove('kb-section--loading');
        applyAllStates();
        updateScrollPriceBar();
        updateConsultLinks();
      }, 1200);
    }, 800);
  };

  let kbsCurrentCategory = 'handheld';

  // Adapt section headings and descriptions for the selected category
  // ── Mounting Options (vehicle/base only) ────────
  let kbsSelectedMount = 'factory'; // 'factory' or 'ramwedge'

  function renderMountingOptions() {
    var container = document.getElementById('mounting-options');
    if (!container) return;
    var ramWedge = (typeof mobileProducts !== 'undefined' && mobileProducts.vehicleMounts)
      ? mobileProducts.vehicleMounts.find(function(m) { return m.key === 'ramwedge'; })
      : null;

    var html = '';
    // Factory bracket (included, default selected)
    html += '<div class="opt-card ' + (kbsSelectedMount === 'factory' ? 'selected' : '') + '"' +
      ' onclick="kbsSelectMount(\'factory\')">' +
      '<div class="oc-check">' + (kbsSelectedMount === 'factory' ? '\u2713' : '') + '</div>' +
      '<div class="oc-img"><div class="oc-img--placeholder-icon">' + PLACEHOLDER_SVG.mount + '</div></div>' +
      '<div class="oc-body">' +
        '<div class="oc-name">Factory Mounting Bracket</div>' +
        '<div class="oc-desc">Standard mounting bracket included with your radio. Mounts to any flat surface with screws.</div>' +
      '</div>' +
      '<div class="oc-price" style="color:var(--rme-green)">Included</div>' +
    '</div>';

    // RAM Wedge upgrade
    if (ramWedge) {
      html += '<div class="opt-card ' + (kbsSelectedMount === 'ramwedge' ? 'selected' : '') + '"' +
        ' onclick="kbsSelectMount(\'ramwedge\')">' +
        '<div class="oc-check">' + (kbsSelectedMount === 'ramwedge' ? '\u2713' : '') + '</div>' +
        '<div class="oc-img">' + (ramWedge.img ? '<img src="' + ramWedge.img + '" alt="' + ramWedge.name + '">' : '<div class="oc-img--placeholder-icon">' + PLACEHOLDER_SVG.mount + '</div>') + '</div>' +
        '<div class="oc-body">' +
          '<div class="oc-best-use">Upgrade</div>' +
          '<div class="oc-name">' + ramWedge.name + '</div>' +
          '<div class="oc-desc">' + ramWedge.desc + '</div>' +
        '</div>' +
        '<div class="oc-price">+$' + ramWedge.price + '</div>' +
      '</div>';
    }

    container.innerHTML = html;
  }

  window.kbsSelectMount = function(mountKey) {
    kbsSelectedMount = mountKey;
    renderMountingOptions();
    updateScrollPriceBar();
    setTimeout(updateUrlState, 100);
  };

  // Renumber visible sections sequentially so there are no gaps
  function renumberSections() {
    var num = 1;
    SECTIONS.forEach(function(s) {
      var el = document.getElementById('sec-' + s);
      if (!el || el.style.display === 'none') return;
      var badge = el.querySelector('.kb-section__number');
      if (badge) badge.textContent = num;
      num++;
    });
  }

  function adaptSectionsForCategory(cat) {
    const headings = {
      mobile: { antennas: 'Antenna & Mount', battery: 'Power Setup', accessories: 'Accessories', programming: 'Custom Programming' },
      base: { antennas: 'Antenna Setup', battery: 'Power Supply', accessories: 'Accessories', programming: 'Custom Programming' },
      hf: { antennas: 'HF Antenna', battery: 'Power', accessories: 'Accessories', programming: 'Programming' },
      scanner: { antennas: 'Antenna', battery: 'Accessories', accessories: 'Additional Gear', programming: 'Programming' },
    };
    const descriptions = {
      mobile: { antennas: 'Choose your antenna, then pick a mounting option for your vehicle.', battery: 'Your kit includes two ways to power your radio.' },
      base: { antennas: 'Choose your antenna and feedline for your base station setup.' },
      hf: { antennas: 'Select an HF antenna for your station.' },
      scanner: { antennas: 'Add an antenna to improve reception.' },
    };
    const h = headings[cat];
    if (!h) return;
    Object.keys(h).forEach(sec => {
      const el = document.querySelector('#sec-' + sec + ' .kb-section__header h2');
      if (el) el.textContent = h[sec];
    });
    const d = descriptions[cat];
    if (d) {
      Object.keys(d).forEach(sec => {
        const p = document.querySelector('#sec-' + sec + ' .kb-section__content > p');
        if (p) p.textContent = d[sec];
      });
    }
    // Hide battery section for scanner (it just shows a "no options" message)
    if (cat === 'scanner') {
      document.getElementById('sec-battery').style.display = 'none';
      sectionState['battery'] = 'complete';
    }
    renumberSections();
  }

  // ── SVG line-art placeholders for imageless products ──
  var PLACEHOLDER_SVG = {
    antenna: '<svg viewBox="0 0 40 40" fill="none" stroke="#555" stroke-width="1.5"><line x1="20" y1="4" x2="20" y2="36"/><line x1="12" y1="10" x2="20" y2="18"/><line x1="28" y1="10" x2="20" y2="18"/><circle cx="20" cy="36" r="2"/></svg>',
    mount: '<svg viewBox="0 0 40 40" fill="none" stroke="#555" stroke-width="1.5"><rect x="8" y="24" width="24" height="4" rx="1"/><line x1="20" y1="24" x2="20" y2="12"/><circle cx="20" cy="10" r="3"/><line x1="6" y1="32" x2="34" y2="32"/></svg>',
    cable: '<svg viewBox="0 0 40 40" fill="none" stroke="#555" stroke-width="1.5"><path d="M10 8 C10 20 30 20 30 32"/><circle cx="10" cy="6" r="2"/><circle cx="30" cy="34" r="2"/></svg>',
    battery: '<svg viewBox="0 0 40 40" fill="none" stroke="#555" stroke-width="1.5"><rect x="10" y="10" width="20" height="24" rx="2"/><rect x="15" y="6" width="10" height="4" rx="1"/><line x1="20" y1="17" x2="20" y2="27"/><line x1="15" y1="22" x2="25" y2="22"/></svg>',
    accessory: '<svg viewBox="0 0 40 40" fill="none" stroke="#555" stroke-width="1.5"><rect x="8" y="8" width="24" height="24" rx="4"/><circle cx="20" cy="20" r="6"/><circle cx="20" cy="20" r="2"/></svg>',
    power: '<svg viewBox="0 0 40 40" fill="none" stroke="#555" stroke-width="1.5"><path d="M22 6 L14 22 H20 L18 34 L28 16 H21 Z"/></svg>',
  };

  function getPlaceholderSvg(product) {
    var name = (product.name || '').toLowerCase();
    var key = (product.key || '').toLowerCase();
    if (name.includes('mount') || key.includes('mount')) return PLACEHOLDER_SVG.mount;
    if (name.includes('antenna') || name.includes('whip') || name.includes('stick') || name.includes('stubby') || name.includes('discone')) return PLACEHOLDER_SVG.antenna;
    if (name.includes('cable') || name.includes('coax') || name.includes('harness') || name.includes('pigtail') || name.includes('adapter')) return PLACEHOLDER_SVG.cable;
    if (name.includes('battery') || name.includes('eliminator')) return PLACEHOLDER_SVG.battery;
    if (name.includes('power') || name.includes('charger') || name.includes('supply')) return PLACEHOLDER_SVG.power;
    return PLACEHOLDER_SVG.accessory;
  }

  function productImgHtml(p) {
    return p.img ? '<img src="' + p.img + '" alt="' + (p.name || '') + '">' : '<div class="oc-img--placeholder-icon">' + getPlaceholderSvg(p) + '</div>';
  }

  // ── Shared card renderer ───────────────────────
  function renderOneCard(p, badge, isSelected) {
    var imgHtml = productImgHtml(p);
    return '<div class="opt-card ' + (isSelected ? 'selected' : '') + '"' +
      ' onclick="toggleAntenna(\'' + p.key + '\')">' +
      '<div class="oc-check">' + (isSelected ? '\u2713' : '') + '</div>' +
      '<div class="oc-img">' + imgHtml + '</div>' +
      '<div class="oc-body">' +
        (badge ? '<div class="oc-best-use">' + badge + '</div>' : '') +
        '<div class="oc-name">' + p.name + '</div>' +
        '<div class="oc-desc">' + (p.desc || '') + '</div>' +
      '</div>' +
      '<div class="oc-price">+$' + p.price + '</div>' +
    '</div>';
  }

  function renderProductCards(products) {
    return products.map(function(p) {
      return renderOneCard(p, p.bestUse || '', selectedAntennas.has(p.key));
    }).join('');
  }

  // Render category-specific product options in a section
  window.kbsRenderCategoryProducts = renderCategoryProducts;
  function renderCategoryProducts(section, category, radioKey) {
    if (category === 'mobile' || category === 'base') {
      renderMobileBaseProducts(section, category, radioKey);
    } else if (category === 'hf') {
      renderHfProducts(section, radioKey);
    } else if (category === 'scanner') {
      renderScannerProducts(section, radioKey);
    }
  }

  // Mobile / Base station products
  function renderMobileBaseProducts(section, category, radioKey) {
    if (section === 'antennas') {
      const container = document.getElementById('antenna-options');
      if (!container) return;
      const isBase = category === 'base';

      if (isBase && typeof baseProducts !== 'undefined') {
        // Base: antenna path options (unchanged)
        var products = [];
        var quick = baseProducts.antennaPath.quick;
        var perm = baseProducts.antennaPath.permanent;
        products.push(...quick.items.map(i => ({ ...i, bestUse: 'Best for: Quick Setup' })));
        products.push(...perm.antennas.map(i => ({ ...i, bestUse: 'Best for: Permanent Install' })));
        container.innerHTML = renderProductCards(products);
      } else if (typeof mobileProducts !== 'undefined') {
        // Mobile: Antenna first, then mount
        var antennas = mobileProducts.vehicleAntennas || [];
        var universalMounts = (mobileProducts.antennaMounts || []).filter(m => !m.isFenderMount);
        var fenderMounts = (mobileProducts.antennaMounts || []).filter(m => m.isFenderMount);

        var html = '';

        // ── Group 1: Choose your antenna ──
        html += '<div class="kbs-group-label">Choose Your Antenna</div>';
        html += antennas.map(a => renderOneCard(a, a.recommended ? 'Recommended' : '', selectedAntennas.has(a.key))).join('');

        // ── Group 2: Choose a mount ──
        html += '<div class="kbs-group-label" style="margin-top:24px">Choose a Mount</div>';

        // Fender mount picker (vehicle-specific, shown first)
        if (fenderMounts.length > 0) {
          var selectedVehicle = window._kbsSelectedVehicle || '';
          html += '<div class="kbs-fender-picker">' +
            '<div class="kbs-fender-picker__label">Have a supported truck? Add a no-drill fender mount for $29:</div>' +
            '<select class="kbs-fender-select" onchange="window._kbsSelectedVehicle=this.value;kbsRenderCategoryProducts(\'antennas\',\'' + category + '\',\'' + radioKey + '\')">' +
            '<option value="">Select your vehicle (optional)</option>';
          fenderMounts.forEach(function(m) {
            var label = m.name.replace('NCG ', '').replace(/\s*\(.*\)/, '');
            html += '<option value="' + m.key + '"' + (selectedVehicle === m.key ? ' selected' : '') + '>' + label + '</option>';
          });
          html += '</select></div>';

          if (selectedVehicle) {
            var matched = fenderMounts.find(m => m.key === selectedVehicle);
            if (matched) {
              html += renderOneCard(matched, 'Recommended for Your Vehicle', selectedAntennas.has(matched.key));
            }
          }
        }

        // Universal mounts
        html += universalMounts.map(m =>
          renderOneCard(m, m.mountType === 'permanent' ? 'Bolt-On / No Drill' : 'Temporary / Removable', selectedAntennas.has(m.key))
        ).join('');

        // Auto-suggest NMO coax when fender mount or ditch light is selected
        var needsCoax = selectedAntennas.has('ditchlight') ||
          fenderMounts.some(function(m) { return selectedAntennas.has(m.key); });
        if (needsCoax && typeof mobileProducts !== 'undefined' && mobileProducts.nmoCoax) {
          var coax = mobileProducts.nmoCoax.find(function(c) { return c.key === 'nmo-coax'; });
          if (coax) {
            html += '<div class="kbs-group-label" style="margin-top:20px">Coax Cable</div>';
            html += '<p style="color:#999;font-size:13px;margin:8px 0 12px">Your selected mount does not include coax. Add a cable to connect the mount to your radio, or skip if you already have one.</p>';
            html += '<div class="opt-card ' + (selectedAntennas.has(coax.key) ? 'selected' : '') + '"' +
              ' onclick="toggleAntenna(\'' + coax.key + '\')">' +
              '<div class="oc-check">' + (selectedAntennas.has(coax.key) ? '\u2713' : '') + '</div>' +
              '<div class="oc-img">' + productImgHtml(coax) + '</div>' +
              '<div class="oc-body">' +
                '<div class="oc-best-use">Recommended</div>' +
                '<div class="oc-name">' + coax.name + '</div>' +
                '<div class="oc-desc">' + coax.desc + '</div>' +
              '</div>' +
              '<div class="oc-price">+$' + coax.price + '</div>' +
            '</div>';
          }
        }

        container.innerHTML = html;
      }
    }

    if (section === 'battery') {
      const container = document.getElementById('battery-options');
      if (!container) return;

      if (category === 'mobile') {
        // Show included power items, then optional spare harness
        var html = '<div class="kbs-group-label">Included With Your Kit</div>';
        html += '<div class="kbs-included-item">' +
          '<span class="kbs-included-check">&#10003;</span>' +
          '<div><strong>Cigarette Lighter Power Adapter</strong>' +
          '<div style="font-size:13px;color:#999;margin-top:2px">Plug into any 12V outlet. Easiest way to power your radio.</div></div>' +
          '</div>';
        html += '<div class="kbs-included-item">' +
          '<span class="kbs-included-check">&#10003;</span>' +
          '<div><strong>Direct-Wire Harness with Fuse</strong>' +
          '<div style="font-size:13px;color:#999;margin-top:2px">Hardwire to your vehicle battery for a permanent install. Includes inline fuse.</div></div>' +
          '</div>';

        // Optional: spare harness
        var spareHarness = (mobileProducts.powerCables || []).find(function(c) { return c.key === 'wiring-harness'; });
        if (spareHarness) {
          html += '<div class="kbs-group-label" style="margin-top:20px">Optional</div>';
          html += '<div class="opt-card ' + (selectedBatteries.has(spareHarness.key) ? 'selected' : '') + '"' +
            ' onclick="toggleBattery(\'' + spareHarness.key + '\')">' +
            '<div class="oc-check">' + (selectedBatteries.has(spareHarness.key) ? '\u2713' : '') + '</div>' +
            '<div class="oc-img">' + productImgHtml({name:'Spare Wiring Harness',key:'wiring-harness'}) + '</div>' +
            '<div class="oc-body">' +
              '<div class="oc-name">Spare Wiring Harness</div>' +
              '<div class="oc-desc">Extra direct-wire harness. Handy if you move the radio between vehicles.</div>' +
            '</div>' +
            '<div class="oc-price">+$' + spareHarness.price + '</div>' +
          '</div>';
        }

        container.innerHTML = html;
        return;
      }

      // Non-mobile categories: use mobileProducts.power as shared options
      if (typeof mobileProducts === 'undefined') {
        container.innerHTML = '<p style="color:var(--rme-muted)">Standard power setup included.</p>';
        return;
      }
      var powerOpts = mobileProducts.power || [];
      container.innerHTML = powerOpts.map(function(p) {
        return '<div class="opt-card ' + (selectedBatteries.has(p.key) ? 'selected' : '') + '"' +
             ' onclick="toggleBattery(\'' + p.key + '\')">' +
          '<div class="oc-check">' + (selectedBatteries.has(p.key) ? '\u2713' : '') + '</div>' +
          '<div class="oc-img">' + productImgHtml(p) + '</div>' +
          '<div class="oc-body">' +
            '<div class="oc-name">' + p.name + '</div>' +
            '<div class="oc-desc">' + (p.desc || '') + '</div>' +
          '</div>' +
          '<div class="oc-price">+$' + p.price + '</div>' +
        '</div>';
      }).join('') || '<p style="color:var(--rme-muted)">Standard power setup included.</p>';
    }

    if (section === 'accessories') {
      const container = document.getElementById('accessory-options');
      if (!container) return;
      if (typeof mobileProducts === 'undefined') {
        container.innerHTML = '<p style="color:var(--rme-muted)">No additional accessories available.</p>';
        return;
      }
      const acc = (mobileProducts.accessories || []).filter(a => !a.compatRadios || a.compatRadios.includes(radioKey));
      container.innerHTML = acc.map(a => `
        <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
             onclick="toggleAccessory('${a.key}')">
          <div class="oc-check">${selectedAccessories.has(a.key) ? '\u2713' : ''}</div>
          <div class="oc-img">${productImgHtml(a)}</div>
          <div class="oc-body">
            <div class="oc-name">${a.name}</div>
            <div class="oc-desc">${a.desc || ''}</div>
          </div>
          <div class="oc-price">${a.price ? '+$' + a.price : 'Included'}</div>
        </div>
      `).join('') || '<p style="color:var(--rme-muted)">No additional accessories available.</p>';
    }
  }

  // HF products
  function renderHfProducts(section, radioKey) {
    if (section === 'antennas') {
      const container = document.getElementById('antenna-options');
      if (!container || typeof hfProducts === 'undefined') return;
      container.innerHTML = (hfProducts.antennas || []).map(a => `
        <div class="opt-card ${selectedAntennas.has(a.key) ? 'selected' : ''}"
             onclick="toggleAntenna('${a.key}')">
          <div class="oc-check">${selectedAntennas.has(a.key) ? '\u2713' : ''}</div>
          <div class="oc-img">${productImgHtml(a)}</div>
          <div class="oc-body">
            <div class="oc-name">${a.name}</div>
            <div class="oc-desc">${a.desc || ''}</div>
          </div>
          <div class="oc-price">+$${a.price}</div>
        </div>
      `).join('');
    }
    if (section === 'accessories' || section === 'battery') {
      const container = document.getElementById(section === 'battery' ? 'battery-options' : 'accessory-options');
      if (!container || typeof hfProducts === 'undefined') return;
      if (section === 'battery') {
        // HF uses shared 12V power products (LiFePO4 batteries, PSUs) from mobileProducts.power
        renderMobileBaseProducts('battery', 'hf', radioKey);
        return;
      }
      const acc = (hfProducts.accessories || []).filter(a => !a.radioMatch || a.radioMatch === radioKey);
      container.innerHTML = acc.map(a => `
        <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
             onclick="toggleAccessory('${a.key}')">
          <div class="oc-check">${selectedAccessories.has(a.key) ? '\u2713' : ''}</div>
          <div class="oc-img">${productImgHtml(a)}</div>
          <div class="oc-body">
            <div class="oc-name">${a.name}</div>
            <div class="oc-desc">${a.desc || ''}</div>
          </div>
          <div class="oc-price">+$${a.price}</div>
        </div>
      `).join('');
    }
  }

  // Scanner products
  function renderScannerProducts(section, radioKey) {
    if (typeof scannerProducts === 'undefined') return;
    if (section === 'antennas') {
      const container = document.getElementById('antenna-options');
      if (!container) return;
      container.innerHTML = (scannerProducts.antennas || []).map(a => `
        <div class="opt-card ${selectedAntennas.has(a.key) ? 'selected' : ''}"
             onclick="toggleAntenna('${a.key}')">
          <div class="oc-check">${selectedAntennas.has(a.key) ? '\u2713' : ''}</div>
          <div class="oc-img">${productImgHtml(a)}</div>
          <div class="oc-body">
            <div class="oc-name">${a.name}</div>
            <div class="oc-desc">${a.desc || ''}</div>
          </div>
          <div class="oc-price">+$${a.price}</div>
        </div>
      `).join('');
    }
    if (section === 'battery') {
      // Scanners don't have separate power options; show a simple message
      const container = document.getElementById('battery-options');
      if (!container) return;
      container.innerHTML = '<p style="color:var(--rme-muted)">Your scanner includes standard power. No additional power options needed.</p>';
    }
    if (section === 'accessories') {
      const container = document.getElementById('accessory-options');
      if (!container) return;
      const acc = (scannerProducts.accessories || []).filter(a => !a.compatRadios || a.compatRadios.includes(radioKey));
      container.innerHTML = acc.map(a => `
        <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
             onclick="toggleAccessory('${a.key}')">
          <div class="oc-check">${selectedAccessories.has(a.key) ? '\u2713' : ''}</div>
          <div class="oc-img">${productImgHtml(a)}</div>
          <div class="oc-body">
            <div class="oc-name">${a.name}</div>
            <div class="oc-desc">${a.desc || ''}</div>
          </div>
          <div class="oc-price">${a.price ? '+$' + a.price : 'Included'}</div>
        </div>
      `).join('') || '<p style="color:var(--rme-muted)">No additional accessories for this model.</p>';
    }
  }

  // ── Override existing render callbacks ────────
  // The existing toggle functions (toggleAntenna, toggleAddlAntenna, toggleBattery, etc.)
  // call renderAllAntennas(), renderBatteryUpgrades(), etc. which write to the same element IDs.
  // They also call updateBottomBar() which is guarded by _rmeScrollMode.
  // We just need to also update our price bar after each toggle.

  // Monkey-patch updateBottomBar to also update scroll price bar
  const _origUpdateBottomBar = typeof updateBottomBar === 'function' ? updateBottomBar : null;
  if (_origUpdateBottomBar) {
    window.updateBottomBar = function() {
      if (window._rmeScrollMode) {
        updateScrollPriceBar();
        return;
      }
      _origUpdateBottomBar();
    };
  }

  // Monkey-patch rmeKbAddToCart to suppress cart redirect when building multiple categories.
  // The base JS redirects to cart on success (window.location.href = cartUrl).
  // When there are remaining categories, we intercept the redirect and show the
  // "build next kit" prompt instead.
  var _origRmeKbAddToCart = window.rmeKbAddToCart;
  window.rmeKbAddToCart = function(items, kitName) {
    if (!window._kbsSuppressCartRedirect) {
      return _origRmeKbAddToCart(items, kitName);
    }
    // Same AJAX call but no redirect on success
    window._kbsSuppressCartRedirect = false;
    if (typeof rmeKitBuilder === 'undefined' || !rmeKitBuilder.ajaxUrl) return Promise.resolve();
    var normalized = [];
    items.forEach(function(item) {
      if (item.id) {
        var existing = normalized.find(function(n) { return n.id === item.id; });
        if (existing) existing.qty += (item.qty || 1);
        else normalized.push({ id: item.id, qty: item.qty || 1 });
      }
    });
    if (normalized.length === 0) return Promise.resolve();
    return fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_add_to_cart&nonce=' + rmeKitBuilder.nonce, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: normalized, kitName: kitName || '', discount: window._kbsDiscount || null })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        // Update cart badge
        var badge = document.querySelector('.rme-cart-count, .cart-count');
        if (badge && data.data.cartCount) badge.textContent = data.data.cartCount;
        // Update WC cart fragments if available
        if (typeof jQuery !== 'undefined') jQuery(document.body).trigger('wc_fragment_refresh');
        if (typeof markLeadCompleted === 'function') markLeadCompleted();
        // Show prompt for next category
        var catMap = { vehicle: 'mobile', mobile: 'mobile', handheld: 'handheld', base: 'base', hf: 'hf', scanner: 'scanner' };
        var completedMapped = kbsCompletedCategories.map(function(c) { return catMap[c] || c; });
        var remaining = kbsAllCategories.filter(function(c) {
          return !completedMapped.includes(catMap[c] || c);
        });
        kbsPromptNextCategory(remaining);
      }
    })
    .catch(function() {
      window._kbsSuppressCartRedirect = false;
    });
  };

  // Monkey-patch toggle functions for non-handheld categories.
  // Base JS toggleAntenna/toggleBattery/toggleAccessory call handheld render
  // functions (renderAntennaUpgrades, renderBatteryUpgrades, renderAccessories)
  // which overwrite the container with handheld products. In scroll mode for
  // non-handheld categories, re-render category-specific products instead.
  const _origToggleAntenna = window.toggleAntenna;
  window.toggleAntenna = function(key) {
    if (window._rmeScrollMode && kbsCurrentCategory !== 'handheld') {
      if (selectedAntennas.has(key)) selectedAntennas.delete(key);
      else selectedAntennas.add(key);
      renderCategoryProducts('antennas', kbsCurrentCategory, selectedRadioKey);
      updateScrollPriceBar();
      setTimeout(updateUrlState, 100);
      return;
    }
    _origToggleAntenna(key);
    setTimeout(updateUrlState, 100);
  };

  const _origToggleBattery = window.toggleBattery;
  if (_origToggleBattery) {
    window.toggleBattery = function(key) {
      if (window._rmeScrollMode && kbsCurrentCategory !== 'handheld') {
        if (selectedBatteries.has(key)) selectedBatteries.delete(key);
        else selectedBatteries.set(key, 1);
        renderCategoryProducts('battery', kbsCurrentCategory, selectedRadioKey);
        updateScrollPriceBar();
        setTimeout(updateUrlState, 100);
        return;
      }
      _origToggleBattery(key);
      setTimeout(updateUrlState, 100);
    };
  }

  const _origToggleAccessory = window.toggleAccessory;
  if (_origToggleAccessory) {
    window.toggleAccessory = function(key) {
      if (window._rmeScrollMode && kbsCurrentCategory !== 'handheld') {
        if (selectedAccessories.has(key)) selectedAccessories.delete(key);
        else selectedAccessories.add(key);
        renderCategoryProducts('accessories', kbsCurrentCategory, selectedRadioKey);
        updateScrollPriceBar();
        setTimeout(updateUrlState, 100);
        return;
      }
      _origToggleAccessory(key);
      setTimeout(updateUrlState, 100);
    };
  }

  // ── Non-handheld review renderer ───────────────
  // renderReview() from base JS reads handheld product arrays. For non-handheld,
  // we build the review from category-specific product arrays.
  function renderNonHandheldReview() {
    var cat = kbsCurrentCategory;
    var list = document.getElementById('review-list');
    if (!list) return;
    var items = [];
    var editStyle = 'font-size:12px;color:var(--rme-gold);cursor:pointer;text-transform:uppercase;letter-spacing:1px;margin-left:8px;padding:8px 12px;border-radius:4px;min-height:36px;display:inline-flex;align-items:center';

    // Radio
    var lineup = kbsGetRadioLineup();
    var radio = lineup.find(function(r) { return r.key === selectedRadioKey; });
    if (!radio) return;
    items.push(
      '<div class="review-item base">' +
        '<div class="ri-img"><img src="' + (radio.img || '') + '" alt="" onerror="this.parentElement.innerHTML=\'&#128251;\'"></div>' +
        '<div class="ri-name">' + radio.name + '<small>Base kit</small></div>' +
        '<div class="ri-price">$' + radio.price + '</div>' +
      '</div>'
    );

    // Mount upgrade
    if (kbsSelectedMount === 'ramwedge' && typeof mobileProducts !== 'undefined' && mobileProducts.vehicleMounts) {
      var ram = mobileProducts.vehicleMounts.find(function(m) { return m.key === 'ramwedge'; });
      if (ram) {
        items.push(
          '<div class="review-item">' +
            '<div class="ri-img">' + (ram.img ? '<img src="' + ram.img + '" alt="">' : '') + '</div>' +
            '<div class="ri-name">' + ram.name + '<small>Radio mount upgrade</small></div>' +
            '<div class="ri-price">+$' + ram.price + '</div>' +
          '</div>'
        );
      }
    }

    // Build product lists for lookups
    var antennaList = [];
    var powerList = [];
    var accList = [];
    if (cat === 'mobile') {
      if (typeof mobileProducts !== 'undefined') {
        antennaList = [].concat(mobileProducts.antennaMounts || [], mobileProducts.vehicleAntennas || []);
        powerList = mobileProducts.power || [];
        accList = (mobileProducts.accessories || []).filter(function(a) { return !a.compatRadios || a.compatRadios.includes(selectedRadioKey); });
      }
    } else if (cat === 'base') {
      if (typeof baseProducts !== 'undefined') {
        antennaList = [].concat(baseProducts.antennaPath.quick.items || [], baseProducts.antennaPath.permanent.antennas || []);
      }
      if (typeof mobileProducts !== 'undefined') { powerList = mobileProducts.power || []; }
    } else if (cat === 'hf') {
      if (typeof hfProducts !== 'undefined') {
        antennaList = hfProducts.antennas || [];
        accList = (hfProducts.accessories || []).filter(function(a) { return !a.radioMatch || a.radioMatch === selectedRadioKey; });
      }
      if (typeof mobileProducts !== 'undefined') { powerList = mobileProducts.power || []; }
    } else if (cat === 'scanner') {
      if (typeof scannerProducts !== 'undefined') {
        antennaList = scannerProducts.antennas || [];
        accList = (scannerProducts.accessories || []).filter(function(a) { return !a.compatRadios || a.compatRadios.includes(selectedRadioKey); });
      }
    }

    // Antennas
    if (selectedAntennas.size > 0) {
      items.push('<div style="font-size:12px;color:var(--rme-muted);padding:12px 0 4px;border-bottom:1px solid var(--rme-border);display:flex;justify-content:space-between;align-items:center"><span>ANTENNAS</span><span style="' + editStyle + '" onclick="kbsEditSection(\'antennas\')">Edit</span></div>');
      selectedAntennas.forEach(function(key) {
        var a = antennaList.find(function(x) { return x.key === key; });
        if (a) {
          items.push(
            '<div class="review-item">' +
              '<div class="ri-img">' + (a.img ? '<img src="' + a.img + '" alt="">' : '') + '</div>' +
              '<div class="ri-name">' + a.name + '</div>' +
              '<div class="ri-price">+$' + a.price + '</div>' +
            '</div>'
          );
        }
      });
    }

    // Power / Battery
    if (selectedBatteries.size > 0) {
      items.push('<div style="font-size:12px;color:var(--rme-muted);padding:12px 0 4px;border-bottom:1px solid var(--rme-border);display:flex;justify-content:space-between;align-items:center"><span>POWER</span><span style="' + editStyle + '" onclick="kbsEditSection(\'battery\')">Edit</span></div>');
      selectedBatteries.forEach(function(qty, key) {
        var p = powerList.find(function(x) { return x.key === key; });
        if (p) {
          items.push(
            '<div class="review-item">' +
              '<div class="ri-img">' + (p.img ? '<img src="' + p.img + '" alt="">' : '') + '</div>' +
              '<div class="ri-name">' + p.name + (qty > 1 ? ' <small>x' + qty + '</small>' : '') + '</div>' +
              '<div class="ri-price">+$' + (p.price * qty) + '</div>' +
            '</div>'
          );
        }
      });
    }

    // Accessories
    if (selectedAccessories.size > 0) {
      items.push('<div style="font-size:12px;color:var(--rme-muted);padding:12px 0 4px;border-bottom:1px solid var(--rme-border);display:flex;justify-content:space-between;align-items:center"><span>ACCESSORIES</span><span style="' + editStyle + '" onclick="kbsEditSection(\'accessories\')">Edit</span></div>');
      selectedAccessories.forEach(function(key) {
        var a = accList.find(function(x) { return x.key === key; });
        if (a) {
          items.push(
            '<div class="review-item">' +
              '<div class="ri-img">' + (a.img ? '<img src="' + a.img + '" alt="">' : '') + '</div>' +
              '<div class="ri-name">' + a.name + '</div>' +
              '<div class="ri-price">' + (a.price ? '+$' + a.price : 'Included') + '</div>' +
            '</div>'
          );
        }
      });
    }

    // Programming
    items.push('<div style="font-size:12px;color:var(--rme-muted);padding:12px 0 4px;border-bottom:1px solid var(--rme-border);display:flex;justify-content:space-between;align-items:center"><span>PROGRAMMING</span><span style="' + editStyle + '" onclick="kbsEditSection(\'programming\')">Edit</span></div>');
    if (programmingChoice === 'standard') {
      items.push('<div class="review-item" style="opacity:0.7"><div class="ri-img" style="background:var(--rme-card);display:flex;align-items:center;justify-content:center;font-size:24px">&#128225;</div><div class="ri-name">Custom Programming<small>Standard</small></div><div class="ri-price" style="color:var(--rme-green)">Included</div></div>');
    } else if (programmingChoice === 'multi') {
      items.push('<div class="review-item"><div class="ri-img" style="background:var(--rme-card);display:flex;align-items:center;justify-content:center;font-size:24px">&#128225;</div><div class="ri-name">Multi-Location Programming</div><div class="ri-price">+$10</div></div>');
    } else {
      items.push('<div class="review-item" style="opacity:0.5"><div class="ri-img" style="background:var(--rme-card);display:flex;align-items:center;justify-content:center;font-size:24px">&#128225;</div><div class="ri-name">No Programming<small>Ships with factory defaults</small></div><div class="ri-price" style="color:var(--rme-muted)">-</div></div>');
    }

    if (items.length === 1) {
      items.push('<div class="empty-state">No add-ons selected. Just the base kit.</div>');
    }

    // Total (use price bar calculation)
    var total = radio.price;
    selectedAntennas.forEach(function(key) { var p = antennaList.find(function(x) { return x.key === key; }); if (p) total += p.price; });
    selectedBatteries.forEach(function(qty, key) { var p = powerList.find(function(x) { return x.key === key; }); if (p) total += p.price * qty; });
    selectedAccessories.forEach(function(key) { var a = accList.find(function(x) { return x.key === key; }); if (a) total += (a.price || 0); });
    if (programmingChoice === 'multi') total += 10;

    items.push('<div class="review-total"><div class="rt-label">Kit Total</div><div class="rt-price">$' + total + '</div></div>');

    list.innerHTML = items.join('');
  }

  // ── Fix review buttons for scroll mode ────────
  // renderReview() from base JS generates buttons with onclick="document.getElementById('btn-next').click()"
  // which doesn't exist in V2. Replace with kbsAddToCart().
  function fixReviewButtons() {
    const reviewList = document.getElementById('review-list');
    if (!reviewList) return;
    reviewList.querySelectorAll('button').forEach(function(btn) {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes('btn-next')) {
        btn.setAttribute('onclick', 'kbsAddToCart()');
      }
    });
  }

  // ── Override review Edit buttons for scroll mode ────────
  // Base JS reviewEditStep() calls goStep() which only works in step mode.
  // Override to use kbsEditSection() with the correct section name.
  window.reviewEditStep = function(stepName) {
    var map = { 'Antennas': 'antennas', 'Battery': 'battery', 'Accessories': 'accessories', 'Programming': 'programming' };
    var section = map[stepName];
    if (section && typeof kbsEditSection === 'function') {
      kbsEditSection(section);
    }
  };

  // ── Consult Links ─────────────────────────────
  function updateConsultLinks() {
    const url = window.location.origin + '/product/consult/';
    document.querySelectorAll('.kbs-consult-link').forEach(function(a) {
      a.href = url;
    });
  }

  // ── Browser back button handling ──────────────
  // Push history state on each section completion so Android back button
  // navigates within the flow instead of leaving the page
  function pushSectionState(sectionName) {
    history.pushState({ kbSection: sectionName }, '', '');
  }

  window.addEventListener('popstate', function(e) {
    if (!e.state || !e.state.kbSection) return;
    var section = e.state.kbSection;
    // Handle back from recommendation results
    if (section === 'interview-results') {
      kbsRetakeQuiz();
      return;
    }
    // Find the current active section
    var activeIdx = SECTIONS.findIndex(function(s) { return sectionState[s] === 'active'; });
    var targetIdx = SECTIONS.indexOf(section);
    if (targetIdx >= 0 && targetIdx < activeIdx) {
      kbsEditSection(section);
    }
  });

  // Hook into completeSection to push state
  const _origComplete = window.kbsCompleteSection;
  window.kbsCompleteSection = function(name) {
    pushSectionState(name);
    _origComplete(name);
  };

  // ── Focus management after section transitions ──
  function focusSection(name) {
    var el = document.getElementById('sec-' + name);
    if (!el) return;
    var heading = el.querySelector('.kb-section__header h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }

  // ── Modal scroll lock helpers ──────────────────
  function lockBodyScroll() { document.body.classList.add('kb-modal-open'); }
  function unlockBodyScroll() { document.body.classList.remove('kb-modal-open'); }

  // Patch modal open/close to lock scrolling
  var _origAdapterModalAdd = window.adapterModalAdd;
  var _origAdapterModalSkip = window.adapterModalSkip;
  var _origAdapterModalCancel = window.adapterModalCancel;
  if (typeof _origAdapterModalAdd === 'function') {
    window.adapterModalAdd = function() { unlockBodyScroll(); _origAdapterModalAdd(); };
    window.adapterModalSkip = function() { unlockBodyScroll(); _origAdapterModalSkip(); };
    window.adapterModalCancel = function() { unlockBodyScroll(); _origAdapterModalCancel(); };
  }

  // Watch for modal open class to auto-lock
  var modalObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.target.classList && m.target.classList.contains('modal-overlay')) {
        if (m.target.classList.contains('open')) lockBodyScroll();
        else unlockBodyScroll();
      }
    });
  });

  // ── Keyboard support for interactive cards ─────
  function addKeyboardSupport() {
    document.querySelectorAll('#rme-kit-builder-scroll .kbs-choice-card, #rme-kit-builder-scroll .kbs-iq-opt, #rme-kit-builder-scroll .result-card, #rme-kit-builder-scroll .radio-pick').forEach(function(el) {
      if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.getAttribute('role')) el.setAttribute('role', 'button');
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
  }

  // ── ARIA attributes for sections ───────────────
  function updateSectionAria() {
    SECTIONS.forEach(function(s) {
      var el = document.getElementById('sec-' + s);
      if (!el) return;
      var state = sectionState[s];
      el.setAttribute('aria-expanded', state === 'active' ? 'true' : 'false');
      if (state === 'locked') el.setAttribute('aria-disabled', 'true');
      else el.removeAttribute('aria-disabled');
    });
  }

  // Patch applyAllStates to include ARIA
  var _origApplyAllStates = applyAllStates;
  applyAllStates = function() {
    _origApplyAllStates();
    updateSectionAria();
  };

  // ── Product Page Mode ─────────────────────────
  // When loaded on a WC product page, skip interview/radio and start
  // with email → accessories flow for the pre-selected radio
  function initProductPageMode(hashRadioKey, hashCat) {
    var radioKey;
    if (hashRadioKey) {
      // Called from product page link (from=product in URL hash)
      radioKey = hashRadioKey;
    } else if (typeof rmeKitBuilderProduct !== 'undefined' && rmeKitBuilderProduct.productPageMode) {
      // Called when kit builder is embedded on a product page
      radioKey = rmeKitBuilderProduct.productRadioKey;
    } else {
      return false;
    }
    if (!radioKey) return false;

    // Detect which category this radio belongs to
    var detectedCat = hashCat || 'handheld';
    if (!hashCat) {
      if (typeof mobileRadioLineup !== 'undefined' && mobileRadioLineup.find(function(r) { return r.key === radioKey; })) detectedCat = 'mobile';
      else if (typeof hfRadioLineup !== 'undefined' && hfRadioLineup.find(function(r) { return r.key === radioKey; })) detectedCat = 'hf';
      else if (typeof scannerRadioLineup !== 'undefined' && scannerRadioLineup.find(function(r) { return r.key === radioKey; })) detectedCat = 'scanner';
    }

    kbsCurrentCategory = detectedCat;
    kbsAnswers['usage'] = [detectedCat === 'mobile' ? 'vehicle' : detectedCat];

    // Hide interview and radio sections
    document.getElementById('sec-interview').style.display = 'none';
    document.getElementById('sec-radio').style.display = 'none';

    // After email is completed, auto-select the radio and jump to accessories
    var _origEmailComplete = window.kbsCompleteSection;
    window.kbsCompleteSection = function(name) {
      if (name === 'email') {
        sectionState['email'] = 'complete';
        renderSummary('email');
        sectionState['interview'] = 'complete';
        sectionState['radio'] = 'complete';

        // Set up radio state
        if (typeof loadRadioProducts === 'function') loadRadioProducts(radioKey);
        selectedRadioKey = radioKey;
        kbsRadioSelected = true;
        kbsKitQty = 1;
        kbsSelectedMount = 'factory';
        var lineup = kbsGetRadioLineup();
        var radio = lineup.find(function(r) { return r.key === radioKey; });
        if (radio) BASE_PRICE = radio.price;
        selectedAntennas = new Set();
        selectedAddlAntennas = new Set();
        selectedBatteries = new Map();
        selectedAccessories = new Set();
        programmingChoice = 'standard';
        adapterSuppressed = false;

        // Adapt section headings
        if (detectedCat !== 'handheld') adaptSectionsForCategory(detectedCat);

        // Skip directly to mounting (vehicle/base) or antennas (others)
        var firstProductSection = (detectedCat === 'mobile' || detectedCat === 'base') ? 'mounting' : 'antennas';
        if (firstProductSection === 'mounting') {
          document.getElementById('sec-mounting').style.display = '';
          sectionState['mounting'] = 'active';
          renderMountingOptions();
        } else {
          sectionState[firstProductSection] = 'active';
          if (detectedCat === 'handheld') renderAllAntennas();
          else renderCategoryProducts('antennas', detectedCat, radioKey);
        }

        applyAllStates();
        updateScrollPriceBar();
        updateConsultLinks();
        scrollToSection(firstProductSection);
        return;
      }
      // For all other sections, use normal flow
      pushSectionState(name);
      _origComplete(name);
    };

    return true;
  }

  // ── URL State Encoding ────────────────────────
  // Encodes flow state into URL hash so progress survives page reloads,
  // can be shared, and can be embedded in follow-up emails.
  // PII fields (zip, notes, Brandmeister ID) are base64-encoded.

  function encodeB64(str) {
    try { return btoa(unescape(encodeURIComponent(str || ''))); } catch(e) { return ''; }
  }
  function decodeB64(str) {
    try { return decodeURIComponent(escape(atob(str || ''))); } catch(e) { return ''; }
  }

  function serializeFlowState() {
    var state = {};
    // Interview path & answers
    if (kbsGuidedMode) state.path = 'guided';
    if (kbsAnswers['budget']) state.budget = kbsAnswers['budget'];
    if (kbsAnswers['reach'] && kbsAnswers['reach'].length) state.reach = kbsAnswers['reach'].join(',');
    if (kbsAnswers['setup'] && kbsAnswers['setup'].length) state.setup = kbsAnswers['setup'].join(',');
    if (kbsAnswers['usage'] && kbsAnswers['usage'].length) state.usage = kbsAnswers['usage'].join(',');
    if (kbsAnswers['needs'] && kbsAnswers['needs'].length) state.needs = kbsAnswers['needs'].join(',');
    if (kbsAnswers['preferences'] && kbsAnswers['preferences'].length) state.prefs = kbsAnswers['preferences'].join(',');
    // Radio & category
    if (selectedRadioKey) state.radio = selectedRadioKey;
    if (kbsCurrentCategory && kbsCurrentCategory !== 'handheld') state.cat = kbsCurrentCategory;
    // Product selections
    if (selectedAntennas.size) state.ant = [...selectedAntennas].join(',');
    if (selectedAddlAntennas.size) state.ant2 = [...selectedAddlAntennas].join(',');
    if (selectedBatteries.size) {
      var batParts = [];
      selectedBatteries.forEach(function(qty, key) { batParts.push(key + ':' + qty); });
      state.bat = batParts.join(',');
    }
    if (selectedAccessories.size) state.acc = [...selectedAccessories].join(',');
    if (kbsSelectedMount !== 'factory') state.mount = kbsSelectedMount;
    // Programming
    if (programmingChoice && programmingChoice !== 'standard') state.prog = programmingChoice;
    // PII fields: base64 encode
    if (progZipPrimary) state.z1 = encodeB64(progZipPrimary);
    if (progZipsExtra && progZipsExtra.length) state.zx = encodeB64(progZipsExtra.join(','));
    if (progNotes) state.pn = encodeB64(progNotes);
    if (progBrandmeisterId) state.dmr = encodeB64(progBrandmeisterId);
    if (!progUseShipping) state.ship = '0';
    // Quantity
    if (kbsKitQty > 1) state.qty = kbsKitQty;
    // Current section (for resume position)
    var activeSection = SECTIONS.find(function(s) { return sectionState[s] === 'active'; });
    if (activeSection) state.sec = activeSection;
    return state;
  }

  function stateToHash(state) {
    var parts = [];
    Object.keys(state).forEach(function(k) {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(state[k]));
    });
    return parts.length ? '#' + parts.join('&') : '';
  }

  function hashToState(hash) {
    if (!hash || hash.length < 2) return null;
    var state = {};
    hash.substring(1).split('&').forEach(function(pair) {
      var parts = pair.split('=');
      if (parts.length === 2) state[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    });
    return Object.keys(state).length ? state : null;
  }

  // Update URL hash after each section completion (replaceState to avoid history spam)
  function updateUrlState() {
    var state = serializeFlowState();
    var hash = stateToHash(state);
    if (hash) {
      history.replaceState(history.state, '', window.location.pathname + hash);
    }
  }

  // Validate that a radio key still exists and is in stock
  function validateRadioKey(key) {
    var allLineups = [].concat(
      typeof radioLineup !== 'undefined' ? radioLineup : [],
      typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [],
      typeof hfRadioLineup !== 'undefined' ? hfRadioLineup : [],
      typeof scannerRadioLineup !== 'undefined' ? scannerRadioLineup : []
    );
    var radio = allLineups.find(function(r) { return r.key === key; });
    return radio && !radio.outOfStock;
  }

  // Validate that product keys still exist in their respective arrays
  function validateProductKeys(keys, productArrays) {
    var allProducts = [].concat.apply([], productArrays);
    return keys.filter(function(k) {
      return allProducts.some(function(p) { return p.key === k && !p.outOfStock; });
    });
  }

  // Restore flow state from URL hash
  function restoreFromHash() {
    var state = hashToState(window.location.hash);
    if (!state) return false;

    // Need at least a radio or some interview answers to restore
    var hasInterviewData = state.path || state.budget || state.reach || state.usage || state.needs || state.setup || state.prefs;
    if (!state.radio && !hasInterviewData) return false;

    // Validate the radio still exists (if one was selected)
    if (state.radio && !validateRadioKey(state.radio)) {
      console.warn('Kit Builder: saved radio "' + state.radio + '" no longer available');
      return false;
    }

    return state; // Return parsed state for the prompt to use
  }

  // Apply a validated state to restore the flow
  function applyRestoredState(state) {
    // Restore interview answers
    if (state.path === 'guided') kbsGuidedMode = true;
    if (state.budget) kbsAnswers['budget'] = state.budget;
    if (state.reach) kbsAnswers['reach'] = state.reach.split(',');
    if (state.setup) kbsAnswers['setup'] = state.setup.split(',');
    if (state.usage) kbsAnswers['usage'] = state.usage.split(',');
    if (state.needs) kbsAnswers['needs'] = state.needs.split(',');
    if (state.prefs) kbsAnswers['preferences'] = state.prefs.split(',');

    // Interview-only restore: no radio selected yet
    if (!state.radio) {
      // Complete email, set interview active
      sectionState['email'] = 'complete';
      sectionState['interview'] = 'active';
      applyAllStates();
      // Show interview UI and replay to current question
      document.getElementById('kbs-interview-choice').style.display = 'none';
      document.getElementById('kbs-interview-stack').style.display = '';
      // Rebuild question list and advance to first unanswered
      buildQuestionList();
      kbsStep = 0;
      for (var qi = 0; qi < kbsAllQuestions.length; qi++) {
        var qid = kbsAllQuestions[qi].id;
        if (kbsAnswers[qid] && (!Array.isArray(kbsAnswers[qid]) || kbsAnswers[qid].length > 0)) {
          kbsStep = qi + 1;
        } else {
          break;
        }
      }
      if (kbsStep >= kbsAllQuestions.length) {
        showScrollResults();
      } else {
        renderInterviewStack();
      }
      // Scroll to the interview section
      setTimeout(function() { scrollToSection('interview'); }, 500);
      return;
    }

    // Determine category
    var cat = state.cat || 'handheld';
    kbsCurrentCategory = cat;

    // Set up radio
    var radioKey = state.radio;
    if (typeof loadRadioProducts === 'function') loadRadioProducts(radioKey);
    selectedRadioKey = radioKey;
    kbsRadioSelected = true;
    var lineup = kbsGetRadioLineup();
    var radio = lineup.find(function(r) { return r.key === radioKey; });
    if (radio) BASE_PRICE = radio.price;

    // Restore product selections
    selectedAntennas = new Set();
    selectedAddlAntennas = new Set();
    selectedBatteries = new Map();
    selectedAccessories = new Set();

    if (state.ant) {
      state.ant.split(',').forEach(function(k) { if (k) selectedAntennas.add(k); });
    }
    if (state.ant2) {
      state.ant2.split(',').forEach(function(k) { if (k) selectedAddlAntennas.add(k); });
    }
    if (state.bat) {
      state.bat.split(',').forEach(function(part) {
        var kv = part.split(':');
        if (kv[0]) selectedBatteries.set(kv[0], parseInt(kv[1]) || 1);
      });
    }
    if (state.acc) {
      state.acc.split(',').forEach(function(k) { if (k) selectedAccessories.add(k); });
    }
    kbsSelectedMount = state.mount || 'factory';

    // Programming
    programmingChoice = state.prog || 'standard';
    if (state.z1) progZipPrimary = decodeB64(state.z1);
    if (state.zx) progZipsExtra = decodeB64(state.zx).split(',').filter(Boolean);
    if (state.pn) progNotes = decodeB64(state.pn);
    if (state.dmr) progBrandmeisterId = decodeB64(state.dmr);
    if (state.ship === '0') progUseShipping = false;

    // Quantity
    kbsKitQty = state.qty ? parseInt(state.qty) : 1;

    // Track categories for multi-kit flow
    var setupCats = state.setup ? state.setup.split(',') : (state.usage ? state.usage.split(',') : []);
    if (setupCats.length) {
      kbsAllCategories = CATEGORY_ORDER.filter(function(c) { return setupCats.includes(c); });
    }

    // Adapt sections for category
    if (cat !== 'handheld') adaptSectionsForCategory(cat);

    // Mark sections complete up to the resume point
    var resumeSection = state.sec || 'review';
    var resumeIdx = SECTIONS.indexOf(resumeSection);
    if (resumeIdx < 0) resumeIdx = SECTIONS.indexOf('review');

    // Complete all sections before the resume point
    sectionState['email'] = 'complete';
    sectionState['interview'] = 'complete';
    sectionState['radio'] = 'complete';

    for (var i = 3; i < resumeIdx; i++) {
      var sec = SECTIONS[i];
      if (sec === 'mounting' && cat !== 'mobile' && cat !== 'base') {
        document.getElementById('sec-mounting').style.display = 'none';
        sectionState['mounting'] = 'complete';
        continue;
      }
      sectionState[sec] = 'complete';
    }

    // Set resume section as active
    sectionState[resumeSection] = 'active';

    // Render summaries for all completed sections
    SECTIONS.forEach(function(s) {
      if (sectionState[s] === 'complete') renderSummary(s);
    });

    // Render the active section's content
    if (cat === 'handheld') {
      if (resumeSection === 'antennas') renderAllAntennas();
      if (resumeSection === 'battery') renderBatteryUpgrades();
      if (resumeSection === 'accessories') renderAccessories();
      if (resumeSection === 'programming') renderProgrammingWithCarryForward();
      if (resumeSection === 'review') { renderReview(); fixReviewButtons(); }
      if (resumeSection === 'quantity') { renderQuantityPicker(); enableCartBtn(); }
    } else {
      if (resumeSection === 'mounting') renderMountingOptions();
      else if (resumeSection === 'review') renderNonHandheldReview();
      else if (resumeSection === 'quantity') { renderQuantityPicker(); enableCartBtn(); }
      else renderCategoryProducts(resumeSection, cat, radioKey);
      if (resumeSection === 'programming') renderProgrammingWithCarryForward();
    }

    applyAllStates();
    renumberSections();
    updateScrollPriceBar();
    updateConsultLinks();

    // Scroll to show the previous completed step above the current active one
    setTimeout(function() {
      var resumeIdx = SECTIONS.indexOf(resumeSection);
      // Find the previous visible section
      var prevSection = null;
      for (var pi = resumeIdx - 1; pi >= 0; pi--) {
        var prevEl = document.getElementById('sec-' + SECTIONS[pi]);
        if (prevEl && prevEl.style.display !== 'none') {
          prevSection = SECTIONS[pi];
          break;
        }
      }
      if (prevSection && window.innerWidth >= 768) {
        var prevEl = document.getElementById('sec-' + prevSection);
        if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        scrollToSection(resumeSection);
      }
    }, 500);

    return true;
  }

  // Show resume prompt when URL hash has saved state
  function showResumePrompt(state) {
    var lineup = kbsGetRadioLineup();
    // Try all lineups to find the radio name
    var allLineups = [].concat(
      typeof radioLineup !== 'undefined' ? radioLineup : [],
      typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [],
      typeof hfRadioLineup !== 'undefined' ? hfRadioLineup : [],
      typeof scannerRadioLineup !== 'undefined' ? scannerRadioLineup : []
    );
    var radio = state.radio ? allLineups.find(function(r) { return r.key === state.radio; }) : null;
    var radioName = radio ? radio.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : (state.radio || '');
    var sectionLabel = state.sec ? state.sec.charAt(0).toUpperCase() + state.sec.slice(1) : 'Review';

    // Build summary line
    var summaryHtml = '';
    if (radioName) {
      summaryHtml = '<strong>' + radioName + '</strong>';
      if (selectedAntennas.size || selectedAccessories.size) {
        var antCount = selectedAntennas.size + selectedAddlAntennas.size;
        var accCount = selectedAccessories.size;
        var parts = [];
        if (antCount) parts.push(antCount + (antCount === 1 ? ' antenna' : ' antennas'));
        if (accCount) parts.push(accCount + (accCount === 1 ? ' accessory' : ' accessories'));
        summaryHtml += '<br><span style="color:#888;font-size:13px">' + parts.join(', ') + '</span>';
      }
    } else {
      // Interview in progress — show what we know
      var budgetLabels = { low: 'Economical', mid: 'Mid-range', high: 'The best of the best' };
      var usageLabels = { handheld: 'Handheld', vehicle: 'Vehicle / Mobile', base: 'Base Station', hf: 'HF (Long-Distance)', scanner: 'Scanner / SDR' };
      var parts = [];
      if (state.path === 'guided') parts.push('Guided quiz in progress');
      if (state.budget) parts.push('Budget: ' + (budgetLabels[state.budget] || state.budget));
      if (state.usage) parts.push('Type: ' + state.usage.split(',').map(function(u) { return usageLabels[u] || u; }).join(', '));
      summaryHtml = '<strong>' + (parts.length ? parts.join('<br>') : 'Quiz in progress') + '</strong>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'kbs-resume-overlay';
    overlay.innerHTML =
      '<div class="kbs-resume-modal">' +
        '<h3>Welcome Back</h3>' +
        '<p>You have saved progress:</p>' +
        '<div class="kbs-resume-summary" id="kbs-resume-yes" style="cursor:pointer">' +
          summaryHtml +
          '<div style="margin-top:10px;font-size:13px;color:#ccc;text-transform:uppercase;letter-spacing:1px">Pick Up Where I Left Off</div>' +
        '</div>' +
        '<div class="kbs-resume-actions">' +
          '<button class="kb-btn kb-btn--secondary" id="kbs-resume-no">Start Fresh</button>' +
        '</div>' +
      '</div>';

    var container = document.getElementById('rme-kit-builder-scroll') || document.body;
    container.appendChild(overlay);

    document.getElementById('kbs-resume-yes').addEventListener('click', function() {
      overlay.remove();
      applyRestoredState(state);
      // Scroll handled inside applyRestoredState
    });
    document.getElementById('kbs-resume-no').addEventListener('click', function() {
      overlay.remove();
      // Clear the hash and start fresh
      history.replaceState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Save session state to server for email resume links
  function saveSessionToServer() {
    var email = '';
    try { email = (typeof kitSession !== 'undefined' && kitSession.email) ? kitSession.email : ''; } catch(e) {}
    if (!email || typeof rmeKitBuilder === 'undefined') return;

    var activeSection = SECTIONS.find(function(s) { return sectionState[s] === 'active'; });
    var sessionData = {
      path: kbsGuidedMode ? 'guided' : 'direct',
      budget: kbsAnswers['budget'] || '',
      reach: kbsAnswers['reach'] || [],
      setup: kbsAnswers['setup'] || [],
      usage: kbsAnswers['usage'] || [],
      needs: kbsAnswers['needs'] || [],
      radio: selectedRadioKey,
      category: kbsCurrentCategory,
      antennas: [...selectedAntennas],
      addlAntennas: [...selectedAddlAntennas],
      batteries: Object.fromEntries ? Object.fromEntries(selectedBatteries) : {},
      accessories: [...selectedAccessories],
      mount: kbsSelectedMount,
      programming: programmingChoice,
      zipPrimary: progZipPrimary,
      zipsExtra: progZipsExtra,
      progNotes: progNotes,
      brandmeisterId: progBrandmeisterId,
      lastSection: activeSection || ''
    };

    fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_update_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        lastStep: activeSection || '',
        session: sessionData,
        nonce: rmeKitBuilder.nonce
      })
    }).catch(function() {});
  }

  // Hook into section completion to update URL and save session
  var _origCompleteForUrl = window.kbsCompleteSection;
  window.kbsCompleteSection = function(name) {
    _origCompleteForUrl(name);
    // Update URL after state changes settle
    setTimeout(function() { updateUrlState(); saveSessionToServer(); }, 100);
  };

  // Also update URL on radio selection and product changes
  var _origSelectRadio = window.kbsSelectRadio;
  window.kbsSelectRadio = function(key) {
    _origSelectRadio(key);
    setTimeout(updateUrlState, 100);
  };
  var _origSelectNH = window.kbsSelectNonHandheld;
  window.kbsSelectNonHandheld = function(radioKey, category) {
    _origSelectNH(radioKey, category);
    setTimeout(updateUrlState, 100);
  };

  // ── Init ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    // Reset any leftover state from base JS
    selectedRadioKey = '';
    applyAllStates();
    attachHeaderClicks();
    updateConsultLinks();
    addKeyboardSupport();

    // Check for saved state in URL hash
    var savedState = restoreFromHash();
    if (savedState && savedState.from === 'product' && savedState.radio) {
      // Product page link: skip resume prompt, init product page mode
      // directly with the radio from the URL hash
      initProductPageMode(savedState.radio, savedState.cat);
    } else if (savedState && !savedState.from) {
      // Genuine saved session: show resume prompt
      // Pre-apply state silently so the prompt can show radio name
      // (actual restoration happens on user confirmation)
      var tempLineups = [].concat(
        typeof radioLineup !== 'undefined' ? radioLineup : [],
        typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [],
        typeof hfRadioLineup !== 'undefined' ? hfRadioLineup : [],
        typeof scannerRadioLineup !== 'undefined' ? scannerRadioLineup : []
      );
      // Temporarily set selections so prompt summary is accurate
      if (savedState.ant) savedState.ant.split(',').forEach(function(k) { selectedAntennas.add(k); });
      if (savedState.ant2) savedState.ant2.split(',').forEach(function(k) { selectedAddlAntennas.add(k); });
      if (savedState.acc) savedState.acc.split(',').forEach(function(k) { selectedAccessories.add(k); });
      showResumePrompt(savedState);
      // Reset temp state (will be properly applied if user confirms)
      selectedAntennas = new Set();
      selectedAddlAntennas = new Set();
      selectedAccessories = new Set();
    }

    // Set initial history state so first back press stays in builder
    history.replaceState({ kbSection: 'email' }, '', window.location.pathname + window.location.hash);
    // Observe modals for scroll lock
    document.querySelectorAll('.modal-overlay').forEach(function(modal) {
      modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
    // Initialize product page mode if applicable
    initProductPageMode();
    // Renumber sections (mounting is hidden initially, so 1-2-3-4-5... not 1-2-3-5-6...)
    renumberSections();
  });

})();
