/**
 * RME Kit Builder V2 - Full Audit
 * Tests all category flows: handheld, vehicle, base, HF, scanner
 * Tests both guided and direct paths
 * Validates: section transitions, product rendering, review, cart, edit, back navigation
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const OUTDIR = path.join(__dirname, 'audit-screenshots');
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const PASS = '  [PASS]';
const FAIL = '  [FAIL]';
const INFO = '  [INFO]';
let failures = [];
let passes = 0;

function check(label, condition, detail) {
  if (condition) { console.log(PASS, label); passes++; }
  else { console.log(FAIL, label, detail || ''); failures.push(label + (detail ? ': ' + detail : '')); }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Get section state from DOM classes (sectionState is inside IIFE closure)
async function getState(page, section) {
  return page.evaluate((sec) => {
    const el = document.getElementById('sec-' + sec);
    if (!el) return 'missing';
    if (el.classList.contains('kb-section--complete')) return 'complete';
    if (el.classList.contains('kb-section--active')) return 'active';
    if (el.classList.contains('kb-section--loading')) return 'loading';
    if (el.classList.contains('kb-section--locked')) return 'locked';
    return 'unknown';
  }, section);
}

async function shot(page, name) {
  await sleep(400);
  await page.screenshot({ path: path.join(OUTDIR, name + '.png'), fullPage: true });
}

async function freshPage(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport || { width: 1280, height: 900 });
  page.on('pageerror', err => console.log('  [PAGE ERROR]', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [CONSOLE ERROR]', msg.text());
  });
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);
  return page;
}

// Skip email and advance to interview
async function skipEmail(page) {
  await page.click('a.kb-skip-link');
  await sleep(3000);
}

// Start guided mode and answer budget + reach
async function guidedToSetup(page, budgetIdx, reachIdx) {
  await page.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Budget
  await page.evaluate((idx) => {
    document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[idx].click();
  }, budgetIdx);
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Reach
  await page.evaluate((idx) => {
    document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[idx].click();
  }, reachIdx);
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1200);
}

// Select a specific setup type (deselect all, select target)
async function selectSetupType(page, targetKey) {
  await page.evaluate((key) => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    // Deselect any pre-selected
    opts.forEach(o => { if (o.classList.contains('selected')) o.click(); });
    // Find and select target
    opts.forEach(o => {
      if (o.textContent.toLowerCase().includes(key === 'hf' ? 'hf' : key === 'vehicle' ? 'vehicle' : key === 'base' ? 'base' : key === 'scanner' ? 'scanner' : 'handheld')) {
        o.click();
      }
    });
  }, targetKey);
  await sleep(300);
}

// Continue through product sections (click Continue on each)
async function advanceThroughProducts(page) {
  for (const section of ['antennas', 'battery', 'accessories', 'programming']) {
    await sleep(2500);
    const btnExists = await page.evaluate((sec) => {
      const el = document.querySelector('#sec-' + sec + ' .kb-btn--primary');
      return el && !el.disabled;
    }, section);
    if (btnExists) {
      await page.evaluate((sec) => {
        document.querySelector('#sec-' + sec + ' .kb-btn--primary').click();
      }, section);
    } else {
      // Try kbsCompleteSection directly
      await page.evaluate((sec) => kbsCompleteSection(sec), section);
    }
  }
  await sleep(3000);
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  // ═══════════════════════════════════════════════
  // TEST 1: Handheld - Guided Flow (Desktop)
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 1: Handheld Guided Flow (Desktop) ===');
  {
    const page = await freshPage(browser);
    await skipEmail(page);

    // Verify section states
    check('Email section completed after skip', await getState(page, 'email') === 'complete');
    check('Interview section active after email', await getState(page, 'interview') === 'active');

    // Start guided
    await guidedToSetup(page, 1, 0); // mid budget, nearby reach

    // Q3: Setup - should have handheld pre-selected
    const preSelected = await page.evaluate(() => kbsAnswers['setup']);
    check('Handheld pre-selected for nearby reach', preSelected && preSelected.includes('handheld'));

    await page.evaluate(() => kbsNextQ());
    await sleep(1200);

    // Q4: Needs question should appear for handheld ("What do you need?")
    const hasNeedsQ = await page.evaluate(() => {
      const q = document.querySelector('.kbs-iq:not(.kbs-iq--answered) h3');
      return q && (q.textContent.includes('need') || q.textContent.includes('feature'));
    });
    check('Needs question appears for handheld', hasNeedsQ);

    // Pick a feature and proceed to results
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
      if (opts[0]) opts[0].click();
    });
    await sleep(300);
    await page.evaluate(() => kbsNextQ());
    await sleep(2000);

    // Should see recommendation cards
    const hasResults = await page.evaluate(() => !!document.querySelector('.result-card'));
    check('Recommendation cards visible', hasResults);

    // Select top radio
    await page.evaluate(() => {
      const btn = document.querySelector('.result-card.recommended .rc-btn');
      if (btn) btn.click();
    });
    await sleep(3500);

    // Radio section should be complete, antennas active
    check('Radio section completed after selection', await getState(page, 'radio') === 'complete');
    check('Antennas section active after radio', await getState(page, 'antennas') === 'active');

    // Price bar visible
    const priceBarVisible = await page.evaluate(() => {
      const bar = document.getElementById('kb-scroll-price-bar');
      return bar && bar.style.display !== 'none';
    });
    check('Price bar visible after radio selection', priceBarVisible);

    // Select an antenna upgrade
    await page.evaluate(() => {
      const card = document.querySelector('#antenna-options .opt-card');
      if (card) card.click();
    });
    await sleep(500);
    const antennaSelected = await page.evaluate(() => {
      const cards = document.querySelectorAll('#antenna-options .opt-card.selected');
      return cards.length > 0;
    });
    check('Antenna selection works', antennaSelected);

    // Advance through remaining sections
    await advanceThroughProducts(page);

    // Review should be active
    check('Review section active after all products', await getState(page, 'review') === 'active');

    // Cart button should be enabled
    const cartEnabled = await page.evaluate(() => {
      const btn = document.getElementById('kbs-cart-btn');
      return btn && !btn.disabled;
    });
    check('Cart button enabled on review', cartEnabled);

    // Review list should have items
    const reviewItems = await page.evaluate(() => document.querySelectorAll('#review-list .review-item').length);
    check('Review has items', reviewItems > 0, 'found ' + reviewItems + ' items');

    await shot(page, 'test1-handheld-review');
    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 2: Vehicle/Mobile - Direct Flow
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 2: Vehicle/Mobile Direct Flow ===');
  {
    const page = await freshPage(browser);
    await skipEmail(page);

    // Direct pick
    await page.evaluate(() => kbsStartDirect());
    await sleep(800);

    // Select vehicle category
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      opts.forEach(o => { if (o.textContent.includes('Vehicle')) o.click(); });
    });
    await sleep(300);

    const directBtn = await page.evaluate(() => {
      const btn = document.getElementById('kbs-direct-next');
      return btn && !btn.disabled;
    });
    check('Direct Next enabled after category selection', directBtn);

    await page.evaluate(() => kbsDirectProceed());
    await sleep(3000);

    // Radio section should be active with mobile lineup
    const category = await page.evaluate(() => kbsDetectCategory());
    check('Category detected as mobile', category === 'mobile');

    check('Radio section active for vehicle', await getState(page, 'radio') === 'active');

    // Select first radio
    await page.evaluate(() => {
      const pick = document.querySelector('#kbs-radio-grid .radio-pick');
      if (pick) pick.click();
    });
    await sleep(4000);

    // Antennas should show mobile products (mounts + vehicle antennas)
    check('Antennas active after vehicle radio selection', await getState(page, 'antennas') === 'active');

    const hasAntennaOptions = await page.evaluate(() => {
      const opts = document.querySelectorAll('#antenna-options .opt-card');
      return opts.length;
    });
    check('Mobile antenna options rendered', hasAntennaOptions > 0, 'found ' + hasAntennaOptions + ' options');

    // Section heading should say "Antenna & Mount"
    const antennaHeading = await page.evaluate(() => {
      const h = document.querySelector('#sec-antennas .kb-section__header h2');
      return h ? h.textContent : '';
    });
    check('Antenna heading adapted for mobile', antennaHeading.includes('Mount'), 'got: ' + antennaHeading);

    // Advance through all sections
    await advanceThroughProducts(page);

    // Review should use non-handheld renderer
    check('Review section active for vehicle', await getState(page, 'review') === 'active');

    const reviewItems = await page.evaluate(() => document.querySelectorAll('#review-list .review-item').length);
    check('Vehicle review has items', reviewItems > 0, 'found ' + reviewItems + ' items');

    // Review total should be visible
    const hasTotal = await page.evaluate(() => !!document.querySelector('#review-list .review-total'));
    check('Vehicle review has total', hasTotal);

    await shot(page, 'test2-vehicle-review');

    // Test edit section: go back to antennas
    await page.evaluate(() => kbsEditSection('antennas'));
    await sleep(2000);
    check('Edit antennas reopens section', await getState(page, 'antennas') === 'active');

    // Verify mobile products re-rendered (not handheld)
    const hasAntennaAfterEdit = await page.evaluate(() => {
      const opts = document.querySelectorAll('#antenna-options .opt-card');
      return opts.length;
    });
    check('Mobile antennas re-rendered after edit', hasAntennaAfterEdit > 0, 'found ' + hasAntennaAfterEdit);

    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 3: Base Station - Guided Flow
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 3: Base Station Guided Flow ===');
  {
    const page = await freshPage(browser);
    await skipEmail(page);
    await guidedToSetup(page, 0, 1); // low budget, local reach

    // Select base station
    await selectSetupType(page, 'base');
    await sleep(300);
    await page.evaluate(() => kbsNextQ());
    await sleep(2000);

    // Should show base results (no feature questions for non-handheld)
    const category = await page.evaluate(() => kbsDetectCategory());
    check('Base category detected', category === 'base');

    const hasResults = await page.evaluate(() => !!document.querySelector('.result-card'));
    check('Base station results shown', hasResults);
    await shot(page, 'test3-base-results');

    // Select first radio
    await page.evaluate(() => {
      const btn = document.querySelector('.result-card .rc-btn');
      if (btn) btn.click();
    });
    await sleep(4000);

    const antennaHeading = await page.evaluate(() => {
      const h = document.querySelector('#sec-antennas .kb-section__header h2');
      return h ? h.textContent : '';
    });
    check('Base antenna heading adapted', antennaHeading.includes('Antenna Setup') || antennaHeading.includes('Antenna'), 'got: ' + antennaHeading);

    // Advance and check review
    await advanceThroughProducts(page);
    const reviewItems = await page.evaluate(() => document.querySelectorAll('#review-list .review-item').length);
    check('Base review has items', reviewItems > 0, 'found ' + reviewItems);

    await shot(page, 'test3-base-review');
    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 4: HF - Guided Flow (far reach)
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 4: HF Guided Flow ===');
  {
    const page = await freshPage(browser);
    await skipEmail(page);
    await guidedToSetup(page, 1, 2); // mid budget, far reach

    // Q3: Should have HF pre-selected (fixed bug)
    const preSelected = await page.evaluate(() => kbsAnswers['setup']);
    check('HF pre-selected for far reach', preSelected && preSelected.includes('hf'), 'got: ' + JSON.stringify(preSelected));
    await shot(page, 'test4-hf-preselected');

    // Accept and proceed
    await page.evaluate(() => kbsNextQ());
    await sleep(2000);

    const category = await page.evaluate(() => kbsDetectCategory());
    check('HF category detected', category === 'hf');

    const hasResults = await page.evaluate(() => !!document.querySelector('.result-card'));
    check('HF results shown', hasResults);

    // Select first radio
    await page.evaluate(() => {
      const btn = document.querySelector('.result-card .rc-btn');
      if (btn) btn.click();
    });
    await sleep(4000);

    // HF antennas should render
    const hasAntennaOptions = await page.evaluate(() => {
      const opts = document.querySelectorAll('#antenna-options .opt-card');
      return opts.length;
    });
    check('HF antenna options rendered', hasAntennaOptions > 0, 'found ' + hasAntennaOptions);

    await advanceThroughProducts(page);
    const reviewItems = await page.evaluate(() => document.querySelectorAll('#review-list .review-item').length);
    check('HF review has items', reviewItems > 0, 'found ' + reviewItems);

    await shot(page, 'test4-hf-review');
    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 5: Scanner - Direct Flow
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 5: Scanner Direct Flow ===');
  {
    const page = await freshPage(browser);
    await skipEmail(page);
    await page.evaluate(() => kbsStartDirect());
    await sleep(800);

    // Select scanner
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      opts.forEach(o => { if (o.textContent.includes('Scanner')) o.click(); });
    });
    await sleep(300);
    await page.evaluate(() => kbsDirectProceed());
    await sleep(3000);

    const category = await page.evaluate(() => kbsDetectCategory());
    check('Scanner category detected', category === 'scanner');

    // Select first scanner
    await page.evaluate(() => {
      const pick = document.querySelector('#kbs-radio-grid .radio-pick');
      if (pick) pick.click();
    });
    await sleep(4000);

    // Antennas should show scanner antennas
    const hasAntennaOptions = await page.evaluate(() => {
      const opts = document.querySelectorAll('#antenna-options .opt-card');
      return opts.length;
    });
    check('Scanner antenna options rendered', hasAntennaOptions > 0, 'found ' + hasAntennaOptions);

    // Advance to battery - should show message (not duplicate accessories)
    await page.evaluate(() => kbsCompleteSection('antennas'));
    await sleep(3000);

    const batteryContent = await page.evaluate(() => {
      const el = document.getElementById('battery-options');
      return el ? el.textContent : '';
    });
    check('Scanner battery shows power message (not accessories)', batteryContent.includes('power') || batteryContent.includes('No additional'), 'got: ' + batteryContent.trim().substring(0, 60));

    // Advance through rest
    await page.evaluate(() => kbsCompleteSection('battery'));
    await sleep(3000);

    // Accessories should show scanner accessories
    const accOptions = await page.evaluate(() => {
      const opts = document.querySelectorAll('#accessory-options .opt-card');
      return opts.length;
    });
    check('Scanner accessories rendered', accOptions > 0, 'found ' + accOptions);

    await page.evaluate(() => kbsCompleteSection('accessories'));
    await sleep(3000);
    await page.evaluate(() => kbsCompleteSection('programming'));
    await sleep(3000);

    const reviewItems = await page.evaluate(() => document.querySelectorAll('#review-list .review-item').length);
    check('Scanner review has items', reviewItems > 0, 'found ' + reviewItems);

    await shot(page, 'test5-scanner-review');
    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 6: Email Validation
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 6: Email Validation ===');
  {
    const page = await freshPage(browser);

    // Try invalid email
    await page.type('#kbs-lead-email', 'notanemail');
    await page.click('.kb-email-form .kb-btn--primary');
    await sleep(500);
    const emailState = await page.evaluate(() => {
      const el = document.getElementById('sec-email');
      if (el.classList.contains('complete') || el.classList.contains('kb-section--complete')) return 'complete';
      if (el.classList.contains('active') || el.classList.contains('kb-section--active')) return 'active';
      return 'locked';
    });
    check('Invalid email rejected (no @)', emailState === 'active');

    // Try another invalid
    await page.evaluate(() => { document.getElementById('kbs-lead-email').value = ''; });
    await page.type('#kbs-lead-email', 'a@b');
    await page.click('.kb-email-form .kb-btn--primary');
    await sleep(500);
    check('Invalid email rejected (no TLD)', await getState(page, 'email') === 'active');

    // Valid email
    await page.evaluate(() => { document.getElementById('kbs-lead-email').value = ''; });
    await page.type('#kbs-lead-email', 'test@example.com');
    await page.click('.kb-email-form .kb-btn--primary');
    await sleep(3000);
    check('Valid email accepted', await getState(page, 'email') === 'complete');

    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 7: Mobile Viewport
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 7: Mobile Viewport ===');
  {
    const page = await freshPage(browser, { width: 375, height: 812 });
    await skipEmail(page);
    await page.evaluate(() => kbsStartDirect());
    await sleep(800);

    // Check interview options are full width on mobile
    const optWidth = await page.evaluate(() => {
      const opt = document.querySelector('.kbs-iq-opt');
      return opt ? opt.getBoundingClientRect().width : 0;
    });
    check('Interview options reasonable width on mobile', optWidth > 200, 'width: ' + optWidth);

    // Select handheld, proceed
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      opts.forEach(o => { if (o.textContent.includes('Handheld')) o.click(); });
    });
    await sleep(300);
    await page.evaluate(() => kbsDirectProceed());
    await sleep(3000);

    // Select first radio
    await page.evaluate(() => {
      const pick = document.querySelector('#kbs-radio-grid .radio-pick');
      if (pick) pick.click();
    });
    await sleep(4000);

    // Price bar should be visible
    const priceBar = await page.evaluate(() => {
      const bar = document.getElementById('kb-scroll-price-bar');
      return bar && bar.style.display !== 'none';
    });
    check('Price bar visible on mobile', priceBar);

    // Active section should use top border (not left)
    const borderStyle = await page.evaluate(() => {
      const active = document.querySelector('.kb-section--active');
      return active ? getComputedStyle(active).borderTopWidth : '0';
    });
    check('Active section uses top border on mobile', borderStyle === '3px', 'got: ' + borderStyle);

    await shot(page, 'test7-mobile-antennas');
    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 8: Accessibility Attributes
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 8: Accessibility ===');
  {
    const page = await freshPage(browser);

    // Check ARIA attributes on sections
    const emailAria = await page.evaluate(() => {
      const el = document.getElementById('sec-email');
      return {
        role: el.getAttribute('role'),
        expanded: el.getAttribute('aria-expanded'),
        label: el.getAttribute('aria-label')
      };
    });
    check('Email section has role=region', emailAria.role === 'region');
    check('Email section has aria-expanded=true', emailAria.expanded === 'true');
    check('Email section has aria-label', !!emailAria.label);

    const interviewAria = await page.evaluate(() => {
      const el = document.getElementById('sec-interview');
      return {
        expanded: el.getAttribute('aria-expanded'),
        disabled: el.getAttribute('aria-disabled')
      };
    });
    check('Locked section has aria-expanded=false', interviewAria.expanded === 'false');
    check('Locked section has aria-disabled=true', interviewAria.disabled === 'true');

    // Skip email and check state text labels
    await skipEmail(page);
    const doneLabel = await page.evaluate(() => {
      const el = document.querySelector('.kb-section--complete .kb-section__header');
      return el ? getComputedStyle(el, '::after').content : '';
    });
    check('Completed section has (done) label', doneLabel.includes('done'), 'got: ' + doneLabel);

    await page.close();
  }

  // ═══════════════════════════════════════════════
  // TEST 9: Back Navigation
  // ═══════════════════════════════════════════════
  console.log('\n=== TEST 9: Back Navigation ===');
  {
    const page = await freshPage(browser);
    await skipEmail(page);
    await page.evaluate(() => kbsStartDirect());
    await sleep(800);
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      opts.forEach(o => { if (o.textContent.includes('Handheld')) o.click(); });
    });
    await sleep(300);
    await page.evaluate(() => kbsDirectProceed());
    await sleep(3000);

    // Select a radio
    await page.evaluate(() => {
      const pick = document.querySelector('#kbs-radio-grid .radio-pick');
      if (pick) pick.click();
    });
    await sleep(4000);

    // Now on antennas - press back
    await page.evaluate(() => kbsGoBack('antennas'));
    await sleep(2000);

    check('Back from antennas reopens radio', await getState(page, 'radio') === 'active');
    check('Antennas locked after going back', await getState(page, 'antennas') === 'locked');

    await page.close();
  }

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log('\n' + '='.repeat(50));
  console.log('AUDIT RESULTS: ' + passes + ' passed, ' + failures.length + ' failed');
  console.log('='.repeat(50));
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  - ' + f));
  }

  await browser.close();
  process.exit(failures.length > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
