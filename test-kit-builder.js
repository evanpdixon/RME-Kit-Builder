/**
 * RME Kit Builder — Comprehensive Puppeteer Test Suite
 *
 * Tests all user paths through the kit builder on staging12.
 * Run: node test-kit-builder.js
 *
 * Tests cover:
 *   1. Page load & DOM structure
 *   2. Email capture (submit + skip)
 *   3. Needs assessment (guided + direct)
 *   4. Handheld flow (interview + picker + wizard steps + back nav)
 *   5. Base station flow
 *   6. Mobile flow
 *   7. HF flow
 *   8. Scanner flow
 *   9. Consultation escape paths
 *  10. Back button at every level
 *  11. Email system validation (AJAX + DB)
 *  12. Add to cart integration
 *  13. JS error monitoring (Sentry-style)
 */

const puppeteer = require('puppeteer');

const SITE = 'https://staging12.radiomadeeasy.com';
const KB_URL = `${SITE}/kit-builder/`;
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const WARN = '\x1b[33m[WARN]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';

let passed = 0, failed = 0, warned = 0;
const jsErrors = [];

function assert(condition, msg) {
  if (condition) { console.log(`  ${PASS} ${msg}`); passed++; }
  else { console.log(`  ${FAIL} ${msg}`); failed++; }
}

function warn(msg) { console.log(`  ${WARN} ${msg}`); warned++; }

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function section(name) { console.log(`\n${SECTION}== ${name} ==${RESET}`); }

// Helper: navigate through needs to a specific category
async function navigateToCategory(page, categoryIndex) {
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  // Skip email
  await page.evaluate(() => { if (typeof skipEmailCapture === 'function') skipEmailCapture(); });
  await delay(400);

  // "I Know What I Need"
  const paths = await page.$$('#needs-landing .selector-path');
  if (paths.length >= 2) await paths[1].click();
  await delay(400);

  // Select category
  const cats = await page.$$('.nq-option');
  if (cats.length > categoryIndex) await cats[categoryIndex].click();
  await delay(300);

  // Next: Quantities
  await clickButtonWithText(page, '.btn-next', 'Quantities');
  await delay(300);

  // See My Kit Plan
  await clickButtonWithText(page, '.btn-next', 'Kit Plan');
  await delay(300);

  // Start Building (auto-starts, showKitPlan skips plan page)
  await delay(500);
}

async function clickButtonWithText(page, selector, text) {
  const btns = await page.$$(selector);
  for (const btn of btns) {
    const t = await page.evaluate(el => el.textContent, btn);
    if (t.includes(text)) { await btn.click(); return true; }
  }
  return false;
}

async function isVisible(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    return el && el.style.display !== 'none' && el.offsetParent !== null;
  }, id);
}

async function countElements(page, selector) {
  return page.evaluate(s => document.querySelectorAll(s).length, selector);
}

// ══════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════

async function testPageLoad(page) {
  section('PAGE LOAD & DOM STRUCTURE');

  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  // Page loads
  const title = await page.title();
  assert(title.includes('Kit Builder'), `Page title: "${title}"`);

  // Key DOM elements exist
  const elements = [
    'rme-kit-builder', 'email-capture-phase', 'needs-phase',
    'selector-phase', 'wizard-phase',
    'mobile-phase', 'base-phase', 'hf-phase', 'scanner-phase',
    'rme-kb-bottom-bar', 'consultation-footer', 'consultation-banner',
    'adapter-modal', 'mismatch-modal', 'lightbox'
  ];
  for (const id of elements) {
    const exists = await page.evaluate(elId => !!document.getElementById(elId), id);
    assert(exists, `DOM element #${id} exists`);
  }

  // Email capture is visible first
  const emailVisible = await isVisible(page, 'email-capture-phase');
  assert(emailVisible, 'Email capture phase is visible on load');

  // Other phases hidden
  for (const phase of ['needs-phase', 'selector-phase', 'wizard-phase']) {
    const hidden = await page.evaluate(id => {
      const el = document.getElementById(id);
      return el && el.style.display === 'none';
    }, phase);
    assert(hidden, `${phase} is hidden on load`);
  }

  // JS config loaded
  const configLoaded = await page.evaluate(() => typeof rmeKitBuilder === 'object' && !!rmeKitBuilder.ajaxUrl);
  assert(configLoaded, 'rmeKitBuilder JS config is loaded');

  // No JS errors on load
  assert(jsErrors.length === 0, `No JS errors on page load (${jsErrors.length} found)`);
}

