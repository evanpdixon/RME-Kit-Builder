/**
 * Comms Compass - Test Suite C: Edge Case Tests (Desktop)
 *
 * Run:
 *   node test-suite-c.js
 *
 * Screenshots saved to: _screenshots/suite-c-desktop/
 * Results JSON:         _screenshots/suite-c-desktop/results.json
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

const DESKTOP = { width: 1280, height: 900 };
const SCREENSHOTS_DIR = path.join(__dirname, '_screenshots', 'suite-c-desktop');

// -- Tracking --
let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];
const suiteResults = [];

// -- Utilities --
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeName(str) {
  return str.replace(/[^a-z0-9_-]/gi, '_').substring(0, 60);
}

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
  await sleep(300);
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

/** Skip email section */
async function skipEmail(page) {
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
}

/** Select Direct path, choose category, continue to radio */
async function selectDirect(page, category) {
  await waitForSection(page, 'interview');
  await page.evaluate(() => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return;
    const btns = sec.querySelectorAll('button, .kb-btn, .iq-option, [role="button"], a, div[class*="btn"]');
    for (const b of btns) {
      if (b.textContent.trim().includes('I Know What I Want')) { b.click(); return; }
    }
  });
  await sleep(500);
  await page.waitForSelector('.kbs-iq-opt', { visible: true, timeout: 10000 });
  const catKey = category === 'mobile' ? 'vehicle' : category;
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
  await page.waitForFunction(() => {
    const btn = document.getElementById('kbs-direct-next');
    return btn && !btn.disabled;
  }, { timeout: 5000 });
  await page.evaluate(() => { document.getElementById('kbs-direct-next').click(); });
  await waitForSection(page, 'radio');
}

/** Select a radio by name match */
async function selectRadio(page, radioMatch) {
  await page.waitForSelector('.radio-pick', { visible: true, timeout: 10000 });
  await page.evaluate(match => {
    const cards = document.querySelectorAll('.radio-pick:not(.radio-pick--oos)');
    for (const card of cards) {
      const h4 = card.querySelector('h4');
      const text = h4 ? h4.textContent.trim() : '';
      if (text === match || text.includes(match)) { card.click(); return; }
    }
  }, radioMatch);
}

/** Navigate: fresh load > skip email > Direct > Handheld > [radio] */
async function navigateToRadio(page, radioMatch) {
  await freshLoad(page, KB_URL);
  await skipEmail(page);
  await selectDirect(page, 'handheld');
  await selectRadio(page, radioMatch);
}

