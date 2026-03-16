// RME Kit Builder — WordPress Plugin JS
// Generated from kit-builder-demo.html
(function() {
'use strict';

// Config from WordPress (wp_localize_script) or localStorage fallback for standalone mode
const _adminConfig = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.config)
  ? rmeKitBuilder.config
  : (() => { try { const raw = localStorage.getItem('rme-kit-builder-config'); return raw ? JSON.parse(raw) : null; } catch { return null; } })();

const S = (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.uploadsUrl) ? rmeKitBuilder.uploadsUrl : '/wp-content/uploads/';

// ══════════════════════════════════════════════════════
// ── NEEDS ASSESSMENT + MULTI-KIT SESSION ──
// ══════════════════════════════════════════════════════

// Session state
let kitSession = {
  needsAnswers: {},
  categories: [],   // e.g. [{type:'handheld',qty:3},{type:'mobile',qty:2},{type:'base',qty:1},{type:'hf',qty:1}]
  kits: [],          // built kits with selections
  currentKitIndex: 0,
  preferences: []    // carry-forward from needs assessment (e.g. 'digital','waterproof')
};

// Needs assessment questions
const needsQuestions = [
  {
    id: 'usage',
    question: "What do you need radios for?",
    sub: "Select all that apply — many people need more than one type.",
    multi: true,
    options: [
      { key: 'handheld', icon: '🤚', label: 'Handheld radios — nearby communication', detail: 'Carried on your person for hiking, events, security, neighborhood, tactical, or emergency use', categories: ['handheld'] },
      { key: 'vehicle', icon: '🚗', label: 'Vehicle mobile radios — maximum local range', detail: 'Mounted in a vehicle with higher power for convoys, overlanding, and daily driving', categories: ['mobile'] },
      { key: 'base', icon: '🏠', label: 'Base station — maximum nearby range from a fixed location', detail: 'Home, office, or property with a rooftop or outdoor antenna', categories: ['base'] },
      { key: 'hf', icon: '🌐', label: 'Long-distance communication', detail: 'Regional, nationwide, or worldwide — hundreds or thousands of miles', categories: ['hf'] },
      { key: 'notsure', icon: '🤔', label: "I'm not sure — help me figure it out", detail: "We'll ask a few more questions to find the right setup", categories: [] },
    ]
  },
  {
    id: 'distance',
    question: "How far do you need to communicate?",
    sub: "Pick the best match. We'll recommend the right equipment.",
    multi: false,
    condition: (answers) => answers.usage && answers.usage.includes('notsure'),
    options: [
      { key: 'short', icon: '📍', label: 'Short range — neighborhood or campsite', detail: '1-5 miles, line of sight', categories: ['handheld'] },
      { key: 'medium', icon: '📡', label: 'Medium range — across town or between vehicles', detail: '5-25 miles, with repeaters or higher power', categories: ['handheld', 'mobile'] },
      { key: 'long', icon: '🗺️', label: 'Long range — across a region or state', detail: '25+ miles, needs higher power and better antennas', categories: ['mobile', 'base'] },
      { key: 'extreme', icon: '🌍', label: 'Extreme range — nationwide or worldwide', detail: 'Hundreds or thousands of miles via HF radio', categories: ['hf'] },
    ]
  },
  {
    id: 'where',
    question: "Where will you use your radios?",
    sub: "Select all that apply.",
    multi: true,
    condition: (answers) => answers.usage && answers.usage.includes('notsure'),
    options: [
      { key: 'onfoot', icon: '🥾', label: 'On foot — hiking, walking, events', detail: 'Need something portable you can carry', categories: ['handheld'] },
      { key: 'invehicle', icon: '🚙', label: 'In a vehicle', detail: 'Mounted in a car, truck, RV, or boat', categories: ['mobile'] },
      { key: 'athome', icon: '🏡', label: 'At a fixed location — home, office, ranch', detail: 'Permanent or semi-permanent setup with an outdoor antenna', categories: ['base'] },
      { key: 'offgrid', icon: '⛺', label: 'Off-grid or backcountry', detail: 'No cell service, need reliable comms over distance', categories: ['handheld', 'hf'] },
    ]
  },
  {
    id: 'preferences',
    question: "What matters most to you?",
    sub: "Pick up to two. Skip if nothing stands out.",
    multi: true,
    options: [
      { key: 'digital', icon: '🔒', label: 'Digital / encryption capable', detail: 'Private, encrypted communications', pref: 'digital' },
      { key: 'waterproof', icon: '💧', label: 'Waterproof / rugged', detail: 'Will get wet or be used in harsh conditions', pref: 'waterproof' },
      { key: 'simple', icon: '👍', label: 'Simple and easy to use', detail: 'Minimal learning curve, just works', pref: 'simple' },
      { key: 'range', icon: '📡', label: 'Maximum range & power', detail: 'Need to reach as far as possible', pref: 'range' },
      { key: 'budget', icon: '💵', label: 'Budget friendly', detail: 'Get set up affordably', pref: 'budget' },
      { key: 'crossband', icon: '🔁', label: 'Crossband repeat', detail: 'Use a mobile radio as a portable repeater to extend handheld range', pref: 'crossband' },
    ]
  },
];

let needsStep = 0;

function startNeedsAssessment() {
  kitSession = { needsAnswers: {}, categories: [], kits: [], currentKitIndex: 0, preferences: [] };
  needsStep = 0;
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'block';
  renderNeedsQuestion();
}

function showCategoryPicker() {
  kitSession = { needsAnswers: {}, categories: [], kits: [], currentKitIndex: 0, preferences: [] };
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'block';
  renderCategoryPicker();
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
    // All questions answered — compute categories
    computeCategories();
    return;
  }

  const q = needsQuestions[needsStep];
  const answers = kitSession.needsAnswers[q.id] || (q.multi ? [] : '');
  const container = document.getElementById('needs-container');

  container.innerHTML = `
    <div class="needs-q">
      <h2>${q.question}</h2>
      <div class="nq-sub">${q.sub}</div>
      ${q.options.map(opt => {
        const isSelected = q.multi ? answers.includes(opt.key) : answers === opt.key;
        return `
        <div class="nq-option ${isSelected ? 'selected' : ''}" onclick="toggleNeedsOption('${q.id}','${opt.key}',${q.multi})">
          <div class="nq-check">${isSelected ? '✓' : ''}</div>
          <div class="nq-icon">${opt.icon}</div>
          <div>
            <div class="nq-label">${opt.label}</div>
            <div class="nq-detail">${opt.detail}</div>
          </div>
        </div>`;
      }).join('')}
      <div class="needs-btns">
        ${needsStep > 0 ? '<button class="btn-nav btn-back" onclick="needsStep--;renderNeedsQuestion()">← Back</button>' : ''}
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
    if (idx >= 0) arr.splice(idx, 1);
    else {
      // "notsure" is exclusive with other usage options
      if (qId === 'usage' && key === 'notsure') {
        arr.length = 0;
        arr.push(key);
      } else if (qId === 'usage' && arr.includes('notsure')) {
        arr.length = 0;
        arr.push(key);
      } else {
        arr.push(key);
      }
    }
  } else {
    kitSession.needsAnswers[qId] = key;
  }
  renderNeedsQuestion();
}

function advanceNeeds() {
  needsStep++;
  renderNeedsQuestion();
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

  // From guided questions (distance + where)
  if (answers.distance) {
    const opt = needsQuestions.find(q => q.id === 'distance').options.find(o => o.key === answers.distance);
    if (opt) opt.categories.forEach(c => cats.add(c));
  }
  if (answers.where) {
    answers.where.forEach(key => {
      const opt = needsQuestions.find(q => q.id === 'where').options.find(o => o.key === key);
      if (opt) opt.categories.forEach(c => cats.add(c));
    });
  }

  // Preferences
  if (answers.preferences) {
    kitSession.preferences = answers.preferences.map(key => {
      const opt = needsQuestions.find(q => q.id === 'preferences').options.find(o => o.key === key);
      return opt ? opt.pref : key;
    });
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
    { key: 'handheld', icon: '🤚', name: 'Handheld Radios', desc: 'Portable, body-worn radios for people on foot' },
    { key: 'mobile', icon: '🚗', name: 'Vehicle Mobile Radios', desc: 'Higher-power radios mounted in vehicles' },
    { key: 'base', icon: '🏠', name: 'Base Station', desc: 'Fixed-location radio with outdoor antenna' },
    { key: 'hf', icon: '🌐', name: 'HF Radio', desc: 'Long-distance communication — hundreds or thousands of miles' },
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
  if (idx >= 0) kitSession.categories.splice(idx, 1);
  else kitSession.categories.push({ type: key, qty: 1 });
  renderCategoryPicker();
}

function finishDirectCategories() {
  if (kitSession.categories.length === 0) return;
  renderQuantityPicker();
}

function backToNeedsLanding() {
  document.getElementById('needs-landing').style.display = '';
  document.getElementById('needs-container').style.display = 'none';
  document.getElementById('kit-plan-container').style.display = 'none';
}

const categoryMeta = {
  handheld: { icon: '🤚', name: 'Handheld Radio Kit', unitLabel: 'person', unitPlural: 'people' },
  mobile: { icon: '🚗', name: 'Vehicle Mobile Kit', unitLabel: 'vehicle', unitPlural: 'vehicles' },
  base: { icon: '🏠', name: 'Base Station Kit', unitLabel: 'location', unitPlural: 'locations' },
  hf: { icon: '🌐', name: 'HF Radio Kit', unitLabel: 'station', unitPlural: 'stations' },
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
        return `
        <div class="qty-row">
          <div class="qty-icon">${m.icon}</div>
          <div class="qty-label">
            <strong>${m.name}</strong>
            <span>How many ${m.unitPlural}?</span>
          </div>
          <div class="qty-ctrl">
            <button onclick="adjustQty(${i},-1)">−</button>
            <div class="qty-val">${cat.qty}</div>
            <button onclick="adjustQty(${i},1)">+</button>
          </div>
        </div>`;
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
  cat.qty = Math.max(1, Math.min(8, cat.qty + delta));
  renderQuantityPicker();
}

function showKitPlan() {
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

  document.getElementById('needs-container').style.display = 'none';
  document.getElementById('kit-plan-container').style.display = 'block';
  renderKitPlan();
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
              <span>${kit.status === 'complete' ? kit.radioKey : kit.status === 'active' ? 'Building now...' : 'Waiting'}</span>
            </div>
            <div class="kpi-status ${kit.status}">${kit.status === 'complete' ? 'Done' : kit.status === 'active' ? 'Active' : 'Pending'}</div>
          </div>
        `).join('')}
      </div>
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
        <button class="btn-nav btn-back" onclick="document.getElementById('kit-plan-container').style.display='none';renderQuantityPicker()">← Back</button>
      </div>
    </div>
  `;
}

function startNextKit() {
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
  }
}

function completeCurrentKit(cartItems, programmingData) {
  const kit = kitSession.kits[kitSession.currentKitIndex];
  kit.status = 'complete';
  kit.cartItems = cartItems || [];
  if (programmingData) kit.programming = programmingData;

  // Hide all category phases and bottom bar
  document.getElementById('selector-phase').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'none';
  document.querySelector('.bottom-bar').style.display = 'none';
  if (document.getElementById('mobile-phase')) document.getElementById('mobile-phase').style.display = 'none';
  if (document.getElementById('base-phase')) document.getElementById('base-phase').style.display = 'none';
  if (document.getElementById('hf-phase')) document.getElementById('hf-phase').style.display = 'none';

  // Show needs phase with kit plan
  document.getElementById('needs-phase').style.display = 'block';
  document.getElementById('needs-landing').style.display = 'none';
  document.getElementById('needs-container').style.display = 'none';
  document.getElementById('kit-plan-container').style.display = 'block';
  renderKitPlan();
}

function startHandheldFlow() {
  // Route to existing handheld selector/interview
  document.getElementById('selector-phase').style.display = 'block';
  document.getElementById('selector-landing').style.display = '';
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

  document.getElementById('breadcrumb').innerHTML = '<a href="#">Shop</a> / <a href="#" onclick="backToKitPlan();return false">Kit Plan</a> / Handheld Radio';
}

function backToKitPlan() {
  // Abandon current kit — reset to pending
  const kit = kitSession.kits[kitSession.currentKitIndex];
  if (kit) kit.status = 'pending';

  document.getElementById('selector-phase').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'none';
  document.querySelector('.bottom-bar').style.display = 'none';
  if (document.getElementById('mobile-phase')) document.getElementById('mobile-phase').style.display = 'none';
  if (document.getElementById('base-phase')) document.getElementById('base-phase').style.display = 'none';
  if (document.getElementById('hf-phase')) document.getElementById('hf-phase').style.display = 'none';

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
    img: S+'2025/11/1000008462.jpg',
    tagline: 'Analog powerhouse',
    pitch: '50W mobile radio with Bluetooth smartphone control, GPS, APRS, and radio-to-radio text messaging. IP54 rated. Fully controllable from the hand mic.',
    features: ['50W VHF/UHF', '180 memory channels', 'Bluetooth control', 'GPS + APRS', 'Text messaging', 'IP54 water resistant', 'Airband receive', 'Hand mic control'],
    tags: ['waterproof', 'gps', 'bluetooth', 'simple', 'professional'],
    digital: false
  },
  {
    key: 'd578', name: 'DMR D578 Mobile Radio Kit', price: 549, id: 4157,
    img: S+'2023/11/20250904_100231-EDIT.jpg',
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
    img: S+'2023/06/20230608_164856-1.jpg',
    tagline: 'Budget HF — get on the air',
    pitch: 'Budget-friendly HF radio covering 1.8-54 MHz. Includes MARS/CAP mod. Ideal entry point for long-distance amateur radio.',
    features: ['20W HF', '1.8-54 MHz', 'Built-in tuner', 'MARS/CAP mod included', 'Compact form factor'],
    tags: ['budget', 'hf', 'portable'],
  },
  {
    key: 'ft891', name: 'Yaesu FT-891 Mobile Radio Kit', price: 899, id: 720,
    img: null,
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
    { key: 'tacoma-console', name: 'Console Radio Mounting Bracket — Toyota Tacoma 2016+', desc: 'Vehicle-specific console mount for Tacoma. Clean, integrated look.', price: 129, id: 6987, vehicleMatch: 'tacoma' },
  ],
  antennaMounts: [
    { key: 'lipmount-nmo', name: 'Comet CP-5NMO Antenna Lip Mount', desc: 'Permanent lip mount — most stable option. Mounts on trunk/hood lip without drilling.', price: 99, id: 7013, mountType: 'permanent' },
    { key: 'lipmount-so239', name: 'Comet CP-5M Antenna Lip Mount (SO-239)', desc: 'Permanent lip mount with SO-239 connector.', price: 99, id: 7277, mountType: 'permanent' },
    { key: 'fender-tacoma', name: 'Fender Antenna Mount — Toyota Tacoma 2016+', desc: 'Vehicle-specific NMO fender mount for clean, permanent install.', price: 29, id: 8224, mountType: 'permanent', vehicleMatch: 'tacoma' },
    { key: 'magmount-nmo', name: 'Comet Mag Mount NMO', desc: 'Flat magnetic mount for vehicle roofs. Easy to remove — best if you need to take the antenna off regularly.', price: 39, id: 6940, mountType: 'temporary' },
    { key: 'roofrack', name: 'Comet Adjustable Roof Rack Mount', desc: 'Clamps to roof rack bars. Good option when no flat metal surface is available.', price: 44.95, id: 7198, mountType: 'permanent' },
    { key: 'ditchlight', name: 'Ditch Light Antenna Mount Extension', desc: 'Adds antenna mount to existing ditch light mount.', price: 29, id: 7602, mountType: 'permanent' },
  ],
  vehicleAntennas: [
    { key: 'comet-b10', name: 'Comet B-10 VHF/UHF NMO Antenna (12")', desc: 'Compact 12-inch NMO antenna. Low profile for vehicles that need clearance.', price: 59, id: 8869 },
    { key: 'sar', name: 'Wideband Search and Rescue Vehicle Antenna', desc: 'Covers Amateur, FRS/GMRS, MURS, and Commercial frequencies. VHF 140-160MHz, UHF 435-465MHz. PL-259 terminated.', price: 79, id: 5428 },
  ],
  nmoCoax: [
    { key: 'nmo-coax', name: 'NMO Antenna Coax Cable Assembly', desc: 'Pre-terminated coax for NMO mounts. Connects your NMO mount to your radio.', price: 49, id: 6636 },
    { key: 'nmo-pl259', name: 'Comet CK-3NMO Deluxe NMO to PL-259 Cable', desc: 'Premium NMO to PL-259 cable assembly.', price: 45, id: 6715 },
    { key: 'so239-cable', name: 'Comet CK-3M5 Mobile Mount Cable SO-239', desc: 'Cable assembly for SO-239 mounts.', price: 44.95, id: 7200 },
  ],
  power: [
    { key: 'lifepo4-20ah', name: '20Ah LiFePO4 Battery', desc: 'Compact 12V portable power. Run your radio without the vehicle running — great for overlanding, tailgating, or emergency use.', price: 129, id: 6631 },
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
    { key: 'bs22', name: 'BS-22 Wireless Speakermic', desc: 'Bluetooth wireless speaker-microphone. Clips to gear, pairs via Bluetooth.', price: 59, id: 8491, compatRadios: ['uv-50pro'] },
    { key: 'bt01', name: 'BT-01 Mobile Bluetooth Speaker Mic', desc: 'Bluetooth speaker-microphone for mobile radios. Wireless audio with PTT for hands-free operation.', price: 149, id: 6717, compatRadios: ['d578'] },
    { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards.', price: 19, id: 966 },
    { key: 'relocation', name: 'Antenna Jack Relocation Cable', desc: 'Right-angle PL-259 to SO-239 cable for repositioning the antenna jack.', price: 19, id: 7271 },
    { key: 'manpack', name: 'Manpack Radio Bag', desc: 'Custom radio bag for portable/manpack operations. Fits mobile radios with battery for field-portable use.', price: 349, id: 856 },
  ],
};

// Base station specific
const baseProducts = {
  antennaPath: {
    quick: {
      label: 'Portable / Quick-Deploy Base',
      desc: 'Mountain Jumper mount with wideband antenna — set up anywhere with a metal surface. No drilling, no mast.',
      items: [
        { key: 'mtn-jumper', name: 'Mountain Jumper Angle-Adjustable Mount', desc: '180° adjustable magnetic mount. Works on metal roofs, barns, RVs, toolboxes, or any metal surface.', price: 69, id: 2046, required: true },
        { key: 'sar-antenna', name: 'Wideband Search and Rescue Antenna', desc: 'Covers Amateur, FRS/GMRS, MURS, and Commercial frequencies. Pairs with the Mountain Jumper mount.', price: 79, id: 5428, required: true },
      ]
    },
    permanent: {
      label: 'Permanent Mast / Tower Base',
      desc: 'High-performance base antenna on a mast or tower. Best range and performance — requires a user-supplied or purchased mast.',
      antennas: [
        { key: 'gp3', name: 'Comet GP-3 Base Antenna', desc: 'Dual-band VHF/UHF base antenna. SO-239 connector. Good balance of size and performance.', price: 109, id: 6897 },
        { key: 'gp6', name: 'Comet GP-6 Base Antenna', desc: 'Higher-gain dual-band VHF/UHF base antenna. SO-239 connector. Better range than GP-3 — larger antenna.', price: 179, id: 6716 },
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
    { key: 'efhw-80-10-portable', name: 'End Fed Half Wave 80M-10M', desc: 'Full-coverage HF antenna — 80 through 10 meters. More bands than the 40-10M version. Portable deployment.', price: 299, id: 7267 },
    { key: 'efhw-80-10-permanent', name: 'Chameleon LEFS Weatherproof End Fed Half Wave 80M-10M', desc: 'Permanent/weatherproof HF antenna covering 80-10 meters. Built for long-term outdoor installation.', price: 179, id: 6947 },
  ],
  accessories: [
    { key: 'digirig-ft891', name: 'Digirig with Interface Cables for FT-891', desc: 'Digital modes interface for the FT-891. Run FT8, JS8Call, Winlink, and other digital modes from your computer.', price: 89, id: 7272, radioMatch: 'ft891' },
    { key: 'digirig-g90', name: 'Digirig with Interface Cables for G90', desc: 'Digital modes interface for the G90. Run FT8, JS8Call, Winlink, and other digital modes from your computer.', price: 89, id: 7273, radioMatch: 'g90' },
    { key: 'relocation', name: 'Antenna Jack Relocation Cable', desc: 'Right-angle PL-259 to SO-239 cable.', price: 19, id: 7271 },
    { key: 'manpack', name: 'Manpack Radio Bag', desc: 'Custom radio bag for portable/manpack HF operations.', price: 349, id: 856 },
    { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards.', price: 19, id: 966 },
  ],
};

// Coax products (shared between base + HF)
const coaxProducts = {
  grades: [
    { key: '400uf-under50', name: '400 Ultra Flex', desc: 'Premium low-loss coax. Best for longer runs and maximum performance.', pricePerFt: 5, id: 6718, maxFt: 50, label: '400 Ultra Flex (≤50ft) — $5/ft' },
    { key: '400uf-over50', name: '400 Ultra Flex', desc: 'Premium low-loss coax — bulk pricing for longer runs.', pricePerFt: 3.50, id: 6950, minFt: 51, label: '400 Ultra Flex (>50ft) — $3.50/ft' },
    { key: '240uf-under50', name: '240 Ultra Flex', desc: 'Thinner, more flexible coax. Easier to route but slightly more signal loss.', pricePerFt: 3, id: 6951, maxFt: 50, label: '240 Ultra Flex (≤50ft) — $3/ft' },
    { key: '240uf-over50', name: '240 Ultra Flex', desc: 'Thinner coax — bulk pricing.', pricePerFt: 2, id: 6952, minFt: 51, label: '240 Ultra Flex (>50ft) — $2/ft' },
  ],
  prebuilt: [
    { key: 'rg316-25', name: '25ft RG-316 Coax with Choke', desc: 'Thin, flexible coax with built-in choke. Good for short runs and portable setups.', price: 79, id: 7075 },
  ]
};

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
  // If DMR handhelds were chosen, recommend D578 for digital interop
  const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
  const hasWaterproofPref = kitSession.preferences.includes('waterproof');
  if (dmrHandhelds.length > 0 && !hasWaterproofPref) return 'd578';
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

// ══════════════════════════════════════════════════════
// ── MOBILE FLOW ──
// ══════════════════════════════════════════════════════

let mobileState = {};

function startMobileFlow() {
  mobileState = { radioKey: null, vehicle: { year: '', make: '', model: '' }, selections: {}, cartItems: [], step: 0 };
  document.getElementById('breadcrumb').innerHTML = '<a href="#">Shop</a> / <a href="#" onclick="backToKitPlan();return false">Kit Plan</a> / Vehicle Mobile Radio';

  // Ensure mobile phase container exists
  if (!document.getElementById('mobile-phase')) {
    const div = document.createElement('div');
    div.id = 'mobile-phase';
    div.className = 'selector-phase';
    document.querySelector('.page').appendChild(div);
  }
  document.getElementById('mobile-phase').style.display = 'block';
  document.getElementById('mobile-phase').innerHTML = '';
  renderMobileRadioChoice();
}

function renderMobileRadioChoice() {
  const phase = document.getElementById('mobile-phase');
  const prefs = kitSession.preferences;
  const hasDigitalPref = prefs.includes('digital') || prefs.includes('crossband');
  const recommended = getRecommendedMobileRadio();

  phase.innerHTML = `
    <div class="selector-landing">
      <h2>Choose Your Mobile Radio</h2>
      <p>Both radios are 50W and include a hand mic, mounting bracket, power cable, and free custom programming.</p>
      <div class="radio-grid" style="max-width:700px;margin:0 auto">
        ${mobileRadioLineup.map(r => {
          let badge = '';
          if (recommended === r.key) {
            const done = getCompletedRadioKeys();
            const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
            if (dmrHandhelds.length > 0) badge = 'Recommended — matches your DMR handhelds';
            else if (done.mobile.length > 0) badge = 'Recommended — matches your vehicle radio';
            else badge = 'Recommended';
          } else if (hasDigitalPref && r.digital) {
            badge = 'Recommended for digital/encryption';
          }
          return `
          <div class="radio-pick ${mobileState.radioKey === r.key ? 'selected' : ''}" onclick="selectMobileRadio('${r.key}')">
            <div class="rp-img"><img src="${r.img || ''}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'"></div>
            <h4>${r.name.replace(' Essentials Kit','').replace(' Mobile Radio Kit','')}</h4>
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:18px;font-weight:700;color:var(--gold);margin-bottom:8px">$${r.price}</div>
            <div style="font-size:12px;color:#ddd;line-height:1.5;margin-bottom:8px">${r.pitch}</div>
            ${badge ? `<div style="font-size:11px;padding:4px 8px;background:#1a1800;border:1px solid var(--gold);color:var(--gold);display:inline-block;margin-bottom:8px">${badge}</div>` : ''}
            <ul style="text-align:left;font-size:12px;color:#ccc;margin-top:8px;padding-left:16px">${r.features.map(f=>'<li>'+f+'</li>').join('')}</ul>
          </div>`;
        }).join('')}
      </div>
      <div class="needs-btns" style="margin-top:20px">
        <button class="btn-nav btn-back" onclick="backToKitPlan()">← Back to Kit Plan</button>
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
    <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
      ${mobileState.step > 0 ? '<button class="btn-nav btn-back" onclick="mobileState.step--;renderMobileWizard()">← Back</button>' : '<button class="btn-nav btn-back" onclick="mobileState.radioKey=null;renderMobileRadioChoice()">← Change Radio</button>'}
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
    { name: 'Antenna & Mount', render: renderMobileAntenna },
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
  } else {
    // Complete kit
    completeCurrentKit(mobileState.cartItems, mobileState.selections.programming);
  }
}

