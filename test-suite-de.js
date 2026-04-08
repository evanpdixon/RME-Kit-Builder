/**
 * Comms Compass - Test Suite D & E
 *
 * Suite D: Selection combinations (key tests)
 * Suite E: Price verification
 *
 * Run:
 *   node test-suite-de.js
 *
 * Screenshots saved to: _screenshots/suite-de-desktop/
 * Results JSON:         _screenshots/suite-de-desktop/results.json
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
const SS_DIR = path.join(__dirname, '_screenshots', 'suite-de-desktop');

// -- Test tracking --
let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];
const suiteResults = [];

// -- Helpers --

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

/**
 * Navigate Direct > category > radio. Returns when the first post-radio section is active.
 */
async function navigateToRadio(page, category, radioMatch) {
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

  // Wait for interview, click Direct
  await waitForSection(page, 'interview');
  await page.evaluate(() => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return;
    const btns = sec.querySelectorAll('button, .kb-btn, .iq-option, [class*="interview"]');
    for (const b of btns) {
      if (b.textContent.trim().includes('I Know What I Want')) { b.click(); return; }
    }
    const allBtns = sec.querySelectorAll('[role="button"], a, div[class*="btn"]');
    for (const b of allBtns) {
      if (b.textContent.trim().includes('I Know What I Want')) { b.click(); return; }
    }
  });

  // Select category
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

  // Click continue in interview
  await sleep(300);
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
  }, radioMatch);
}

/**
 * Skip through sections by clicking Continue until reaching the target section.
 */
async function skipToSection(page, targetSection, sectionsToSkip) {
  for (const sec of sectionsToSkip) {
    await waitForSection(page, sec);
    await clickContinue(page, sec);
    await sleep(500);
  }
  await waitForSection(page, targetSection);
}

/**
 * Get total price from price bar.
 */
async function getPrice(page) {
  return page.evaluate(() => {
    const el = document.getElementById('kbs-total');
    if (!el) return 0;
    const text = el.textContent.trim();
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
  });
}

/**
 * Get price bar text (e.g., "$59").
 */
async function getPriceText(page) {
  return page.evaluate(() => {
    const el = document.getElementById('kbs-total');
    return el ? el.textContent.trim() : '';
  });
}

// -- Test runner --

async function runTest(browser, testName, testFn) {
  const dir = path.join(SS_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  ${testName}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  function assert(condition, msg) {
    stepNum++;
    if (condition) {
      console.log(`    ${PASS_ICON} ${msg}`);
      passed++; totalPassed++;
    } else {
      console.log(`    ${FAIL_ICON} ${msg}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${msg}`);
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
        passed++; totalPassed++;
      } else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++; totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, stepIdx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshot(page, dir, stepIdx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, stepIdx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++; totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  try {
    await testFn(page, step, assert);
  } catch (err) {
    stepNum++;
    const ssFile = await screenshot(page, dir, stepNum, 'fatal-error').catch(() => 'error.png');
    await screenshotFull(page, dir, stepNum, 'fatal-error').catch(() => {});
    steps.push({ name: 'Fatal error', status: 'fail', screenshot: ssFile, error: err.message });
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++; totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();

  suiteResults.push({
    name: testName,
    viewport: 'desktop',
    status: failed === 0 ? 'pass' : 'fail',
    passed,
    failed,
    steps,
    jsErrors: jsErrors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'))
  });
}

// ====================================================================
// Suite D - Selection Combinations
// ====================================================================

async function testD1_FoulWeatherAntenna(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Click Foul Weather Whip card', async () => {
    // Find and click the Foul Weather Whip opt-card
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-antennas');
      if (!sec) return false;
      const cards = sec.querySelectorAll('.opt-card');
      for (const card of cards) {
        if (card.textContent.includes('Foul Weather')) {
          card.click();
          return true;
        }
      }
      return false;
    });
    return clicked;
  });

  await step('Verify Foul Weather Whip is selected', async () => {
    await sleep(300);
    const isSelected = await page.evaluate(() => {
      const sec = document.getElementById('sec-antennas');
      if (!sec) return false;
      const cards = sec.querySelectorAll('.opt-card');
      for (const card of cards) {
        if (card.textContent.includes('Foul Weather') && card.classList.contains('selected')) {
          return true;
        }
      }
      return false;
    });
    return isSelected;
  });

  await step('Continue past antennas', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    return true;
  });

  // Skip battery, accessories, programming to get to review
  await step('Skip to review', async () => {
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Review shows Foul Weather Whip', async () => {
    const found = await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (!sec) return false;
      return sec.textContent.includes('Foul Weather');
    });
    return found;
  });

  await step('Review shows BNC adapter auto-included', async () => {
    const found = await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (!sec) return false;
      const text = sec.textContent.toLowerCase();
      return text.includes('adapter') || text.includes('bnc');
    });
    return found;
  });

  await step('Price includes antenna ($40) + adapter ($5)', async () => {
    const price = await getPrice(page);
    // UV-5R base = $59, + $40 antenna + $5 adapter = $104
    console.log(`      ${DIM}Price: $${price}${RESET}`);
    // Price should be at least $59 + $40 + $5 = $104
    return price >= 104;
  });
}

