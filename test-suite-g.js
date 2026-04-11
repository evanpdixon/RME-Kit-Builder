/**
 * Comms Compass - Test Suite G: Multi-Category Cart Scenarios (Desktop)
 *
 * Covers the multi-kit cart flow including:
 *   - Two-category and three-category happy paths
 *   - Cart button enable/disable state across kits
 *   - Back navigation after add-to-cart
 *   - "Kit Already in Cart" / "Make Changes" re-add path
 *   - Re-edit a completed section after adding to cart
 *   - Quantity adjustment after add-to-cart
 *
 * The cart AJAX endpoint is intercepted with a mock so the real WooCommerce
 * cart is not polluted. The mock returns a success response so the JS
 * code path proceeds normally (suppress redirect, show prompt, etc.).
 *
 * Run:
 *   node test-suite-g.js
 *
 * Screenshots: _screenshots/suite-g-desktop/
 * Results:     _screenshots/suite-g-desktop/results.json
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
const SCREENSHOTS_DIR = path.join(__dirname, '_screenshots', 'suite-g-desktop');

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

/**
 * Set up request interception that mocks the rme_kb_add_to_cart endpoint
 * so the test does not actually mutate the WooCommerce cart on staging.
 * Also installs a stub on `window.location.href` setter so the cart-redirect
 * after a successful add becomes a no-op (records the URL on window._kbsLastNav).
 */
async function installCartMock(page) {
  // Override location setter BEFORE any page scripts run
  await page.evaluateOnNewDocument(() => {
    window._kbsLastNav = null;
    try {
      const proto = Object.getPrototypeOf(window.location);
      // Save original href descriptor and replace
      const origAssign = window.location.assign.bind(window.location);
      const origReplace = window.location.replace.bind(window.location);
      window.location.assign = function(u) { window._kbsLastNav = u; };
      window.location.replace = function(u) { window._kbsLastNav = u; };
      // Override href via Object.defineProperty
      let _href = window.location.href;
      try {
        Object.defineProperty(window.location, 'href', {
          configurable: true,
          get() { return _href; },
          set(v) { _href = v; window._kbsLastNav = v; }
        });
      } catch(e) {
        // Some browsers won't allow this; fall back to assign/replace overrides
      }
    } catch(e) {}
  });

  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    // Mock the cart AJAX
    if (url.includes('action=rme_kb_add_to_cart')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            added: [{ id: 1, qty: 1 }],
            errors: [],
            cartCount: 1,
            // Use a hash-only URL so window.location.href = cartUrl
            // becomes an in-page hash change instead of a real navigation
            cartUrl: '#kbs-test-add'
          }
        })
      });
      return;
    }
    req.continue();
  });
}

async function freshLoad(page, url) {
  // Note: cookies/cache clearing skipped because some Puppeteer versions
  // disallow it after request interception is installed. localStorage clear is enough.
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

/** Select Direct path with one or more categories */
async function selectDirectMulti(page, categories) {
  await waitForSection(page, 'interview');
  // Click "I Know What I Want"
  await page.evaluate(() => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return;
    const btns = sec.querySelectorAll('button, .kb-btn, .iq-option, [role="button"], a, div[class*="btn"], .kbs-choice-card');
    for (const b of btns) {
      if (b.textContent.includes('I Know What I Want')) { b.click(); return; }
    }
  });
  await sleep(500);
  await page.waitForSelector('.kbs-iq-opt', { visible: true, timeout: 10000 });
  // Click each requested category
  for (const cat of categories) {
    await page.evaluate(key => {
      const opts = document.querySelectorAll('.kbs-iq-opt');
      for (const opt of opts) {
        const onclick = opt.getAttribute('onclick') || '';
        if (onclick.includes('"' + key + '"')) { opt.click(); return; }
      }
    }, cat);
    await sleep(200);
  }
  // Click Next
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
  await sleep(500);
}

/**
 * Walk a kit through every section to quantity, taking the default at each step.
 * Robust against the section state machine: each step waits for the target section
 * to actually become active before clicking, with a fallback if a section is skipped
 * by the app (e.g. battery for scanner, mounting for handheld/HF/scanner).
 */