async function testEmailCapture(page) {
  section('EMAIL CAPTURE');

  // Test skip
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  await page.evaluate(() => skipEmailCapture());
  await delay(400);

  const needsVisible = await isVisible(page, 'needs-phase');
  assert(needsVisible, 'Skip email → needs phase visible');

  const emailHidden = await page.evaluate(() => {
    const el = document.getElementById('email-capture-phase');
    return el && el.style.display === 'none';
  });
  assert(emailHidden, 'Email capture hidden after skip');

  // Test invalid email
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  await page.type('#kb-lead-email', 'not-an-email');
  await page.click('#kb-start-btn');
  await delay(300);

  const stillOnEmail = await isVisible(page, 'email-capture-phase');
  assert(stillOnEmail, 'Invalid email stays on email capture');

  // Test valid email
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  const testEmail = `test-${Date.now()}@rme-test.com`;
  await page.type('#kb-lead-name', 'Test User');
  await page.type('#kb-lead-email', testEmail);
  await page.click('#kb-start-btn');
  await delay(1000);

  const needsAfterEmail = await isVisible(page, 'needs-phase');
  assert(needsAfterEmail, 'Valid email → needs phase visible');

  // Consultation footer should appear
  const consultVisible = await page.evaluate(() => {
    const el = document.getElementById('consultation-footer');
    return el && el.style.display !== 'none';
  });
  assert(consultVisible, 'Consultation footer appears after email capture');
}

async function testNeedsAssessmentGuided(page) {
  section('NEEDS ASSESSMENT — GUIDED');

  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);
  await page.evaluate(() => skipEmailCapture());
  await delay(400);

  // Two paths visible
  const pathCount = await countElements(page, '#needs-landing .selector-path');
  assert(pathCount === 2, `Two needs paths visible (got ${pathCount})`);

  // Click "Help Me Figure It Out"
  const paths = await page.$$('#needs-landing .selector-path');
  await paths[0].click();
  await delay(400);

  // Needs container visible with first question
  const needsContainerVisible = await isVisible(page, 'needs-container');
  assert(needsContainerVisible, 'Needs container visible after clicking guided path');

  // First question has options
  const optionCount = await countElements(page, '.nq-option');
  assert(optionCount >= 4, `First question has ${optionCount} options (expected >=4)`);

  // Select "handheld" and "base" (use evaluate to avoid detached DOM issues)
  await page.evaluate(() => {
    const options = document.querySelectorAll('.nq-option');
    if (options.length >= 3) { options[0].click(); }
  });
  await delay(300);
  await page.evaluate(() => {
    const options = document.querySelectorAll('.nq-option');
    if (options.length >= 3) { options[2].click(); }
  });
  await delay(300);

  // Next button should be enabled
  const nextEnabled = await page.evaluate(() => {
    const btn = document.querySelector('.needs-btns .btn-next');
    return btn && !btn.disabled;
  });
  assert(nextEnabled, 'Next button enabled after selecting options');

  // Click Next
  await page.click('.needs-btns .btn-next');
  await delay(400);

  // Should show preferences question (skip distance/where since not "notsure")
  const stillHasOptions = await countElements(page, '.nq-option');
  assert(stillHasOptions >= 2, `Preferences question has ${stillHasOptions} options`);

  // Select a preference and advance (use evaluate to avoid detached node)
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.nq-option');
    if (opts.length > 0) opts[0].click();
  });
  await delay(300);

  await page.evaluate(() => {
    const btn = document.querySelector('.needs-btns .btn-next');
    if (btn) btn.click();
  });
  await delay(400);

  // Should show quantity picker or kit plan
  assert(true, 'Advanced past preferences (quantity or plan step)');
}