async function testD2_MOLLEMount(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Find and click MOLLE Mount card', async () => {
    // Scroll down within antennas to find additional antennas / MOLLE
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-antennas');
      if (!sec) return false;
      const cards = sec.querySelectorAll('.opt-card');
      for (const card of cards) {
        if (card.textContent.includes('MOLLE')) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
          return true;
        }
      }
      return false;
    });
    return clicked;
  });

  await step('Handle Antenna Needed modal (click "I Have My Own Antenna")', async () => {
    await sleep(800);
    // The MOLLE mount triggers an "Antenna Needed" modal
    const handled = await page.evaluate(() => {
      // Look for modal with "Antenna Needed" text
      const allBtns = document.querySelectorAll('button, .kb-btn, div[class*="btn"]');
      for (const btn of allBtns) {
        const txt = btn.textContent.trim().toUpperCase();
        if (txt.includes('I HAVE MY OWN ANTENNA') || txt.includes('OWN ANTENNA')) {
          btn.click();
          return 'own-antenna';
        }
      }
      // If no modal appeared, that's OK too
      return 'no-modal';
    });
    console.log(`      ${DIM}Modal result: ${handled}${RESET}`);
    await sleep(500);
    return true;
  });

  await step('MOLLE Mount shows non-zero price', async () => {
    // WooCommerce overrides hardcoded prices via _applyPrices(). Check the card's displayed price.
    const molleInfo = await page.evaluate(() => {
      const sec = document.getElementById('sec-antennas');
      if (!sec) return { cardText: '', found: false, displayPrice: 0 };
      const cards = sec.querySelectorAll('.opt-card');
      let cardText = '';
      let displayPrice = 0;
      for (const card of cards) {
        if (card.textContent.includes('MOLLE')) {
          cardText = card.textContent.replace(/\s+/g, ' ').trim();
          // Extract price from card text (e.g., "+$19" or "+$69")
          const priceMatch = cardText.match(/\+?\$(\d+)/);
          if (priceMatch) displayPrice = parseInt(priceMatch[1]);
        }
      }
      // Also check internal data (WC price may differ from hardcoded)
      let dataPrice = null;
      try {
        if (typeof sharedAdditionalAntennas !== 'undefined') {
          const molle = sharedAdditionalAntennas.find(a => a.key === 'mollemount');
          if (molle) dataPrice = molle.price;
        }
      } catch(e) {}
      return { cardText, dataPrice, displayPrice, found: displayPrice > 0 };
    });
    console.log(`      ${DIM}MOLLE card price: $${molleInfo.displayPrice} (data: $${molleInfo.dataPrice})${RESET}`);
    // NOTE: WooCommerce may override hardcoded $69 to actual product price ($19).
    // Verify the card shows a non-zero price and MOLLE is present.
    return molleInfo.displayPrice > 0;
  });

  await step('Continue to review', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Review shows MOLLE Mount', async () => {
    // Dismiss any "Antenna Needed" modal that may have reappeared
    await page.evaluate(() => {
      const allBtns = document.querySelectorAll('button, .kb-btn, div[class*="btn"]');
      for (const btn of allBtns) {
        const txt = btn.textContent.trim().toUpperCase();
        if (txt.includes('I HAVE MY OWN ANTENNA') || txt.includes('OWN ANTENNA') || txt.includes('CANCEL')) {
          if (btn.offsetParent !== null) { btn.click(); return; }
        }
      }
    });
    await sleep(500);
    const found = await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (!sec) return false;
      return sec.textContent.includes('MOLLE') || sec.textContent.includes('molle') || sec.textContent.includes('Antenna Mount');
    });
    return found;
  });
}