async function walkToQuantity(page) {
  const ORDER = ['mounting', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'];

  // Wait for whichever section actually becomes active first after radio selection
  await page.waitForFunction(() => {
    return ORDER => {
      for (const n of ORDER) {
        const el = document.getElementById('sec-' + n);
        if (el && el.classList.contains('kb-section--active')) return n;
      }
      return null;
    };
  }, { timeout: 10000 }).catch(() => {});

  for (let i = 0; i < ORDER.length - 1; i++) {
    const current = ORDER[i];
    // Skip if this section never becomes active (mounting/battery skipped by category)
    let isActive = false;
    try {
      await page.waitForFunction(
        n => {
          const el = document.getElementById('sec-' + n);
          if (!el) return false;
          if (el.classList.contains('kb-section--active')) return true;
          if (el.classList.contains('kb-section--complete')) return 'complete';
          return false;
        },
        { timeout: 4000 },
        current
      );
      isActive = await page.evaluate(n => {
        const el = document.getElementById('sec-' + n);
        return el && el.classList.contains('kb-section--active');
      }, current);
    } catch(e) {
      // Not active, not complete — likely skipped (display:none)
      continue;
    }
    if (!isActive) continue;
    // Click continue and wait for next section to become active
    await clickContinue(page, current);
    // Find the next non-skipped section in ORDER
    for (let j = i + 1; j < ORDER.length; j++) {
      const next = ORDER[j];
      try {
        await page.waitForFunction(
          n => {
            const el = document.getElementById('sec-' + n);
            return el && el.classList.contains('kb-section--active');
          },
          { timeout: 6000 },
          next
        );
        break;
      } catch(e) {
        // Try the section after that
        continue;
      }
    }
  }
  // Final: wait for quantity to be active
  await waitForSection(page, 'quantity', 10000);
  await sleep(500);
}

/** Get cart button state */
async function getCartBtnState(page) {
  return await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn') || document.querySelector('#sec-quantity .kb-btn--cart');
    if (!btn) return { exists: false };
    return {
      exists: true,
      disabled: btn.disabled === true,
      visible: btn.offsetParent !== null && btn.style.display !== 'none',
      text: btn.textContent.trim()
    };
  });
}

/** Click the Add to Cart button (whether by ID or by class) */
async function clickAddToCart(page) {
  return await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn') || document.querySelector('#sec-quantity .kb-btn--cart');
    if (!btn || btn.disabled) return false;
    btn.click();
    return true;
  });
}