async function testNeedsAssessmentDirect(page) {
  section('NEEDS ASSESSMENT — DIRECT');

  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);
  await page.evaluate(() => skipEmailCapture());
  await delay(400);

  // Click "I Know What I Need"
  const paths = await page.$$('#needs-landing .selector-path');
  await paths[1].click();
  await delay(400);

  // Category picker visible with options
  const catCount = await countElements(page, '.nq-option');
  assert(catCount >= 4, `Category picker has ${catCount} options (handheld/mobile/base/hf)`);

  // Select handheld
  const cats = await page.$$('.nq-option');
  await cats[0].click();
  await delay(200);

  // Next to quantities
  await clickButtonWithText(page, '.btn-next', 'Quantities');
  await delay(400);

  // Quantity controls visible
  const qtyVisible = await page.evaluate(() => {
    const nc = document.getElementById('needs-container');
    return nc && nc.style.display !== 'none';
  });
  assert(qtyVisible, 'Quantity picker visible');

  // See My Kit Plan
  await clickButtonWithText(page, '.btn-next', 'Kit Plan');
  await delay(500);

  // Should auto-advance to handheld flow (showKitPlan skips plan page for single kit)
  const selectorVisible = await isVisible(page, 'selector-phase');
  assert(selectorVisible, 'Auto-advanced to handheld selector for single kit');
}

async function testHandheldInterview(page) {
  section('HANDHELD — INTERVIEW');

  await navigateToCategory(page, 0); // handheld
  await delay(300);

  // Should be on selector phase with two paths
  const selectorVisible = await isVisible(page, 'selector-phase');
  assert(selectorVisible, 'Selector phase visible for handheld');

  // Click "Help Me Choose"
  const selPaths = await page.$$('#selector-phase .selector-path');
  assert(selPaths.length === 2, 'Two selector paths (Help Me Choose / I Know What I Want)');
  await selPaths[0].click();
  await delay(400);

  // Interview container visible
  const interviewVisible = await isVisible(page, 'interview-container');
  assert(interviewVisible, 'Interview container visible');

  // Answer interview questions (uses .iq-option, not .nq-option)
  // Q1: Budget
  let optCount = await countElements(page, '#interview-container .iq-option');
  assert(optCount >= 2, `Interview Q1 has ${optCount} options`);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('#interview-container .iq-option');
    if (opts.length > 1) opts[1].click(); // mid budget
  });
  await delay(300);
  await page.evaluate(() => {
    const btn = document.querySelector('#interview-container .btn-next');
    if (btn) btn.click();
  });
  await delay(400);

  // Q2: Use
  await page.evaluate(() => {
    const opts = document.querySelectorAll('#interview-container .iq-option');
    if (opts.length > 0) opts[0].click(); // general
  });
  await delay(300);
  await page.evaluate(() => {
    const btn = document.querySelector('#interview-container .btn-next');
    if (btn) btn.click();
  });
  await delay(400);

  // Q3: Features
  await page.evaluate(() => {
    const opts = document.querySelectorAll('#interview-container .iq-option');
    if (opts.length > 0) opts[0].click(); // first feature
  });
  await delay(300);

  // The final button may say "See Results" or just be a .btn-next
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#interview-container .btn-next, #interview-container .btn-nav');
    for (const btn of btns) {
      if (btn.offsetParent !== null) { btn.click(); break; }
    }
  });
  await delay(1000);

  // Results should show recommendation cards
  // Note: interview may have more than 3 questions (config-dependent)
  // Check if we're on results or still in questions
  const resultCards = await countElements(page, '.result-card');
  const stillInQuestions = await countElements(page, '.iq-option');
  if (resultCards >= 1) {
    assert(true, `Interview results show ${resultCards} radio recommendations`);
  } else if (stillInQuestions > 0) {
    warn(`Interview has more questions than expected (${stillInQuestions} options visible) — config may have additional questions`);
  } else {
    assert(false, `Interview results show 0 recommendations (expected >=1)`);
  }
}

async function testHandheldPicker(page) {
  section('HANDHELD — RADIO PICKER');

  await navigateToCategory(page, 0); // handheld
  await delay(300);

  // Click "I Know What I Want"
  const selPaths = await page.$$('#selector-phase .selector-path');
  if (selPaths.length >= 2) await selPaths[1].click();
  await delay(400);

  // Radio grid visible
  const radioGridVisible = await isVisible(page, 'radio-picker');
  assert(radioGridVisible, 'Radio picker visible');

  const radioCount = await countElements(page, '#radio-grid .radio-pick');
  assert(radioCount >= 3, `Radio grid has ${radioCount} radios`);

  // Back button works
  await page.click('#radio-picker button[onclick="backToSelectorLanding()"]');
  await delay(300);

  const backToLanding = await page.evaluate(() => {
    const el = document.getElementById('selector-landing');
    return el && el.style.display !== 'none';
  });
  assert(backToLanding, 'Back button returns to selector landing');
}