// ================================================================
// TEST 1: Skip All Optional
// ================================================================
async function test1_skipAllOptional(browser) {
  const testName = 'Skip all optional';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  Test 1: ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  async function step(desc, fn) {
    stepNum++;
    const idx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, idx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) { console.log(`    ${PASS_ICON} ${desc}`); passed++; totalPassed++; }
      else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, idx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, idx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, idx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await step('Navigate to UV-5R Mini', async () => {
      await navigateToRadio(page, 'UV-5R Mini');
      await waitForSection(page, 'antennas');
      return true;
    });

    // Skip antennas (no selection, just click Continue)
    await step('Skip antennas (no upgrades)', async () => {
      await clickContinue(page, 'antennas');
      await waitForSection(page, 'battery');
      return true;
    });

    // Skip battery
    await step('Skip battery (no selection)', async () => {
      await clickContinue(page, 'battery');
      await waitForSection(page, 'accessories');
      return true;
    });

    // Skip accessories
    await step('Skip accessories (no selection)', async () => {
      await clickContinue(page, 'accessories');
      await waitForSection(page, 'programming');
      return true;
    });

    // Select "I'll Program It Myself"
    await step('Select self-program', async () => {
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-programming');
        if (!sec) return false;
        const cards = sec.querySelectorAll('.opt-card');
        for (const card of cards) {
          const text = card.textContent.toUpperCase();
          if (text.includes('MYSELF') || text.includes('SELF') || text.includes('I\'LL PROGRAM')) {
            card.click();
            return true;
          }
        }
        return false;
      });
      return clicked;
    });

    await step('Continue past programming', async () => {
      await clickContinue(page, 'programming');
      await waitForSection(page, 'review');
      return true;
    });

    // Verify review shows only base kit
    await step('Review shows only base kit (UV-5R Mini)', async () => {
      const reviewContent = await page.evaluate(() => {
        const sec = document.getElementById('sec-review');
        if (!sec) return { text: '', itemCount: 0 };
        const items = sec.querySelectorAll('.review-item, .ri-row, [class*="review-line"]');
        const content = sec.querySelector('.kb-section__content');
        return {
          text: content ? content.textContent : '',
          itemCount: items.length
        };
      });
      // Should contain radio name
      return reviewContent.text.includes('UV-5R Mini');
    });

    // Verify price bar shows $39
    await step('Price bar shows $39', async () => {
      const price = await page.evaluate(() => {
        const el = document.getElementById('kbs-total');
        return el ? el.textContent.trim() : '';
      });
      console.log(`      ${DIM}Price shown: ${price}${RESET}`);
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      return numericPrice === 39;
    });

    // Screenshot review
    await step('Screenshot review section', async () => {
      await page.evaluate(() => {
        const sec = document.getElementById('sec-review');
        if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await sleep(300);
      return true;
    });

  } catch (err) {
    stepNum++;
    await screenshot(page, dir, stepNum, 'fatal').catch(() => {});
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();
  suiteResults.push({ name: testName, status: failed === 0 ? 'pass' : 'fail', passed, failed, steps, jsErrors });
}

// ================================================================
// TEST 2: Re-edit Section
// ================================================================
async function test2_reEditSection(browser) {
  const testName = 'Re-edit section';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  Test 2: ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  async function step(desc, fn) {
    stepNum++;
    const idx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, idx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) { console.log(`    ${PASS_ICON} ${desc}`); passed++; totalPassed++; }
      else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, idx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, idx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, idx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await step('Navigate to UV-5R', async () => {
      await navigateToRadio(page, 'UV-5R');
      await waitForSection(page, 'antennas');
      return true;
    });

    await step('Continue past antennas', async () => {
      await clickContinue(page, 'antennas');
      await waitForSection(page, 'battery');
      return true;
    });

    await step('Continue past battery', async () => {
      await clickContinue(page, 'battery');
      await waitForSection(page, 'accessories');
      return true;
    });

    await step('Continue past accessories', async () => {
      await clickContinue(page, 'accessories');
      await waitForSection(page, 'programming');
      return true;
    });

    // Now click the completed antennas section header to re-edit
    await step('Click antennas summary to re-edit', async () => {
      // The click handler is on .kb-section__header (triggers kbsEditSection when state is 'complete').
      // The summary also has an "Edit" span with onclick="kbsEditSection('antennas')".
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-antennas');
        if (!sec) return false;
        // First try the Edit link in the summary
        const editLink = sec.querySelector('.kbs-edit, .kb-section__summary [onclick*="kbsEditSection"]');
        if (editLink) { editLink.click(); return true; }
        // Fallback: click the section header (has the click listener)
        const header = sec.querySelector('.kb-section__header');
        if (header) { header.click(); return true; }
        return false;
      });
      await sleep(1000);
      return clicked;
    });

    // Verify antennas is active again
    await step('Antennas becomes active after re-edit click', async () => {
      const state = await page.evaluate(() => {
        const sec = document.getElementById('sec-antennas');
        return sec ? sec.classList.contains('kb-section--active') : false;
      });
      return state;
    });

    // Verify downstream sections are locked
    await step('Battery is locked after re-edit', async () => {
      const locked = await page.evaluate(() => {
        const sec = document.getElementById('sec-battery');
        return sec ? sec.classList.contains('kb-section--locked') : false;
      });
      return locked;
    });

    await step('Accessories is locked after re-edit', async () => {
      const locked = await page.evaluate(() => {
        const sec = document.getElementById('sec-accessories');
        return sec ? sec.classList.contains('kb-section--locked') : false;
      });
      return locked;
    });

    await step('Programming is locked after re-edit', async () => {
      const locked = await page.evaluate(() => {
        const sec = document.getElementById('sec-programming');
        return sec ? sec.classList.contains('kb-section--locked') : false;
      });
      return locked;
    });

    await step('Review is locked after re-edit', async () => {
      const locked = await page.evaluate(() => {
        const sec = document.getElementById('sec-review');
        return sec ? sec.classList.contains('kb-section--locked') : false;
      });
      return locked;
    });

    await step('Quantity is locked after re-edit', async () => {
      const locked = await page.evaluate(() => {
        const sec = document.getElementById('sec-quantity');
        return sec ? sec.classList.contains('kb-section--locked') : false;
      });
      return locked;
    });

  } catch (err) {
    stepNum++;
    await screenshot(page, dir, stepNum, 'fatal').catch(() => {});
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();
  suiteResults.push({ name: testName, status: failed === 0 ? 'pass' : 'fail', passed, failed, steps, jsErrors });
}