// Reusable per-test runner
function makeTestRunner(testName, dir, jsErrors) {
  let stepNum = 0;
  let passed = 0;
  let failed = 0;
  const steps = [];
  return {
    steps,
    passed: () => passed,
    failed: () => failed,
    step: async function(page, desc, fn) {
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
  };
}

// ================================================================
// TEST G1: Two-category happy path (Handheld + Vehicle)
// ================================================================
async function testG1_TwoCategory(browser) {
  const testName = 'G1: Two-category happy path (Handheld + Vehicle)';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);
  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  await installCartMock(page);

  const r = makeTestRunner(testName, dir, jsErrors);

  try {
    await r.step(page, 'Fresh load', async () => {
      await freshLoad(page, KB_URL);
      return !!(await page.$('#sec-email'));
    });

    await r.step(page, 'Skip email', async () => {
      await skipEmail(page);
      return true;
    });

    await r.step(page, 'Select Direct: Handheld + Vehicle', async () => {
      await selectDirectMulti(page, ['handheld', 'vehicle']);
      const categories = await page.evaluate(() => {
        // Read kbsAllCategories indirectly via the answers shown
        const all = document.querySelectorAll('.kbs-iq-opt.selected');
        return Array.from(all).length;
      });
      return true;
    });

    await r.step(page, 'Select UV-5R radio', async () => {
      await selectRadio(page, 'UV-5R');
      return true;
    });

    await r.step(page, 'Walk through to quantity (handheld)', async () => {
      await walkToQuantity(page);
      return true;
    });

    await r.step(page, 'Cart button is enabled at quantity', async () => {
      const state = await getCartBtnState(page);
      console.log(`      ${DIM}Button: ${JSON.stringify(state)}${RESET}`);
      return state.exists && !state.disabled && state.visible;
    });

    await r.step(page, 'Click Add to Cart for first kit', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000); // wait for AJAX + prompt
      return clicked;
    });

    await r.step(page, 'Build Vehicle Kit prompt appears', async () => {
      return await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        if (!picker) return false;
        return picker.textContent.includes('Kit Added to Cart') ||
               picker.textContent.includes('Build Vehicle');
      });
    });

    await r.step(page, 'Click Build Vehicle Kit', async () => {
      const clicked = await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        if (!picker) return false;
        const btns = picker.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.includes('Build')) { b.click(); return true; }
        }
        return false;
      });
      await sleep(1500);
      return clicked;
    });

    await r.step(page, 'Radio section active for vehicle kit', async () => {
      try {
        await waitForSection(page, 'radio', 10000);
        return true;
      } catch(e) { return false; }
    });

    await r.step(page, 'Select UV-50PRO vehicle radio', async () => {
      await selectRadio(page, 'UV-50PRO');
      return true;
    });

    await r.step(page, 'Walk through to quantity (vehicle)', async () => {
      await walkToQuantity(page);
      return true;
    });

    await r.step(page, 'Cart button enabled for SECOND kit (regression check)', async () => {
      const state = await getCartBtnState(page);
      console.log(`      ${DIM}Button: ${JSON.stringify(state)}${RESET}`);
      return state.exists && !state.disabled && state.visible;
    });

    await r.step(page, 'Click Add to Cart for second kit', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });

    await r.step(page, 'No JS console errors', async () => {
      const critical = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('Failed to load resource') &&
        !e.includes('mailchimp') && !e.includes('mc-modal'));
      if (critical.length > 0) console.log(`      ${DIM}Errors: ${critical.join(' | ')}${RESET}`);
      return critical.length === 0;
    });
  } finally {
    suiteResults.push({
      name: testName, status: r.failed() === 0 ? 'pass' : 'fail',
      passed: r.passed(), failed: r.failed(), steps: r.steps, jsErrors
    });
    await page.close();
  }
}

// ================================================================
// TEST G2: Three-category cycle (Handheld + Vehicle + HF)
// ================================================================
async function testG2_ThreeCategory(browser) {
  const testName = 'G2: Three-category cycle';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);
  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  await installCartMock(page);

  const r = makeTestRunner(testName, dir, jsErrors);

  async function buildKitAndAdd(label, radioName) {
    await r.step(page, `${label}: walk to quantity`, async () => {
      await walkToQuantity(page);
      return true;
    });
    await r.step(page, `${label}: cart button enabled`, async () => {
      const s = await getCartBtnState(page);
      return s.exists && !s.disabled && s.visible;
    });
    await r.step(page, `${label}: click Add to Cart`, async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });
  }

  try {
    await r.step(page, 'Fresh load + skip email', async () => {
      await freshLoad(page, KB_URL);
      await skipEmail(page);
      return true;
    });

    await r.step(page, 'Select Direct: Handheld + Vehicle + HF', async () => {
      await selectDirectMulti(page, ['handheld', 'vehicle', 'hf']);
      return true;
    });

    // Kit 1: Handheld
    await r.step(page, 'Select UV-5R for kit 1', async () => {
      await selectRadio(page, 'UV-5R');
      return true;
    });
    await buildKitAndAdd('Kit 1 (handheld)', 'UV-5R');

    await r.step(page, 'Prompt shows "Build Vehicle Kit"', async () => {
      return await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        return picker && picker.textContent.includes('Vehicle');
      });
    });

    // Kit 2: Vehicle
    await r.step(page, 'Click Build Vehicle Kit', async () => {
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('#kbs-qty-picker button');
        for (const b of btns) if (b.textContent.includes('Build')) { b.click(); return true; }
        return false;
      });
      await sleep(1500);
      await waitForSection(page, 'radio', 10000);
      return clicked;
    });
    await r.step(page, 'Select UV-50PRO for kit 2', async () => {
      await selectRadio(page, 'UV-50PRO');
      return true;
    });
    await buildKitAndAdd('Kit 2 (vehicle)', 'UV-50PRO');

    await r.step(page, 'Prompt shows "Build HF Kit"', async () => {
      return await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        return picker && picker.textContent.includes('HF');
      });
    });

    // Kit 3: HF
    await r.step(page, 'Click Build HF Kit', async () => {
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('#kbs-qty-picker button');
        for (const b of btns) if (b.textContent.includes('Build')) { b.click(); return true; }
        return false;
      });
      await sleep(1500);
      await waitForSection(page, 'radio', 10000);
      return clicked;
    });
    await r.step(page, 'Select G90 for kit 3', async () => {
      await selectRadio(page, 'G90');
      return true;
    });
    await buildKitAndAdd('Kit 3 (HF)', 'G90');

    await r.step(page, 'No remaining categories — all 3 kits added', async () => {
      // After third add, the prompt should NOT show another Build button
      return await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        if (!picker) return false;
        return !picker.textContent.includes('Build ');
      });
    });

    await r.step(page, 'No JS console errors across all 3 kits', async () => {
      const critical = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('Failed to load resource') &&
        !e.includes('mailchimp') && !e.includes('mc-modal'));
      if (critical.length > 0) console.log(`      ${DIM}Errors: ${critical.join(' | ')}${RESET}`);
      return critical.length === 0;
    });
  } finally {
    suiteResults.push({
      name: testName, status: r.failed() === 0 ? 'pass' : 'fail',
      passed: r.passed(), failed: r.failed(), steps: r.steps, jsErrors
    });
    await page.close();
  }
}

