/**
 * Comms Compass - Test Suite F: UI/Layout Assertions
 *
 * Tests UI layout on desktop (1280x900) AND mobile (375x812, isMobile: true)
 * for 3 representative flows: Handheld UV-5R, Vehicle UV-50PRO, Scanner SDS200
 *
 * Checks at each active section:
 *   1. Button height consistency
 *   2. Card text/checkbox overlap
 *   3. Price bar position (fixed, visible)
 *   4. Touch target minimum (44px)
 *   5. No horizontal overflow
 *
 * Run:
 *   node test-suite-f.js
 *   node test-suite-f.js --desktop-only
 *   node test-suite-f.js --mobile-only
 *
 * Screenshots: _screenshots/suite-f/
 * Results:     _screenshots/suite-f/results.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// -- Config --
const KB_URL = 'https://staging12.radiomadeeasy.com/comms-compass/';
const PASS_ICON = '\x1b[32m[PASS]\x1b[0m';
const FAIL_ICON = '\x1b[31m[FAIL]\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// -- CLI args --
const args = process.argv.slice(2);
const hasFlag = name => args.includes(`--${name}`);
const desktopOnly = hasFlag('desktop-only');
const mobileOnly = hasFlag('mobile-only');

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812, isMobile: true };

// -- Test tracking --
let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];
const suiteResults = [];

// -- 3 representative flows --
const FLOWS = [
  {
    name: 'Handheld UV-5R',
    category: 'handheld',
    categoryLabel: 'Handheld',
    radioMatch: 'UV-5R',
    hasMounting: false,
    hasBattery: true,
    hasColorPicker: false,
    // Sections to walk through after radio selection
    sections: ['antennas', 'battery', 'accessories', 'programming', 'review', 'quantity']
  },
  {
    name: 'Vehicle UV-50PRO',
    category: 'mobile',
    categoryLabel: 'Vehicle / Mobile',
    radioMatch: 'UV-50PRO',
    hasMounting: true,
    hasBattery: true,
    hasColorPicker: false,
    sections: ['mounting', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity']
  },
  {
    name: 'Scanner SDS200',
    category: 'scanner',
    categoryLabel: 'Scanner',
    radioMatch: 'SDS200',
    hasMounting: false,
    hasBattery: false,
    hasColorPicker: false,
    sections: ['antennas', 'accessories', 'programming', 'review', 'quantity']
  }
];

// -- Screenshot helpers --
const SCREENSHOT_BASE = path.join(__dirname, '_screenshots', 'suite-f');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeName(str) {
  return str.replace(/[^a-z0-9_-]/gi, '_').substring(0, 60);
}

// -- Core helpers (matching test-comms-compass.js) --

async function dismissPopup(page) {
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, div[role="button"]');
    for (const b of btns) {
      if (b.textContent.trim().toUpperCase().includes('NO, THANKS') ||
          b.textContent.trim().toUpperCase().includes('NO THANKS')) {
        b.click(); return;
      }
    }
    const overlay = document.querySelector('.mc-closeModal, .mc-modal-close, [data-action="close"]');
    if (overlay) overlay.click();
  });
}

async function freshLoad(page, url) {
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  await client.detach();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
  await sleep(2000);
  await dismissPopup(page);
  await sleep(500);
}

async function waitForSection(page, name, timeout) {
  timeout = timeout || 15000;
  await page.waitForFunction(
    n => {
      const el = document.getElementById('sec-' + n);
      return el && el.classList.contains('kb-section--active');
    },
    { timeout },
    name
  );
  await sleep(400);
  const hasContent = await page.evaluate(n => {
    const el = document.getElementById('sec-' + n);
    if (!el) return false;
    const content = el.querySelector('.kb-section__content');
    return content && content.offsetHeight > 10 && content.innerHTML.trim().length > 20;
  }, name);
  return hasContent;
}

async function clickContinue(page, sectionName) {
  await page.evaluate(secName => {
    const sec = document.getElementById('sec-' + secName);
    if (!sec) return;
    const btns = sec.querySelectorAll('.kb-section__actions .kb-btn--primary');
    for (const btn of btns) {
      if (btn.offsetParent !== null && !btn.disabled) { btn.click(); break; }
    }
  }, sectionName);
}

async function screenshot(page, dir, stepNum, desc) {
  ensureDir(dir);
  const fname = `${String(stepNum).padStart(2, '0')}-${safeName(desc)}.png`;
  const fpath = path.join(dir, fname);
  await page.screenshot({ path: fpath, fullPage: false });
  return fname;
}

async function screenshotFull(page, dir, stepNum, desc) {
  ensureDir(dir);
  const fname = `${String(stepNum).padStart(2, '0')}-${safeName(desc)}-FAIL.png`;
  const fpath = path.join(dir, fname);
  await page.screenshot({ path: fpath, fullPage: true });
  return fname;
}

// -- Navigate to a specific radio (Direct path) --
async function navigateToRadio(page, flow) {
  // Skip email
  await waitForSection(page, 'email');
  await page.evaluate(() => {
    const sec = document.getElementById('sec-email');
    if (!sec) return;
    const btns = sec.querySelectorAll('button, a, .kb-btn, .kb-btn--secondary, .kb-btn--link');
    for (const b of btns) {
      const txt = b.textContent.trim().toUpperCase();
      if (txt.includes('SKIP') || txt.includes('NO THANKS') || txt.includes('NO, THANKS')) {
        b.click(); return;
      }
    }
  });

  // Wait for interview, click "I Know What I Want"
  await waitForSection(page, 'interview');
  await page.evaluate(() => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return;
    const btns = sec.querySelectorAll('button, .kb-btn, .iq-option, [class*="interview"]');
    for (const b of btns) {
      if (b.textContent.trim().includes('I Know What I Want')) {
        b.click(); return;
      }
    }
    const allBtns = sec.querySelectorAll('[role="button"], a, div[class*="btn"]');
    for (const b of allBtns) {
      if (b.textContent.trim().includes('I Know What I Want')) {
        b.click(); return;
      }
    }
  });

  await sleep(500);

  // Select category
  await page.waitForSelector('.kbs-iq-opt', { visible: true, timeout: 10000 });
  const catKey = flow.category === 'mobile' ? 'vehicle' : flow.category;
  await page.evaluate(key => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) {
      const onclick = opt.getAttribute('onclick') || '';
      if (onclick.includes('"' + key + '"')) { opt.click(); return; }
    }
    const labels = { handheld: 'Handheld', vehicle: 'Vehicle', base: 'Base', hf: 'HF', scanner: 'Scanner' };
    const label = labels[key] || key;
    for (const opt of opts) {
      if (opt.textContent.includes(label)) { opt.click(); return; }
    }
  }, catKey);

  await sleep(300);

  // Click Direct NEXT
  await page.waitForFunction(() => {
    const btn = document.getElementById('kbs-direct-next');
    return btn && !btn.disabled;
  }, { timeout: 5000 });
  await page.evaluate(() => {
    const btn = document.getElementById('kbs-direct-next');
    if (btn) btn.click();
  });

  // Wait for radio section, select radio
  await waitForSection(page, 'radio');
  await page.waitForSelector('.radio-pick', { visible: true, timeout: 10000 });
  await page.evaluate(radioMatch => {
    const cards = document.querySelectorAll('.radio-pick:not(.radio-pick--oos)');
    for (const card of cards) {
      const h4 = card.querySelector('h4');
      const text = h4 ? h4.textContent.trim() : '';
      if (text === radioMatch) { card.click(); return; }
    }
    for (const card of cards) {
      const h4 = card.querySelector('h4');
      const text = h4 ? h4.textContent.trim() : card.textContent.trim();
      if (text.includes(radioMatch)) { card.click(); return; }
    }
  }, flow.radioMatch);

  // Wait for first section after radio
  const firstSection = flow.sections[0];
  await waitForSection(page, firstSection);
}

// -- UI Layout Assertions --

async function checkButtonHeightConsistency(page, sectionName) {
  return await page.evaluate(secName => {
    const sec = document.getElementById('sec-' + secName);
    if (!sec) return { pass: true, detail: 'Section not found, skipped' };
    const actions = sec.querySelector('.kb-section__actions');
    if (!actions) return { pass: true, detail: 'No actions container' };
    const btns = actions.querySelectorAll('.kb-btn');
    if (btns.length === 0) return { pass: true, detail: 'No buttons found' };
    const heights = [];
    for (const btn of btns) {
      if (btn.offsetParent !== null) heights.push(btn.offsetHeight);
    }
    if (heights.length <= 1) return { pass: true, detail: `Only ${heights.length} visible button(s)` };
    const allSame = heights.every(h => h === heights[0]);
    return {
      pass: allSame,
      detail: allSame
        ? `All ${heights.length} buttons: ${heights[0]}px`
        : `Heights differ: [${heights.join(', ')}]px`
    };
  }, sectionName);
}

async function checkCardTextOverlap(page, sectionName) {
  return await page.evaluate(secName => {
    const sec = document.getElementById('sec-' + secName);
    if (!sec) return { pass: true, detail: 'Section not found, skipped' };
    const cards = sec.querySelectorAll('.opt-card');
    const issues = [];
    for (const card of cards) {
      if (card.offsetParent === null) continue; // not visible
      const body = card.querySelector('.oc-body');
      const check = card.querySelector('.oc-check');
      if (!body || !check) continue;
      const bodyRect = body.getBoundingClientRect();
      const checkRect = check.getBoundingClientRect();
      // Check horizontal overlap: body right > check left (with 2px tolerance)
      if (bodyRect.right > checkRect.left + 2) {
        const cardName = (body.querySelector('h4') || body.querySelector('.oc-name') || {}).textContent || 'unknown';
        issues.push(`"${cardName.trim()}": body.right=${Math.round(bodyRect.right)} > check.left=${Math.round(checkRect.left)}`);
      }
    }
    return {
      pass: issues.length === 0,
      detail: issues.length === 0
        ? `${cards.length} cards checked, no overlap`
        : `Overlap in: ${issues.join('; ')}`
    };
  }, sectionName);
}

async function checkPriceBarPosition(page) {
  return await page.evaluate(() => {
    const bar = document.getElementById('kb-scroll-price-bar');
    if (!bar) return { pass: false, detail: 'Price bar element not found' };
    const style = window.getComputedStyle(bar);
    const isFixed = style.position === 'fixed' || style.position === 'sticky';
    const isVisible = style.display !== 'none' && bar.offsetHeight > 0;
    return {
      pass: isFixed && isVisible,
      detail: `position: ${style.position}, display: ${style.display}, height: ${bar.offsetHeight}px`
    };
  });
}

async function checkTouchTargetMinimum(page, sectionName) {
  return await page.evaluate(secName => {
    const sec = document.getElementById('sec-' + secName);
    if (!sec) return { pass: true, detail: 'Section not found, skipped' };
    const btns = sec.querySelectorAll('.kb-btn');
    const tooSmall = [];
    for (const btn of btns) {
      if (btn.offsetParent === null) continue; // not visible
      if (btn.offsetHeight < 44) {
        tooSmall.push(`"${btn.textContent.trim().substring(0, 30)}": ${btn.offsetHeight}px`);
      }
    }
    return {
      pass: tooSmall.length === 0,
      detail: tooSmall.length === 0
        ? `All visible .kb-btn >= 44px`
        : `Too small: ${tooSmall.join('; ')}`
    };
  }, sectionName);
}

async function checkNoHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return {
      pass: sw <= cw,
      detail: `scrollWidth=${sw}, clientWidth=${cw}` + (sw > cw ? ` (overflow: ${sw - cw}px)` : '')
    };
  });
}

// -- Run all 5 assertions for a given section --
async function runLayoutAssertions(page, sectionName, flowName, vpLabel, dir, stepCounter, steps) {
  const assertions = [
    { name: 'Button height consistency', fn: () => checkButtonHeightConsistency(page, sectionName) },
    { name: 'Card text/checkbox overlap', fn: () => checkCardTextOverlap(page, sectionName) },
    { name: 'Price bar position fixed', fn: () => checkPriceBarPosition(page) },
    { name: 'Touch target >= 44px', fn: () => checkTouchTargetMinimum(page, sectionName) },
    { name: 'No horizontal overflow', fn: () => checkNoHorizontalOverflow(page) }
  ];

  for (const assertion of assertions) {
    stepCounter.n++;
    const stepIdx = stepCounter.n;
    const fullName = `[${sectionName}] ${assertion.name}`;
    try {
      const result = await assertion.fn();
      const ssFile = await screenshot(page, dir, stepIdx, `${sectionName}-${safeName(assertion.name)}`);
      steps.push({ name: fullName, status: result.pass ? 'pass' : 'fail', screenshot: ssFile, detail: result.detail });

      if (result.pass) {
        console.log(`      ${PASS_ICON} ${fullName} -- ${DIM}${result.detail}${RESET}`);
        totalPassed++;
      } else {
        console.log(`      ${FAIL_ICON} ${fullName} -- ${result.detail}`);
        totalFailed++;
        allFailures.push(`[${vpLabel}] [${flowName}] ${fullName}: ${result.detail}`);
        await screenshotFull(page, dir, stepIdx, `${sectionName}-${safeName(assertion.name)}`);
      }
    } catch (err) {
      const ssFile = await screenshot(page, dir, stepIdx, `${sectionName}-${safeName(assertion.name)}`).catch(() => 'error.png');
      steps.push({ name: fullName, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`      ${FAIL_ICON} ${fullName} -- ERROR: ${err.message}`);
      totalFailed++;
      allFailures.push(`[${vpLabel}] [${flowName}] ${fullName}: ${err.message}`);
    }
  }
}

// -- Run one flow at one viewport --
async function testFlow(browser, flow, viewport) {
  const vpLabel = viewport.isMobile ? 'mobile' : 'desktop';
  const dir = path.join(SCREENSHOT_BASE, `${vpLabel}-${safeName(flow.name)}`);
  ensureDir(dir);

  console.log(`\n  ${CYAN}${BOLD}[${vpLabel}] ${flow.name}${RESET}`);

  const jsErrors = [];
  const steps = [];
  const stepCounter = { n: 0 };
  let flowPassed = 0;
  let flowFailed = 0;

  const page = await browser.newPage();
  await page.setViewport(viewport.isMobile
    ? { width: viewport.width, height: viewport.height, isMobile: true, hasTouch: true }
    : { width: viewport.width, height: viewport.height }
  );
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  try {
    // Navigate to radio
    console.log(`    ${DIM}Navigating: fresh load -> skip email -> direct path -> ${flow.categoryLabel} -> ${flow.radioMatch}${RESET}`);
    await freshLoad(page, KB_URL);
    await navigateToRadio(page, flow);

    stepCounter.n++;
    const navSS = await screenshot(page, dir, stepCounter.n, 'navigation-complete');
    steps.push({ name: 'Navigate to first section', status: 'pass', screenshot: navSS });
    console.log(`    ${PASS_ICON} Navigation complete, starting layout checks`);
    totalPassed++;

    // Walk through each section and run layout assertions
    for (let i = 0; i < flow.sections.length; i++) {
      const sec = flow.sections[i];
      const nextSec = flow.sections[i + 1] || null;

      console.log(`    ${BOLD}Section: ${sec}${RESET}`);

      // Verify section is active
      try {
        await waitForSection(page, sec, 15000);
      } catch (err) {
        stepCounter.n++;
        const ssFile = await screenshot(page, dir, stepCounter.n, `${sec}-not-active`).catch(() => 'error.png');
        steps.push({ name: `[${sec}] Section active`, status: 'fail', screenshot: ssFile, error: err.message });
        console.log(`      ${FAIL_ICON} Section ${sec} did not become active: ${err.message}`);
        totalFailed++;
        allFailures.push(`[${vpLabel}] [${flow.name}] Section ${sec} not active: ${err.message}`);
        break; // Can't continue if a section doesn't activate
      }

      // Run the 5 layout assertions
      await runLayoutAssertions(page, sec, flow.name, vpLabel, dir, stepCounter, steps);

      // Click Continue to advance (except quantity, which is last)
      if (sec !== 'quantity' && nextSec) {
        await clickContinue(page, sec);
        await sleep(300);
      }
    }

  } catch (err) {
    stepCounter.n++;
    const ssFile = await screenshot(page, dir, stepCounter.n, 'fatal-error').catch(() => 'error.png');
    await screenshotFull(page, dir, stepCounter.n, 'fatal-error').catch(() => {});
    steps.push({ name: 'Fatal error', status: 'fail', screenshot: ssFile, error: err.message });
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    totalFailed++;
    allFailures.push(`[${vpLabel}] [${flow.name}] FATAL: ${err.message}`);
  }

  await page.close();

  // Count pass/fail for this flow
  for (const s of steps) {
    if (s.status === 'pass') flowPassed++;
    else flowFailed++;
  }

  suiteResults.push({
    name: flow.name,
    viewport: vpLabel,
    status: flowFailed === 0 ? 'pass' : 'fail',
    passed: flowPassed,
    failed: flowFailed,
    steps,
    jsErrors: jsErrors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'))
  });
}

// -- Main --
async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Comms Compass Test Suite F${RESET}`);
  console.log(`${BOLD} UI/Layout Assertions${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} URL: ${KB_URL}${RESET}`);
  console.log(`${DIM} Desktop: ${!mobileOnly} | Mobile: ${!desktopOnly}${RESET}`);
  console.log(`${DIM} Flows: ${FLOWS.map(f => f.name).join(', ')}${RESET}`);
  console.log();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const viewports = [];
  if (!mobileOnly) viewports.push({ label: 'desktop', vp: DESKTOP });
  if (!desktopOnly) viewports.push({ label: 'mobile', vp: MOBILE });

  for (const { label, vp } of viewports) {
    console.log(`\n${BOLD}${CYAN}-- Viewport: ${label} (${vp.width}x${vp.height}) --${RESET}`);

    for (const flow of FLOWS) {
      await testFlow(browser, flow, vp);
    }
  }

  await browser.close();

  // -- Save results JSON --
  ensureDir(SCREENSHOT_BASE);
  const resultsJson = {
    timestamp: new Date().toISOString(),
    viewport: desktopOnly ? 'desktop' : mobileOnly ? 'mobile' : 'both',
    url: KB_URL,
    suites: suiteResults,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      failureList: allFailures
    }
  };

  const resultsPath = path.join(SCREENSHOT_BASE, 'results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(resultsJson, null, 2));

  // -- Summary --
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} RESULTS SUMMARY${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`  Total assertions: ${totalPassed + totalFailed}`);
  console.log(`  ${PASS_ICON} Passed: ${totalPassed}`);
  console.log(`  ${FAIL_ICON} Failed: ${totalFailed}`);

  if (allFailures.length > 0) {
    console.log(`\n${BOLD}  Failures:${RESET}`);
    allFailures.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
  }

  console.log(`\n  Results: ${resultsPath}`);
  console.log(`  Screenshots: ${SCREENSHOT_BASE}`);

  // Per-flow summary
  console.log(`\n${BOLD}  Per-flow results:${RESET}`);
  for (const s of suiteResults) {
    const icon = s.status === 'pass' ? PASS_ICON : FAIL_ICON;
    console.log(`    ${icon} [${s.viewport}] ${s.name} (${s.passed}/${s.passed + s.failed})`);
  }
  console.log();

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
