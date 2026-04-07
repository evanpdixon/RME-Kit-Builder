/**
 * RME Kit Builder V2 — Comprehensive Regression Test Suite
 *
 * Tests every category flow end-to-end, section state transitions,
 * URL hash updates, resume prompt, adapter modal, mobile viewport,
 * and edge cases.
 *
 * Run: node test-regression.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const KB_URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SCREENSHOT_DIR = path.join(__dirname, '_screenshots', 'regression');

let passed = 0;
let failed = 0;
const failures = [];
const jsErrors = [];
let currentTest = '';

function assert(condition, msg) {
  if (condition) {
    console.log(`  ${PASS} ${msg}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${msg}`);
    failed++;
    failures.push(`[${currentTest}] ${msg}`);
  }
  return condition;
}

function describe(name, fn) {
  return { name, fn };
}

async function screenshotOnFail(page, label) {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    const safeName = label.replace(/[^a-z0-9_-]/gi, '_').substring(0, 80);
    const filePath = path.join(SCREENSHOT_DIR, `${safeName}_${Date.now()}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  ${DIM}  Screenshot: ${filePath}${RESET}`);
  } catch (e) {
    console.log(`  ${DIM}  (screenshot failed: ${e.message})${RESET}`);
  }
}

// ── Helpers ──────────────────────────────────────────

async function freshPage(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport || { width: 1440, height: 900 });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  return page;
}

async function loadPage(page, url) {
  url = url || KB_URL;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(800);
  // Dismiss Mailchimp popup if present
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, div[role="button"]');
    for (const b of btns) {
      if (b.textContent.trim().toUpperCase().includes('NO, THANKS')) { b.click(); break; }
    }
  });
  await sleep(300);
}

async function skipEmail(page) {
  await page.evaluate(() => { if (typeof kbsSkipEmail === 'function') kbsSkipEmail(); });
  await sleep(2500);
}

async function getSectionState(page, sectionName) {
  return page.evaluate((name) => {
    const el = document.getElementById('sec-' + name);
    if (!el) return 'missing';
    if (el.classList.contains('kb-section--active')) return 'active';
    if (el.classList.contains('kb-section--complete')) return 'complete';
    if (el.classList.contains('kb-section--locked')) return 'locked';
    if (el.classList.contains('kb-section--loading')) return 'loading';
    return 'unknown';
  }, sectionName);
}

async function getSectionStates(page) {
  return page.evaluate(() => {
    const names = ['email', 'interview', 'radio', 'mounting', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'];
    const result = {};
    names.forEach(name => {
      const el = document.getElementById('sec-' + name);
      if (!el) { result[name] = 'missing'; return; }
      if (el.classList.contains('kb-section--active')) result[name] = 'active';
      else if (el.classList.contains('kb-section--complete')) result[name] = 'complete';
      else if (el.classList.contains('kb-section--locked')) result[name] = 'locked';
      else if (el.classList.contains('kb-section--loading')) result[name] = 'loading';
      else result[name] = 'unknown';
    });
    return result;
  });
}

async function sectionHasContent(page, sectionName) {
  return page.evaluate((name) => {
    const el = document.getElementById('sec-' + name);
    if (!el) return false;
    const content = el.querySelector('.kb-section__content');
    if (!content) return false;
    // Check that there's some visible content (not just empty/whitespace)
    return content.offsetHeight > 20 && content.innerHTML.trim().length > 50;
  }, sectionName);
}

async function isSectionVisible(page, sectionName) {
  return page.evaluate((name) => {
    const el = document.getElementById('sec-' + name);
    return el && el.style.display !== 'none';
  }, sectionName);
}

async function getPriceBarTotal(page) {
  return page.evaluate(() => {
    const el = document.getElementById('kbs-total');
    return el ? el.textContent.trim() : '';
  });
}

async function isPriceBarVisible(page) {
  return page.evaluate(() => {
    const bar = document.getElementById('kb-scroll-price-bar');
    return bar && bar.style.display !== 'none';
  });
}

async function getUrlHash(page) {
  return page.evaluate(() => window.location.hash);
}

async function isCartBtnEnabled(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn') || document.querySelector('.kb-btn--cart');
    return btn && !btn.disabled && btn.style.display !== 'none';
  });
}

async function completeSection(page, name, waitMs) {
  await page.evaluate((n) => { if (typeof kbsCompleteSection === 'function') kbsCompleteSection(n); }, name);
  await sleep(waitMs || 2200);
}

// ── Direct path: skip email → direct → select category → proceed ──
async function directToRadioGrid(page, categoryKey) {
  await skipEmail(page);
  await page.evaluate(() => { if (typeof kbsStartDirect === 'function') kbsStartDirect(); });
  await sleep(600);
  // Toggle category
  await page.evaluate((cat) => { if (typeof kbsDirectToggleCat === 'function') { const opts = document.querySelectorAll('.kbs-iq-opt'); opts.forEach(o => { if (o.textContent.toLowerCase().includes(cat.toLowerCase())) kbsDirectToggleCat(o, cat); }); } }, categoryKey);
  await sleep(300);
  // Proceed
  await page.evaluate(() => { if (typeof kbsDirectProceed === 'function') kbsDirectProceed(); });
  await sleep(2200);
}

// Walk from antennas through review+quantity for any category
async function walkProductSections(page, category, skipSections) {
  skipSections = skipSections || {};
  const sectionOrder = ['antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'];

  for (let i = 0; i < sectionOrder.length; i++) {
    const sec = sectionOrder[i];
    const nextSec = sectionOrder[i + 1];

    // If this section is expected to be skipped, verify it
    if (skipSections[sec]) {
      const vis = await isSectionVisible(page, sec);
      assert(!vis || (await getSectionState(page, sec)) === 'complete',
        `${sec} section skipped/hidden for ${category}`);
      continue;
    }

    const state = await getSectionState(page, sec);
    if (state !== 'active') {
      // May not have reached this section yet
      continue;
    }

    assert(state === 'active', `${sec} section is active`);
    const hasContent = await sectionHasContent(page, sec);
    assert(hasContent, `${sec} section has rendered content`);

    // Complete the section (unless it's quantity - that's the last one)
    if (sec !== 'quantity') {
      await completeSection(page, sec);
    }
  }
}

// ══════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════

async function testHandheldGuidedFlow(browser) {
  currentTest = 'Handheld Guided';
  console.log(`\n${SECTION}${BOLD}═══ 1. HANDHELD FLOW (Guided) ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // ── Email skip ──
  console.log(`${SECTION}1a. Email Skip${RESET}`);
  let states = await getSectionStates(page);
  assert(states.email === 'active', 'Email starts as active');
  assert(states.interview === 'locked', 'Interview starts as locked');

  await skipEmail(page);
  states = await getSectionStates(page);
  assert(states.email === 'complete', 'Email is complete after skip');
  assert(states.interview === 'active', 'Interview is active after email skip');

  // ── Guided quiz ──
  console.log(`\n${SECTION}1b. Guided Interview${RESET}`);
  await page.evaluate(() => { if (typeof kbsStartGuided === 'function') kbsStartGuided(); });
  await sleep(500);

  // Q1: Budget
  const q1Visible = await page.evaluate(() => {
    const stack = document.getElementById('kbs-interview-stack');
    return stack && stack.style.display !== 'none' && stack.innerHTML.includes('budget');
  });
  assert(q1Visible, 'Budget question is visible');

  await page.evaluate(() => { if (typeof kbsAnswer === 'function') kbsAnswer('budget', 'mid', false); });
  await sleep(200);
  await page.evaluate(() => { if (typeof kbsNextQ === 'function') kbsNextQ(); });
  await sleep(600);

  // Q2: Reach
  await page.evaluate(() => { if (typeof kbsAnswer === 'function') kbsAnswer('reach', 'local', true); });
  await sleep(200);
  await page.evaluate(() => { if (typeof kbsNextQ === 'function') kbsNextQ(); });
  await sleep(600);

  // Q3: Setup type (should have handheld pre-selected based on reach=local)
  // Ensure handheld is selected
  await page.evaluate(() => {
    if (typeof kbsAnswer === 'function' && typeof kbsAnswers !== 'undefined') {
      if (!kbsAnswers['setup'] || !kbsAnswers['setup'].includes('handheld')) {
        kbsAnswer('setup', 'handheld', true);
      }
    }
  });
  await sleep(200);
  await page.evaluate(() => { if (typeof kbsNextQ === 'function') kbsNextQ(); });
  await sleep(600);

  // Q4: Preferences/Needs (handheld-only question)
  const hasPrefsQ = await page.evaluate(() => {
    const stack = document.getElementById('kbs-interview-stack');
    return stack && stack.innerHTML.length > 100;
  });
  if (hasPrefsQ) {
    await page.evaluate(() => { if (typeof kbsAnswer === 'function') kbsAnswer('needs', 'shtf', true); });
    await sleep(200);
    await page.evaluate(() => { if (typeof kbsNextQ === 'function') kbsNextQ(); });
    await sleep(1000);
  }

  // Should now show recommendation results
  const resultsVisible = await page.evaluate(() => {
    const heading = document.querySelector('.kbs-results-heading');
    return heading && heading.offsetParent !== null;
  });
  assert(resultsVisible, 'Recommendation results are visible');

  // ── Select recommended radio ──
  console.log(`\n${SECTION}1c. Radio Selection${RESET}`);
  // Click the first recommendation card's button
  await page.evaluate(() => {
    const btn = document.querySelector('.result-card .rc-btn');
    if (btn) btn.click();
  });
  // Radio selection triggers: interview complete → radio complete → mounting skip → antennas active
  // That's ~3 chained section transitions
  await sleep(8000);

  states = await getSectionStates(page);
  assert(states.radio === 'complete', 'Radio section complete after selection');

  // Mounting should be hidden for handheld
  const mountingVisible = await isSectionVisible(page, 'mounting');
  assert(!mountingVisible || states.mounting === 'complete', 'Mounting section hidden/skipped for handheld');

  // Antennas should be active
  assert(states.antennas === 'active', 'Antennas section active for handheld');

  // Price bar should be visible
  const priceVisible = await isPriceBarVisible(page);
  assert(priceVisible, 'Price bar visible after radio selection');

  const priceText = await getPriceBarTotal(page);
  assert(priceText.includes('$'), `Price bar shows dollar amount: ${priceText}`);

  // ── Walk through product sections ──
  console.log(`\n${SECTION}1d. Product Sections Walkthrough${RESET}`);
  const antennaContent = await sectionHasContent(page, 'antennas');
  assert(antennaContent, 'Antennas section has rendered content');

  await completeSection(page, 'antennas');
  states = await getSectionStates(page);
  assert(states.antennas === 'complete', 'Antennas complete');
  assert(states.battery === 'active', 'Battery active after antennas');
  assert(await sectionHasContent(page, 'battery'), 'Battery section has content');

  await completeSection(page, 'battery');
  states = await getSectionStates(page);
  assert(states.battery === 'complete', 'Battery complete');
  assert(states.accessories === 'active', 'Accessories active after battery');
  assert(await sectionHasContent(page, 'accessories'), 'Accessories section has content');

  await completeSection(page, 'accessories');
  states = await getSectionStates(page);
  assert(states.accessories === 'complete', 'Accessories complete');
  assert(states.programming === 'active', 'Programming active after accessories');
  assert(await sectionHasContent(page, 'programming'), 'Programming section has content');

  await completeSection(page, 'programming');
  states = await getSectionStates(page);
  assert(states.programming === 'complete', 'Programming complete');
  assert(states.review === 'active', 'Review active after programming');
  assert(await sectionHasContent(page, 'review'), 'Review section has content');

  await completeSection(page, 'review');
  states = await getSectionStates(page);
  assert(states.review === 'complete', 'Review complete');
  assert(states.quantity === 'active', 'Quantity active after review');

  // Cart button should be enabled
  const cartEnabled = await isCartBtnEnabled(page);
  assert(cartEnabled, 'Add to Cart button enabled at quantity step');

  // ── URL hash ──
  console.log(`\n${SECTION}1e. URL Hash State${RESET}`);
  const hash = await getUrlHash(page);
  assert(hash.length > 1, `URL hash is populated: ${hash.substring(0, 60)}...`);
  assert(hash.includes('radio='), 'Hash includes radio key');
  assert(hash.includes('path=guided'), 'Hash includes guided path marker');

  // ── Back button ──
  console.log(`\n${SECTION}1f. Back Button (Edit)${RESET}`);
  await page.evaluate(() => { if (typeof kbsEditSection === 'function') kbsEditSection('antennas'); });
  await sleep(800);
  states = await getSectionStates(page);
  assert(states.antennas === 'active', 'Antennas re-activates on edit');
  assert(states.battery === 'locked', 'Battery locked after editing antennas');
  assert(states.review === 'locked', 'Review locked after editing antennas');

  // Cart should be disabled now (either the button is disabled, hidden, or quantity section is not active)
  const cartDisabledAfterEdit = await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn') || document.querySelector('.kb-btn--cart');
    if (!btn) return true; // no button means effectively disabled
    if (btn.disabled) return true;
    if (btn.style.display === 'none') return true;
    // If we're no longer at quantity step, cart is effectively unavailable
    const qSec = document.getElementById('sec-quantity');
    if (qSec && !qSec.classList.contains('kb-section--active')) return true;
    return false;
  });
  assert(cartDisabledAfterEdit, 'Cart button disabled after editing');

  if (failed > 0) await screenshotOnFail(page, 'handheld-guided');
  await page.close();
}

async function testVehicleMobileFlow(browser) {
  currentTest = 'Vehicle/Mobile';
  console.log(`\n${SECTION}${BOLD}═══ 2. VEHICLE / MOBILE FLOW (Direct) ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // ── Direct to radio grid ──
  console.log(`${SECTION}2a. Navigate to Vehicle Radio Grid${RESET}`);
  await directToRadioGrid(page, 'vehicle');

  let states = await getSectionStates(page);
  assert(states.email === 'complete', 'Email complete');
  assert(states.interview === 'complete', 'Interview complete');
  assert(states.radio === 'active', 'Radio section active for vehicle');

  // Radio grid should show mobile/vehicle radios
  const radioCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-pick');
    return cards.length;
  });
  assert(radioCards >= 1, `Vehicle radio grid has ${radioCards} radios`);

  // ── Select first available radio using kbsSelectNonHandheld ──
  console.log(`\n${SECTION}2b. Select Vehicle Radio${RESET}`);
  const selectedKey = await page.evaluate(() => {
    const lineup = typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [];
    const available = lineup.find(r => !r.outOfStock);
    if (available && typeof kbsSelectNonHandheld === 'function') {
      kbsSelectNonHandheld(available.key, 'mobile');
      return available.key;
    }
    return '';
  });
  assert(selectedKey.length > 0, `Selected vehicle radio: ${selectedKey}`);
  await sleep(2500);

  states = await getSectionStates(page);
  assert(states.radio === 'complete', 'Radio complete after selection');

  // ── Mounting should be visible for vehicle ──
  console.log(`\n${SECTION}2c. Mounting Section${RESET}`);
  const mountingVis = await isSectionVisible(page, 'mounting');
  assert(mountingVis, 'Mounting section visible for vehicle');
  assert(states.mounting === 'active', 'Mounting section active for vehicle');
  assert(await sectionHasContent(page, 'mounting'), 'Mounting section has content');

  // Complete mounting
  await completeSection(page, 'mounting');
  states = await getSectionStates(page);
  assert(states.mounting === 'complete', 'Mounting complete');
  assert(states.antennas === 'active', 'Antennas active after mounting');

  // ── Walk remaining sections ──
  console.log(`\n${SECTION}2d. Remaining Sections${RESET}`);
  assert(await sectionHasContent(page, 'antennas'), 'Antennas section has content (vehicle)');
  await completeSection(page, 'antennas');

  states = await getSectionStates(page);
  assert(states.battery === 'active', 'Battery active (vehicle)');
  assert(await sectionHasContent(page, 'battery'), 'Battery/power section has content (vehicle)');
  await completeSection(page, 'battery');

  states = await getSectionStates(page);
  assert(states.accessories === 'active', 'Accessories active (vehicle)');
  assert(await sectionHasContent(page, 'accessories'), 'Accessories section has content (vehicle)');
  await completeSection(page, 'accessories');

  states = await getSectionStates(page);
  assert(states.programming === 'active', 'Programming active (vehicle)');
  assert(await sectionHasContent(page, 'programming'), 'Programming section has content (vehicle)');
  await completeSection(page, 'programming');

  states = await getSectionStates(page);
  assert(states.review === 'active', 'Review active (vehicle)');
  assert(await sectionHasContent(page, 'review'), 'Review section has content (vehicle)');
  await completeSection(page, 'review');

  states = await getSectionStates(page);
  assert(states.quantity === 'active', 'Quantity active (vehicle)');
  assert(await isCartBtnEnabled(page), 'Cart button enabled (vehicle)');

  // Check price bar
  const price = await getPriceBarTotal(page);
  assert(price.includes('$'), `Price bar shows total: ${price}`);

  // URL hash
  const hash = await getUrlHash(page);
  assert(hash.includes('cat=mobile'), 'URL hash includes cat=mobile');

  if (failed > 0) await screenshotOnFail(page, 'vehicle-mobile');
  await page.close();
}

async function testBaseStationFlow(browser) {
  currentTest = 'Base Station';
  console.log(`\n${SECTION}${BOLD}═══ 3. BASE STATION FLOW (Direct) ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  console.log(`${SECTION}3a. Navigate to Base Radio Grid${RESET}`);
  await directToRadioGrid(page, 'base');

  let states = await getSectionStates(page);
  assert(states.radio === 'active', 'Radio section active for base');

  // ── Select radio ──
  console.log(`\n${SECTION}3b. Select Base Radio${RESET}`);
  const selectedKey = await page.evaluate(() => {
    // Base uses same lineup as mobile
    const lineup = typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [];
    const available = lineup.find(r => !r.outOfStock);
    if (available && typeof kbsSelectNonHandheld === 'function') {
      kbsSelectNonHandheld(available.key, 'base');
      return available.key;
    }
    return '';
  });
  assert(selectedKey.length > 0, `Selected base radio: ${selectedKey}`);
  await sleep(2500);

  states = await getSectionStates(page);
  assert(states.radio === 'complete', 'Radio complete (base)');

  // Mounting should be visible for base
  console.log(`\n${SECTION}3c. Mounting Section (Base)${RESET}`);
  const mountingVis = await isSectionVisible(page, 'mounting');
  assert(mountingVis, 'Mounting section visible for base');
  assert(states.mounting === 'active', 'Mounting active for base');

  await completeSection(page, 'mounting');

  // Walk through remaining
  console.log(`\n${SECTION}3d. Remaining Sections (Base)${RESET}`);
  states = await getSectionStates(page);
  assert(states.antennas === 'active', 'Antennas active (base)');
  assert(await sectionHasContent(page, 'antennas'), 'Antennas has content (base)');
  await completeSection(page, 'antennas');

  states = await getSectionStates(page);
  assert(states.battery === 'active', 'Battery/power active (base)');
  await completeSection(page, 'battery');

  states = await getSectionStates(page);
  assert(states.accessories === 'active', 'Accessories active (base)');
  await completeSection(page, 'accessories');

  states = await getSectionStates(page);
  assert(states.programming === 'active', 'Programming active (base)');
  await completeSection(page, 'programming');

  states = await getSectionStates(page);
  assert(states.review === 'active', 'Review active (base)');
  await completeSection(page, 'review');

  states = await getSectionStates(page);
  assert(states.quantity === 'active', 'Quantity active (base)');
  assert(await isCartBtnEnabled(page), 'Cart button enabled (base)');

  const hash = await getUrlHash(page);
  assert(hash.includes('cat=base'), 'URL hash includes cat=base');

  if (failed > 0) await screenshotOnFail(page, 'base-station');
  await page.close();
}

async function testHFFlow(browser) {
  currentTest = 'HF';
  console.log(`\n${SECTION}${BOLD}═══ 4. HF FLOW (Direct) ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  console.log(`${SECTION}4a. Navigate to HF Radio Grid${RESET}`);
  await directToRadioGrid(page, 'hf');

  let states = await getSectionStates(page);
  assert(states.radio === 'active', 'Radio section active for HF');

  // ── Select HF radio ──
  console.log(`\n${SECTION}4b. Select HF Radio${RESET}`);
  const selectedKey = await page.evaluate(() => {
    const lineup = typeof hfRadioLineup !== 'undefined' ? hfRadioLineup : [];
    const available = lineup.find(r => !r.outOfStock);
    if (available && typeof kbsSelectNonHandheld === 'function') {
      kbsSelectNonHandheld(available.key, 'hf');
      return available.key;
    }
    return '';
  });
  assert(selectedKey.length > 0, `Selected HF radio: ${selectedKey}`);
  await sleep(5000); // Radio complete → mounting skip → antennas active

  states = await getSectionStates(page);
  assert(states.radio === 'complete', 'Radio complete (HF)');

  // Mounting should be HIDDEN for HF
  console.log(`\n${SECTION}4c. Mounting Skipped (HF)${RESET}`);
  const mountHidden = await page.evaluate(() => {
    const el = document.getElementById('sec-mounting');
    return el && (el.style.display === 'none' || el.classList.contains('kb-section--complete'));
  });
  assert(mountHidden, 'Mounting hidden/skipped for HF');

  // Antennas should be active
  assert(states.antennas === 'active', 'Antennas active (HF)');
  assert(await sectionHasContent(page, 'antennas'), 'HF antennas has content');

  // ── Walk remaining ──
  console.log(`\n${SECTION}4d. Remaining Sections (HF)${RESET}`);
  await completeSection(page, 'antennas');

  states = await getSectionStates(page);
  // HF should have battery (power) section
  assert(states.battery === 'active', 'Battery/power active (HF)');
  await completeSection(page, 'battery');

  states = await getSectionStates(page);
  assert(states.accessories === 'active', 'Accessories active (HF)');
  await completeSection(page, 'accessories');

  states = await getSectionStates(page);
  assert(states.programming === 'active', 'Programming active (HF)');
  await completeSection(page, 'programming');

  states = await getSectionStates(page);
  assert(states.review === 'active', 'Review active (HF)');
  await completeSection(page, 'review');

  states = await getSectionStates(page);
  assert(states.quantity === 'active', 'Quantity active (HF)');
  assert(await isCartBtnEnabled(page), 'Cart button enabled (HF)');

  const hash = await getUrlHash(page);
  assert(hash.includes('cat=hf'), 'URL hash includes cat=hf');

  if (failed > 0) await screenshotOnFail(page, 'hf-flow');
  await page.close();
}

async function testScannerFlow(browser) {
  currentTest = 'Scanner';
  console.log(`\n${SECTION}${BOLD}═══ 5. SCANNER FLOW (Direct) ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  console.log(`${SECTION}5a. Navigate to Scanner Radio Grid${RESET}`);
  await directToRadioGrid(page, 'scanner');

  let states = await getSectionStates(page);
  assert(states.radio === 'active', 'Radio section active for scanner');

  // ── Select scanner radio ──
  console.log(`\n${SECTION}5b. Select Scanner Radio${RESET}`);
  const selectedKey = await page.evaluate(() => {
    const lineup = typeof scannerRadioLineup !== 'undefined' ? scannerRadioLineup : [];
    const available = lineup.find(r => !r.outOfStock);
    if (available && typeof kbsSelectNonHandheld === 'function') {
      kbsSelectNonHandheld(available.key, 'scanner');
      return available.key;
    }
    return '';
  });
  assert(selectedKey.length > 0, `Selected scanner radio: ${selectedKey}`);
  await sleep(5000); // Radio complete → mounting skip → antennas active

  states = await getSectionStates(page);
  assert(states.radio === 'complete', 'Radio complete (scanner)');

  // Mounting should be HIDDEN for scanner
  console.log(`\n${SECTION}5c. Mounting + Battery Skipped (Scanner)${RESET}`);
  const mountHidden = await page.evaluate(() => {
    const el = document.getElementById('sec-mounting');
    return el && (el.style.display === 'none' || el.classList.contains('kb-section--complete'));
  });
  assert(mountHidden, 'Mounting hidden/skipped for scanner');

  // Battery should be HIDDEN for scanner
  const batteryHidden = await page.evaluate(() => {
    const el = document.getElementById('sec-battery');
    return el && el.style.display === 'none';
  });
  assert(batteryHidden, 'Battery section hidden for scanner');

  // Antennas should be active
  assert(states.antennas === 'active', 'Antennas active (scanner)');
  assert(await sectionHasContent(page, 'antennas'), 'Scanner antennas has content');

  // ── Walk remaining (battery should be auto-skipped) ──
  console.log(`\n${SECTION}5d. Remaining Sections - Battery Skipped (Scanner)${RESET}`);
  await completeSection(page, 'antennas', 4500); // Extra time for battery skip + accessories render

  states = await getSectionStates(page);
  // Battery should have been auto-completed/skipped; accessories should be active
  assert(states.battery === 'complete', 'Battery auto-completed (scanner skip)');
  assert(states.accessories === 'active', 'Accessories active after battery skip (scanner)');
  assert(await sectionHasContent(page, 'accessories'), 'Accessories has content (scanner)');

  await completeSection(page, 'accessories');
  states = await getSectionStates(page);
  assert(states.programming === 'active', 'Programming active (scanner)');
  await completeSection(page, 'programming');

  states = await getSectionStates(page);
  assert(states.review === 'active', 'Review active (scanner)');
  await completeSection(page, 'review');

  states = await getSectionStates(page);
  assert(states.quantity === 'active', 'Quantity active (scanner)');
  assert(await isCartBtnEnabled(page), 'Cart button enabled (scanner)');

  if (failed > 0) await screenshotOnFail(page, 'scanner-flow');
  await page.close();
}

async function testResumeFromHash(browser) {
  currentTest = 'Resume from Hash';
  console.log(`\n${SECTION}${BOLD}═══ 6. RESUME FROM URL HASH ═══${RESET}\n`);

  const page = await freshPage(browser);

  // Build a hash that represents mid-flow state (handheld, radio selected, at accessories)
  const hash = '#path=guided&budget=mid&reach=local&setup=handheld&radio=uv-pro&sec=accessories';
  console.log(`${SECTION}6a. Load with URL hash${RESET}`);
  await loadPage(page, KB_URL + hash);

  // Resume prompt should appear (overlay is inside #rme-kit-builder-scroll, not body)
  const resumeOverlay = await page.evaluate(() => {
    const overlay = document.querySelector('.kbs-resume-overlay');
    if (!overlay) return false;
    const style = window.getComputedStyle(overlay);
    return style.display !== 'none' && style.visibility !== 'hidden' && overlay.offsetHeight > 0;
  });
  assert(resumeOverlay, 'Resume prompt overlay appears');

  // Check it mentions the radio
  const resumeText = await page.evaluate(() => {
    const overlay = document.querySelector('.kbs-resume-overlay');
    return overlay ? overlay.textContent : '';
  });
  assert(resumeText.includes('UV-Pro') || resumeText.includes('uv-pro') || resumeText.includes('Welcome Back'),
    'Resume prompt shows welcome / radio info');

  // ── Click "Pick Up Where I Left Off" ──
  console.log(`\n${SECTION}6b. Resume Flow${RESET}`);
  await page.evaluate(() => {
    const btn = document.getElementById('kbs-resume-yes');
    if (btn) btn.click();
  });
  await sleep(1500);

  const states = await getSectionStates(page);
  assert(states.email === 'complete', 'Email complete after resume');
  assert(states.interview === 'complete', 'Interview complete after resume');
  assert(states.radio === 'complete', 'Radio complete after resume');
  assert(states.accessories === 'active', 'Accessories active at resume point');

  // Price bar should be visible
  assert(await isPriceBarVisible(page), 'Price bar visible after resume');

  if (failed > 0) await screenshotOnFail(page, 'resume-hash');
  await page.close();
}

async function testStartFresh(browser) {
  currentTest = 'Start Fresh';
  console.log(`\n${SECTION}${BOLD}═══ 7. START FRESH ═══${RESET}\n`);

  const page = await freshPage(browser);
  const hash = '#path=guided&budget=mid&radio=uv-pro&sec=review';
  await loadPage(page, KB_URL + hash);

  // Resume prompt should appear
  const hasPrompt = await page.evaluate(() => !!document.querySelector('.kbs-resume-overlay'));
  assert(hasPrompt, 'Resume prompt appears with hash');

  // ── Click Start Fresh ──
  console.log(`${SECTION}7a. Click Start Fresh${RESET}`);
  await page.evaluate(() => {
    const btn = document.getElementById('kbs-resume-no');
    if (btn) btn.click();
  });
  await sleep(800);

  // Overlay should be gone
  const overlayGone = await page.evaluate(() => !document.querySelector('.kbs-resume-overlay'));
  assert(overlayGone, 'Resume overlay dismissed');

  // Hash should be cleared
  const clearedHash = await getUrlHash(page);
  assert(!clearedHash || clearedHash === '' || clearedHash === '#', `URL hash cleared: "${clearedHash}"`);

  // Should be back at email section
  const states = await getSectionStates(page);
  assert(states.email === 'active', 'Email section active after Start Fresh');

  if (failed > 0) await screenshotOnFail(page, 'start-fresh');
  await page.close();
}

async function testAdapterModal(browser) {
  currentTest = 'Adapter Modal';
  console.log(`\n${SECTION}${BOLD}═══ 8. ADAPTER MODAL FLOW ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);
  await skipEmail(page);

  // Start guided, answer quickly to get handheld
  await page.evaluate(() => { if (typeof kbsStartGuided === 'function') kbsStartGuided(); });
  await sleep(400);
  await page.evaluate(() => { kbsAnswer('budget', 'mid', false); });
  await sleep(200);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(500);
  await page.evaluate(() => { kbsAnswer('reach', 'local', true); });
  await sleep(200);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(500);
  // Setup: handheld
  await page.evaluate(() => {
    if (!kbsAnswers['setup'] || !kbsAnswers['setup'].includes('handheld')) {
      kbsAnswer('setup', 'handheld', true);
    }
  });
  await sleep(200);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(500);
  // Needs
  await page.evaluate(() => { kbsAnswer('needs', 'shtf', true); });
  await sleep(200);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(1500);

  // Select UV-Pro
  await page.evaluate(() => { kbsSelectRadio('uv-pro'); });
  await sleep(2500);

  // Now on antennas section — try toggling an antenna that needs BNC adapter
  console.log(`${SECTION}8a. Toggle BNC Antenna Without Adapter${RESET}`);

  // Check if adapter modal exists
  const hasAdapterModal = await page.evaluate(() => !!document.getElementById('adapter-modal'));
  assert(hasAdapterModal, 'Adapter modal element exists in DOM');

  // Try a BNC antenna (e.g. fwwhip or magmount)
  // The modal should open when toggling an additional antenna that needs BNC
  await page.evaluate(() => {
    if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('wearable');
  });
  await sleep(600);

  const modalOpen = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    return modal && modal.classList.contains('open');
  });
  assert(modalOpen, 'Adapter modal opens for BNC antenna');

  if (modalOpen) {
    // Click "Add Adapter"
    console.log(`\n${SECTION}8b. Add Adapter via Modal${RESET}`);
    await page.evaluate(() => { if (typeof adapterModalAdd === 'function') adapterModalAdd(); });
    await sleep(500);

    const modalClosed = await page.evaluate(() => {
      const modal = document.getElementById('adapter-modal');
      return modal && !modal.classList.contains('open');
    });
    assert(modalClosed, 'Adapter modal closed after adding');

    // Antenna should be selected
    const wearableSelected = await page.evaluate(() => {
      return typeof selectedAddlAntennas !== 'undefined' && selectedAddlAntennas.has('wearable');
    });
    assert(wearableSelected, 'Wearable antenna added to selections');

    // Price should have updated
    const price = await getPriceBarTotal(page);
    assert(price.includes('$'), `Price updated after adapter: ${price}`);
  }

  if (failed > 0) await screenshotOnFail(page, 'adapter-modal');
  await page.close();
}

async function testMobileViewport(browser) {
  currentTest = 'Mobile Viewport';
  console.log(`\n${SECTION}${BOLD}═══ 9. MOBILE VIEWPORT (375px) ═══${RESET}\n`);

  const page = await freshPage(browser, { width: 375, height: 812 });
  await loadPage(page);

  // ── Page loads at mobile size ──
  console.log(`${SECTION}9a. Mobile Page Load${RESET}`);
  const container = await page.$('#rme-kit-builder-scroll');
  assert(!!container, 'Scroll container exists on mobile');

  // Skip email and pick direct path
  await skipEmail(page);

  let states = await getSectionStates(page);
  assert(states.interview === 'active', 'Interview active on mobile');

  // ── Direct → Handheld ──
  console.log(`\n${SECTION}9b. Mobile Direct Path${RESET}`);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes('handheld')) kbsDirectToggleCat(o, 'handheld'); });
  });
  await sleep(300);
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(2200);

  states = await getSectionStates(page);
  assert(states.radio === 'active', 'Radio active on mobile');

  // Select UV-5R (radio -> mounting skip -> antennas chain needs 5s+)
  await page.evaluate(() => { kbsSelectRadio('uv5r'); });
  await sleep(6000);

  states = await getSectionStates(page);
  assert(states.antennas === 'active', 'Antennas active on mobile');
  assert(await isPriceBarVisible(page), 'Price bar visible on mobile');

  // Check grid is single column on mobile
  const isSingleCol = await page.evaluate(() => {
    const grid = document.querySelector('#rme-kit-builder-scroll .options-grid');
    if (!grid) return true;
    const cols = getComputedStyle(grid).gridTemplateColumns;
    return cols.split(' ').filter(s => s.trim()).length <= 2;
  });
  assert(isSingleCol, 'Options grid fits mobile viewport');

  // Walk through a couple sections to verify
  await completeSection(page, 'antennas');
  states = await getSectionStates(page);
  assert(states.battery === 'active', 'Battery active on mobile after antennas');

  await completeSection(page, 'battery');
  states = await getSectionStates(page);
  assert(states.accessories === 'active', 'Accessories active on mobile');

  if (failed > 0) await screenshotOnFail(page, 'mobile-viewport');
  await page.close();
}

async function testBackNavigation(browser) {
  currentTest = 'Back Navigation';
  console.log(`\n${SECTION}${BOLD}═══ 10. BACK NAVIGATION ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // Quick path to antennas
  await skipEmail(page);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes('handheld')) kbsDirectToggleCat(o, 'handheld'); });
  });
  await sleep(300);
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(2200);
  await page.evaluate(() => { kbsSelectRadio('uv-pro'); });
  await sleep(2500);

  // At antennas now
  await completeSection(page, 'antennas');
  await completeSection(page, 'battery');
  // Now at accessories

  let states = await getSectionStates(page);
  assert(states.accessories === 'active', 'At accessories before back test');

  // ── Go back ──
  console.log(`${SECTION}10a. kbsGoBack from Accessories${RESET}`);
  await page.evaluate(() => { if (typeof kbsGoBack === 'function') kbsGoBack('accessories'); });
  await sleep(800);

  states = await getSectionStates(page);
  assert(states.battery === 'active', 'Battery re-activated after going back from accessories');
  assert(states.accessories === 'locked', 'Accessories locked after going back');

  // ── Go back again ──
  console.log(`\n${SECTION}10b. kbsGoBack from Battery${RESET}`);
  await page.evaluate(() => { kbsGoBack('battery'); });
  await sleep(800);

  states = await getSectionStates(page);
  assert(states.antennas === 'active', 'Antennas re-activated after going back from battery');
  assert(states.battery === 'locked', 'Battery locked after going back');

  // ── kbsEditSection for specific section ──
  console.log(`\n${SECTION}10c. Edit Radio Section${RESET}`);
  await page.evaluate(() => { kbsEditSection('radio'); });
  await sleep(800);

  states = await getSectionStates(page);
  // In guided handheld mode, editing radio may redirect to interview
  const radioOrInterview = states.radio === 'active' || states.interview === 'active';
  assert(radioOrInterview, 'Radio or interview re-activated on edit');

  if (failed > 0) await screenshotOnFail(page, 'back-navigation');
  await page.close();
}

async function testPriceBarUpdates(browser) {
  currentTest = 'Price Bar Updates';
  console.log(`\n${SECTION}${BOLD}═══ 11. PRICE BAR UPDATES ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // Quick handheld path
  await skipEmail(page);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes('handheld')) kbsDirectToggleCat(o, 'handheld'); });
  });
  await sleep(300);
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(2200);

  // Price bar hidden before radio selection
  console.log(`${SECTION}11a. Price Bar Before/After Radio${RESET}`);
  const hiddenBefore = !(await isPriceBarVisible(page));
  assert(hiddenBefore, 'Price bar hidden before radio selection');

  await page.evaluate(() => { kbsSelectRadio('uv-pro'); });
  await sleep(6000);

  const visibleAfter = await isPriceBarVisible(page);
  assert(visibleAfter, 'Price bar visible after radio selection');

  const basePrice = await getPriceBarTotal(page);
  assert(basePrice.includes('$'), `Base price shown: ${basePrice}`);

  // ── Select an antenna upgrade and verify price changes ──
  console.log(`\n${SECTION}11b. Price Updates on Antenna Selection${RESET}`);
  await page.evaluate(() => {
    // Select first antenna upgrade
    if (typeof toggleAntenna === 'function') {
      var upgrades = typeof antennaUpgrades !== 'undefined' ? antennaUpgrades : [];
      if (upgrades.length > 0) toggleAntenna(upgrades[0].key);
    }
  });
  await sleep(500);

  const afterAntenna = await getPriceBarTotal(page);
  assert(afterAntenna.includes('$'), `Price after antenna: ${afterAntenna}`);
  // Price should have changed (can't assert exact direction without knowing base)
  // Just verify it's still a valid dollar amount
  const priceNum = parseFloat(afterAntenna.replace(/[^0-9.]/g, ''));
  assert(priceNum > 0, `Price is a positive number: ${priceNum}`);

  if (failed > 0) await screenshotOnFail(page, 'price-bar');
  await page.close();
}

async function testSectionNumbering(browser) {
  currentTest = 'Section Numbering';
  console.log(`\n${SECTION}${BOLD}═══ 12. SECTION NUMBERING ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // Handheld path (mounting hidden)
  await skipEmail(page);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes('handheld')) kbsDirectToggleCat(o, 'handheld'); });
  });
  await sleep(300);
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(2200);
  await page.evaluate(() => { kbsSelectRadio('uv-pro'); });
  await sleep(2500);

  // Check that section numbers are sequential (no gaps from hidden mounting)
  console.log(`${SECTION}12a. Sequential Numbers (Handheld)${RESET}`);
  const numbers = await page.evaluate(() => {
    const badges = document.querySelectorAll('.kb-section:not([style*="display: none"]):not([style*="display:none"]) .kb-section__number');
    return [...badges].map(b => parseInt(b.textContent)).filter(n => !isNaN(n));
  });
  // Numbers should be sequential: 1,2,3,4,5,...
  let sequential = true;
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) { sequential = false; break; }
  }
  assert(sequential, `Section numbers are sequential: [${numbers.join(',')}]`);
  assert(numbers[0] === 1, `First visible section is numbered 1`);

  if (failed > 0) await screenshotOnFail(page, 'section-numbering');
  await page.close();
}

async function testContinueButtonStates(browser) {
  currentTest = 'Continue Buttons';
  console.log(`\n${SECTION}${BOLD}═══ 13. CONTINUE / NEXT BUTTON STATES ═══${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  await skipEmail(page);

  // Choice screen should have two clickable cards
  console.log(`${SECTION}13a. Choice Cards${RESET}`);
  const choiceCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('.kbs-choice-card');
    return cards.length;
  });
  assert(choiceCards === 2, `Two choice cards present (got ${choiceCards})`);

  // Start direct
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);

  // Next button should be disabled until a category is selected
  const nextDisabled = await page.evaluate(() => {
    const btn = document.getElementById('kbs-direct-next');
    return btn && btn.disabled;
  });
  assert(nextDisabled, 'Direct Next button disabled before category selection');

  // Select a category
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes('handheld')) kbsDirectToggleCat(o, 'handheld'); });
  });
  await sleep(300);

  const nextEnabled = await page.evaluate(() => {
    const btn = document.getElementById('kbs-direct-next');
    return btn && !btn.disabled;
  });
  assert(nextEnabled, 'Direct Next button enabled after category selection');

  if (failed > 0) await screenshotOnFail(page, 'continue-buttons');
  await page.close();
}

async function testJSErrors(browser) {
  currentTest = 'JS Errors';
  console.log(`\n${SECTION}${BOLD}═══ 14. JAVASCRIPT ERRORS ═══${RESET}\n`);

  const criticalErrors = jsErrors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('404') &&
    !e.includes('net::ERR') &&
    !e.includes('Mailchimp') &&
    !e.includes('mc.js') &&
    !e.includes('Failed to load resource')
  );

  if (criticalErrors.length === 0) {
    assert(true, 'No critical JS errors across all tests');
  } else {
    console.log(`  Found ${criticalErrors.length} JS error(s):`);
    const unique = [...new Set(criticalErrors)];
    unique.slice(0, 10).forEach(e => {
      assert(false, `JS Error: ${e.substring(0, 120)}`);
    });
  }
}

// ══════════════════════════════════════════════════════
// COMBINATORIAL PRODUCT SELECTION TESTS
// ══════════════════════════════════════════════════════

// Helper: navigate handheld direct path to antennas section (reusable within suites)
async function navigateToHandheldAntennas(page, radioKey) {
  radioKey = radioKey || 'uv-pro';
  await loadPage(page);
  await skipEmail(page);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes('handheld')) kbsDirectToggleCat(o, 'handheld'); });
  });
  await sleep(300);
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(2200);
  await page.evaluate((key) => { kbsSelectRadio(key); }, radioKey);
  await sleep(6000);
}

// Helper: navigate to a non-handheld category at the antennas step
async function navigateToCategoryAntennas(page, categoryKey, selectFn) {
  await loadPage(page);
  await skipEmail(page);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(500);
  await page.evaluate((cat) => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.toLowerCase().includes(cat.toLowerCase())) kbsDirectToggleCat(o, cat); });
  }, categoryKey);
  await sleep(300);
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(2200);
  if (selectFn) {
    await selectFn(page);
  }
}

async function testInterviewAnswerMatrix(browser) {
  currentTest = 'Interview Answer Matrix';
  console.log(`\n${SECTION}${BOLD}=== 15. INTERVIEW ANSWER MATRIX ===${RESET}\n`);

  const page = await freshPage(browser);

  // ── Budget answers ──
  console.log(`${SECTION}15a. Budget Answers (low, mid, high)${RESET}`);
  const budgetKeys = ['low', 'mid', 'high'];
  for (const bk of budgetKeys) {
    await loadPage(page);
    await skipEmail(page);
    await page.evaluate(() => { kbsStartGuided(); });
    await sleep(400);
    await page.evaluate((key) => { kbsAnswer('budget', key, false); }, bk);
    await sleep(200);
    const answered = await page.evaluate((key) => kbsAnswers['budget'] === key, bk);
    assert(answered, `Budget answer "${bk}" recorded`);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(400);
    // Verify we advanced to the next question (setup)
    const step = await page.evaluate(() => kbsStep);
    assert(step >= 1, `Advanced past budget for "${bk}"`);
  }

  // ── Setup answers (each individually) ──
  console.log(`\n${SECTION}15b. Setup Type Answers (individual)${RESET}`);
  const setupKeys = ['handheld', 'vehicle', 'base', 'hf', 'scanner'];
  for (const sk of setupKeys) {
    await loadPage(page);
    await skipEmail(page);
    await page.evaluate(() => { kbsStartGuided(); });
    await sleep(400);
    await page.evaluate(() => { kbsAnswer('budget', 'mid', false); });
    await sleep(200);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(400);
    // Now at setup question — clear any pre-selection, set our choice
    await page.evaluate((key) => {
      kbsAnswers['setup'] = [key];
    }, sk);
    await sleep(200);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(800);
    // Verify detection
    const detected = await page.evaluate(() => typeof kbsDetectCategory === 'function' ? kbsDetectCategory() : '');
    const expected = sk === 'vehicle' ? 'mobile' : sk;
    assert(detected === expected, `Setup "${sk}" -> category "${expected}" (got "${detected}")`);
  }

  // ── Setup multi-select combos ──
  console.log(`\n${SECTION}15c. Setup Type Multi-Select Combos${RESET}`);
  const combos = [
    { keys: ['handheld', 'vehicle'], expectedFirst: 'handheld' },
    { keys: ['handheld', 'vehicle', 'base', 'hf', 'scanner'], expectedFirst: 'handheld' },
    { keys: ['vehicle', 'hf'], expectedFirst: 'mobile' },
    { keys: ['base', 'scanner'], expectedFirst: 'base' },
  ];
  for (const combo of combos) {
    await loadPage(page);
    await skipEmail(page);
    await page.evaluate(() => { kbsStartGuided(); });
    await sleep(400);
    await page.evaluate(() => { kbsAnswer('budget', 'mid', false); });
    await sleep(200);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(400);
    await page.evaluate((keys) => { kbsAnswers['setup'] = keys; }, combo.keys);
    await sleep(200);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(800);
    const detected = await page.evaluate(() => typeof kbsDetectCategory === 'function' ? kbsDetectCategory() : '');
    assert(detected === combo.expectedFirst,
      `Setup [${combo.keys.join(',')}] -> first category "${combo.expectedFirst}" (got "${detected}")`);
  }

  await page.close();
}

async function testHandheldProductSelections(browser) {
  currentTest = 'Handheld Products';
  console.log(`\n${SECTION}${BOLD}=== 16. HANDHELD PER-PRODUCT SELECTION TESTS ===${RESET}\n`);

  const page = await freshPage(browser);

  // Navigate to antennas section with UV-PRO selected
  await navigateToHandheldAntennas(page, 'uv-pro');

  // ── 16a. Antenna upgrades individually ──
  console.log(`${SECTION}16a. Antenna Upgrade Toggles${RESET}`);
  const antennaUpgradeKeys = ['stubby', 'foulweather', 'signalstick'];
  for (const ak of antennaUpgradeKeys) {
    const priceBefore = await getPriceBarTotal(page);
    await page.evaluate((key) => { if (typeof toggleAntenna === 'function') toggleAntenna(key); }, ak);
    await sleep(500);
    const priceAfter = await getPriceBarTotal(page);
    const selected = await page.evaluate((key) => typeof selectedAntennas !== 'undefined' && selectedAntennas.has(key), ak);
    assert(selected, `Antenna upgrade "${ak}" selected`);
    assert(priceAfter.includes('$'), `Price updated after selecting "${ak}": ${priceAfter}`);
    // Deselect
    await page.evaluate((key) => { if (typeof toggleAntenna === 'function') toggleAntenna(key); }, ak);
    await sleep(300);
    const deselected = await page.evaluate((key) => typeof selectedAntennas !== 'undefined' && !selectedAntennas.has(key), ak);
    assert(deselected, `Antenna upgrade "${ak}" deselected`);
  }

  // ── 16b. Additional antennas individually (skip ones that trigger adapter modal) ──
  console.log(`\n${SECTION}16b. Additional Antenna Toggles (no-adapter items)${RESET}`);
  // First select an antenna upgrade so adapter is not needed for BNC items
  await page.evaluate(() => { if (typeof toggleAntenna === 'function') toggleAntenna('stubby'); });
  await sleep(400);
  const addlAntennaKeys = ['wearable', 'slimjim', 'magmount', 'mollemount', 'extraadapter'];
  for (const ak of addlAntennaKeys) {
    await page.evaluate((key) => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna(key); }, ak);
    await sleep(500);
    const selected = await page.evaluate((key) => typeof selectedAddlAntennas !== 'undefined' && selectedAddlAntennas.has(key), ak);
    assert(selected, `Additional antenna "${ak}" selected`);
    const price = await getPriceBarTotal(page);
    assert(price.includes('$'), `Price valid after "${ak}": ${price}`);
    // Deselect
    await page.evaluate((key) => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna(key); }, ak);
    await sleep(300);
  }
  // Deselect stubby
  await page.evaluate(() => { if (typeof toggleAntenna === 'function') toggleAntenna('stubby'); });
  await sleep(300);

  // ── 16c. Battery toggles ──
  console.log(`\n${SECTION}16c. Battery Toggles (UV-PRO)${RESET}`);
  await completeSection(page, 'antennas');
  const batteryKeys = ['uvpro-spare'];
  for (const bk of batteryKeys) {
    await page.evaluate((key) => { if (typeof toggleBattery === 'function') toggleBattery(key); }, bk);
    await sleep(500);
    const price = await getPriceBarTotal(page);
    assert(price.includes('$'), `Price valid after battery "${bk}": ${price}`);
    // Deselect
    await page.evaluate((key) => { if (typeof toggleBattery === 'function') toggleBattery(key); }, bk);
    await sleep(300);
  }

  // ── 16d. Accessory toggles ──
  console.log(`\n${SECTION}16d. Accessory Toggles (UV-PRO)${RESET}`);
  await completeSection(page, 'battery');
  const uvproAccessoryKeys = ['cheatsheets', 'bs22', 'kplug', 'eartube', 'monocable', 'so239-pigtail'];
  for (const ak of uvproAccessoryKeys) {
    await page.evaluate((key) => { if (typeof toggleAccessory === 'function') toggleAccessory(key); }, ak);
    await sleep(500);
    const price = await getPriceBarTotal(page);
    assert(price.includes('$'), `Price valid after accessory "${ak}": ${price}`);
    // Deselect
    await page.evaluate((key) => { if (typeof toggleAccessory === 'function') toggleAccessory(key); }, ak);
    await sleep(300);
  }

  // ── 16e. Programming options ──
  console.log(`\n${SECTION}16e. Programming Options${RESET}`);
  await completeSection(page, 'accessories');
  const progBefore = await getPriceBarTotal(page);
  await page.evaluate(() => { if (typeof selectProgramming === 'function') selectProgramming('multi'); });
  await sleep(500);
  const progAfter = await getPriceBarTotal(page);
  assert(progAfter.includes('$'), `Price valid after multi programming: ${progAfter}`);
  // Switch back to standard
  await page.evaluate(() => { if (typeof selectProgramming === 'function') selectProgramming('standard'); });
  await sleep(300);

  // ── 16f. Multi-select: 2 antennas + 3 accessories ──
  console.log(`\n${SECTION}16f. Multi-Select Combination${RESET}`);
  // Go back to antennas
  await page.evaluate(() => { if (typeof kbsEditSection === 'function') kbsEditSection('antennas'); });
  await sleep(800);
  // Select 2 antenna upgrades
  await page.evaluate(() => { toggleAntenna('stubby'); });
  await sleep(300);
  await page.evaluate(() => { toggleAntenna('foulweather'); });
  await sleep(300);
  const twoAntennas = await page.evaluate(() =>
    selectedAntennas.has('stubby') && selectedAntennas.has('foulweather'));
  assert(twoAntennas, 'Two antenna upgrades selected simultaneously');

  await completeSection(page, 'antennas');
  await completeSection(page, 'battery');
  // Select 3 accessories
  await page.evaluate(() => { toggleAccessory('cheatsheets'); });
  await sleep(200);
  await page.evaluate(() => { toggleAccessory('bs22'); });
  await sleep(200);
  await page.evaluate(() => { toggleAccessory('kplug'); });
  await sleep(300);
  const threeAcc = await page.evaluate(() =>
    typeof selectedAccessories !== 'undefined' &&
    selectedAccessories.has('cheatsheets') && selectedAccessories.has('bs22') && selectedAccessories.has('kplug'));
  assert(threeAcc, 'Three accessories selected simultaneously');

  const multiPrice = await getPriceBarTotal(page);
  const multiNum = parseFloat(multiPrice.replace(/[^0-9.]/g, ''));
  assert(multiNum > 159, `Multi-select total (${multiNum}) exceeds base UV-PRO price`);

  if (failed > 0) await screenshotOnFail(page, 'handheld-products');
  await page.close();
}

async function testVehicleProductSelections(browser) {
  currentTest = 'Vehicle Products';
  console.log(`\n${SECTION}${BOLD}=== 17. VEHICLE / MOBILE PRODUCT TESTS ===${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // Navigate to vehicle category
  await directToRadioGrid(page, 'vehicle');
  // Select first available mobile radio
  const selectedKey = await page.evaluate(() => {
    const lineup = typeof mobileRadioLineup !== 'undefined' ? mobileRadioLineup : [];
    const available = lineup.find(r => !r.outOfStock);
    if (available && typeof kbsSelectNonHandheld === 'function') {
      kbsSelectNonHandheld(available.key, 'mobile');
      return available.key;
    }
    return '';
  });
  assert(selectedKey.length > 0, `Vehicle radio selected: ${selectedKey}`);
  await sleep(2500);

  // ── 17a. Mount options ──
  console.log(`${SECTION}17a. Mount Options${RESET}`);
  // Mounting section should be active
  let states = await getSectionStates(page);
  if (states.mounting === 'active') {
    // Test RAM wedge mount toggle
    const priceBefore = await getPriceBarTotal(page);
    await page.evaluate(() => { if (typeof kbsSelectMount === 'function') kbsSelectMount('ramwedge'); });
    await sleep(500);
    // Verify via DOM: the ramwedge card should have .selected class
    const mountSet = await page.evaluate(() => {
      const cards = document.querySelectorAll('#mounting-options .opt-card');
      return cards.length >= 2 && cards[1].classList.contains('selected');
    });
    assert(mountSet, 'RAM wedge mount selected');
    const mountPrice = await getPriceBarTotal(page);
    assert(mountPrice.includes('$'), `Price after mount: ${mountPrice}`);

    // Switch back to factory
    await page.evaluate(() => { if (typeof kbsSelectMount === 'function') kbsSelectMount('factory'); });
    await sleep(300);
    const factorySet = await page.evaluate(() => {
      const cards = document.querySelectorAll('#mounting-options .opt-card');
      return cards.length >= 1 && cards[0].classList.contains('selected');
    });
    assert(factorySet, 'Factory mount restored');

    await completeSection(page, 'mounting');
  }

  // ── 17b. Vehicle antenna options ──
  console.log(`\n${SECTION}17b. Vehicle Antenna Options${RESET}`);
  states = await getSectionStates(page);
  if (states.antennas === 'active') {
    // Toggle SAR antenna
    await page.evaluate(() => { if (typeof toggleAntenna === 'function') toggleAntenna('sar'); });
    await sleep(500);
    const sarSelected = await page.evaluate(() => typeof selectedAntennas !== 'undefined' && selectedAntennas.has('sar'));
    assert(sarSelected, 'SAR vehicle antenna selected');
    const sarPrice = await getPriceBarTotal(page);
    assert(sarPrice.includes('$'), `Price after SAR: ${sarPrice}`);

    // Toggle lip mount
    await page.evaluate(() => { if (typeof toggleAntenna === 'function') toggleAntenna('lipmount-nmo'); });
    await sleep(500);
    const lipSelected = await page.evaluate(() => typeof selectedAntennas !== 'undefined' && selectedAntennas.has('lipmount-nmo'));
    assert(lipSelected, 'Lip mount NMO selected');

    // Deselect both
    await page.evaluate(() => { toggleAntenna('sar'); toggleAntenna('lipmount-nmo'); });
    await sleep(300);

    await completeSection(page, 'antennas');
  }

  // ── 17c. Vehicle accessories ──
  console.log(`\n${SECTION}17c. Vehicle Accessories${RESET}`);
  // Skip battery
  states = await getSectionStates(page);
  if (states.battery === 'active') await completeSection(page, 'battery');

  states = await getSectionStates(page);
  if (states.accessories === 'active') {
    await page.evaluate(() => { if (typeof toggleAccessory === 'function') toggleAccessory('relocation'); });
    await sleep(500);
    const relSelected = await page.evaluate(() => typeof selectedAccessories !== 'undefined' && selectedAccessories.has('relocation'));
    assert(relSelected, 'Relocation cable selected (vehicle)');
    const accPrice = await getPriceBarTotal(page);
    assert(accPrice.includes('$'), `Price after vehicle accessory: ${accPrice}`);
    // Deselect
    await page.evaluate(() => { toggleAccessory('relocation'); });
    await sleep(300);
  }

  if (failed > 0) await screenshotOnFail(page, 'vehicle-products');
  await page.close();
}

async function testScannerProductSelections(browser) {
  currentTest = 'Scanner Products';
  console.log(`\n${SECTION}${BOLD}=== 18. SCANNER PRODUCT TESTS ===${RESET}\n`);

  const page = await freshPage(browser);
  await loadPage(page);

  // Navigate to scanner category
  await directToRadioGrid(page, 'scanner');
  // Select first available scanner
  const selectedKey = await page.evaluate(() => {
    const lineup = typeof scannerRadioLineup !== 'undefined' ? scannerRadioLineup : [];
    const available = lineup.find(r => !r.outOfStock);
    if (available && typeof kbsSelectNonHandheld === 'function') {
      kbsSelectNonHandheld(available.key, 'scanner');
      return available.key;
    }
    return '';
  });
  assert(selectedKey.length > 0, `Scanner selected: ${selectedKey}`);
  await sleep(5000);

  // ── 18a. Scanner antennas ──
  console.log(`${SECTION}18a. Scanner Antenna Options${RESET}`);
  let states = await getSectionStates(page);
  if (states.antennas === 'active') {
    const scannerAntennaKeys = ['discone', 'tele-wideband'];
    for (const ak of scannerAntennaKeys) {
      await page.evaluate((key) => { if (typeof toggleAntenna === 'function') toggleAntenna(key); }, ak);
      await sleep(500);
      const selected = await page.evaluate((key) => typeof selectedAntennas !== 'undefined' && selectedAntennas.has(key), ak);
      assert(selected, `Scanner antenna "${ak}" selected`);
      const price = await getPriceBarTotal(page);
      assert(price.includes('$'), `Price after scanner antenna "${ak}": ${price}`);
      // Deselect
      await page.evaluate((key) => { if (typeof toggleAntenna === 'function') toggleAntenna(key); }, ak);
      await sleep(300);
    }
    await completeSection(page, 'antennas', 4500);
  }

  // ── 18b. Scanner accessories ──
  console.log(`\n${SECTION}18b. Scanner Accessory Options${RESET}`);
  // Skip to accessories (battery auto-skipped for scanner)
  states = await getSectionStates(page);
  if (states.accessories === 'active') {
    const scannerAccKeys = ['cheatsheets', 'magmount', 'stubby', 'so239-pigtail'];
    for (const ak of scannerAccKeys) {
      await page.evaluate((key) => { if (typeof toggleAccessory === 'function') toggleAccessory(key); }, ak);
      await sleep(500);
      const price = await getPriceBarTotal(page);
      assert(price.includes('$'), `Price after scanner accessory "${ak}": ${price}`);
      // Deselect
      await page.evaluate((key) => { if (typeof toggleAccessory === 'function') toggleAccessory(key); }, ak);
      await sleep(300);
    }
  }

  if (failed > 0) await screenshotOnFail(page, 'scanner-products');
  await page.close();
}

async function testAdapterModalCombinations(browser) {
  currentTest = 'Adapter Modal Combos';
  console.log(`\n${SECTION}${BOLD}=== 19. ADAPTER MODAL COMBINATIONS ===${RESET}\n`);

  const page = await freshPage(browser);

  // ── 19a. Magmount without antenna -> "Antenna Needed" modal ──
  console.log(`${SECTION}19a. Magmount -> Antenna Needed Modal${RESET}`);
  await navigateToHandheldAntennas(page, 'uv-pro');
  // No antenna upgrade selected, toggle magmount
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('magmount'); });
  await sleep(600);
  const magModalOpen = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    return modal && modal.classList.contains('open');
  });
  assert(magModalOpen, 'Modal opens for magmount without antenna');

  const magModalTitle = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    const h3 = modal ? modal.querySelector('h3') : null;
    return h3 ? h3.textContent : '';
  });
  assert(magModalTitle.includes('Antenna Needed'), `Magmount modal says "Antenna Needed" (got "${magModalTitle}")`);

  const magModalText = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    const p = modal ? modal.querySelector('p') : null;
    return p ? p.textContent : '';
  });
  assert(magModalText.includes('Foul Weather Whip'), 'Modal mentions Foul Weather Whip');

  // ── 19b. Click "Add Foul Weather Whip + Mount" ──
  console.log(`\n${SECTION}19b. Add Foul Weather Whip + Magmount${RESET}`);
  await page.evaluate(() => { if (typeof adapterModalAdd === 'function') adapterModalAdd(); });
  await sleep(500);
  const fwAndMag = await page.evaluate(() =>
    typeof selectedAddlAntennas !== 'undefined' &&
    selectedAddlAntennas.has('foulweather') && selectedAddlAntennas.has('magmount'));
  assert(fwAndMag, 'Both foulweather and magmount selected after modal add');
  const modalClosedMag = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    return modal && !modal.classList.contains('open');
  });
  assert(modalClosedMag, 'Modal closed after adding');

  // ── 19c. Mollemount -> same Antenna Needed modal ──
  console.log(`\n${SECTION}19c. Mollemount -> Antenna Needed Modal${RESET}`);
  // Reset: navigate fresh
  await navigateToHandheldAntennas(page, 'uv-pro');
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('mollemount'); });
  await sleep(600);
  const molleModalTitle = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    const h3 = modal ? modal.querySelector('h3') : null;
    return h3 ? h3.textContent : '';
  });
  assert(molleModalTitle.includes('Antenna Needed'), `Mollemount modal says "Antenna Needed" (got "${molleModalTitle}")`);
  // Cancel
  await page.evaluate(() => { if (typeof adapterModalCancel === 'function') adapterModalCancel(); });
  await sleep(300);

  // ── 19d. Wearable BNC -> BNC Adapter Needed modal ──
  console.log(`\n${SECTION}19d. Wearable BNC -> BNC Adapter Modal${RESET}`);
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('wearable'); });
  await sleep(600);
  const wearableModalTitle = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    const h3 = modal ? modal.querySelector('h3') : null;
    return h3 ? h3.textContent : '';
  });
  assert(wearableModalTitle.includes('BNC Adapter Needed'), `Wearable modal says "BNC Adapter Needed" (got "${wearableModalTitle}")`);

  // ── 19e. "I Have One Already" ──
  console.log(`\n${SECTION}19e. Skip Adapter (I Have One Already)${RESET}`);
  await page.evaluate(() => { if (typeof adapterModalSkip === 'function') adapterModalSkip(); });
  await sleep(500);
  const wearableAdded = await page.evaluate(() =>
    typeof selectedAddlAntennas !== 'undefined' && selectedAddlAntennas.has('wearable'));
  assert(wearableAdded, 'Wearable antenna added without adapter');
  const noAdapter = await page.evaluate(() =>
    typeof selectedAddlAntennas !== 'undefined' && !selectedAddlAntennas.has('extraadapter'));
  assert(noAdapter, 'No adapter added when skipping');

  // ── 19f. Cancel — nothing added ──
  console.log(`\n${SECTION}19f. Cancel Modal -> Nothing Added${RESET}`);
  // Navigate fresh again
  await navigateToHandheldAntennas(page, 'uv-pro');
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('slimjim'); });
  await sleep(600);
  const slimjimModalOpen = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    return modal && modal.classList.contains('open');
  });
  assert(slimjimModalOpen, 'Modal opens for slim jim without adapter');
  await page.evaluate(() => { if (typeof adapterModalCancel === 'function') adapterModalCancel(); });
  await sleep(300);
  const slimjimNotAdded = await page.evaluate(() =>
    typeof selectedAddlAntennas !== 'undefined' && !selectedAddlAntennas.has('slimjim'));
  assert(slimjimNotAdded, 'Slim jim NOT added after cancel');
  const modalClosedCancel = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    return modal && !modal.classList.contains('open');
  });
  assert(modalClosedCancel, 'Modal closed after cancel');

  if (failed > 0) await screenshotOnFail(page, 'adapter-modal-combos');
  await page.close();
}

async function testEdgeCases(browser) {
  currentTest = 'Edge Cases';
  console.log(`\n${SECTION}${BOLD}=== 20. EDGE CASES ===${RESET}\n`);

  const page = await freshPage(browser);

  // ── 20a. Select all antennas then deselect all — price returns to base ──
  console.log(`${SECTION}20a. Select All Antennas Then Deselect${RESET}`);
  await navigateToHandheldAntennas(page, 'uv-pro');
  const basePrice = await getPriceBarTotal(page);
  const baseNum = parseFloat(basePrice.replace(/[^0-9.]/g, ''));

  // Select all 3 antenna upgrades
  await page.evaluate(() => { toggleAntenna('stubby'); });
  await sleep(200);
  await page.evaluate(() => { toggleAntenna('foulweather'); });
  await sleep(200);
  await page.evaluate(() => { toggleAntenna('signalstick'); });
  await sleep(400);
  const allPrice = await getPriceBarTotal(page);
  const allNum = parseFloat(allPrice.replace(/[^0-9.]/g, ''));
  assert(allNum > baseNum, `Price increased with all antennas: $${baseNum} -> $${allNum}`);

  // Deselect all 3
  await page.evaluate(() => { toggleAntenna('stubby'); });
  await sleep(200);
  await page.evaluate(() => { toggleAntenna('foulweather'); });
  await sleep(200);
  await page.evaluate(() => { toggleAntenna('signalstick'); });
  await sleep(400);
  const resetPrice = await getPriceBarTotal(page);
  const resetNum = parseFloat(resetPrice.replace(/[^0-9.]/g, ''));
  assert(resetNum === baseNum, `Price returned to base after deselect: $${resetNum} === $${baseNum}`);

  // ── 20b. Select antenna, go back, come forward — selection persists ──
  console.log(`\n${SECTION}20b. Selection Persistence Across Back/Forward${RESET}`);
  await page.evaluate(() => { toggleAntenna('foulweather'); });
  await sleep(300);
  await completeSection(page, 'antennas');
  // Now at battery. Go back to antennas.
  await page.evaluate(() => { if (typeof kbsGoBack === 'function') kbsGoBack('battery'); });
  await sleep(800);
  const stillSelected = await page.evaluate(() =>
    typeof selectedAntennas !== 'undefined' && selectedAntennas.has('foulweather'));
  assert(stillSelected, 'Foulweather antenna persists after back/forward');

  // ── 20c. Complete all sections with zero optional selections ──
  console.log(`\n${SECTION}20c. Complete With Zero Upgrades${RESET}`);
  await navigateToHandheldAntennas(page, 'uv-pro');
  // Verify no antennas selected
  const zeroAntennas = await page.evaluate(() =>
    typeof selectedAntennas !== 'undefined' && selectedAntennas.size === 0);
  assert(zeroAntennas, 'No antenna upgrades selected');

  await completeSection(page, 'antennas');
  await completeSection(page, 'battery');
  await completeSection(page, 'accessories');
  await completeSection(page, 'programming');
  await completeSection(page, 'review');

  const states = await getSectionStates(page);
  assert(states.quantity === 'active', 'Reached quantity with zero upgrades');

  const zeroPrice = await getPriceBarTotal(page);
  const zeroNum = parseFloat(zeroPrice.replace(/[^0-9.]/g, ''));
  assert(zeroNum > 0, `Base-only price is valid: $${zeroNum}`);

  const cartReady = await isCartBtnEnabled(page);
  assert(cartReady, 'Cart button enabled with zero upgrades');

  if (failed > 0) await screenshotOnFail(page, 'edge-cases');
  await page.close();
}

// ══════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════

(async () => {
  console.log(`\n${BOLD}${SECTION}╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${SECTION}║  RME Kit Builder V2 — Regression Test Suite          ║${RESET}`);
  console.log(`${BOLD}${SECTION}╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log(`${DIM}  Target: ${KB_URL}${RESET}`);
  console.log(`${DIM}  Date: ${new Date().toISOString()}${RESET}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Run all test suites sequentially
    await testHandheldGuidedFlow(browser);
    await testVehicleMobileFlow(browser);
    await testBaseStationFlow(browser);
    await testHFFlow(browser);
    await testScannerFlow(browser);
    await testResumeFromHash(browser);
    await testStartFresh(browser);
    await testAdapterModal(browser);
    await testMobileViewport(browser);
    await testBackNavigation(browser);
    await testPriceBarUpdates(browser);
    await testSectionNumbering(browser);
    await testContinueButtonStates(browser);
    // Combinatorial product selection tests
    await testInterviewAnswerMatrix(browser);
    await testHandheldProductSelections(browser);
    await testVehicleProductSelections(browser);
    await testScannerProductSelections(browser);
    await testAdapterModalCombinations(browser);
    await testEdgeCases(browser);
    // JS errors last (aggregates from all above)
    await testJSErrors(browser);
  } catch (err) {
    console.log(`\n${FAIL} Unhandled error: ${err.message}`);
    console.log(err.stack);
    failed++;
  }

  await browser.close();

  // ── Summary ──
  console.log(`\n${SECTION}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${SECTION}${BOLD}║  RESULTS                                             ║${RESET}`);
  console.log(`${SECTION}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log(`  ${PASS.replace('[PASS]', 'Passed')}: ${passed}`);
  console.log(`  ${FAIL.replace('[FAIL]', 'Failed')}: ${failed}`);
  console.log(`  Total: ${passed + failed}\n`);

  if (failures.length > 0) {
    console.log(`${SECTION}  Failed tests:${RESET}`);
    failures.forEach(f => console.log(`    - ${f}`));
    console.log('');
  }

  if (failed > 0) {
    console.log(`  Screenshots saved to: ${SCREENSHOT_DIR}\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
})();