// ================================================================
// TEST G3: Back button at quantity, then return and add
// (Verifies cart button stays in valid state through back nav before adding)
//
// Note: The "Kit Already in Cart" / "Make Changes" path inside renderQuantityPicker
// is currently unreachable in normal user flow because:
//   1. After single-category Add to Cart, the page redirects to /cart/
//   2. kbsKitInCart is NOT persisted in the URL hash
//   3. So returning to the kit builder always starts fresh with kbsKitInCart=false
// This is documented dead code and should be either removed or have URL hash
// persistence added in a follow-up.
// ================================================================
async function testG3_BackButtonNav(browser) {
  const testName = 'G3: Back button at quantity, return, add';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);
  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  await installCartMock(page);

  const r = makeTestRunner(testName, dir, jsErrors);

  try {
    await r.step(page, 'Fresh load + skip email + Handheld + UV-5R Mini', async () => {
      await freshLoad(page, KB_URL);
      await skipEmail(page);
      await selectDirectMulti(page, ['handheld']);
      await selectRadio(page, 'UV-5R Mini');
      return true;
    });

    await r.step(page, 'Walk to quantity', async () => {
      await walkToQuantity(page);
      return true;
    });

    await r.step(page, 'Cart button enabled at quantity (initial)', async () => {
      const s = await getCartBtnState(page);
      return s.exists && !s.disabled && s.visible;
    });

    await r.step(page, 'Click Back from quantity', async () => {
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-quantity');
        if (!sec) return false;
        const btns = sec.querySelectorAll('.kb-section__actions .kb-btn--secondary, .kb-btn--secondary');
        for (const b of btns) {
          if (b.textContent.trim().toUpperCase().includes('BACK')) { b.click(); return true; }
        }
        return false;
      });
      await sleep(1500);
      return clicked;
    });

    await r.step(page, 'Review section is active after Back', async () => {
      try { await waitForSection(page, 'review', 5000); return true; }
      catch(e) { return false; }
    });

    await r.step(page, 'Walk forward to quantity again', async () => {
      await clickContinue(page, 'review');
      await waitForSection(page, 'quantity', 5000);
      return true;
    });

    await r.step(page, 'Cart button still enabled after re-arrival', async () => {
      const s = await getCartBtnState(page);
      console.log(`      ${DIM}Button: ${JSON.stringify(s)}${RESET}`);
      return s.exists && !s.disabled && s.visible;
    });

    await r.step(page, 'Click Add to Cart', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });

    await r.step(page, 'No JS console errors', async () => {
      const critical = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('Failed to load resource') &&
        !e.includes('mailchimp') && !e.includes('mc-modal'));
      if (critical.length > 0) console.log(`      ${DIM}Errors: ${critical.join(' | ')}${RESET}`);
      return critical.length === 0;
    });
  } finally {
    suiteResults.push({
      name: testName, status: r.failed() === 0 ? 'pass' : 'fail',
      passed: r.passed(), failed: r.failed(), steps: r.steps, jsErrors
    });
    await page.close();
  }
}