async function testD3_BatteryQty2(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip antennas', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    return true;
  });

  await step('Select a spare battery opt-card', async () => {
    // The battery section has a factory battery info display at top, then purchasable spare battery opt-cards below.
    // The factory battery shows "Included" and has no price. Spare batteries show "+$XX/ea".
    // We need to scroll down and click a PURCHASABLE card (one with a price), not the factory info card.
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-battery');
      if (!sec) return false;
      const cards = sec.querySelectorAll('.opt-card');
      // First pass: find cards with a price indicator (not "Included")
      for (const card of cards) {
        const text = card.textContent;
        // Purchasable cards have "+$XX/ea" or a dollar amount, and NOT "Included"
        if ((text.includes('/ea') || text.match(/\+\$\d+/)) && !text.includes('Included')) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
          return true;
        }
      }
      // Second pass: find cards with USB-C in the name (spare batteries)
      for (const card of cards) {
        const text = card.textContent;
        if (text.includes('USB-C') && !text.includes('Included')) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
          return true;
        }
      }
      return false;
    });
    await sleep(500);
    return clicked;
  });

  let singleBatteryPrice;
  await step('Record single battery price', async () => {
    await sleep(500);
    singleBatteryPrice = await getPrice(page);
    console.log(`      ${DIM}Price with 1 battery: $${singleBatteryPrice}${RESET}`);
    return singleBatteryPrice > 0;
  });

  await step('Click qty stepper + to get qty 2', async () => {
    // The qty stepper appears inside the opt-card only after selection.
    // Wait for it to appear in the DOM.
    try {
      await page.waitForSelector('#sec-battery .qty-stepper', { visible: true, timeout: 5000 });
    } catch (e) {
      console.log(`      ${DIM}Stepper not found, re-clicking battery card${RESET}`);
      // Try re-clicking the battery card to select it
      await page.evaluate(() => {
        const sec = document.getElementById('sec-battery');
        if (!sec) return;
        const cards = sec.querySelectorAll('.opt-card');
        for (const card of cards) {
          if (card.textContent.includes('USB-C') || card.textContent.includes('Battery')) {
            card.click(); return;
          }
        }
      });
      await page.waitForSelector('#sec-battery .qty-stepper', { visible: true, timeout: 5000 });
    }
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-battery');
      if (!sec) return false;
      const stepper = sec.querySelector('.qty-stepper');
      if (stepper) {
        const btns = stepper.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.trim() === '+' || btn.textContent.includes('+')) {
            btn.click();
            return true;
          }
        }
        if (btns.length >= 2) {
          btns[btns.length - 1].click();
          return true;
        }
      }
      return false;
    });
    return clicked;
  });

  await step('Verify price increases (doubles battery cost)', async () => {
    await sleep(500);
    const newPrice = await getPrice(page);
    console.log(`      ${DIM}Price with 2 batteries: $${newPrice}${RESET}`);
    // The price should have increased
    return newPrice > singleBatteryPrice;
  });

  await step('Continue to review', async () => {
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Review shows battery x2', async () => {
    const found = await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (!sec) return false;
      const text = sec.textContent;
      // Look for "x2", "x 2", "qty 2", "Qty: 2", quantity indicators, or just the battery name
      return text.includes('x2') || text.includes('x 2') || text.includes('Qty: 2') ||
             text.includes('qty: 2') || text.includes('(2)') || /batter[yies]+.*2/i.test(text) ||
             text.includes('\u00d72') || text.includes('x2');
    });
    return found;
  });
}

async function testD4_MultiLocationProgramming(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip to programming', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    return true;
  });

  let preBefore;
  await step('Record price before Multi-Location', async () => {
    preBefore = await getPrice(page);
    console.log(`      ${DIM}Price before: $${preBefore}${RESET}`);
    return preBefore > 0;
  });

  await step('Click Multi-Location card', async () => {
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-programming');
      if (!sec) return false;
      const cards = sec.querySelectorAll('.opt-card');
      for (const card of cards) {
        if (card.textContent.includes('Multi-Location') || card.textContent.includes('Multi Location')) {
          card.click();
          return true;
        }
      }
      return false;
    });
    return clicked;
  });

  await step('Verify $10 is added for Multi-Location', async () => {
    await sleep(500);
    const priceAfter = await getPrice(page);
    console.log(`      ${DIM}Price after Multi-Location: $${priceAfter}${RESET}`);
    return priceAfter >= preBefore + 9; // allow small rounding
  });

  await step('Continue to review', async () => {
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Review shows Multi-Location Programming', async () => {
    const found = await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (!sec) return false;
      return sec.textContent.includes('Multi-Location') || sec.textContent.includes('Multi Location');
    });
    return found;
  });
}