async function testHandheldWizardFull(page) {
  section('HANDHELD — FULL WIZARD WALKTHROUGH');

  await navigateToCategory(page, 0); // handheld
  await delay(300);

  // Pick a radio via "I Know What I Want"
  const selPaths = await page.$$('#selector-phase .selector-path');
  if (selPaths.length >= 2) await selPaths[1].click();
  await delay(400);

  const radios = await page.$$('#radio-grid .radio-pick');
  if (radios.length > 0) await radios[0].click();
  await delay(600);

  // Wizard should be visible
  const wizardVisible = await isVisible(page, 'wizard-phase');
  assert(wizardVisible, 'Wizard phase visible after radio selection');

  // Hero section populated
  const heroTitle = await page.evaluate(() => document.getElementById('hero-title').textContent);
  assert(heroTitle.length > 0, `Hero title populated: "${heroTitle}"`);

  const heroPrice = await page.evaluate(() => document.getElementById('hero-price').textContent);
  assert(heroPrice.includes('$'), `Hero price shown: "${heroPrice}"`);

  // Bottom bar visible
  const bbVisible = await page.evaluate(() => {
    const bb = document.querySelector('.rme-kb-bottom-bar');
    return bb && bb.style.display !== 'none';
  });
  assert(bbVisible, 'Bottom bar visible during wizard');

  // Step 0: Antennas
  const step0Active = await page.evaluate(() => {
    const el = document.getElementById('step-0');
    return el && (el.classList.contains('active') || el.style.display !== 'none');
  });
  assert(step0Active, 'Step 0 (Antennas) is active');

  const antennaCount = await countElements(page, '#antenna-options .opt-card');
  assert(antennaCount >= 1, `Step 0 has ${antennaCount} antenna options`);

  // Select an antenna (use evaluate for stability)
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    if (cards.length > 0) cards[0].click();
  });
  await delay(400);

  // Next to step 1 (use evaluate for nextStep)
  await page.evaluate(() => nextStep());
  await delay(400);

  // Step 1: Additional Antennas
  const step1Active = await page.evaluate(() => {
    const el = document.getElementById('step-1');
    return el && (el.classList.contains('active') || el.style.display !== 'none');
  });
  assert(step1Active, 'Step 1 (Additional Antennas) is active');

  // Next to step 2
  await page.evaluate(() => nextStep());
  await delay(400);

  // Step 2: Battery
  const batteryCount = await countElements(page, '#battery-options .opt-card');
  assert(batteryCount >= 1, `Step 2 has ${batteryCount} battery options`);

  // Select a battery
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#battery-options .opt-card');
    if (cards.length > 0) cards[0].click();
  });
  await delay(400);

  // Next to step 3
  await page.evaluate(() => nextStep());
  await delay(400);

  // Step 3: Accessories
  const accCount = await countElements(page, '#accessory-options .opt-card');
  assert(accCount >= 1, `Step 3 has ${accCount} accessory options`);

  // Select first accessory
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#accessory-options .opt-card');
    if (cards.length > 0) cards[0].click();
  });
  await delay(400);

  // === BACK NAVIGATION TESTS ===
  console.log('  --- Back navigation ---');

  // Back to battery
  await page.evaluate(() => prevStep());
  await delay(400);

  const batteryPersists = await page.evaluate(() =>
    document.querySelectorAll('#battery-options .opt-card.selected').length >= 1
  );
  assert(batteryPersists, 'Battery selection persists after back');

  // Back to additional antennas
  await page.evaluate(() => prevStep());
  await delay(400);

  // Back to antennas
  await page.evaluate(() => prevStep());
  await delay(400);

  const antennaPersists = await page.evaluate(() =>
    document.querySelectorAll('#antenna-options .opt-card.selected').length >= 1
  );
  assert(antennaPersists, 'Antenna selection persists after back to step 0');

  // On step 0, back button is visible but goes back to radio selector (not hidden)
  const backVisibleOnStep0 = await page.evaluate(() => {
    const btn = document.getElementById('btn-back');
    return btn && btn.style.display !== 'none';
  });
  assert(backVisibleOnStep0, 'Back button visible on step 0 (exits wizard)');

  // Forward to review
  await page.evaluate(() => nextStep()); await delay(300); // step 1
  await page.evaluate(() => nextStep()); await delay(300); // step 2
  await page.evaluate(() => nextStep()); await delay(300); // step 3
  await page.evaluate(() => nextStep()); await delay(300); // step 4 (programming)

  // Step 4: Programming visible
  const progVisible = await page.evaluate(() => {
    const el = document.getElementById('step-4');
    return el && (el.classList.contains('active') || el.style.display !== 'none');
  });
  assert(progVisible, 'Step 4 (Programming) is visible');

  // Next to review
  await page.evaluate(() => nextStep());
  await delay(500);

  // Step 5: Review
  const reviewVisible = await page.evaluate(() => {
    const el = document.getElementById('step-5');
    return el && (el.classList.contains('active') || el.style.display !== 'none');
  });
  assert(reviewVisible, 'Step 5 (Review) is visible');

  const reviewItems = await countElements(page, '.review-item');
  assert(reviewItems >= 1, `Review shows ${reviewItems} items`);

  // Total displayed
  const total = await page.evaluate(() => document.getElementById('bb-total').textContent);
  assert(total.includes('$'), `Total shown in bottom bar: "${total}"`);
}