// ================================================================
// TEST G4: Back navigation after add-to-cart in single-category
// ================================================================
async function testG4_BackAfterAdd(browser) {
  const testName = 'G4: Back navigation after add-to-cart';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);
  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  await installCartMock(page);
  // Auto-accept any confirm() dialogs triggered by reviewRemove etc.
  page.on('dialog', d => d.accept().catch(() => {}));

  const r = makeTestRunner(testName, dir, jsErrors);

  try {
    await r.step(page, 'Fresh load + skip email + handheld', async () => {
      await freshLoad(page, KB_URL);
      await skipEmail(page);
      await selectDirectMulti(page, ['handheld']);
      await selectRadio(page, 'UV-5R');
      await walkToQuantity(page);
      return true;
    });

    await r.step(page, 'Click Add to Cart', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });

    await r.step(page, 'Re-edit accessories section via header click', async () => {
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-accessories');
        if (!sec) return false;
        const editLink = sec.querySelector('.kbs-edit, .kb-section__summary [onclick*="kbsEditSection"]');
        if (editLink) { editLink.click(); return true; }
        const header = sec.querySelector('.kb-section__header');
        if (header) { header.click(); return true; }
        return false;
      });
      await sleep(1500);
      return clicked;
    });

    await r.step(page, 'Accessories section is active', async () => {
      try { await waitForSection(page, 'accessories', 5000); return true; }
      catch(e) { return false; }
    });

    await r.step(page, 'Walk forward back to quantity', async () => {
      await clickContinue(page, 'accessories');
      await sleep(800);
      await waitForSection(page, 'programming', 5000);
      await clickContinue(page, 'programming');
      await sleep(800);
      await waitForSection(page, 'review', 5000);
      await clickContinue(page, 'review');
      await waitForSection(page, 'quantity', 5000);
      return true;
    });

    await r.step(page, 'Quantity shows "Kit Already in Cart" after re-walk', async () => {
      return await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        return picker && (picker.textContent.includes('Already in Cart') ||
                          picker.textContent.includes('Make Changes'));
      });
    });

    await r.step(page, 'Click Make Changes', async () => {
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('#kbs-qty-picker button');
        for (const b of btns) if (b.textContent.includes('Make Changes')) { b.click(); return true; }
        return false;
      });
      await sleep(800);
      return clicked;
    });

    await r.step(page, 'Cart button enabled after Make Changes', async () => {
      const s = await getCartBtnState(page);
      return s.exists && !s.disabled && s.visible;
    });

    await r.step(page, 'No JS console errors', async () => {
      const critical = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('Failed to load resource') &&
        !e.includes('mailchimp') && !e.includes('mc-modal'));
      if (critical.length > 0) console.log(`      ${DIM}Errors: ${critical.join(' | ')}${RESET}`);
      return critical.length === 0;
    });
  } finally {
    suiteResults.push({
      name: testName, status: r.failed() === 0 ? 'pass' : 'fail',
      passed: r.passed(), failed: r.failed(), steps: r.steps, jsErrors
    });
    await page.close();
  }
}

