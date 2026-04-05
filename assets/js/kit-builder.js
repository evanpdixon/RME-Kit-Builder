// RME Kit Builder -WordPress Plugin JS
// Generated from kit-builder-demo.html
'use strict';

// Config from WordPress (wp_localize_script) or localStorage fallback for standalone mode
const _adminConfig = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.config)
  ? rmeKitBuilder.config
  : (() => { try { const raw = localStorage.getItem('rme-kit-builder-config'); return raw ? JSON.parse(raw) : null; } catch { return null; } })();


const S = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.uploadsUrl) ? rmeKitBuilder.uploadsUrl : '/wp-content/uploads/';

// ── SVG Icon Library (24×24 line icons, inherits currentColor) ──
const _s = (d, vb='0 0 24 24') => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICO = {
  handheld:   _s('<rect x="7" y="6" width="10" height="16" rx="2"/><path d="M9 6V2h2v4"/><line x1="10" y1="10" x2="14" y2="10"/><circle cx="12" cy="16" r="1.5"/><rect x="10" y="12" width="4" height="2" rx="0.5"/>'),
  vehicle:    _s('<path d="M7 10l2-4h6l2 4"/><rect x="3" y="10" width="18" height="7" rx="2"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/>'),
  base:       _s('<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><line x1="12" y1="3" x2="12" y2="0.5"/>'),
  hf:         _s('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2"/>'),
  scanner:    _s('<rect x="3" y="4" width="18" height="14" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="11" x2="13" y2="11"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="18" x2="12" y2="21"/>'),
  notsure:    _s('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none"/>'),
  nopref:     _s('<path d="M5 12h14"/><path d="M12 5l-7 7 7 7"/>'),
  compass:    _s('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="currentColor" stroke="none"/>'),
  browse:     _s('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  shortrange: _s('<circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/>'),
  midrange:   _s('<circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/>'),
  longrange:  _s('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="11" stroke-dasharray="2 2"/>'),
  extreme:    _s('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10"/>'),
  onfoot:     _s('<circle cx="12" cy="5" r="2"/><path d="M10 22l2-7 2 7"/><path d="M8 12l4-3 4 3"/><path d="M12 9v5"/>'),
  invehicle:  _s('<path d="M7 10l2-4h6l2 4"/><rect x="3" y="10" width="18" height="7" rx="2"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/>'),
  athome:     _s('<path d="M3 12l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  offgrid:    _s('<path d="M12 2L5 10h14z"/><path d="M5 10v10h14V10"/><line x1="12" y1="15" x2="12" y2="18"/>'),
  monitoring: _s('<path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>'),
  lock:       _s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'),
  droplet:    _s('<path d="M12 2.7S5 9.5 5 14a7 7 0 0014 0C19 9.5 12 2.7 12 2.7z"/>'),
  thumbsup:   _s('<path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/><path d="M7 11V4a2 2 0 012-2h0a2 2 0 012 2v5h4.5a2 2 0 012 1.9l-.5 7a2 2 0 01-2 2.1H7"/>'),
  signal:     _s('<rect x="2" y="16" width="3" height="6" rx="1"/><rect x="7" y="12" width="3" height="10" rx="1"/><rect x="12" y="8" width="3" height="14" rx="1"/><rect x="17" y="4" width="3" height="18" rx="1"/>'),
  dollar:     _s('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>'),
  crossband:  _s('<line x1="5" y1="8" x2="19" y2="8"/><polyline points="15 4 19 8 15 12"/><line x1="19" y1="16" x2="5" y2="16"/><polyline points="9 12 5 16 9 20"/>'),
  budget:     _s('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>'),
  midprice:   _s('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>'),
  premium:    _s('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>'),
  town:       _s('<path d="M3 21h18"/><rect x="3" y="7" width="7" height="14"/><rect x="14" y="3" width="7" height="18"/><line x1="5" y1="10" x2="8" y2="10"/><line x1="5" y1="13" x2="8" y2="13"/><line x1="16" y1="6" x2="19" y2="6"/><line x1="16" y1="9" x2="19" y2="9"/><line x1="16" y1="12" x2="19" y2="12"/>'),
  outdoor:    _s('<path d="M2 22l7-12 5 6 3-4 5 10"/><circle cx="17" cy="6" r="2"/>'),
  water:      _s('<path d="M2 12S5 6 8 6c4 0 4 6 8 6s6-6 6-6"/><path d="M2 18S5 12 8 12c4 0 4 6 8 6s6-6 6-6"/>'),
  work:       _s('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>'),
  emergency:  _s('<path d="M12 9v4"/><circle cx="12" cy="16" r=".5" fill="currentColor" stroke="none"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>'),
  tag:        _s('<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/>'),
  channels:   _s('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>'),
  plane:      _s('<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5L2 10l7 3.5L6 17H3l-1 2 4-1 1-4 3.5 3.5 7 2c.4-.2.6-.6.5-1.1z"/>'),
  bluetooth:  _s('<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>'),
  grow:       _s('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
  cloud:      _s('<path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/><path d="M8 17h.01"/><path d="M8 21h.01"/><path d="M12 19h.01"/><path d="M12 23h.01"/><path d="M16 17h.01"/><path d="M16 21h.01"/>'),
  compact:    _s('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 7h12"/><path d="M6 17h12"/><line x1="10" y1="19" x2="14" y2="19"/>'),
  compat:     _s('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>'),
};

// ══════════════════════════════════════════════════════
// ── DEBUG PANEL ──
// ══════════════════════════════════════════════════════

const _debugLog = [];
function rmeDebugCopy() {
  const state = _debugGetState();
  const text = '=== Kit Builder Debug ===\n' + state + '\n\n=== Log ===\n' + _debugLog.map(e => `${e.ts} ${e.action} ${e.detail || ''}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    document.querySelectorAll('#rme-kb-debug [onclick*="rmeDebugCopy"]').forEach(btn => {
      const orig = btn.textContent;
      btn.textContent = '✓ COPIED!';
      btn.style.background = '#2a4a2a';
      btn.style.color = '#4caf50';
      btn.style.transition = 'all 0.2s';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.style.color = ''; }, 1500);
    });
  });
}
function _debugGetState() {
  const phases = ['needs-phase','selector-phase','wizard-phase','mobile-phase','base-phase','hf-phase'];
  const visible = phases.filter(id => { const el = document.getElementById(id); return el && el.style.display !== 'none'; });
  const kits = kitSession.kits.length;
  const idx = kitSession.currentKitIndex;
  const cat = kitSession.kits[idx] ? kitSession.kits[idx].category : 'none';
  const status = kitSession.kits[idx] ? kitSession.kits[idx].status : 'none';
  const radioKey = kitSession.kits[idx] ? kitSession.kits[idx].radioKey : selectedRadioKey;
  const allRadios = [...(typeof radioLineup !== 'undefined' ? radioLineup : []), ...(typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : []), ...(typeof hfRadioLineup !== 'undefined' ? hfRadioLineup : [])];
  const radioName = allRadios.find(r => r.key === radioKey);
  return `Phase: ${visible.join(', ') || 'none'} | Kits: ${kits} | Current: #${idx} (${cat}) ${status} | Radio: ${radioName ? radioName.name : radioKey || 'none'} | Prefs: ${kitSession.preferences.join(', ') || 'none'}`;
}
function _debugUpdateState() {
  const el = document.getElementById('rme-kb-debug-state');
  if (el) el.textContent = _debugGetState();
}
function rmeDebug(action, detail) {
  const ts = new Date().toLocaleTimeString();
  _debugLog.push({ ts, action, detail });
  const panel = document.getElementById('rme-kb-debug');
  const content = document.getElementById('rme-kb-debug-content');
  if (panel && content) {
    panel.style.display = 'block';
    content.innerHTML = _debugLog.map(e =>
      `<div><span style="color:#666">${e.ts}</span> <span style="color:#4caf50">${e.action}</span> ${e.detail || ''}</div>`
    ).join('');
    content.scrollTop = content.scrollHeight;
  }
  _debugUpdateState();
}

// ══════════════════════════════════════════════════════
// ── NEEDS ASSESSMENT + MULTI-KIT SESSION ──
// ══════════════════════════════════════════════════════

// Session state
let kitSession = {
  needsAnswers: {},
  categories: [],   // e.g. [{type:'handheld',qty:3},{type:'mobile',qty:2},{type:'base',qty:1},{type:'hf',qty:1}]
  kits: [],          // built kits with selections
  currentKitIndex: 0,
  preferences: [],   // carry-forward from needs assessment (e.g. 'digital','waterproof')
  email: '',
  name: ''
};

// ── Email Capture & Lead Tracking ──────────────────────────────────────────

function captureEmailAndStart() {
  const email = document.getElementById('kb-lead-email').value.trim();
  const name = document.getElementById('kb-lead-name').value.trim();

  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    document.getElementById('kb-lead-email').style.borderColor = '#d4504c';
    document.getElementById('kb-lead-email').focus();
    return;
  }

  kitSession.email = email;
  kitSession.name = name;

  if (email) {
    fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_capture_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, nonce: rmeKitBuilder.nonce })
    }).catch(() => {});
  }

  document.getElementById('email-capture-phase').style.display = 'none';
  document.getElementById('needs-phase').style.display = '';
  initConsultationFeatures();
}

function skipEmailCapture() {
  kitSession.email = '';
  kitSession.name = '';
  document.getElementById('email-capture-phase').style.display = 'none';
  document.getElementById('needs-phase').style.display = '';
  initConsultationFeatures();
}

function trackSessionProgress(stepName) {
  if (!kitSession.email) return;
  fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_update_session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: kitSession.email,
      lastStep: stepName,
      session: { categories: kitSession.categories, currentKitIndex: kitSession.currentKitIndex },
      nonce: rmeKitBuilder.nonce
    })
  }).catch(() => {});
}

function markLeadCompleted() {
  if (!kitSession.email) return;
  fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_mark_completed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: kitSession.email, nonce: rmeKitBuilder.nonce })
  }).catch(() => {});
}

// ── Consultation Escape Hatch ──────────────────────────────────────────────

function getCalendlyUrl() {
  let url = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.calendlyUrl)
    ? rmeKitBuilder.calendlyUrl
    : 'https://calendly.com/radiomadeeasy/radio-consultation';
  if (kitSession.email) url += '?email=' + encodeURIComponent(kitSession.email);
  if (kitSession.name) url += (url.includes('?') ? '&' : '?') + 'name=' + encodeURIComponent(kitSession.name);
  return url;
}

function initConsultationFeatures() {
  updateConsultButton();
  const needsLink = document.getElementById('needs-consult-link');
  if (needsLink) needsLink.href = getCalendlyUrl();
}

function updateConsultButton() {
  const btn = document.getElementById('btn-consult');
  if (btn) btn.href = getCalendlyUrl();
}

function showConsultationFooter() {
  const btn = document.getElementById('btn-consult');
  if (btn) btn.style.display = '';
  updateConsultButton();
}

function hideConsultationFooter() {
  const btn = document.getElementById('btn-consult');
  if (btn) btn.style.display = 'none';
}

// Needs assessment questions
const needsQuestions = [
  {
    id: 'usage',
    question: "What do you need radios for?",
    sub: "Select all that apply. Many people need more than one type.",
    multi: true,
    options: [
      { key: 'handheld', icon: ICO.handheld, label: 'Handheld radios', detail: 'Portable, carried on your person', categories: ['handheld'] },
      { key: 'vehicle', icon: ICO.vehicle, label: 'Vehicle / mobile radios', detail: 'Mounted in a car, truck, or RV', categories: ['mobile'] },
      { key: 'base', icon: ICO.base, label: 'Base station', detail: 'Fixed location with outdoor antenna', categories: ['base'] },
      { key: 'hf', icon: ICO.hf, label: 'Long-distance (HF)', detail: 'Nationwide or worldwide', categories: ['hf'] },
      { key: 'scanner', icon: ICO.scanner, label: 'Scanner / SDR receiver', detail: 'Listen only — no license required', categories: ['scanner'] },
      { key: 'notsure', icon: ICO.notsure, label: "I'm not sure yet", detail: "We'll help you figure it out", categories: [] },
    ]
  },
  {
    id: 'reach',
    question: "Who are you trying to reach?",
    sub: "Pick the best match.",
    multi: false,
    condition: (answers) => answers.usage && answers.usage.includes('notsure'),
    options: [
      { key: 'nearby', icon: ICO.shortrange, label: 'People nearby', detail: 'Same property, event, or neighborhood', categories: ['handheld'] },
      { key: 'local', icon: ICO.midrange, label: 'Across town or county', detail: 'Local area, nearby cities, via repeaters', categories: ['handheld', 'mobile', 'base'] },
      { key: 'far', icon: ICO.longrange, label: 'Statewide or beyond', detail: 'Long distance, nationwide, worldwide', categories: ['hf'] },
      { key: 'listen', icon: ICO.monitoring, label: 'Listen to public safety / aviation', detail: 'Monitor police, fire, EMS, aircraft (receive only)', categories: ['scanner'] },
    ]
  },
];

let needsStep = 0;

function startNeedsAssessment() {
  rmeDebug('START', 'Needs Assessment (guided)');
  const savedEmail = kitSession.email, savedName = kitSession.name;
  kitSession = { needsAnswers: {}, categories: [], kits: [], currentKitIndex: 0, preferences: [], email: savedEmail, name: savedName };
  trackSessionProgress('needs-assessment');
  needsStep = 0;
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'block';
  renderNeedsQuestion();
  animatePhase('needs-container');
}

function showCategoryPicker() {
  rmeDebug('START', 'Category Picker (direct)');
  const savedEmail = kitSession.email, savedName = kitSession.name;
  kitSession = { needsAnswers: {}, categories: [], kits: [], currentKitIndex: 0, preferences: [], email: savedEmail, name: savedName };
  trackSessionProgress('category-picker');
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'block';
  renderCategoryPicker();
}

function needsGoBack() {
  rmeDebug('BACK', `From needs step ${needsStep}`);
  needsStep--;
  while (needsStep > 0) {
    const q = needsQuestions[needsStep];
    if (q.condition && !q.condition(kitSession.needsAnswers)) {
      needsStep--;
      continue;
    }
    break;
  }
  if (needsStep <= 0) needsStep = 0;
  renderNeedsQuestion();
}

function renderNeedsQuestion() {
  // Find next applicable question
  while (needsStep < needsQuestions.length) {
    const q = needsQuestions[needsStep];
    if (q.condition && !q.condition(kitSession.needsAnswers)) {
      needsStep++;
      continue;
    }
    break;
  }
  if (needsStep >= needsQuestions.length) {
    // All questions answered -compute categories
    computeCategories();
    return;
  }

  const q = needsQuestions[needsStep];
  const qOptions = q.getOptions ? q.getOptions(kitSession.needsAnswers) : q.options;
  const answers = kitSession.needsAnswers[q.id] || (q.multi ? [] : '');
  const container = document.getElementById('needs-container');

  container.innerHTML = `
    <div class="needs-q">
      <h2>${q.question}</h2>
      <div class="nq-sub">${q.sub}</div>
      ${qOptions.map(opt => {
        const isSelected = q.multi ? answers.includes(opt.key) : answers === opt.key;
        const indicator = q.multi
          ? `<div class="nq-check">${isSelected ? '✓' : ''}</div>`
          : `<div class="oc-radio">${isSelected ? '<span></span>' : ''}</div>`;
        return `
        <div class="nq-option ${isSelected ? 'selected' : ''}" onclick="toggleNeedsOption('${q.id}','${opt.key}',${q.multi})">
          ${indicator}
          <div class="nq-icon">${opt.icon}</div>
          <div>
            <div class="nq-label">${opt.label}</div>
            <div class="nq-detail">${opt.detail}</div>
          </div>
        </div>`;
      }).join('')}
      <div class="needs-btns">
        ${needsStep > 0 ? '<button class="btn-nav btn-back" onclick="needsGoBack()">← Back</button>' : '<button class="btn-nav btn-back" onclick="backToNeedsLanding()">← Back</button>'}
        <button class="btn-nav btn-next" onclick="advanceNeeds()">
          ${needsStep < needsQuestions.length - 1 ? 'Next →' : 'See My Kit Plan →'}
        </button>
        ${q.multi ? '<button class="btn-nav btn-back" onclick="advanceNeeds()" style="font-size:12px">Skip</button>' : ''}
      </div>
    </div>
  `;
}

function toggleNeedsOption(qId, key, multi) {
  if (multi) {
    if (!kitSession.needsAnswers[qId]) kitSession.needsAnswers[qId] = [];
    const arr = kitSession.needsAnswers[qId];
    const idx = arr.indexOf(key);
    rmeDebug(idx >= 0 ? 'DESELECT' : 'SELECT', `${qId}: ${key}`);
    if (idx >= 0) arr.splice(idx, 1);
    else {
      // "notsure" / "nopreference" are exclusive with other options in their question
      if ((qId === 'usage' && key === 'notsure') || (qId === 'preferences' && key === 'nopreference')) {
        arr.length = 0;
        arr.push(key);
      } else if ((qId === 'usage' && arr.includes('notsure')) || (qId === 'preferences' && arr.includes('nopreference'))) {
        arr.length = 0;
        arr.push(key);
      } else {
        arr.push(key);
      }
    }
  } else {
    rmeDebug('SELECT', `${qId}: ${key}`);
    kitSession.needsAnswers[qId] = key;
  }
  renderNeedsQuestion();
}

function advanceNeeds() {
  rmeDebug('NEXT', `Needs step ${needsStep} → ${needsStep+1} | answers: ${JSON.stringify(kitSession.needsAnswers)}`);
  needsStep++;
  renderNeedsQuestion();
  scrollToTop();
}

function computeCategories() {
  const cats = new Set();
  const answers = kitSession.needsAnswers;

  // From direct usage selection
  if (answers.usage) {
    answers.usage.forEach(key => {
      const opt = needsQuestions[0].options.find(o => o.key === key);
      if (opt) opt.categories.forEach(c => cats.add(c));
    });
  }

  // From guided "reach" question (replaces distance + where)
  if (answers.reach) {
    const reachQ = needsQuestions.find(q => q.id === 'reach');
    if (reachQ) {
      const opt = reachQ.options.find(o => o.key === answers.reach);
      if (opt) opt.categories.forEach(c => cats.add(c));
    }
  }

  // Default to handheld if nothing selected
  if (cats.size === 0) cats.add('handheld');

  // Build category list with default qty 1
  kitSession.categories = [...cats].map(c => ({ type: c, qty: 1 }));
  renderQuantityPicker();
}

function renderCategoryPicker() {
  // Direct category selection (skip guided questions)
  const container = document.getElementById('needs-container');
  const cats = kitSession.categories.length > 0 ? kitSession.categories : [];
  const selected = new Set(cats.map(c => c.type));

  const catOptions = [
    { key: 'handheld', icon: ICO.handheld, name: 'Handheld Radios', desc: 'Portable, carried on your person' },
    { key: 'mobile', icon: ICO.vehicle, name: 'Vehicle / Mobile Radios', desc: 'Mounted in a car, truck, or RV' },
    { key: 'base', icon: ICO.base, name: 'Base Station', desc: 'Fixed location with outdoor antenna' },
    { key: 'hf', icon: ICO.hf, name: 'HF Radio', desc: 'Nationwide or worldwide' },
    { key: 'scanner', icon: ICO.scanner, name: 'Monitor & Listen', desc: 'Listen only — no license required' },
  ];

  container.innerHTML = `
    <div class="needs-q">
      <h2>What types of radio do you need?</h2>
      <div class="nq-sub">Select all that apply. You can build multiple kits.</div>
      ${catOptions.map(c => `
        <div class="nq-option ${selected.has(c.key) ? 'selected' : ''}" onclick="toggleDirectCategory('${c.key}')">
          <div class="nq-check">${selected.has(c.key) ? '✓' : ''}</div>
          <div class="nq-icon">${c.icon}</div>
          <div>
            <div class="nq-label">${c.name}</div>
            <div class="nq-detail">${c.desc}</div>
          </div>
        </div>
      `).join('')}
      <div class="needs-btns">
        <button class="btn-nav btn-back" onclick="backToNeedsLanding()">← Back</button>
        <button class="btn-nav btn-next" onclick="finishDirectCategories()">Next: Quantities →</button>
      </div>
    </div>
  `;
}

function toggleDirectCategory(key) {
  const idx = kitSession.categories.findIndex(c => c.type === key);
  rmeDebug(idx >= 0 ? 'DESELECT' : 'SELECT', `Category: ${key}`);
  if (idx >= 0) kitSession.categories.splice(idx, 1);
  else kitSession.categories.push({ type: key, qty: 1 });
  renderCategoryPicker();
}

function finishDirectCategories() {
  rmeDebug('NEXT', `Categories: ${kitSession.categories.map(c=>c.type).join(', ')}`);
  if (kitSession.categories.length === 0) return;
  renderQuantityPicker();
}

function backToNeedsLanding() {
  // Reset all session state for a clean start
  kitSession = { needsAnswers: {}, categories: [], kits: [], currentKitIndex: 0, preferences: [] };
  needsStep = 0;
  mobileState = { radioKey: null, vehicle: { year: '', make: '', model: '' }, selections: {}, cartItems: [], step: 0 };
  baseState = { radioKey: null, antennaPath: null, selections: {}, cartItems: [], step: 0 };
  hfState = { radioKey: null, selections: {}, cartItems: [], step: 0 };
  scannerState = { radioKey: null, selections: { antennas: new Set(), accessories: new Set() }, cartItems: [], step: 0 };
  wantsItinerantLicense = false;
  _rmeKbCartBusy = false;
  // Hide all phases, then show needs phase with landing visible
  hideAllPhases();
  document.getElementById('needs-phase').style.display = '';
  document.getElementById('needs-landing').style.display = '';
  document.getElementById('needs-container').style.display = 'none';
  document.getElementById('kit-plan-container').style.display = 'none';
}

const categoryMeta = {
  handheld: { icon: ICO.handheld, name: 'Handheld Radio Kit', unitLabel: 'person', unitPlural: 'people' },
  mobile: { icon: ICO.vehicle, name: 'Vehicle Mobile Kit', unitLabel: 'vehicle', unitPlural: 'vehicles' },
  base: { icon: ICO.base, name: 'Base Station Kit', unitLabel: 'location', unitPlural: 'locations' },
  hf: { icon: ICO.hf, name: 'HF Radio Kit', unitLabel: 'station', unitPlural: 'stations' },
  scanner: { icon: ICO.scanner, name: 'Scanner / SDR Kit', unitLabel: 'unit', unitPlural: 'units' },
};

function renderQuantityPicker() {
  document.getElementById('needs-container').style.display = 'block';
  document.getElementById('kit-plan-container').style.display = 'none';
  const container = document.getElementById('needs-container');

  container.innerHTML = `
    <div class="needs-q">
      <h2>How Many Do You Need?</h2>
      <div class="nq-sub">We typically recommend a handheld for each person, a mobile for each vehicle, and a base station at home.</div>
      ${kitSession.categories.map((cat, i) => {
        const m = categoryMeta[cat.type];
        const tier = getVolumeTier(cat.qty);
        const tierBadge = tier ? `<span style="display:inline-block;background:#1a2a1a;color:#5c5;font-size:11px;padding:2px 8px;border-radius:4px;margin-left:8px;font-weight:600">${tier.pct}% OFF (${tier.label})</span>` : '';
        const nudge = volumeNudgeHtml(cat.qty, cat.type);
        return `
        <div class="qty-row">
          <div class="qty-icon">${m.icon}</div>
          <div class="qty-label">
            <strong>${m.name}</strong>${tierBadge}
            <span>How many ${m.unitPlural}?</span>
          </div>
          <div class="qty-ctrl">
            <button onclick="adjustQty(${i},-1)">−</button>
            <div class="qty-val">${cat.qty}</div>
            <button onclick="adjustQty(${i},1)">+</button>
          </div>
          <button class="qty-remove" onclick="removeCategory(${i})" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div>
        ${nudge}`;
      }).join('')}
      <div class="needs-btns">
        <button class="btn-nav btn-back" onclick="needsStep=0;renderNeedsQuestion();kitSession.categories=[]">← Back</button>
        <button class="btn-nav btn-next" onclick="showKitPlan()">See My Kit Plan →</button>
      </div>
    </div>
  `;
}

function adjustQty(catIdx, delta) {
  const cat = kitSession.categories[catIdx];
  cat.qty = Math.max(1, Math.min(20, cat.qty + delta));
  renderQuantityPicker();
}

function removeCategory(catIdx) {
  kitSession.categories.splice(catIdx, 1);
  rmeDebug('REMOVE', `Category removed, ${kitSession.categories.length} remaining`);
  if (kitSession.categories.length === 0) {
    needsStep = 0;
    renderNeedsQuestion();
  } else {
    renderQuantityPicker();
  }
}

function removeKit(kitIdx) {
  const kit = kitSession.kits[kitIdx];
  rmeDebug('REMOVE', `Kit removed: ${kit.label}`);
  kitSession.kits.splice(kitIdx, 1);
  // Renumber labels within each category
  renumberKitLabels();
  if (kitSession.kits.length === 0) {
    document.getElementById('kit-plan-container').style.display = 'none';
    renderQuantityPicker();
  } else {
    renderKitPlan();
  }
}

function duplicateKit(kitIdx) {
  const src = kitSession.kits[kitIdx];
  const newKit = { category: src.category, label: '', status: 'pending', radioKey: null, cartItems: [] };
  // Insert after the source kit
  kitSession.kits.splice(kitIdx + 1, 0, newKit);
  renumberKitLabels();
  rmeDebug('DUPLICATE', `Added ${newKit.label}`);
  renderKitPlan();
}

function renumberKitLabels() {
  const counts = {};
  kitSession.kits.forEach(k => {
    counts[k.category] = (counts[k.category] || 0) + 1;
  });
  const idx = {};
  kitSession.kits.forEach(k => {
    idx[k.category] = (idx[k.category] || 0) + 1;
    const m = categoryMeta[k.category];
    k.label = counts[k.category] > 1 ? `${m.name} #${idx[k.category]}` : m.name;
  });
}

function showKitPlan() {
  scrollToTop();
  rmeDebug('PLAN', `Categories: ${kitSession.categories.map(c=>`${c.type}×${c.qty}`).join(', ')}`);
  // Build kit list from categories × quantities
  kitSession.kits = [];
  kitSession.categories.forEach(cat => {
    for (let i = 0; i < cat.qty; i++) {
      kitSession.kits.push({
        category: cat.type,
        label: cat.qty > 1 ? `${categoryMeta[cat.type].name} #${i + 1}` : categoryMeta[cat.type].name,
        status: 'pending',
        radioKey: null,
        selections: {},
        cartItems: []
      });
    }
  });
  kitSession.currentKitIndex = 0;

  // Skip the plan page — go straight to building the first kit
  rmeDebug('PLAN', `${kitSession.kits.length} kit(s), starting build`);
  document.getElementById('needs-container').style.display = 'none';
  startNextKit();
}