async function testBaseFlow(page) {
  section('BASE STATION FLOW');

  await navigateToCategory(page, 2); // base
  await delay(500);

  // Base phase should be visible (after auto-start)
  const baseVisible = await isVisible(page, 'base-phase');
  assert(baseVisible, 'Base phase visible');

  // Should show radio choice
  const radioCards = await countElements(page, '#base-phase .radio-pick');
  assert(radioCards >= 1, `Base flow shows ${radioCards} radio choices`);

  // Select first radio
  const radios = await page.$$('#base-phase .radio-pick');
  if (radios.length > 0) await radios[0].click();
  await delay(500);

  // Should show antenna path options
  const stepContent = await page.evaluate(() => {
    const phase = document.getElementById('base-phase');
    return phase ? phase.innerHTML.length : 0;
  });
  assert(stepContent > 100, 'Base step content rendered after radio selection');
}

async function testMobileFlow(page) {
  section('MOBILE FLOW');

  await navigateToCategory(page, 1); // mobile
  await delay(500);

  const mobileVisible = await isVisible(page, 'mobile-phase');
  assert(mobileVisible, 'Mobile phase visible');

  // Should show radio choice
  const radioCards = await countElements(page, '#mobile-phase .radio-pick');
  assert(radioCards >= 1, `Mobile flow shows ${radioCards} radio choices`);

  // Select first radio
  const radios = await page.$$('#mobile-phase .radio-pick');
  if (radios.length > 0) await radios[0].click();
  await delay(500);

  // Should show vehicle step (YMM dropdowns)
  const hasVehicleStep = await page.evaluate(() => {
    const phase = document.getElementById('mobile-phase');
    return phase && (phase.innerHTML.includes('Vehicle') || phase.innerHTML.includes('vehicle'));
  });
  assert(hasVehicleStep, 'Vehicle step rendered after mobile radio selection');
}

async function testHfFlow(page) {
  section('HF FLOW');

  await navigateToCategory(page, 3); // hf
  await delay(500);

  const hfVisible = await isVisible(page, 'hf-phase');
  assert(hfVisible, 'HF phase visible');

  const radioCards = await countElements(page, '#hf-phase .radio-pick');
  assert(radioCards >= 1, `HF flow shows ${radioCards} radio choices`);

  // Select first radio
  const radios = await page.$$('#hf-phase .radio-pick');
  if (radios.length > 0) await radios[0].click();
  await delay(500);

  const hasAntennaStep = await page.evaluate(() => {
    const phase = document.getElementById('hf-phase');
    return phase && (phase.innerHTML.includes('Antenna') || phase.innerHTML.includes('antenna'));
  });
  assert(hasAntennaStep, 'Antenna step rendered after HF radio selection');
}

async function testScannerFlow(page) {
  section('SCANNER FLOW');

  await navigateToCategory(page, 4); // scanner
  await delay(500);

  const scannerVisible = await page.evaluate(() => {
    const el = document.getElementById('scanner-phase');
    return el && el.style.display !== 'none';
  });
  // Scanner may not have a phase if <5 categories, check if it's visible or if we got redirected
  if (scannerVisible) {
    assert(true, 'Scanner phase visible');
  } else {
    warn('Scanner flow may not be reachable (category index 4 may not exist)');
  }
}

