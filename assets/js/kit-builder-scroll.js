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
  const SECTIONS = ['email', 'interview', 'radio', 'antennas', 'battery', 'accessories', 'programming', 'review'];
  const sectionState = {};
  SECTIONS.forEach((s, i) => { sectionState[s] = i === 0 ? 'active' : 'locked'; });

  function applyAllStates() {
    SECTIONS.forEach(s => {
      const el = document.getElementById('sec-' + s);
      if (!el) return;
      el.classList.remove('kb-section--locked', 'kb-section--active', 'kb-section--complete');
      el.classList.add('kb-section--' + sectionState[s]);

      const summary = el.querySelector('.kb-section__summary');
      const content = el.querySelector('.kb-section__content');
      if (sectionState[s] === 'complete') {
        if (summary) summary.style.display = '';
        if (content) content.style.display = 'none';
      } else if (sectionState[s] === 'active') {
        if (summary) summary.style.display = 'none';
        if (content) { content.style.display = ''; }
      } else {
        if (summary) summary.style.display = 'none';
        if (content) content.style.display = 'none';
      }
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

    // Phase 1: Fade out current section (800ms)
    if (currentEl) currentEl.style.opacity = '0';

    setTimeout(function() {
      // Phase 2: Collapse current, show spinner on next
      sectionState[name] = 'complete';
      renderSummary(name);
      applyAllStates();

      if (nextEl) {
        nextEl.classList.remove('kb-section--locked');
        nextEl.classList.add('kb-section--loading');
        nextEl.style.opacity = '1';
        // Ensure content is hidden, spinner shows
        const content = nextEl.querySelector('.kb-section__content');
        if (content) content.style.display = 'none';
      }
      scrollToSection(next);

      // Phase 3: Render content in background while spinner plays (1200ms)
      setTimeout(function() {
        if (kbsCurrentCategory === 'handheld') {
          if (next === 'antennas') renderAllAntennas();
          if (next === 'battery') renderBatteryUpgrades();
          if (next === 'accessories') renderAccessories();
          if (next === 'programming') renderProgramming();
          if (next === 'review') { renderReview(); fixReviewButtons(); enableCartBtn(); }
        } else {
          renderCategoryProducts(next, kbsCurrentCategory, selectedRadioKey);
          if (next === 'programming' && typeof renderProgramming === 'function') renderProgramming();
          if (next === 'review') { renderReview(); fixReviewButtons(); enableCartBtn(); }
        }

        // Phase 4: Fade out spinner, fade in content (800ms)
        if (nextEl) nextEl.style.opacity = '0';

        setTimeout(function() {
          sectionState[next] = 'active';
          if (nextEl) nextEl.classList.remove('kb-section--loading');
          applyAllStates();
          // Fade in
          requestAnimationFrame(function() {
            if (nextEl) nextEl.style.opacity = '1';
          });
          updateScrollPriceBar();
          updateConsultLinks();
        }, 400);
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

  // ── Public: Edit a completed section ──────────
  window.kbsEditSection = function(name) {
    sectionState[name] = 'active';
    const idx = SECTIONS.indexOf(name);
    for (let i = idx + 1; i < SECTIONS.length; i++) {
      sectionState[SECTIONS[i]] = 'locked';
    }
    disableCartBtn();
    applyAllStates();
    scrollToSection(name);
    // Re-render if product section
    if (name === 'antennas') renderAllAntennas();
    if (name === 'battery') renderBatteryUpgrades();
    if (name === 'accessories') renderAccessories();
    if (name === 'programming') renderProgramming();
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
        const prefs = kbsInterviewTags.slice(0, 3);
        const parts = [];
        if (usage.length) parts.push(usage.map(u => u.charAt(0).toUpperCase() + u.slice(1)).join(', '));
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
    }
    html += `<span class="kbs-edit" onclick="kbsEditSection('${name}')">Edit</span>`;
    el.innerHTML = html;
  }

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
    if (typeof antennaUpgrades !== 'undefined') {
      antennaUpgrades.forEach(a => { if (selectedAntennas.has(a.key)) total += a.price; });
    }
    if (selectedAntennas.size > 0) total += 5; // BNC adapter
    if (typeof additionalAntennas !== 'undefined') {
      additionalAntennas.forEach(a => { if (selectedAddlAntennas.has(a.key)) total += a.price; });
    }
    if (typeof batteryUpgrades !== 'undefined') {
      batteryUpgrades.forEach(b => {
        const qty = selectedBatteries.get(b.key) || 0;
        total += b.price * qty;
      });
    }
    if (typeof accessories !== 'undefined') {
      accessories.forEach(a => { if (selectedAccessories.has(a.key)) total += (a.price || 0); });
    }
    if (programmingChoice === 'multi') total += 10;

    document.getElementById('kbs-total').textContent = '$' + total;

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
  window.kbsAddToCart = function() {
    if (typeof collectHandheldCartItems !== 'function') return;
    const items = collectHandheldCartItems();
    rmeKbAddToCart(items);
  };

  // ── Email Section ─────────────────────────────
  window.kbsSubmitEmail = function() {
    const email = document.getElementById('kbs-lead-email').value.trim();
    const name = document.getElementById('kbs-lead-name').value.trim();
    if (email && !email.includes('@')) return;
    // Save to session
    if (typeof kitSession !== 'undefined') {
      kitSession.email = email;
      kitSession.name = name;
    }
    if (email && typeof captureEmailAndStart === 'function') {
      // Use existing AJAX to save lead, but don't let it change phases
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
    if (typeof kitSession !== 'undefined') {
      kitSession.email = '';
      kitSession.name = '';
    }
    if (typeof initConsultationFeatures === 'function') initConsultationFeatures();
    kbsCompleteSection('email');
  };

  // ── Interview Choice (Help Me Choose vs I Know What I Want) ──
  window.kbsStartGuided = function() {
    document.getElementById('kbs-interview-choice').style.display = 'none';
    document.getElementById('kbs-interview-stack').style.display = '';
    renderInterviewStack();
  };

  window.kbsStartDirect = function() {
    // Show category multi-select before radio grid
    document.getElementById('kbs-interview-choice').style.display = 'none';
    document.getElementById('kbs-interview-stack').style.display = '';
    document.getElementById('kbs-interview-stack').innerHTML = `
      <div class="kbs-iq">
        <h3>What type of radio do you need?</h3>
        <p>Select all that apply.</p>
        <div class="kbs-iq-options">
          ${[
            { key: 'handheld', icon: ICO.handheld, label: 'Handheld', detail: 'Portable, carried on your person' },
            { key: 'vehicle', icon: ICO.vehicle, label: 'Vehicle / Mobile', detail: 'Mounted in a car, truck, or RV' },
            { key: 'base', icon: ICO.base, label: 'Base Station', detail: 'Fixed location with outdoor antenna' },
            { key: 'hf', icon: ICO.hf, label: 'HF (Long-Distance)', detail: 'Nationwide or worldwide' },
            { key: 'scanner', icon: ICO.scanner, label: 'Scanner / SDR', detail: 'Listen only, no license required' },
          ].map(o => '<div class="kbs-iq-opt" onclick="kbsDirectToggleCat(this,\\''+o.key+'\\')">' +
            (o.icon ? '<span style="margin-right:6px">'+o.icon+'</span>' : '') + o.label +
            '<span style="display:block;font-size:12px;color:#888;margin-top:2px">'+o.detail+'</span></div>'
          ).join('')}
        </div>
        <div style="margin-top:14px">
          <button class="kb-btn kb-btn--primary" id="kbs-direct-next" disabled onclick="kbsDirectProceed()">Next</button>
        </div>
      </div>
    `;
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
    // Complete interview, activate radio
    sectionState['interview'] = 'complete';
    renderSummary('interview');
    sectionState['radio'] = 'active';
    applyAllStates();
    renderScrollRadioGrid();
    scrollToSection('radio');
  };

  // ── Interview Section ─────────────────────────
  // Combined flow: needsQuestions (usage/distance/location/preferences) then interviewQuestions (radio-specific)
  window.kbsStep = 0;
  window.kbsAnswers = {};
  window.kbsInterviewTags = [];
  let kbsAllQuestions = []; // built dynamically based on conditional logic

  function buildQuestionList() {
    kbsAllQuestions = [];
    // Phase 1: Needs assessment questions (with condition checks)
    if (typeof needsQuestions !== 'undefined') {
      needsQuestions.forEach(q => {
        // Check condition
        if (q.condition && !q.condition(kbsAnswers)) return;
        // Resolve dynamic options
        const opts = q.getOptions ? q.getOptions(kbsAnswers) : q.options;
        kbsAllQuestions.push({ ...q, options: opts, phase: 'needs' });
      });
    }
    // Phase 2: Radio interview questions (handheld only)
    // Other categories (mobile, base, HF, scanner) skip interview and go straight to radio selection
    const detectedCategory = kbsDetectCategory();
    if (detectedCategory === 'handheld' && typeof interviewQuestions !== 'undefined') {
      interviewQuestions.forEach(q => {
        kbsAllQuestions.push({ ...q, phase: 'interview' });
      });
    }
  }

  // Determine which radio category the user needs based on their needs answers
  window.kbsDetectCategory = function() {
    const usage = kbsAnswers['usage'] || [];
    if (usage.includes('vehicle')) return 'mobile';
    if (usage.includes('base')) return 'base';
    if (usage.includes('hf')) return 'hf';
    if (usage.includes('scanner')) return 'scanner';
    // Check "reach" question for "notsure" users (multi-select)
    const reach = kbsAnswers['reach'] || [];
    if (reach.includes('far')) return 'hf';
    if (reach.includes('listen')) return 'scanner';
    if (reach.includes('local')) return 'handheld';
    return 'handheld'; // default (nearby or no answer)
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
          <div style="margin-top:14px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <button class="kb-btn kb-btn--primary" onclick="kbsNextQ()" ${!hasAnswer ? 'disabled' : ''}>
              ${i === kbsAllQuestions.length - 1 && kbsAllQuestions[i].phase === 'interview' ? 'See Results' : 'Next'}
            </button>
            <a href="#" class="kbs-consult-escape" target="_blank" class="kbs-consult-link">&#128222; Not sure? Book a consultation</a>
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
    kbsStep++;
    // Rebuild question list (conditionals may have changed)
    buildQuestionList();
    if (kbsStep >= kbsAllQuestions.length) {
      showScrollResults();
      return;
    }
    renderInterviewStack();
    setTimeout(() => {
      const qs = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
      if (qs.length) qs[qs.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  function showScrollResults() {
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
          <p style="font-size:13px;color:var(--rme-muted);margin-bottom:16px">${radio.pitch}</p>
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
      <div style="text-align:center;padding:20px 0">
        <h3 style="font-size:20px;color:var(--rme-gold);margin-bottom:6px">Our Recommendation</h3>
        <p style="color:var(--rme-muted);font-size:14px;margin-bottom:8px">Based on what you told us, here's what we'd pick for you.</p>
        <div class="result-cards">
          ${resultCard(top, topReasons, true)}
          ${resultCard(runner, runnerReasons, false)}
        </div>
        <div style="margin-top:16px">
          <button class="kb-btn kb-btn--secondary" onclick="kbsShowAllRadios()">See All Radios</button>
        </div>
      </div>
    `;

    document.getElementById('kbs-interview-stack').innerHTML = html;

    // Also populate the radio grid in radio section (hidden until "See All Radios")
    renderScrollRadioGrid();
  }

  // ── Radio Selection ───────────────────────────
  window.kbsSelectRadio = function(key) {
    // Use existing confirmRadioSelection to set up product state
    if (typeof loadRadioProducts === 'function') loadRadioProducts(key);
    selectedRadioKey = key;
    kbsRadioSelected = true;
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
    }

    // Complete radio section
    sectionState['radio'] = 'complete';
    renderSummary('radio');

    // Unlock antennas
    sectionState['antennas'] = 'active';
    renderAllAntennas();

    applyAllStates();
    scrollToSection('antennas');
    updateScrollPriceBar();
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
        <h4>${r.name.replace(' Essentials Kit', '').replace(' Mobile Radio Kit', '')}</h4>
        <div class="rp-price">$${r.price}</div>
        <div class="rp-tag">${r.tagline}</div>
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

    html += `
      <div style="text-align:center;padding:24px 0">
        <h3 style="font-size:20px;color:var(--rme-gold);margin-bottom:8px">${catName} Radios</h3>
        <p style="color:var(--rme-muted);font-size:14px;margin-bottom:4px">Based on your answers, you need a ${catName.toLowerCase()} setup.</p>
        <p style="color:#888;font-size:13px;margin-bottom:24px">The ${catName.toLowerCase()} kit builder includes specialized options for ${
          category === 'mobile' ? 'vehicle mounting, antenna installation, and power wiring' :
          category === 'base' ? 'antenna mounting, coax cabling, and power supply' :
          category === 'hf' ? 'HF antennas, coax, and power setup' :
          'scanner antennas and programming'
        }.</p>
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
                <p style="font-size:13px;color:var(--rme-muted);margin-bottom:16px">${r.pitch || ''}</p>
                <button class="rc-btn" onclick="event.stopPropagation();kbsSelectNonHandheld('${r.key}','${category}')">${i === 0 ? 'Build This Kit' : 'Choose This'}</button>
              </div>`;
          }).join('')}
        </div>
      </div>`;

    document.getElementById('kbs-interview-stack').innerHTML = html;
  }

  // Handle non-handheld radio selection: stay in V2, adapt sections
  window.kbsSelectNonHandheld = function(radioKey, category) {
    kbsCurrentCategory = category;

    // Find radio in the appropriate lineup
    const lineup = kbsGetRadioLineup();
    const radio = lineup.find(r => r.key === radioKey);
    if (!radio) return;

    selectedRadioKey = radioKey;
    kbsRadioSelected = true;
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
    sectionState['radio'] = 'complete';
    renderSummary('radio');

    // Adapt section labels for this category
    adaptSectionsForCategory(category);

    // Unlock first product section
    sectionState['antennas'] = 'active';
    renderCategoryProducts('antennas', category, radioKey);

    applyAllStates();
    scrollToSection('antennas');
    updateScrollPriceBar();
    updateConsultLinks();
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
    const h = headings[cat];
    if (!h) return;
    Object.keys(h).forEach(sec => {
      const el = document.querySelector('#sec-' + sec + ' .kb-section__header h2');
      if (el) el.textContent = h[sec];
    });
  }

  // Render category-specific product options in a section
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
      let products = [];

      if (isBase && typeof baseProducts !== 'undefined') {
        // Base: antenna path options
        const quick = baseProducts.antennaPath.quick;
        const perm = baseProducts.antennaPath.permanent;
        products.push(...quick.items.map(i => ({ ...i, bestUse: 'Best for: Quick Setup' })));
        products.push(...perm.antennas.map(i => ({ ...i, bestUse: 'Best for: Permanent Install' })));
      } else if (typeof mobileProducts !== 'undefined') {
        // Mobile: antenna mounts + antennas
        products.push(...(mobileProducts.antennaMounts || []).map(m => ({ ...m, bestUse: m.mountType === 'permanent' ? 'Best for: Permanent Mount' : 'Best for: Temporary Mount' })));
        products.push(...(mobileProducts.vehicleAntennas || []).map(a => ({ ...a, bestUse: a.recommended ? 'Best for: All-Around Performance' : '' })));
      }

      container.innerHTML = products.map(p => `
        <div class="opt-card ${selectedAntennas.has(p.key) ? 'selected' : ''}"
             onclick="toggleAntenna('${p.key}')">
          <div class="oc-check">${selectedAntennas.has(p.key) ? '\u2713' : ''}</div>
          <div class="oc-body">
            ${p.bestUse ? '<div class="oc-best-use">' + p.bestUse + '</div>' : ''}
            <div class="oc-name">${p.name}</div>
            <div class="oc-desc">${p.desc || ''}</div>
          </div>
          <div class="oc-price">+$${p.price}</div>
        </div>
      `).join('');
    }

    if (section === 'battery') {
      const container = document.getElementById('battery-options');
      if (!container || typeof mobileProducts === 'undefined') return;
      const powerOpts = mobileProducts.power || [];
      container.innerHTML = powerOpts.map(p => `
        <div class="opt-card ${selectedBatteries.has(p.key) ? 'selected' : ''}"
             onclick="toggleBattery('${p.key}')">
          <div class="oc-check">${selectedBatteries.has(p.key) ? '\u2713' : ''}</div>
          <div class="oc-body">
            <div class="oc-name">${p.name}</div>
            <div class="oc-desc">${p.desc || ''}</div>
          </div>
          <div class="oc-price">+$${p.price}</div>
        </div>
      `).join('') || '<p style="color:var(--rme-muted)">Standard power setup included.</p>';
    }

    if (section === 'accessories') {
      const container = document.getElementById('accessory-options');
      if (!container || typeof mobileProducts === 'undefined') return;
      const acc = (mobileProducts.accessories || []).filter(a => !a.compatRadios || a.compatRadios.includes(radioKey));
      container.innerHTML = acc.map(a => `
        <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
             onclick="toggleAccessory('${a.key}')">
          <div class="oc-check">${selectedAccessories.has(a.key) ? '\u2713' : ''}</div>
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
        // HF uses mobile power options
        renderMobileBaseProducts('battery', 'hf', radioKey);
        return;
      }
      const acc = (hfProducts.accessories || []).filter(a => !a.radioMatch || a.radioMatch === radioKey);
      container.innerHTML = acc.map(a => `
        <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
             onclick="toggleAccessory('${a.key}')">
          <div class="oc-check">${selectedAccessories.has(a.key) ? '\u2713' : ''}</div>
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
          <div class="oc-body">
            <div class="oc-name">${a.name}</div>
            <div class="oc-desc">${a.desc || ''}</div>
          </div>
          <div class="oc-price">+$${a.price}</div>
        </div>
      `).join('');
    }
    if (section === 'battery' || section === 'accessories') {
      const container = document.getElementById(section === 'battery' ? 'battery-options' : 'accessory-options');
      if (!container) return;
      const acc = (scannerProducts.accessories || []).filter(a => !a.compatRadios || a.compatRadios.includes(radioKey));
      container.innerHTML = acc.map(a => `
        <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
             onclick="toggleAccessory('${a.key}')">
          <div class="oc-check">${selectedAccessories.has(a.key) ? '\u2713' : ''}</div>
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

  // ── Init ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    // Reset any leftover state from base JS
    selectedRadioKey = '';
    applyAllStates();
    attachHeaderClicks();
    updateConsultLinks();
  });

})();