function renderKitPlan() {
  const container = document.getElementById('kit-plan-container');
  const totalKits = kitSession.kits.length;
  const doneKits = kitSession.kits.filter(k => k.status === 'complete').length;

  container.innerHTML = `
    <div class="kit-plan">
      <h2>Your Kit Plan</h2>
      <p class="plan-sub">${totalKits} kit${totalKits > 1 ? 's' : ''} to build. ${doneKits > 0 ? doneKits + ' done, ' + (totalKits - doneKits) + ' to go.' : "We'll build them one at a time."}</p>
      <div class="kit-plan-items">
        ${kitSession.kits.map((kit, i) => `
          <div class="kit-plan-item">
            <div class="kpi-icon">${categoryMeta[kit.category].icon}</div>
            <div class="kpi-text">
              <strong>${kit.label}</strong>
              <span>${kit.status === 'complete' ? (() => { const r = [...radioLineup, ...mobileRadioLineup, ...hfRadioLineup, ...scannerRadioLineup].find(x => x.key === kit.radioKey); return r ? r.name.replace(' Essentials Kit','').replace(' Mobile Radio Kit','') : kit.radioKey; })() : kit.status === 'active' ? 'Building now...' : 'Waiting'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <div class="kpi-status ${kit.status}">${kit.status === 'complete' ? 'Done' : kit.status === 'active' ? 'Active' : 'Pending'}</div>
              ${kit.status === 'pending' ? `
                <button onclick="duplicateKit(${i})" style="background:none;border:none;cursor:pointer;color:#666;padding:10px;line-height:0;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center" title="Add another"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
                <button onclick="removeKit(${i})" style="background:none;border:none;cursor:pointer;color:#666;padding:10px;line-height:0;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ${(() => {
        // Volume discount summary per category
        const catCounts = {};
        kitSession.kits.forEach(k => { catCounts[k.category] = (catCounts[k.category] || 0) + 1; });
        const discountLines = Object.entries(catCounts).filter(([,qty]) => getVolumeTier(qty)).map(([cat, qty]) => {
          const tier = getVolumeTier(qty);
          const m = categoryMeta[cat];
          return '<div style="padding:8px 0;border-top:1px solid #2a3a2a">' +
            '<div style="color:#ccc;font-size:14px;font-weight:500">' + m.name + ' &times; ' + qty + '</div>' +
            '<div style="color:#5c5;font-size:13px;margin-top:2px">' + tier.pct + '% off base price</div>' +
            '<div style="color:#5c5;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-top:1px">' + tier.label + '</div>' +
            '</div>';
        });
        if (discountLines.length === 0) return '';
        return '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin:16px 0">' +
          '<div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#5c5;margin-bottom:4px;font-weight:600">Volume Discounts Applied</div>' +
          discountLines.join('') + '</div>';
      })()}
      ${doneKits < totalKits ? `
        <button class="btn-nav btn-next" onclick="startNextKit()">
          ${doneKits === 0 ? 'Start Building →' : 'Build Next Kit →'}
        </button>
      ` : `
        <button class="btn-nav btn-next" onclick="showCombinedReview()">
          Review All Kits & Add to Cart →
        </button>
      `}
      <div style="margin-top:12px">
        <button class="btn-nav btn-back" onclick="document.getElementById('kit-plan-container').style.display='none';renderQuantityPicker();scrollToTop()">← Back</button>
      </div>
    </div>
  `;
}

function startNextKit() {
  scrollToTop();
  // Find next pending kit
  const idx = kitSession.kits.findIndex(k => k.status === 'pending');
  if (idx < 0) { renderKitPlan(); return; }
  kitSession.currentKitIndex = idx;
  kitSession.kits[idx].status = 'active';

  const kit = kitSession.kits[idx];
  document.getElementById('needs-phase').style.display = 'none';

  if (kit.category === 'handheld') {
    startHandheldFlow();
  } else if (kit.category === 'mobile') {
    startMobileFlow();
  } else if (kit.category === 'base') {
    startBaseFlow();
  } else if (kit.category === 'hf') {
    startHfFlow();
  } else if (kit.category === 'scanner') {
    startScannerFlow();
  }
}

function completeCurrentKit(cartItems, programmingData) {
  const kit = kitSession.kits[kitSession.currentKitIndex];
  kit.status = 'complete';
  kit.cartItems = cartItems || [];
  if (programmingData) kit.programming = programmingData;

  // Determine if this is a single-solution session (all kits same category)
  const categories = new Set(kitSession.kits.map(k => k.category));
  const isSingleSolution = categories.size === 1;
  const sameCatPending = kitSession.kits.filter(k => k.category === kit.category && k.status === 'pending');

  // Single solution with pending kits: offer to apply same config, then upsell/cart
  if (isSingleSolution && sameCatPending.length > 0) {
    showHidePhases();
    const catName = categoryMeta[kit.category]?.name || kit.category;
    const radioName = [...radioLineup, ...mobileRadioLineup, ...hfRadioLineup, ...scannerRadioLineup].find(r => r.key === kit.radioKey)?.name?.replace(' Essentials Kit','').replace(' Mobile Radio Kit','') || kit.radioKey;
    const count = sameCatPending.length;
    document.getElementById('kit-plan-container').innerHTML = `
      <div class="kit-plan" style="text-align:center">
        <h2>Apply to Remaining Kits?</h2>
        <p style="color:#ddd;font-size:15px;max-width:500px;margin:0 auto 24px">You have ${count} more ${catName.toLowerCase()}${count > 1 ? 's' : ''} to build. Would you like to use the same configuration (${radioName} with the same accessories)?</p>
        <p style="color:#888;font-size:13px;margin-bottom:24px">Programming addresses will still need to be set individually if they differ.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn-nav btn-next" onclick="applyToAllPendingThenCart('${kit.category}')">Apply to All ${count} →</button>
          <button class="btn-nav btn-back" onclick="renderKitPlan()">Customize Each One</button>
        </div>
      </div>
    `;
    scrollToTop();
    return;
  }

  // Single solution, all done: show volume upsell or go to cart
  if (isSingleSolution) {
    rmeDebug('CART', 'Single solution — checking for volume upsell');
    showVolumeUpsellOrCart(kit.category);
    return;
  }

  // Multi-solution: use kit plan as usual
  showHidePhases();
  if (sameCatPending.length > 0) {
    const catName = categoryMeta[kit.category]?.name || kit.category;
    const radioName = [...radioLineup, ...mobileRadioLineup, ...hfRadioLineup, ...scannerRadioLineup].find(r => r.key === kit.radioKey)?.name?.replace(' Essentials Kit','').replace(' Mobile Radio Kit','') || kit.radioKey;
    const count = sameCatPending.length;
    document.getElementById('kit-plan-container').innerHTML = `
      <div class="kit-plan" style="text-align:center">
        <h2>Apply to Remaining Kits?</h2>
        <p style="color:#ddd;font-size:15px;max-width:500px;margin:0 auto 24px">You have ${count} more ${catName.toLowerCase()}${count > 1 ? 's' : ''} to build. Would you like to use the same configuration (${radioName} with the same accessories)?</p>
        <p style="color:#888;font-size:13px;margin-bottom:24px">Programming addresses will still need to be set individually if they differ.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn-nav btn-next" onclick="applyToAllPending('${kit.category}')">Apply to All ${count} →</button>
          <button class="btn-nav btn-back" onclick="renderKitPlan()">Customize Each One</button>
        </div>
      </div>
    `;
    scrollToTop();
    return;
  }

  renderKitPlan();
}

// Helper: hide all phases, show kit plan container
function showHidePhases() {
  document.getElementById('selector-phase').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'none';
  { const _bb = document.querySelector('.rme-kb-bottom-bar'); if (_bb) _bb.style.display = 'none'; }
  ['mobile-phase','base-phase','hf-phase','scanner-phase'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  document.getElementById('needs-phase').style.display = 'block';
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'none';
  document.getElementById('kit-plan-container').style.display = 'block';
}

// Volume upsell prompt or direct to cart
function showVolumeUpsellOrCart(category) {
  const totalQty = kitSession.kits.filter(k => k.category === category).length;
  const nextTier = getNextTier(totalQty);
  const currentTier = getVolumeTier(totalQty);

  // If there's a next tier they can reach by adding more
  if (nextTier) {
    const addMore = nextTier.min - totalQty;
    const catName = categoryMeta[category]?.name || category;
    const sourceKit = kitSession.kits.filter(k => k.category === category && k.status === 'complete').pop();
    const radioName = sourceKit ? ([...radioLineup, ...mobileRadioLineup, ...hfRadioLineup, ...scannerRadioLineup].find(r => r.key === sourceKit.radioKey)?.name?.replace(' Essentials Kit','').replace(' Mobile Radio Kit','') || '') : '';

    showHidePhases();
    document.getElementById('kit-plan-container').innerHTML = `
      <div class="kit-plan" style="text-align:center">
        <h2>Want to Save More?</h2>
        <p style="color:#ddd;font-size:15px;max-width:520px;margin:0 auto 8px">
          You have <strong style="color:var(--gold)">${totalQty}</strong> ${catName.toLowerCase()}${totalQty > 1 ? 's' : ''} in your kit.
          ${currentTier ? `That's <strong style="color:var(--green)">${currentTier.pct}% off</strong> (${currentTier.label}).` : ''}
        </p>
        <p style="color:var(--gold);font-size:17px;font-weight:600;margin:16px 0">
          Add ${addMore} more ${catName.toLowerCase()}${addMore > 1 ? 's' : ''} to unlock <strong>${nextTier.pct}% off</strong> — ${nextTier.label}!
        </p>
        <p style="color:#888;font-size:13px;margin-bottom:24px">Same configuration${radioName ? ' (' + radioName + ')' : ''}, applied automatically.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn-nav btn-next" onclick="addUpsellKits('${category}', ${addMore})">Add ${addMore} More →</button>
          <button class="btn-nav btn-back" onclick="addAllKitsToCart()">No Thanks, Add to Cart</button>
        </div>
      </div>
    `;
    scrollToTop();
    return;
  }

  // At max tier or no tiers — go straight to cart
  rmeDebug('CART', 'No upsell available — adding to cart');
  addAllKitsToCart();
}

// Add upsell kits by cloning the last completed kit
function addUpsellKits(category, count) {
  const sourceKit = kitSession.kits.filter(k => k.category === category && k.status === 'complete').pop();
  if (!sourceKit) { addAllKitsToCart(); return; }

  for (let i = 0; i < count; i++) {
    kitSession.kits.push({
      category: category,
      label: categoryMeta[category]?.name + ' #' + (kitSession.kits.filter(k => k.category === category).length + 1),
      status: 'complete',
      radioKey: sourceKit.radioKey,
      cartItems: JSON.parse(JSON.stringify(sourceKit.cartItems)),
      programming: sourceKit.programming ? JSON.parse(JSON.stringify(sourceKit.programming)) : null,
    });
  }

  rmeDebug('UPSELL', `Added ${count} more ${category} kits`);
  // Check if there's yet another tier they could reach
  showVolumeUpsellOrCart(category);
}

// Apply to all pending then go to upsell/cart (for single-solution sessions)
function applyToAllPendingThenCart(category) {
  const sourceKit = kitSession.kits.filter(k => k.category === category && k.status === 'complete').pop();
  if (!sourceKit) { addAllKitsToCart(); return; }

  kitSession.kits.forEach(k => {
    if (k.category === category && k.status === 'pending') {
      k.status = 'complete';
      k.radioKey = sourceKit.radioKey;
      k.cartItems = JSON.parse(JSON.stringify(sourceKit.cartItems));
      if (sourceKit.programming) k.programming = JSON.parse(JSON.stringify(sourceKit.programming));
    }
  });

  rmeDebug('APPLY ALL', `Cloned ${category} kit to remaining pending kits, checking upsell`);
  showVolumeUpsellOrCart(category);
}

function applyToAllPending(category) {
  // Find the completed kit to clone from (most recently completed of this category)
  const sourceKit = kitSession.kits.filter(k => k.category === category && k.status === 'complete').pop();
  if (!sourceKit) { renderKitPlan(); return; }

  // Apply to all pending kits of same category
  kitSession.kits.forEach(k => {
    if (k.category === category && k.status === 'pending') {
      k.status = 'complete';
      k.radioKey = sourceKit.radioKey;
      k.cartItems = JSON.parse(JSON.stringify(sourceKit.cartItems)); // deep clone
      if (sourceKit.programming) k.programming = JSON.parse(JSON.stringify(sourceKit.programming));
    }
  });

  rmeDebug('APPLY ALL', `Cloned ${category} kit to remaining pending kits`);
  renderKitPlan();
  scrollToTop();
}

function startHandheldFlow() {
  scrollToTop();
  hideAllPhases();
  document.getElementById('selector-phase').style.display = 'block';
  document.getElementById('selector-landing').style.display = 'none';
  document.getElementById('interview-container').style.display = 'none';
  document.getElementById('radio-picker').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'none';

  // Pre-set interview answers from preferences
  interviewAnswers = {};

  // Carry forward programming from prior kits
  const prior = getPriorProgramming();
  if (prior) {
    programmingChoice = prior.choice || 'standard';
    progUseShipping = prior.useShipping !== undefined ? prior.useShipping : true;
    progZipPrimary = prior.zip || '';
    progZipsExtra = prior.zipsExtra ? [...prior.zipsExtra] : [];
    progBrandmeisterId = prior.brandmeisterId || '';
  }

  // If user came through needs assessment, go straight to the interview
  // (budget + needs questions handle all scoring; no more preferences step)
  if (kitSession.needsAnswers && kitSession.needsAnswers.usage) {
    rmeDebug('SKIP', 'Selector landing — starting interview from needs assessment');
    startInterview();
    return;
  }

  // Direct entry (no needs assessment) — show full selector landing
  document.getElementById('selector-landing').style.display = '';

  // Update heading to indicate which kit is being built
  if (kitSession.kits.length > 1) {
    const kit = kitSession.kits[kitSession.currentKitIndex];
    const h2 = document.querySelector('#selector-landing h2');
    if (h2) h2.textContent = kit.label || 'Handheld Radio Kit';
    const p = document.querySelector('#selector-landing > p');
    if (p) p.textContent = `Kit ${kitSession.currentKitIndex + 1} of ${kitSession.kits.length}. Choose your handheld radio and customize it with accessories.`;
  }

  // Add back button if in multi-kit or direct-category flow
  if (kitSession.kits.length >= 1) {
    const landing = document.getElementById('selector-landing');
    let backBtn = landing.querySelector('.rkb-back-to-plan');
    if (!backBtn) {
      backBtn = document.createElement('div');
      backBtn.className = 'rkb-back-to-plan';
      backBtn.style.cssText = 'text-align:center;margin-top:20px;';
      backBtn.innerHTML = '<button class="btn-nav btn-back" onclick="backToKitPlan()">← Back</button>';
      landing.appendChild(backBtn);
    }
  }
}

function backToKitPlan() {
  // Abandon current kit -reset to pending
  const kit = kitSession.kits[kitSession.currentKitIndex];
  if (kit) kit.status = 'pending';

  document.getElementById('selector-phase').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'none';
  { const _bb = document.querySelector('.rme-kb-bottom-bar'); if (_bb) _bb.style.display = 'none'; }
  if (document.getElementById('mobile-phase')) document.getElementById('mobile-phase').style.display = 'none';
  if (document.getElementById('base-phase')) document.getElementById('base-phase').style.display = 'none';
  if (document.getElementById('hf-phase')) document.getElementById('hf-phase').style.display = 'none';
  if (document.getElementById('scanner-phase')) document.getElementById('scanner-phase').style.display = 'none';

  document.getElementById('needs-phase').style.display = 'block';
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'none';
  document.getElementById('kit-plan-container').style.display = 'block';
  renderKitPlan();
}

// ══════════════════════════════════════════════════════
// ── MOBILE / BASE / HF RADIO DATA ──
// ══════════════════════════════════════════════════════

const mobileRadioLineup = [
  {
    key: 'uv50pro', name: 'UV-50PRO Essentials Kit', price: 329, id: 8487,
    img: S+'2025/12/uv-50pro-1x1-1.jpg',
    tagline: 'Analog powerhouse',
    pitch: '50W mobile radio with Bluetooth smartphone control, GPS, APRS, and radio-to-radio text messaging. IP54 rated. Fully controllable from the hand mic.',
    features: ['50W VHF/UHF', '180 memory channels', 'Bluetooth control', 'GPS + APRS', 'Text messaging', 'IP54 water resistant', 'Airband receive', 'Hand mic control'],
    tags: ['waterproof', 'gps', 'bluetooth', 'simple', 'professional'],
    digital: false
  },
  {
    key: 'd578', name: 'DMR D578 Mobile Radio Kit', price: 549, id: 4157,
    img: S+'2024/04/d578uviiiplus.png',
    tagline: 'Digital & encryption capable',
    pitch: 'Full DMR digital radio with encryption, tri-band (2M/70cm/1.25M), GPS, APRS, crossband repeater, and Bluetooth. Interoperates with DMR 6X2 PRO and DA-7X2 handhelds.',
    features: ['DMR digital + analog', 'Encryption capable', '50W tri-band', 'Crossband repeater', 'GPS + APRS', 'Bluetooth', 'Digital text messaging', 'IP54 water resistant'],
    tags: ['encryption', 'digital', 'crossband', 'gps', 'bluetooth', 'professional'],
    digital: true
  },
];

const hfRadioLineup = [
  {
    key: 'g90', name: 'Xiegu G90 Mobile Radio Kit', price: 549, id: 3654,
    img: S+'2024/02/g90.png',
    tagline: 'Budget HF. Get on the air',
    pitch: 'Budget-friendly HF radio covering 1.8-54 MHz. Includes MARS/CAP mod. Ideal entry point for long-distance amateur radio.',
    features: ['20W HF', '1.8-54 MHz', 'Built-in tuner', 'MARS/CAP mod included', 'Compact form factor'],
    tags: ['budget', 'hf', 'portable'],
  },
  {
    key: 'ft891', name: 'Yaesu FT-891 Mobile Radio Kit', price: 899, id: 720,
    img: S+'2023/03/ft891.png',
    tagline: 'Premium HF performance',
    pitch: 'Full-featured 100W HF radio covering 1.8-54 MHz. Excellent receiver, built for serious HF operators. Includes MARS/CAP mod.',
    features: ['100W HF', '1.8-54 MHz', 'Superior receiver', 'MARS/CAP mod included', 'Rugged build'],
    tags: ['premium', 'hf', 'power'],
    outOfStock: true
  },
];

// Mobile/base accessories
const mobileProducts = {
  vehicleMounts: [
    { key: 'ramwedge', name: 'RAM Tough Wedge Mobile Radio Mount', desc: 'No-drill seat/console wedge mount with air bag insert. Keeps your radio accessible without modifying your vehicle.', price: 139, id: 8157 },
    { key: 'tacoma-console', name: 'Console Radio Mounting Bracket (Toyota Tacoma 2016+)', desc: 'Vehicle-specific console mount for Tacoma. Clean, integrated look.', price: 129, id: 6987, vehicleMatch: 'tacoma' },
  ],
  antennaMounts: [
    { key: 'lipmount-nmo', name: 'Comet CP-5NMO Antenna Lip Mount', desc: 'Permanent lip mount, the most stable option. Mounts on trunk/hood lip without drilling.', price: 99, id: 7013, mountType: 'permanent' },
    { key: 'lipmount-so239', name: 'Comet CP-5M Antenna Lip Mount (SO-239)', desc: 'Permanent lip mount with SO-239 connector.', price: 99, id: 7277, mountType: 'permanent' },
    { key: 'fender-tacoma', name: 'NCG Tacoma Fender Mount (TACANTNCG)', desc: 'No-drill NMO fender bracket for Toyota Tacoma 2016-2023. Uses existing fender bolts.', price: 29, id: 8224, mountType: 'permanent', vehicleMatch: 'tacoma', isFenderMount: true },
    { key: 'fender-ford', name: 'NCG Ford Truck Fender Mount (FO3ANTNCG)', desc: 'No-drill NMO fender bracket for Ford F-150 (2015+), F-250/F-350 (2017+), Expedition (2018+).', price: 29, id: null, mountType: 'permanent', vehicleMatch: 'ford-truck', isFenderMount: true },
    { key: 'fender-chevy', name: 'NCG Silverado/Sierra Fender Mount (CV3ANTNCG)', desc: 'No-drill NMO fender bracket for Chevy Silverado/GMC Sierra 1500 (2019-24), 2500/3500 (2020-23).', price: 29, id: null, mountType: 'permanent', vehicleMatch: 'chevy-truck', isFenderMount: true },
    { key: 'fender-ram', name: 'NCG Ram Fender Mount (DG2ANTPF)', desc: 'No-drill NMO fender bracket for Ram 1500/2500/3500 (2009-2018). Driver side.', price: 29, id: null, mountType: 'permanent', vehicleMatch: 'ram-truck', isFenderMount: true },
    { key: 'fender-ram-new', name: 'NCG Ram Fender Mount (DG3ANTNCG)', desc: 'No-drill NMO fender bracket for Ram 1500/2500/3500 (2019-2023). Driver side.', price: 29, id: null, mountType: 'permanent', vehicleMatch: 'ram-truck-new', isFenderMount: true },
    { key: 'fender-colorado', name: 'NCG Colorado/Canyon Fender Mount (COANTNCG)', desc: 'No-drill NMO fender bracket for Chevy Colorado/GMC Canyon (2012-2022).', price: 29, id: null, mountType: 'permanent', vehicleMatch: 'colorado', isFenderMount: true },
    { key: 'magmount-nmo', name: 'Comet Mag Mount NMO', desc: 'Flat magnetic mount for vehicle roofs. Easy to remove, best if you need to take the antenna off regularly.', price: 39, id: 6940, mountType: 'temporary' },
    { key: 'roofrack', name: 'Comet RS-660U Roof Rack Mount', desc: 'Clamps to roof rack bars (up to 2.25" x 2"). Good option when no flat metal surface is available.', price: 59, id: 7198, mountType: 'permanent' },
    { key: 'ditchlight', name: 'Ditch Light Antenna Mount Extension', desc: 'Adds antenna mount to existing ditch light mount.', price: 29, id: 7602, mountType: 'permanent' },
  ],
  vehicleAntennas: [
    { key: 'sar', name: 'Wideband Search and Rescue Vehicle Antenna', desc: 'Covers Amateur, FRS/GMRS, MURS, and Commercial frequencies. VHF 140-160MHz, UHF 435-465MHz. PL-259 terminated.', price: 79, id: 5428, recommended: true },
    { key: 'comet-b10', name: 'Comet B-10 VHF/UHF NMO Antenna (12")', desc: 'Compact 12-inch NMO antenna. Low profile for vehicles that need clearance.', price: 59, id: 8869 },
  ],
  nmoCoax: [
    { key: 'nmo-coax', name: 'NMO Antenna Coax Cable Assembly', desc: 'Pre-terminated coax for NMO mounts. Connects your NMO mount to your radio.', price: 49, id: 6636 },
    { key: 'nmo-pl259', name: 'Comet CK-3NMO Deluxe NMO to PL-259 Cable', desc: 'Premium NMO to PL-259 cable assembly.', price: 45, id: 6715 },
    { key: 'so239-cable', name: 'Comet CK-3M5 Mobile Mount Cable SO-239', desc: 'Cable assembly for SO-239 mounts.', price: 44.95, id: 7200 },
  ],
  power: [
    { key: 'lifepo4-20ah', name: '20Ah LiFePO4 Battery', desc: 'Compact 12V portable power. Run your radio without the vehicle running. Great for overlanding, tailgating, or emergency use.', price: 129, id: 6631 },
    { key: 'lifepo4-10ah', name: '10Ah LiFePO4 Battery', desc: 'Smaller 12V portable power for lighter use.', price: 109, id: 6722 },
    { key: 'charger-ac', name: 'LiFePO4 AC Charger', desc: 'Wall charger for LiFePO4 batteries.', price: 29, id: 6632 },
    { key: 'charger-dc', name: 'LiFePO4 DC-to-DC Vehicle Charger', desc: 'Charge your LiFePO4 battery from your vehicle\'s auxiliary battery. Do not connect to starter battery.', price: 99, id: 6942 },
    { key: 'ac-psu', name: 'AC to 30A DC Switching Power Supply', desc: 'For permanent base station or home use. Best if you have whole-home battery backup or generator.', price: 149, id: 6969 },
  ],
  powerCables: [
    { key: 'wiring-harness', name: '12V Wiring Harness with OEM T Plug', desc: 'Direct wiring harness for hardwired vehicle installs.', price: 19.95, id: 7205 },
    { key: 'oem-t-powerpole', name: 'OEM T-Style to Powerpole Cable with Fuses', desc: 'Adapter cable to connect OEM-T power to Anderson Powerpole connectors.', price: 19, id: 8695 },
    { key: 'power-cable-short', name: 'Power Cable OEM-T to Powerpole (Shortened)', desc: 'Shortened power cable for clean installs.', price: 29, id: 7693 },
  ],
  accessories: [
    { key: 'bs22', name: 'BS-22 Wireless Speakermic', desc: 'Bluetooth wireless speaker-microphone. Clips to gear, pairs via Bluetooth.', price: 59, id: 8491, compatRadios: ['uv50pro'] },
    { key: 'bt01', name: 'BT-01 Mobile Bluetooth Speaker Mic', desc: 'Bluetooth speaker-microphone for mobile radios. Wireless audio with PTT for hands-free operation.', price: 149, id: 6717, compatRadios: ['d578'] },
    { key: 'relocation', name: 'Antenna Jack Relocation Cable', desc: 'Right-angle PL-259 to SO-239 cable for repositioning the antenna jack.', price: 19, id: 7271 },
    { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Adapter pigtail for connecting SO-239 accessories to your mobile radio.', price: 12, id: null },
  ],
};

// Base station specific
const baseProducts = {
  antennaPath: {
    quick: {
      label: 'Magnetic Mount (Quick Setup)',
      desc: 'Sticks to any metal surface: roof, barn, RV, toolbox, vehicle. Set up in seconds, move it anywhere. No drilling, no mast, no permanent install.',
      items: [
        { key: 'mtn-jumper', name: 'Mountain Jumper Angle-Adjustable Mount', desc: '180° adjustable magnetic mount. Works on metal roofs, barns, RVs, toolboxes, or any metal surface.', price: 69, id: 2046, required: true },
        { key: 'sar-antenna', name: 'Wideband Search and Rescue Antenna', desc: 'Covers Amateur, FRS/GMRS, MURS, and Commercial frequencies. Pairs with the Mountain Jumper mount.', price: 79, id: 5428, required: true },
      ]
    },
    permanent: {
      label: 'Permanent Mast / Tower Base',
      desc: 'High-performance base antenna on a mast or tower. Best range and performance. Requires a user-supplied or purchased mast.',
      antennas: [
        { key: 'gp3', name: 'Comet GP-3 Base Antenna', desc: 'Dual-band VHF/UHF base antenna. SO-239 connector. Good balance of size and performance.', price: 109, id: 6897, recommended: true },
        { key: 'gp6', name: 'Comet GP-6 Base Antenna', desc: 'Higher-gain dual-band VHF/UHF base antenna. SO-239 connector. Better range than GP-3, larger antenna.', price: 179, id: 6716 },
        { key: 'sar-antenna', name: 'Wideband Search and Rescue Antenna', desc: 'Covers Amateur, FRS/GMRS, MURS, and Commercial frequencies on a single antenna. Versatile and broadband. Works with any mount.', price: 79, id: 5428 },
        { key: 'slimjim', name: 'Roll Up Slim Jim Antenna', desc: 'Lightweight VHF/UHF roll-up antenna. Hang from a tree branch, rafter, window frame, or any elevated point. Includes 16ft of coax (additional length available in the next step). Requires SO-239 to BNC-M adapter (auto-added).', price: 49, id: 99, needsBncAdapter: true },
      ],
      mounts: [
        { key: 'chimney', name: 'Antenna Mast Chimney Strap Mounts', desc: 'Strap-on chimney mount for antenna mast. No drilling into the roof.', price: 49, id: 6949 },
        // Future: gable mounts, standoff mounts, wall mounts
      ]
    }
  },
};

// HF specific
const hfProducts = {
  antennas: [
    { key: 'efhw-40-10-portable', name: 'Portable End Fed Half Wave 40M-10M', desc: 'Lightweight portable HF antenna covering 40 through 10 meters. Hang from a tree, toss over a branch, or string between supports.', price: 199, id: 6873 },
    { key: 'efhw-80-10-portable', name: 'End Fed Half Wave 80M-10M', desc: 'Full-coverage HF antenna covering 80 through 10 meters. More bands than the 40-10M version. Portable deployment.', price: 299, id: 7267 },
    { key: 'efhw-80-10-permanent', name: 'Chameleon LEFS Weatherproof End Fed Half Wave 80M-10M', desc: 'Permanent/weatherproof HF antenna covering 80-10 meters. Built for long-term outdoor installation.', price: 179, id: 6947 },
  ],
  accessories: [
    { key: 'digirig-ft891', name: 'Digirig with Interface Cables for FT-891', desc: 'Digital modes interface for the FT-891. Run FT8, JS8Call, Winlink, and other digital modes from your computer.', price: 89, id: 7272, radioMatch: 'ft891' },
    { key: 'digirig-g90', name: 'Digirig with Interface Cables for G90', desc: 'Digital modes interface for the G90. Run FT8, JS8Call, Winlink, and other digital modes from your computer.', price: 89, id: 7273, radioMatch: 'g90' },
    { key: 'relocation', name: 'Antenna Jack Relocation Cable', desc: 'Right-angle PL-259 to SO-239 cable.', price: 19, id: 7271 },
    { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards.', price: 19, id: 966 },
  ],
};

// Coax products (shared between base + HF)
const coaxProducts = {
  grades: [
    { key: '400uf-under50', name: '400 Ultra Flex', desc: 'Premium low-loss coax. Best for longer runs and maximum performance.', pricePerFt: 5, id: 6718, maxFt: 50, label: '400 Ultra Flex (≤50ft) ($5/ft)' },
    { key: '400uf-over50', name: '400 Ultra Flex', desc: 'Premium low-loss coax, bulk pricing for longer runs.', pricePerFt: 3.50, id: 6950, minFt: 51, label: '400 Ultra Flex (>50ft) ($3.50/ft)' },
    { key: '240uf-under50', name: '240 Ultra Flex', desc: 'Thinner, more flexible coax. Easier to route but slightly more signal loss.', pricePerFt: 3, id: 6951, maxFt: 50, label: '240 Ultra Flex (≤50ft) ($3/ft)' },
    { key: '240uf-over50', name: '240 Ultra Flex', desc: 'Thinner coax, bulk pricing.', pricePerFt: 2, id: 6952, minFt: 51, label: '240 Ultra Flex (>50ft) ($2/ft)' },
  ],
  prebuilt: [
    { key: 'rg316-25', name: '25ft RG-316 Coax with Choke', desc: 'Thin, flexible coax with built-in choke. Good for short runs and portable setups.', price: 79, id: 7075 },
  ]
};

// Tiered coax pricing: first 50ft at standard rate, remainder at bulk rate
function calcCoaxTiered(length, grade) {
  const highRate = grade === '400uf' ? 5 : 3;
  const lowRate = grade === '400uf' ? 3.50 : 2;
  const highId = grade === '400uf' ? 6718 : 6951;
  const lowId = grade === '400uf' ? 6950 : 6952;
  const gradeName = grade === '400uf' ? '400' : '240';

  if (length <= 50) {
    return {
      total: Math.round(length * highRate * 100) / 100,
      displayHtml: `${length}ft of ${gradeName} Ultra Flex @ $${highRate}/ft`,
      cartItems: [{ name: `${length}ft ${gradeName} Ultra Flex Coax`, price: Math.round(length * highRate * 100) / 100, id: highId, qty: length }]
    };
  } else {
    const first50Cost = Math.round(50 * highRate * 100) / 100;
    const remainder = length - 50;
    const restCost = Math.round(remainder * lowRate * 100) / 100;
    const total = Math.round((first50Cost + restCost) * 100) / 100;
    return {
      total,
      displayHtml: `${length}ft of ${gradeName} Ultra Flex: 50ft @ $${highRate}/ft + ${remainder}ft @ $${lowRate}/ft`,
      cartItems: [
        { name: `50ft ${gradeName} Ultra Flex Coax`, price: first50Cost, id: highId, qty: 50 },
        { name: `${remainder}ft ${gradeName} Ultra Flex Coax (bulk)`, price: restCost, id: lowId, qty: remainder }
      ]
    };
  }
}

// ── Cross-kit programming carry-forward ──────────────
function getPriorProgramming() {
  // Find programming data from the most recently completed kit
  for (let i = kitSession.kits.length - 1; i >= 0; i--) {
    const k = kitSession.kits[i];
    if (k.status !== 'complete') continue;
    if (k.category === 'hf') continue; // HF has no programming
    if (k.programming) return k.programming;
  }
  return null;
}

// ── Cross-kit recommendation helpers ─────────────────
function getCompletedRadioKeys() {
  // Returns all radio keys from completed kits
  const result = { handheld: [], mobile: [], base: [], hf: [] };
  kitSession.kits.forEach(k => {
    if (k.status === 'complete' && k.radioKey) result[k.category].push(k.radioKey);
  });
  return result;
}

function getRecommendedMobileRadio() {
  const done = getCompletedRadioKeys();
  const hasWaterproofPref = kitSession.preferences.includes('waterproof');
  // If waterproof preference, recommend UV-50PRO (only IP54-rated mobile radio)
  if (hasWaterproofPref) return 'uv50pro';
  // If DMR handhelds were chosen, recommend D578 for digital interop
  const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
  if (dmrHandhelds.length > 0) return 'd578';
  // If a mobile kit was already built, match it
  if (done.mobile.length > 0) return done.mobile[0];
  return null;
}

function getRecommendedBaseRadio() {
  const done = getCompletedRadioKeys();
  // Match a completed vehicle mobile radio
  if (done.mobile.length > 0) return done.mobile[0];
  // Same DMR handheld logic
  const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
  const hasWaterproofPref = kitSession.preferences.includes('waterproof');
  if (dmrHandhelds.length > 0 && !hasWaterproofPref) return 'd578';
  return null;
}

// ── Phase transition animation helper ──
function animatePhase(elementOrId) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;
  el.classList.remove('rme-kb-animate');
  void el.offsetWidth; // force reflow
  el.classList.add('rme-kb-animate');
}

// ── Hide all phases helper ──
function hideAllPhases() {
  ['needs-phase', 'selector-phase', 'wizard-phase', 'mobile-phase', 'base-phase', 'hf-phase', 'scanner-phase'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const bb = document.querySelector('.rme-kb-bottom-bar');
  if (bb) bb.style.display = 'none';
  hideConsultationFooter();
}

// ══════════════════════════════════════════════════════
// ── MOBILE FLOW ──
// ══════════════════════════════════════════════════════

let mobileState = {};

function startMobileFlow() {
  scrollToTop();
  hideAllPhases();
  showConsultationFooter();
  mobileState = { radioKey: null, vehicle: { year: '', make: '', model: '' }, selections: {}, cartItems: [], step: 0 };

  document.getElementById('mobile-phase').style.display = 'block';
  document.getElementById('mobile-phase').innerHTML = '';
  renderMobileRadioChoice();
  animatePhase('mobile-phase');
}

function renderMobileRadioChoice() {
  const phase = document.getElementById('mobile-phase');
  const prefs = kitSession.preferences;
  const hasDigitalPref = prefs.includes('digital') || prefs.includes('crossband');
  const hasSimplePref = prefs.includes('simple') || prefs.includes('budget');
  const hasWaterproofPref = prefs.includes('waterproof');
  const recommended = getRecommendedMobileRadio();

  function getMobileBadge(r) {
    if (recommended === r.key) {
      const done = getCompletedRadioKeys();
      const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
      if (dmrHandhelds.length > 0) return '⭐ Recommended: matches your DMR handhelds';
      if (done.mobile.length > 0) return '⭐ Recommended: matches your vehicle radio';
      if (hasWaterproofPref) return '⭐ Recommended: IP54 water resistant';
      return '⭐ Recommended';
    }
    if (hasDigitalPref && r.digital) return '⭐ Recommended for digital/encryption';
    if (hasSimplePref && !r.digital) return '⭐ Recommended for simplicity';
    return '';
  }

  const primary = recommended || (hasSimplePref ? 'uv50pro' : (hasDigitalPref ? 'd578' : 'uv50pro'));
  const sorted = [...mobileRadioLineup].sort((a, b) => (a.key === primary ? -1 : b.key === primary ? 1 : 0));

  phase.innerHTML = `
    <div class="selector-landing" style="text-align:center">
      <h2>Choose Your Mobile Radio</h2>
      <p>Both radios are 50W and include a hand mic, mounting bracket, power cable, and free custom programming.</p>
      <div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center;max-width:800px;margin:24px auto 0">
        ${sorted.map(r => {
          const badge = getMobileBadge(r);
          const isPrimary = r.key === primary;
          return `
          <div class="radio-pick ${mobileState.radioKey === r.key ? 'selected' : ''}" onclick="selectMobileRadio('${r.key}')"
               style="flex:1;min-width:min(280px,100%);max-width:360px;text-align:center;padding:24px 20px;${isPrimary ? 'border-color:var(--rme-gold)' : ''}">
            ${badge ? `<div style="font-size:11px;padding:4px 10px;background:#1a1800;border:1px solid var(--rme-gold);color:var(--rme-gold);display:inline-block;margin-bottom:12px;border-radius:4px">${badge}</div>` : '<div style="height:27px"></div>'}
            <div class="rp-img" style="margin:0 auto 12px"><img src="${r.img || ''}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'"></div>
            <h4 style="color:var(--rme-gold);margin-bottom:4px">${r.name.replace(' Essentials Kit','').replace(' Mobile Radio Kit','')}</h4>
            <div style="font-size:13px;color:#c4a83a;margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:20px;font-weight:700;color:var(--rme-gold);margin-bottom:12px">$${r.price}</div>
            <div style="font-size:13px;color:#ddd;line-height:1.6;text-align:left;margin-bottom:12px">${r.pitch}</div>
            <ul style="text-align:left;font-size:12px;color:#ccc;padding-left:16px;margin:0 0 16px">${r.features.map(f=>'<li style="padding:2px 0">'+f+'</li>').join('')}</ul>
            <button class="rc-btn" onclick="event.stopPropagation();selectMobileRadio('${r.key}')" ${!isPrimary ? 'style="background:var(--card);color:var(--text);border:1px solid var(--border)"' : ''}>${isPrimary ? 'Select This Radio →' : 'Choose This Instead →'}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="needs-btns" style="margin-top:24px">
        <button class="btn-nav btn-back" onclick="backToKitPlan()">← Back</button>
      </div>
    </div>
  `;
}

function selectMobileRadio(key) {
  mobileState.radioKey = key;
  mobileState.step = 0;
  if (kitSession.kits[kitSession.currentKitIndex]) kitSession.kits[kitSession.currentKitIndex].radioKey = key;
  renderMobileWizard();
}

function renderMobileWizard() {
  const phase = document.getElementById('mobile-phase');
  const radio = mobileRadioLineup.find(r => r.key === mobileState.radioKey);
  const steps = getMobileSteps();
  const step = steps[mobileState.step];

  phase.innerHTML = `
    <div class="hero" style="margin-bottom:20px">
      <div class="hero-img" style="max-width:200px">
        <img src="${radio.img || ''}" alt="${radio.name}" onerror="this.parentElement.innerHTML='📻'" style="width:100%">
      </div>
      <div class="hero-info">
        <h1 style="font-size:22px">${radio.name}</h1>
        <div class="base-price">$${radio.price}.00</div>
        <div style="font-size:13px;color:#ddd;margin-top:8px">Kit includes: radio, hand mic, mounting bracket, power cable with Powerpoles, cigarette lighter adapter, free custom programming.</div>
      </div>
    </div>
    <div class="step-labels" style="margin-bottom:16px">
      ${steps.map((s, i) => `<div class="step-label ${i === mobileState.step ? 'active' : i < mobileState.step ? 'completed' : ''}" onclick="mobileState.step=${i};renderMobileWizard()">${s.name}</div>`).join('')}
    </div>
    <div id="mobile-step-content"></div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px">
      ${mobileState.step > 0 ? '<button class="btn-nav btn-back" onclick="mobileState.step--;renderMobileWizard();scrollToTop()">← Back</button>' : '<button class="btn-nav btn-back" onclick="mobileState.radioKey=null;renderMobileRadioChoice()">← Change Radio</button>'}
      <button class="btn-nav btn-next" onclick="advanceMobileStep()">
        ${mobileState.step < steps.length - 1 ? 'Next: ' + steps[mobileState.step + 1].name + ' →' : 'Save Kit & Continue →'}
      </button>
    </div>
  `;
  step.render();
}

function getMobileSteps() {
  return [
    { name: 'Vehicle', render: renderMobileVehicle },
    { name: 'Antenna', render: renderMobileAntenna },
    { name: 'Power', render: renderMobilePower },
    { name: 'Accessories', render: renderMobileAccessories },
    { name: 'Programming', render: renderMobileProgramming },
    { name: 'Review', render: renderMobileReview },
  ];
}

function advanceMobileStep() {
  const steps = getMobileSteps();
  if (mobileState.step < steps.length - 1) {
    mobileState.step++;
    renderMobileWizard();
    scrollToTop();
  } else {
    // Complete kit
    completeCurrentKit(mobileState.cartItems, mobileState.selections.programming);
  }
}

let _ymmData = null;
function loadYmmData() {
  if (_ymmData) return Promise.resolve(_ymmData);
  const url = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.ymmUrl) || '/wp-content/plugins/rme-kit-builder/assets/data/ymm.json';
  return fetch(url).then(r => r.json()).then(d => { _ymmData = d; return d; });
}

let _mountsData = null;
function loadMountsData() {
  if (_mountsData) return Promise.resolve(_mountsData);
  const url = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.mountsUrl) || '/wp-content/plugins/rme-kit-builder/assets/data/vehicle-mounts.json';
  return fetch(url).then(r => r.json()).then(d => { _mountsData = d; return d; }).catch(() => { _mountsData = { mounts: [], fallback: null }; return _mountsData; });
}

function findVehicleMounts(year, make, model) {
  if (!_mountsData || !_mountsData.mounts) return [];
  const y = parseInt(year);
  return _mountsData.mounts.filter(m =>
    m.fits.some(f =>
      f.make.toLowerCase() === (make || '').toLowerCase() &&
      (model || '').toLowerCase().includes(f.model.toLowerCase()) &&
      y >= f.yearMin && y <= f.yearMax
    )
  );
}

function renderMobileVehicle() {
  loadMountsData(); // preload mounts data for antenna step
  const c = document.getElementById('mobile-step-content');
  const v = mobileState.vehicle || { year: '', make: '', model: '' };
  const selStyle = 'background:#111;border:1px solid #2a2a2a;color:#e0e0e0;padding:10px;width:100%;font-size:14px;border-radius:4px;appearance:auto';

  c.innerHTML = `
    <div class="section-head"><h2>Your Vehicle</h2><p>Tell us about your vehicle so we can recommend the right mounts and antenna setup.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <div class="field-row" style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:80px"><label style="font-size:12px;color:#c4a83a;display:block;margin-bottom:4px">Year</label><select id="mv-year" style="${selStyle};width:100%" onchange="ymmYearChanged()"><option value="">Year</option></select></div>
        <div style="flex:2;min-width:120px"><label style="font-size:12px;color:#c4a83a;display:block;margin-bottom:4px">Make</label><select id="mv-make" style="${selStyle};width:100%" onchange="ymmMakeChanged()" disabled><option value="">Make</option></select></div>
        <div style="flex:2;min-width:120px"><label style="font-size:12px;color:#c4a83a;display:block;margin-bottom:4px">Model</label><select id="mv-model" style="${selStyle};width:100%" onchange="ymmModelChanged()" disabled><option value="">Model</option></select></div>
      </div>
      <div style="font-size:12px;color:#888;margin-top:8px">We use this to check for vehicle-specific mounting options.</div>
      <div style="margin-top:8px">
        <label style="font-size:12px;cursor:pointer;color:#c4a83a">
          <input type="checkbox" id="mv-unlisted" ${v.unlisted ? 'checked' : ''} onchange="toggleVehicleUnlisted()" style="margin-right:6px;accent-color:#fdd351">
          My vehicle isn't listed
        </label>
      </div>
      ${v.unlisted ? `
      <div style="margin-top:8px">
        <input type="text" id="mv-custom" value="${v.custom || ''}" placeholder="e.g. 2008 Ford F-350 Super Duty"
          style="${selStyle};width:100%" oninput="mobileState.vehicle.custom=this.value">
        <div style="font-size:11px;color:#888;margin-top:4px">We'll log this so we can add your vehicle to our database.</div>
      </div>
      ` : ''}
      <div style="margin-top:16px">
        <label style="font-size:12px;color:#c4a83a;display:block;margin-bottom:8px">Radio mounting preference:</label>
        <div class="nq-option ${(mobileState.selections.radioMount === 'ramwedge') ? 'selected' : ''}" onclick="mobileState.selections.radioMount='ramwedge';renderMobileVehicle()">
          <div class="nq-check">${mobileState.selections.radioMount === 'ramwedge' ? '✓' : ''}</div>
          <div><div class="nq-label">RAM Tough Wedge, No-drill mount ($139)</div><div class="nq-detail">Wedge-style seat/console mount. No modifications to your vehicle.</div></div>
        </div>
        <div class="nq-option ${(mobileState.selections.radioMount === 'self') ? 'selected' : ''}" onclick="mobileState.selections.radioMount='self';renderMobileVehicle()">
          <div class="nq-check">${mobileState.selections.radioMount === 'self' ? '✓' : ''}</div>
          <div><div class="nq-label">I'll mount it myself / use the included bracket</div><div class="nq-detail">Kit includes a basic mounting bracket and screws.</div></div>
        </div>
      </div>
    </div>
  `;

  // Load YMM data and populate dropdowns
  loadYmmData().then(ymm => {
    const yearSel = document.getElementById('mv-year');
    const years = Object.keys(ymm).sort((a,b) => b - a);
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === v.year) opt.selected = true;
      yearSel.appendChild(opt);
    });
    // If year was pre-selected, populate makes
    if (v.year && ymm[v.year]) {
      populateMakes(ymm, v.year, v.make);
      if (v.make && ymm[v.year][v.make]) {
        populateModels(ymm, v.year, v.make, v.model);
      }
    }
  });
}

function populateMakes(ymm, year, selectedMake) {
  const makeSel = document.getElementById('mv-make');
  makeSel.innerHTML = '<option value="">Select make</option>';
  makeSel.disabled = false;
  const makes = Object.keys(ymm[year] || {}).sort();
  makes.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    if (m === selectedMake) opt.selected = true;
    makeSel.appendChild(opt);
  });
}