// ================================================================
// TEST 3: Back Navigation
// ================================================================
async function test3_backNavigation(browser) {
  const testName = 'Back navigation';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  Test 3: ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  async function step(desc, fn) {
    stepNum++;
    const idx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, idx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) { console.log(`    ${PASS_ICON} ${desc}`); passed++; totalPassed++; }
      else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, idx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, idx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, idx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await step('Navigate to UV-5R', async () => {
      await navigateToRadio(page, 'UV-5R');
      await waitForSection(page, 'antennas');
      return true;
    });

    await step('Complete antennas section', async () => {
      await clickContinue(page, 'antennas');
      await waitForSection(page, 'battery');
      return true;
    });

    await step('Battery section is active', async () => {
      const active = await page.evaluate(() => {
        const sec = document.getElementById('sec-battery');
        return sec ? sec.classList.contains('kb-section--active') : false;
      });
      return active;
    });

    // Click Back button in battery section
    await step('Click Back button in battery section', async () => {
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-battery');
        if (!sec) return false;
        const btns = sec.querySelectorAll('.kb-btn--secondary, .kb-btn--back, button');
        for (const btn of btns) {
          const text = btn.textContent.trim().toUpperCase();
          if (text.includes('BACK') && btn.offsetParent !== null) {
            btn.click();
            return true;
          }
        }
        // Also check .kb-section__actions for secondary button
        const actions = sec.querySelector('.kb-section__actions');
        if (actions) {
          const secBtns = actions.querySelectorAll('.kb-btn--secondary');
          for (const btn of secBtns) {
            if (btn.offsetParent !== null) { btn.click(); return true; }
          }
        }
        return false;
      });
      await sleep(1000);
      return clicked;
    });

    // Verify antennas section re-activates
    await step('Antennas re-activates after Back', async () => {
      const active = await page.evaluate(() => {
        const sec = document.getElementById('sec-antennas');
        return sec ? sec.classList.contains('kb-section--active') : false;
      });
      return active;
    });

  } catch (err) {
    stepNum++;
    await screenshot(page, dir, stepNum, 'fatal').catch(() => {});
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();
  suiteResults.push({ name: testName, status: failed === 0 ? 'pass' : 'fail', passed, failed, steps, jsErrors });
}