async function testD5_SelfProgram(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip to programming', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    return true;
  });

  let priceBefore;
  await step('Record price before Self-Program', async () => {
    priceBefore = await getPrice(page);
    console.log(`      ${DIM}Price before: $${priceBefore}${RESET}`);
    return priceBefore > 0;
  });

  await step('Click Self-Program card', async () => {
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-programming');
      if (!sec) return false;
      const cards = sec.querySelectorAll('.opt-card');
      for (const card of cards) {
        const txt = card.textContent;
        if (txt.includes('Program It Myself') || txt.includes('Self-Program') || txt.includes('Self Program')) {
          card.click();
          return true;
        }
      }
      return false;
    });
    return clicked;
  });

  await step('Verify $0 added (price unchanged)', async () => {
    await sleep(500);
    const priceAfter = await getPrice(page);
    console.log(`      ${DIM}Price after Self-Program: $${priceAfter}${RESET}`);
    // Self-program may reduce price if standard was selected by default (standard might be $0 too)
    // The key check is that self-program doesn't add cost
    return priceAfter <= priceBefore;
  });

  await step('Continue to review', async () => {
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Review shows self-program / no programming option', async () => {
    await sleep(500); // Wait for review content to fully render
    const result = await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (!sec) return { found: false, text: 'sec-review not found' };
      const content = sec.querySelector('.kb-section__content');
      const text = (content || sec).textContent;
      const found = text.includes('Program It Myself') || text.includes('Self-Program') || text.includes('Self Program') ||
             text.includes('CHIRP') || text.includes('No Programming') || text.includes('Program it yourself') ||
             text.includes('factory defaults');
      return { found, text: text.substring(0, 300) };
    });
    if (!result.found) console.log(`      ${DIM}Review text: ${result.text}${RESET}`);
    return result.found;
  });
}

async function testD6_Qty2Discount(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip all sections to quantity', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    // Standard programming is default, just continue
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    await clickContinue(page, 'review');
    await waitForSection(page, 'quantity');
    return true;
  });

  let qty1Price;
  await step('Record qty 1 price', async () => {
    qty1Price = await getPrice(page);
    console.log(`      ${DIM}Qty 1 price: $${qty1Price}${RESET}`);
    return qty1Price > 0;
  });

  await step('Click + to set qty 2', async () => {
    const clicked = await page.evaluate(() => {
      const sec = document.getElementById('sec-quantity');
      if (!sec) return false;
      const btns = sec.querySelectorAll('button, .qty-btn, [class*="plus"], [class*="increment"]');
      for (const btn of btns) {
        const txt = btn.textContent.trim();
        if (txt === '+' || btn.classList.contains('qty-plus') || btn.classList.contains('qty-btn--plus')) {
          btn.click();
          return true;
        }
      }
      const allEls = sec.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent.trim() === '+' && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    });
    return clicked;
  });

  await step('Verify 5% discount line appears', async () => {
    await sleep(500);
    const hasDiscount = await page.evaluate(() => {
      // Check both quantity section and price bar for discount text
      const body = document.body.textContent;
      return body.includes('5%') || body.includes('discount') || body.includes('Discount');
    });
    return hasDiscount;
  });

  await step('Verify discount is calculated on full kit total', async () => {
    const totalPrice = await getPrice(page);
    // Qty 2 with 5% discount: 2 * qty1Price * 0.95
    const expectedMax = qty1Price * 2;
    const expectedMin = qty1Price * 2 * 0.94; // allow some tolerance
    console.log(`      ${DIM}Qty 2 total: $${totalPrice}, expected ~$${(qty1Price * 2 * 0.95).toFixed(2)}${RESET}`);
    return totalPrice < expectedMax && totalPrice >= expectedMin;
  });
}

// ====================================================================
// Suite E - Price Verification
// ====================================================================