function populateModels(ymm, year, make, selectedModel) {
  const modelSel = document.getElementById('mv-model');
  modelSel.innerHTML = '<option value="">Select model</option>';
  modelSel.disabled = false;
  const models = (ymm[year] && ymm[year][make]) || [];
  models.sort().forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    if (m === selectedModel) opt.selected = true;
    modelSel.appendChild(opt);
  });
}

function ymmYearChanged() {
  const year = document.getElementById('mv-year').value;
  mobileState.vehicle = { year: year, make: '', model: '' };
  document.getElementById('mv-make').innerHTML = '<option value="">Select make</option>';
  document.getElementById('mv-model').innerHTML = '<option value="">Select model</option>';
  document.getElementById('mv-model').disabled = true;
  if (year && _ymmData && _ymmData[year]) {
    populateMakes(_ymmData, year, '');
  } else {
    document.getElementById('mv-make').disabled = true;
  }
}

function ymmMakeChanged() {
  const year = document.getElementById('mv-year').value;
  const make = document.getElementById('mv-make').value;
  mobileState.vehicle = { year: year, make: make, model: '' };
  document.getElementById('mv-model').innerHTML = '<option value="">Select model</option>';
  if (year && make && _ymmData && _ymmData[year] && _ymmData[year][make]) {
    populateModels(_ymmData, year, make, '');
  } else {
    document.getElementById('mv-model').disabled = true;
  }
}

function ymmModelChanged() {
  const year = document.getElementById('mv-year').value;
  const make = document.getElementById('mv-make').value;
  const model = document.getElementById('mv-model').value;
  mobileState.vehicle = { year: year, make: make, model: model };
}

function toggleVehicleUnlisted() {
  const checked = document.getElementById('mv-unlisted').checked;
  mobileState.vehicle.unlisted = checked;
  if (!checked) mobileState.vehicle.custom = '';
  renderMobileVehicle();
}

function logUnlistedVehicle(vehicleText) {
  if (!vehicleText || !vehicleText.trim()) return;
  const url = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.ajaxUrl) || '/wp-admin/admin-ajax.php';
  const nonce = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.nonce) || '';
  const fd = new FormData();
  fd.append('action', 'rme_kb_log_vehicle');
  fd.append('nonce', nonce);
  fd.append('vehicle', vehicleText.trim());
  fetch(url, { method: 'POST', body: fd }).catch(() => {});
}