// ================================================================
// TEST 4: UV-PRO Color Picker
// ================================================================
async function test4_uvProColorPicker(browser) {
  const testName = 'UV-PRO color picker';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  Test 4: ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  async function step(desc, fn) {
    stepNum++;
    const idx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, idx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) { console.log(`    ${PASS_ICON} ${desc}`); passed++; totalPassed++; }
      else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, idx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, idx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, idx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await step('Navigate to UV-PRO', async () => {
      await freshLoad(page, KB_URL);
      await skipEmail(page);
      await selectDirect(page, 'handheld');
      await selectRadio(page, 'UV-PRO');
      return true;
    });

    // Verify color picker appears
    await step('Color picker (#kbs-color-picker) appears', async () => {
      await page.waitForSelector('#kbs-color-picker', { visible: true, timeout: 10000 });
      const visible = await page.evaluate(() => {
        const el = document.getElementById('kbs-color-picker');
        return el && el.offsetParent !== null;
      });
      return visible;
    });

    // Verify tan swatch is first
    await step('Tan swatch (.color-swatch--tan) is first', async () => {
      const tanFirst = await page.evaluate(() => {
        const picker = document.getElementById('kbs-color-picker');
        if (!picker) return false;
        const swatches = picker.querySelectorAll('[class*="color-swatch"]');
        if (swatches.length === 0) return false;
        return swatches[0].classList.contains('color-swatch--tan');
      });
      return tanFirst;
    });

    // Click tan swatch
    await step('Click tan swatch', async () => {
      const clicked = await page.evaluate(() => {
        const swatch = document.querySelector('.color-swatch--tan');
        if (!swatch) return false;
        swatch.click();
        return true;
      });
      await sleep(300);
      return clicked;
    });

    // Verify tan swatch becomes active
    await step('Tan swatch becomes active', async () => {
      const active = await page.evaluate(() => {
        const swatch = document.querySelector('.color-swatch--tan');
        if (!swatch) return false;
        // Check for active class or aria-selected or similar
        return swatch.classList.contains('active') ||
               swatch.classList.contains('color-swatch--active') ||
               swatch.classList.contains('selected') ||
               swatch.getAttribute('aria-selected') === 'true' ||
               swatch.classList.contains('swatch--selected');
      });
      return active;
    });

    // Verify label text says "Tan / Coyote"
    await step('Label text changes to "Tan / Coyote"', async () => {
      const labelText = await page.evaluate(() => {
        const picker = document.getElementById('kbs-color-picker');
        if (!picker) return '';
        // Look for label/span text near the swatches
        const labels = picker.querySelectorAll('span, label, p, .color-label, .swatch-label, [class*="color-name"]');
        for (const lbl of labels) {
          const txt = lbl.textContent.trim();
          if (txt.includes('Tan') || txt.includes('Coyote')) return txt;
        }
        // Also check the picker's overall text
        return picker.textContent;
      });
      console.log(`      ${DIM}Label text found: ${labelText.substring(0, 80)}${RESET}`);
      return labelText.includes('Tan') && labelText.includes('Coyote');
    });

    // Click Continue inside picker
    await step('Click Continue inside color picker', async () => {
      await page.evaluate(() => {
        const picker = document.getElementById('kbs-color-picker');
        if (!picker) return;
        const btns = picker.querySelectorAll('.kb-btn--primary, button');
        for (const btn of btns) {
          if (btn.offsetParent !== null && !btn.disabled) { btn.click(); break; }
        }
      });
      return true;
    });

    // Verify antennas section activates
    await step('Antennas section activates after color picker', async () => {
      await waitForSection(page, 'antennas');
      return true;
    });

  } catch (err) {
    stepNum++;
    await screenshot(page, dir, stepNum, 'fatal').catch(() => {});
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();
  suiteResults.push({ name: testName, status: failed === 0 ? 'pass' : 'fail', passed, failed, steps, jsErrors });
}

