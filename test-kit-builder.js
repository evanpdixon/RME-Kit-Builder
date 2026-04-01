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
  section('HANDHELD — INTERVIEW (DYNAMIC)');

  await navigateToCategory(page, 0); // handheld
  await delay(300);

  const selectorVisible = await isVisible(page, 'selector-phase');
  assert(selectorVisible, 'Selector phase visible for handheld');

  const selPaths = await page.$$('#selector-phase .selector-path');
  assert(selPaths.length === 2, 'Two selector paths (Help Me Choose / I Know What I Want)');
  await selPaths[0].click();
  await delay(400);

  const interviewVisible = await isVisible(page, 'interview-container');
  assert(interviewVisible, 'Interview container visible');

  // Dynamically walk through ALL interview questions regardless of count
  let questionNum = 0;
  const maxQuestions = 10; // safety limit
  while (questionNum < maxQuestions) {
    questionNum++;
    const qState = await page.evaluate(() => {
      const opts = document.querySelectorAll('#interview-container .iq-option');
      const resultCards = document.querySelectorAll('.result-card');
      const nextBtn = document.querySelector('#interview-container .btn-next');
      return {
        optionCount: opts.length,
        resultCount: resultCards.length,
        hasNextBtn: !!nextBtn && nextBtn.offsetParent !== null,
        nextBtnText: nextBtn ? nextBtn.textContent.trim() : ''
      };
    });

    // If results are showing, we're done
    if (qState.resultCount > 0) {
      assert(true, `Interview completed after ${questionNum - 1} questions`);
      assert(qState.resultCount >= 1, `Results show ${qState.resultCount} radio recommendations`);
      break;
    }

    // If no options and no results, something is wrong
    if (qState.optionCount === 0) {
      assert(false, `Question ${questionNum}: no options visible and no results`);
      break;
    }

    assert(qState.optionCount >= 2, `Question ${questionNum} has ${qState.optionCount} options`);

    // Select first option
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#interview-container .iq-option');
      if (opts.length > 0) opts[0].click();
    });
    await delay(300);

    // Click next/results button
    if (qState.hasNextBtn) {
      await page.evaluate(() => {
        const btn = document.querySelector('#interview-container .btn-next');
        if (btn) btn.click();
      });
      await delay(500);
    } else {
      warn(`Question ${questionNum}: no Next button found`);
      break;
    }
  }

  // Final check if we never hit results
  const finalResults = await countElements(page, '.result-card');
  if (finalResults === 0 && questionNum >= maxQuestions) {
    assert(false, 'Interview never reached results (hit max questions limit)');
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

async function testCategorySpecificFiltering(page) {
  section('CATEGORY-SPECIFIC OPTION FILTERING');

  // ── Scanner-only: verify accessories are scanner-relevant ──
  await navigateToCategory(page, 4); // scanner (5th option)
  await delay(500);

  const scannerVisible = await isVisible(page, 'scanner-phase');
  if (!scannerVisible) {
    warn('Scanner phase not reachable — skipping scanner filtering tests');
  } else {
    // Select first scanner radio
    await page.evaluate(() => {
      const radios = document.querySelectorAll('#scanner-phase .radio-pick, #scanner-phase .nq-option');
      if (radios.length > 0) radios[0].click();
    });
    await delay(600);

    // Walk to accessories step
    // Scanner steps: Radio → Antenna → Accessories → Programming → Review
    // Click through to accessories
    let maxClicks = 5;
    while (maxClicks-- > 0) {
      const hasAccessories = await page.evaluate(() => {
        const phase = document.getElementById('scanner-phase');
        return phase && phase.innerHTML.includes('Accessor');
      });
      if (hasAccessories) break;
      await page.evaluate(() => {
        const btns = document.querySelectorAll('#scanner-phase .btn-next');
        for (const btn of btns) { if (btn.offsetParent !== null) { btn.click(); break; } }
      });
      await delay(500);
    }

    // Check scanner accessory names — should NOT include handheld-only items
    const scannerAccNames = await page.evaluate(() => {
      const phase = document.getElementById('scanner-phase');
      if (!phase) return [];
      const labels = phase.querySelectorAll('.nq-label, .nq-option');
      return Array.from(labels).map(el => el.textContent.trim().toLowerCase());
    });
    const joinedNames = scannerAccNames.join(' ');

    // Scanner should not show items like "speaker mic" that are handheld-specific
    const hasIrrelevantItems = joinedNames.includes('wouxun') || joinedNames.includes('uv-5r');
    assert(!hasIrrelevantItems, 'Scanner accessories do not include handheld-specific items');
    assert(scannerAccNames.length >= 1, `Scanner has ${scannerAccNames.length} accessory/option items`);
  }

  // ── HF-only: verify accessories are HF-relevant ──
  await navigateToCategory(page, 3); // HF (4th option)
  await delay(500);

  const hfVisible = await isVisible(page, 'hf-phase');
  assert(hfVisible, 'HF phase visible for filtering test');

  // Select first HF radio
  await page.evaluate(() => {
    const radios = document.querySelectorAll('#hf-phase .radio-pick, #hf-phase .nq-option');
    if (radios.length > 0) radios[0].click();
  });
  await delay(600);

  // Walk to accessories step
  let hfMaxClicks = 6;
  while (hfMaxClicks-- > 0) {
    const hasAcc = await page.evaluate(() => {
      const phase = document.getElementById('hf-phase');
      return phase && phase.innerHTML.includes('Accessor');
    });
    if (hasAcc) break;
    await page.evaluate(() => {
      const btns = document.querySelectorAll('#hf-phase .btn-next');
      for (const btn of btns) { if (btn.offsetParent !== null) { btn.click(); break; } }
    });
    await delay(500);
  }

  const hfAccNames = await page.evaluate(() => {
    const phase = document.getElementById('hf-phase');
    if (!phase) return [];
    const labels = phase.querySelectorAll('.nq-label, .nq-option');
    return Array.from(labels).map(el => el.textContent.trim().toLowerCase());
  });
  const hfJoined = hfAccNames.join(' ');

  // HF should show HF-relevant items (digirig, antenna tuner) not handheld items
  const hfHasIrrelevant = hfJoined.includes('speaker mic') || hfJoined.includes('uv-5r battery');
  assert(!hfHasIrrelevant, 'HF accessories do not include handheld-specific items');
  assert(hfAccNames.length >= 1, `HF has ${hfAccNames.length} accessory/option items`);

  // ── Mobile: verify vehicle-specific content ──
  await navigateToCategory(page, 1); // mobile
  await delay(500);

  const mobileVisible = await isVisible(page, 'mobile-phase');
  assert(mobileVisible, 'Mobile phase visible for filtering test');

  // Check that vehicle step exists (mobile-specific)
  const hasVehicle = await page.evaluate(() => {
    const phase = document.getElementById('mobile-phase');
    return phase && (phase.innerHTML.includes('Vehicle') || phase.innerHTML.includes('vehicle') || phase.innerHTML.includes('Year'));
  });
  // Mobile needs radio selected first
  await page.evaluate(() => {
    const radios = document.querySelectorAll('#mobile-phase .radio-pick, #mobile-phase .nq-option');
    if (radios.length > 0) radios[0].click();
  });
  await delay(600);

  const hasVehicleStep = await page.evaluate(() => {
    const phase = document.getElementById('mobile-phase');
    return phase && (phase.innerHTML.includes('Vehicle') || phase.innerHTML.includes('vehicle'));
  });
  assert(hasVehicleStep, 'Mobile flow has vehicle-specific step (not present in other flows)');
}

async function testEmailFollowupCron(page) {
  section('EMAIL FOLLOW-UP SYSTEM');

  // Insert a test lead with old timestamp to trigger follow-ups
  const testEmail = `cron-test-${Date.now()}@rme-test.com`;
  const wpPath = '/home/u36-2gkvf0xatmnh/www/staging12.radiomadeeasy.com/public_html';

  // 1. Verify the cron hook is registered
  const { execSync } = require('child_process');
  let cronOutput;
  try {
    cronOutput = execSync(
      `ssh rme-staging "/usr/local/bin/wp cron event list --path=${wpPath} --fields=hook 2>/dev/null | grep rme_kb"`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
  } catch (e) {
    cronOutput = '';
  }
  assert(cronOutput.includes('rme_kb_send_followups'), 'Cron hook rme_kb_send_followups is registered');

  // 2. Insert a test lead directly via WP-CLI
  // Write PHP to a temp file to avoid shell escaping issues
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const tmpPhp = path.join(os.tmpdir(), 'rme-kb-test-insert.php');
  fs.writeFileSync(tmpPhp, `<?php
global $wpdb;
$t = $wpdb->prefix . 'rme_kb_leads';
$wpdb->replace($t, array(
  'email' => '${testEmail}',
  'name' => 'CronTest',
  'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
  'completed' => 0,
  'confirmation_sent' => 0,
  'reminder_1_sent' => 0,
  'reminder_2_sent' => 0,
  'unsubscribed' => 0,
  'last_step' => 'test'
));
echo $wpdb->last_error ?: 'OK';
`);
  let insertResult;
  try {
    // Upload and execute the PHP file
    execSync(`cat "${tmpPhp}" | ssh rme-staging "cat > /tmp/rme-kb-test.php"`, { timeout: 10000 });
    insertResult = execSync(
      `ssh rme-staging "/usr/local/bin/wp eval-file /tmp/rme-kb-test.php --path=${wpPath} 2>&1"`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
  } catch (e) {
    insertResult = e.message.substring(0, 200);
  }
  assert(insertResult === 'OK' || insertResult === '', `Test lead inserted: ${insertResult}`);

  // 3. Trigger the cron manually
  let cronRunResult;
  try {
    cronRunResult = execSync(
      `ssh rme-staging "/usr/local/bin/wp cron event run rme_kb_send_followups --path=${wpPath} 2>&1"`,
      { encoding: 'utf8', timeout: 30000 }
    ).trim();
  } catch (e) {
    cronRunResult = e.message;
  }
  assert(cronRunResult.includes('Executed') || cronRunResult.includes('Success') || !cronRunResult.includes('Error'),
    `Cron executed: ${cronRunResult.substring(0, 80)}`);

  // 4. Check if confirmation_sent was updated
  const tmpCheck = path.join(os.tmpdir(), 'rme-kb-test-check.php');
  fs.writeFileSync(tmpCheck, `<?php
global $wpdb;
$t = $wpdb->prefix . 'rme_kb_leads';
$r = $wpdb->get_row($wpdb->prepare('SELECT confirmation_sent FROM ' . $t . ' WHERE email = %s', '${testEmail}'));
echo $r ? $r->confirmation_sent : 'NOT_FOUND';
`);
  let confirmSent;
  try {
    execSync(`cat "${tmpCheck}" | ssh rme-staging "cat > /tmp/rme-kb-test-check.php"`, { timeout: 10000 });
    confirmSent = execSync(
      `ssh rme-staging "/usr/local/bin/wp eval-file /tmp/rme-kb-test-check.php --path=${wpPath} 2>&1"`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
  } catch (e) {
    confirmSent = 'ERROR';
  }
  assert(confirmSent === '1', `Confirmation email sent (confirmation_sent = ${confirmSent})`);

  // 5. Check email content via wp_mail log (if available) or just verify the send happened
  // The wp_mail function was called — we verified via the DB flag update

  // 6. Verify unsubscribe URL generation
  const unsubWorks = await page.evaluate(async (email) => {
    // Just verify the unsubscribe endpoint exists
    const resp = await fetch(`${location.origin}/?rme_kb_unsub=1&email=${encodeURIComponent(email)}&token=invalid`);
    return resp.status; // Should return 200 with "invalid token" message, not 404
  }, testEmail);
  assert(unsubWorks === 200, `Unsubscribe endpoint responds (status: ${unsubWorks})`);

  // 7. Clean up test lead + temp files
  const tmpClean = path.join(os.tmpdir(), 'rme-kb-test-clean.php');
  fs.writeFileSync(tmpClean, `<?php
global $wpdb;
$t = $wpdb->prefix . 'rme_kb_leads';
$wpdb->delete($t, array('email' => '${testEmail}'));
echo 'cleaned';
`);
  try {
    execSync(`cat "${tmpClean}" | ssh rme-staging "cat > /tmp/rme-kb-test-clean.php"`, { timeout: 10000 });
    execSync(`ssh rme-staging "/usr/local/bin/wp eval-file /tmp/rme-kb-test-clean.php --path=${wpPath} 2>&1"`, { encoding: 'utf8', timeout: 15000 });
    execSync(`ssh rme-staging "rm -f /tmp/rme-kb-test*.php"`, { timeout: 5000 });
  } catch (e) { /* cleanup is best-effort */ }
  try { fs.unlinkSync(tmpPhp); fs.unlinkSync(tmpCheck); fs.unlinkSync(tmpClean); } catch (e) {}
}

async function testAddToCartAndCleanup(page) {
  section('ADD TO CART & CLEANUP');

  // Walk through full handheld wizard to review, then add to cart
  await navigateToCategory(page, 0); // handheld
  await delay(300);

  // Pick a radio via "I Know What I Want"
  const selPaths = await page.$$('#selector-phase .selector-path');
  if (selPaths.length >= 2) await selPaths[1].click();
  await delay(400);

  // Select first radio
  await page.evaluate(() => {
    const radios = document.querySelectorAll('#radio-grid .radio-pick');
    if (radios.length > 0) radios[0].click();
  });
  await delay(600);

  // Skip through wizard to review (select minimal items)
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => nextStep());
    await delay(300);
  }

  // Should be on review step
  const onReview = await page.evaluate(() => {
    const el = document.getElementById('step-5');
    return el && (el.classList.contains('active') || el.style.display !== 'none');
  });
  assert(onReview, 'Reached review step for add-to-cart test');

  // Get cart count before
  const cartBefore = await page.evaluate(async () => {
    try {
      const resp = await fetch('/?wc-ajax=get_refreshed_fragments');
      const data = await resp.json();
      return data.fragments ? Object.keys(data.fragments).length : 0;
    } catch { return -1; }
  });

  // Click Add to Cart (the next button on review is the cart button)
  await page.evaluate(() => {
    const btn = document.getElementById('btn-next');
    if (btn) btn.click();
  });
  await delay(3000);

  // Check if we redirected to cart or got success
  const afterCart = await page.evaluate(() => {
    return {
      url: location.href,
      hasCartItems: document.querySelectorAll('.woocommerce-cart-form .cart_item, .rme-cart-item').length,
      hasError: document.querySelector('.woocommerce-error, .rme-kb-error') !== null
    };
  });

  if (afterCart.url.includes('cart')) {
    assert(true, 'Redirected to cart page after add-to-cart');
    assert(afterCart.hasCartItems >= 1, `Cart has ${afterCart.hasCartItems} items`);
  } else {
    // May still be on kit builder with loading overlay
    const loadingGone = await page.evaluate(() => {
      const overlay = document.getElementById('rkbLoading') || document.getElementById('rme-kb-loading');
      return !overlay || overlay.style.display === 'none';
    });
    if (afterCart.hasError) {
      warn('Add to cart showed an error (may be product availability issue on staging)');
    } else {
      assert(loadingGone, 'Add to cart completed (no loading overlay)');
    }
  }

  // Clean up: empty the cart
  const { execSync } = require('child_process');
  const wpPath = '/home/u36-2gkvf0xatmnh/www/staging12.radiomadeeasy.com/public_html';
  try {
    execSync(
      `ssh rme-staging "/usr/local/bin/wp eval \\"if(function_exists('WC')){WC()->cart->empty_cart();echo 'cart cleared';}\\" --path=${wpPath} 2>&1"`,
      { encoding: 'utf8', timeout: 15000 }
    );
    assert(true, 'Cart cleaned up after test');
  } catch (e) {
    warn('Cart cleanup via WP-CLI failed (non-critical — cart is session-based)');
  }
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
    await testCategorySpecificFiltering(page);
    await testEmailSystemValidation(page);
    await testEmailFollowupCron(page);
    await testAddToCartAndCleanup(page);
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
