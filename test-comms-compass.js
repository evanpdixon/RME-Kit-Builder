/**
 * Comms Compass - Automated Test Suite
 *
 * Suite A: End-to-end flows for all 14 radios (Direct path)
 *
 * Run:
 *   node test-comms-compass.js --suite=A --desktop-only
 *   node test-comms-compass.js --suite=A --mobile-only
 *   node test-comms-compass.js --suite=A --category=handheld
 *
 * Screenshots saved to: _screenshots/suite-a-desktop/ (or suite-a-mobile/)
 * Results JSON:         _screenshots/suite-a-desktop/results.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────
const KB_URL = 'https://staging12.radiomadeeasy.com/comms-compass/';
const PASS_ICON = '\x1b[32m[PASS]\x1b[0m';
const FAIL_ICON = '\x1b[31m[FAIL]\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── CLI args ───────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = name => {
  const a = args.find(x => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : null;
};
const hasFlag = name => args.includes(`--${name}`);

const suiteFilter = getArg('suite') || 'A';
const desktopOnly = hasFlag('desktop-only');
const mobileOnly = hasFlag('mobile-only');
const categoryFilter = getArg('category');

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812, isMobile: true };

// ── Test tracking ──────────────────────────────────────
let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];
const suiteResults = [];

// ── Radio definitions ──────────────────────────────────
// Names here match the <h4> text in .radio-pick cards (after stripping "Essentials Kit" / "Mobile Radio Kit")
const RADIOS = [
  // Handheld (5 radios)
  { category: 'handheld', categoryLabel: 'Handheld', radio: 'UV-5R', radioMatch: 'UV-5R', key: 'uv5r', hasMounting: false, hasBattery: true, hasColorPicker: false, isDMR: false },
  { category: 'handheld', categoryLabel: 'Handheld', radio: 'UV-5R Mini', radioMatch: 'UV-5R Mini', key: 'uv5r-mini', hasMounting: false, hasBattery: true, hasColorPicker: false, isDMR: false },
  { category: 'handheld', categoryLabel: 'Handheld', radio: 'UV-PRO', radioMatch: 'UV-PRO', key: 'uv-pro', hasMounting: false, hasBattery: true, hasColorPicker: true, isDMR: false },
  { category: 'handheld', categoryLabel: 'Handheld', radio: 'DMR 6X2 PRO', radioMatch: 'DMR 6X2 PRO', key: 'dmr-6x2', hasMounting: false, hasBattery: true, hasColorPicker: false, isDMR: true },
  { category: 'handheld', categoryLabel: 'Handheld', radio: 'DA-7X2', radioMatch: 'DA-7X2', key: 'da-7x2', hasMounting: false, hasBattery: true, hasColorPicker: false, isDMR: true },
  // Vehicle/Mobile (2 radios)
  { category: 'mobile', categoryLabel: 'Vehicle / Mobile', radio: 'UV-50PRO', radioMatch: 'UV-50PRO', key: 'uv50pro', hasMounting: true, hasBattery: true, hasColorPicker: false, isDMR: false },
  { category: 'mobile', categoryLabel: 'Vehicle / Mobile', radio: 'D578', radioMatch: 'D578', key: 'd578', hasMounting: true, hasBattery: true, hasColorPicker: false, isDMR: true },
  // Base Station (same 2 radios as vehicle)
  { category: 'base', categoryLabel: 'Base Station', radio: 'UV-50PRO (Base)', radioMatch: 'UV-50PRO', key: 'uv50pro', hasMounting: true, hasBattery: true, hasColorPicker: false, isDMR: false },
  { category: 'base', categoryLabel: 'Base Station', radio: 'D578 (Base)', radioMatch: 'D578', key: 'd578', hasMounting: true, hasBattery: true, hasColorPicker: false, isDMR: true },
  // HF (2 radios)
  { category: 'hf', categoryLabel: 'HF', radio: 'Xiegu G90', radioMatch: 'G90', key: 'g90', hasMounting: false, hasBattery: true, hasColorPicker: false, isDMR: false },
  { category: 'hf', categoryLabel: 'HF', radio: 'Yaesu FT-891', radioMatch: 'FT-891', key: 'ft891', hasMounting: false, hasBattery: true, hasColorPicker: false, isDMR: false },
  // Scanner (4 radios) - battery section is skipped for scanners
  { category: 'scanner', categoryLabel: 'Scanner', radio: 'SDS200', radioMatch: 'SDS200', key: 'sds200', hasMounting: false, hasBattery: false, hasColorPicker: false, isDMR: false },
  { category: 'scanner', categoryLabel: 'Scanner', radio: 'SDS100', radioMatch: 'SDS100', key: 'sds100', hasMounting: false, hasBattery: false, hasColorPicker: false, isDMR: false },
  { category: 'scanner', categoryLabel: 'Scanner', radio: 'SDR', radioMatch: 'SDR', key: 'sdr-kit', hasMounting: false, hasBattery: false, hasColorPicker: false, isDMR: false },
  { category: 'scanner', categoryLabel: 'Scanner', radio: 'SDS150', radioMatch: 'SDS150', key: 'sds150', hasMounting: false, hasBattery: false, hasColorPicker: false, isDMR: false },
];

// ── Screenshot dir ─────────────────────────────────────
function screenshotDir(viewport) {
  const vp = viewport.isMobile ? 'mobile' : 'desktop';
  return path.join(__dirname, '_screenshots', `suite-a-${vp}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeName(str) {
  return str.replace(/[^a-z0-9_-]/gi, '_').substring(0, 60);
}

// ── Helpers ────────────────────────────────────────────

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
  // Short pause to let content render
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

// ── Single radio end-to-end test ───────────────────────

async function testRadioFlow(browser, radioDef, viewport) {
  const vpLabel = viewport.isMobile ? 'mobile' : 'desktop';
  const testName = `${radioDef.categoryLabel} - ${radioDef.radio}`;
  const dir = path.join(screenshotDir(viewport), safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  [${vpLabel}] ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  function assert(condition, msg) {
    stepNum++;
    if (condition) {
      console.log(`    ${PASS_ICON} ${msg}`);
      passed++;
      totalPassed++;
    } else {
      console.log(`    ${FAIL_ICON} ${msg}`);
      failed++;
      totalFailed++;
      allFailures.push(`[${vpLabel}] [${testName}] ${msg}`);
    }
    return condition;
  }

  async function step(desc, fn) {
    stepNum++;
    const stepIdx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshot(page, dir, stepIdx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) {
        console.log(`    ${PASS_ICON} ${desc}`);
        passed++;
        totalPassed++;
      } else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++;
        totalFailed++;
        allFailures.push(`[${vpLabel}] [${testName}] ${desc}`);
        await screenshotFull(page, dir, stepIdx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, stepIdx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, stepIdx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++;
      totalFailed++;
      allFailures.push(`[${vpLabel}] [${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  const page = await browser.newPage();
  await page.setViewport(viewport.isMobile
    ? { width: viewport.width, height: viewport.height, isMobile: true, hasTouch: true }
    : { width: viewport.width, height: viewport.height }
  );
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  try {
    // 1. Fresh load
    await step('Fresh load page', async () => {
      await freshLoad(page, KB_URL);
      const exists = await page.$('#sec-email');
      return !!exists;
    });

    // 2. Skip email
    await step('Skip email', async () => {
      await waitForSection(page, 'email');
      // Click skip button
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-email');
        if (!sec) return false;
        const btns = sec.querySelectorAll('button, a, .kb-btn, .kb-btn--secondary, .kb-btn--link');
        for (const b of btns) {
          const txt = b.textContent.trim().toUpperCase();
          if (txt.includes('SKIP') || txt.includes('NO THANKS') || txt.includes('NO, THANKS')) {
            b.click();
            return true;
          }
        }
        return false;
      });
      return clicked;
    });

    // 3. Wait for interview, click "I Know What I Want"
    await step('Select Direct path', async () => {
      await waitForSection(page, 'interview');
      const clicked = await page.evaluate(() => {
        const sec = document.getElementById('sec-interview');
        if (!sec) return false;
        const btns = sec.querySelectorAll('button, .kb-btn, .iq-option, [class*="interview"]');
        for (const b of btns) {
          if (b.textContent.trim().includes('I Know What I Want')) {
            b.click();
            return true;
          }
        }
        // Also try all clickable things
        const allBtns = sec.querySelectorAll('[role="button"], a, div[class*="btn"]');
        for (const b of allBtns) {
          if (b.textContent.trim().includes('I Know What I Want')) {
            b.click();
            return true;
          }
        }
        return false;
      });
      return clicked;
    });

    // 4. Select category
    await step(`Select category: ${radioDef.categoryLabel}`, async () => {
      await sleep(500);
      // Wait for category options to appear
      await page.waitForSelector('.kbs-iq-opt', { visible: true, timeout: 10000 });
      // Click the matching category using the internal key
      // Category key mapping: handheld, vehicle (for mobile), base, hf, scanner
      const catKey = radioDef.category === 'mobile' ? 'vehicle' : radioDef.category;
      const clicked = await page.evaluate(key => {
        const opts = document.querySelectorAll('.kbs-iq-opt');
        for (const opt of opts) {
          // The onclick handler contains the key like kbsDirectToggleCat(this,"handheld")
          const onclick = opt.getAttribute('onclick') || '';
          if (onclick.includes('"' + key + '"')) {
            opt.click();
            return true;
          }
        }
        // Fallback: match by text
        const labels = { handheld: 'Handheld', vehicle: 'Vehicle', base: 'Base', hf: 'HF', scanner: 'Scanner' };
        const label = labels[key] || key;
        for (const opt of opts) {
          if (opt.textContent.includes(label)) {
            opt.click();
            return true;
          }
        }
        return false;
      }, catKey);
      return clicked;
    });

    // 5. Click NEXT in interview (this is #kbs-direct-next, not .kb-section__actions)
    await step('Continue to radio selection', async () => {
      await sleep(300);
      // The Direct path renders its own NEXT button as #kbs-direct-next
      await page.waitForFunction(() => {
        const btn = document.getElementById('kbs-direct-next');
        return btn && !btn.disabled;
      }, { timeout: 5000 });
      await page.evaluate(() => {
        const btn = document.getElementById('kbs-direct-next');
        if (btn) btn.click();
      });
      await waitForSection(page, 'radio');
      return true;
    });

    // 6. Select radio
    await step(`Select radio: ${radioDef.radio}`, async () => {
      await page.waitForSelector('.radio-pick', { visible: true, timeout: 10000 });
      const clicked = await page.evaluate(radioMatch => {
        const cards = document.querySelectorAll('.radio-pick:not(.radio-pick--oos)');
        // First try exact match on h4 text
        for (const card of cards) {
          const h4 = card.querySelector('h4');
          const text = h4 ? h4.textContent.trim() : '';
          if (text === radioMatch) {
            card.click();
            return true;
          }
        }
        // Fallback: includes match (for longer names like "Xiegu G90" matching "G90")
        for (const card of cards) {
          const h4 = card.querySelector('h4');
          const text = h4 ? h4.textContent.trim() : card.textContent.trim();
          if (text.includes(radioMatch)) {
            card.click();
            return true;
          }
        }
        return false;
      }, radioDef.radioMatch);
      return clicked;
    });

    // 7. UV-PRO color picker
    if (radioDef.hasColorPicker) {
      await step('UV-PRO: handle color picker', async () => {
        await page.waitForSelector('#kbs-color-picker', { visible: true, timeout: 10000 });
        // Click a swatch (Black is default, click Tan for variety then back to Black or just confirm)
        const hasSwatch = await page.evaluate(() => {
          const swatch = document.querySelector('.color-swatch--tan') ||
                         document.querySelector('.color-swatch--black') ||
                         document.querySelector('[class*="color-swatch"]');
          if (swatch) { swatch.click(); return true; }
          return false;
        });
        await sleep(300);
        // Click Continue inside color picker
        await page.evaluate(() => {
          const picker = document.getElementById('kbs-color-picker');
          if (!picker) return;
          const btns = picker.querySelectorAll('.kb-btn--primary, button');
          for (const btn of btns) {
            if (btn.offsetParent !== null && !btn.disabled) {
              btn.click(); break;
            }
          }
        });
        return hasSwatch;
      });
    }

    // Determine section flow based on category
    const sections = [];
    if (radioDef.hasMounting) sections.push('mounting');
    sections.push('antennas');
    if (radioDef.hasBattery) sections.push('battery');
    sections.push('accessories', 'programming', 'review', 'quantity');

    // 8. Verify mounting skip/presence
    if (!radioDef.hasMounting) {
      await step('Verify mounting section is skipped', async () => {
        const mountingState = await page.evaluate(() => {
          const sec = document.getElementById('sec-mounting');
          if (!sec) return 'not-in-dom';
          if (sec.classList.contains('kb-section--active')) return 'active';
          if (sec.classList.contains('kb-section--complete')) return 'complete';
          if (sec.classList.contains('kb-section--locked')) return 'locked';
          if (sec.offsetHeight === 0 || sec.style.display === 'none') return 'hidden';
          return 'present-' + sec.className;
        });
        // Mounting should NOT be active for this category
        return mountingState !== 'active';
      });
    }

    // 9. Walk through each section
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const nextSec = sections[i + 1] || null;

      // Verify battery skip for scanner
      if (sec === 'battery' && !radioDef.hasBattery) {
        await step('Verify battery section is skipped (scanner)', async () => {
          const batteryState = await page.evaluate(() => {
            const sec = document.getElementById('sec-battery');
            if (!sec) return 'not-in-dom';
            if (sec.classList.contains('kb-section--active')) return 'active';
            if (sec.offsetHeight === 0 || sec.style.display === 'none') return 'hidden';
            return 'present';
          });
          return batteryState !== 'active';
        });
        continue;
      }

      await step(`Section active: ${sec}`, async () => {
        const hasContent = await waitForSection(page, sec);
        return hasContent;
      });

      // For review section: verify radio name and price
      if (sec === 'review') {
        await step('Review: radio name visible', async () => {
          const hasRadio = await page.evaluate(radioMatch => {
            const sec = document.getElementById('sec-review');
            if (!sec) return false;
            const content = sec.querySelector('.kb-section__content');
            if (!content) return false;
            return content.textContent.includes(radioMatch);
          }, radioDef.radioMatch);
          return hasRadio;
        });

        await step('Review: price is non-zero', async () => {
          const price = await page.evaluate(() => {
            const el = document.getElementById('kbs-total');
            if (!el) return '0';
            return el.textContent.trim();
          });
          // Should contain a number greater than 0
          const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
          return numericPrice > 0;
        });
      }

      // For quantity section: verify Add to Cart
      if (sec === 'quantity') {
        await step('Quantity: Add to Cart button enabled', async () => {
          const btnEnabled = await page.evaluate(() => {
            const btn = document.querySelector('.kb-btn--cart') || document.getElementById('kbs-cart-btn');
            if (!btn) return false;
            return !btn.disabled && btn.offsetParent !== null;
          });
          return btnEnabled;
        });
      }

      // Click continue (except for quantity which is the last section)
      if (sec !== 'quantity') {
        await step(`Continue past ${sec}`, async () => {
          await clickContinue(page, sec);
          // Wait for next expected section (or review/quantity special handling)
          if (nextSec) {
            // If next is battery and we skip it (scanner), look ahead
            if (nextSec === 'battery' && !radioDef.hasBattery) {
              const afterBattery = sections[i + 2] || 'accessories';
              await waitForSection(page, afterBattery);
            } else {
              await waitForSection(page, nextSec);
            }
          }
          return true;
        });
      }
    }

    // 10. Verify price bar throughout
    await step('Price bar shows dollar amount', async () => {
      const priceBar = await page.evaluate(() => {
        const bar = document.getElementById('kb-scroll-price-bar');
        if (!bar) return { visible: false };
        const total = document.getElementById('kbs-total');
        return {
          visible: bar.offsetParent !== null || bar.offsetHeight > 0,
          total: total ? total.textContent.trim() : ''
        };
      });
      return priceBar.total && priceBar.total.includes('$');
    });

    // 11. Check JS errors
    await step('No critical JavaScript errors', async () => {
      // Filter out known benign errors
      const criticalErrors = jsErrors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('Failed to load resource') &&
        !e.includes('net::ERR') &&
        !e.includes('mailchimp') &&
        !e.toLowerCase().includes('mc.')
      );
      if (criticalErrors.length > 0) {
        console.log(`      ${DIM}JS errors: ${criticalErrors.join('; ')}${RESET}`);
      }
      return criticalErrors.length === 0;
    });

  } catch (err) {
    stepNum++;
    const ssFile = await screenshot(page, dir, stepNum, 'fatal-error').catch(() => 'error.png');
    await screenshotFull(page, dir, stepNum, 'fatal-error').catch(() => {});
    steps.push({ name: 'Fatal error', status: 'fail', screenshot: ssFile, error: err.message });
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++;
    totalFailed++;
    allFailures.push(`[${vpLabel}] [${testName}] FATAL: ${err.message}`);
  }

  await page.close();

  const suiteResult = {
    name: testName,
    viewport: vpLabel,
    status: failed === 0 ? 'pass' : 'fail',
    passed,
    failed,
    steps,
    jsErrors: jsErrors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'))
  };
  suiteResults.push(suiteResult);

  return { passed, failed };
}

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Comms Compass Test Suite A${RESET}`);
  console.log(`${BOLD} End-to-End Flows - All 14 Radios${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} URL: ${KB_URL}${RESET}`);
  console.log(`${DIM} Desktop: ${!mobileOnly} | Mobile: ${!desktopOnly}${RESET}`);
  if (categoryFilter) console.log(`${DIM} Category filter: ${categoryFilter}${RESET}`);
  console.log();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const viewports = [];
  if (!mobileOnly) viewports.push({ label: 'desktop', vp: DESKTOP });
  if (!desktopOnly) viewports.push({ label: 'mobile', vp: MOBILE });

  let radios = RADIOS;
  if (categoryFilter) {
    radios = radios.filter(r => r.category === categoryFilter || r.categoryLabel.toLowerCase().includes(categoryFilter.toLowerCase()));
  }

  for (const { label, vp } of viewports) {
    console.log(`\n${BOLD}${CYAN}── Viewport: ${label} (${vp.width}x${vp.height}) ──${RESET}`);

    for (const radioDef of radios) {
      await testRadioFlow(browser, radioDef, vp);
    }
  }

  await browser.close();

  // ── Results JSON ───────────────────────────────────
  const vpLabel = desktopOnly ? 'desktop' : mobileOnly ? 'mobile' : 'both';
  const resultsDir = screenshotDir(desktopOnly ? DESKTOP : MOBILE);
  ensureDir(resultsDir);

  const resultsJson = {
    timestamp: new Date().toISOString(),
    viewport: vpLabel,
    url: KB_URL,
    suites: suiteResults,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      failureList: allFailures
    }
  };

  const resultsPath = path.join(resultsDir, 'results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(resultsJson, null, 2));

  // ── Summary ────────────────────────────────────────
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
  console.log(`  Screenshots: ${resultsDir}`);
  console.log();

  // Per-suite summary table
  console.log(`${BOLD}  Per-radio results:${RESET}`);
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