// ================================================================
// TEST G5: Re-edit completed section in multi-cat flow after add-to-cart
// ================================================================
async function testG5_MultiCatReEdit(browser) {
  const testName = 'G5: Multi-cat re-edit second kit before adding';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);
  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  await installCartMock(page);

  const r = makeTestRunner(testName, dir, jsErrors);

  try {
    await r.step(page, 'Fresh load, build first handheld kit, add to cart', async () => {
      await freshLoad(page, KB_URL);
      await skipEmail(page);
      await selectDirectMulti(page, ['handheld', 'vehicle']);
      await selectRadio(page, 'UV-5R');
      await walkToQuantity(page);
      await clickAddToCart(page);
      await sleep(2000);
      return true;
    });

    await r.step(page, 'Click Build Vehicle Kit', async () => {
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('#kbs-qty-picker button');
        for (const b of btns) if (b.textContent.includes('Build')) { b.click(); return true; }
        return false;
      });
      await sleep(1500);
      await waitForSection(page, 'radio', 10000);
      return clicked;
    });

    await r.step(page, 'Select UV-50PRO and walk to programming', async () => {
      await selectRadio(page, 'UV-50PRO');
      await sleep(800);
      // Mounting → antennas → battery → accessories → programming
      const hasMount = await page.evaluate(() => {
        const m = document.getElementById('sec-mounting');
        return m && m.classList.contains('kb-section--active');
      });
      if (hasMount) { await clickContinue(page, 'mounting'); await waitForSection(page, 'antennas'); }
      await clickContinue(page, 'antennas'); await sleep(800);
      await clickContinue(page, 'battery'); await sleep(800);
      await clickContinue(page, 'accessories'); await sleep(800);
      await waitForSection(page, 'programming', 10000);
      return true;
    });

    await r.step(page, 'Re-edit antennas via header', async () => {
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-antennas');
        if (!sec) return false;
        const editLink = sec.querySelector('.kbs-edit, .kb-section__summary [onclick*="kbsEditSection"]');
        if (editLink) { editLink.click(); return true; }
        const header = sec.querySelector('.kb-section__header');
        if (header) { header.click(); return true; }
        return false;
      });
      await sleep(1500);
      return clicked;
    });

    await r.step(page, 'Antennas section is active again', async () => {
      try { await waitForSection(page, 'antennas', 5000); return true; }
      catch(e) { return false; }
    });

    await r.step(page, 'Walk forward to quantity', async () => {
      await clickContinue(page, 'antennas'); await sleep(800);
      await clickContinue(page, 'battery'); await sleep(800);
      await clickContinue(page, 'accessories'); await sleep(800);
      await waitForSection(page, 'programming', 5000);
      await clickContinue(page, 'programming'); await sleep(800);
      await waitForSection(page, 'review', 5000);
      await clickContinue(page, 'review');
      await waitForSection(page, 'quantity', 5000);
      return true;
    });

    await r.step(page, 'Cart button enabled for second kit', async () => {
      const s = await getCartBtnState(page);
      console.log(`      ${DIM}Button: ${JSON.stringify(s)}${RESET}`);
      return s.exists && !s.disabled && s.visible;
    });

    await r.step(page, 'Click Add to Cart for second kit', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });

    await r.step(page, 'No JS console errors', async () => {
      const critical = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('Failed to load resource') &&
        !e.includes('mailchimp') && !e.includes('mc-modal'));
      if (critical.length > 0) console.log(`      ${DIM}Errors: ${critical.join(' | ')}${RESET}`);
      return critical.length === 0;
    });
  } finally {
    suiteResults.push({
      name: testName, status: r.failed() === 0 ? 'pass' : 'fail',
      passed: r.passed(), failed: r.failed(), steps: r.steps, jsErrors
    });
    await page.close();
  }
}