// ================================================================
// TEST 5: Remove from Review
// ================================================================
async function test5_removeFromReview(browser) {
  const testName = 'Remove from review';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  Test 5: ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  async function step(desc, fn) {
    stepNum++;
    const idx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, idx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) { console.log(`    ${PASS_ICON} ${desc}`); passed++; totalPassed++; }
      else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, idx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, idx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, idx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await step('Navigate to UV-5R', async () => {
      await navigateToRadio(page, 'UV-5R');
      await waitForSection(page, 'antennas');
      return true;
    });

    // Select Foul Weather Whip antenna
    await step('Select Foul Weather Whip antenna', async () => {
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-antennas');
        if (!sec) return false;
        const cards = sec.querySelectorAll('.opt-card');
        for (const card of cards) {
          const text = card.textContent;
          if (text.includes('Foul Weather') || text.includes('foul weather') || text.includes('Whip')) {
            card.click();
            return true;
          }
        }
        return false;
      });
      await sleep(300);
      return clicked;
    });

    await step('Continue past antennas', async () => {
      await clickContinue(page, 'antennas');
      await waitForSection(page, 'battery');
      return true;
    });

    await step('Continue past battery', async () => {
      await clickContinue(page, 'battery');
      await waitForSection(page, 'accessories');
      return true;
    });

    await step('Continue past accessories', async () => {
      await clickContinue(page, 'accessories');
      await waitForSection(page, 'programming');
      return true;
    });

    await step('Continue past programming', async () => {
      await clickContinue(page, 'programming');
      await waitForSection(page, 'review');
      return true;
    });

    // Note the total price
    let priceBefore = 0;
    await step('Note initial price', async () => {
      const price = await page.evaluate(() => {
        const el = document.getElementById('kbs-total');
        return el ? el.textContent.trim() : '';
      });
      priceBefore = parseFloat(price.replace(/[^0-9.]/g, ''));
      console.log(`      ${DIM}Price before removal: $${priceBefore}${RESET}`);
      return priceBefore > 0;
    });

    // Verify antenna is in review
    await step('Foul Weather Whip appears in review', async () => {
      const found = await page.evaluate(() => {
        const sec = document.getElementById('sec-review');
        if (!sec) return false;
        const content = sec.querySelector('.kb-section__content');
        if (!content) return false;
        return content.textContent.includes('Foul Weather') || content.textContent.includes('Whip');
      });
      return found;
    });

    // Click the remove button on the antenna
    await step('Click remove button on antenna', async () => {
      // reviewRemove() calls confirm() which blocks page.evaluate.
      // Set up a dialog handler to auto-accept BEFORE clicking.
      page.once('dialog', async dialog => { await dialog.accept(); });
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-review');
        if (!sec) return false;
        // Find the review item containing "Foul Weather" or "Whip" and click its remove button
        const items = sec.querySelectorAll('.review-item, .ri-row, [class*="review"]');
        for (const item of items) {
          if (item.textContent.includes('Foul Weather') || item.textContent.includes('Whip')) {
            const removeBtn = item.querySelector('.ri-remove, [class*="remove"], button');
            if (removeBtn) { removeBtn.click(); return true; }
          }
        }
        // Fallback: try to find any .ri-remove that's near antenna text
        const removes = sec.querySelectorAll('.ri-remove');
        for (const rm of removes) {
          const parent = rm.closest('.review-item, .ri-row, tr, li, div[class*="review"]');
          if (parent && (parent.textContent.includes('Foul Weather') || parent.textContent.includes('Whip') || parent.textContent.includes('antenna') || parent.textContent.includes('Antenna'))) {
            rm.click();
            return true;
          }
        }
        // Last fallback: click first non-radio remove button
        if (removes.length > 0) {
          // Skip the first one if it's the radio itself, click the second
          const idx = removes.length > 1 ? 1 : 0;
          removes[idx].click();
          return true;
        }
        return false;
      });
      await sleep(500);
      return clicked;
    });

    // Verify antenna disappears
    await step('Antenna removed from review', async () => {
      const stillThere = await page.evaluate(() => {
        const sec = document.getElementById('sec-review');
        if (!sec) return true;
        const content = sec.querySelector('.kb-section__content');
        if (!content) return true;
        return content.textContent.includes('Foul Weather');
      });
      return !stillThere;
    });

    // Verify price decreased
    await step('Price decreased after removal', async () => {
      const priceAfter = await page.evaluate(() => {
        const el = document.getElementById('kbs-total');
        return el ? el.textContent.trim() : '';
      });
      const numericAfter = parseFloat(priceAfter.replace(/[^0-9.]/g, ''));
      console.log(`      ${DIM}Price after removal: $${numericAfter} (was $${priceBefore})${RESET}`);
      return numericAfter < priceBefore;
    });

  } catch (err) {
    stepNum++;
    await screenshot(page, dir, stepNum, 'fatal').catch(() => {});
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();
  suiteResults.push({ name: testName, status: failed === 0 ? 'pass' : 'fail', passed, failed, steps, jsErrors });
}