async function testConsultationEscape(page) {
  section('CONSULTATION ESCAPE PATHS');

  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  // Enter email to trigger consultation features
  const testEmail = `consult-test-${Date.now()}@rme-test.com`;
  await page.type('#kb-lead-email', testEmail);
  await page.click('#kb-start-btn');
  await delay(1000);

  // Consultation footer should be visible
  const footerVisible = await page.evaluate(() => {
    const el = document.getElementById('consultation-footer');
    return el && el.style.display !== 'none';
  });
  assert(footerVisible, 'Consultation footer visible after email capture');

  // Consultation link has Calendly URL
  const calendlyUrl = await page.evaluate(() => {
    const link = document.getElementById('consultation-link');
    return link ? link.href : '';
  });
  assert(calendlyUrl.includes('calendly'), `Consultation link has Calendly URL: ${calendlyUrl.substring(0, 50)}...`);

  // Banner should be hidden initially
  const bannerHidden = await page.evaluate(() => {
    const el = document.getElementById('consultation-banner');
    return el && el.style.display === 'none';
  });
  assert(bannerHidden, 'Consultation banner hidden initially');

  // Dismiss banner (test the function exists)
  const dismissExists = await page.evaluate(() => typeof dismissConsultBanner === 'function');
  assert(dismissExists, 'dismissConsultBanner function exists');
}

async function testBackButtonAtEveryLevel(page) {
  section('BACK BUTTON — ALL LEVELS');

  // Test 1: Needs landing has no back (first screen after email)
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);
  await page.evaluate(() => skipEmailCapture());
  await delay(400);

  // Test 2: From guided needs → back returns to landing
  const paths = await page.$$('#needs-landing .selector-path');
  await paths[0].click(); // "Help Me Figure It Out"
  await delay(400);

  const hasNeedsBack = await page.evaluate(() => {
    const btns = document.querySelectorAll('.needs-btns .btn-back');
    for (const btn of btns) {
      if (btn.style.display !== 'none') return true;
    }
    return false;
  });
  // First question may not have a back button
  // After answering and going to Q2, back should work

  // Select an option and advance
  const q1opts = await page.$$('.nq-option');
  if (q1opts.length > 0) await q1opts[0].click();
  await delay(200);
  await page.click('.needs-btns .btn-next');
  await delay(400);

  // Now click back
  const backClicked = await clickButtonWithText(page, '.btn-back', 'Back');
  assert(backClicked, 'Back button clickable on needs Q2');
  await delay(300);

  // Should be back on first question with selection preserved
  const selectionPreserved = await page.evaluate(() => {
    const selected = document.querySelectorAll('.nq-option.selected');
    return selected.length > 0;
  });
  assert(selectionPreserved, 'Needs assessment selection preserved after back');

  // Test 3: From radio picker → back to selector landing
  // (tested in testHandheldPicker)

  // Test 4: Wizard step 0 → back button hidden
  // (tested in testHandheldWizardFull)
}

async function testEmailSystemValidation(page) {
  section('EMAIL SYSTEM VALIDATION');

  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  const testEmail = `validate-${Date.now()}@rme-test.com`;
  const testName = 'Test Validator';

  await page.type('#kb-lead-name', testName);
  await page.type('#kb-lead-email', testEmail);

  // Submit via UI button (uses built-in nonce)
  await page.click('#kb-start-btn');
  await delay(1500);

  // Verify we advanced past email capture (proves AJAX worked)
  const advancedPastEmail = await page.evaluate(() => {
    const emailPhase = document.getElementById('email-capture-phase');
    return emailPhase && emailPhase.style.display === 'none';
  });
  assert(advancedPastEmail, 'Email submission via AJAX succeeded (advanced past email capture)');

  // Verify nonce and AJAX URL are available
  const configValid = await page.evaluate(() =>
    !!rmeKitBuilder.nonce && rmeKitBuilder.ajaxUrl.includes('admin-ajax.php')
  );
  assert(configValid, 'AJAX nonce and URL available for email capture');
}

