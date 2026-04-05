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

  // Track whether a radio has been selected in THIS flow (not leftover from base JS)
  let kbsRadioSelected = false;

  // ── Section State Machine ──────────────────────
  const SECTIONS = ['email', 'interview', 'radio', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'];
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
    // Delay scroll to let section transition animations begin first
    setTimeout(() => {
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
      if (next === 'quantity') { renderQuantityPicker(); enableCartBtn(); return; }
      if (kbsCurrentCategory === 'handheld') {
        if (next === 'antennas') renderAllAntennas();
        if (next === 'battery') renderBatteryUpgrades();
        if (next === 'accessories') renderAccessories();
        if (next === 'programming') renderProgramming();
        if (next === 'review') { renderReview(); fixReviewButtons(); }
      } else {
        renderCategoryProducts(next, kbsCurrentCategory, selectedRadioKey);
        if (next === 'programming' && typeof renderProgramming === 'function') renderProgramming();
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
        sectionState[next] = 'active';
        if (nextEl) nextEl.classList.remove('kb-section--loading');
        applyAllStates();
        updateScrollPriceBar();
        updateConsultLinks();
        addKeyboardSupport();
        // Move focus to new section for screen readers
        setTimeout(function() { focusSection(next); }, 200);
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
      sectionState[name] = 'active';
      const idx = SECTIONS.indexOf(name);
      for (let i = idx + 1; i < SECTIONS.length; i++) {
        sectionState[SECTIONS[i]] = 'locked';
      }
      disableCartBtn();
      applyAllStates();
      scrollToSection(name);
      // Re-render if product section (category-aware)
      if (kbsCurrentCategory === 'handheld') {
        if (name === 'antennas') renderAllAntennas();
        if (name === 'battery') renderBatteryUpgrades();
        if (name === 'accessories') renderAccessories();
        if (name === 'programming') renderProgramming();
      } else {
        if (name === 'antennas' || name === 'battery' || name === 'accessories') {
          renderCategoryProducts(name, kbsCurrentCategory, selectedRadioKey);
        }
        if (name === 'programming') renderProgramming();
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
    return total;
  }

  window.kbsAdjustQty = function(delta) {
    kbsKitQty = Math.max(1, Math.min(20, kbsKitQty + delta));
    renderQuantityPicker();
  };

  // ── Price Bar ─────────────────────────────────
  function updateScrollPriceBar() {
    const bar = document.getElementById('kb-scroll-price-bar');
    if (!bar) return;
    if (!kbsRadioSelected) { bar.style.display = 'none'; return; }
    bar.style.display = '';

    const lineup = kbsGetRadioLineup();
    const r = lineup.find(x => x.key === selectedRadioKey) || radioLineup.find(x => x.key === selectedRadioKey);
    document.getElementById('kbs-radio-name').textContent = r ? r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : '';

    // Calculate total using existing calcTotal if available, otherwise manual
    let total = r ? r.price : 0;
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

    // Apply quantity and volume discount
    var tier = (kbsKitQty >= 2 && typeof getVolumeTier === 'function') ? getVolumeTier(kbsKitQty) : null;
    var perKitDiscount = tier ? Math.round(BASE_PRICE * tier.pct / 100) : 0;
    var grandTotal = (total - perKitDiscount) * kbsKitQty;

    var totalEl = document.getElementById('kbs-total');
    if (kbsKitQty > 1) {
      totalEl.textContent = '$' + grandTotal;
      // Show qty badge
      var label = document.getElementById('kbs-radio-name');
      if (label) {
        var rName = r ? r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : '';
        label.textContent = rName + ' x' + kbsKitQty + (tier ? ' (' + tier.pct + '% off)' : '');
      }
    } else {
      totalEl.textContent = '$' + total;
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

  window.kbsAddToCart = function() {
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
    var kitName = radio ? radio.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '') : 'Kit';
    if (kbsKitQty > 1) kitName += ' x' + kbsKitQty;
    rmeKbAddToCart(items, kitName);
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
      { key: 'scanner', icon: ICO.scanner, label: 'Scanner / SDR', detail: 'Listen only, no license required' },
    ];
    var catHtml = catOpts.map(function(o) {
      return '<div class="kbs-iq-opt" onclick="kbsDirectToggleCat(this,&quot;' + o.key + '&quot;)">' +
        (o.icon ? '<span style="margin-right:6px">' + o.icon + '</span>' : '') + o.label +
        '<span style="display:block;font-size:12px;color:#888;margin-top:2px">' + o.detail + '</span></div>';
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
  };

  window.kbsDirectProceed = function() {
    // Set usage answers so category detection works
    kbsAnswers['usage'] = kbsDirectCategories;
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
      { key: 'hf', icon: ICO.hf, label: 'HF (Long-Distance)', detail: 'Nationwide or worldwide, amateur license required', tags: [] },
      { key: 'scanner', icon: ICO.scanner, label: 'Scanner / SDR', detail: 'Listen only, no license required', tags: [] },
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

  // Determine which radio category the user needs based on their needs answers
  window.kbsDetectCategory = function() {
    // Direct path uses 'usage' from category multi-select
    const usage = kbsAnswers['usage'] || [];
    if (usage.length > 0) {
      if (usage.includes('vehicle')) return 'mobile';
      if (usage.includes('base')) return 'base';
      if (usage.includes('hf')) return 'hf';
      if (usage.includes('scanner')) return 'scanner';
      return 'handheld';
    }
    // Guided path uses 'setup' from the new radio type question
    const setup = kbsAnswers['setup'] || [];
    if (setup.length > 0) {
      // Priority: vehicle > base > hf > scanner > handheld
      if (setup.includes('vehicle')) return 'mobile';
      if (setup.includes('base')) return 'base';
      if (setup.includes('hf')) return 'hf';
      if (setup.includes('scanner')) return 'scanner';
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
                ${o.icon ? '<span style="margin-right:6px">' + o.icon + '</span>' : ''}${o.label}
                ${o.detail ? '<span style="display:block;font-size:12px;color:#888;margin-top:2px">' + o.detail + '</span>' : ''}
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
            <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">&#128222; Not sure? Book a consultation</a>
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
      if (idx >= 0) kbsAnswers[qId].splice(idx, 1);
      else kbsAnswers[qId].push(optKey);
    } else {
      kbsAnswers[qId] = optKey;
    }
    renderInterviewStack();
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
        return;
      }
      renderInterviewStack();
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

  function showScrollResults() {
    // Push history state so Android back returns to quiz instead of leaving
    pushSectionState('interview-results');
    const category = kbsDetectCategory();
    const lineup = kbsGetRadioLineup();

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
    let html = '';
    // Answered questions from all phases
    kbsAllQuestions.forEach(q => {
      const answer = kbsAnswers[q.id];
      if (answer === undefined || answer === null) return;
      const opts = q.options || [];
      const selectedOpts = opts.filter(o => {
        if (q.multi) return (answer || []).includes(o.key);
        return answer === o.key;
      });
      const ansText = selectedOpts.map(o => o.label).join(', ');
      html += `<div class="kbs-iq kbs-iq--answered">
        <h3>${q.question} <span class="kbs-iq-answer">${ansText}</span></h3>
      </div>`;
    });

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
          <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">&#128222; Not sure? Book a consultation</a>
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

    // Use animated transition for radio → antennas
    // Pre-render antennas content
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
    grid.innerHTML = lineup.filter(r => !r.outOfStock).map(r => `
      <div class="radio-pick" onclick="${category === 'handheld' ? "kbsSelectRadio('" + r.key + "')" : "kbsSelectNonHandheld('" + r.key + "','" + category + "')"}">
        <div class="rp-img"><img src="${r.img}" alt="${r.name}"></div>
        <div class="rp-info">
          <h4>${r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '')}</h4>
          <div class="rp-price">$${r.price}</div>
          <div class="rp-tag">${r.tagline}</div>
        </div>
      </div>
    `).join('');
  }

  // Non-handheld categories: show recommendation with link to V1's specialized flow
  function showNonHandheldResult(category, lineup) {
    const catNames = { mobile: 'Vehicle / Mobile', base: 'Base Station', hf: 'HF (Long-Distance)', scanner: 'Scanner' };
    const catName = catNames[category] || category;
    const available = lineup.filter(r => !r.outOfStock);

    let html = '';
    // Show answered questions
    kbsAllQuestions.forEach(q => {
      const answer = kbsAnswers[q.id];
      if (answer === undefined || answer === null) return;
      const opts = q.options || [];
      const selectedOpts = opts.filter(o => {
        if (q.multi) return (answer || []).includes(o.key);
        return answer === o.key;
      });
      const ansText = selectedOpts.map(o => o.label).join(', ');
      html += `<div class="kbs-iq kbs-iq--answered">
        <h3>${q.question} <span class="kbs-iq-answer">${ansText}</span></h3>
      </div>`;
    });

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
            return `
              <div class="result-card ${i === 0 ? 'recommended' : ''}" onclick="kbsSelectNonHandheld('${r.key}','${category}')">
                ${i === 0 ? '<div class="result-badge">Recommended</div>' : ''}
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
          <a href="#" class="kbs-consult-escape kbs-consult-link" target="_blank">&#128222; Not sure? Book a consultation</a>
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

    // Find current active section to fade out
    const activeSection = SECTIONS.find(s => sectionState[s] === 'active');
    const activeEl = activeSection ? document.getElementById('sec-' + activeSection) : null;
    const antennasEl = document.getElementById('sec-antennas');

    // Phase 1: Fade out current section
    if (activeEl) activeEl.classList.add('kb-section--fading');

    setTimeout(function() {
      sectionState['radio'] = 'complete';
      renderSummary('radio');
      applyAllStates();

      // Show loading spinner on antennas
      if (antennasEl) {
        antennasEl.classList.remove('kb-section--locked');
        antennasEl.classList.add('kb-section--loading');
      }
      scrollToSection('antennas');

      // Phase 2: Render content behind spinner, then reveal
      setTimeout(function() {
        renderCategoryProducts('antennas', category, radioKey);
        sectionState['antennas'] = 'active';
        if (antennasEl) antennasEl.classList.remove('kb-section--loading');
        applyAllStates();
        updateScrollPriceBar();
        updateConsultLinks();
      }, 1200);
    }, 800);
  };

  let kbsCurrentCategory = 'handheld';

  // Adapt section headings and descriptions for the selected category
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
  }

  // ── Shared card renderer ───────────────────────
  function renderOneCard(p, badge, isSelected) {
    return '<div class="opt-card ' + (isSelected ? 'selected' : '') + '"' +
      ' onclick="toggleAntenna(\'' + p.key + '\')">' +
      '<div class="oc-check">' + (isSelected ? '\u2713' : '') + '</div>' +
      '<div class="oc-img">' + (p.img ? '<img src="' + p.img + '" alt="' + p.name + '">' : '<div class="oc-img--placeholder-icon">A</div>') + '</div>' +
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
          renderOneCard(m, m.mountType === 'permanent' ? 'Permanent' : 'Temporary / Removable', selectedAntennas.has(m.key))
        ).join('');

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
            '<div class="oc-img"><div class="oc-img--placeholder-icon">P</div></div>' +
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
          '<div class="oc-img">' + (p.img ? '<img src="' + p.img + '" alt="' + p.name + '">' : '<div class="oc-img--placeholder-icon">A</div>') + '</div>' +
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
          <div class="oc-img">${a.img ? '<img src="' + a.img + '" alt="' + a.name + '">' : '<div class="oc-img--placeholder-icon">A</div>'}</div>
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
          <div class="oc-img">${a.img ? '<img src="' + a.img + '" alt="' + a.name + '">' : '<div class="oc-img--placeholder-icon">A</div>'}</div>
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
          <div class="oc-img">${a.img ? '<img src="' + a.img + '" alt="' + a.name + '">' : '<div class="oc-img--placeholder-icon">A</div>'}</div>
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
          <div class="oc-img">${a.img ? '<img src="' + a.img + '" alt="' + a.name + '">' : '<div class="oc-img--placeholder-icon">A</div>'}</div>
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
          <div class="oc-img">${a.img ? '<img src="' + a.img + '" alt="' + a.name + '">' : '<div class="oc-img--placeholder-icon">A</div>'}</div>
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
      return;
    }
    _origToggleAntenna(key);
  };

  const _origToggleBattery = window.toggleBattery;
  if (_origToggleBattery) {
    window.toggleBattery = function(key) {
      if (window._rmeScrollMode && kbsCurrentCategory !== 'handheld') {
        if (selectedBatteries.has(key)) selectedBatteries.delete(key);
        else selectedBatteries.set(key, 1);
        renderCategoryProducts('battery', kbsCurrentCategory, selectedRadioKey);
        updateScrollPriceBar();
        return;
      }
      _origToggleBattery(key);
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
        return;
      }
      _origToggleAccessory(key);
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

  // ── Consult Links ─────────────────────────────
  function updateConsultLinks() {
    const url = typeof getCalendlyUrl === 'function' ? getCalendlyUrl() : 'https://calendly.com/radiomadeeasy/radio-consultation';
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

  // ── Init ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    // Reset any leftover state from base JS
    selectedRadioKey = '';
    applyAllStates();
    attachHeaderClicks();
    updateConsultLinks();
    addKeyboardSupport();
    // Set initial history state so first back press stays in builder
    history.replaceState({ kbSection: 'email' }, '', '');
    // Observe modals for scroll lock
    document.querySelectorAll('.modal-overlay').forEach(function(modal) {
      modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
  });

})();