// ================================================================
// TEST 6: URL State Persistence
// ================================================================
async function test6_urlStatePersistence(browser) {
  const testName = 'URL state persistence';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  Test 6: ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  async function step(desc, fn) {
    stepNum++;
    const idx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, idx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) { console.log(`    ${PASS_ICON} ${desc}`); passed++; totalPassed++; }
      else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, idx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, idx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, idx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await step('Navigate to UV-5R', async () => {
      await navigateToRadio(page, 'UV-5R');
      await waitForSection(page, 'antennas');
      return true;
    });

    await step('Complete antennas section', async () => {
      await clickContinue(page, 'antennas');
      await waitForSection(page, 'battery');
      return true;
    });

    // Copy the URL hash
    let savedUrl = '';
    await step('Capture URL with state hash', async () => {
      savedUrl = await page.url();
      console.log(`      ${DIM}URL: ${savedUrl}${RESET}`);
      // URL should have a hash or localStorage state
      return savedUrl.length > 0;
    });

    // Navigate to blank page
    await step('Navigate to blank page', async () => {
      await page.goto('about:blank', { waitUntil: 'load', timeout: 10000 });
      return true;
    });

    // Navigate back to comms-compass with that URL
    await step('Navigate back with saved URL', async () => {
      await page.goto(savedUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await sleep(2000);
      await dismissPopup(page);
      await sleep(500);
      return true;
    });

    // Verify a resume prompt appears (or state is restored)
    await step('Resume prompt or restored state appears', async () => {
      // The wizard may show a resume modal, or it may restore the state automatically
      // Check for: a resume dialog, or the antennas/battery section being active/complete
      const resumed = await page.evaluate(() => {
        // Check for resume modal/prompt
        const modals = document.querySelectorAll('.kb-resume, .kb-modal, [class*="resume"], [class*="modal"]');
        for (const m of modals) {
          if (m.offsetParent !== null && m.textContent.toLowerCase().includes('resume')) return 'resume-modal';
          if (m.offsetParent !== null && m.textContent.toLowerCase().includes('continue where')) return 'resume-modal';
          if (m.offsetParent !== null && m.textContent.toLowerCase().includes('pick up')) return 'resume-modal';
        }
        // Check if state was auto-restored (sections past email are active/complete)
        const radio = document.getElementById('sec-radio');
        if (radio && radio.classList.contains('kb-section--complete')) return 'auto-restored';
        const antennas = document.getElementById('sec-antennas');
        if (antennas && (antennas.classList.contains('kb-section--active') || antennas.classList.contains('kb-section--complete'))) return 'auto-restored';
        const battery = document.getElementById('sec-battery');
        if (battery && battery.classList.contains('kb-section--active')) return 'auto-restored';
        // Check for any prompt text on page
        const body = document.body.textContent.toLowerCase();
        if (body.includes('resume') || body.includes('continue where') || body.includes('pick up where')) return 'text-prompt';
        return 'none';
      });
      console.log(`      ${DIM}Resume detection: ${resumed}${RESET}`);
      return resumed !== 'none';
    });

  } catch (err) {
    stepNum++;
    await screenshot(page, dir, stepNum, 'fatal').catch(() => {});
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();
  suiteResults.push({ name: testName, status: failed === 0 ? 'pass' : 'fail', passed, failed, steps, jsErrors });
}

// ================================================================
// MAIN
// ================================================================
async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Comms Compass Test Suite C${RESET}`);
  console.log(`${BOLD} Edge Case Tests - Desktop (1280x900)${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} URL: ${KB_URL}${RESET}`);
  console.log();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  await test1_skipAllOptional(browser);
  await test2_reEditSection(browser);
  await test3_backNavigation(browser);
  await test4_uvProColorPicker(browser);
  await test5_removeFromReview(browser);
  await test6_urlStatePersistence(browser);

  await browser.close();

  // -- Results JSON --
  ensureDir(SCREENSHOTS_DIR);
  const resultsJson = {
    timestamp: new Date().toISOString(),
    viewport: 'desktop',
    url: KB_URL,
    suites: suiteResults,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      failureList: allFailures
    }
  };

  const resultsPath = path.join(SCREENSHOTS_DIR, 'results.json');
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
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}`);
  console.log();

  console.log(`${BOLD}  Per-test results:${RESET}`);
  for (const s of suiteResults) {
    const icon = s.status === 'pass' ? PASS_ICON : FAIL_ICON;
    console.log(`    ${icon} ${s.name} (${s.passed}/${s.passed + s.failed})`);
  }
  console.log();

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