function renderMobileAntenna() {
  const c = document.getElementById('mobile-step-content');
  const v = mobileState.vehicle || {};
  const sel = mobileState.selections;
  if (!sel.antennaMount) sel.antennaMount = null;
  if (!sel.antenna) sel.antenna = null;

  // Check vehicle-mounts.json for vehicle-specific fender mount recommendations
  const matchedMounts = findVehicleMounts(v.year, v.make, v.model);
  const fenderMount = matchedMounts.find(m => m.type === 'fender');
  const hasFenderMount = !!fenderMount;

  let mountOptions = [];
  if (hasFenderMount) {
    mountOptions.push({
      key: 'fender-matched', highlight: true, fenderMountData: fenderMount,
      label: `⭐ Recommended: ${fenderMount.name} ($${fenderMount.price})`,
      detail: `${fenderMount.desc} Pair with NMO coax cable ($49) for a complete install — $78 total.`
    });
  }
  mountOptions.push({ key: 'lipmount-nmo', highlight: !hasFenderMount, label: (hasFenderMount ? '' : '⭐ Recommended: ') + 'Lip Mount NMO ($99)', detail: 'Most stable universal option. Mounts on trunk/hood lip without drilling. Includes 16ft coax.' });
  mountOptions.push({ key: 'magmount-nmo', highlight: false, label: 'Magnetic Mount NMO ($39)', detail: 'Easy removal, best if you frequently remove the antenna. Less stable than permanent mounts.' });
  mountOptions.push({ key: 'roofrack', highlight: false, label: 'Roof Rack Mount ($59)', detail: 'Comet RS-660U. Clamps to roof rack bars (up to 2.25" x 2").' });

  c.innerHTML = `
    <div class="section-head"><h2>Antenna & Mount</h2><p>Your mobile radio needs an external antenna for best performance. We'll help you pick the right mount for your vehicle.</p></div>
    <div style="max-width:600px;margin:0 auto">
      <label style="font-size:14px;color:var(--gold);display:block;margin-bottom:8px">Antenna Mount</label>
      ${mountOptions.map(m => `
        <div class="nq-option ${sel.antennaMount === m.key ? 'selected' : ''}" onclick="mobileState.selections.antennaMount='${m.key}';${m.fenderMountData ? `mobileState.selections.fenderMountData=${JSON.stringify(m.fenderMountData)};` : 'mobileState.selections.fenderMountData=null;'}renderMobileAntenna()">
          <div class="nq-check">${sel.antennaMount === m.key ? '✓' : ''}</div>
          <div>
            <div class="nq-label">${m.highlight ? '⭐ ' : ''}${m.label}</div>
            <div class="nq-detail">${m.detail}</div>
          </div>
        </div>
      `).join('')}

      <label style="font-size:14px;color:var(--gold);display:block;margin:20px 0 8px">Antenna</label>
      ${mobileProducts.vehicleAntennas.map(a => `
        <div class="nq-option ${sel.antenna === a.key ? 'selected' : ''}" onclick="mobileState.selections.antenna='${a.key}';renderMobileAntenna()">
          <div class="nq-check">${sel.antenna === a.key ? '✓' : ''}</div>
          <div>
            <div class="nq-label">${a.name} ($${a.price})${a.recommended ? ' <span style="font-size:10px;padding:2px 6px;background:#1a1800;border:1px solid var(--rme-gold);color:var(--rme-gold);border-radius:3px;margin-left:6px">⭐ Recommended</span>' : ''}</div>
            <div class="nq-detail">${a.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMobilePower() {
  const c = document.getElementById('mobile-step-content');
  const sel = mobileState.selections;
  if (!sel.power) sel.power = { cigAdapter: true, lifepo4: false, lifepo4Size: '20ah', acCharger: false, dcCharger: false, cables: [] };

  c.innerHTML = `
    <div class="section-head"><h2>Power</h2><p>Choose how you'll power your vehicle radio. The cigarette lighter adapter is included by default, the quickest way to get on the air.</p></div>
    <div style="max-width:600px;margin:0 auto">

      <div class="nq-option selected" style="opacity:0.85;cursor:default;border-color:var(--green)">
        <div class="nq-check" style="border-color:var(--green);color:var(--green)">✓</div>
        <div style="flex:1">
          <div class="nq-label">Cigarette Lighter Power Adapter <span style="font-size:11px;color:var(--green);font-weight:400">Included</span></div>
          <div class="nq-detail">Plug-and-play 12V power from any vehicle accessory outlet. The fastest way to get started.</div>
          <div style="font-size:11px;color:#c4a83a;margin-top:6px;line-height:1.4">Note: May not be sufficient at high power on low-amperage circuits. For best performance, we suggest hardwiring to a keyed ignition source or using a secondary battery with a DC-to-DC charger.</div>
        </div>
      </div>

      <label style="font-size:14px;color:var(--gold);display:block;margin:20px 0 8px">Portable Power</label>

      <div class="nq-option ${sel.power.lifepo4 ? 'selected' : ''}" onclick="mobileState.selections.power.lifepo4=!mobileState.selections.power.lifepo4;renderMobilePower()" style="flex-wrap:wrap">
        <div class="nq-check">${sel.power.lifepo4 ? '✓' : ''}</div>
        <div style="flex:1;min-width:200px">
          <div class="nq-label">LiFePO4 Battery + DC-to-DC Vehicle Charger</div>
          <div class="nq-detail">Portable 12V power. Run your radio without the engine running. Includes a DC-to-DC charger that keeps the battery topped off from your vehicle's auxiliary circuit. Do not connect charger to starter battery.</div>
        </div>
        <div style="font-weight:700;color:var(--gold);font-size:14px;white-space:nowrap">${sel.power.lifepo4Size === '20ah' ? '$228' : '$208'}</div>
      </div>
      ${sel.power.lifepo4 ? `
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:-4px 0 8px 16px">
        <div class="nq-option ${sel.power.lifepo4Size === '20ah' ? 'selected' : ''}" onclick="mobileState.selections.power.lifepo4Size='20ah';renderMobilePower()" style="flex:1;justify-content:center;padding:10px">
          <div><div class="nq-label" style="text-align:center">20Ah ($228)</div><div class="nq-detail" style="text-align:center">Recommended, longer runtime</div></div>
        </div>
        <div class="nq-option ${sel.power.lifepo4Size === '10ah' ? 'selected' : ''}" onclick="mobileState.selections.power.lifepo4Size='10ah';renderMobilePower()" style="flex:1;justify-content:center;padding:10px">
          <div><div class="nq-label" style="text-align:center">10Ah ($208)</div><div class="nq-detail" style="text-align:center">Lighter, compact</div></div>
        </div>
      </div>
      <div class="nq-option ${sel.power.acCharger ? 'selected' : ''}" onclick="mobileState.selections.power.acCharger=!mobileState.selections.power.acCharger;renderMobilePower()" style="margin:-4px 0 8px 16px">
        <div class="nq-check">${sel.power.acCharger ? '✓' : ''}</div>
        <div style="flex:1">
          <div class="nq-label">Add AC Wall Charger ($29)</div>
          <div class="nq-detail">Charge your LiFePO4 battery at home from any wall outlet. Recommended if you won't always have vehicle charging available.</div>
        </div>
      </div>
      ` : ''}

      <div class="nq-option ${sel.power.dcCharger ? 'selected' : ''}" onclick="mobileState.selections.power.dcCharger=!mobileState.selections.power.dcCharger;renderMobilePower()">
        <div class="nq-check">${sel.power.dcCharger ? '✓' : ''}</div>
        <div style="flex:1">
          <div class="nq-label">DC-to-DC Vehicle Charger Only ($99)</div>
          <div class="nq-detail">Already have a LiFePO4 battery? Add just the vehicle charger. Charges from auxiliary battery circuit. Do not connect to starter battery.</div>
        </div>
      </div>

      <label style="font-size:14px;color:var(--gold);display:block;margin:20px 0 8px">Wiring & Cables</label>
      ${mobileProducts.powerCables.map(p => `
        <div class="nq-option ${sel.power.cables.includes(p.key) ? 'selected' : ''}" onclick="toggleMobilePowerCable('${p.key}')">
          <div class="nq-check">${sel.power.cables.includes(p.key) ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="nq-label">${p.name} ($${p.price})</div>
            <div class="nq-detail">${p.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleMobilePowerCable(key) {
  const arr = mobileState.selections.power.cables;
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
  renderMobilePower();
}

function renderMobileAccessories() {
  const c = document.getElementById('mobile-step-content');
  const sel = mobileState.selections;
  if (!sel.accessories) sel.accessories = [];
  const rk = mobileState.radioKey;
  const filtered = mobileProducts.accessories.filter(a => !a.compatRadios || a.compatRadios.includes(rk));

  c.innerHTML = `
    <div class="section-head"><h2>Accessories</h2><p>Add speakermics, cable management, and more to complete your mobile setup.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${filtered.map(a => `
        <div class="nq-option ${sel.accessories.includes(a.key) ? 'selected' : ''}" onclick="toggleMobileAccessory('${a.key}')">
          <div class="nq-check">${sel.accessories.includes(a.key) ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="nq-label">${a.name} ($${a.price})</div>
            <div class="nq-detail">${a.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleMobileAccessory(key) {
  const arr = mobileState.selections.accessories;
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
  renderMobileAccessories();
}

function renderMobileProgramming() {
  const c = document.getElementById('mobile-step-content');
  const radio = mobileRadioLineup.find(r => r.key === mobileState.radioKey);
  const isDMR = radio && radio.digital;
  const sel = mobileState.selections;
  if (!sel.programming) {
    const prior = getPriorProgramming();
    if (prior) {
      programmingChoice = prior.choice || 'standard';
      progUseShipping = prior.useShipping !== undefined ? prior.useShipping : true;
      progZipPrimary = prior.zip || '';
      progZipsExtra = prior.zipsExtra ? [...prior.zipsExtra] : [];
      progBrandmeisterId = prior.brandmeisterId || '';
    }
    sel.programming = { synced: true };
  }

  // Render the full programming UI into mobile step content
  const progContainer = document.createElement('div');
  progContainer.id = 'mobile-programming-options';
  c.innerHTML = '';
  c.appendChild(progContainer);

  // Use the shared programming renderer with mobile radio context
  renderProgramming({ radioKey: mobileState.radioKey, _container: 'mobile-programming-options' });

  // Add itinerant license option (only if not already added in a prior kit)
  if (!wantsItinerantLicense) {
    const licDiv = document.createElement('div');
    licDiv.style.cssText = 'margin-top:16px;max-width:600px;margin-left:auto;margin-right:auto';
    licDiv.innerHTML = `
      <div class="nq-option" onclick="wantsItinerantLicense=true;renderMobileProgramming()">
        <div class="nq-check"></div>
        <div style="flex:1">
          <div class="nq-label">Business Itinerant License Assistance ($579)</div>
          <div class="nq-detail">We'll help you obtain your FCC Business Itinerant license, valid for 10 years. Required for commercial Part 90 operation. One license covers all radios in your order.</div>
        </div>
      </div>
    `;
    c.appendChild(licDiv);
  } else {
    const licNote = document.createElement('div');
    licNote.style.cssText = 'margin-top:16px;max-width:600px;margin-left:auto;margin-right:auto;font-size:13px;color:#4caf50;padding:12px;background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px';
    licNote.textContent = '✓ Business Itinerant License Assistance already included in your order.';
    c.appendChild(licNote);
  }
}

function renderMobileReview() {
  // Log unlisted vehicle if applicable
  if (mobileState.vehicle && mobileState.vehicle.unlisted && mobileState.vehicle.custom) {
    logUnlistedVehicle(mobileState.vehicle.custom);
  }
  const c = document.getElementById('mobile-step-content');
  const radio = mobileRadioLineup.find(r => r.key === mobileState.radioKey);
  const sel = mobileState.selections;

  let items = [{ name: radio.name, price: radio.price, id: radio.id }];
  let total = radio.price;

  // Radio mount
  if (sel.radioMount === 'ramwedge') {
    const p = mobileProducts.vehicleMounts.find(m => m.key === 'ramwedge');
    items.push({ name: p.name, price: p.price, id: p.id }); total += p.price;
  }

  // Antenna mount
  if (sel.antennaMount) {
    if (sel.antennaMount === 'fender-matched' && sel.fenderMountData) {
      // Fender mount from vehicle-mounts.json + bundled NMO coax
      const fm = sel.fenderMountData;
      items.push({ name: fm.name, price: fm.price, id: fm.wcProductId }); total += fm.price;
      const coax = mobileProducts.nmoCoax.find(c => c.key === 'nmo-coax');
      if (coax) { items.push({ name: coax.name + ' (bundle)', price: coax.price, id: coax.id }); total += coax.price; }
    } else {
      const m = mobileProducts.antennaMounts.find(a => a.key === sel.antennaMount);
      if (m) { items.push({ name: m.name, price: m.price, id: m.id }); total += m.price; }
    }
  }

  // Antenna
  if (sel.antenna) {
    const a = mobileProducts.vehicleAntennas.find(x => x.key === sel.antenna);
    if (a) { items.push({ name: a.name, price: a.price, id: a.id }); total += a.price; }
  }

  // Power
  const pw = sel.power || {};
  if (pw.cigAdapter) {
    items.push({ name: 'Cigarette Lighter Power Adapter', price: 0 });
  }
  if (pw.lifepo4) {
    const is20 = pw.lifepo4Size === '20ah';
    const bat = mobileProducts.power.find(x => x.key === (is20 ? 'lifepo4-20ah' : 'lifepo4-10ah'));
    const charger = mobileProducts.power.find(x => x.key === 'charger-dc');
    if (bat) { items.push({ name: bat.name, price: bat.price, id: bat.id }); total += bat.price; }
    if (charger) { items.push({ name: charger.name + ' (bundled)', price: charger.price, id: charger.id }); total += charger.price; }
    if (pw.acCharger) {
      const ac = mobileProducts.power.find(x => x.key === 'charger-ac');
      if (ac) { items.push({ name: ac.name, price: ac.price, id: ac.id }); total += ac.price; }
    }
  }
  if (pw.dcCharger && !pw.lifepo4) {
    const charger = mobileProducts.power.find(x => x.key === 'charger-dc');
    if (charger) { items.push({ name: charger.name, price: charger.price, id: charger.id }); total += charger.price; }
  }
  (pw.cables || []).forEach(key => {
    const p = mobileProducts.powerCables.find(x => x.key === key);
    if (p) { items.push({ name: p.name, price: p.price, id: p.id }); total += p.price; }
  });

  // Accessories
  (sel.accessories || []).forEach(key => {
    const a = mobileProducts.accessories.find(x => x.key === key);
    if (a) {
      const accId = resolveVariationId(a.id, { radioKey: mobileState.radioKey });
      items.push({ name: a.name, price: a.price, id: accId }); total += a.price;
    }
  });

  // Business license handled globally via wantsItinerantLicense

  mobileState.cartItems = items;

  c.innerHTML = `
    <div class="section-head"><h2>Review Your Mobile Kit</h2><p>${radio.name}, customized and ready to go.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span style="color:#ddd">${item.name}</span>
          <span style="color:var(--gold);font-weight:600">$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:700">
        <span style="color:var(--gold)">Total</span>
        <span style="color:var(--gold)">$${total.toFixed(2)}</span>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════
// ── BASE STATION FLOW ──
// ══════════════════════════════════════════════════════

let baseState = {};

function startBaseFlow() {
  scrollToTop();
  hideAllPhases();
  showConsultationFooter();
  baseState = { radioKey: null, antennaPath: null, selections: {}, cartItems: [], step: 0 };
  document.getElementById('base-phase').style.display = 'block';
  document.getElementById('base-phase').innerHTML = '';
  renderBaseRadioChoice();
  animatePhase('base-phase');
}

function renderBaseRadioChoice() {
  const phase = document.getElementById('base-phase');
  const prefs = kitSession.preferences;
  const hasDigitalPref = prefs.includes('digital') || prefs.includes('crossband');
  const hasSimplePref = prefs.includes('simple') || prefs.includes('budget');
  const hasWaterproofPref = prefs.includes('waterproof');
  const recommended = getRecommendedBaseRadio();

  function getBaseBadge(r) {
    if (recommended === r.key) {
      const done = getCompletedRadioKeys();
      if (done.mobile.length > 0) return '⭐ Recommended: matches your vehicle radio';
      const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
      if (dmrHandhelds.length > 0) return '⭐ Recommended: matches your DMR handhelds';
      if (hasWaterproofPref) return '⭐ Recommended: IP54 water resistant';
      return '⭐ Recommended';
    }
    if (hasDigitalPref && r.digital) return '⭐ Recommended for digital/privacy';
    if (hasSimplePref && !r.digital) return '⭐ Recommended for simplicity';
    return '';
  }

  // Determine primary recommendation for ordering
  const primary = recommended || (hasSimplePref ? 'uv50pro' : (hasDigitalPref ? 'd578' : 'uv50pro'));
  const sorted = [...mobileRadioLineup].sort((a, b) => (a.key === primary ? -1 : b.key === primary ? 1 : 0));

  phase.innerHTML = `
    <div class="selector-landing" style="text-align:center">
      <h2>Choose Your Base Station Radio</h2>
      <p>Same radios as our vehicle mobile kits, paired with base station accessories for a fixed-location setup.</p>
      <div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center;max-width:800px;margin:24px auto 0">
        ${sorted.map(r => {
          const badge = getBaseBadge(r);
          const isPrimary = r.key === primary;
          return `
          <div class="radio-pick ${baseState.radioKey === r.key ? 'selected' : ''}" onclick="selectBaseRadio('${r.key}')"
               style="flex:1;min-width:min(280px,100%);max-width:360px;text-align:center;padding:24px 20px;${isPrimary ? 'border-color:var(--rme-gold)' : ''}">
            ${badge ? `<div style="font-size:11px;padding:4px 10px;background:#1a1800;border:1px solid var(--rme-gold);color:var(--rme-gold);display:inline-block;margin-bottom:12px;border-radius:4px">${badge}</div>` : '<div style="height:27px"></div>'}
            <div class="rp-img" style="margin:0 auto 12px"><img src="${r.img || ''}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'"></div>
            <h4 style="color:var(--rme-gold);margin-bottom:4px">${r.name.replace(' Essentials Kit','').replace(' Mobile Radio Kit','')}</h4>
            <div style="font-size:13px;color:#c4a83a;margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:20px;font-weight:700;color:var(--rme-gold);margin-bottom:12px">$${r.price}</div>
            <div style="font-size:13px;color:#ddd;line-height:1.6;text-align:left;margin-bottom:12px">${r.pitch}</div>
            <ul style="text-align:left;font-size:12px;color:#ccc;padding-left:16px;margin:0 0 16px">${r.features.map(f=>'<li style="padding:2px 0">'+f+'</li>').join('')}</ul>
            <button class="rc-btn" onclick="event.stopPropagation();selectBaseRadio('${r.key}')" ${!isPrimary ? 'style="background:var(--card);color:var(--text);border:1px solid var(--border)"' : ''}>${isPrimary ? 'Select This Radio →' : 'Choose This Instead →'}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="needs-btns" style="margin-top:24px">
        <button class="btn-nav btn-back" onclick="backToKitPlan()">← Back</button>
      </div>
    </div>
  `;
}

function selectBaseRadio(key) {
  baseState.radioKey = key;
  baseState.step = 0;
  if (kitSession.kits[kitSession.currentKitIndex]) kitSession.kits[kitSession.currentKitIndex].radioKey = key;
  renderBaseWizard();
}

function getBaseSteps() {
  return [
    { name: 'Antenna', render: renderBaseAntennaPath },
    { name: 'Install', render: renderBaseInstallMethod },
    { name: 'Coax', render: renderBaseCoax },
    { name: 'Power', render: renderBasePower },
    { name: 'Accessories', render: renderBaseAccessories },
    { name: 'Programming', render: renderBaseProgramming },
    { name: 'Review', render: renderBaseReview },
  ];
}

function renderBaseWizard() {
  const phase = document.getElementById('base-phase');
  const radio = mobileRadioLineup.find(r => r.key === baseState.radioKey);
  const steps = getBaseSteps();
  const step = steps[baseState.step];

  phase.innerHTML = `
    <div class="hero" style="margin-bottom:20px">
      <div class="hero-img" style="max-width:200px">
        <img src="${radio.img || ''}" alt="${radio.name}" onerror="this.parentElement.innerHTML='📻'" style="width:100%">
      </div>
      <div class="hero-info">
        <h1 style="font-size:22px">${radio.name}: Base Station</h1>
        <div class="base-price">$${radio.price}.00</div>
      </div>
    </div>
    <div class="step-labels" style="margin-bottom:16px">
      ${steps.map((s, i) => `<div class="step-label ${i === baseState.step ? 'active' : ''}" onclick="baseState.step=${i};renderBaseWizard()">${s.name}</div>`).join('')}
    </div>
    <div id="base-step-content"></div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px">
      ${baseState.step > 0 ? '<button class="btn-nav btn-back" onclick="baseState.step--;renderBaseWizard();scrollToTop()">← Back</button>' : '<button class="btn-nav btn-back" onclick="baseState.radioKey=null;renderBaseRadioChoice()">← Change Radio</button>'}
      <button class="btn-nav btn-next" onclick="advanceBaseStep()">
        ${baseState.step < steps.length - 1 ? 'Next: ' + steps[baseState.step + 1].name + ' →' : 'Save Kit & Continue →'}
      </button>
    </div>
  `;
  step.render();
}

function advanceBaseStep() {
  const steps = getBaseSteps();
  if (baseState.step < steps.length - 1) { baseState.step++; renderBaseWizard(); scrollToTop(); }
  else completeCurrentKit(baseState.cartItems, baseState.selections.programming);
}

function renderBaseAntennaPath() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.antennaPath) sel.antennaPath = null;

  const quick = baseProducts.antennaPath.quick;
  const perm = baseProducts.antennaPath.permanent;

  c.innerHTML = `
    <div class="section-head"><h2>Antenna Setup</h2><p>Choose between a quick-deploy portable base or a permanent mast-mounted antenna.</p></div>
    <div style="max-width:600px;margin:0 auto">
      <div class="nq-option ${sel.antennaPath === 'quick' ? 'selected' : ''}" onclick="baseState.selections.antennaPath='quick';renderBaseAntennaPath()" style="align-items:flex-start">
        <div class="nq-check">${sel.antennaPath === 'quick' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">${quick.label}</div>
          <div class="nq-detail">${quick.desc}</div>
          <div style="margin-top:8px;font-size:12px;color:var(--muted)">
            ${quick.items.map(i => `${i.name} ($${i.price})`).join('<br>')}
            <br>+ coax cable (next step)
          </div>
        </div>
      </div>
      <div class="nq-option ${sel.antennaPath === 'permanent' ? 'selected' : ''}" onclick="baseState.selections.antennaPath='permanent';renderBaseAntennaPath()" style="align-items:flex-start">
        <div class="nq-check">${sel.antennaPath === 'permanent' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">${perm.label}</div>
          <div class="nq-detail">${perm.desc}</div>
        </div>
      </div>

      ${sel.antennaPath === 'permanent' ? `
        <div style="margin-top:16px;padding:16px;border:1px solid var(--border);background:var(--card)">
          <label style="font-size:14px;color:var(--gold);display:block;margin-bottom:8px">Base Antenna</label>
          ${perm.antennas.map(a => `
            <div class="nq-option ${sel.baseAntenna === a.key ? 'selected' : ''}" onclick="baseState.selections.baseAntenna='${a.key}';renderBaseAntennaPath()">
              <div class="nq-check">${sel.baseAntenna === a.key ? '✓' : ''}</div>
              <div>
                <div class="nq-label">${a.name} ($${a.price})${a.recommended ? ' <span style="font-size:10px;padding:2px 6px;background:#1a1800;border:1px solid var(--rme-gold);color:var(--rme-gold);border-radius:3px;margin-left:6px">⭐ Recommended</span>' : ''}</div>
                <div class="nq-detail">${a.desc}</div>
              </div>
            </div>
          `).join('')}

          <label style="font-size:14px;color:var(--gold);display:block;margin:16px 0 8px">Mast Mount</label>
          ${perm.mounts.map(m => `
            <div class="nq-option ${sel.mastMount === m.key ? 'selected' : ''}" onclick="baseState.selections.mastMount='${m.key}';renderBaseAntennaPath()">
              <div class="nq-check">${sel.mastMount === m.key ? '✓' : ''}</div>
              <div><div class="nq-label">${m.name} ($${m.price})</div><div class="nq-detail">${m.desc}</div></div>
            </div>
          `).join('')}
          <div style="font-size:11px;color:#888;margin-top:8px">More mounting options (gable, standoff, wall mounts) coming soon.</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderBaseInstallMethod() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.installMethod) sel.installMethod = null;

  c.innerHTML = `
    <div class="section-head"><h2>Installation Method</h2><p>How will you route the coax cable from your radio to the antenna?</p></div>
    <div style="max-width:600px;margin:0 auto">
      <div class="nq-option ${sel.installMethod === 'direct' ? 'selected' : ''}" onclick="baseState.selections.installMethod='direct';renderBaseInstallMethod()" style="align-items:flex-start">
        <div class="nq-check">${sel.installMethod === 'direct' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">Single Coax Run (Through Wall or Attic)</div>
          <div class="nq-detail">One continuous cable from your radio to the antenna. May require drilling through a wall, routing through an attic, crawlspace, or conduit. Best signal quality with no adapters in the path.</div>
        </div>
      </div>
      <div class="nq-option ${sel.installMethod === 'window' ? 'selected' : ''}" onclick="baseState.selections.installMethod='window';renderBaseInstallMethod()" style="align-items:flex-start">
        <div class="nq-check">${sel.installMethod === 'window' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">Window or Door Passthrough ($69)</div>
          <div class="nq-detail">Flat coax jumper passes through a closed window or door. No drilling required. Uses two shorter coax runs: one from your radio to the window (interior), and one from the window to the antenna (exterior).</div>
        </div>
      </div>
    </div>
  `;
}

function renderBaseCoax() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  const isWindow = sel.installMethod === 'window';
  const isSlimJim = sel.baseAntenna === 'slimjim';

  // Skip coax for Slim Jim with direct install (it includes 16ft)
  if (isSlimJim && !isWindow) {
    if (!sel.coax) sel.coax = { grade: 'none', length: 0 };
    sel.coax.grade = 'none';
    c.innerHTML = `
      <div class="section-head"><h2>Coax Cable</h2><p>Your Slim Jim antenna includes 16ft of coax.</p></div>
      <div style="max-width:500px;margin:0 auto">
        <div style="padding:16px;background:#1a1800;border:1px solid var(--rme-gold-dim);border-radius:8px;text-align:center">
          <div style="font-size:14px;color:#ddd">16ft included with Slim Jim antenna</div>
          <div style="font-size:12px;color:#888;margin-top:8px">If you need additional length, you can add coax from our accessories page after checkout.</div>
        </div>
      </div>
    `;
    return;
  }

  if (isWindow) {
    if (!sel.coax) sel.coax = { grade: '400uf', interiorLength: 10, exteriorLength: 25 };
    if (!sel.coax.interiorLength) sel.coax.interiorLength = 10;
    if (!sel.coax.exteriorLength) sel.coax.exteriorLength = 25;
  } else {
    if (!sel.coax) sel.coax = { grade: '400uf', length: 25 };
  }

  const grade = sel.coax.grade;

  let lengthHtml = '';
  let priceHtml = '';

  if (isWindow) {
    const intLen = sel.coax.interiorLength;
    const extLen = sel.coax.exteriorLength;
    const intCalc = calcCoaxTiered(intLen, grade);
    const extCalc = calcCoaxTiered(extLen, grade);
    const totalCoax = intCalc.total + extCalc.total + 69; // +window jumper

    lengthHtml = `
      <label style="font-size:14px;color:var(--gold);display:block;margin:20px 0 8px">Interior Run (Radio to Window)</label>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <input type="range" min="3" max="50" step="1" value="${intLen}"
          style="flex:1;accent-color:var(--gold)"
          oninput="baseState.selections.coax.interiorLength=parseInt(this.value);renderBaseCoax()">
        <input type="number" min="1" max="100" value="${intLen}"
          style="width:60px;background:#111;border:1px solid var(--border);color:var(--gold);padding:6px;text-align:center;font-size:16px;font-weight:700"
          oninput="baseState.selections.coax.interiorLength=Math.max(1,parseInt(this.value)||1);renderBaseCoax()">
        <span style="color:#888;font-size:13px">ft</span>
      </div>

      <label style="font-size:14px;color:var(--gold);display:block;margin:8px 0 8px">Exterior Run (Window to Antenna)</label>
      <div style="display:flex;align-items:center;gap:12px">
        <input type="range" min="5" max="150" step="5" value="${extLen}"
          style="flex:1;accent-color:var(--gold)"
          oninput="baseState.selections.coax.exteriorLength=parseInt(this.value);renderBaseCoax()">
        <input type="number" min="1" max="300" value="${extLen}"
          style="width:60px;background:#111;border:1px solid var(--border);color:var(--gold);padding:6px;text-align:center;font-size:16px;font-weight:700"
          oninput="baseState.selections.coax.exteriorLength=Math.max(1,parseInt(this.value)||1);renderBaseCoax()">
        <span style="color:#888;font-size:13px">ft</span>
      </div>
    `;

    priceHtml = `
      <div style="margin-top:16px;padding:12px;background:#1a1800;border:1px solid var(--rme-gold-dim);text-align:center;border-radius:8px">
        <div style="font-size:12px;color:#ddd">Interior: ${intCalc.displayHtml} = $${intCalc.total.toFixed(2)}</div>
        <div style="font-size:12px;color:#ddd">Exterior: ${extCalc.displayHtml} = $${extCalc.total.toFixed(2)}</div>
        <div style="font-size:12px;color:#ddd">Window Jumper: $69.00</div>
        <div style="font-size:20px;font-weight:700;color:var(--rme-gold);margin-top:8px">$${totalCoax.toFixed(2)}</div>
      </div>
    `;
  } else {
    const len = sel.coax.length;
    const calc = calcCoaxTiered(len, grade);

    lengthHtml = `
      <label style="font-size:14px;color:var(--gold);display:block;margin:20px 0 8px">Length (feet)</label>
      <div style="display:flex;align-items:center;gap:12px">
        <input type="range" id="base-coax-slider" min="10" max="150" step="5" value="${len}"
          style="flex:1;accent-color:var(--gold)"
          oninput="baseState.selections.coax.length=parseInt(this.value);document.getElementById('base-coax-input').value=this.value;updateBaseCoaxPrice()">
        <input type="number" id="base-coax-input" min="1" max="300" value="${len}"
          style="width:60px;background:#111;border:1px solid var(--border);color:var(--gold);padding:6px;text-align:center;font-size:16px;font-weight:700"
          oninput="const v=Math.max(1,parseInt(this.value)||1);baseState.selections.coax.length=v;document.getElementById('base-coax-slider').value=Math.min(150,v);updateBaseCoaxPrice()">
        <span style="color:#888;font-size:13px">ft</span>
      </div>
    `;

    priceHtml = `
      <div id="base-coax-price" style="margin-top:16px;padding:12px;background:#1a1800;border:1px solid var(--rme-gold-dim);text-align:center;border-radius:8px">
        <div style="font-size:13px;color:#ddd">${calc.displayHtml}</div>
        <div style="font-size:20px;font-weight:700;color:var(--rme-gold);margin-top:4px">$${calc.total.toFixed(2)}</div>
      </div>
    `;
  }

  c.innerHTML = `
    <div class="section-head"><h2>Coax Cable</h2><p>${isWindow ? 'You\'ll need two coax runs: one from your radio to the window, and one from the window to the antenna.' : 'Connect your radio to the antenna. Measure from where the radio will sit to where the antenna will be mounted.'}</p></div>
    <div style="max-width:500px;margin:0 auto">
      <label style="font-size:14px;color:var(--gold);display:block;margin-bottom:8px">Cable Grade</label>
      <div class="nq-option ${grade === '400uf' ? 'selected' : ''}" onclick="baseState.selections.coax.grade='400uf';renderBaseCoax()">
        <div class="nq-check">${grade === '400uf' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">⭐ 400 Ultra Flex (Recommended)</div>
          <div class="nq-detail">Premium low-loss coax. Best performance, especially for longer runs. $5/ft (≤50ft) or $3.50/ft (>50ft).</div>
        </div>
      </div>
      <div class="nq-option ${grade === '240uf' ? 'selected' : ''}" onclick="baseState.selections.coax.grade='240uf';renderBaseCoax()">
        <div class="nq-check">${grade === '240uf' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">240 Ultra Flex (Budget-friendly)</div>
          <div class="nq-detail">Thinner, more flexible, slightly more signal loss. $3/ft (≤50ft) or $2/ft (>50ft).</div>
        </div>
      </div>
      <div class="nq-option ${grade === 'none' ? 'selected' : ''}" onclick="baseState.selections.coax={grade:'none',length:0};renderBaseCoax()">
        <div class="nq-check">${grade === 'none' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">No Coax — I have my own</div>
          <div class="nq-detail">Skip coax if you already have cable or want to source it separately.</div>
        </div>
      </div>
      ${grade !== 'none' ? `${lengthHtml}${priceHtml}<div style="font-size:11px;color:#888;margin-top:8px">Tip: Add a few extra feet for routing. It's better to have too much than too little.</div>` : ''}
    </div>
  `;
}

function updateBaseCoaxPrice() {
  const sel = baseState.selections;
  const calc = calcCoaxTiered(sel.coax.length, sel.coax.grade);
  document.getElementById('base-coax-price').innerHTML = `
    <div style="font-size:13px;color:#ddd">${calc.displayHtml}</div>
    <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${calc.total.toFixed(2)}</div>
  `;
}

function renderBasePower() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.power) sel.power = null;

  c.innerHTML = `
    <div class="section-head"><h2>Power Supply</h2><p>Your base station needs a 12V power source. We recommend the LiFePO4 battery for most setups. It doubles as emergency backup power.</p></div>
    <div style="max-width:600px;margin:0 auto">
      <div class="nq-option ${sel.power === 'lifepo4' ? 'selected' : ''}" onclick="baseState.selections.power='lifepo4';renderBasePower()" style="align-items:flex-start">
        <div class="nq-check">${sel.power === 'lifepo4' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">⭐ Recommended: 20Ah LiFePO4 Battery + AC Charger ($158)</div>
          <div class="nq-detail">Portable 12V power with AC wall charger. Radio runs off the battery even during a power outage. Recharges from any outlet.</div>
        </div>
      </div>
      <div class="nq-option ${sel.power === 'ac-psu' ? 'selected' : ''}" onclick="baseState.selections.power='ac-psu';renderBasePower()">
        <div class="nq-check">${sel.power === 'ac-psu' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">AC Power Supply ($149)</div>
          <div class="nq-detail">Best if you have whole-home battery backup or generator. No operation during power outage otherwise.</div>
        </div>
      </div>
      <div class="nq-option ${sel.power === 'both' ? 'selected' : ''}" onclick="baseState.selections.power='both';renderBasePower()">
        <div class="nq-check">${sel.power === 'both' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">Both: Battery + AC Power Supply ($307)</div>
          <div class="nq-detail">Battery for emergency/portable use, AC power supply for daily base station operation.</div>
        </div>
      </div>
    </div>
  `;
}

function renderBaseAccessories() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.accessories) sel.accessories = [];
  const rk = baseState.radioKey;
  const filtered = mobileProducts.accessories.filter(a => !a.compatRadios || a.compatRadios.includes(rk));

  c.innerHTML = `
    <div class="section-head"><h2>Accessories</h2><p>Add accessories to complete your base station setup.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${filtered.map(a => `
        <div class="nq-option ${sel.accessories.includes(a.key) ? 'selected' : ''}" onclick="toggleBaseAccessory('${a.key}')">
          <div class="nq-check">${sel.accessories.includes(a.key) ? '✓' : ''}</div>
          <div style="flex:1"><div class="nq-label">${a.name} ($${a.price})</div><div class="nq-detail">${a.desc}</div></div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleBaseAccessory(key) {
  const arr = baseState.selections.accessories;
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
  renderBaseAccessories();
}

function renderBaseProgramming() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.programming) {
    const prior = getPriorProgramming();
    if (prior) {
      programmingChoice = prior.choice || 'standard';
      progUseShipping = prior.useShipping !== undefined ? prior.useShipping : true;
      progZipPrimary = prior.zip || '';
      progZipsExtra = prior.zipsExtra ? [...prior.zipsExtra] : [];
      progBrandmeisterId = prior.brandmeisterId || '';
    }
    sel.programming = { synced: true };
  }

  const progContainer = document.createElement('div');
  progContainer.id = 'base-programming-options';
  c.innerHTML = '';
  c.appendChild(progContainer);
  renderProgramming({ radioKey: baseState.radioKey, _container: 'base-programming-options' });

  if (!wantsItinerantLicense) {
    const licDiv = document.createElement('div');
    licDiv.style.cssText = 'margin-top:16px;max-width:600px;margin-left:auto;margin-right:auto';
    licDiv.innerHTML = `
      <div class="nq-option" onclick="wantsItinerantLicense=true;renderBaseProgramming()">
        <div class="nq-check"></div>
        <div style="flex:1">
          <div class="nq-label">Business Itinerant License Assistance ($579)</div>
          <div class="nq-detail">We'll help you obtain your FCC Business Itinerant license, valid for 10 years. Required for commercial Part 90 operation. One license covers all radios in your order.</div>
        </div>
      </div>
    `;
    c.appendChild(licDiv);
  } else {
    const licNote = document.createElement('div');
    licNote.style.cssText = 'margin-top:16px;max-width:600px;margin-left:auto;margin-right:auto;font-size:13px;color:#4caf50;padding:12px;background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px';
    licNote.textContent = '✓ Business Itinerant License Assistance already included in your order.';
    c.appendChild(licNote);
  }
}

function renderBaseReview() {
  const c = document.getElementById('base-step-content');
  const radio = mobileRadioLineup.find(r => r.key === baseState.radioKey);
  const sel = baseState.selections;
  let items = [{ name: radio.name, price: radio.price, id: radio.id }];
  let total = radio.price;

  // Antenna path
  if (sel.antennaPath === 'quick') {
    baseProducts.antennaPath.quick.items.forEach(i => { items.push({ name: i.name, price: i.price, id: i.id }); total += i.price; });
  } else if (sel.antennaPath === 'permanent') {
    if (sel.baseAntenna) {
      const a = baseProducts.antennaPath.permanent.antennas.find(x => x.key === sel.baseAntenna);
      if (a) {
        items.push({ name: a.name, price: a.price, id: a.id }); total += a.price;
        // Slim Jim needs BNC-F to SO-239 adapter
        if (a.needsBncAdapter) {
          items.push({ name: 'SO-239 to BNC-M Adapter', price: 5, id: 458 }); total += 5;
        }
      }
    }
    if (sel.mastMount && sel.baseAntenna !== 'slimjim') {
      const m = baseProducts.antennaPath.permanent.mounts.find(x => x.key === sel.mastMount);
      if (m) { items.push({ name: m.name, price: m.price, id: m.id }); total += m.price; }
    }
  }

  // Window jumper
  if (sel.installMethod === 'window') {
    items.push({ name: 'Window Jumper Feed-Thru (SO-239 to SO-239)', price: 69, id: 6976 }); total += 69;
  }

  // Coax (tiered pricing)
  if (sel.coax && sel.coax.grade !== 'none') {
    function addCoaxItems(length, grade, prefix) {
      const calc = calcCoaxTiered(length, grade);
      calc.cartItems.forEach(ci => {
        if (prefix) ci.name = prefix + ' ' + ci.name;
        items.push(ci);
      });
      total += calc.total;
    }

    if (sel.installMethod === 'window') {
      if (sel.coax.interiorLength) addCoaxItems(sel.coax.interiorLength, sel.coax.grade, 'Interior');
      if (sel.coax.exteriorLength) addCoaxItems(sel.coax.exteriorLength, sel.coax.grade, 'Exterior');
    } else if (sel.coax.length) {
      addCoaxItems(sel.coax.length, sel.coax.grade, '');
    }
  }

  // Power
  if (sel.power === 'lifepo4' || sel.power === 'both') {
    items.push({ name: '20Ah LiFePO4 Battery', price: 129, id: 6631 }); total += 129;
    items.push({ name: 'LiFePO4 AC Charger', price: 29, id: 6632 }); total += 29;
  }
  if (sel.power === 'ac-psu' || sel.power === 'both') {
    items.push({ name: 'AC to 30A DC Power Supply', price: 149, id: 6969 }); total += 149;
  }

  // Accessories
  (sel.accessories || []).forEach(key => {
    const a = mobileProducts.accessories.find(x => x.key === key);
    if (a) {
      const accId = resolveVariationId(a.id, { radioKey: baseState.radioKey });
      items.push({ name: a.name, price: a.price, id: accId }); total += a.price;
    }
  });

  // Business license handled globally via wantsItinerantLicense

  baseState.cartItems = items;

  c.innerHTML = `
    <div class="section-head"><h2>Review Your Base Station Kit</h2><p>${radio.name}, base station configuration.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span style="color:#ddd">${item.name}</span>
          <span style="color:var(--gold);font-weight:600">$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:700">
        <span style="color:var(--gold)">Total</span>
        <span style="color:var(--gold)">$${total.toFixed(2)}</span>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════
// ── HF FLOW ──
// ══════════════════════════════════════════════════════

let hfState = {};

function startHfFlow() {
  scrollToTop();
  hideAllPhases();
  showConsultationFooter();
  hfState = { radioKey: null, selections: {}, cartItems: [], step: 0 };
  document.getElementById('hf-phase').style.display = 'block';
  document.getElementById('hf-phase').innerHTML = '';
  renderHfRadioChoice();
  animatePhase('hf-phase');
}

function renderHfRadioChoice() {
  const phase = document.getElementById('hf-phase');
  phase.innerHTML = `
    <div class="selector-landing">
      <h2>Choose Your HF Radio</h2>
      <p>HF radios provide long-distance communication, hundreds or thousands of miles depending on conditions and antenna.</p>
      <div class="radio-grid" style="max-width:700px;margin:0 auto">
        ${hfRadioLineup.map(r => `
          <div class="radio-pick ${hfState.radioKey === r.key ? 'selected' : ''} ${r.outOfStock ? '' : ''}" onclick="${r.outOfStock ? '' : `selectHfRadio('${r.key}')`}" style="${r.outOfStock ? 'opacity:0.5;cursor:not-allowed' : ''}">
            <div class="rp-img">${r.img ? `<img src="${r.img}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'">` : '📻'}</div>
            <h4>${r.name.replace(' Mobile Radio Kit','')}</h4>
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:18px;font-weight:700;color:var(--gold);margin-bottom:8px">$${r.price}</div>
            ${r.outOfStock ? '<div style="font-size:11px;padding:4px 8px;background:#3a1111;border:1px solid var(--red);color:var(--red);display:inline-block">Out of Stock</div>' : ''}
            <ul style="text-align:left;font-size:12px;color:#ccc;margin-top:8px;padding-left:16px;margin-bottom:16px">${r.features.map(f=>'<li>'+f+'</li>').join('')}</ul>
            ${r.outOfStock ? '' : `<button class="rc-btn" onclick="event.stopPropagation();selectHfRadio('${r.key}')">Select This Radio →</button>`}
          </div>
        `).join('')}
      </div>
      <div class="needs-btns" style="margin-top:20px">
        <button class="btn-nav btn-back" onclick="backToKitPlan()">← Back to Kit Plan</button>
      </div>
    </div>
  `;
}

function selectHfRadio(key) {
  const radio = hfRadioLineup.find(r => r.key === key);
  if (radio && radio.outOfStock) return; // guard against URL param bypass
  if (kitSession.kits[kitSession.currentKitIndex]) kitSession.kits[kitSession.currentKitIndex].radioKey = key;
  hfState.radioKey = key;
  hfState.step = 0;
  renderHfWizard();
}

function getHfSteps() {
  return [
    { name: 'Antenna', render: renderHfAntenna },
    { name: 'Coax', render: renderHfCoax },
    { name: 'Power', render: renderHfPower },
    { name: 'Accessories', render: renderHfAccessories },
    { name: 'Review', render: renderHfReview },
  ];
}

function renderHfWizard() {
  const phase = document.getElementById('hf-phase');
  const radio = hfRadioLineup.find(r => r.key === hfState.radioKey);
  const steps = getHfSteps();
  const step = steps[hfState.step];

  phase.innerHTML = `
    <div class="hero" style="margin-bottom:20px">
      <div class="hero-img" style="max-width:200px">
        ${radio.img ? `<img src="${radio.img}" alt="${radio.name}" style="width:100%">` : '<div style="font-size:48px;text-align:center">📻</div>'}
      </div>
      <div class="hero-info">
        <h1 style="font-size:22px">${radio.name}</h1>
        <div class="base-price">$${radio.price}.00</div>
        <div style="font-size:13px;color:#ddd;margin-top:8px">Kit includes: radio with MARS/CAP mod, hand mic, mounting bracket, power cable with Powerpoles, cigarette lighter adapter.</div>
      </div>
    </div>
    <div class="step-labels" style="margin-bottom:16px">
      ${steps.map((s, i) => `<div class="step-label ${i === hfState.step ? 'active' : ''}" onclick="hfState.step=${i};renderHfWizard()">${s.name}</div>`).join('')}
    </div>
    <div id="hf-step-content"></div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px">
      ${hfState.step > 0 ? '<button class="btn-nav btn-back" onclick="hfState.step--;renderHfWizard();scrollToTop()">← Back</button>' : '<button class="btn-nav btn-back" onclick="hfState.radioKey=null;renderHfRadioChoice()">← Change Radio</button>'}
      <button class="btn-nav btn-next" onclick="advanceHfStep()">
        ${hfState.step < steps.length - 1 ? 'Next: ' + steps[hfState.step + 1].name + ' →' : 'Save Kit & Continue →'}
      </button>
    </div>
  `;
  step.render();
}

function advanceHfStep() {
  const steps = getHfSteps();
  if (hfState.step < steps.length - 1) { hfState.step++; renderHfWizard(); scrollToTop(); }
  else completeCurrentKit(hfState.cartItems);
}

function renderHfAntenna() {
  const c = document.getElementById('hf-step-content');
  const sel = hfState.selections;
  if (!sel.antenna) sel.antenna = null;

  c.innerHTML = `
    <div class="section-head"><h2>HF Antenna</h2><p>Your HF antenna is the most important part of your station. Pick based on your deployment style and band coverage needs.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${hfProducts.antennas.map(a => `
        <div class="nq-option ${sel.antenna === a.key ? 'selected' : ''}" onclick="hfState.selections.antenna='${a.key}';renderHfAntenna()">
          <div class="nq-check">${sel.antenna === a.key ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="nq-label">${a.name} ($${a.price})</div>
            <div class="nq-detail">${a.desc}</div>
          </div>
        </div>
      `).join('')}
      <div style="font-size:11px;color:#888;margin-top:8px">More HF antenna options coming soon.</div>
    </div>
  `;
}

function renderHfCoax() {
  const c = document.getElementById('hf-step-content');
  const sel = hfState.selections;
  if (!sel.coax) sel.coax = { choice: '400uf', length: 25 };

  const choice = sel.coax.choice;
  const len = sel.coax.length || 25;
  const isCustom = choice === '400uf' || choice === '240uf';
  const coaxCalc = isCustom ? calcCoaxTiered(len, choice) : null;
  const coaxTotal = coaxCalc ? coaxCalc.total : 0;

  c.innerHTML = `
    <div class="section-head"><h2>Coax Cable</h2><p>Connect your radio to the antenna. Choose a cable option or skip if you already have coax.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <div class="nq-option ${choice === '400uf' ? 'selected' : ''}" onclick="hfState.selections.coax.choice='400uf';renderHfCoax()">
        <div class="oc-radio"></div>
        <div style="flex:1"><div class="nq-label">⭐ 400 Ultra Flex (Recommended)</div><div class="nq-detail">Premium low-loss coax. Custom length. $5/ft (≤50ft) or $3.50/ft (>50ft).</div></div>
      </div>
      <div class="nq-option ${choice === '240uf' ? 'selected' : ''}" onclick="hfState.selections.coax.choice='240uf';renderHfCoax()">
        <div class="oc-radio"></div>
        <div style="flex:1"><div class="nq-label">240 Ultra Flex (Budget-friendly)</div><div class="nq-detail">Thinner, more flexible coax. Custom length. $3/ft (≤50ft) or $2/ft (>50ft).</div></div>
      </div>
      <div class="nq-option ${choice === 'rg316' ? 'selected' : ''}" onclick="hfState.selections.coax.choice='rg316';renderHfCoax()">
        <div class="oc-radio"></div>
        <div style="flex:1"><div class="nq-label">25ft RG-316 Coax with Choke ($79)</div><div class="nq-detail">Thin, flexible pre-built cable with choke. Good for short runs and portable setups.</div></div>
      </div>
      <div class="nq-option ${choice === 'none' ? 'selected' : ''}" onclick="hfState.selections.coax.choice='none';renderHfCoax()">
        <div class="oc-radio"></div>
        <div style="flex:1"><div class="nq-label">No Coax. I already have cable</div><div class="nq-detail">Skip coax and use what you already have.</div></div>
      </div>

      ${isCustom ? `
        <label style="font-size:14px;color:var(--gold);display:block;margin:20px 0 8px">Length (feet)</label>
        <div style="display:flex;align-items:center;gap:12px">
          <input type="range" id="hf-coax-slider" min="10" max="150" step="5" value="${len}" style="flex:1;accent-color:var(--gold)"
            oninput="hfState.selections.coax.length=parseInt(this.value);document.getElementById('hf-coax-input').value=this.value;updateHfCoaxPrice()">
          <input type="number" id="hf-coax-input" min="1" max="300" value="${len}"
            style="width:60px;background:#111;border:1px solid var(--border);color:var(--gold);padding:6px;text-align:center;font-size:16px;font-weight:700"
            oninput="const v=Math.max(1,parseInt(this.value)||1);hfState.selections.coax.length=v;document.getElementById('hf-coax-slider').value=Math.min(150,v);updateHfCoaxPrice()">
          <span style="color:#888;font-size:13px">ft</span>
        </div>
        <div id="hf-coax-price" style="margin-top:16px;padding:12px;background:#1a1800;border:1px solid var(--gold-dim);text-align:center">
          <div style="font-size:13px;color:#ddd">${coaxCalc.displayHtml}</div>
          <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${coaxTotal.toFixed(2)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function updateHfCoaxPrice() {
  const sel = hfState.selections;
  const calc = calcCoaxTiered(sel.coax.length, sel.coax.choice);
  document.getElementById('hf-coax-price').innerHTML = `
    <div style="font-size:13px;color:#ddd">${calc.displayHtml}</div>
    <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${calc.total.toFixed(2)}</div>
  `;
}

function renderHfPower() {
  const c = document.getElementById('hf-step-content');
  const sel = hfState.selections;
  if (!sel.power) sel.power = [];

  c.innerHTML = `
    <div class="section-head"><h2>Power</h2><p>HF radios need a solid 12V power source. Select what fits your setup.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${mobileProducts.power.map(p => `
        <div class="nq-option ${sel.power.includes(p.key) ? 'selected' : ''}" onclick="toggleHfPower('${p.key}')">
          <div class="nq-check">${sel.power.includes(p.key) ? '✓' : ''}</div>
          <div style="flex:1"><div class="nq-label">${p.name} ($${p.price})</div><div class="nq-detail">${p.desc}</div></div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleHfPower(key) {
  const arr = hfState.selections.power;
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
  renderHfPower();
}

function renderHfAccessories() {
  const c = document.getElementById('hf-step-content');
  const sel = hfState.selections;
  if (!sel.accessories) sel.accessories = [];

  // Filter radio-specific accessories
  const radioKey = hfState.radioKey;
  const available = hfProducts.accessories.filter(a => !a.radioMatch || a.radioMatch === radioKey);

  c.innerHTML = `
    <div class="section-head"><h2>Accessories</h2><p>Digital interfaces, cable management, and field gear for your HF setup.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${available.map(a => `
        <div class="nq-option ${sel.accessories.includes(a.key) ? 'selected' : ''}" onclick="toggleHfAccessory('${a.key}')">
          <div class="nq-check">${sel.accessories.includes(a.key) ? '✓' : ''}</div>
          <div style="flex:1"><div class="nq-label">${a.name} ($${a.price})</div><div class="nq-detail">${a.desc}</div></div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleHfAccessory(key) {
  const arr = hfState.selections.accessories;
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
  renderHfAccessories();
}

function renderHfReview() {
  const c = document.getElementById('hf-step-content');
  const radio = hfRadioLineup.find(r => r.key === hfState.radioKey);
  const sel = hfState.selections;
  let items = [{ name: radio.name, price: radio.price, id: radio.id }];
  let total = radio.price;

  // Antenna
  if (sel.antenna) {
    const a = hfProducts.antennas.find(x => x.key === sel.antenna);
    if (a) { items.push({ name: a.name, price: a.price, id: a.id }); total += a.price; }
  }

  // Coax (tiered pricing with product IDs)
  if (sel.coax && sel.coax.choice !== 'none') {
    if (sel.coax.choice === 'rg316') {
      items.push({ name: '25ft RG-316 Coax with Choke', price: 79, id: 7075 }); total += 79;
    } else if (sel.coax.choice === '400uf' || sel.coax.choice === '240uf') {
      const calc = calcCoaxTiered(sel.coax.length, sel.coax.choice);
      calc.cartItems.forEach(ci => items.push(ci));
      total += calc.total;
    }
  }

  // Power
  (sel.power || []).forEach(key => {
    const p = mobileProducts.power.find(x => x.key === key);
    if (p) { items.push({ name: p.name, price: p.price, id: p.id }); total += p.price; }
  });

  // Accessories (resolve variations for variable products like cheat sheets)
  (sel.accessories || []).forEach(key => {
    const a = hfProducts.accessories.find(x => x.key === key);
    if (a) {
      const accId = resolveVariationId(a.id, { radioKey: hfState.radioKey });
      items.push({ name: a.name, price: a.price, id: accId }); total += a.price;
    }
  });

  hfState.cartItems = items;

  c.innerHTML = `
    <div class="section-head"><h2>Review Your HF Kit</h2><p>${radio.name}, ready for long-distance communication.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span style="color:#ddd">${item.name}</span>
          <span style="color:var(--gold);font-weight:600">$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:700">
        <span style="color:var(--gold)">Total</span>
        <span style="color:var(--gold)">$${total.toFixed(2)}</span>
      </div>
      <div style="font-size:12px;color:#888;margin-top:8px">HF radios are shipped without custom programming. Setup guidance is available upon request.</div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════
// ── COMBINED REVIEW (all kits) ──
// ══════════════════════════════════════════════════════

function showCombinedReview() {
  const container = document.getElementById('kit-plan-container');
  let grandTotal = 0;

  const kitsHtml = kitSession.kits.map((kit, i) => {
    const kitTotal = kit.cartItems.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
    grandTotal += kitTotal;
    return `
      <div style="margin-bottom:20px;padding:16px;border:1px solid var(--border);background:var(--card)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
          <div style="font-size:15px;font-weight:600;color:var(--gold)">${categoryMeta[kit.category].icon} ${kit.label}</div>
          <div style="font-size:15px;font-weight:700;color:var(--gold)">$${kitTotal.toFixed(2)}</div>
        </div>
        ${kit.cartItems.map(item => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px">
            <span style="color:#ddd">${item.name}</span>
            <span style="color:var(--muted)">$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  // Global items (license)
  let globalHtml = '';
  if (wantsItinerantLicense) {
    grandTotal += 579;
    globalHtml = `
      <div style="margin-bottom:20px;padding:16px;border:1px solid var(--border);background:var(--card)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
          <div style="font-size:15px;font-weight:600;color:var(--gold)">📋 Business License</div>
          <div style="font-size:15px;font-weight:700;color:var(--gold)">$579.00</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px">
          <span style="color:#ddd">Business Itinerant License Assistance (10 years)</span>
          <span style="color:var(--muted)">$579.00</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="kit-plan">
      <h2>Review All Kits</h2>
      <p class="plan-sub">${kitSession.kits.length} kit${kitSession.kits.length > 1 ? 's' : ''}. Everything you need, all in one order.</p>
      <div style="text-align:left">${kitsHtml}${globalHtml}</div>
      <div style="display:flex;justify-content:space-between;padding:16px;background:#1a1800;border:2px solid var(--gold);font-size:18px;font-weight:700;margin-bottom:24px">
        <span style="color:var(--gold)">Grand Total</span>
        <span style="color:var(--gold)">$${grandTotal.toFixed(2)}</span>
      </div>
      <button class="btn-nav btn-next" style="font-size:16px;padding:14px 32px" onclick="addAllKitsToCart()">
        Add All to Cart →
      </button>
      <div style="margin-top:12px">
        <button class="btn-nav btn-back" onclick="renderKitPlan()">← Back to Kit Plan</button>
      </div>
    </div>
  `;
}

function addAllKitsToCart() {
  // Disable button to prevent double-click
  const btn = document.querySelector('[onclick="addAllKitsToCart()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Adding to cart...'; btn.style.opacity = '0.6'; }
  // Collect all cart items from all completed kits
  const allItems = [];
  kitSession.kits.forEach(kit => {
    if (kit.cartItems) {
      kit.cartItems.forEach(item => {
        if (item.id) {
          // Merge duplicates by summing quantities
          const existing = allItems.find(i => i.id === item.id);
          if (existing) {
            existing.qty += (item.qty || 1);
          } else {
            allItems.push({ id: item.id, qty: item.qty || 1 });
          }
        }
      });
    }
  });

  // Add global items (business license)
  if (wantsItinerantLicense) {
    const existing = allItems.find(i => i.id === 7174);
    if (!existing) allItems.push({ id: 7174, qty: 1 });
  }

  if (allItems.length === 0) {
    alert('No items to add to cart. Some products may not have WooCommerce IDs configured yet.');
    return;
  }

  // Build kit name from completed kits
  const kitNames = kitSession.kits
    .filter(k => k.status === 'complete' && k.radioKey)
    .map(k => {
      const r = [...radioLineup, ...(typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [])].find(x => x.key === k.radioKey);
      return r ? r.name : '';
    })
    .filter(Boolean);
  const kitName = [...new Set(kitNames)].join(' + ');

  rmeDebug('CART', `Adding ${allItems.length} unique products (${allItems.reduce((s,i) => s + i.qty, 0)} total items)`);
  rmeKbAddToCart(allItems, kitName);
}

// ══════════════════════════════════════════════════════
// ── SCANNER / SDR FLOW ──
// ══════════════════════════════════════════════════════

const scannerRadioLineup = [
  {
    key: 'sds200', name: 'Uniden SDS200 Digital Scanner Base Station', price: 799, id: 7512,
    img: S+'2025/06/SDS200_square.png',
    tagline: 'Desktop monitoring powerhouse',
    pitch: 'Full-featured base station scanner with the best audio and largest display. Decodes P25, DMR, EDACS, and NXDN digital systems. AC or DC powered for home, office, or vehicle use. Arrives pre-programmed for your area.',
    features: ['P25 Phase I & II, DMR, EDACS, NXDN', 'Close Call: detect nearby signals instantly', 'Scan by zip code or GPS location', 'AC and DC power options', 'Best-in-class audio quality'],
    includes: ['SDS200 Scanner', 'BNC Telescoping Antenna', 'USB Programming Cable', 'AC Power Adapter', 'DC Power Harness', 'microSD Card (8GB)'],
    formFactor: 'base',
  },
  {
    key: 'sds100', name: 'Uniden SDS100 Handheld Digital Scanner', price: 749, id: 6721,
    img: S+'2025/02/unidensds100.png',
    tagline: 'Portable monitoring anywhere',
    pitch: 'Same digital decoding as the SDS200 in a portable, battery-powered package. Take it to events, on the road, or keep it on your belt. USB rechargeable with extended battery included. Arrives pre-programmed for your area.',
    features: ['P25 Phase I & II, DMR, EDACS, NXDN', 'Close Call: detect nearby signals instantly', 'Scan by zip code or GPS location', 'USB rechargeable, 5400mAh extended battery', 'Compact and portable with belt clip'],
    includes: ['SDS100 Scanner', 'SMA Antenna + BNC Adapter', 'USB Programming/Charging Cable', 'AC Wall Charger', 'Extended Battery (5400mAh)', 'Belt Clip', 'microSD Card (8GB)'],
    formFactor: 'handheld',
  },
  {
    key: 'sdr-kit', name: 'SDR Essentials Kit', price: 99, id: 3723,
    img: S+'2024/02/20240228_165343.jpg',
    tagline: 'Explore the RF spectrum visually',
    pitch: 'Software Defined Radio turns your computer, tablet, or phone into a visual spectrum analyzer. See radio signals on a waterfall display, track aircraft, decode digital modes, and explore frequencies from 25MHz to 1.3GHz. Requires a computer, tablet, or phone with compatible software (not included).',
    features: ['25MHz to 1.3GHz frequency range', 'Visual waterfall spectrum display', 'Aircraft tracking via ADS-B', 'Works with PC, Mac, Android, or iOS', 'Genuine RTL-SDR v4 (not a clone)'],
    includes: ['RTL-SDR v4 receiver', 'Telescoping wideband antenna', 'SMA-M to BNC-F adapter', 'USB-A to USB-C OTG adapter'],
    formFactor: 'accessory',
    requiresComputer: true,
  },
  {
    key: 'sds150', name: 'Uniden SDS150 Digital Scanner Base Station', price: 1049, id: 8978,
    img: S+'2026/01/1000011075.png',
    tagline: 'Premium base station scanner with touchscreen',
    pitch: 'Uniden\'s flagship scanner with a full-color touchscreen, advanced digital decoding, and premium audio. All the capabilities of the SDS200 with a next-generation interface. Arrives pre-programmed for your area.',
    features: ['P25 Phase I & II, DMR, EDACS, NXDN', 'Full-color touchscreen interface', 'Close Call: detect nearby signals instantly', 'Scan by zip code or GPS location', 'Premium audio with built-in speaker'],
    includes: ['SDS150 Scanner', 'BNC Antenna', 'USB Programming Cable', 'AC Power Adapter', 'microSD Card'],
    formFactor: 'base',
  },
];

const scannerProducts = {
  antennas: [
    { key: 'discone', name: 'Wideband Receive Discone Antenna', desc: 'Dedicated wideband receive antenna for base station installations. Covers 25MHz to 1.3GHz. Includes mast mounting hardware. Best performance for home monitoring setups.', price: 139, id: 3749 },
    { key: 'tele-wideband', name: 'Telescoping Wideband Receive Antenna', desc: 'Portable telescoping BNC antenna. 25MHz to 1.3GHz coverage. Upgrade from the stock antenna for better reception.', price: 35, id: 3746 },
  ],
  accessories: [
    { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards.', price: 19, id: 966 },
    { key: 'magmount', name: 'Magnetic BNC Antenna Base', desc: 'Magnetic mount base with BNC connector. Place on any metal surface for improved antenna positioning.', price: 39, id: 521 },
    { key: 'stubby', name: 'BNC Stubby Antenna', desc: 'Compact BNC rubber duck antenna. Low-profile option for portable or indoor use.', price: 39, id: 816 },
    { key: 'signalstick', name: 'BNC Signal Stick Antenna', desc: 'Flexible whip BNC antenna with improved gain over stock. Great portable upgrade.', price: 25, id: 39, compatRadios: ['sds100', 'sdr-kit'] },
    { key: 'sds100-battery', name: 'SDS100 Spare Battery with Charger', desc: 'Replacement battery and charger for extended field time. Swap batteries to keep scanning all day.', price: 89, id: 9452, compatRadios: ['sds100'] },
    { key: 'usbc-adapter', name: 'Mini USB to USB-C Charging Adapter', desc: 'Charge your SDS100 via USB-C instead of the Mini USB port. Use any modern cable.', price: 9, id: 9453, compatRadios: ['sds100'] },
    { key: 'ram-hanger', name: 'RAM Mount Compatible Scanner Hanger', desc: 'Attach your SDS100 to any RAM ball mount system. Great for vehicles, desks, or go-kits.', price: 19, id: 9454, compatRadios: ['sds100'] },
    { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Connect your scanner to an external SO-239 antenna for better reception.', price: 12, id: null },
  ],
};

let scannerState = { radioKey: null, selections: { antennas: new Set(), accessories: new Set() }, cartItems: [], step: 0 };

function startDirectScanner() {
  // Direct entry from landing page — bypass needs assessment, go straight to scanner choice
  kitSession = { needsAnswers: {}, categories: [{ type: 'scanner', qty: 1 }], kits: [{ category: 'scanner', label: 'Scanner / SDR Kit', status: 'active', radioKey: null, cartItems: [] }], currentKitIndex: 0, preferences: [] };
  document.getElementById('needs-landing').style.display = 'none';
  startScannerFlow();
}

function startScannerFlow() {
  scrollToTop();
  hideAllPhases();
  showConsultationFooter();
  scannerState = { radioKey: null, selections: { antennas: new Set(), accessories: new Set() }, cartItems: [], step: 0 };
  const phase = document.getElementById('scanner-phase');
  phase.style.display = 'block';
  renderScannerRadioChoice();
}

function renderScannerRadioChoice() {
  const phase = document.getElementById('scanner-phase');

  phase.innerHTML = `
    <div class="selector-landing" style="text-align:center">
      <h2>Monitor & Listen</h2>
      <p style="color:#ddd;font-size:15px;max-width:650px;margin:0 auto 8px">Scanners and SDR receivers are for <strong style="color:var(--rme-gold)">listening only</strong>. Unlike our two-way radios, these do not transmit. Monitor police, fire, EMS, aircraft, weather, amateur radio, and thousands of other signals. No license required.</p>
      <div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center;max-width:900px;margin:24px auto 0">
        ${scannerRadioLineup.map(r => {
          const isSDR = r.requiresComputer;
          return `
          <div class="radio-pick" onclick="selectScannerRadio('${r.key}')"
               style="flex:1;min-width:min(250px,100%);max-width:320px;text-align:center;padding:24px 20px">
            <div class="rp-img" style="margin:0 auto 12px"><img src="${r.img || ''}" alt="${r.name}" onerror="this.parentElement.innerHTML='📡'"></div>
            <h4 style="color:var(--rme-gold);margin-bottom:4px">${r.name.replace(' Digital Scanner Base Station','').replace(' Handheld Digital Scanner','').replace(' Essentials Kit','')}</h4>
            <div style="font-size:13px;color:#c4a83a;margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:20px;font-weight:700;color:var(--rme-gold);margin-bottom:12px">$${r.price}</div>
            ${isSDR ? '<div style="font-size:11px;padding:4px 10px;background:#1a1800;border:1px solid var(--rme-gold-dim);color:var(--rme-gold-dim);display:inline-block;margin-bottom:8px;border-radius:4px">Requires computer, tablet, or phone</div>' : ''}
            <div style="font-size:13px;color:#ddd;line-height:1.6;text-align:left;margin-bottom:12px">${r.pitch}</div>
            <ul style="text-align:left;font-size:12px;color:#ccc;padding-left:16px;margin:0 0 16px">${r.features.map(f=>'<li style="padding:2px 0">'+f+'</li>').join('')}</ul>
            <button class="rc-btn" onclick="event.stopPropagation();selectScannerRadio('${r.key}')">Select This ${isSDR ? 'Kit' : 'Scanner'} →</button>
          </div>`;
        }).join('')}
      </div>
      <div class="needs-btns" style="margin-top:24px">
        <button class="btn-nav btn-back" onclick="backToKitPlan()">← Back</button>
      </div>
    </div>
  `;
}

function selectScannerRadio(key) {
  if (kitSession.kits[kitSession.currentKitIndex]) kitSession.kits[kitSession.currentKitIndex].radioKey = key;
  scannerState.radioKey = key;
  scannerState.selections = { antennas: new Set(), accessories: new Set() };
  scannerState.step = 0;
  renderScannerWizard();
  scrollToTop();
}

function getScannerSteps() {
  const radio = scannerRadioLineup.find(r => r.key === scannerState.radioKey);
  const steps = [
    { name: 'Antenna', render: renderScannerAntenna },
    { name: 'Accessories', render: renderScannerAccessories },
    { name: 'Programming', render: renderScannerProgramming },
    { name: 'Review', render: renderScannerReview },
  ];
  // SDR doesn't need programming
  if (radio && radio.requiresComputer) {
    return steps.filter(s => s.name !== 'Programming');
  }
  return steps;
}

function renderScannerWizard() {
  const phase = document.getElementById('scanner-phase');
  const radio = scannerRadioLineup.find(r => r.key === scannerState.radioKey);
  const steps = getScannerSteps();
  const step = steps[scannerState.step];

  phase.innerHTML = `
    <div class="hero" style="margin-bottom:24px">
      <div class="hero-img" style="cursor:zoom-in" onclick="openLightbox('${radio.img}','${radio.name}')">
        <img src="${radio.img || ''}" alt="${radio.name}" style="display:block">
      </div>
      <div class="hero-info">
        <h1>${radio.name}</h1>
        <div class="base-price">$${radio.price}.00</div>
        <div class="desc">${radio.pitch}</div>
        <div class="includes"><strong style="color:var(--rme-gold)">Kit includes:</strong><ul>${radio.includes.map(i => '<li>' + i + '</li>').join('')}</ul></div>
      </div>
    </div>
    <div class="step-labels">${steps.map((s, i) => `<div class="step-label ${i === scannerState.step ? 'active' : i < scannerState.step ? 'done' : ''}">${s.name}</div>`).join('')}</div>
    <div class="progress">${steps.map((s, i) => `<div class="progress-step ${i === scannerState.step ? 'active' : i < scannerState.step ? 'done' : ''}"></div>`).join('')}</div>
    <div id="scanner-step-content"></div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:24px">
      ${scannerState.step > 0 ? '<button class="btn-nav btn-back" onclick="scannerState.step--;renderScannerWizard();scrollToTop()">← Back</button>' : '<button class="btn-nav btn-back" onclick="scannerState.radioKey=null;renderScannerRadioChoice()">← Change Scanner</button>'}
      ${scannerState.step < steps.length - 1 ? `<button class="btn-nav btn-next" onclick="scannerState.step++;renderScannerWizard();scrollToTop()">Next: ${steps[scannerState.step + 1].name} →</button>` : `<button class="btn-nav btn-next" onclick="completeScannerKit()">✓ Complete Kit</button>`}
    </div>
  `;

  step.render();
}

function renderScannerAntenna() {
  const c = document.getElementById('scanner-step-content');
  const sel = scannerState.selections;
  const radio = scannerRadioLineup.find(r => r.key === scannerState.radioKey);
  const isBase = radio && radio.formFactor === 'base';
  const isSDR = radio && radio.requiresComputer;

  c.innerHTML = `
    <div class="section-head"><h2>Antenna ${isSDR ? '(Optional)' : 'Upgrade'}</h2>
      <p>${isBase
        ? 'Your SDS200 includes a basic telescoping antenna. For best reception, add a dedicated wideband antenna mounted outdoors.'
        : isSDR
        ? 'Your SDR kit includes a telescoping antenna. You can add a dedicated wideband antenna for better reception, or use just the included antenna.'
        : 'Your SDS100 includes a stock SMA antenna. Add a wideband antenna for better range and signal quality.'
      }</p>
    </div>
    <div style="max-width:600px;margin:0 auto">
      <div class="nq-option selected" style="opacity:0.85;cursor:default;border-color:var(--green)">
        <div class="nq-check" style="border-color:var(--green);color:var(--green)">✓</div>
        <div><div class="nq-label">Included Antenna <span style="font-size:11px;color:var(--green)">Included</span></div>
        <div class="nq-detail">${isBase ? 'BNC telescoping antenna' : isSDR ? 'Telescoping wideband antenna (25MHz-1.3GHz)' : 'SMA antenna with BNC adapter'}</div></div>
      </div>
      ${scannerProducts.antennas.map(a => `
        <div class="nq-option ${sel.antennas.has(a.key) ? 'selected' : ''}" onclick="scannerState.selections.antennas.has('${a.key}')?scannerState.selections.antennas.delete('${a.key}'):scannerState.selections.antennas.add('${a.key}');renderScannerAntenna()">
          <div class="nq-check">${sel.antennas.has(a.key) ? '✓' : ''}</div>
          <div>
            <div class="nq-label">${a.name} ($${a.price})${a.key === 'discone' && isBase ? ' <span style="font-size:10px;padding:2px 6px;background:#1a1800;border:1px solid var(--rme-gold);color:var(--rme-gold);border-radius:3px;margin-left:6px">Recommended for base</span>' : ''}</div>
            <div class="nq-detail">${a.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderScannerAccessories() {
  const c = document.getElementById('scanner-step-content');
  const sel = scannerState.selections;
  const radio = scannerRadioLineup.find(r => r.key === scannerState.radioKey);
  // Filter accessories by compatRadios if present
  const available = scannerProducts.accessories.filter(a => !a.compatRadios || a.compatRadios.includes(scannerState.radioKey));

  c.innerHTML = `
    <div class="section-head"><h2>Accessories</h2>
      <p>Optional add-ons for your ${radio ? radio.name : 'scanner'}. All items are optional.</p>
    </div>
    <div style="max-width:600px;margin:0 auto">
      ${available.length === 0 ? '<p style="color:var(--muted);text-align:center">No additional accessories available for this product.</p>' : available.map(a => `
        <div class="nq-option ${sel.accessories.has(a.key) ? 'selected' : ''}" onclick="scannerState.selections.accessories.has('${a.key}')?scannerState.selections.accessories.delete('${a.key}'):scannerState.selections.accessories.add('${a.key}');renderScannerAccessories()">
          <div class="nq-check">${sel.accessories.has(a.key) ? '✓' : ''}</div>
          <div>
            <div class="nq-label">${a.name} ($${a.price})</div>
            <div class="nq-detail">${a.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderScannerProgramming() {
  const c = document.getElementById('scanner-step-content');
  const sel = scannerState.selections;
  if (!sel.programming) sel.programming = 'standard';
  if (sel.progUseShipping === undefined) sel.progUseShipping = true;
  if (!sel.progZip) sel.progZip = '';

  c.innerHTML = `
    <div class="section-head"><h2>Custom Programming</h2>
      <p>We program your scanner with local frequencies for police, fire, EMS, aircraft, weather, amateur repeaters, and more. It arrives ready to scan right out of the box.</p>
    </div>
    <div style="max-width:600px;margin:0 auto">
      <div class="nq-option selected" style="cursor:default;border-color:var(--green)">
        <div class="nq-check" style="border-color:var(--green);color:var(--green)">✓</div>
        <div><div class="nq-label">Standard Programming <span style="font-size:11px;color:var(--green)">Included</span></div>
        <div class="nq-detail">Programmed for your shipping address area. Includes all local public safety, weather, amateur radio, and aviation frequencies.</div></div>
      </div>
      <div style="margin-top:16px;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:8px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#ddd">
          <input type="checkbox" ${sel.progUseShipping ? 'checked' : ''} onchange="scannerState.selections.progUseShipping=this.checked;renderScannerProgramming()" style="accent-color:var(--rme-gold)">
          Program for my shipping address
        </label>
        ${!sel.progUseShipping ? `
          <div style="margin-top:12px">
            <label style="font-size:12px;color:var(--rme-gold)">ZIP code for programming</label>
            <input type="text" value="${sel.progZip}" maxlength="5" placeholder="ZIP code"
              style="display:block;margin-top:4px;padding:8px 12px;background:#111;border:1px solid var(--border);color:var(--rme-gold);font-size:16px;width:120px;border-radius:4px"
              oninput="scannerState.selections.progZip=this.value">
          </div>
        ` : ''}
      </div>
      <div style="margin-top:12px;font-size:12px;color:#888">You can also add notes at checkout if you have specific frequency or talkgroup requests.</div>
    </div>
  `;
}

function renderScannerReview() {
  const c = document.getElementById('scanner-step-content');
  const radio = scannerRadioLineup.find(r => r.key === scannerState.radioKey);
  let total = radio.price;
  let items = [`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--rme-gold);font-weight:600">${radio.name}</span><span style="color:var(--rme-gold);font-weight:700">$${radio.price}</span></div>`];

  scannerState.selections.antennas.forEach(key => {
    const a = scannerProducts.antennas.find(x => x.key === key);
    if (a) {
      total += a.price;
      items.push(`<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#ddd">${a.name}</span><span style="color:var(--muted)">+$${a.price}</span></div>`);
    }
  });

  // Accessories
  const availableAcc = scannerProducts.accessories.filter(a => !a.compatRadios || a.compatRadios.includes(scannerState.radioKey));
  scannerState.selections.accessories.forEach(key => {
    const a = availableAcc.find(x => x.key === key);
    if (a) {
      total += a.price;
      items.push(`<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#ddd">${a.name}</span><span style="color:var(--muted)">+$${a.price}</span></div>`);
    }
  });

  if (!radio.requiresComputer) {
    items.push(`<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#ddd">Custom Programming</span><span style="color:var(--green)">Included</span></div>`);
  }

  c.innerHTML = `
    <div class="section-head"><h2>Review Your Kit</h2><p>Here's everything in your ${radio.requiresComputer ? 'SDR' : 'scanner'} kit.</p></div>
    <div style="max-width:600px;margin:0 auto">
      ${items.join('')}
      <div class="review-total" style="margin-top:16px">
        <div class="rt-label">Kit Total</div>
        <div class="rt-price">$${total}</div>
      </div>
      ${radio.requiresComputer ? '<div style="margin-top:12px;padding:10px 14px;background:#1a1800;border:1px solid var(--rme-gold-dim);border-radius:6px;font-size:12px;color:var(--rme-gold-dim)">This kit requires a computer, tablet, or phone with compatible SDR software (not included) to operate.</div>' : ''}
    </div>
  `;
}

function collectScannerCartItems() {
  const radio = scannerRadioLineup.find(r => r.key === scannerState.radioKey);
  const items = [{ name: radio.name, price: radio.price, id: radio.id }];
  scannerState.selections.antennas.forEach(key => {
    const a = scannerProducts.antennas.find(x => x.key === key);
    if (a) items.push({ name: a.name, price: a.price, id: a.id });
  });
  const availableAcc = scannerProducts.accessories.filter(a => !a.compatRadios || a.compatRadios.includes(scannerState.radioKey));
  scannerState.selections.accessories.forEach(key => {
    const a = availableAcc.find(x => x.key === key);
    if (a) {
      const accId = resolveVariationId(a.id, { radioKey: scannerState.radioKey });
      items.push({ name: a.name, price: a.price, id: accId });
    }
  });
  return items;
}

function completeScannerKit() {
  const inSession = kitSession.kits.length > 0;
  if (inSession) {
    completeCurrentKit(collectScannerCartItems(), {
      choice: scannerState.selections.programming || 'standard',
      useShipping: scannerState.selections.progUseShipping !== false,
      zip: scannerState.selections.progZip || '',
    });
  } else {
    rmeKbAddToCart(collectScannerCartItems());
  }
}

// ══════════════════════════════════════════════════════
// ── EXISTING HANDHELD KIT BUILDER STATE ──
// ══════════════════════════════════════════════════════

let BASE_PRICE = 59;
let currentStep = 0;
let totalSteps = 6;

// ── Volume Discount Tiers ──
// Applies per-category (e.g. 3 handhelds = 5% off handheld base prices)
// Discount on base radio kit price only, not accessories/add-ons
const volumeTiers = [
  { min: 2, max: 3, pct: 5, label: 'Team Pack' },
  { min: 4, max: 6, pct: 10, label: 'Group Pack' },
  { min: 7, max: 9, pct: 12, label: 'Squad Pack' },
  { min: 10, max: Infinity, pct: 15, label: 'Unit Pack' },
];

function getVolumeTier(qty) {
  return volumeTiers.find(t => qty >= t.min && qty <= t.max) || null;
}

function getNextTier(qty) {
  const current = getVolumeTier(qty);
  if (!current) return volumeTiers[0]; // no discount yet, next is first tier
  const idx = volumeTiers.indexOf(current);
  return idx < volumeTiers.length - 1 ? volumeTiers[idx + 1] : null;
}

function volumeDiscountAmount(basePrice, qty) {
  const tier = getVolumeTier(qty);
  if (!tier) return 0;
  return Math.round(basePrice * qty * tier.pct / 100);
}

function volumeNudgeHtml(qty, categoryType) {
  const next = getNextTier(qty);
  if (!next) return ''; // already at max tier
  const unitsNeeded = next.min - qty;
  const m = categoryMeta[categoryType];
  const catName = m ? m.name.toLowerCase().replace(' kit', '') : categoryType;
  return '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:12px;color:#5c5;text-align:center">' +
    'Add ' + unitsNeeded + ' more for <strong>' + next.pct + '% off</strong> all ' + catName + ' kits (' + next.label + ')' +
    '</div>';
}

// Radios that need a color choice step
const radiosWithColor = new Set(['uv-pro']);

// Build step configuration based on selected radio
function getSteps() {
  const hasColor = radiosWithColor.has(selectedRadioKey);
  const steps = [];
  if (hasColor) steps.push({ id: 'step-color', name: 'Color', render: renderColorChoice });
  steps.push({ id: 'step-0', name: 'Antennas', render: renderAllAntennas });
  steps.push({ id: 'step-2', name: 'Battery', render: renderBatteryUpgrades });
  steps.push({ id: 'step-3', name: 'Accessories', render: renderAccessories });
  steps.push({ id: 'step-4', name: 'Programming', render: renderProgramming });
  steps.push({ id: 'step-5', name: 'Review', render: renderReview });
  return steps;
}

function rebuildStepUI() {
  const steps = getSteps();
  totalSteps = steps.length;

  // Rebuild desktop labels
  const labelsEl = document.getElementById('step-labels');
  labelsEl.innerHTML = steps.map((s, i) => `<div class="step-label" onclick="goStep(${i})">${s.name}</div>`).join('');

  // Rebuild progress bar
  const progressEl = document.getElementById('progress');
  progressEl.innerHTML = steps.map(() => '<div class="progress-step"></div>').join('');

  // Rebuild mobile dots
  const dotsEl = document.getElementById('sm-dots');
  dotsEl.innerHTML = steps.map(() => '<div class="sm-dot"></div>').join('');
}

// Selected state
let selectedAntennas = new Set(); // multiselect
let selectedAddlAntennas = new Set(); // multiselect
let selectedBatteries = new Map(); // key → quantity (e.g. 'usbc-standard' → 2)
let selectedAccessories = new Set(); // multiselect
let adapterSuppressed = false; // user chose to supply their own adapter

// UV-PRO color choices (variation attribute)
let uvproRadioColor = 'black'; // 'black' or 'tan'
let uvproBatteryColors = new Map(); // battery key → 'black' or 'tan'

// Programming state
let programmingChoice = 'standard'; // 'none', 'standard', 'multi'
let progUseShipping = true; // use shipping address for programming location
let progZipPrimary = '';
let progZipsExtra = []; // up to 3 extra locations (4 total with primary)
let progConfirmedPrimary = ''; // resolved city/state for primary
let progConfirmedExtras = []; // resolved city/state for extras
let progCoords = { primary: null, extras: [] }; // {lat, lon} for proximity checks
let progNotes = '';
let progBrandmeisterId = '';
let wantsItinerantLicense = false;

// ── Product data (radio-specific) ──
// Items are keyed per radio. getItems(category) returns the right set for the selected radio.
const ADAPTER_PRICE = 5; // SMA-F to BNC-F Adapter [456] -added once if any BNC antenna selected

// Shared items (available for all radios)
const sharedAntennaUpgrades = [
  { key: 'stubby', name: 'Stubby Antenna with BNC Adapter', bestUse: 'Best for: Covert Carry', desc: 'Compact, low-profile antenna. Great for covert carry, backpacking, or when you need a shorter profile.', price: 39, img: S+'2023/05/20250227_154740.jpg', ids: [816, 456], addsToCart: ['Stubby Antenna [816] ($39)'] },
  { key: 'foulweather', name: 'Foul Weather Whip with BNC Adapter', bestUse: 'Best for: Chest Rigs & Field Use', desc: 'Flexible whip that bends without breaking. Ideal for field use, rucking, and mounting on chest rigs or plate carriers.', price: 40, img: S+'2024/03/20240320_115347.jpg', ids: [3916, 456], addsToCart: ['Foul Weather Whip [3916] ($40)'] },
  { key: 'signalstick', name: 'Signal Stick with BNC Adapter', bestUse: 'Best for: Overall Performance', desc: 'Super elastic, nearly indestructible flexible antenna. Excellent all-around performer for both transmit and receive.', price: 25, img: S+'2022/07/IMGP8549-scaled.jpg', ids: [39, 456], addsToCart: ['Signal Stick [39] ($25)'] },
];

const sharedAdditionalAntennas = [
  { key: 'wearable', name: 'Wearable BNC Antenna', bestUse: 'Best for: Body-Worn Setups', desc: 'Low-profile antenna for chest rigs, plate carriers, and body-worn setups. Lays flat for a streamlined profile.', price: 69, img: S+'2022/10/20221006_154507.jpg', id: 460, needsAdapter: true },
  { key: 'slimjim', name: 'Roll Up Slim Jim Antenna', bestUse: 'Best for: Base Camp Range', desc: 'Portable VHF/UHF antenna you can hang from a tree branch, window, or tarp ridge line. Dramatically extends your range, essential for base camp ops.', price: 49, img: S+'2022/08/12200-2-scaled.jpg', id: 99, needsAdapter: true },
  { key: 'magmount', name: 'Magnetic BNC Antenna Base', bestUse: 'Best for: Vehicle Mounting', desc: 'Magnetic base mount for any BNC antenna. Stick on a vehicle roof, toolbox, or any metal surface for instant mobile capability.', price: 39, img: S+'2022/10/IMGP8553-scaled.jpg', id: 521, needsAdapter: true },
  { key: 'mollemount', name: 'BNC MOLLE Antenna Mount', bestUse: 'Best for: Tactical Gear', desc: 'Attach any BNC antenna to MOLLE webbing on your vest, pack, or plate carrier. Keeps the antenna off the radio for a low-profile setup.', price: 19, img: S+'2025/12/1000009993.jpg', id: 8717, needsAdapter: true },
  { key: 'extraadapter', name: 'Extra SMA-F to BNC-F Adapter', desc: 'Spare BNC adapter so you can leave one on a mag mount or other accessory and still have one for the radio. One adapter is already included if you selected an antenna upgrade.', price: 5, img: S+'2022/09/smaftobncf.jpg', id: 456, needsAdapter: false, isAdapter: true },
];

// Radio-specific product catalogs
const radioProducts = {
  'uv5r': {
    batteryLabel: 'Factory Battery (1800mAh)',
    batteryDesc: 'Standard battery included with your kit. Requires charging cradle (included).',
    batteries: [
      { key: 'usbc-standard', name: 'USB-C Battery (1300mAh) with Cable', desc: 'Standard-size rechargeable battery with built-in USB-C port. Charge from any USB-C cable, no cradle needed.', price: 25, img: S+'2023/08/20230831_163401.jpg', id: 2367 },
      { key: 'usbc-extended', name: 'USB-C Extended Battery (3800mAh) with Cable', desc: 'High-capacity extended battery with built-in USB-C port. Nearly triple the runtime of the factory battery.', price: 29, img: S+'2023/04/20250725_123654.jpg', id: 749 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone. Mount on your chest rig, collar, or shoulder strap for hands-free communication.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Keeps audio discreet, popular for security, events, and low-profile ops.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'aprs', name: 'APRS Cable', desc: 'Audio interface cable connecting your radio to a smartphone. Run Rattlegram or APRSdroid for off-grid text messaging and position reporting.', price: 25, img: S+'2023/06/20230608_164856-1.jpg', id: 1177 },
      { key: 'progcable', name: 'USB Programming Cable', desc: 'Program custom frequencies via CHIRP software on your computer. Essential for serious operators who want full channel control.', price: 25, img: S+'2024/08/uv5r-programming-cable.jpg', id: 4838 },
      { key: 'exo', name: 'Exoskeleton', desc: 'Hard protective shell that prevents accidental PTT button presses and absorbs drops. Essential for field use.', price: 29, img: S+'2022/07/4A7A3860_white_square.png', id: 38 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection. Hear radio traffic through your earpro.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
      { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Connects your handheld radio to an external SO-239 antenna. Essential for vehicle or base station antenna use with a handheld.', price: 12, id: null },
      { key: 'battery-elim', name: '12V Battery Eliminator', desc: 'Run your UV-5R from a 12V source (vehicle, battery pack) without draining the internal battery. Replaces the battery pack with a 12V DC input.', price: 25, id: 455 },
    ],
  },
  'uv5r-mini': {
    batteryLabel: 'Built-in USB-C Battery',
    batteryDesc: 'The UV-5R Mini includes a USB-C rechargeable battery. Charge from any USB-C cable. Add a spare below for extended runtime in the field.',
    batteries: [
      { key: 'mini-spare', name: 'Extra UV-5R Mini Battery', desc: 'Spare USB-C rechargeable battery for the UV-5R Mini. Swap in the field for extended runtime.', price: 15, img: (typeof rmeKitBuilder!=='undefined'?rmeKitBuilder.pluginUrl:'')+'assets/img/placeholder-battery-mini.svg', id: 9451 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone. Mount on your chest rig, collar, or shoulder strap for hands-free communication.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Keeps audio discreet, popular for security, events, and low-profile ops.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'progcable', name: 'USB Programming Cable', desc: 'Program custom frequencies via CHIRP software on your computer.', price: 25, img: S+'2024/08/uv5r-programming-cable.jpg', id: 4838 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
      { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Connects your handheld radio to an external SO-239 antenna. Essential for vehicle or base station antenna use with a handheld.', price: 12, id: null },
    ],
  },
  'uv-pro': {
    batteryLabel: 'USB-C Rechargeable Battery (2600mAh)',
    batteryDesc: 'The UV-PRO includes a USB-C rechargeable battery. Charge from any USB-C cable, no cradle needed.',
    batteries: [
      { key: 'uvpro-spare', name: 'Extra UV-PRO Battery (2600mAh)', desc: 'Spare USB-C rechargeable battery for the UV-PRO. Swap in the field for extended ops without waiting to recharge.', price: 25, img: S+'2025/11/uvpro-battery-black.jpg', id: 8312 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'bs22', name: 'BS-22 Wireless Speakermic', desc: 'Bluetooth wireless speaker-microphone designed for the UV-PRO. No cable, clips to your gear and pairs via Bluetooth.', price: 59, img: S+'2025/12/1000009367.jpg', id: 8491 },
      { key: 'kplug', name: 'K-Plug Adapter', desc: 'Adapter that lets you use standard Kenwood-plug accessories (speakermics, eartubes, headsets) with your UV-PRO.', price: 25, img: S+'2025/11/1000008462.jpg', id: 8268 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Requires K-Plug Adapter for the UV-PRO.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
      { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Connects your handheld radio to an external SO-239 antenna. Essential for vehicle or base station antenna use with a handheld.', price: 12, id: null },
    ],
  },
  'dmr-6x2': {
    batteryLabel: 'USB-C Rechargeable Battery (3100mAh)',
    batteryDesc: 'The DMR 6X2 PRO includes a high-capacity 3100mAh USB-C rechargeable battery. 2-3 days of battery life with battery save enabled.',
    batteries: [
      { key: 'dmr6x2-spare', name: 'Extra DMR 6X2 PRO Battery (3100mAh)', desc: 'Spare USB-C rechargeable battery. Swap in the field for extended ops. 2-3 days of runtime per battery.', price: 45, img: (typeof rmeKitBuilder!=='undefined'?rmeKitBuilder.pluginUrl:'')+'assets/img/placeholder-battery-dmr.svg', id: 6868 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone with Kenwood plug. Compatible with the DMR 6X2 PRO.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Kenwood plug, plugs directly into the DMR 6X2 PRO.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'progcable', name: 'Spare DMR 6X2 PRO Programming Cable', desc: 'Additional spare USB programming cable. One is already included with your kit. This is a backup for a second location or travel bag.', price: 12, img: S+'2025/12/1000009966.jpg', id: 8711 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
      { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Connects your handheld radio to an external SO-239 antenna. Essential for vehicle or base station antenna use with a handheld.', price: 12, id: null },
      { key: 'battery-elim', name: '12V Battery Eliminator', desc: 'Run your DMR 6X2 PRO from a 12V source (vehicle, battery pack) without draining the internal battery. Replaces the battery pack with a 12V DC input.', price: 29, id: 7344 },
    ],
  },
  'da-7x2': {
    batteryLabel: 'USB-C Rechargeable Battery (3100mAh)',
    batteryDesc: 'The DA-7X2 includes a high-capacity 3100mAh USB-C rechargeable battery. 2-3 days of battery life with battery save enabled.',
    batteries: [
      { key: 'da7x2-spare', name: 'Extra DA-7X2 Battery (3100mAh)', desc: 'Spare USB-C rechargeable battery. Swap in the field for extended ops. 2-3 days of runtime per battery.', price: 45, img: (typeof rmeKitBuilder!=='undefined'?rmeKitBuilder.pluginUrl:'')+'assets/img/placeholder-battery-dmr.svg', id: 6868 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone with Kenwood plug. Compatible with the DA-7X2.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Kenwood plug, plugs directly into the DA-7X2.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'progcable', name: 'Spare DA-7X2 Programming Cable', desc: 'Additional spare USB programming cable. One is already included with your kit. This is a backup for a second location or travel bag.', price: 12, img: S+'2025/12/1000009966.jpg', id: 8711 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
      { key: 'so239-pigtail', name: 'SO-239 Antenna Pigtail Adapter', desc: 'Connects your handheld radio to an external SO-239 antenna. Essential for vehicle or base station antenna use with a handheld.', price: 12, id: null },
      { key: 'battery-elim', name: '12V Battery Eliminator', desc: 'Run your DA-7X2 from a 12V source (vehicle, battery pack) without draining the internal battery. Replaces the battery pack with a 12V DC input.', price: 29, id: 7344 },
    ],
  },
};

// Active product lists -populated when radio is selected
let antennaUpgrades = sharedAntennaUpgrades;
let additionalAntennas = sharedAdditionalAntennas;
let batteryUpgrades = radioProducts['uv5r'].batteries;
let accessories = radioProducts['uv5r'].accessories;

function loadRadioProducts(radioKey) {
  const rp = radioProducts[radioKey] || radioProducts['uv5r'];
  antennaUpgrades = sharedAntennaUpgrades;
  additionalAntennas = sharedAdditionalAntennas;
  batteryUpgrades = rp.batteries;
  accessories = rp.accessories;
}

// ── Render functions ────────────────────────────────

function renderColorChoice() {
  const container = document.getElementById('color-options');
  // S already defined at top scope
  const colors = [
    { key: 'black', name: 'Black', desc: 'Classic black, the standard UV-PRO finish. Discreet, professional look.', img: S+'2025/09/20250904_100414-EDIT.jpg' },
    { key: 'tan', name: 'Tan / Coyote', desc: 'Desert tan finish. Blends with earth tones and tactical gear. Same radio, different look.', img: S+'2025/09/20250904_100414-EDIT.jpg' },
  ];

  container.innerHTML = colors.map(c => `
    <div class="opt-card ${uvproRadioColor === c.key ? 'selected' : ''}"
         onclick="selectRadioColor('${c.key}')">
      <div class="oc-radio"><span></span></div>
      <div class="oc-img" style="border-color:${c.key === 'tan' ? '#b89a6a' : 'var(--gold)'}">
        <img src="${c.img}" alt="${c.name}">
      </div>
      <div class="oc-body">
        <div class="oc-name">${c.name}</div>
        <div class="oc-desc">${c.desc}</div>
      </div>
      <div class="oc-price free" style="color:var(--muted)">-</div>
    </div>
  `).join('');
}

function selectRadioColor(color) {
  uvproRadioColor = color;
  renderColorChoice();
}

function renderAllAntennas() {
  const container = document.getElementById('antenna-options');
  const anyUpgrade = selectedAntennas.size > 0;

  // ── Section 1: Upgrade Your Antenna ──
  let factoryHtml = `
    <div class="opt-card selected" style="cursor:default;opacity:0.85">
      <div class="oc-check" style="background:var(--green);border-color:var(--green);color:#111">✓</div>
      <div class="oc-body">
        <div class="oc-name">Factory Antenna</div>
        <div class="oc-desc">Standard rubber duck antenna included with your kit.</div>
      </div>
      <div class="oc-price free" style="color:var(--green)">Included</div>
    </div>
  `;

  let note = anyUpgrade
    ? '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#5c5"><strong>SMA-F to BNC-F Adapter ($5)</strong> will be added once to your order, shared by all BNC antennas below.</div>'
    : '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:var(--muted)">Want better performance? Add one or more antenna upgrades below. Automatically bundled with a BNC adapter for your radio.</div>';

  let upgradeCards = antennaUpgrades.map(a => `
    <div class="opt-card ${selectedAntennas.has(a.key) ? 'selected' : ''}"
         onclick="toggleAntenna('${a.key}')">
      <div class="oc-check">${selectedAntennas.has(a.key) ? '✓' : ''}</div>
      ${a.img ? `<div class="oc-img"><img src="${a.img}" alt="${a.name}" onerror="this.parentElement.innerHTML='<div style=\\'color:#444;font-size:11px;text-align:center;padding:8px\\'>No img</div>'"></div>` : ''}
      <div class="oc-body">
        ${a.bestUse ? `<div class="oc-best-use">${a.bestUse}</div>` : ''}
        <div class="oc-name">${a.name}</div>
        <div class="oc-desc">${a.desc}</div>
        <div class="oc-meta"></div>
      </div>
      <div class="oc-price">+$${a.price}</div>
    </div>
  `).join('');

  // ── Section 2: Add More Antennas ──
  let adapterNote = '';
  if (anyUpgrade) {
    adapterNote = '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#5c5"><strong>BNC adapter already included</strong> with your antenna upgrade. BNC antennas below will share that adapter, or grab a spare below if you want one dedicated to each setup.</div>';
  } else {
    adapterNote = '<div style="background:#2a2000;border:1px solid #3a3000;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#d4af37"><strong>No antenna upgrade selected.</strong> BNC antennas below require an SMA-F to BNC-F Adapter, which will be auto-added if needed.</div>';
  }

  let addlCards = additionalAntennas.map(a => {
    const isAdapter = a.isAdapter;
    let adapterSubtitle = '';
    if (isAdapter && anyUpgrade) {
      adapterSubtitle = '<div style="font-size:11px;color:var(--green);margin-top:2px">✓ One already included with your upgrade. This adds a spare</div>';
    } else if (isAdapter && !anyUpgrade) {
      adapterSubtitle = '<div style="font-size:11px;color:var(--gold-dim);margin-top:2px">One will be auto-added if you select a BNC antenna. This adds an extra</div>';
    }

    return `
    <div class="opt-card ${selectedAddlAntennas.has(a.key) ? 'selected' : ''}"
         onclick="toggleAddlAntenna('${a.key}')">
      <div class="oc-check">${selectedAddlAntennas.has(a.key) ? '✓' : ''}</div>
      ${a.img ? `<div class="oc-img"><img src="${a.img}" alt="${a.name}" onerror="this.parentElement.innerHTML='<div style=\\'color:#444;font-size:11px;text-align:center;padding:8px\\'>No img</div>'"></div>` : ''}
      <div class="oc-body">
        ${a.bestUse ? `<div class="oc-best-use">${a.bestUse}</div>` : ''}
        <div class="oc-name">${a.name}</div>
        <div class="oc-desc">${a.desc}</div>
        ${adapterSubtitle}
        <div class="oc-meta"></div>
      </div>
      <div class="oc-price">${a.price ? '+$' + a.price : 'Price TBD'}</div>
    </div>
  `}).join('');

  container.innerHTML = factoryHtml + note + upgradeCards
    + '<div class="antenna-section-divider"><h3>Add More Antennas</h3><p>Supplemental antennas for extended range, mobile use, or body-worn setups.</p></div>'
    + adapterNote + addlCards;
}

// Legacy render functions kept for any direct calls
function renderAntennaUpgrades() { renderAllAntennas(); }

function renderAdditionalAntennas() {
  const hasUpgrade = selectedAntennas.size > 0;
  const container = document.getElementById('addl-antenna-options');

  // Show BNC adapter note at top
  let adapterNote = '';
  if (hasUpgrade) {
    adapterNote = '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#5c5"><strong>BNC adapter already included</strong> with your antenna upgrade. BNC antennas below will share that adapter, or grab a spare below if you want one dedicated to each setup.</div>';
  } else {
    adapterNote = '<div style="background:#2a2000;border:1px solid #3a3000;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#d4af37"><strong>No antenna upgrade selected.</strong> BNC antennas below require an SMA-F to BNC-F Adapter, which will be auto-added if needed.</div>';
  }

  container.innerHTML = adapterNote + additionalAntennas.map(a => {
    const isAdapter = a.isAdapter;
    // Contextual subtitle for the extra adapter card
    let adapterSubtitle = '';
    if (isAdapter && hasUpgrade) {
      adapterSubtitle = '<div style="font-size:11px;color:var(--green);margin-top:2px">✓ One already included with your upgrade. This adds a spare</div>';
    } else if (isAdapter && !hasUpgrade) {
      adapterSubtitle = '<div style="font-size:11px;color:var(--gold-dim);margin-top:2px">One will be auto-added if you select a BNC antenna. This adds an extra</div>';
    }

    return `
    <div class="opt-card ${selectedAddlAntennas.has(a.key) ? 'selected' : ''}"
         onclick="toggleAddlAntenna('${a.key}')">
      <div class="oc-check">${selectedAddlAntennas.has(a.key) ? '✓' : ''}</div>
      ${a.img ? `<div class="oc-img"><img src="${a.img}" alt="${a.name}" onerror="this.parentElement.innerHTML='<div style=\\'color:#444;font-size:11px;text-align:center;padding:8px\\'>No img</div>'"></div>` : ''}
      <div class="oc-body">
        <div class="oc-name">${a.name}</div>
        <div class="oc-desc">${a.desc}</div>
        ${adapterSubtitle}
        <div class="oc-meta"></div>
      </div>
      <div class="oc-price">${a.price ? '+$' + a.price : 'Price TBD'}</div>
    </div>
  `}).join('');
}

function renderBatteryUpgrades() {
  const container = document.getElementById('battery-options');
  const rp = radioProducts[selectedRadioKey] || radioProducts['uv5r'];

  // Factory/included battery -always shown
  let factoryHtml = `
    <div class="opt-card selected" style="cursor:default;opacity:0.85">
      <div class="oc-check" style="background:var(--green);border-color:var(--green);color:#111">✓</div>
      <div class="oc-body">
        <div class="oc-name">${rp.batteryLabel}</div>
        <div class="oc-desc">${rp.batteryDesc}</div>
      </div>
      <div class="oc-price free" style="color:var(--green)">Included</div>
    </div>
  `;

  // If no battery upgrades available for this radio
  if (batteryUpgrades.length === 0) {
    container.innerHTML = factoryHtml;
    return;
  }

  const anySelected = selectedBatteries.size > 0;
  const isUv5r = selectedRadioKey === 'uv5r';
  let note = anySelected
    ? '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#5c5">' + (isUv5r ? 'USB-C batteries selected below. Each includes a USB-C charging cable.' : 'Extra batteries selected below. Great for extended field ops.') + '</div>'
    : '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:var(--muted)">' + (isUv5r ? 'Want to ditch the charging cradle? Add a USB-C rechargeable battery below. Grab extras for longer trips or to share across radios.' : 'Need extra runtime? Grab a spare battery to swap in the field without waiting to recharge.') + '</div>';

  container.innerHTML = factoryHtml + note + batteryUpgrades.map(b => {
    const qty = selectedBatteries.get(b.key) || 0;
    const isSelected = qty > 0;
    const showColorPicker = selectedRadioKey === 'uv-pro' && isSelected;
    const batColor = uvproBatteryColors.get(b.key) || uvproRadioColor; // default to radio color
    return `
    <div class="opt-card ${isSelected ? 'selected' : ''}"
         onclick="toggleBattery('${b.key}')">
      <div class="oc-check">${isSelected ? '✓' : ''}</div>
      ${b.img ? `<div class="oc-img"><img src="${b.img}" alt="${b.name}" onerror="this.parentElement.innerHTML='<div style=\\'color:#444;font-size:11px;text-align:center;padding:8px\\'>No img</div>'"></div>` : ''}
      <div class="oc-body">
        <div class="oc-name">${b.name}</div>
        <div class="oc-desc">${b.desc}</div>
        ${showColorPicker ? `
          <div class="color-picker" style="margin-top:6px" onclick="event.stopPropagation()">
            <span class="color-picker-label">Color:</span>
            <div class="color-swatch color-swatch--black ${batColor === 'black' ? 'active' : ''}"
                 onclick="setUvproBatteryColor('${b.key}','black')" title="Black"></div>
            <div class="color-swatch color-swatch--tan ${batColor === 'tan' ? 'active' : ''}"
                 onclick="setUvproBatteryColor('${b.key}','tan')" title="Tan / Coyote"></div>
            <span class="color-swatch-name">${batColor === 'black' ? 'Black' : 'Tan / Coyote'}</span>
          </div>
          ${batColor !== uvproRadioColor ? '<div style="font-size:11px;color:var(--rme-gold-dim);margin-top:4px">Note: battery color differs from your radio (' + (uvproRadioColor === 'black' ? 'Black' : 'Tan') + ')</div>' : ''}
        ` : ''}
      </div>
      ${isSelected ? `
        <div class="qty-stepper" onclick="event.stopPropagation()">
          <button onclick="batteryQty('${b.key}',-1)">−</button>
          <div class="qty-val">${qty}</div>
          <button onclick="batteryQty('${b.key}',1)">+</button>
        </div>
        <div class="oc-price">+$${b.price * qty}</div>
      ` : `<div class="oc-price">+$${b.price}/ea</div>`}
    </div>
  `}).join('');
}

function renderAccessories() {
  const container = document.getElementById('accessory-options');

  const helpGuide = `
    <div class="acc-help-toggle" onclick="this.nextElementSibling.classList.toggle('open');this.classList.toggle('open')">
      Not sure what you need? <span>Click here for a quick guide</span>
    </div>
    <div class="acc-help-panel">
      <ul>
        <li><strong>Cheat Sheets</strong> - Waterproof quick-reference cards. Great for beginners or field use.</li>
        <li><strong>Speakermic / Wireless Speakermic</strong> - Clip to your gear so you can talk hands-free. The most popular accessory.</li>
        <li><strong>Eartube Headset</strong> - Discreet earpiece for security, events, or when you don't want others hearing your radio.</li>
        <li><strong>Exoskeleton / Saddle</strong> - Protective gear. The exoskeleton prevents drops and accidental transmissions. The saddle covers your accessory port.</li>
        <li><strong>Programming Cable</strong> - For advanced users who want to program channels from a computer.</li>
        <li><strong>Earpro Cable</strong> - Connects your speakermic to electronic ear protection (shooting, machinery, etc.).</li>
        <li><strong>SO-239 Pigtail</strong> - Lets you connect your handheld to a full-size vehicle or base antenna.</li>
        <li><strong>Battery Eliminator</strong> - Run your radio from 12V power (vehicle, battery pack) instead of the internal battery.</li>
      </ul>
      <p style="margin:8px 0 0;color:var(--gold-dim)">Still unsure? Book a free consultation using the button below.</p>
    </div>
  `;

  container.innerHTML = helpGuide + accessories.map(a => `
    <div class="opt-card ${selectedAccessories.has(a.key) ? 'selected' : ''}"
         onclick="toggleAccessory('${a.key}')">
      <div class="oc-check">${selectedAccessories.has(a.key) ? '✓' : ''}</div>
      ${a.img ? `<div class="oc-img"><img src="${a.img}" alt="${a.name}" onerror="this.parentElement.innerHTML='<div style=\\'color:#444;font-size:11px;text-align:center;padding:8px\\'>No img</div>'"></div>` : ''}
      <div class="oc-body">
        <div class="oc-name">${a.name}</div>
        <div class="oc-desc">${a.desc}</div>
        <div class="oc-meta"></div>
      </div>
      <div class="oc-price">${a.price ? '+$' + a.price : 'Price TBD'}</div>
    </div>
  `).join('');
}

let _lastProgOpts = {};
function renderProgramming(opts) {
  if (opts) _lastProgOpts = opts;
  const _opts = _lastProgOpts || {};
  const container = (_opts._container && document.getElementById(_opts._container))
    || document.getElementById('programming-options');

  const standardChecked = programmingChoice === 'standard' ? 'checked' : '';
  const multiChecked = programmingChoice === 'multi' ? 'checked' : '';
  const noneChecked = programmingChoice === 'none' ? 'checked' : '';

  let html = '';

  // Option 1: Standard (included)
  html += `
    <div class="opt-card ${programmingChoice === 'standard' ? 'selected' : ''}"
         onclick="selectProgramming('standard')" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="oc-radio"></div>
        <div class="oc-body">
          <div class="oc-name">Standard Custom Programming <span class="prog-included">Included</span></div>
          <div class="oc-desc" style="max-height:none">GMRS channels (1-22 + repeater pairs), FRS, NOAA weather, and local repeaters for one location. Our recommended channel layout, ready to use out of the box.</div>
        </div>
        <div class="oc-price free" style="color:var(--green)">Included</div>
      </div>
      ${programmingChoice === 'standard' ? renderProgLocationFields() : ''}
    </div>
  `;

  // Option 2: Multi-location (+$10)
  html += `
    <div class="opt-card ${programmingChoice === 'multi' ? 'selected' : ''}"
         onclick="selectProgramming('multi')" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="oc-radio"></div>
        <div class="oc-body">
          <div class="oc-name">Multi-Location Programming <span class="prog-upcharge">+$10</span></div>
          <div class="oc-desc" style="max-height:none">Program repeaters for up to 4 locations. Radio memory slots are evenly divided between locations by default. Perfect if you travel between home, work, cabin, or other areas.</div>
        </div>
        <div class="oc-price">+$10</div>
      </div>
      ${programmingChoice === 'multi' ? renderProgMultiFields() : ''}
    </div>
  `;

  // Option 3: No programming (deemphasized)
  html += `
    <div class="opt-card prog-deemph ${programmingChoice === 'none' ? 'selected' : ''}"
         onclick="selectProgramming('none')">
      <div class="oc-radio"></div>
      <div class="oc-body">
        <div class="oc-name">Skip Programming. Ship Immediately</div>
        <div class="oc-desc" style="max-height:none">Radio ships with factory default channels only. Choose this if you plan to program it yourself via CHIRP or another method.</div>
      </div>
      <div class="oc-price free" style="color:var(--muted)">-</div>
    </div>
  `;

  // Notes field (always visible unless 'none')
  if (programmingChoice !== 'none') {
    const _rk = _opts.radioKey || selectedRadioKey;
    const _allRadios = [].concat(radioLineup, mobileRadioLineup || [], hfRadioLineup || []);
    const isDmr = _rk === 'dmr-6x2' || _rk === 'da-7x2' || _rk === 'd578';
    const selRadio = _allRadios.find(r => r.key === _rk);
    const showLicensing = interviewAnswers.use === 'professional' || (selRadio && selRadio.tags && selRadio.tags.includes('commercial'));
    html += `
      <div class="prog-section">
        ${isDmr ? `
        <div class="prog-field">
          <label>Brandmeister DMR ID <span style="color:var(--muted);font-weight:400">(optional, amateur radio license holders only)</span></label>
          <input type="text" maxlength="10" placeholder="e.g. 1234567" value="${progBrandmeisterId}"
                 oninput="progBrandmeisterId=this.value" onfocus="event.stopPropagation()">
          <div class="prog-note">If you have an amateur radio license and a Brandmeister ID, we'll program it into your radio for DMR digital voice. Don't have one yet? <a href="https://brandmeister.network" target="_blank" rel="noopener" style="color:var(--gold)">Register at brandmeister.network</a></div>
        </div>
        ` : ''}
        <div class="prog-field" onclick="event.stopPropagation()">
          ${(() => {
            // Check if license was added in a prior kit (multi-kit mode)
            const addedInPriorKit = kitSession.kits.length > 0 && kitSession.kits.some((k, i) => i < kitSession.currentKitIndex && k.cartItems && k.cartItems.some(item => item.name && item.name.includes('Itinerant')));
            if (addedInPriorKit && !wantsItinerantLicense) {
              return '<div style="font-size:13px;color:#4caf50;padding:12px;background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px">✓ Business Itinerant License Assistance already included in your order.</div>';
            }
            return `
            <div class="opt-card ${wantsItinerantLicense ? 'selected' : ''}" onclick="wantsItinerantLicense=!wantsItinerantLicense;renderProgramming()" style="margin-bottom:0">
              <div class="oc-check">${wantsItinerantLicense ? '✓' : ''}</div>
              <div class="oc-body">
                <div class="oc-name">Business Itinerant License Assistance</div>
                <div class="oc-desc" style="max-height:none">We'll help you obtain your FCC Business Itinerant license, valid for 10 years. One license covers all radios in your order. Required for commercial Part 90 operation.</div>
              </div>
              <div class="oc-price">+$579</div>
            </div>`;
          })()}
        </div>
        <div class="prog-field">
          <label>Anything else we should know about your programming preferences?</label>
          <textarea placeholder="e.g. Custom channel names, specific repeater frequencies, Part 90 channels (license required), etc."
                    onchange="progNotes=this.value" onfocus="event.stopPropagation()">${progNotes}</textarea>
          <div class="prog-note">Optional. Leave blank if standard programming is all you need.</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderProgLocationFields() {
  const shipChecked = progUseShipping ? 'checked' : '';
  const diffChecked = !progUseShipping ? 'checked' : '';
  const confirmedHtml = progConfirmedPrimary ? `<div class="prog-confirmed">✅ ${progConfirmedPrimary}</div>` : '';
  return `
    <div class="prog-section" onclick="event.stopPropagation()" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div class="prog-field">
        <label>Where will you primarily use this radio?</label>
        <div class="prog-radio-row" onclick="setProgShipping(true)">
          <input type="radio" name="prog-loc" ${shipChecked}> Same as my shipping address
        </div>
        <div class="prog-radio-row" onclick="setProgShipping(false)">
          <input type="radio" name="prog-loc" ${diffChecked}> A different location
        </div>
      </div>
      ${!progUseShipping ? `
        <div class="prog-field">
          <label>Zip code or City, State</label>
          <div class="prog-zip-row">
            <input type="text" maxlength="60" placeholder="e.g. 90210 or Denver, CO" value="${progZipPrimary}"
                   oninput="progZipPrimary=this.value;clearProgConfirm('primary')" onfocus="event.stopPropagation()"
                   onkeydown="if(event.key==='Enter'){event.preventDefault();lookupLocation('primary')}">
            <button class="prog-lookup-btn" onclick="event.stopPropagation();lookupLocation('primary')">Verify</button>
          </div>
          ${confirmedHtml}
          <div class="prog-note">We use this as the center point of our repeater search, pulling in repeaters from the surrounding area. One central location usually covers a wide radius, no need to add nearby cities separately.</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderProgMultiFields() {
  let zipsHtml = '';

  // Build ordered list: index 0 = primary, index 1+ = extras
  const totalLocs = 1 + progZipsExtra.length;

  // Primary location
  const confirmedPri = progConfirmedPrimary ? `<div class="prog-confirmed">\u2705 ${progConfirmedPrimary}</div>` : '';
  zipsHtml += `
    <div class="prog-field" draggable="true" data-loc-idx="0"
         ondragstart="locDragStart(event,0)" ondragover="locDragOver(event)" ondragenter="locDragEnter(event)"
         ondragleave="locDragLeave(event)" ondrop="locDrop(event,0)" ondragend="locDragEnd(event)">
      <label><span class="prog-drag-handle" title="Drag to reorder">\u2630</span> Location 1 (primary)</label>
      <div class="prog-zip-row">
        <input type="text" maxlength="60" placeholder="Zip code or City, State" value="${progZipPrimary}"
               oninput="progZipPrimary=this.value;clearProgConfirm('primary')" onfocus="event.stopPropagation()"
               onkeydown="if(event.key==='Enter'){event.preventDefault();lookupLocation('primary')}">
        <button class="prog-lookup-btn" onclick="event.stopPropagation();lookupLocation('primary')">Verify</button>
      </div>
      ${confirmedPri}
    </div>
  `;

  // Extra locations (up to 3 more = 4 total)
  for (let i = 0; i < progZipsExtra.length; i++) {
    const confirmedExtra = progConfirmedExtras[i] ? `<div class="prog-confirmed">\u2705 ${progConfirmedExtras[i]}</div>` : '';
    zipsHtml += `
      <div class="prog-field" draggable="true" data-loc-idx="${i + 1}"
           ondragstart="locDragStart(event,${i + 1})" ondragover="locDragOver(event)" ondragenter="locDragEnter(event)"
           ondragleave="locDragLeave(event)" ondrop="locDrop(event,${i + 1})" ondragend="locDragEnd(event)">
        <label><span class="prog-drag-handle" title="Drag to reorder">\u2630</span> Location ${i + 2}</label>
        <div class="prog-zip-row">
          <input type="text" maxlength="60" placeholder="Zip code or City, State" value="${progZipsExtra[i]}"
                 oninput="progZipsExtra[${i}]=this.value;clearProgConfirm('extra',${i})" onfocus="event.stopPropagation()"
                 onkeydown="if(event.key==='Enter'){event.preventDefault();lookupLocation('extra',${i})}">
          <button class="prog-lookup-btn" onclick="event.stopPropagation();lookupLocation('extra',${i})">Verify</button>
          <button class="prog-zip-remove" onclick="event.stopPropagation();removeProgZip(${i})" title="Remove">&times;</button>
        </div>
        ${confirmedExtra}
      </div>
    `;
  }

  const canAddMore = progZipsExtra.length < 3;

  return `
    <div class="prog-section prog-locations-container" onclick="event.stopPropagation()" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      ${zipsHtml}
      ${canAddMore ? '<div class="prog-add-zip" onclick="event.stopPropagation();addProgZip()">+ Add another location</div>' : '<div class="prog-note">Maximum 4 locations reached.</div>'}
      <div class="prog-note" style="margin-top:12px">Each location is used as a center point for a repeater search of the surrounding area. Only add separate locations for areas that are far apart (e.g. home vs. vacation cabin). Drag <span style="color:var(--gold)">\u2630</span> to reorder. Memory slots are evenly divided between locations by default \u2014 mention in notes if you need a different split.</div>
    </div>
  `;
}

function selectProgramming(choice) {
  programmingChoice = choice;
  if (choice === 'standard') { progZipsExtra = []; progConfirmedExtras = []; progCoords.extras = []; }
  renderProgramming();
  updateBottomBar();
}

function setProgShipping(useShipping) {
  progUseShipping = useShipping;
  renderProgramming();
}

function addProgZip() {
  if (progZipsExtra.length < 3) {
    progZipsExtra.push('');
    progConfirmedExtras.push('');
    renderProgramming();
  }
}

function removeProgZip(index) {
  progZipsExtra.splice(index, 1);
  progConfirmedExtras.splice(index, 1);
  progCoords.extras.splice(index, 1);
  renderProgramming();
}

// ── Drag-and-drop reordering for locations ──
let locDragIdx = null;

function locDragStart(e, idx) {
  locDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', idx);
  requestAnimationFrame(() => e.target.closest('.prog-field').classList.add('dragging'));
}

function locDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function locDragEnter(e) {
  e.preventDefault();
  const field = e.target.closest('.prog-field[draggable]');
  if (field) field.classList.add('drag-over');
}

function locDragLeave(e) {
  const field = e.target.closest('.prog-field[draggable]');
  if (field && !field.contains(e.relatedTarget)) field.classList.remove('drag-over');
}

function locDrop(e, targetIdx) {
  e.preventDefault();
  const field = e.target.closest('.prog-field[draggable]');
  if (field) field.classList.remove('drag-over');
  if (locDragIdx === null || locDragIdx === targetIdx) return;

  // Build a flat array of all locations: [primary, ...extras]
  const allValues = [progZipPrimary, ...progZipsExtra];
  const allConfirmed = [progConfirmedPrimary, ...progConfirmedExtras];
  const allCoords = [progCoords.primary, ...progCoords.extras];

  // Reorder: remove from source, insert at target
  const [movedVal] = allValues.splice(locDragIdx, 1);
  const [movedConf] = allConfirmed.splice(locDragIdx, 1);
  const [movedCoord] = allCoords.splice(locDragIdx, 1);
  allValues.splice(targetIdx, 0, movedVal);
  allConfirmed.splice(targetIdx, 0, movedConf);
  allCoords.splice(targetIdx, 0, movedCoord);

  // Write back
  progZipPrimary = allValues[0];
  progConfirmedPrimary = allConfirmed[0];
  progCoords.primary = allCoords[0];
  progZipsExtra = allValues.slice(1);
  progConfirmedExtras = allConfirmed.slice(1);
  progCoords.extras = allCoords.slice(1);

  locDragIdx = null;
  renderProgramming();
  checkProximityWarnings();
}

function locDragEnd(e) {
  locDragIdx = null;
  document.querySelectorAll('.prog-field.dragging, .prog-field.drag-over').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
}

function clearProgConfirm(which, index) {
  if (which === 'primary') { progConfirmedPrimary = ''; progCoords.primary = null; }
  else if (which === 'extra' && index !== undefined) { progConfirmedExtras[index] = ''; progCoords.extras[index] = null; }
}

async function lookupLocation(which, index) {
  const raw = which === 'primary' ? progZipPrimary : progZipsExtra[index];
  if (!raw || !raw.trim()) return;
  const val = raw.trim();

  // Determine if zip code or city/state
  const isZip = /^\d{5}$/.test(val);

  try {
    let city, state, zip, lat, lon;
    if (isZip) {
      // Zip code lookup via Zippopotam.us
      const resp = await fetch(`https://api.zippopotam.us/us/${val}`);
      if (!resp.ok) throw new Error('not found');
      const data = await resp.json();
      city = data.places[0]['place name'];
      state = data.places[0]['state abbreviation'];
      lat = parseFloat(data.places[0].latitude);
      lon = parseFloat(data.places[0].longitude);
      zip = val;
    } else {
      // City/state -try to parse and look up
      const parts = val.split(',').map(s => s.trim());
      if (parts.length < 2) {
        showProgError(which, index, 'Please enter as "City, State" (e.g. Denver, CO) or a 5-digit zip code.');
        return;
      }
      const searchCity = parts[0];
      const searchState = parts[1].replace(/\./g, '').toUpperCase();
      // Use Nominatim for city/state → confirmation
      const q = encodeURIComponent(`${searchCity}, ${searchState}, US`);
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&countrycodes=us&limit=1&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) throw new Error('lookup failed');
      const results = await resp.json();
      if (!results.length) throw new Error('not found');
      const addr = results[0].address;
      city = addr.city || addr.town || addr.village || addr.hamlet || searchCity;
      state = addr.state ? getStateAbbr(addr.state) || addr.state : searchState;
      zip = addr.postcode || '';
      lat = parseFloat(results[0].lat);
      lon = parseFloat(results[0].lon);
    }

    const display = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
    if (which === 'primary') {
      progConfirmedPrimary = display;
      progCoords.primary = lat != null ? { lat, lon } : null;
    } else {
      progConfirmedExtras[index] = display;
      progCoords.extras[index] = lat != null ? { lat, lon } : null;
    }
    renderProgramming();
    checkProximityWarnings();
  } catch (e) {
    showProgError(which, index, 'Could not verify that location. Please check and try again.');
  }
}

function showProgError(which, index, msg) {
  // Briefly show error inline
  const label = which === 'primary' ? 'primary' : `extra-${index}`;
  const existing = document.querySelector(`.prog-error-${label}`);
  if (existing) existing.remove();
  const inputs = document.querySelectorAll('.prog-zip-row');
  const target = which === 'primary' ? inputs[0] : inputs[index + (programmingChoice === 'multi' ? 1 : 0)];
  if (!target) return;
  const err = document.createElement('div');
  err.className = `prog-confirmed prog-error-${label}`;
  err.style.color = 'var(--red)';
  err.textContent = msg;
  target.parentElement.insertBefore(err, target.nextElementSibling);
  setTimeout(() => err.remove(), 5000);
}

// Haversine distance in miles between two {lat, lon} objects
function haversineMiles(a, b) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function checkProximityWarnings() {
  // Remove any existing proximity warning
  document.querySelectorAll('.prog-proximity-warning').forEach(el => el.remove());

  // Gather all confirmed coordinates
  const locs = [];
  if (progCoords.primary) locs.push({ coord: progCoords.primary, label: progConfirmedPrimary });
  progCoords.extras.forEach((c, i) => {
    if (c) locs.push({ coord: c, label: progConfirmedExtras[i] });
  });

  if (locs.length < 2) return;

  // Check all pairs
  const THRESHOLD_MILES = 30;
  const closePairs = [];
  for (let i = 0; i < locs.length; i++) {
    for (let j = i + 1; j < locs.length; j++) {
      const dist = haversineMiles(locs[i].coord, locs[j].coord);
      if (dist < THRESHOLD_MILES) {
        closePairs.push({ a: locs[i].label, b: locs[j].label, dist: Math.round(dist) });
      }
    }
  }

  if (!closePairs.length) return;

  // Show warning after the last prog-field
  const container = document.querySelector('.prog-section');
  if (!container) return;
  const warning = document.createElement('div');
  warning.className = 'prog-proximity-warning';
  warning.style.cssText = 'margin-top:12px;padding:10px 14px;background:#2a2000;border:1px solid var(--gold-dim);border-radius:6px;font-size:13px;color:var(--gold);line-height:1.5;';
  const pairDescs = closePairs.map(p => `<strong>${p.a}</strong> and <strong>${p.b}</strong> (~${p.dist} mi apart)`).join(', ');
  warning.innerHTML = `⚠️ These locations appear close together: ${pairDescs}. Our repeater search covers a wide area around each center point, so one location may be enough to cover both. Consider removing the closer one unless they're in different coverage areas (e.g. separated by mountains).`;
  container.appendChild(warning);
}

// US state name → abbreviation
const _stateMap = {Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'};
function getStateAbbr(name) { return _stateMap[name] || null; }

function reviewEditStep(stepName) {
  const steps = getSteps();
  const idx = steps.findIndex(s => s.name === stepName);
  if (idx >= 0) goStep(idx);
}

function renderReview() {
  const list = document.getElementById('review-list');
  let items = [];
  const editStyle = 'font-size:12px;color:var(--gold);cursor:pointer;text-transform:uppercase;letter-spacing:1px;margin-left:8px;padding:8px 12px;border-radius:4px;min-height:36px;display:inline-flex;align-items:center';

  // Base kit -no remove button
  const selRadio = radioLineup.find(r => r.key === selectedRadioKey) || radioLineup[0];
  const colorNote = selectedRadioKey === 'uv-pro' ? ` (${uvproRadioColor === 'black' ? 'Black' : 'Tan / Coyote'})` : '';
  items.push(`
    <div class="review-item base">
      <div class="ri-img"><img src="${selRadio.img}" alt="" onerror="this.parentElement.innerHTML='📻'"></div>
      <div class="ri-name">${selRadio.name}<small>Base kit: pre-programmed radio + essentials${colorNote}</small></div>
      <div class="ri-price">$${selRadio.price}</div>
    </div>
  `);

  // Antenna upgrades
  if (selectedAntennas.size > 0 || selectedAddlAntennas.size > 0) {
    items.push(`<div style="font-size:12px;color:var(--muted);padding:12px 0 4px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span>ANTENNAS</span><span style="${editStyle}" onclick="reviewEditStep('Antennas')">Edit</span></div>`);
  }
  selectedAntennas.forEach(key => {
    const ant = antennaUpgrades.find(a => a.key === key);
    if (ant) {
      items.push(`
        <div class="review-item">
          <div class="ri-img">${ant.img ? `<img src="${ant.img}" alt="">` : ''}</div>
          <div class="ri-name">${ant.name}<small>Antenna upgrade, mounts directly on radio</small></div>
          <div class="ri-price">+$${ant.price}</div>
          <button class="ri-remove" onclick="reviewRemove('antenna','${key}')" title="Remove">&times;</button>
        </div>
      `);
    }
  });

  // BNC adapter -auto-included, removable with warning
  const hasUpgrade = selectedAntennas.size > 0;
  const anyBNCNeeded = hasUpgrade || [...selectedAddlAntennas].some(key => {
    const a = additionalAntennas.find(x => x.key === key);
    return a && a.needsAdapter;
  });
  if (anyBNCNeeded && !adapterSuppressed) {
    items.push(`
      <div class="review-item" style="opacity:0.7">
        <div class="ri-img"><img src="${S}2022/09/smaftobncf.jpg" alt=""></div>
        <div class="ri-name">SMA-F to BNC-F Adapter<small>${hasUpgrade ? 'Included with antenna upgrade' : 'Auto-added, required for BNC antennas'}</small></div>
        <div class="ri-price">+$5</div>
        <button class="ri-remove" onclick="reviewRemoveAdapter('auto')" title="Remove">&times;</button>
      </div>
    `);
  }

  // Additional antennas (excluding extra adapter)
  selectedAddlAntennas.forEach(key => {
    const a = additionalAntennas.find(x => x.key === key);
    if (a && !a.isAdapter) {
      items.push(`
        <div class="review-item">
          <div class="ri-img">${a.img ? `<img src="${a.img}" alt="">` : ''}</div>
          <div class="ri-name">${a.name}<small>Additional antenna</small></div>
          <div class="ri-price">${a.price ? '+$' + a.price : 'TBD'}</div>
          <button class="ri-remove" onclick="reviewRemove('addl','${key}')" title="Remove">&times;</button>
        </div>
      `);
    }
  });

  // Extra adapter
  if (selectedAddlAntennas.has('extraadapter')) {
    items.push(`
      <div class="review-item">
        <div class="ri-img"><img src="${S}2022/09/smaftobncf.jpg" alt=""></div>
        <div class="ri-name">Extra SMA-F to BNC-F Adapter<small>Spare adapter</small></div>
        <div class="ri-price">+$5</div>
        <button class="ri-remove" onclick="reviewRemoveAdapter('extra')" title="Remove">&times;</button>
      </div>
    `);
  }

  // Battery upgrades
  if (selectedBatteries.size > 0) {
    items.push(`<div style="font-size:12px;color:var(--muted);padding:12px 0 4px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span>BATTERIES</span><span style="${editStyle}" onclick="reviewEditStep('Battery')">Edit</span></div>`);
  }
  selectedBatteries.forEach((qty, key) => {
    const bat = batteryUpgrades.find(b => b.key === key);
    if (bat) {
      items.push(`
        <div class="review-item">
          <div class="ri-img">${bat.img ? `<img src="${bat.img}" alt="">` : ''}</div>
          <div class="ri-name">${bat.name}${qty > 1 ? ' <small>×' + qty + '</small>' : ''}<small>Battery upgrade${selectedRadioKey === 'uv-pro' ? ` (${(uvproBatteryColors.get(key) || uvproRadioColor) === 'black' ? 'Black' : 'Tan / Coyote'})` : ''}</small></div>
          <div class="ri-price">+$${bat.price * qty}</div>
          <button class="ri-remove" onclick="reviewRemove('battery','${key}')" title="Remove">&times;</button>
        </div>
      `);
    }
  });

  // Accessories
  if (selectedAccessories.size > 0) {
    items.push(`<div style="font-size:12px;color:var(--muted);padding:12px 0 4px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span>ACCESSORIES</span><span style="${editStyle}" onclick="reviewEditStep('Accessories')">Edit</span></div>`);
  }
  selectedAccessories.forEach(key => {
    const a = accessories.find(x => x.key === key);
    if (a) {
      items.push(`
        <div class="review-item">
          <div class="ri-img">${a.img ? `<img src="${a.img}" alt="">` : ''}</div>
          <div class="ri-name">${a.name}<small>Accessory</small></div>
          <div class="ri-price">${a.price ? '+$' + a.price : 'TBD'}</div>
          <button class="ri-remove" onclick="reviewRemove('accessory','${key}')" title="Remove">&times;</button>
        </div>
      `);
    }
  });

  // Programming
  items.push(`<div style="font-size:12px;color:var(--muted);padding:12px 0 4px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span>PROGRAMMING</span><span style="${editStyle}" onclick="reviewEditStep('Programming')">Edit</span></div>`);
  if (programmingChoice === 'standard') {
    const loc = progUseShipping ? 'shipping address' : (progZipPrimary || 'TBD');
    items.push(`
      <div class="review-item" style="opacity:0.7">
        <div class="ri-img" style="background:var(--card);display:flex;align-items:center;justify-content:center;font-size:24px">📡</div>
        <div class="ri-name">Custom Programming<small>Standard: local repeaters for ${loc}</small></div>
        <div class="ri-price" style="color:var(--green)">Included</div>
      </div>
    `);
  } else if (programmingChoice === 'multi') {
    const locs = [progZipPrimary, ...progZipsExtra].filter(z => z).join(', ') || 'TBD';
    items.push(`
      <div class="review-item">
        <div class="ri-img" style="background:var(--card);display:flex;align-items:center;justify-content:center;font-size:24px">📡</div>
        <div class="ri-name">Multi-Location Programming<small>Up to 4 locations: ${locs}</small></div>
        <div class="ri-price">+$10</div>
        <button class="ri-remove" onclick="reviewRemove('programming')" title="Remove">&times;</button>
      </div>
    `);
  } else {
    items.push(`
      <div class="review-item" style="opacity:0.5">
        <div class="ri-img" style="background:var(--card);display:flex;align-items:center;justify-content:center;font-size:24px">📡</div>
        <div class="ri-name">No Programming<small>Ships with factory defaults. Program it yourself</small></div>
        <div class="ri-price" style="color:var(--muted)">-</div>
      </div>
    `);
  }

  // Business itinerant license
  if (wantsItinerantLicense) {
    items.push(`
      <div class="review-item">
        <div class="ri-img" style="background:var(--card);display:flex;align-items:center;justify-content:center;font-size:24px">📋</div>
        <div class="ri-name">Business Itinerant License Assistance<small>FCC license, valid 10 years</small></div>
        <div class="ri-price">+$579</div>
        <button class="ri-remove" onclick="reviewRemove('license')" title="Remove">&times;</button>
      </div>
    `);
  }

  if (items.length === 1) {
    items.push('<div class="empty-state">No upgrades or accessories selected. Just the base kit.</div>');
  }

  // Volume discount for this kit's category
  const kitCat = kitSession.kits.length > 0 ? kitSession.kits[kitSession.currentKitIndex]?.category : null;
  const catCount = kitCat ? kitSession.kits.filter(k => k.category === kitCat).length : 0;
  const volTier = getVolumeTier(catCount);
  const total = calcTotal();
  if (volTier) {
    const discount = Math.round(BASE_PRICE * volTier.pct / 100);
    items.push(`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;margin-top:8px">
        <span style="color:#5c5;font-size:14px;font-weight:500">${volTier.label} Discount (${volTier.pct}% off base)</span>
        <span style="color:#5c5;font-size:16px;font-weight:700">-$${discount}</span>
      </div>
    `);
  }
  items.push(`
    <div class="review-total">
      <div class="rt-label">Kit Total</div>
      <div class="rt-price">$${volTier ? total - Math.round(BASE_PRICE * volTier.pct / 100) : total}</div>
    </div>
  `);

  // Determine CTA based on multi-kit vs single-kit mode
  const isMultiKit = kitSession.kits.length > 1;
  const isLastKit = kitSession.currentKitIndex >= kitSession.kits.length - 1;
  rmeDebug('REVIEW CTA', `kits=${kitSession.kits.length} idx=${kitSession.currentKitIndex} multiKit=${isMultiKit} isLastKit=${isLastKit}`);
  const ctaBtnStyle = 'display:inline-block;background:#fdd351;color:#000;font-family:inherit;font-size:17px;font-weight:600;padding:16px 40px;border:none;border-radius:8px;cursor:pointer;text-transform:uppercase;letter-spacing:1px;margin-top:24px';
  const editHint = '<div style="color:#c4a83a;font-size:12px;margin-top:8px">Use the Edit links above or the Back button to make changes</div>';
  if (isMultiKit && !isLastKit) {
    items.push(`
      <div style="text-align:center;padding:24px 0 16px">
        <button style="${ctaBtnStyle}" onclick="document.getElementById('btn-next').click()">
          Complete This Kit &amp; Build Next →
        </button>
        ${editHint}
      </div>
    `);
  } else if (isMultiKit && isLastKit) {
    items.push(`
      <div style="text-align:center;padding:24px 0 16px">
        <button style="${ctaBtnStyle}" onclick="document.getElementById('btn-next').click()">
          Complete Kit &amp; Review All →
        </button>
        ${editHint}
      </div>
    `);
  } else {
    items.push(`
      <div style="text-align:center;padding:24px 0 16px">
        <button style="${ctaBtnStyle}" onclick="document.getElementById('btn-next').click()">
          Add to Cart →
        </button>
        ${editHint}
      </div>
    `);
  }

  list.innerHTML = items.join('');
}

// ── Review remove handlers ──────────────────────────
function reviewRemove(type, key) {
  if (type === 'antenna') { selectedAntennas.delete(key); }
  else if (type === 'addl') { selectedAddlAntennas.delete(key); }
  else if (type === 'battery') { selectedBatteries.delete(key); }
  else if (type === 'programming') { programmingChoice = 'standard'; }
  else if (type === 'accessory') { selectedAccessories.delete(key); }
  else if (type === 'license') { wantsItinerantLicense = false; }
  updateBottomBar();
  renderReview();
}

function reviewRemoveAdapter(which) {
  // Count how many BNC antennas depend on adapters
  const bncUpgrades = selectedAntennas.size; // all upgrades are BNC
  const bncAddl = [...selectedAddlAntennas].filter(key => {
    const a = additionalAntennas.find(x => x.key === key);
    return a && a.needsAdapter;
  });
  const totalBNCAntennas = bncUpgrades + bncAddl.length;

  // Count how many adapters they currently have
  const hasAutoAdapter = bncUpgrades > 0 || bncAddl.length > 0; // the auto one
  const hasExtraAdapter = selectedAddlAntennas.has('extraadapter');
  const adapterCount = (hasAutoAdapter ? 1 : 0) + (hasExtraAdapter ? 1 : 0);

  if (which === 'extra') {
    // Removing the spare -just remove it
    selectedAddlAntennas.delete('extraadapter');
    updateBottomBar();
    renderReview();
    return;
  }

  // Removing the auto adapter -warn if BNC antennas still in cart
  if (totalBNCAntennas > 0) {
    // Build list of affected antenna names
    let affected = [];
    selectedAntennas.forEach(key => {
      const a = antennaUpgrades.find(x => x.key === key);
      if (a) affected.push(a.name);
    });
    bncAddl.forEach(key => {
      const a = additionalAntennas.find(x => x.key === key);
      if (a) affected.push(a.name);
    });

    document.getElementById('adapter-warn-list').innerHTML = affected.map(n => '<li>' + n + '</li>').join('');
    document.getElementById('adapter-warn-modal').classList.add('open');
    return;
  }

  // No BNC antennas -safe to remove (shouldn't normally happen)
  updateBottomBar();
  renderReview();
}

function adapterWarnKeep() {
  document.getElementById('adapter-warn-modal').classList.remove('open');
}

function adapterWarnRemoveOnly() {
  // Remove adapter from order but keep all antennas -user has their own
  adapterSuppressed = true;
  document.getElementById('adapter-warn-modal').classList.remove('open');
  updateBottomBar();
  renderReview();
}

function adapterWarnRemoveAll() {
  // Remove all BNC antennas and the adapter
  selectedAntennas.clear();
  [...selectedAddlAntennas].forEach(key => {
    const a = additionalAntennas.find(x => x.key === key);
    if (a && (a.needsAdapter || a.isAdapter)) selectedAddlAntennas.delete(key);
  });
  document.getElementById('adapter-warn-modal').classList.remove('open');
  updateBottomBar();
  renderReview();
}

// ── Selection handlers ──────────────────────────────
function toggleAntenna(key) {
  if (selectedAntennas.has(key)) selectedAntennas.delete(key);
  else { selectedAntennas.add(key); adapterSuppressed = false; }
  renderAntennaUpgrades();
  updateBottomBar();
}

function toggleAddlAntenna(key) {
  if (selectedAddlAntennas.has(key)) {
    selectedAddlAntennas.delete(key);
    renderAllAntennas();
    updateBottomBar();
    return;
  }

  // Check if this antenna needs a BNC adapter and user doesn't have one yet
  const item = additionalAntennas.find(x => x.key === key);
  const hasAdapter = selectedAntennas.size > 0 || selectedAddlAntennas.has('extraadapter');
  if (item && item.needsAdapter && !hasAdapter) {
    // Show adapter prompt
    pendingAntennaKey = key;
    document.getElementById('adapter-modal').classList.add('open');
    return;
  }

  selectedAddlAntennas.add(key);
  renderAllAntennas();
  updateBottomBar();
}

let pendingAntennaKey = null;

function adapterModalAdd() {
  // Add both the adapter and the pending antenna
  adapterSuppressed = false;
  selectedAddlAntennas.add('extraadapter');
  selectedAddlAntennas.add(pendingAntennaKey);
  pendingAntennaKey = null;
  document.getElementById('adapter-modal').classList.remove('open');
  renderAllAntennas();
  updateBottomBar();
}

function adapterModalSkip() {
  // User says they already have an adapter -add antenna without adapter
  selectedAddlAntennas.add(pendingAntennaKey);
  pendingAntennaKey = null;
  document.getElementById('adapter-modal').classList.remove('open');
  renderAllAntennas();
  updateBottomBar();
}

function adapterModalCancel() {
  // User declined -don't add the antenna
  pendingAntennaKey = null;
  document.getElementById('adapter-modal').classList.remove('open');
}

function toggleBattery(key) {
  if (selectedBatteries.has(key)) {
    selectedBatteries.delete(key);
    uvproBatteryColors.delete(key);
  } else {
    selectedBatteries.set(key, 1);
    // Default battery color to match the radio color for UV-PRO
    if (selectedRadioKey === 'uv-pro' && !uvproBatteryColors.has(key)) {
      uvproBatteryColors.set(key, uvproRadioColor);
    }
  }
  renderBatteryUpgrades();
  updateBottomBar();
}

function batteryQty(key, delta) {
  const current = selectedBatteries.get(key) || 0;
  const newQty = current + delta;
  if (newQty <= 0) selectedBatteries.delete(key);
  else selectedBatteries.set(key, newQty);
  renderBatteryUpgrades();
  updateBottomBar();
}

// UV-PRO color selection (kept for battery color picker re-render)
function setUvproRadioColor(color) {
  uvproRadioColor = color;
  renderBatteryUpgrades();
}

function setUvproBatteryColor(batteryKey, color) {
  uvproBatteryColors.set(batteryKey, color);
  renderBatteryUpgrades();
}

function toggleAccessory(key) {
  if (selectedAccessories.has(key)) selectedAccessories.delete(key);
  else selectedAccessories.add(key);
  renderAccessories();
  updateBottomBar();
}

// ── Total calculation ───────────────────────────────
function calcTotal() {
  let total = BASE_PRICE;
  const hasUpgrade = selectedAntennas.size > 0;

  // Sum all selected antenna upgrades
  selectedAntennas.forEach(key => {
    const a = antennaUpgrades.find(x => x.key === key);
    if (a) total += a.price;
  });

  // Additional antennas
  selectedAddlAntennas.forEach(key => {
    const a = additionalAntennas.find(x => x.key === key);
    if (a && a.price) total += a.price;
  });

  // BNC adapter ($5) added ONCE if any BNC antenna is selected (upgrade or additional)
  const anyBNC = hasUpgrade || [...selectedAddlAntennas].some(key => {
    const a = additionalAntennas.find(x => x.key === key);
    return a && a.needsAdapter;
  });
  if (anyBNC && !adapterSuppressed) total += ADAPTER_PRICE;

  // Battery upgrades
  selectedBatteries.forEach((qty, key) => {
    const bat = batteryUpgrades.find(b => b.key === key);
    if (bat) total += bat.price * qty;
  });

  // Programming upcharge
  if (programmingChoice === 'multi') total += 10;

  // Business license shown in combined review total, not per-kit

  // Accessories
  selectedAccessories.forEach(key => {
    const a = accessories.find(x => x.key === key);
    if (a && a.price) total += a.price;
  });
  return total;
}

function countAddons() {
  let count = selectedAntennas.size;
  count += selectedAddlAntennas.size;
  selectedBatteries.forEach((qty) => { count += qty; });
  if (programmingChoice === 'multi') count++;
  count += selectedAccessories.size;
  return count;
}

// WC variation ID mapping for products with required variations
const variationMap = {
  // UV-PRO Kit: parent 7862
  7862: { black: 9065, tan: 9066 },
  // UV-PRO Battery: parent 8312
  8312: { black: 8313, tan: 8314 },
  // Cheat Sheets: parent 966
  966: { _default: 9111, 'uv5r': 9111, 'uv5r-mini': 9111, 'dmr-6x2': 9112, 'da-7x2': 9112, 'uv-pro': 9113 },
  // BNC MOLLE Antenna Mount: parent 8717 — 8718=bracket only, 8719=BNC coax, 8720=TNC coax, 9448=PL-259 to BNC (mobile)
  8717: { _default: 8719, 'uv50pro': 9448, 'd578': 9448 },
};

function resolveVariationId(parentId, context) {
  const map = variationMap[parentId];
  if (!map) return parentId; // no variations, use parent
  // For color-based variations (UV-PRO kit and battery)
  if (map.black && map.tan) {
    const color = context.color || uvproRadioColor || 'black';
    return map[color] || parentId;
  }
  // For radio-based variations (cheat sheets)
  if (context.radioKey && map[context.radioKey]) {
    return map[context.radioKey];
  }
  // Default variation (e.g. MOLLE mount → BNC coax config)
  if (map._default) return map._default;
  return parentId;
}

function collectHandheldCartItems() {
  const selRadio = radioLineup.find(r => r.key === selectedRadioKey) || radioLineup[0];
  const radioId = resolveVariationId(selRadio.id, { color: uvproRadioColor, radioKey: selectedRadioKey });
  let items = [{ name: selRadio.name, price: selRadio.price, id: radioId }];

  selectedAntennas.forEach(key => {
    const a = antennaUpgrades.find(x => x.key === key);
    if (a) {
      // Antenna upgrades use ids[] array: [antennaProductId, adapterId]. Use first element for the antenna itself.
      const antennaId = a.ids ? a.ids[0] : a.id;
      items.push({ name: a.name, price: a.price, id: antennaId });
    }
  });

  const hasUpgrade = selectedAntennas.size > 0;
  const anyBNC = hasUpgrade || [...selectedAddlAntennas].some(key => {
    const a = additionalAntennas.find(x => x.key === key);
    return a && a.needsAdapter;
  });
  if (anyBNC && !adapterSuppressed) items.push({ name: 'SMA-F to BNC-F Adapter', price: 5, id: 456 });

  selectedAddlAntennas.forEach(key => {
    const a = additionalAntennas.find(x => x.key === key);
    if (a && !a.isAdapter) {
      const addlId = resolveVariationId(a.id, { radioKey: selectedRadioKey });
      items.push({ name: a.name, price: a.price || 0, id: addlId });
    }
  });

  selectedBatteries.forEach((qty, key) => {
    const bat = batteryUpgrades.find(b => b.key === key);
    if (bat) {
      const batColor = uvproBatteryColors.get(key) || uvproRadioColor;
      const batId = resolveVariationId(bat.id, { color: batColor });
      items.push({ name: bat.name + (qty > 1 ? ' x' + qty : ''), price: bat.price * qty, id: batId, qty: qty });
    }
  });

  if (programmingChoice === 'multi') items.push({ name: 'Multi-Location Programming', price: 10, id: 624 });
  // Business license collected globally in addAllKitsToCart()

  selectedAccessories.forEach(key => {
    const a = accessories.find(x => x.key === key);
    if (a) {
      const accId = resolveVariationId(a.id, { radioKey: selectedRadioKey });
      items.push({ name: a.name, price: a.price || 0, id: accId });
    }
  });

  return items;
}

function updateBottomBar() {
  if (window._rmeScrollMode) return; // scroll variant has its own price bar
  const total = calcTotal();
  const adds = total - BASE_PRICE;
  const count = countAddons();
  const bbBase = document.querySelector('.bb-base');
  if (bbBase) bbBase.textContent = 'Base kit: $' + BASE_PRICE;
  document.getElementById('bb-total').textContent = '$' + total;
  document.getElementById('bb-adds').textContent = adds > 0 ? '+ $' + adds + ' add-ons' : '+ $0 add-ons';
  document.getElementById('bb-items').textContent = count > 0 ? count + ' item' + (count > 1 ? 's' : '') + ' added' : 'Base kit only';
}

// ── Navigation ──────────────────────────────────────
function goStep(n) {
  if (window._rmeScrollMode) return; // scroll variant handles its own navigation
  rmeDebug('STEP', `→ step ${n}`);
  const steps = getSteps();
  if (n < 0 || n >= steps.length) return;
  currentStep = n;

  // Show/hide sections by ID
  const allSectionIds = ['step-color', 'step-0', 'step-1', 'step-2', 'step-3', 'step-4', 'step-5']; // step-1 kept for cleanup
  allSectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active'); el.style.display = 'none'; }
  });
  const activeEl = document.getElementById(steps[n].id);
  if (activeEl) { activeEl.classList.add('active'); activeEl.style.display = 'block'; animatePhase(activeEl); }

  // Update progress
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    el.classList.remove('done', 'active');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  });

  // Update labels
  document.querySelectorAll('.step-label').forEach((el, i) => {
    el.classList.remove('done', 'active');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  });

  // Update mobile step indicator
  document.getElementById('sm-label').textContent = 'Step ' + (n + 1) + ' of ' + steps.length + ': ' + steps[n].name;
  document.querySelectorAll('.sm-dot').forEach((el, i) => {
    el.classList.remove('done', 'active');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  });

  // Update buttons
  const back = document.getElementById('btn-back');
  const next = document.getElementById('btn-next');
  back.style.display = '';
  if (n === 0) {
    // On first wizard step, back goes to radio selection
    back.onclick = function() {
      document.getElementById('wizard-phase').style.display = 'none';
      { const _bb = document.querySelector('.rme-kb-bottom-bar'); if (_bb) _bb.style.display = 'none'; }
      // Return to selector or kit plan depending on mode
      if (kitSession.kits.length > 0) {
        backToKitPlan();
      } else {
        document.getElementById('selector-phase').style.display = 'block';
        document.getElementById('selector-landing').style.display = '';
        document.getElementById('interview-container').style.display = 'none';
        document.getElementById('radio-picker').style.display = 'none';
      }
    };
  } else {
    back.onclick = prevStep;
  }

  // Show consultation button on all steps; dim on review to prevent layout shift
  const consultBtn = document.getElementById('btn-consult');
  if (consultBtn) {
    consultBtn.style.display = '';
    consultBtn.style.opacity = n === steps.length - 1 ? '0.4' : '1';
    consultBtn.style.pointerEvents = n === steps.length - 1 ? 'none' : '';
    consultBtn.href = getCalendlyUrl();
  }

  if (n === steps.length - 1) {
    // Review step
    const inSession = kitSession.kits.length > 0;
    const isSingleKit = kitSession.kits.length === 1;
    next.textContent = !inSession || isSingleKit ? '🛒  Add to Cart' : '✓ Complete Kit';
    next.className = 'btn-nav btn-cart';
    next.onclick = function() {
      if (inSession) {
        completeCurrentKit(collectHandheldCartItems(), {
          zip: progUseShipping ? '' : progZipPrimary,
          notes: progNotes,
          brandmeisterId: progBrandmeisterId,
          choice: programmingChoice,
          useShipping: progUseShipping,
          zipsExtra: [...progZipsExtra],
        });
      } else {
        // Single kit — add directly to cart
        const items = collectHandheldCartItems();
        const selRadio = radioLineup.find(r => r.key === selectedRadioKey);
        rmeKbAddToCart(items, selRadio ? selRadio.name : '');
      }
    };
  } else {
    next.textContent = 'Next: ' + steps[n + 1].name + ' →';
    next.className = 'btn-nav btn-next';
    next.onclick = nextStep;
  }

  // Render the current step
  steps[n].render();

  // Always update bottom bar with current totals
  updateBottomBar();

  // Scroll to top of wizard on user-initiated step changes (not initial load)
  if (userNavigated) {
    scrollToTop();
  }
}
let userNavigated = false;

// Scroll to the active content area on navigational transitions
function scrollToTop() {
  // Blur active element to prevent focus-driven scroll restoration
  if (document.activeElement) document.activeElement.blur();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    // Scroll to page title if visible, otherwise kit builder container
    // Use scrollIntoView with 'start' block - CSS scroll-margin-top handles sticky header offset
    const title = document.querySelector('.rme-page-title');
    const target = title || document.getElementById('rme-kit-builder');
    if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }, prefersReduced ? 0 : 300);
}

function nextStep() {
  userNavigated = true;
  const steps = getSteps();
  // Validate programming step before advancing to review
  if (steps[currentStep] && steps[currentStep].id === 'step-4') {
    if (!validateProgramming()) return;
  }
  goStep(currentStep + 1);
}

function validateProgramming() {
  if (programmingChoice === 'none') return true;
  if (programmingChoice === 'standard') {
    if (!progUseShipping && !progZipPrimary.trim()) {
      alert('Please enter a zip code or city for your programming location, or choose "Use my shipping address."');
      return false;
    }
    return true;
  }
  if (programmingChoice === 'multi') {
    if (!progZipPrimary.trim()) {
      alert('Please enter a zip code or city for your primary location.');
      return false;
    }
    const filledExtras = progZipsExtra.filter(z => z.trim());
    if (filledExtras.length === 0) {
      if (confirm('You selected Multi-Location Programming (+$10) but only entered one location.\n\nWould you like to switch to Standard Programming (included free) for a single location instead?')) {
        programmingChoice = 'standard';
        progUseShipping = false;
        renderProgramming();
        return false;
      }
      return false;
    }
    return true;
  }
  return true;
}
function prevStep() { userNavigated = true; goStep(currentStep - 1); }

// ── Lightbox ────────────────────────────────────────
function openLightbox(src, caption) {
  const lb = document.getElementById('lightbox');
  lb.querySelector('img').src = src;
  lb.querySelector('.lb-caption').textContent = caption || '';
  lb.classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// Intercept clicks on product images -open lightbox instead of toggling selection
document.addEventListener('click', function(e) {
  const imgWrap = e.target.closest('.oc-img');
  if (!imgWrap) return;
  const img = imgWrap.querySelector('img');
  if (!img || !img.src) return;
  e.stopPropagation(); // prevent card selection toggle
  const card = imgWrap.closest('.opt-card');
  const name = card ? card.querySelector('.oc-name')?.textContent : '';
  openLightbox(img.src, name);
}, true); // capture phase so it fires before the card onclick

// ── Radio lineup data ────────────────────────────────
const radioLineup = [
  {
    key: 'uv5r', name: 'UV-5R Essentials Kit', price: 59, id: 106,
    img: S+'2022/08/20250904_100309-EDIT.jpg',
    tagline: 'The reliable standard',
    pitch: 'The most popular two-way radio on the planet. Massive accessory ecosystem: batteries, antennas, cases, and chargers are widely available and affordable. If you already own UV-5Rs, everything is compatible.',
    solves: [],
    features: ['128 memory channels', 'Dual-band VHF/UHF', 'Huge accessory ecosystem', 'Most affordable option'],
    tags: ['budget', 'simple', 'compatible', 'compact']
  },
  {
    key: 'uv5r-mini', name: 'UV-5R Mini Essentials Kit', price: 39, id: 8438,
    img: S+'2025/12/uv5rmini-smoked.jpg',
    tagline: 'More channels, smaller price',
    pitch: 'Packs 999 memory channels into the most affordable kit we offer. Built-in USB-C charging (no cradle needed) and Bluetooth programming from your phone. Also picks up aircraft frequencies.',
    solves: ['More coverage area / channels', 'Listen to aircraft', 'USB-C charging'],
    features: ['999 memory channels', 'USB-C charging built in', 'Airband receive', 'Automatic NOAA weather alerts', 'Bluetooth phone programming'],
    tags: ['budget', 'simple', 'channels', 'airband', 'usbc', 'compact', 'noaa']
  },
  {
    key: 'uv-pro', name: 'UV-PRO Essentials Kit', price: 159, id: 7862,
    img: S+'2025/09/20250904_100414-EDIT.jpg',
    tagline: 'Waterproof & connected',
    pitch: 'IP67 waterproof, GPS location sharing, text messaging, and full Bluetooth TNC support for APRS and Winlink. Simple enough to start using immediately, but with room to grow into advanced digital modes. The only handheld we offer with Bluetooth smartphone control.',
    solves: ['Waterproof / water use', 'GPS / location sharing', 'Bluetooth / app control', 'Room to grow'],
    features: ['IP67 waterproof', '180 memory channels', 'GPS + APRS built in', 'USB-C charging built in', 'Analog text messaging', 'Bluetooth TNC for APRS/Winlink', 'Mobile app control', 'Airband receive', 'Automatic NOAA weather alerts', 'FCC Part 90 commercial certified'],
    tags: ['waterproof', 'gps', 'bluetooth', 'airband', 'grow', 'professional', 'usbc', 'channels', 'noaa', 'commercial']
  },
  {
    key: 'dmr-6x2', name: 'DMR 6X2 PRO Essentials Kit', price: 249, id: 2931,
    img: S+'2023/11/20250904_100231-EDIT.jpg',
    tagline: 'Digital & encryption capable',
    pitch: 'Full DMR digital radio with encryption capability for private communications. 4000 memory channels, GPS, APRS, and digital text messaging. Our most economical path to encryption-capable digital radio.',
    solves: ['Privacy / encryption capable', 'More coverage area / channels', 'GPS / location sharing', 'Digital text messaging'],
    features: ['DMR digital + analog', 'Encryption capable', '4000 memory channels', 'GPS + APRS', 'Digital text messaging', 'USB-C battery', 'IP54 water resistant', 'Automatic NOAA weather alerts', 'FCC Part 90 commercial certified'],
    tags: ['encryption', 'digital', 'channels', 'gps', 'professional', 'bluetooth', 'water-resistant', 'usbc', 'grow', 'noaa', 'commercial']
  },
  {
    key: 'da-7x2', name: 'DA-7X2 Essentials Kit', price: 299, id: 9050,
    img: S+'2026/02/1000011350.jpg',
    tagline: 'The best we offer',
    pitch: 'Everything the DMR 6X2 PRO does, plus true dual receive, crossband repeat (use it as a portable repeater), airband monitoring, NXDN digital mode, and Bluetooth PTT. For operators who want no compromises.',
    solves: ['Privacy / encryption capable', 'Crossband repeat', 'Listen to aircraft', 'Maximum capability'],
    features: ['DMR + NXDN digital modes', 'Encryption capable', '4000 memory channels', 'Crossband repeat', 'True dual receive', 'Digital text messaging', 'GPS + APRS', 'Airband receive', 'Bluetooth PTT', 'USB-C battery', 'IP54 water resistant', 'Automatic NOAA weather alerts', 'FCC Part 90 commercial certified'],
    tags: ['encryption', 'digital', 'crossband', 'airband', 'professional', 'premium', 'bluetooth', 'water-resistant', 'usbc', 'gps', 'grow', 'channels', 'noaa', 'commercial']
  },
];

// ── Interview logic ─────────────────────────────────
const interviewQuestions = [
  {
    id: 'budget',
    question: "What kind of radio are you looking for?",
    sub: "This helps us match you with the right tier.",
    multi: false,
    options: [
      { key: 'high', icon: ICO.premium, label: 'No compromises', detail: 'Maximum capability, every feature available', tags: ['encryption', 'digital', 'premium', 'crossband'] },
      { key: 'mid', icon: ICO.midprice, label: 'Mid-range', detail: 'More features and durability, the sweet spot for most people', tags: ['waterproof', 'gps', 'bluetooth', 'grow'] },
      { key: 'low', icon: ICO.budget, label: 'Economical', detail: 'A solid, reliable radio without the extras', tags: ['budget', 'simple', 'compact'] },
    ]
  },
  {
    id: 'needs',
    question: "What do you need?",
    sub: "Select all that apply. Skip if you just want a general-purpose radio.",
    multi: true,
    options: [
      { key: 'emergency', icon: ICO.emergency, label: 'Emergency / disaster prep', detail: 'Backup comms when cell networks fail', tags: ['channels', 'grow', 'noaa'] },
      { key: 'outdoor', icon: ICO.outdoor, label: 'Outdoor / overlanding', detail: 'Hiking, camping, off-road', tags: ['gps', 'grow', 'waterproof'] },
      { key: 'water', icon: ICO.droplet, label: 'Wet conditions', detail: 'Rain, boating, submersion', tags: ['waterproof'] },
      { key: 'encryption', icon: ICO.lock, label: 'Secure / encryption capable', detail: 'Private comms for work, security, or personal use', tags: ['encryption', 'digital', 'professional', 'commercial'] },
      { key: 'gps', icon: ICO.signal, label: 'GPS location sharing', detail: 'Track and share positions via APRS', tags: ['gps'] },
      { key: 'texting', icon: ICO.channels, label: 'Text messaging over radio', detail: 'Send text without cell service', tags: ['grow', 'digital'] },
      { key: 'airband', icon: ICO.plane, label: 'Listen to aircraft', detail: 'Monitor aviation frequencies', tags: ['airband'] },
      { key: 'repeater', icon: ICO.crossband, label: 'Repeater capability', detail: 'Simplex or crossband repeat to extend range', tags: ['crossband', 'grow'] },
      { key: 'bluetooth', icon: ICO.bluetooth, label: 'Bluetooth connectivity', detail: 'Wireless speakermic or phone control', tags: ['bluetooth'] },
      { key: 'nopreference', icon: ICO.nopref, label: 'No specific needs', detail: 'Just recommend what works best', tags: [] },
    ]
  },
];

// ── Apply admin config overrides ──
if (_adminConfig) {
  if (_adminConfig.radioLineup) {
    // Merge admin radios: rebuild with admin data but keep img prefix from S
    radioLineup.length = 0;
    _adminConfig.radioLineup.forEach(r => {
      radioLineup.push({
        ...r,
        img: r.img.startsWith('http') ? r.img : S + r.img,
        solves: r.solves || [],
        features: r.features || [],
        tags: r.tags || []
      });
    });
  }
  if (_adminConfig.interviewQuestions) {
    interviewQuestions.length = 0;
    _adminConfig.interviewQuestions.forEach(q => interviewQuestions.push(q));
  }
}

let interviewStep = 0;
let interviewAnswers = {};

function startInterview() {
  rmeDebug('START', 'Interview (handheld)');
  document.getElementById('selector-landing').style.display = 'none';
  document.getElementById('interview-container').style.display = 'block';
  interviewStep = 0;
  interviewAnswers = {};
  renderInterviewQuestion();
}

function showRadioPicker() {
  document.getElementById('selector-landing').style.display = 'none';
  document.getElementById('radio-picker').style.display = 'block';
  renderRadioGrid();
}

function backToSelectorLanding() {
  document.getElementById('selector-landing').style.display = '';
  document.getElementById('radio-picker').style.display = 'none';
  document.getElementById('interview-container').style.display = 'none';
}

function renderRadioGrid() {
  const grid = document.getElementById('radio-grid');
  grid.innerHTML = radioLineup.map(r => `
    <div class="radio-pick" onclick="selectRadio('${r.key}')">
      <div class="rp-img"><img src="${r.img}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'"></div>
      <h4>${r.name.replace(' Essentials Kit','')}</h4>
      <div class="rp-price">$${r.price}</div>
      <div class="rp-tag">${r.tagline}</div>
    </div>
  `).join('');
}

function renderInterviewQuestion() {
  const container = document.getElementById('interview-container');
  const q = interviewQuestions[interviewStep];
  const answers = interviewAnswers[q.id] || (q.multi ? [] : null);

  let optionsHtml = q.options.map(o => {
    const isSelected = q.multi ? (answers && answers.includes(o.key)) : answers === o.key;
    const indicator = q.multi
      ? `<div class="oc-check">${isSelected ? '✓' : ''}</div>`
      : `<div class="oc-radio">${isSelected ? '<span></span>' : ''}</div>`;
    return `
      <div class="iq-option ${isSelected ? 'selected' : ''}" onclick="answerInterview('${q.id}','${o.key}',${q.multi})">
        <div class="iq-icon">${o.icon}</div>
        <div class="iq-body">
          <div class="iq-label">${o.label}</div>
          <div class="iq-detail">${o.detail}</div>
        </div>
        ${indicator}
      </div>
    `;
  }).join('');

  const isFirst = interviewStep === 0;
  const isLast = interviewStep === interviewQuestions.length - 1;
  const hasAnswer = q.multi ? (answers && answers.length > 0) : answers !== null;

  container.innerHTML = `
    <div class="interview-q">
      <h2>${q.question}</h2>
      <div class="iq-sub">${q.sub}</div>
      <div class="iq-options">${optionsHtml}</div>
      <div class="interview-nav">
        ${isFirst ? '<button class="btn-nav btn-back" onclick="backToSelectorLanding()">← Back</button>' : '<button class="btn-nav btn-back" onclick="prevInterviewStep()">← Back</button>'}
        <button class="btn-nav btn-next" onclick="${isLast ? 'showInterviewResults()' : 'nextInterviewStep()'}" ${!hasAnswer && !q.multi ? 'disabled' : ''}>${isLast ? 'See Our Recommendation →' : 'Next →'}</button>
      </div>
    </div>
  `;
}

function answerInterview(qId, optKey, multi) {
  const q = interviewQuestions.find(x => x.id === qId);
  if (multi) {
    if (!interviewAnswers[qId]) interviewAnswers[qId] = [];
    const arr = interviewAnswers[qId];
    const idx = arr.indexOf(optKey);
    if (idx >= 0) arr.splice(idx, 1);
    else if (optKey === 'nopreference') {
      arr.length = 0;
      arr.push(optKey);
    } else {
      const npIdx = arr.indexOf('nopreference');
      if (npIdx >= 0) arr.splice(npIdx, 1);
      if (!q.maxSelect || arr.length < q.maxSelect) arr.push(optKey);
    }
  } else {
    interviewAnswers[qId] = optKey;
  }
  renderInterviewQuestion();
}

function nextInterviewStep() {
  if (interviewStep < interviewQuestions.length - 1) { interviewStep++; renderInterviewQuestion(); }
}
function prevInterviewStep() {
  if (interviewStep > 0) { interviewStep--; renderInterviewQuestion(); }
}

function getPersonalizedReasons(radio) {
  // Map interview answers to personalized "why this fits" reasons
  const reasons = [];
  const a = interviewAnswers;

  // Budget match
  if (a.budget === 'low' && radio.tags.includes('budget')) reasons.push('Economical and reliable. Gets you on the air without the extras');
  if (a.budget === 'mid' && radio.tags.includes('grow')) reasons.push('Great mid-range option with solid features and room to grow');
  if (a.budget === 'high' && radio.tags.includes('premium')) reasons.push('Top-tier, maximum capability with no compromises');

  // Use case match
  if (a.use === 'water' && radio.tags.includes('waterproof')) reasons.push('IP67 waterproof, fully submersible for the wet environments you described');
  if (a.use === 'water' && !radio.tags.includes('waterproof') && radio.tags.includes('water-resistant')) reasons.push('IP54 water resistant. Handles rain and splashes');
  if (a.use === 'outdoor' && radio.tags.includes('gps')) reasons.push('GPS & APRS, perfect for the outdoor use you mentioned');
  // Needs-based reasons (from combined question)
  const needs = a.needs || [];
  if (needs.includes('encryption') && radio.tags.includes('commercial')) reasons.push('FCC Part 90 commercial certified, approved for business and commercial use');
  if (needs.includes('encryption') && radio.tags.includes('professional') && !radio.tags.includes('encryption')) reasons.push('Professional-grade radio, but does not support encryption');
  if (needs.includes('emergency') && radio.tags.includes('channels')) reasons.push('Lots of channels. Covers more repeaters for emergency readiness');
  if (needs.includes('emergency') && radio.tags.includes('noaa')) reasons.push('Automatic NOAA weather alerts. Get warned before severe weather hits');
  if (needs.includes('water') && radio.tags.includes('waterproof')) reasons.push('IP67 waterproof, fully submersible for the conditions you need');
  if (needs.includes('water') && !radio.tags.includes('waterproof') && radio.tags.includes('water-resistant')) reasons.push('IP54 water resistant. Rated for rain and splashes');
  if (needs.includes('outdoor') && radio.tags.includes('gps')) reasons.push('Built-in GPS for position tracking in the field');
  if (needs.includes('outdoor') && radio.tags.includes('waterproof')) reasons.push('Waterproof build for outdoor conditions');
  if (needs.includes('encryption') && radio.tags.includes('encryption')) reasons.push('Encryption capable. Supports private, encrypted communications');
  if (needs.includes('gps') && radio.tags.includes('gps')) reasons.push('GPS location sharing via APRS. Track and share positions');
  if (needs.includes('texting') && radio.tags.includes('digital')) reasons.push('Digital text messaging over radio, no cell service needed');
  if (needs.includes('airband') && radio.tags.includes('airband')) reasons.push('Airband receive. Listen to aircraft frequencies');
  if (needs.includes('repeater') && radio.tags.includes('crossband')) reasons.push('Crossband repeat capability. Extend your range using this radio as a relay');
  if (needs.includes('repeater') && !radio.tags.includes('crossband') && radio.tags.includes('grow')) reasons.push('Simplex repeater mode available');
  if (needs.includes('bluetooth') && radio.tags.includes('bluetooth')) reasons.push('Bluetooth connectivity for wireless speakermic or phone control');

  // Deduplicate similar reasons
  return [...new Set(reasons)].slice(0, 4);
}

function showInterviewResults() {
  // Score each radio based on tag matches
  const scores = {};
  radioLineup.forEach(r => { scores[r.key] = 0; });

  // Track water-related needs from the combined "needs" question
  let waterExplicit = false;
  let waterIndirect = false;

  interviewQuestions.forEach(q => {
    const answer = interviewAnswers[q.id];
    if (!answer) return;
    const keys = Array.isArray(answer) ? answer : [answer];
    keys.forEach(k => {
      const opt = q.options.find(o => o.key === k);
      if (!opt) return;
      // Explicit: selected "wet conditions"
      if (opt.key === 'water') waterExplicit = true;
      // Indirect: outdoor use implies weather exposure
      else if (opt.key === 'outdoor') waterIndirect = true;
      const _sc = _adminConfig && _adminConfig.scoring || null;
      const _baseW = _sc ? (_sc.baseWeight || 1) : 1;
      const _cw = _sc ? (_sc.customWeights || {}) : {};
      radioLineup.forEach(r => {
        opt.tags.forEach(tag => {
          if (r.tags.includes(tag)) scores[r.key] += (_cw[tag] !== undefined ? _cw[tag] : _baseW);
        });
      });
    });
  });

  // Water resistance bonus (admin-configurable)
  const _sc = _adminConfig && _adminConfig.scoring || null;
  const _eIp67 = _sc ? _sc.explicitIp67 : 5;
  const _eIp54 = _sc ? _sc.explicitIp54 : 1;
  const _iIp67 = _sc ? _sc.indirectIp67 : 1;
  const _iIp54 = _sc ? _sc.indirectIp54 : 0;
  if (waterExplicit) {
    radioLineup.forEach(r => {
      if (r.tags.includes('waterproof')) scores[r.key] += _eIp67;
      else if (r.tags.includes('water-resistant')) scores[r.key] += _eIp54;
    });
  } else if (waterIndirect) {
    radioLineup.forEach(r => {
      if (r.tags.includes('waterproof')) scores[r.key] += _iIp67;
      else if (r.tags.includes('water-resistant')) scores[r.key] += _iIp54;
    });
  }

  // Sort by score descending
  const ranked = radioLineup.slice().sort((a, b) => scores[b.key] - scores[a.key]);
  const top = ranked[0];
  const runner = ranked[1];

  const topReasons = getPersonalizedReasons(top);
  const runnerReasons = getPersonalizedReasons(runner);

  function renderResultCard(radio, reasons, isPrimary) {
    const name = radio.name.replace(' Essentials Kit', '');
    const reasonsHtml = reasons.length > 0
      ? '<ul style="list-style:none;padding:0;margin:0">' + reasons.map(r => '<li style="padding:3px 0">✅ ' + r + '</li>').join('') + '</ul>'
      : '<ul>' + radio.features.map(f => '<li>✓ ' + f + '</li>').join('') + '</ul>';

    return `
      <div class="result-card ${isPrimary ? 'recommended' : ''}">
        ${isPrimary ? '<div class="result-badge">Best Match</div>' : ''}
        <div class="rc-img"><img src="${radio.img}" alt="${radio.name}" onerror="this.parentElement.innerHTML='📻'"></div>
        <h3>${name}</h3>
        <div class="rc-price">$${radio.price}</div>
        <div class="rc-why">${reasonsHtml}</div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:16px">${radio.pitch}</p>
        <button class="rc-btn" onclick="selectRadio('${radio.key}')" ${!isPrimary ? 'style="background:var(--card);color:var(--text);border:1px solid var(--border)"' : ''}>${isPrimary ? 'Select This Radio →' : 'Choose This Instead →'}</button>
      </div>
    `;
  }

  const container = document.getElementById('interview-container');
  container.innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <h2 style="font-size:22px;margin-bottom:6px">Our Recommendation</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:24px">Based on what you told us, here's what we'd pick for you.</p>
      <div class="result-cards">
        ${renderResultCard(top, topReasons, true)}
        ${renderResultCard(runner, runnerReasons, false)}
      </div>
      ${(waterExplicit || waterIndirect) && top.tags.includes('waterproof') && runner.tags.includes('water-resistant') ? `
        <div style="max-width:600px;margin:20px auto 0;padding:14px 18px;background:#1a1800;border:1px solid var(--gold-dim);font-size:13px;color:#ddd;line-height:1.6;text-align:left">
          <strong style="color:var(--gold)">💧 Water resistance note:</strong> The ${top.name.replace(' Essentials Kit','')} is rated <strong style="color:var(--gold)">IP67</strong> (fully submersible up to 1 meter for 30 minutes). The ${runner.name.replace(' Essentials Kit','')} is rated <strong style="color:var(--gold)">IP54</strong> (splash and dust resistant, but not submersible). If water exposure is a real possibility, IP67 is the safer bet.
        </div>
      ` : ''}
      <div style="margin-top:24px">
        <button class="btn-nav btn-back" onclick="interviewStep=0;renderInterviewQuestion()">← Retake Quiz</button>
        <button class="btn-nav btn-back" onclick="showRadioPicker()" style="margin-left:8px">See All Radios</button>
      </div>
    </div>
  `;
}

// ── Mismatch detection ──────────────────────────────
// Each rule: if the user indicated a need (interview answer) and the selected
// radio lacks that capability, warn them and suggest a better fit.
const mismatchRules = [
  {
    check: (answers, radio) => {
      const needs = answers.needs || [];
      const wantsWater = needs.includes('water');
      return wantsWater && !radio.tags.includes('waterproof') && !radio.tags.includes('water-resistant');
    },
    warning: "has no water resistance rating",
    need: "you mentioned wet conditions",
    suggestTags: ['waterproof', 'water-resistant'],
  },
  {
    check: (answers, radio) => {
      const needs = answers.needs || [];
      return needs.includes('encryption') && !radio.tags.includes('encryption');
    },
    warning: "does not have encryption capability. Only DMR radios support encrypted communications",
    need: "you mentioned private/encrypted comms",
    suggestTags: ['encryption'],
  },
  {
    check: (answers, radio) => {
      const needs = answers.needs || [];
      return needs.includes('professional') && !radio.tags.includes('professional');
    },
    warning: "is a great radio for personal use, but may not hold up to the demands of commercial or business use",
    need: "you mentioned work or business use",
    suggestTags: ['professional'],
  },
  {
    check: (answers, radio) => {
      const needs = answers.needs || [];
      return needs.includes('airband') && !radio.tags.includes('airband');
    },
    warning: "cannot receive aircraft/aviation frequencies",
    need: "you said listening to aircraft is important",
    suggestTags: ['airband'],
  },
  {
    check: (answers, radio) => {
      const needs = answers.needs || [];
      return needs.includes('bluetooth') && !radio.tags.includes('bluetooth');
    },
    warning: "does not support Bluetooth",
    need: "you mentioned Bluetooth connectivity",
    suggestTags: ['bluetooth'],
  },
  {
    check: (answers, radio) => {
      const needs = answers.needs || [];
      return needs.includes('repeater') && !radio.tags.includes('crossband') && !radio.tags.includes('grow');
    },
    warning: "has limited repeater capability",
    need: "you mentioned repeater capability",
    suggestTags: ['crossband'],
  },
];

// ── Apply admin mismatch overrides ──
if (_adminConfig && _adminConfig.mismatchRules) {
  mismatchRules.length = 0;
  _adminConfig.mismatchRules.forEach(rule => {
    const needKeys = (rule.needKey || '').split('|').map(s => s.trim()).filter(Boolean);
    const needSources = (rule.needSource || '').split('|').map(s => s.trim()).filter(Boolean);
    const mustNotTags = (rule.radioMustNotHaveAnyTag || '').split(',').map(s => s.trim()).filter(Boolean);
    mismatchRules.push({
      check: (answers, radio) => {
        // Check if user indicated this need
        let wantsIt = false;
        needKeys.forEach(nk => {
          needSources.forEach(ns => {
            const a = answers[ns];
            if (!a) return;
            if (Array.isArray(a)) { if (a.includes(nk)) wantsIt = true; }
            else { if (a === nk) wantsIt = true; }
          });
        });
        if (!wantsIt) return false;
        // Check if radio lacks the required tags
        return mustNotTags.length > 0 && !mustNotTags.some(t => radio.tags.includes(t));
      },
      warning: rule.warning,
      need: rule.need,
      suggestTags: rule.suggestTags || [],
    });
  });
}

let pendingRadioKey = null;

function checkMismatches(key) {
  // Only check if they came through the interview
  if (Object.keys(interviewAnswers).length === 0) return null;

  const radio = radioLineup.find(r => r.key === key);
  if (!radio) return null;

  for (const rule of mismatchRules) {
    if (rule.check(interviewAnswers, radio)) {
      // Find the best alternative -never suggest a cheaper/lesser radio (no downgrade suggestions)
      const alt = radioLineup.find(r => r.key !== key && r.price >= radio.price && rule.suggestTags.some(t => r.tags.includes(t)));
      // Only warn if we can suggest an upgrade -don't discourage a choice with no better option
      if (alt) return { radio, rule, alt };
    }
  }
  return null;
}

function selectRadio(key) {
  const _selR = radioLineup.find(r => r.key === key);
  rmeDebug('SELECT', `Radio: ${_selR ? _selR.name : key}`);
  const mismatch = checkMismatches(key);
  if (mismatch) {
    pendingRadioKey = key;
    showMismatchWarning(mismatch);
    return;
  }
  confirmRadioSelection(key);
}

function showMismatchWarning(m) {
  const modal = document.getElementById('mismatch-modal');
  const radioName = m.radio.name.replace(' Essentials Kit', '');
  let altHtml = '';
  if (m.alt) {
    const altName = m.alt.name.replace(' Essentials Kit', '');
    altHtml = `
      <button class="modal-btn-add" onclick="pendingRadioKey=null;document.getElementById('mismatch-modal').classList.remove('open');confirmRadioSelection('${m.alt.key}')">
        Switch to ${altName} ($${m.alt.price})
      </button>
    `;
  }
  modal.querySelector('.modal-box').innerHTML = `
    <h3>Heads Up</h3>
    <p>The <strong>${radioName}</strong> ${m.rule.warning}.</p>
    <p style="margin-top:8px">${m.rule.need.charAt(0).toUpperCase() + m.rule.need.slice(1)}. Just want to make sure you're aware before we continue.</p>
    <div class="modal-btns" style="flex-direction:column;gap:8px;margin-top:20px">
      ${altHtml}
      <button class="modal-btn-cancel" onclick="document.getElementById('mismatch-modal').classList.remove('open');confirmRadioSelection(pendingRadioKey)">
        Continue with ${radioName} anyway
      </button>
    </div>
  `;
  modal.classList.add('open');
}

let selectedRadioKey = 'uv5r'; // track which radio is selected

function confirmRadioSelection(key) {
  const radio = radioLineup.find(r => r.key === key);
  rmeDebug('CONFIRM', `Radio: ${radio ? radio.name : key}`);
  if (!radio) { rmeDebug('ERROR', `Radio key "${key}" not found in lineup`); return; }
  pendingRadioKey = null;
  selectedRadioKey = key;
  showConsultationFooter();
  if (kitSession.kits[kitSession.currentKitIndex]) kitSession.kits[kitSession.currentKitIndex].radioKey = key;

  // Load radio-specific products and update base price
  loadRadioProducts(key);
  BASE_PRICE = radio.price;

  // Reset selections (items may not exist for new radio)
  selectedAntennas = new Set();
  selectedAddlAntennas = new Set();
  adapterSuppressed = false;
  selectedBatteries = new Map();
  selectedAccessories = new Set();
  uvproRadioColor = 'black';
  uvproBatteryColors = new Map();
  programmingChoice = 'standard';
  progUseShipping = true;
  progZipPrimary = '';
  progZipsExtra = [];
  progConfirmedPrimary = '';
  progConfirmedExtras = [];
  progCoords = { primary: null, extras: [] };

  // Per-radio includes lists and descriptions
  const radioIncludes = {
    'uv5r': {
      desc: 'The go-to starter radio kit. Everything you need to get on the air, pre-programmed and ready to use out of the box. Customize your kit below with antenna upgrades and accessories.',
      items: ['Baofeng UV-5R radio (pre-programmed)', 'Factory antenna, battery, belt clip', 'Charging cradle', 'RME Quick Start Guide']
    },
    'uv5r-mini': {
      desc: 'The most affordable kit we offer. 999 channels, USB-C charging, and airband receive in the smallest package. Pre-programmed and ready to go.',
      items: ['Baofeng UV-5R Mini radio (pre-programmed)', 'Factory antenna, USB-C battery, belt clip', 'USB-C charging cable', 'RME Quick Start Guide']
    },
    'uv-pro': {
      desc: 'IP67 waterproof with GPS, text messaging, and Bluetooth. Simple enough to start immediately, powerful enough to grow into APRS and digital modes.',
      items: ['Baofeng UV-PRO radio (pre-programmed)', 'Factory antenna, USB-C battery, belt clip', 'USB-C charging cable', 'RME Quick Start Guide']
    },
    'dmr-6x2': {
      desc: 'Digital + analog dual-mode radio with encryption capability, GPS, and 4000 memory channels. Includes programming cable for CPS software.',
      items: ['AnyTone DMR 6X2 PRO radio (pre-programmed)', 'Factory antenna, USB-C battery, belt clip', 'USB-C charging cable', 'USB programming cable', 'RME Quick Start Guide']
    },
    'da-7x2': {
      desc: 'The full-featured flagship: dual receivers, crossband repeat, airband, encryption capable, and 4000 channels. Everything the serious operator needs.',
      items: ['AnyTone DA-7X2 radio (pre-programmed)', 'Factory antenna, USB-C battery, belt clip', 'USB-C charging cable', 'USB programming cable', 'RME Quick Start Guide']
    },
  };

  const info = radioIncludes[key] || radioIncludes['uv5r'];

  // Update hero with selected radio
  const heroImg = document.querySelector('.hero-img img');
  if (heroImg) { heroImg.src = radio.img; heroImg.style.display = ''; }
  const heroTitle = document.querySelector('.hero-info h1');
  const heroPrice = document.querySelector('.hero-info .base-price');
  const heroDesc = document.querySelector('.hero-info .desc');
  const heroIncludes = document.querySelector('.hero-info .includes ul');
  if (heroTitle) heroTitle.textContent = radio.name;
  if (heroPrice) heroPrice.textContent = '$' + radio.price + '.00';
  if (heroDesc) heroDesc.textContent = info.desc;
  if (heroIncludes) heroIncludes.innerHTML = info.items.map(i => `<li>${i}</li>`).join('');

  // Rebuild step UI (color step appears for UV-PRO)
  rebuildStepUI();

  // Hide selector, show wizard
  document.getElementById('selector-phase').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'block';
  { const _bb = document.querySelector('.rme-kb-bottom-bar'); if (_bb) _bb.style.display = ''; }

  // Initialize wizard to step 0
  goStep(0);
}

// ── Init ────────────────────────────────────────────
let wizardInitialized = false;
// Hide bottom bar initially
{ const _bb = document.querySelector('.rme-kb-bottom-bar'); if (_bb) _bb.style.display = 'none'; }
// Mark as initialized (goStep will be called when wizard is actually shown)
wizardInitialized = true;

// ── URL param auto-select: ?radio=KEY&cat=CATEGORY ──
(function() {
  const params = new URLSearchParams(window.location.search);
  const radioKey = params.get('radio');
  const cat = params.get('cat');
  if (!radioKey) return;

  // Determine category from the key if not provided
  let category = cat;
  if (!category) {
    if (radioLineup.find(r => r.key === radioKey)) category = 'handheld';
    else if (mobileRadioLineup.find(r => r.key === radioKey)) category = 'mobile';
    else if (hfRadioLineup.find(r => r.key === radioKey)) category = 'hf';
    else if (scannerRadioLineup.find(r => r.key === radioKey)) category = 'scanner';
  }
  if (!category) return;

  rmeDebug('URL', `Auto-select radio=${radioKey} cat=${category}`);

  // Set up a single-kit session
  kitSession = {
    needsAnswers: {},
    categories: [{ type: category, qty: 1 }],
    kits: [{ category: category, label: categoryMeta[category]?.name || category, status: 'active', radioKey: null, cartItems: [] }],
    currentKitIndex: 0,
    preferences: [],
  };

  // Hide the landing page
  document.getElementById('needs-landing').style.display = 'none';

  // Route to the correct flow and auto-select the radio
  if (category === 'handheld') {
    hideAllPhases();
    document.getElementById('selector-phase').style.display = 'block';
    document.getElementById('selector-landing').style.display = 'none';
    document.getElementById('interview-container').style.display = 'none';
    document.getElementById('radio-picker').style.display = 'none';
    confirmRadioSelection(radioKey);
  } else if (category === 'mobile') {
    startMobileFlow();
    selectMobileRadio(radioKey);
  } else if (category === 'base') {
    startBaseFlow();
    selectBaseRadio(radioKey);
  } else if (category === 'hf') {
    startHfFlow();
    selectHfRadio(radioKey);
  } else if (category === 'scanner') {
    startScannerFlow();
    selectScannerRadio(radioKey);
  }
})();


// ── WooCommerce Cart Integration ──
let _rmeKbCartBusy = false;
function rmeKbAddToCart(items, kitName) {
  if (_rmeKbCartBusy) return Promise.resolve(); // prevent double-click
  _rmeKbCartBusy = true;
  // Disable all cart/add buttons and show loading state
  document.querySelectorAll('.btn-cart, .btn-next, [onclick*="addAllKitsToCart"], [onclick*="rmeKbAddToCart"]').forEach(function(b) {
    b.disabled = true; b.style.opacity = '0.5'; b.style.pointerEvents = 'none';
  });
  const cartBtn = document.getElementById('btn-next');
  const origText = cartBtn ? cartBtn.textContent : '';
  if (cartBtn) cartBtn.textContent = 'Adding to cart...';
  if (typeof rmeKitBuilder === 'undefined' || !rmeKitBuilder.ajaxUrl) {
    _rmeKbCartBusy = false;
    alert('WooCommerce integration not available. Items collected: ' + items.length);
    return Promise.resolve();
  }
  // Normalize items: ensure each has { id, qty }
  const normalized = [];
  items.forEach(item => {
    const productId = item.id || null;
    if (productId) {
      const existing = normalized.find(n => n.id === productId);
      if (existing) { existing.qty += (item.qty || 1); }
      else { normalized.push({ id: productId, qty: item.qty || 1 }); }
    }
  });
  if (normalized.length === 0) {
    alert('No purchasable items found. Some products may not be configured yet.');
    return Promise.resolve();
  }
  rmeDebug('CART', `Submitting ${normalized.length} products to WooCommerce`);
  return fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_add_to_cart&nonce=' + rmeKitBuilder.nonce, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: normalized, kitName: kitName || '' })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      const count = data.data.added.length;
      const errors = data.data.errors;
      // Update header cart badge
      const badge = document.querySelector('.rme-cart-count');
      if (badge && data.data.cartCount) badge.textContent = data.data.cartCount;
      // Log partial errors to console but don't block the user
      if (errors.length > 0) {
        console.warn('RME KB: Some items had issues:', errors);
        rmeDebug('CART', 'Partial errors: ' + errors.join(', '));
      }
      // Redirect to cart if anything was added
      if (count > 0) {
        markLeadCompleted();
        window.location.href = data.data.cartUrl || rmeKitBuilder.cartUrl;
      } else {
        // Nothing added at all — show error
        _rmeKbCartBusy = false;
        alert('Could not add items to cart. Please try again or book a consultation for help.');
      }
    } else {
      _rmeKbCartBusy = false;
      alert('Error adding to cart: ' + (data.data ? data.data.message : 'Unknown error'));
    }
  })
  .catch(err => {
    _rmeKbCartBusy = false;
    alert('Error adding to cart. Please try again.');
    console.error('RME KB cart error:', err);
  });
}

// ── Product Page Mode ──
if (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.productPageMode && rmeKitBuilder.productRadioKey) {
  document.addEventListener('DOMContentLoaded', function() {
    var needsPhase = document.getElementById('needs-phase');
    var selectorPhase = document.getElementById('selector-phase');
    if (needsPhase) needsPhase.style.display = 'none';
    if (selectorPhase) selectorPhase.style.display = 'none';
    if (typeof confirmRadioSelection === 'function') {
      confirmRadioSelection(rmeKitBuilder.productRadioKey);
    }
  });
}

// end kit-builder.js
