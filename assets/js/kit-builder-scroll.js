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
        if (content) { content.style.maxHeight = '0'; content.style.opacity = '0'; content.style.paddingBottom = '0'; }
      } else if (sectionState[s] === 'active') {
        if (summary) summary.style.display = 'none';
        if (content) { content.style.maxHeight = ''; content.style.opacity = ''; content.style.paddingBottom = ''; }
      } else {
        if (summary) summary.style.display = 'none';
      }
    });
  }

  function scrollToSection(name) {
    const el = document.getElementById('sec-' + name);
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }, 200);
  }

  // ── Public: Complete a section ─────────────────
  window.kbsCompleteSection = function(name) {
    sectionState[name] = 'complete';
    renderSummary(name);
    const nextIdx = SECTIONS.indexOf(name) + 1;
    if (nextIdx < SECTIONS.length) {
      const next = SECTIONS[nextIdx];
      sectionState[next] = 'active';
      // Trigger render for product sections
      if (next === 'antennas') renderAllAntennas();
      if (next === 'battery') renderBatteryUpgrades();
      if (next === 'accessories') renderAccessories();
      if (next === 'programming') renderProgramming();
      if (next === 'review') { renderReview(); enableCartBtn(); }
    }
    applyAllStates();
    if (nextIdx < SECTIONS.length) scrollToSection(SECTIONS[nextIdx]);
    updateScrollPriceBar();
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
        const r = radioLineup.find(x => x.key === selectedRadioKey);
        if (r) html = `<span class="kbs-sel">${r.name.replace(' Essentials Kit', '')} - $${r.price}</span>`;
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

    const r = radioLineup.find(x => x.key === selectedRadioKey);
    document.getElementById('kbs-radio-name').textContent = r ? r.name.replace(' Essentials Kit', '') : '';

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
    // Skip interview, go straight to radio grid
    document.getElementById('kbs-interview-choice').style.display = 'none';
    sectionState['interview'] = 'complete';
    renderSummary('interview');
    sectionState['radio'] = 'active';
    applyAllStates();
    renderScrollRadioGrid();
    scrollToSection('radio');
  };

  // ── Interview Section ─────────────────────────
  // Combined flow: needsQuestions (usage/distance/location/preferences) then interviewQuestions (radio-specific)
  let kbsStep = 0;
  let kbsAnswers = {};
  let kbsInterviewTags = [];
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
    // Phase 2: Radio interview questions
    if (typeof interviewQuestions !== 'undefined') {
      interviewQuestions.forEach(q => {
        kbsAllQuestions.push({ ...q, phase: 'interview' });
      });
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
          <div style="margin-top:14px">
            <button class="kb-btn kb-btn--primary" onclick="kbsNextQ()" ${!hasAnswer ? 'disabled' : ''}>
              ${i === kbsAllQuestions.length - 1 ? 'See Results' : 'Next'}
            </button>
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
      if (qs.length) qs[qs.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  function showScrollResults() {
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
        ? '<ul style="list-style:none;padding:0;margin:0">' + reasons.map(r => '<li style="padding:3px 0">&#9989; ' + r + '</li>').join('') + '</ul>'
        : '<ul>' + radio.features.map(f => '<li>&#10003; ' + f + '</li>').join('') + '</ul>';
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
    grid.innerHTML = radioLineup.map(r => `
      <div class="radio-pick" onclick="kbsSelectRadio('${r.key}')">
        <div class="rp-img"><img src="${r.img}" alt="${r.name}"></div>
        <h4>${r.name.replace(' Essentials Kit', '')}</h4>
        <div class="rp-price">$${r.price}</div>
        <div class="rp-tag">${r.tagline}</div>
      </div>
    `).join('');
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

  // ── Init ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    // Reset any leftover state from base JS
    selectedRadioKey = '';
    applyAllStates();
    attachHeaderClicks();
  });

})();