function renderMobileVehicle() {
  const c = document.getElementById('mobile-step-content');
  const v = mobileState.vehicle || { year: '', make: '', model: '' };
  c.innerHTML = `
    <div class="section-head"><h2>Your Vehicle</h2><p>Tell us about your vehicle so we can recommend the right mounts and antenna setup.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <div class="field-row" style="display:flex;gap:12px;margin-bottom:12px">
        <div style="flex:1"><label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Year</label><input type="text" id="mv-year" value="${v.year}" placeholder="2024" style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%"></div>
        <div style="flex:2"><label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Make</label><input type="text" id="mv-make" value="${v.make}" placeholder="Toyota" style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%"></div>
        <div style="flex:2"><label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Model</label><input type="text" id="mv-model" value="${v.model}" placeholder="Tacoma" style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%"></div>
      </div>
      <div style="font-size:12px;color:#888;margin-top:8px">We use this to check for vehicle-specific mounting options.</div>
      <div style="margin-top:16px">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:8px">Radio mounting preference:</label>
        <div class="nq-option ${(mobileState.selections.radioMount === 'ramwedge') ? 'selected' : ''}" onclick="mobileState.selections.radioMount='ramwedge';renderMobileVehicle()">
          <div class="nq-check">${mobileState.selections.radioMount === 'ramwedge' ? '✓' : ''}</div>
          <div><div class="nq-label">RAM Tough Wedge — No-drill mount ($139)</div><div class="nq-detail">Wedge-style seat/console mount. No modifications to your vehicle.</div></div>
        </div>
        <div class="nq-option ${(mobileState.selections.radioMount === 'self') ? 'selected' : ''}" onclick="mobileState.selections.radioMount='self';renderMobileVehicle()">
          <div class="nq-check">${mobileState.selections.radioMount === 'self' ? '✓' : ''}</div>
          <div><div class="nq-label">I'll mount it myself / use the included bracket</div><div class="nq-detail">Kit includes a basic mounting bracket and screws.</div></div>
        </div>
      </div>
    </div>
  `;
  // Save vehicle on input changes
  ['mv-year','mv-make','mv-model'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      mobileState.vehicle = { year: document.getElementById('mv-year').value, make: document.getElementById('mv-make').value, model: document.getElementById('mv-model').value };
    });
  });
}