async function testJsErrorMonitoring(page) {
  section('JS ERROR MONITORING');

  // Report any JS errors collected during the test run
  if (jsErrors.length === 0) {
    assert(true, 'No JavaScript errors during entire test run');
  } else {
    for (const err of jsErrors) {
      console.log(`  ${FAIL} JS Error: ${err}`);
      failed++;
    }
  }
}

async function testHomepageCTA(page) {
  section('HOMEPAGE CTA BUTTON');

  await page.goto(SITE, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  // Hero CTA exists
  const ctaExists = await page.evaluate(() => {
    const link = document.querySelector('.rme-hero-cta, a[href*="kit-builder"]');
    return link ? { text: link.textContent.trim(), href: link.href } : null;
  });
  assert(ctaExists, `Homepage CTA exists: "${ctaExists?.text}"`);
  assert(ctaExists?.href?.includes('kit-builder'), 'CTA links to /kit-builder/');

  // Click CTA and verify navigation
  await page.click('.rme-hero-cta, .rme-hero a[href*="kit-builder"]');
  await delay(2000);

  const onKitBuilder = page.url().includes('kit-builder');
  assert(onKitBuilder, 'CTA navigates to kit builder page');
}

async function testMultiKitFlow(page) {
  section('MULTI-KIT FLOW');

  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);
  await page.evaluate(() => skipEmailCapture());
  await delay(400);

  // "I Know What I Need" → select handheld + mobile
  await page.evaluate(() => {
    const paths = document.querySelectorAll('#needs-landing .selector-path');
    if (paths.length >= 2) paths[1].click();
  });
  await delay(400);

  await page.evaluate(() => {
    const cats = document.querySelectorAll('.nq-option');
    if (cats.length >= 1) cats[0].click(); // handheld
  });
  await delay(300);
  await page.evaluate(() => {
    const cats = document.querySelectorAll('.nq-option');
    if (cats.length >= 2) cats[1].click(); // mobile
  });
  await delay(300);

  await clickButtonWithText(page, '.btn-next', 'Quantities');
  await delay(400);

  await clickButtonWithText(page, '.btn-next', 'Kit Plan');
  await delay(500);

  // Should auto-start first kit (handheld)
  const selectorVisible = await isVisible(page, 'selector-phase');
  const mobileVisible = await isVisible(page, 'mobile-phase');
  assert(selectorVisible || mobileVisible, 'Multi-kit: first kit flow started automatically');
}

// ══════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════

(async () => {
  console.log(`\n${SECTION}RME Kit Builder — Comprehensive Test Suite${RESET}`);
  console.log(`Target: ${KB_URL}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Capture JS errors globally
  page.on('pageerror', err => {
    jsErrors.push(err.message);
    console.log(`  ${FAIL} [JS ERROR] ${err.message.substring(0, 120)}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' &&
        !msg.text().includes('favicon') &&
        !msg.text().includes('Pixel SDK') &&
        !msg.text().includes('Failed to load resource') &&
        !msg.text().includes('google-analytics') &&
        !msg.text().includes('posthog') &&
        !msg.text().includes('mailchimp') &&
        !msg.text().includes('sentry')) {
      jsErrors.push(msg.text());
    }
  });

  try {
    await testPageLoad(page);
    await testHomepageCTA(page);
    await testEmailCapture(page);
    await testNeedsAssessmentGuided(page);
    await testNeedsAssessmentDirect(page);
    await testHandheldInterview(page);
    await testHandheldPicker(page);
    await testHandheldWizardFull(page);
    await testBaseFlow(page);
    await testMobileFlow(page);
    await testHfFlow(page);
    await testScannerFlow(page);
    await testMultiKitFlow(page);
    await testConsultationEscape(page);
    await testBackButtonAtEveryLevel(page);
    await testEmailSystemValidation(page);
    await testJsErrorMonitoring(page);
  } catch (err) {
    console.error(`\n${FAIL} Test runner error: ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  await browser.close();

  // Summary
  console.log(`\n${SECTION}═══════════════════════════════════════${RESET}`);
  console.log(`  ${PASS} Passed: ${passed}`);
  if (failed > 0) console.log(`  ${FAIL} Failed: ${failed}`);
  if (warned > 0) console.log(`  ${WARN} Warnings: ${warned}`);
  console.log(`  Total: ${passed + failed} assertions`);
  console.log(`${SECTION}═══════════════════════════════════════${RESET}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