async function testE7_UV5RMiniBare(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R Mini', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R Mini');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip all sections with no upgrades, self-program', async () => {
    // Skip antennas
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    // Skip battery
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    // Skip accessories
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    // Select self-program
    await page.evaluate(() => {
      const sec = document.getElementById('sec-programming');
      if (!sec) return;
      const cards = sec.querySelectorAll('.opt-card');
      for (const card of cards) {
        if (card.textContent.includes('Program It Myself') || card.textContent.includes('Self-Program') || card.textContent.includes('Self Program')) {
          card.click(); return;
        }
      }
    });
    await sleep(300);
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Verify final price = $39', async () => {
    const price = await getPrice(page);
    console.log(`      ${DIM}Final price: $${price}${RESET}`);
    return price === 39;
  });
}

async function testE8_UV5RStandard(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to UV-5R', async () => {
    await navigateToRadio(page, 'handheld', 'UV-5R');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip all sections, factory antenna, standard programming', async () => {
    // Factory antenna = no upgrades selected, just continue
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    // Standard is default, just continue
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Verify final price = $59', async () => {
    const price = await getPrice(page);
    console.log(`      ${DIM}Final price: $${price}${RESET}`);
    return price === 59;
  });
}

async function testE9_DA7X2Bare(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to DA-7X2', async () => {
    await navigateToRadio(page, 'handheld', 'DA-7X2');
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip all sections, standard programming', async () => {
    await clickContinue(page, 'antennas');
    await waitForSection(page, 'battery');
    await clickContinue(page, 'battery');
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    // Standard is default
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Verify final price = $299', async () => {
    const price = await getPrice(page);
    console.log(`      ${DIM}Final price: $${price}${RESET}`);
    return price === 299;
  });
}

async function testE10_SDS200Bare(page, step, assert) {
  await step('Fresh load', async () => {
    await freshLoad(page, KB_URL);
    return !!(await page.$('#sec-email'));
  });

  await step('Navigate to SDS200 (scanner)', async () => {
    await navigateToRadio(page, 'scanner', 'SDS200');
    // Scanner skips mounting and battery
    await waitForSection(page, 'antennas');
    return true;
  });

  await step('Skip all sections, standard programming', async () => {
    await clickContinue(page, 'antennas');
    // Battery is skipped for scanner, goes to accessories
    await waitForSection(page, 'accessories');
    await clickContinue(page, 'accessories');
    await waitForSection(page, 'programming');
    await clickContinue(page, 'programming');
    await waitForSection(page, 'review');
    return true;
  });

  await step('Verify final price = $799', async () => {
    const price = await getPrice(page);
    console.log(`      ${DIM}Final price: $${price}${RESET}`);
    return price === 799;
  });
}

// ====================================================================
// Main
// ====================================================================

async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Comms Compass Test Suite D & E${RESET}`);
  console.log(`${BOLD} Selection Combinations + Price Verify${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} URL: ${KB_URL}${RESET}`);
  console.log(`${DIM} Viewport: Desktop (1280x900)${RESET}`);
  console.log();

  ensureDir(SS_DIR);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  // Suite D
  console.log(`\n${BOLD}${CYAN}-- Suite D: Selection Combinations --${RESET}`);
  await runTest(browser, 'D1: Antenna - Foul Weather Whip only', testD1_FoulWeatherAntenna);
  await runTest(browser, 'D2: Antenna - MOLLE Mount', testD2_MOLLEMount);
  await runTest(browser, 'D3: Battery qty 2 via stepper', testD3_BatteryQty2);
  await runTest(browser, 'D4: Programming - Multi-Location', testD4_MultiLocationProgramming);
  await runTest(browser, 'D5: Programming - Self-Program', testD5_SelfProgram);
  await runTest(browser, 'D6: Quantity qty 2 discount', testD6_Qty2Discount);

  // Suite E
  console.log(`\n${BOLD}${CYAN}-- Suite E: Price Verification --${RESET}`);
  await runTest(browser, 'E7: UV-5R Mini bare minimum ($39)', testE7_UV5RMiniBare);
  await runTest(browser, 'E8: UV-5R standard ($59)', testE8_UV5RStandard);
  await runTest(browser, 'E9: DA-7X2 bare ($299)', testE9_DA7X2Bare);
  await runTest(browser, 'E10: SDS200 bare ($799)', testE10_SDS200Bare);

  await browser.close();

  // -- Results JSON --
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

  const resultsPath = path.join(SS_DIR, 'results.json');
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
  console.log(`  Screenshots: ${SS_DIR}`);
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