// ================================================================
// TEST G6: Quantity adjustment then add-to-cart, then build next
// ================================================================
async function testG6_QuantityThenNext(browser) {
  const testName = 'G6: Quantity adjust then build next category';
  const dir = path.join(SCREENSHOTS_DIR, safeName(testName));
  ensureDir(dir);
  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  await installCartMock(page);

  const r = makeTestRunner(testName, dir, jsErrors);

  try {
    await r.step(page, 'Build first kit to quantity', async () => {
      await freshLoad(page, KB_URL);
      await skipEmail(page);
      await selectDirectMulti(page, ['handheld', 'vehicle']);
      await selectRadio(page, 'UV-5R');
      await walkToQuantity(page);
      return true;
    });

    await r.step(page, 'Increase quantity to 3', async () => {
      // Click + button twice
      for (let i = 0; i < 2; i++) {
        await page.evaluate(() => {
          const picker = document.getElementById('kbs-qty-picker');
          if (!picker) return;
          const btns = picker.querySelectorAll('.kbs-qty-btn');
          for (const b of btns) {
            if (b.textContent.trim() === '+' || b.textContent.includes('+')) {
              if (!b.disabled) { b.click(); return; }
            }
          }
        });
        await sleep(300);
      }
      const qty = await page.evaluate(() => {
        const v = document.querySelector('#kbs-qty-picker .kbs-qty-value');
        return v ? parseInt(v.textContent.trim()) : 0;
      });
      console.log(`      ${DIM}Quantity now: ${qty}${RESET}`);
      return qty === 3;
    });

    await r.step(page, 'Add to Cart with qty 3', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });

    await r.step(page, 'Prompt for next category appears', async () => {
      return await page.evaluate(() => {
        const picker = document.getElementById('kbs-qty-picker');
        return picker && picker.textContent.includes('Build');
      });
    });

    await r.step(page, 'Click Build Vehicle Kit', async () => {
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('#kbs-qty-picker button');
        for (const b of btns) if (b.textContent.includes('Build')) { b.click(); return true; }
        return false;
      });
      await sleep(1500);
      await waitForSection(page, 'radio', 10000);
      return clicked;
    });

    await r.step(page, 'Build vehicle kit and reach quantity', async () => {
      await selectRadio(page, 'UV-50PRO');
      await walkToQuantity(page);
      return true;
    });

    await r.step(page, 'Quantity for second kit defaults to 1 (not 3)', async () => {
      const qty = await page.evaluate(() => {
        const v = document.querySelector('#kbs-qty-picker .kbs-qty-value');
        return v ? parseInt(v.textContent.trim()) : 0;
      });
      console.log(`      ${DIM}Quantity: ${qty}${RESET}`);
      return qty === 1;
    });

    await r.step(page, 'Cart button enabled for second kit', async () => {
      const s = await getCartBtnState(page);
      return s.exists && !s.disabled && s.visible;
    });

    await r.step(page, 'Click Add to Cart for second kit', async () => {
      const clicked = await clickAddToCart(page);
      await sleep(2000);
      return clicked;
    });

    await r.step(page, 'No JS console errors', async () => {
      const critical = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('Failed to load resource') &&
        !e.includes('mailchimp') && !e.includes('mc-modal'));
      if (critical.length > 0) console.log(`      ${DIM}Errors: ${critical.join(' | ')}${RESET}`);
      return critical.length === 0;
    });
  } finally {
    suiteResults.push({
      name: testName, status: r.failed() === 0 ? 'pass' : 'fail',
      passed: r.passed(), failed: r.failed(), steps: r.steps, jsErrors
    });
    await page.close();
  }
}

// ================================================================
// MAIN
// ================================================================
async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Comms Compass Test Suite G${RESET}`);
  console.log(`${BOLD} Multi-Category Cart Scenarios${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} URL: ${KB_URL}${RESET}\n`);

  ensureDir(SCREENSHOTS_DIR);

  const browser = await puppeteer.launch({ headless: 'new' });

  try {
    await testG1_TwoCategory(browser);
    await testG2_ThreeCategory(browser);
    await testG3_BackButtonNav(browser);
    await testG4_BackAfterAdd(browser);
    await testG5_MultiCatReEdit(browser);
    await testG6_QuantityThenNext(browser);
  } finally {
    await browser.close();
  }

  // Write results.json
  const results = {
    timestamp: new Date().toISOString(),
    viewport: 'desktop',
    url: KB_URL,
    suite: 'G - Multi-Category Cart Scenarios',
    suites: suiteResults,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      failureList: allFailures
    }
  };
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'results.json'), JSON.stringify(results, null, 2));

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

  console.log(`\n  Results: ${path.join(SCREENSHOTS_DIR, 'results.json')}`);
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}`);

  console.log(`\n${BOLD}  Per-test results:${RESET}`);
  suiteResults.forEach(s => {
    const icon = s.status === 'pass' ? PASS_ICON : FAIL_ICON;
    console.log(`    ${icon} ${s.name} (${s.passed}/${s.steps.length})`);
  });

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Suite G error:', err);
  process.exit(2);
});