function renderMobileAntenna() {
  const c = document.getElementById('mobile-step-content');
  const v = mobileState.vehicle || {};
  const isTacoma = (v.make || '').toLowerCase().includes('tacoma') && parseInt(v.year) >= 2016;
  const sel = mobileState.selections;
  if (!sel.antennaMount) sel.antennaMount = null;
  if (!sel.antenna) sel.antenna = null;

  // Build mount options based on vehicle
  let mountOptions = [];
  if (isTacoma) {
    mountOptions.push({ key: 'fender-tacoma', highlight: true, label: 'Recommended: Tacoma Fender Mount ($29)', detail: 'Vehicle-specific NMO fender mount — clean, permanent install for your Tacoma.' });
  }
  mountOptions.push({ key: 'lipmount-nmo', highlight: !isTacoma, label: (isTacoma ? '' : 'Recommended: ') + 'Lip Mount NMO ($99)', detail: 'Most stable universal option. Mounts on trunk/hood lip without drilling.' });
  mountOptions.push({ key: 'magmount-nmo', highlight: false, label: 'Magnetic Mount NMO ($39)', detail: 'Easy removal — best if you frequently remove the antenna. Less stable than permanent mounts.' });
  mountOptions.push({ key: 'roofrack', highlight: false, label: 'Roof Rack Mount ($44.95)', detail: 'Clamps to roof rack bars. Good when no flat surface is available.' });

  c.innerHTML = `
    <div class="section-head"><h2>Antenna & Mount</h2><p>Your mobile radio needs an external antenna for best performance. We'll help you pick the right mount for your vehicle.</p></div>
    <div style="max-width:600px;margin:0 auto">
      <label style="font-size:14px;color:var(--gold);display:block;margin-bottom:8px">Antenna Mount</label>
      ${mountOptions.map(m => `
        <div class="nq-option ${sel.antennaMount === m.key ? 'selected' : ''}" onclick="mobileState.selections.antennaMount='${m.key}';renderMobileAntenna()">
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
            <div class="nq-label">${a.name} ($${a.price})</div>
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
  if (!sel.power) sel.power = { cigAdapter: true, lifepo4: false, lifepo4Size: '20ah', dcCharger: false, cables: [] };

  c.innerHTML = `
    <div class="section-head"><h2>Power</h2><p>Choose how you'll power your vehicle radio. The cigarette lighter adapter is included by default — the quickest way to get on the air.</p></div>
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
          <div class="nq-detail">Portable 12V power — run your radio without the engine running. Includes a DC-to-DC charger that keeps the battery topped off from your vehicle's auxiliary circuit. Do not connect charger to starter battery.</div>
        </div>
        <div style="font-weight:700;color:var(--gold);font-size:14px;white-space:nowrap">${sel.power.lifepo4Size === '20ah' ? '$228' : '$208'}</div>
      </div>
      ${sel.power.lifepo4 ? `
      <div style="display:flex;gap:8px;margin:-4px 0 8px 36px">
        <div class="nq-option ${sel.power.lifepo4Size === '20ah' ? 'selected' : ''}" onclick="mobileState.selections.power.lifepo4Size='20ah';renderMobilePower()" style="flex:1;justify-content:center;padding:10px">
          <div><div class="nq-label" style="text-align:center">20Ah — $228</div><div class="nq-detail" style="text-align:center">Recommended — longer runtime</div></div>
        </div>
        <div class="nq-option ${sel.power.lifepo4Size === '10ah' ? 'selected' : ''}" onclick="mobileState.selections.power.lifepo4Size='10ah';renderMobilePower()" style="flex:1;justify-content:center;padding:10px">
          <div><div class="nq-label" style="text-align:center">10Ah — $208</div><div class="nq-detail" style="text-align:center">Lighter, compact</div></div>
        </div>
      </div>
      ` : ''}

      <div class="nq-option ${sel.power.dcCharger ? 'selected' : ''}" onclick="mobileState.selections.power.dcCharger=!mobileState.selections.power.dcCharger;renderMobilePower()">
        <div class="nq-check">${sel.power.dcCharger ? '✓' : ''}</div>
        <div style="flex:1">
          <div class="nq-label">DC-to-DC Vehicle Charger Only — $99</div>
          <div class="nq-detail">Already have a LiFePO4 battery? Add just the vehicle charger. Charges from auxiliary battery circuit — do not connect to starter battery.</div>
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
    sel.programming = {
      zip: prior ? prior.zip : '',
      notes: '',
      brandmeisterId: prior ? (prior.brandmeisterId || '') : ''
    };
  }

  c.innerHTML = `
    <div class="section-head"><h2>Custom Programming</h2><p>Every Radio Made Easy kit comes custom programmed with GMRS, FRS, NOAA weather, and local repeaters for your area — included at no extra charge.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <div style="margin-bottom:16px">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Primary location (ZIP code)</label>
        <input type="text" id="mp-zip" value="${sel.programming.zip}" placeholder="Enter ZIP code" maxlength="5"
          style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%;max-width:200px"
          oninput="mobileState.selections.programming.zip=this.value">
        <div style="font-size:11px;color:#888;margin-top:4px">We'll program local repeaters from this area.</div>
      </div>
      ${isDMR ? `
      <div style="margin-bottom:16px;padding:14px;background:#1a1800;border:1px solid var(--gold-dim)">
        <label style="font-size:12px;color:var(--gold);display:block;margin-bottom:4px">Brandmeister DMR ID (optional)</label>
        <input type="text" id="mp-dmrid" value="${sel.programming.brandmeisterId}" placeholder="e.g. 3141234"
          style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%;max-width:200px"
          oninput="mobileState.selections.programming.brandmeisterId=this.value">
        <div style="font-size:11px;color:#ddd;margin-top:4px">This applies only to amateur radio license holders. If you don't have one yet, you can <a href="https://brandmeister.network" target="_blank" style="color:var(--gold)">apply at Brandmeister.network</a>.</div>
      </div>
      ` : ''}
      <div style="margin-bottom:16px">
        <div class="nq-option ${sel.programming.itinerantLicense ? 'selected' : ''}" onclick="mobileState.selections.programming.itinerantLicense=!mobileState.selections.programming.itinerantLicense;renderMobileProgramming()">
          <div class="nq-check">${sel.programming.itinerantLicense ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="nq-label">Business Itinerant License Assistance — $579</div>
            <div class="nq-detail">We'll help you obtain your FCC Business Itinerant license — valid for 10 years. Required for commercial Part 90 operation.</div>
          </div>
        </div>
      </div>
      <div>
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Special instructions (optional)</label>
        <textarea id="mp-notes" placeholder="Any special frequencies, channels, or notes for programming..."
          style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%;min-height:60px"
          oninput="mobileState.selections.programming.notes=this.value">${sel.programming.notes}</textarea>
      </div>
    </div>
  `;
}

function renderMobileReview() {
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
    const m = mobileProducts.antennaMounts.find(a => a.key === sel.antennaMount);
    if (m) { items.push({ name: m.name, price: m.price, id: m.id }); total += m.price; }
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
    if (a) { items.push({ name: a.name, price: a.price, id: a.id }); total += a.price; }
  });

  // Business license
  if (sel.programming && sel.programming.itinerantLicense) {
    items.push({ name: 'Business Itinerant License Assistance (10 years)', price: 579, id: 7174 }); total += 579;
  }

  mobileState.cartItems = items;

  c.innerHTML = `
    <div class="section-head"><h2>Review Your Mobile Kit</h2><p>${radio.name} — customized and ready to go.</p></div>
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
  baseState = { radioKey: null, antennaPath: null, selections: {}, cartItems: [], step: 0 };
  document.getElementById('breadcrumb').innerHTML = '<a href="#">Shop</a> / <a href="#" onclick="backToKitPlan();return false">Kit Plan</a> / Base Station';
  if (!document.getElementById('base-phase')) {
    const div = document.createElement('div');
    div.id = 'base-phase';
    div.className = 'selector-phase';
    document.querySelector('.page').appendChild(div);
  }
  document.getElementById('base-phase').style.display = 'block';
  document.getElementById('base-phase').innerHTML = '';
  renderBaseRadioChoice();
}

function renderBaseRadioChoice() {
  const phase = document.getElementById('base-phase');
  const prefs = kitSession.preferences;
  const hasDigitalPref = prefs.includes('digital') || prefs.includes('crossband');
  const recommended = getRecommendedBaseRadio();

  phase.innerHTML = `
    <div class="selector-landing">
      <h2>Choose Your Base Station Radio</h2>
      <p>Same radios as our vehicle mobile kits — paired with base station accessories for a fixed-location setup.</p>
      <div class="radio-grid" style="max-width:700px;margin:0 auto">
        ${mobileRadioLineup.map(r => {
          let badge = '';
          if (recommended === r.key) {
            const done = getCompletedRadioKeys();
            if (done.mobile.length > 0) badge = 'Recommended — matches your vehicle radio';
            else {
              const dmrHandhelds = done.handheld.filter(k => k === 'dmr-6x2' || k === 'da-7x2');
              if (dmrHandhelds.length > 0) badge = 'Recommended — matches your DMR handhelds';
              else badge = 'Recommended';
            }
          } else if (hasDigitalPref && r.digital) {
            badge = 'Recommended for digital/privacy';
          }
          return `
          <div class="radio-pick ${baseState.radioKey === r.key ? 'selected' : ''}" onclick="selectBaseRadio('${r.key}')">
            <div class="rp-img"><img src="${r.img || ''}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'"></div>
            <h4>${r.name.replace(' Essentials Kit','').replace(' Mobile Radio Kit','')}</h4>
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:18px;font-weight:700;color:var(--gold);margin-bottom:8px">$${r.price}</div>
            ${badge ? `<div style="font-size:11px;padding:4px 8px;background:#1a1800;border:1px solid var(--gold);color:var(--gold);display:inline-block">` + badge + '</div>' : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="needs-btns" style="margin-top:20px">
        <button class="btn-nav btn-back" onclick="backToKitPlan()">← Back to Kit Plan</button>
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
    { name: 'Antenna Setup', render: renderBaseAntennaPath },
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
        <h1 style="font-size:22px">${radio.name} — Base Station</h1>
        <div class="base-price">$${radio.price}.00</div>
      </div>
    </div>
    <div class="step-labels" style="margin-bottom:16px">
      ${steps.map((s, i) => `<div class="step-label ${i === baseState.step ? 'active' : ''}" onclick="baseState.step=${i};renderBaseWizard()">${s.name}</div>`).join('')}
    </div>
    <div id="base-step-content"></div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
      ${baseState.step > 0 ? '<button class="btn-nav btn-back" onclick="baseState.step--;renderBaseWizard()">← Back</button>' : '<button class="btn-nav btn-back" onclick="baseState.radioKey=null;renderBaseRadioChoice()">← Change Radio</button>'}
      <button class="btn-nav btn-next" onclick="advanceBaseStep()">
        ${baseState.step < steps.length - 1 ? 'Next: ' + steps[baseState.step + 1].name + ' →' : 'Save Kit & Continue →'}
      </button>
    </div>
  `;
  step.render();
}

function advanceBaseStep() {
  const steps = getBaseSteps();
  if (baseState.step < steps.length - 1) { baseState.step++; renderBaseWizard(); }
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
            ${quick.items.map(i => `${i.name} — $${i.price}`).join('<br>')}
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
              <div><div class="nq-label">${a.name} ($${a.price})</div><div class="nq-detail">${a.desc}</div></div>
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

function renderBaseCoax() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.coax) sel.coax = { grade: '400uf', length: 25 };

  const grade = sel.coax.grade;
  const len = sel.coax.length;
  const isOver50 = len > 50;
  const pricePerFt = grade === '400uf' ? (isOver50 ? 3.50 : 5) : (isOver50 ? 2 : 3);
  const coaxTotal = Math.round(len * pricePerFt * 100) / 100;
  const productId = grade === '400uf' ? (isOver50 ? 6950 : 6718) : (isOver50 ? 6952 : 6951);

  c.innerHTML = `
    <div class="section-head"><h2>Coax Cable</h2><p>Connect your radio to the antenna. Enter the length you need — measure from where the radio will sit to where the antenna will be mounted.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <label style="font-size:14px;color:var(--gold);display:block;margin-bottom:8px">Cable Grade</label>
      <div class="nq-option ${grade === '400uf' ? 'selected' : ''}" onclick="baseState.selections.coax.grade='400uf';renderBaseCoax()">
        <div class="nq-check">${grade === '400uf' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">⭐ 400 Ultra Flex — Recommended</div>
          <div class="nq-detail">Premium low-loss coax. Best performance, especially for longer runs. $5/ft (≤50ft) or $3.50/ft (>50ft).</div>
        </div>
      </div>
      <div class="nq-option ${grade === '240uf' ? 'selected' : ''}" onclick="baseState.selections.coax.grade='240uf';renderBaseCoax()">
        <div class="nq-check">${grade === '240uf' ? '✓' : ''}</div>
        <div>
          <div class="nq-label">240 Ultra Flex — Budget-friendly</div>
          <div class="nq-detail">Thinner, more flexible, slightly more signal loss. $3/ft (≤50ft) or $2/ft (>50ft).</div>
        </div>
      </div>

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
      <div id="base-coax-price" style="margin-top:16px;padding:12px;background:#1a1800;border:1px solid var(--gold-dim);text-align:center">
        <div style="font-size:13px;color:#ddd">${len}ft of ${grade === '400uf' ? '400' : '240'} Ultra Flex @ $${pricePerFt}/ft</div>
        <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${coaxTotal.toFixed(2)}</div>
      </div>
      <div style="font-size:11px;color:#888;margin-top:8px">Tip: Add a few extra feet for routing around corners and through walls. It's better to have too much than too little.</div>
    </div>
  `;
}

function updateBaseCoaxPrice() {
  const sel = baseState.selections;
  const g = sel.coax.grade;
  const l = sel.coax.length;
  const over = l > 50;
  const ppf = g === '400uf' ? (over ? 3.50 : 5) : (over ? 2 : 3);
  const tot = Math.round(l * ppf * 100) / 100;
  document.getElementById('base-coax-price').innerHTML = `
    <div style="font-size:13px;color:#ddd">${l}ft of ${g === '400uf' ? '400' : '240'} Ultra Flex @ $${ppf}/ft</div>
    <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${tot.toFixed(2)}</div>
  `;
}

function renderBasePower() {
  const c = document.getElementById('base-step-content');
  const sel = baseState.selections;
  if (!sel.power) sel.power = null;

  c.innerHTML = `
    <div class="section-head"><h2>Power Supply</h2><p>Your base station needs a 12V power source. We recommend the LiFePO4 battery for most setups — it doubles as emergency backup power.</p></div>
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
          <div class="nq-label">Both — Battery + AC Power Supply ($307)</div>
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
  const radio = mobileRadioLineup.find(r => r.key === baseState.radioKey);
  const isDMR = radio && radio.digital;
  const sel = baseState.selections;
  if (!sel.programming) {
    const prior = getPriorProgramming();
    sel.programming = {
      zip: prior ? prior.zip : '',
      notes: '',
      brandmeisterId: prior ? (prior.brandmeisterId || '') : ''
    };
  }

  c.innerHTML = `
    <div class="section-head"><h2>Custom Programming</h2><p>Every Radio Made Easy kit comes custom programmed with GMRS, FRS, NOAA weather, and local repeaters for your area — included at no extra charge.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <div style="margin-bottom:16px">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Base station location (ZIP code)</label>
        <input type="text" value="${sel.programming.zip}" placeholder="Enter ZIP code" maxlength="5"
          style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%;max-width:200px"
          oninput="baseState.selections.programming.zip=this.value">
      </div>
      ${isDMR ? `
      <div style="margin-bottom:16px;padding:14px;background:#1a1800;border:1px solid var(--gold-dim)">
        <label style="font-size:12px;color:var(--gold);display:block;margin-bottom:4px">Brandmeister DMR ID (optional)</label>
        <input type="text" value="${sel.programming.brandmeisterId}" placeholder="e.g. 3141234"
          style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%;max-width:200px"
          oninput="baseState.selections.programming.brandmeisterId=this.value">
        <div style="font-size:11px;color:#ddd;margin-top:4px">Applies only to amateur radio license holders. <a href="https://brandmeister.network" target="_blank" style="color:var(--gold)">Apply at Brandmeister.network</a>.</div>
      </div>
      ` : ''}
      <div style="margin-bottom:16px">
        <div class="nq-option ${sel.programming.itinerantLicense ? 'selected' : ''}" onclick="baseState.selections.programming.itinerantLicense=!baseState.selections.programming.itinerantLicense;renderBaseProgramming()">
          <div class="nq-check">${sel.programming.itinerantLicense ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="nq-label">Business Itinerant License Assistance — $579</div>
            <div class="nq-detail">We'll help you obtain your FCC Business Itinerant license — valid for 10 years. Required for commercial Part 90 operation.</div>
          </div>
        </div>
      </div>
      <div>
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px">Special instructions (optional)</label>
        <textarea placeholder="Any special frequencies, channels, or notes..."
          style="background:#111;border:1px solid var(--border);color:var(--text);padding:8px;width:100%;min-height:60px"
          oninput="baseState.selections.programming.notes=this.value">${sel.programming.notes}</textarea>
      </div>
    </div>
  `;
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
      if (a) { items.push({ name: a.name, price: a.price, id: a.id }); total += a.price; }
    }
    if (sel.mastMount) {
      const m = baseProducts.antennaPath.permanent.mounts.find(x => x.key === sel.mastMount);
      if (m) { items.push({ name: m.name, price: m.price, id: m.id }); total += m.price; }
    }
  }

  // Coax
  if (sel.coax) {
    const isOver50 = sel.coax.length > 50;
    const pricePerFt = sel.coax.grade === '400uf' ? (isOver50 ? 3.50 : 5) : (isOver50 ? 2 : 3);
    const coaxTotal = Math.round(sel.coax.length * pricePerFt * 100) / 100;
    const productId = sel.coax.grade === '400uf' ? (isOver50 ? 6950 : 6718) : (isOver50 ? 6952 : 6951);
    items.push({ name: `${sel.coax.length}ft ${sel.coax.grade === '400uf' ? '400' : '240'} Ultra Flex Coax`, price: coaxTotal, id: productId, qty: sel.coax.length });
    total += coaxTotal;
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
    if (a) { items.push({ name: a.name, price: a.price, id: a.id }); total += a.price; }
  });

  // Business license
  if (sel.programming && sel.programming.itinerantLicense) {
    items.push({ name: 'Business Itinerant License Assistance (10 years)', price: 579, id: 7174 }); total += 579;
  }

  baseState.cartItems = items;

  c.innerHTML = `
    <div class="section-head"><h2>Review Your Base Station Kit</h2><p>${radio.name} — base station configuration.</p></div>
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
  hfState = { radioKey: null, selections: {}, cartItems: [], step: 0 };
  document.getElementById('breadcrumb').innerHTML = '<a href="#">Shop</a> / <a href="#" onclick="backToKitPlan();return false">Kit Plan</a> / HF Radio';
  if (!document.getElementById('hf-phase')) {
    const div = document.createElement('div');
    div.id = 'hf-phase';
    div.className = 'selector-phase';
    document.querySelector('.page').appendChild(div);
  }
  document.getElementById('hf-phase').style.display = 'block';
  document.getElementById('hf-phase').innerHTML = '';
  renderHfRadioChoice();
}

function renderHfRadioChoice() {
  const phase = document.getElementById('hf-phase');
  phase.innerHTML = `
    <div class="selector-landing">
      <h2>Choose Your HF Radio</h2>
      <p>HF radios provide long-distance communication — hundreds or thousands of miles depending on conditions and antenna.</p>
      <div class="radio-grid" style="max-width:700px;margin:0 auto">
        ${hfRadioLineup.map(r => `
          <div class="radio-pick ${hfState.radioKey === r.key ? 'selected' : ''} ${r.outOfStock ? '' : ''}" onclick="${r.outOfStock ? '' : `selectHfRadio('${r.key}')`}" style="${r.outOfStock ? 'opacity:0.5;cursor:not-allowed' : ''}">
            <div class="rp-img">${r.img ? `<img src="${r.img}" alt="${r.name}" onerror="this.parentElement.innerHTML='📻'">` : '📻'}</div>
            <h4>${r.name.replace(' Mobile Radio Kit','')}</h4>
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">${r.tagline}</div>
            <div style="font-size:18px;font-weight:700;color:var(--gold);margin-bottom:8px">$${r.price}</div>
            ${r.outOfStock ? '<div style="font-size:11px;padding:4px 8px;background:#3a1111;border:1px solid var(--red);color:var(--red);display:inline-block">Out of Stock</div>' : ''}
            <ul style="text-align:left;font-size:12px;color:#ccc;margin-top:8px;padding-left:16px">${r.features.map(f=>'<li>'+f+'</li>').join('')}</ul>
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
    <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">
      ${hfState.step > 0 ? '<button class="btn-nav btn-back" onclick="hfState.step--;renderHfWizard()">← Back</button>' : '<button class="btn-nav btn-back" onclick="hfState.radioKey=null;renderHfRadioChoice()">← Change Radio</button>'}
      <button class="btn-nav btn-next" onclick="advanceHfStep()">
        ${hfState.step < steps.length - 1 ? 'Next: ' + steps[hfState.step + 1].name + ' →' : 'Save Kit & Continue →'}
      </button>
    </div>
  `;
  step.render();
}

function advanceHfStep() {
  const steps = getHfSteps();
  if (hfState.step < steps.length - 1) { hfState.step++; renderHfWizard(); }
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
  if (!sel.coax) sel.coax = { grade: '400uf', length: 25 };

  const grade = sel.coax.grade;
  const len = sel.coax.length;
  const isOver50 = len > 50;
  const pricePerFt = grade === '400uf' ? (isOver50 ? 3.50 : 5) : (isOver50 ? 2 : 3);
  const coaxTotal = Math.round(len * pricePerFt * 100) / 100;

  c.innerHTML = `
    <div class="section-head"><h2>Coax Cable</h2><p>Connect your radio to the antenna. For HF, lower-loss coax makes a bigger difference on longer runs.</p></div>
    <div style="max-width:500px;margin:0 auto">
      <label style="font-size:14px;color:var(--gold);display:block;margin-bottom:8px">Cable Grade</label>
      <div class="nq-option ${grade === '400uf' ? 'selected' : ''}" onclick="hfState.selections.coax.grade='400uf';renderHfCoax()">
        <div class="nq-check">${grade === '400uf' ? '✓' : ''}</div>
        <div><div class="nq-label">⭐ 400 Ultra Flex — Recommended</div><div class="nq-detail">Premium low-loss. $5/ft (≤50ft) or $3.50/ft (>50ft).</div></div>
      </div>
      <div class="nq-option ${grade === '240uf' ? 'selected' : ''}" onclick="hfState.selections.coax.grade='240uf';renderHfCoax()">
        <div class="nq-check">${grade === '240uf' ? '✓' : ''}</div>
        <div><div class="nq-label">240 Ultra Flex — Budget-friendly</div><div class="nq-detail">Thinner, more flexible. $3/ft (≤50ft) or $2/ft (>50ft).</div></div>
      </div>

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
        <div style="font-size:13px;color:#ddd">${len}ft @ $${pricePerFt}/ft</div>
        <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${coaxTotal.toFixed(2)}</div>
      </div>

      <div style="margin-top:16px">
        <div class="nq-option ${sel.prebuiltCoax ? 'selected' : ''}" onclick="hfState.selections.prebuiltCoax=!hfState.selections.prebuiltCoax;renderHfCoax()">
          <div class="nq-check">${sel.prebuiltCoax ? '✓' : ''}</div>
          <div><div class="nq-label">Also add: 25ft RG-316 Coax with Choke ($79)</div><div class="nq-detail">Thin, flexible coax with choke for portable/field use.</div></div>
        </div>
      </div>
    </div>
  `;
}

function updateHfCoaxPrice() {
  const sel = hfState.selections;
  const g = sel.coax.grade;
  const l = sel.coax.length;
  const over = l > 50;
  const ppf = g === '400uf' ? (over ? 3.50 : 5) : (over ? 2 : 3);
  const tot = Math.round(l * ppf * 100) / 100;
  document.getElementById('hf-coax-price').innerHTML = `
    <div style="font-size:13px;color:#ddd">${l}ft @ $${ppf}/ft</div>
    <div style="font-size:20px;font-weight:700;color:var(--gold);margin-top:4px">$${tot.toFixed(2)}</div>
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

  // Coax
  if (sel.coax) {
    const isOver50 = sel.coax.length > 50;
    const pricePerFt = sel.coax.grade === '400uf' ? (isOver50 ? 3.50 : 5) : (isOver50 ? 2 : 3);
    const coaxTotal = Math.round(sel.coax.length * pricePerFt * 100) / 100;
    items.push({ name: `${sel.coax.length}ft ${sel.coax.grade === '400uf' ? '400' : '240'} Ultra Flex Coax`, price: coaxTotal });
    total += coaxTotal;
  }
  if (sel.prebuiltCoax) {
    items.push({ name: '25ft RG-316 Coax with Choke', price: 79, id: 7075 }); total += 79;
  }

  // Power
  (sel.power || []).forEach(key => {
    const p = mobileProducts.power.find(x => x.key === key);
    if (p) { items.push({ name: p.name, price: p.price, id: p.id }); total += p.price; }
  });

  // Accessories
  (sel.accessories || []).forEach(key => {
    const a = hfProducts.accessories.find(x => x.key === key);
    if (a) { items.push({ name: a.name, price: a.price, id: a.id }); total += a.price; }
  });

  hfState.cartItems = items;

  c.innerHTML = `
    <div class="section-head"><h2>Review Your HF Kit</h2><p>${radio.name} — ready for long-distance communication.</p></div>
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

  container.innerHTML = `
    <div class="kit-plan">
      <h2>Review All Kits</h2>
      <p class="plan-sub">${kitSession.kits.length} kit${kitSession.kits.length > 1 ? 's' : ''} — everything you need, all in one order.</p>
      <div style="text-align:left">${kitsHtml}</div>
      <div style="display:flex;justify-content:space-between;padding:16px;background:#1a1800;border:2px solid var(--gold);font-size:18px;font-weight:700;margin-bottom:24px">
        <span style="color:var(--gold)">Grand Total</span>
        <span style="color:var(--gold)">$${grandTotal.toFixed(2)}</span>
      </div>
      <button class="btn-nav btn-next" style="font-size:16px;padding:14px 32px" onclick="alert('Add to Cart — coming soon! This will add all ${kitSession.kits.reduce((s,k) => s + k.cartItems.length, 0)} items to your WooCommerce cart.')">
        Add All to Cart →
      </button>
      <div style="margin-top:12px">
        <button class="btn-nav btn-back" onclick="renderKitPlan()">← Back to Kit Plan</button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════
// ── EXISTING HANDHELD KIT BUILDER STATE ──
// ══════════════════════════════════════════════════════

let BASE_PRICE = 59;
let currentStep = 0;
let totalSteps = 6;

// Radios that need a color choice step
const radiosWithColor = new Set(['uv-pro']);

// Build step configuration based on selected radio
function getSteps() {
  const hasColor = radiosWithColor.has(selectedRadioKey);
  const steps = [];
  if (hasColor) steps.push({ id: 'step-color', name: 'Color', render: renderColorChoice });
  steps.push({ id: 'step-0', name: 'Antennas', render: renderAntennaUpgrades });
  steps.push({ id: 'step-1', name: 'More Antennas', render: renderAdditionalAntennas });
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
const ADAPTER_PRICE = 5; // SMA-F to BNC-F Adapter [456] — added once if any BNC antenna selected

// Shared items (available for all radios)
const sharedAntennaUpgrades = [
  { key: 'stubby', name: 'Stubby Antenna with BNC Adapter', desc: 'Compact, low-profile antenna. Great for covert carry, backpacking, or when you need a shorter profile.', price: 39, img: S+'2023/05/20250227_154740.jpg', ids: [816, 456], addsToCart: ['Stubby Antenna [816] — $39'] },
  { key: 'foulweather', name: 'Foul Weather Whip with BNC Adapter', desc: 'Flexible whip that bends without breaking. Ideal for field use, rucking, and mounting on chest rigs or plate carriers.', price: 40, img: S+'2024/03/20240320_115347.jpg', ids: [3916, 456], addsToCart: ['Foul Weather Whip [3916] — $40'] },
  { key: 'signalstick', name: 'Signal Stick with BNC Adapter', desc: 'Super elastic, nearly indestructible flexible antenna. Excellent all-around performer for both transmit and receive.', price: 25, img: S+'2022/07/IMGP8549-scaled.jpg', ids: [39, 456], addsToCart: ['Signal Stick [39] — $25'] },
];

const sharedAdditionalAntennas = [
  { key: 'wearable', name: 'Wearable BNC Antenna', desc: 'Low-profile antenna designed for body-worn setups. Lays flat against gear or clothing for a streamlined, covert profile.', price: 69, img: S+'2022/10/20221006_154507.jpg', id: 460, needsAdapter: true },
  { key: 'slimjim', name: 'Roll Up Slim Jim Antenna', desc: 'Portable VHF/UHF antenna you can hang from a tree branch, window, or tarp ridge line. Dramatically extends your range — essential for base camp ops.', price: 49, img: S+'2022/08/12200-2-scaled.jpg', id: 99, needsAdapter: true },
  { key: 'magmount', name: 'Magnetic BNC Antenna Base', desc: 'Magnetic base mount for any BNC antenna. Stick on a vehicle roof, toolbox, or any metal surface for instant mobile capability.', price: 39, img: S+'2022/10/IMGP8553-scaled.jpg', id: 521, needsAdapter: true },
  { key: 'mollemount', name: 'BNC MOLLE Antenna Mount', desc: 'Attach any BNC antenna to MOLLE webbing on your vest, pack, or plate carrier. Keeps the antenna off the radio for a low-profile setup.', price: 19, img: S+'2025/12/1000009993.jpg', id: 8717, needsAdapter: true },
  { key: 'extraadapter', name: 'Extra SMA-F to BNC-F Adapter', desc: 'Spare BNC adapter so you can leave one on a mag mount or other accessory and still have one for the radio. One adapter is already included if you selected an antenna upgrade.', price: 5, img: S+'2022/09/smaftobncf.jpg', id: 456, needsAdapter: false, isAdapter: true },
];

// Radio-specific product catalogs
const radioProducts = {
  'uv5r': {
    batteryLabel: 'Factory Battery (1800mAh)',
    batteryDesc: 'Standard battery included with your kit. Requires charging cradle (included).',
    batteries: [
      { key: 'usbc-standard', name: 'USB-C Battery (1300mAh) with Cable', desc: 'Standard-size rechargeable battery with built-in USB-C port. Charge from any USB-C cable — no cradle needed.', price: 25, img: S+'2023/08/20230831_163401.jpg', id: 2367 },
      { key: 'usbc-extended', name: 'USB-C Extended Battery (3800mAh) with Cable', desc: 'High-capacity extended battery with built-in USB-C port. Nearly triple the runtime of the factory battery.', price: 29, img: S+'2023/04/20250725_123654.jpg', id: 749 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone. Mount on your chest rig, collar, or shoulder strap for hands-free communication.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Keeps audio discreet — popular for security, events, and low-profile ops.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'aprs', name: 'APRS Cable', desc: 'Audio interface cable connecting your radio to a smartphone. Run Rattlegram or APRSdroid for off-grid text messaging and position reporting.', price: 25, img: S+'2023/06/20230608_164856-1.jpg', id: 1177 },
      { key: 'progcable', name: 'USB Programming Cable', desc: 'Program custom frequencies via CHIRP software on your computer. Essential for serious operators who want full channel control.', price: 25, img: S+'2024/08/uv5r-programming-cable.jpg', id: 4838 },
      { key: 'exo', name: 'Exoskeleton', desc: 'Hard protective shell that prevents accidental PTT button presses and absorbs drops. Essential for field use.', price: 29, img: S+'2022/07/4A7A3860_white_square.png', id: 38 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection. Hear radio traffic through your earpro.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
    ],
  },
  'uv5r-mini': {
    batteryLabel: 'Built-in USB-C Battery',
    batteryDesc: 'The UV-5R Mini has a built-in USB-C rechargeable battery — just plug in any USB-C cable to charge. Battery is not removable.',
    batteries: [],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone. Mount on your chest rig, collar, or shoulder strap for hands-free communication.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Keeps audio discreet — popular for security, events, and low-profile ops.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'progcable', name: 'USB Programming Cable', desc: 'Program custom frequencies via CHIRP software on your computer.', price: 25, img: S+'2024/08/uv5r-programming-cable.jpg', id: 4838 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
    ],
  },
  'uv-pro': {
    batteryLabel: 'USB-C Rechargeable Battery (2600mAh)',
    batteryDesc: 'The UV-PRO includes a USB-C rechargeable battery. Charge from any USB-C cable — no cradle needed.',
    batteries: [
      { key: 'uvpro-spare', name: 'Extra UV-PRO Battery (2600mAh)', desc: 'Spare USB-C rechargeable battery for the UV-PRO. Swap in the field for extended ops without waiting to recharge.', price: 25, img: S+'2025/11/uvpro-battery-black.jpg', id: 8312 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'bs22', name: 'BS-22 Wireless Speakermic', desc: 'Bluetooth wireless speaker-microphone designed for the UV-PRO. No cable — clips to your gear and pairs via Bluetooth.', price: 59, img: S+'2025/12/1000009367.jpg', id: 8491 },
      { key: 'kplug', name: 'K-Plug Adapter', desc: 'Adapter that lets you use standard Kenwood-plug accessories (speakermics, eartubes, headsets) with your UV-PRO.', price: 25, img: S+'2025/11/1000008462.jpg', id: 8268 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Requires K-Plug Adapter for the UV-PRO.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
    ],
  },
  'dmr-6x2': {
    batteryLabel: 'USB-C Rechargeable Battery (3100mAh)',
    batteryDesc: 'The DMR 6X2 PRO includes a high-capacity 3100mAh USB-C rechargeable battery. 2-3 days of battery life with battery save enabled.',
    batteries: [
      { key: 'dmr6x2-spare', name: 'Extra DMR 6X2 PRO Battery (3100mAh)', desc: 'Spare USB-C rechargeable battery. Swap in the field for extended ops — 2-3 days of runtime per battery.', price: 45, img: null, id: 6868 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone with Kenwood plug. Compatible with the DMR 6X2 PRO.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Kenwood plug — plugs directly into the DMR 6X2 PRO.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'progcable', name: 'Spare DMR 6X2 PRO Programming Cable', desc: 'Additional spare USB programming cable. One is already included with your kit — this is a backup for a second location or travel bag.', price: 12, img: S+'2025/12/1000009966.jpg', id: 8711 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
    ],
  },
  'da-7x2': {
    batteryLabel: 'USB-C Rechargeable Battery (3100mAh)',
    batteryDesc: 'The DA-7X2 includes a high-capacity 3100mAh USB-C rechargeable battery. 2-3 days of battery life with battery save enabled.',
    batteries: [
      { key: 'da7x2-spare', name: 'Extra DA-7X2 Battery (3100mAh)', desc: 'Spare USB-C rechargeable battery. Swap in the field for extended ops — 2-3 days of runtime per battery.', price: 45, img: null, id: 6868 },
    ],
    accessories: [
      { key: 'cheatsheets', name: 'Radio Cheat Sheets', desc: 'Waterproof laminated quick-reference cards. Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures.', price: 19, img: S+'2023/05/1000007350.jpg', id: 966 },
      { key: 'speakermic', name: 'UV-5R Speakermic', desc: 'Clip-on speaker-microphone with Kenwood plug. Compatible with the DA-7X2.', price: 29, img: S+'2023/07/20230530_1403102.jpg', id: 1430 },
      { key: 'eartube', name: 'Acoustic Eartube Headset', desc: 'Covert-style earpiece with push-to-talk. Kenwood plug — plugs directly into the DA-7X2.', price: 19, img: S+'2023/07/20230530_1405362.jpg', id: 1431 },
      { key: 'progcable', name: 'Spare DA-7X2 Programming Cable', desc: 'Additional spare USB programming cable. One is already included with your kit — this is a backup for a second location or travel bag.', price: 12, img: S+'2025/12/1000009966.jpg', id: 8711 },
      { key: 'saddle', name: 'Kenwood Plug Saddle', desc: 'Rubber port protector that keeps moisture and debris out of the accessory jack when not in use.', price: 9, img: S+'2024/02/4A7A3864-White.png', id: 3701 },
      { key: 'monocable', name: 'Speakermic to Earpro Cable', desc: '3.5mm mono cable connecting your speakermic to electronic ear protection.', price: 9, img: S+'2023/07/20230703_103456.jpg', id: 1438 },
    ],
  },
};

// Active product lists — populated when radio is selected
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
  const S = 'https://staging10.radiomadeeasy.com/wp-content/uploads/';
  const colors = [
    { key: 'black', name: 'Black', desc: 'Classic black — the standard UV-PRO finish. Discreet, professional look.', img: S+'2025/09/20250904_100414-EDIT.jpg' },
    { key: 'tan', name: 'Tan / Coyote', desc: 'Desert tan finish — blends with earth tones and tactical gear. Same radio, different look.', img: S+'2025/09/20250904_100414-EDIT.jpg' },
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
      <div class="oc-price free" style="color:var(--muted)">—</div>
    </div>
  `).join('');
}

function selectRadioColor(color) {
  uvproRadioColor = color;
  renderColorChoice();
}

function renderAntennaUpgrades() {
  const container = document.getElementById('antenna-options');
  const anySelected = selectedAntennas.size > 0;

  // Factory antenna — always included, always shown as selected
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

  // Adapter note
  let note = anySelected
    ? '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#5c5"><strong>SMA-F to BNC-F Adapter — $5</strong> will be added once to your order, shared by all BNC antennas below.</div>'
    : '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:var(--muted)">Want better performance? Add one or more BNC antenna upgrades below. Each requires a BNC adapter ($5, added once).</div>';

  container.innerHTML = factoryHtml + note + antennaUpgrades.map(a => `
    <div class="opt-card ${selectedAntennas.has(a.key) ? 'selected' : ''}"
         onclick="toggleAntenna('${a.key}')">
      <div class="oc-check">${selectedAntennas.has(a.key) ? '✓' : ''}</div>
      ${a.img ? `<div class="oc-img"><img src="${a.img}" alt="${a.name}" onerror="this.parentElement.innerHTML='<div style=\\'color:#444;font-size:11px;text-align:center;padding:8px\\'>No img</div>'"></div>` : ''}
      <div class="oc-body">
        <div class="oc-name">${a.name}</div>
        <div class="oc-desc">${a.desc}</div>
        <div class="oc-meta"></div>
      </div>
      <div class="oc-price">+$${a.price}</div>
    </div>
  `).join('');
}

function renderAdditionalAntennas() {
  const hasUpgrade = selectedAntennas.size > 0;
  const container = document.getElementById('addl-antenna-options');

  // Show BNC adapter note at top
  let adapterNote = '';
  if (hasUpgrade) {
    adapterNote = '<div style="background:#1a2a1a;border:1px solid #2a3a2a;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#5c5"><strong>BNC adapter already included</strong> with your antenna upgrade. BNC antennas below will share that adapter — or grab a spare below if you want one dedicated to each setup.</div>';
  } else {
    adapterNote = '<div style="background:#2a2000;border:1px solid #3a3000;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#d4af37"><strong>No antenna upgrade selected.</strong> BNC antennas below require an SMA-F to BNC-F Adapter — it will be auto-added if needed.</div>';
  }

  container.innerHTML = adapterNote + additionalAntennas.map(a => {
    const isAdapter = a.isAdapter;
    // Contextual subtitle for the extra adapter card
    let adapterSubtitle = '';
    if (isAdapter && hasUpgrade) {
      adapterSubtitle = '<div style="font-size:11px;color:var(--green);margin-top:2px">✓ One already included with your upgrade — this adds a spare</div>';
    } else if (isAdapter && !hasUpgrade) {
      adapterSubtitle = '<div style="font-size:11px;color:var(--gold-dim);margin-top:2px">One will be auto-added if you select a BNC antenna — this adds an extra</div>';
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

  // Factory/included battery — always shown
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
  container.innerHTML = accessories.map(a => `
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

function renderProgramming() {
  const container = document.getElementById('programming-options');

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
          <div class="oc-desc" style="max-height:none">GMRS channels (1-22 + repeater pairs), FRS, NOAA weather, and local repeaters for one location. Our recommended channel layout — ready to use out of the box.</div>
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
        <div class="oc-name">Skip Programming — Ship Immediately</div>
        <div class="oc-desc" style="max-height:none">Radio ships with factory default channels only. Choose this if you plan to program it yourself via CHIRP or another method.</div>
      </div>
      <div class="oc-price free" style="color:var(--muted)">—</div>
    </div>
  `;

  // Notes field (always visible unless 'none')
  if (programmingChoice !== 'none') {
    const isDmr = selectedRadioKey === 'dmr-6x2' || selectedRadioKey === 'da-7x2';
    const selRadio = radioLineup.find(r => r.key === selectedRadioKey);
    const showLicensing = interviewAnswers.use === 'professional' || (selRadio && selRadio.tags && selRadio.tags.includes('commercial'));
    html += `
      <div class="prog-section">
        ${isDmr ? `
        <div class="prog-field">
          <label>Brandmeister DMR ID <span style="color:var(--muted);font-weight:400">(optional — amateur radio license holders only)</span></label>
          <input type="text" maxlength="10" placeholder="e.g. 1234567" value="${progBrandmeisterId}"
                 oninput="progBrandmeisterId=this.value" onfocus="event.stopPropagation()">
          <div class="prog-note">If you have an amateur radio license and a Brandmeister ID, we'll program it into your radio for DMR digital voice. Don't have one yet? <a href="https://brandmeister.network" target="_blank" rel="noopener" style="color:var(--gold)">Register at brandmeister.network</a></div>
        </div>
        ` : ''}
        ${showLicensing ? `
        <div class="prog-field" onclick="event.stopPropagation()">
          <div class="opt-card ${wantsItinerantLicense ? 'selected' : ''}" onclick="wantsItinerantLicense=!wantsItinerantLicense;renderProgramming()" style="margin-bottom:0">
            <div class="oc-check">${wantsItinerantLicense ? '✓' : ''}</div>
            <div class="oc-body">
              <div class="oc-name">Business Itinerant License Assistance</div>
              <div class="oc-desc" style="max-height:none">We'll help you obtain your FCC Business Itinerant license — valid for 10 years, covers your entire organization. Required for commercial Part 90 operation.</div>
            </div>
            <div class="oc-price">+$579</div>
          </div>
        </div>
        ` : ''}
        <div class="prog-field">
          <label>Anything else we should know about your programming preferences?</label>
          <textarea placeholder="e.g. Custom channel names, specific repeater frequencies, Part 90 channels (license required), etc."
                    onchange="progNotes=this.value" onfocus="event.stopPropagation()">${progNotes}</textarea>
          <div class="prog-note">Optional — leave blank if standard programming is all you need.</div>
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
          <div class="prog-note">We use this as the center point of our repeater search, pulling in repeaters from the surrounding area. One central location usually covers a wide radius — no need to add nearby cities separately.</div>
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
      // City/state — try to parse and look up
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
  warning.innerHTML = `⚠️ These locations appear close together: ${pairDescs}. Our repeater search covers a wide area around each center point — one location may be enough to cover both. Consider removing the closer one unless they're in different coverage areas (e.g. separated by mountains).`;
  container.appendChild(warning);
}

// US state name → abbreviation
const _stateMap = {Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'};
function getStateAbbr(name) { return _stateMap[name] || null; }

function renderReview() {
  const list = document.getElementById('review-list');
  let items = [];

  // Base kit — no remove button
  const selRadio = radioLineup.find(r => r.key === selectedRadioKey) || radioLineup[0];
  const colorNote = selectedRadioKey === 'uv-pro' ? ` — ${uvproRadioColor === 'black' ? 'Black' : 'Tan / Coyote'}` : '';
  items.push(`
    <div class="review-item base">
      <div class="ri-img"><img src="${selRadio.img}" alt="" onerror="this.parentElement.innerHTML='📻'"></div>
      <div class="ri-name">${selRadio.name}<small>Base kit — pre-programmed radio + essentials${colorNote}</small></div>
      <div class="ri-price">$${selRadio.price}</div>
    </div>
  `);

  // Antenna upgrades
  selectedAntennas.forEach(key => {
    const ant = antennaUpgrades.find(a => a.key === key);
    if (ant) {
      items.push(`
        <div class="review-item">
          <div class="ri-img">${ant.img ? `<img src="${ant.img}" alt="">` : ''}</div>
          <div class="ri-name">${ant.name}<small>Antenna upgrade — mounts directly on radio</small></div>
          <div class="ri-price">+$${ant.price}</div>
          <button class="ri-remove" onclick="reviewRemove('antenna','${key}')" title="Remove">&times;</button>
        </div>
      `);
    }
  });

  // BNC adapter — auto-included, removable with warning
  const hasUpgrade = selectedAntennas.size > 0;
  const anyBNCNeeded = hasUpgrade || [...selectedAddlAntennas].some(key => {
    const a = additionalAntennas.find(x => x.key === key);
    return a && a.needsAdapter;
  });
  if (anyBNCNeeded && !adapterSuppressed) {
    items.push(`
      <div class="review-item" style="opacity:0.7">
        <div class="ri-img"><img src="${S}2022/09/smaftobncf.jpg" alt=""></div>
        <div class="ri-name">SMA-F to BNC-F Adapter<small>${hasUpgrade ? 'Included with antenna upgrade' : 'Auto-added — required for BNC antennas'}</small></div>
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
  selectedBatteries.forEach((qty, key) => {
    const bat = batteryUpgrades.find(b => b.key === key);
    if (bat) {
      items.push(`
        <div class="review-item">
          <div class="ri-img">${bat.img ? `<img src="${bat.img}" alt="">` : ''}</div>
          <div class="ri-name">${bat.name}${qty > 1 ? ' <small>×' + qty + '</small>' : ''}<small>Battery upgrade${selectedRadioKey === 'uv-pro' ? ` — ${(uvproBatteryColors.get(key) || uvproRadioColor) === 'black' ? 'Black' : 'Tan / Coyote'}` : ''}</small></div>
          <div class="ri-price">+$${bat.price * qty}</div>
          <button class="ri-remove" onclick="reviewRemove('battery','${key}')" title="Remove">&times;</button>
        </div>
      `);
    }
  });

  // Accessories
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
  if (programmingChoice === 'standard') {
    const loc = progUseShipping ? 'shipping address' : (progZipPrimary || 'TBD');
    items.push(`
      <div class="review-item" style="opacity:0.7">
        <div class="ri-img" style="background:var(--card);display:flex;align-items:center;justify-content:center;font-size:24px">📡</div>
        <div class="ri-name">Custom Programming<small>Standard — local repeaters for ${loc}</small></div>
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
        <div class="ri-name">No Programming<small>Ships with factory defaults — program it yourself</small></div>
        <div class="ri-price" style="color:var(--muted)">—</div>
      </div>
    `);
  }

  // Business itinerant license
  if (wantsItinerantLicense) {
    items.push(`
      <div class="review-item">
        <div class="ri-img" style="background:var(--card);display:flex;align-items:center;justify-content:center;font-size:24px">📋</div>
        <div class="ri-name">Business Itinerant License Assistance<small>FCC license — valid 10 years</small></div>
        <div class="ri-price">+$579</div>
        <button class="ri-remove" onclick="reviewRemove('license')" title="Remove">&times;</button>
      </div>
    `);
  }

  if (items.length === 1) {
    items.push('<div class="empty-state">No upgrades or accessories selected — just the base kit.</div>');
  }

  const total = calcTotal();
  items.push(`
    <div class="review-total">
      <div class="rt-label">Kit Total</div>
      <div class="rt-price">$${total}</div>
    </div>
  `);

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
    // Removing the spare — just remove it
    selectedAddlAntennas.delete('extraadapter');
    updateBottomBar();
    renderReview();
    return;
  }

  // Removing the auto adapter — warn if BNC antennas still in cart
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

  // No BNC antennas — safe to remove (shouldn't normally happen)
  updateBottomBar();
  renderReview();
}

function adapterWarnKeep() {
  document.getElementById('adapter-warn-modal').classList.remove('open');
}

function adapterWarnRemoveOnly() {
  // Remove adapter from order but keep all antennas — user has their own
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
    renderAdditionalAntennas();
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
  renderAdditionalAntennas();
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
  renderAdditionalAntennas();
  updateBottomBar();
}

function adapterModalSkip() {
  // User says they already have an adapter — add antenna without adapter
  selectedAddlAntennas.add(pendingAntennaKey);
  pendingAntennaKey = null;
  document.getElementById('adapter-modal').classList.remove('open');
  renderAdditionalAntennas();
  updateBottomBar();
}

function adapterModalCancel() {
  // User declined — don't add the antenna
  pendingAntennaKey = null;
  document.getElementById('adapter-modal').classList.remove('open');
}

function toggleBattery(key) {
  if (selectedBatteries.has(key)) selectedBatteries.delete(key);
  else selectedBatteries.set(key, 1);
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

  // Business itinerant license
  if (wantsItinerantLicense) total += 579;

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

function collectHandheldCartItems() {
  const selRadio = radioLineup.find(r => r.key === selectedRadioKey) || radioLineup[0];
  let items = [{ name: selRadio.name, price: selRadio.price, id: selRadio.id }];

  selectedAntennas.forEach(key => {
    const a = antennaUpgrades.find(x => x.key === key);
    if (a) items.push({ name: a.name, price: a.price, ids: a.ids });
  });

  const hasUpgrade = selectedAntennas.size > 0;
  const anyBNC = hasUpgrade || [...selectedAddlAntennas].some(key => {
    const a = additionalAntennas.find(x => x.key === key);
    return a && a.needsAdapter;
  });
  if (anyBNC && !adapterSuppressed) items.push({ name: 'SMA-F to BNC-F Adapter', price: 5 });

  selectedAddlAntennas.forEach(key => {
    const a = additionalAntennas.find(x => x.key === key);
    if (a && !a.isAdapter) items.push({ name: a.name, price: a.price || 0, ids: a.ids });
  });

  selectedBatteries.forEach((qty, key) => {
    const bat = batteryUpgrades.find(b => b.key === key);
    if (bat) items.push({ name: bat.name + (qty > 1 ? ' x' + qty : ''), price: bat.price * qty, ids: bat.ids });
  });

  if (programmingChoice === 'multi') items.push({ name: 'Multi-Location Programming', price: 10 });
  if (wantsItinerantLicense) items.push({ name: 'Business Itinerant License Assistance (10 years)', price: 579, id: 7174 });

  selectedAccessories.forEach(key => {
    const a = accessories.find(x => x.key === key);
    if (a) items.push({ name: a.name, price: a.price || 0, ids: a.ids });
  });

  return items;
}

function updateBottomBar() {
  const total = calcTotal();
  const adds = total - BASE_PRICE;
  const count = countAddons();
  document.getElementById('bb-total').textContent = '$' + total;
  document.getElementById('bb-adds').textContent = adds > 0 ? '+ $' + adds + ' add-ons' : '+ $0 add-ons';
  document.getElementById('bb-items').textContent = count > 0 ? count + ' item' + (count > 1 ? 's' : '') + ' added' : 'Base kit only';
}

// ── Navigation ──────────────────────────────────────
function goStep(n) {
  const steps = getSteps();
  if (n < 0 || n >= steps.length) return;
  currentStep = n;

  // Show/hide sections by ID
  const allSectionIds = ['step-color', 'step-0', 'step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
  allSectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active'); el.style.display = 'none'; }
  });
  const activeEl = document.getElementById(steps[n].id);
  if (activeEl) { activeEl.classList.add('active'); activeEl.style.display = 'block'; }

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
  document.getElementById('sm-label').textContent = 'Step ' + (n + 1) + ' of ' + steps.length + ' — ' + steps[n].name;
  document.querySelectorAll('.sm-dot').forEach((el, i) => {
    el.classList.remove('done', 'active');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  });

  // Update buttons
  const back = document.getElementById('btn-back');
  const next = document.getElementById('btn-next');
  back.style.display = n === 0 ? 'none' : '';

  if (n === steps.length - 1) {
    // Review step
    const inSession = kitSession.kits.length > 0;
    next.textContent = inSession ? '✓ Complete Kit' : '🛒  Add to Cart';
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
        alert('Added to cart! (Demo — this would add ' + (countAddons() + 1) + ' items to WooCommerce cart)');
      }
    };
  } else {
    next.textContent = 'Next: ' + steps[n + 1].name + ' →';
    next.className = 'btn-nav btn-next';
    next.onclick = nextStep;
  }

  // Render the current step
  steps[n].render();

  // Scroll to top of wizard (skip on initial load)
  if (wizardInitialized) {
    document.querySelector('.step-labels').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function nextStep() { goStep(currentStep + 1); }
function prevStep() { goStep(currentStep - 1); }

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

// Intercept clicks on product images — open lightbox instead of toggling selection
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
    pitch: 'The most popular two-way radio on the planet. Massive accessory ecosystem — batteries, antennas, cases, and chargers are widely available and affordable. If you already own UV-5Rs, everything is compatible.',
    solves: [],
    features: ['128 memory channels', 'Dual-band VHF/UHF', 'Huge accessory ecosystem', 'Most affordable option'],
    tags: ['budget', 'simple', 'compatible', 'compact']
  },
  {
    key: 'uv5r-mini', name: 'UV-5R Mini Essentials Kit', price: 39, id: 8438,
    img: S+'2025/12/1000009129-scaled.jpg',
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
      { key: 'low', icon: '💵', label: 'Economical', detail: 'A solid, reliable radio without the extras', tags: ['budget'] },
      { key: 'mid', icon: '💰', label: 'Mid-range', detail: 'More features and durability — the sweet spot for most people', tags: ['waterproof', 'gps', 'bluetooth', 'grow'] },
      { key: 'high', icon: '💎', label: 'The best of the best', detail: 'Maximum capability, no compromises', tags: ['encryption', 'digital', 'premium', 'crossband'] },
    ]
  },
  {
    id: 'use',
    question: "Where will you use it most?",
    sub: "Pick the one that fits best.",
    multi: false,
    options: [
      { key: 'general', icon: '🏘️', label: 'Around town / neighborhood', detail: 'Family, neighborhood, or local communication', tags: ['budget', 'simple'] },
      { key: 'outdoor', icon: '🏕️', label: 'Outdoors — hiking, camping, overlanding', detail: 'Trail, campsite, or off-road use', tags: ['gps', 'grow', 'waterproof'] },
      { key: 'water', icon: '🚤', label: 'On or near water', detail: 'Kayaking, boating, beach, or wet environments', tags: ['waterproof'] },
      { key: 'professional', icon: '🏗️', label: 'Work / commercial / business use', detail: 'Worksite, security, event coordination, business ops', tags: ['professional', 'commercial', 'waterproof', 'gps'] },
      { key: 'emergency', icon: '🆘', label: 'Emergency preparedness', detail: 'Disaster readiness, backup comms', tags: ['channels', 'durable'] },
    ]
  },
  {
    id: 'features',
    question: "What matters most to you?",
    sub: "Pick up to two. Skip if nothing stands out.",
    multi: true,
    options: [
      { key: 'price', icon: '🏷️', label: 'Lowest price', detail: 'Just get me on the air affordably', tags: ['budget'] },
      { key: 'waterproof', icon: '💧', label: 'Waterproof', detail: "It's going to get wet", tags: ['waterproof'] },
      { key: 'encryption', icon: '🔒', label: 'Privacy / encryption', detail: "I want the option for secure, encrypted communications", tags: ['encryption', 'digital'] },
      { key: 'channels', icon: '📊', label: 'Maximum channels / coverage', detail: 'I want lots of repeaters and memory slots', tags: ['channels'] },
      { key: 'airband', icon: '✈️', label: 'Listen to aircraft', detail: 'I want to monitor aviation frequencies', tags: ['airband'] },
      { key: 'bluetooth', icon: '🎧', label: 'Bluetooth headset', detail: 'Helmet comms, wireless earpiece, or hands-free operation', tags: ['bluetooth'] },
      { key: 'grow', icon: '📈', label: 'Room to grow', detail: "I'm new but want advanced features later", tags: ['grow'] },
      { key: 'noaa', icon: '🌦️', label: 'Automatic weather alerts', detail: 'Auto-notifies you of severe weather — all radios can tune NOAA manually', tags: ['noaa'] },
      { key: 'compact', icon: '📏', label: 'Small & lightweight', detail: 'I want the most compact, pocketable radio', tags: ['compact'] },
      { key: 'compatible', icon: '🔄', label: 'UV-5R compatible', detail: 'I already have UV-5Rs or their accessories', tags: ['compatible', 'budget'] },
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
    return `
      <div class="iq-option ${isSelected ? 'selected' : ''}" onclick="answerInterview('${q.id}','${o.key}',${q.multi})">
        <div class="iq-icon">${o.icon}</div>
        <div class="iq-body">
          <div class="iq-label">${o.label}</div>
          <div class="iq-detail">${o.detail}</div>
        </div>
        <div class="oc-check">${isSelected ? '✓' : ''}</div>
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
    else if (!q.maxSelect || arr.length < q.maxSelect) arr.push(optKey);
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
  if (a.budget === 'low' && radio.tags.includes('budget')) reasons.push('Economical and reliable — gets you on the air without the extras');
  if (a.budget === 'mid' && radio.tags.includes('grow')) reasons.push('Great mid-range option — solid features with room to grow');
  if (a.budget === 'high' && radio.tags.includes('premium')) reasons.push('Top-tier — maximum capability with no compromises');

  // Use case match
  if (a.use === 'water' && radio.tags.includes('waterproof')) reasons.push('IP67 waterproof — fully submersible for the wet environments you described');
  if (a.use === 'water' && !radio.tags.includes('waterproof') && radio.tags.includes('water-resistant')) reasons.push('IP54 water resistant — handles rain and splashes');
  if (a.use === 'outdoor' && radio.tags.includes('gps')) reasons.push('GPS & APRS — perfect for the outdoor use you mentioned');
  if (a.use === 'professional' && radio.tags.includes('commercial')) reasons.push('FCC Part 90 commercial certified — approved for business and commercial use');
  if (a.use === 'professional' && radio.tags.includes('professional') && !radio.tags.includes('commercial')) reasons.push('Feature-rich and reliable for professional use');
  if (a.use === 'general' && radio.tags.includes('budget')) reasons.push('Simple and reliable — great for everyday neighborhood use');
  if (a.use === 'emergency' && radio.tags.includes('channels')) reasons.push('Lots of channels — covers more repeaters for emergency readiness');

  // Feature matches
  if (a.features) {
    if (a.features.includes('waterproof') && radio.tags.includes('waterproof')) reasons.push('IP67 waterproof — fully submersible for the conditions you need');
    if (a.features.includes('waterproof') && !radio.tags.includes('waterproof') && radio.tags.includes('water-resistant')) reasons.push('IP54 water resistant — rated for rain and splashes');
    if (a.features.includes('encryption') && radio.tags.includes('encryption')) reasons.push('Encryption capable — supports private, encrypted communications');
    if (a.features.includes('airband') && radio.tags.includes('airband')) reasons.push('Airband receive — listen to aircraft like you wanted');
    if (a.features.includes('bluetooth') && radio.tags.includes('bluetooth')) reasons.push('Bluetooth headset support — pairs with helmet comms, earpieces, or wireless PTT');
    if (a.features.includes('channels') && radio.tags.includes('channels')) reasons.push('Extra memory channels for the wide coverage area you need');
    if (a.features.includes('grow') && radio.tags.includes('grow')) reasons.push('Room to grow — simple now, with advanced features when you\'re ready');
    if (a.features.includes('noaa') && radio.tags.includes('noaa')) reasons.push('Automatic NOAA weather alerts — get warned before severe weather hits');
    if (a.features.includes('noaa') && !radio.tags.includes('noaa')) reasons.push('Can tune NOAA frequencies manually, but lacks automatic weather alerts');
    if (a.features.includes('compact') && radio.tags.includes('compact')) reasons.push('Compact and lightweight — easy to pocket or pack');
    if (a.features.includes('compatible') && radio.tags.includes('compatible')) reasons.push('UV-5R compatible — works with your existing batteries, chargers, and accessories');
    if (a.features.includes('price') && radio.tags.includes('budget')) reasons.push('Most affordable option — best value for getting on the air');
  }

  // Deduplicate similar reasons
  return [...new Set(reasons)].slice(0, 4);
}

function showInterviewResults() {
  // Score each radio based on tag matches
  const scores = {};
  radioLineup.forEach(r => { scores[r.key] = 0; });

  // Track water-related needs: explicit (water use / waterproof feature) vs indirect (outdoors)
  let waterExplicit = false; // "On or near water" or "Waterproof" feature checkbox
  let waterIndirect = false; // Outdoors — rain likely but not primary concern

  interviewQuestions.forEach(q => {
    const answer = interviewAnswers[q.id];
    if (!answer) return;
    const keys = Array.isArray(answer) ? answer : [answer];
    keys.forEach(k => {
      const opt = q.options.find(o => o.key === k);
      if (!opt) return;
      // Explicit: water use or waterproof feature selection
      if (opt.key === 'water' || opt.key === 'waterproof') waterExplicit = true;
      // Indirect: outdoors implies weather exposure
      else if (opt.key === 'outdoor' && opt.tags.includes('waterproof')) waterIndirect = true;
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
        <button class="rc-btn" onclick="selectRadio('${radio.key}')" ${!isPrimary ? 'style="background:var(--card);color:var(--text);border:1px solid var(--border)"' : ''}>Build This Kit →</button>
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
    // User wants waterproof but radio has no water protection at all
    check: (answers, radio) => {
      const wantsWater = answers.use === 'water' || (answers.features && answers.features.includes('waterproof'));
      const hasWaterProtection = radio.tags.includes('waterproof') || radio.tags.includes('water-resistant');
      return wantsWater && !hasWaterProtection;
    },
    warning: "has no water resistance rating",
    need: "you mentioned water use or waterproofing is important to you",
    suggestTags: ['waterproof', 'water-resistant'],
  },
  {
    // User wants encryption but radio doesn't have it
    check: (answers, radio) => {
      const wantsEncryption = answers.features && answers.features.includes('encryption');
      const hasEncryption = radio.tags.includes('encryption');
      return wantsEncryption && !hasEncryption;
    },
    warning: "does not have encryption capability — only DMR radios support encrypted communications",
    need: "you mentioned privacy or encryption is important",
    suggestTags: ['encryption'],
  },
  {
    // User selected commercial/business use but picked a consumer-grade radio
    check: (answers, radio) => {
      const wantsPro = answers.use === 'professional';
      const isPro = radio.tags.includes('professional');
      return wantsPro && !isPro;
    },
    warning: "is a great radio for personal use, but may not hold up to the demands of commercial or business use",
    need: "you mentioned this is for work or business",
    suggestTags: ['professional'],
  },
  {
    // User wants airband but radio doesn't have it
    check: (answers, radio) => {
      const wantsAirband = answers.features && answers.features.includes('airband');
      const hasAirband = radio.tags.includes('airband');
      return wantsAirband && !hasAirband;
    },
    warning: "cannot receive aircraft/aviation frequencies",
    need: "you said listening to aircraft is important",
    suggestTags: ['airband'],
  },
  {
    // User wants Bluetooth/app control but radio doesn't have it
    check: (answers, radio) => {
      const wantsBT = answers.features && answers.features.includes('bluetooth');
      const hasBT = radio.tags.includes('bluetooth');
      return wantsBT && !hasBT;
    },
    warning: "does not support Bluetooth headsets",
    need: "you mentioned Bluetooth headset connectivity is important",
    suggestTags: ['bluetooth'],
  },
  {
    // User wants max channels but picked a low-channel radio
    check: (answers, radio) => {
      const wantsChannels = answers.features && answers.features.includes('channels');
      const hasChannels = radio.tags.includes('channels');
      return wantsChannels && !hasChannels;
    },
    warning: "has limited memory channels compared to other options",
    need: "you said maximum channels/coverage is important",
    suggestTags: ['channels'],
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
      // Find the best alternative — never suggest a cheaper/lesser radio (no downgrade suggestions)
      const alt = radioLineup.find(r => r.key !== key && r.price >= radio.price && rule.suggestTags.some(t => r.tags.includes(t)));
      // Only warn if we can suggest an upgrade — don't discourage a choice with no better option
      if (alt) return { radio, rule, alt };
    }
  }
  return null;
}

function selectRadio(key) {
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
        Switch to ${altName} — $${m.alt.price}
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
  if (!radio) return;
  pendingRadioKey = null;
  selectedRadioKey = key;
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
      desc: 'The go-to starter radio kit. Everything you need to get on the air — pre-programmed and ready to use out of the box. Customize your kit below with antenna upgrades and accessories.',
      items: ['Baofeng UV-5R radio (pre-programmed)', 'Factory antenna, battery, belt clip', 'Charging cradle', 'RME Quick Start Guide']
    },
    'uv5r-mini': {
      desc: 'The most affordable kit we offer — 999 channels, USB-C charging, and airband receive in the smallest package. Pre-programmed and ready to go.',
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
      desc: 'The full-featured flagship — dual receivers, crossband repeat, airband, encryption capable, and 4000 channels. Everything the serious operator needs.',
      items: ['AnyTone DA-7X2 radio (pre-programmed)', 'Factory antenna, USB-C battery, belt clip', 'USB-C charging cable', 'USB programming cable', 'RME Quick Start Guide']
    },
  };

  const info = radioIncludes[key] || radioIncludes['uv5r'];

  // Update hero with selected radio
  document.querySelector('.hero-img img').src = radio.img;
  document.querySelector('.hero-info h1').textContent = radio.name;
  document.querySelector('.hero-info .base-price').textContent = '$' + radio.price + '.00';
  document.querySelector('.hero-info .desc').textContent = info.desc;
  document.querySelector('.hero-info .includes ul').innerHTML = info.items.map(i => `<li>${i}</li>`).join('');

  // Rebuild step UI (color step appears for UV-PRO)
  rebuildStepUI();

  // Hide selector, show wizard
  document.getElementById('selector-phase').style.display = 'none';
  document.getElementById('wizard-phase').style.display = 'block';
  document.querySelector('.bottom-bar').style.display = '';

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Init ────────────────────────────────────────────
let wizardInitialized = false;
// Hide bottom bar initially (selector phase)
document.querySelector('.bottom-bar').style.display = 'none';
goStep(0);
wizardInitialized = true;


// ── WooCommerce Cart Integration ──
function rmeKbAddToCart(items) {
  if (typeof rmeKitBuilder === 'undefined' || !rmeKitBuilder.ajaxUrl) {
    alert('WooCommerce integration not available. Items collected: ' + items.length);
    return Promise.resolve();
  }
  
  return fetch(rmeKitBuilder.ajaxUrl + '?action=rme_kb_add_to_cart&nonce=' + rmeKitBuilder.nonce, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      const count = data.data.added.length;
      const errors = data.data.errors;
      if (errors.length > 0) {
        alert('Added ' + count + ' items to cart. Some items had issues: ' + errors.join(', '));
      } else {
        // Redirect to cart
        window.location.href = data.data.cartUrl || rmeKitBuilder.cartUrl;
      }
    } else {
      alert('Error adding to cart: ' + (data.data ? data.data.message : 'Unknown error'));
    }
  })
  .catch(err => {
    alert('Error adding to cart. Please try again.');
    console.error('RME KB cart error:', err);
  });
}

// ── Product Page Mode ──
// If loaded on a WC product page with rmeKitBuilder.productPageMode = true,
// auto-select the radio and jump straight to the wizard
if (typeof rmeKitBuilder !== 'undefined' && rmeKitBuilder.productPageMode && rmeKitBuilder.productRadioKey) {
  document.addEventListener('DOMContentLoaded', function() {
    // Hide needs phase, show wizard directly
    const needsPhase = document.getElementById('needs-phase');
    const selectorPhase = document.getElementById('selector-phase');
    if (needsPhase) needsPhase.style.display = 'none';
    if (selectorPhase) selectorPhase.style.display = 'none';
    
    // Start with the specified radio
    if (typeof confirmRadioSelection === 'function') {
      confirmRadioSelection(rmeKitBuilder.productRadioKey);
    }
  });
}

})(); // end IIFE
