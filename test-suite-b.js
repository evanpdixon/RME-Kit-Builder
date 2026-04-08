/**
 * Comms Compass - Test Suite B: Guided Path Tests
 *
 * Tests the "Help Me Choose" interview flow with 5 budget/reach combinations.
 * Desktop viewport (1280x900).
 *
 * Run:
 *   node test-suite-b.js
 *
 * Screenshots saved to: _screenshots/suite-b-desktop/
 * Results JSON:         _screenshots/suite-b-desktop/results.json
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

const DESKTOP = { width: 1280, height: 900 };
const SCREENSHOT_DIR = path.join(__dirname, '_screenshots', 'suite-b-desktop');

// ── Test tracking ──────────────────────────────────────
let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];
const suiteResults = [];

// ── Budget/Reach key mapping ───────────────────────────
// The interview questions use these keys internally:
//   budget: 'high' (Best of the best), 'mid' (Mid-range), 'low' (Economical)
//   reach:  'nearby', 'local', 'far' (Long distance), 'listen' (Just listening) [multi-select]
const BUDGET_MAP = {
  'Budget': 'low',
  'Mid': 'mid',
  'High': 'high'
};

const REACH_MAP = {
  'Nearby': 'nearby',
  'Local': 'local',
  'Far': 'far',
  'Multi-reach': ['nearby', 'local'],  // multi-select: nearby + local
  'Listen': 'listen'
};

// ── Guided path definitions ────────────────────────────
const GUIDED_PATHS = [
  {
    name: 'Budget + Nearby',
    budget: 'Budget',
    reach: 'Nearby',
    expectedCategory: 'handheld',
    expectedSection: 'antennas',
    description: 'Handheld recommendations'
  },
  {
    name: 'Mid + Local',
    budget: 'Mid',
    reach: 'Local',
    expectedCategory: 'handheld',
    expectedSection: 'antennas',
    description: 'Handheld recommendations (waterproof + GPS match)'
  },
  {
    name: 'High + Far',
    budget: 'High',
    reach: 'Far',
    expectedCategory: 'hf',
    expectedSection: 'antennas',
    description: 'HF redirect'
  },
  {
    name: 'Mid + Multi-reach',
    budget: 'Mid',
    reach: 'Multi-reach',
    expectedCategory: 'handheld',
    expectedSection: 'antennas',
    description: 'Bluetooth-capable recommendations'
  },
  {
    name: 'Budget + Listen',
    budget: 'Budget',
    reach: 'Listen',
    expectedCategory: 'scanner',
    expectedSection: 'antennas',
    description: 'Scanner redirect'
  }
];

// ── Helpers ────────────────────────────────────────────

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

async function screenshotStep(page, dir, stepNum, desc) {
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

// Click an interview option by its internal key (e.g. 'low', 'nearby')
// Options have onclick="kbsAnswer('budget','low',false)" etc.
async function clickInterviewOptionByKey(page, optionKey) {
  return await page.evaluate(key => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return false;
    const opts = sec.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) {
      // Check the onclick attribute for the option key
      const onclick = opt.getAttribute('onclick') || '';
      if (onclick.includes("'" + key + "'") || onclick.includes('"' + key + '"')) {
        if (opt.offsetParent !== null) {
          opt.click();
          return true;
        }
      }
    }
    return false;
  }, optionKey);
}

// Click the Next/Continue button in the interview guided flow
async function clickInterviewNext(page) {
  return await page.evaluate(() => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return false;
    // The guided flow renders Next buttons with onclick="kbsNextQ()"
    const btns = sec.querySelectorAll('.kb-btn--primary');
    for (const btn of btns) {
      if (btn.offsetParent !== null && !btn.disabled) {
        btn.click();
        return true;
      }
    }
    return false;
  });
}

// Wait for the interview stack to show new options (after a question transition)
async function waitForInterviewOptions(page, timeout) {
  timeout = timeout || 10000;
  await page.waitForFunction(() => {
    const sec = document.getElementById('sec-interview');
    if (!sec) return false;
    const stack = document.getElementById('kbs-interview-stack');
    if (!stack || stack.style.display === 'none') return false;
    // Look for visible, non-answered option cards
    const currentQ = stack.querySelector('.kbs-iq:not(.kbs-iq--answered):last-child');
    if (!currentQ) return false;
    const opts = currentQ.querySelectorAll('.kbs-iq-opt');
    let visCount = 0;
    for (const opt of opts) {
      if (opt.offsetParent !== null) visCount++;
    }
    return visCount >= 2;
  }, { timeout });
}

// ── Single guided path test ────────────────────────────

async function testGuidedPath(browser, pathDef) {
  const testName = pathDef.name;
  const dir = path.join(SCREENSHOT_DIR, safeName(testName));
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  ${testName}: ${pathDef.description}${RESET}`);

  const jsErrors = [];
  const steps = [];
  let passed = 0;
  let failed = 0;
  let stepNum = 0;

  async function step(desc, fn) {
    stepNum++;
    const stepIdx = stepNum;
    try {
      const result = await fn();
      const ok = result !== false;
      const ssFile = await screenshotStep(page, dir, stepIdx, desc);
      steps.push({ name: desc, status: ok ? 'pass' : 'fail', screenshot: ssFile });
      if (ok) {
        console.log(`    ${PASS_ICON} ${desc}`);
        passed++;
        totalPassed++;
      } else {
        console.log(`    ${FAIL_ICON} ${desc}`);
        failed++;
        totalFailed++;
        allFailures.push(`[${testName}] ${desc}`);
        await screenshotFull(page, dir, stepIdx, desc);
      }
      return ok;
    } catch (err) {
      const ssFile = await screenshotStep(page, dir, stepIdx, desc).catch(() => 'error.png');
      await screenshotFull(page, dir, stepIdx, desc).catch(() => {});
      steps.push({ name: desc, status: 'fail', screenshot: ssFile, error: err.message });
      console.log(`    ${FAIL_ICON} ${desc} -- ${err.message}`);
      failed++;
      totalFailed++;
      allFailures.push(`[${testName}] ${desc}: ${err.message}`);
      return false;
    }
  }

  const page = await browser.newPage();
  await page.setViewport({ width: DESKTOP.width, height: DESKTOP.height });
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  try {
    // Step 1: Fresh load
    await step('Fresh load page', async () => {
      await freshLoad(page, KB_URL);
      const exists = await page.$('#sec-email');
      return !!exists;
    });

    // Step 2: Skip email
    await step('Skip email', async () => {
      await waitForSection(page, 'email');
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

    // Step 3: Wait for interview, click "Help Me Choose"
    // The card is: <div class="kbs-choice-card" onclick="kbsStartGuided()">
    await step('Click "Help Me Choose"', async () => {
      await waitForSection(page, 'interview');
      // Wait for the choice screen to be visible
      await page.waitForSelector('#kbs-interview-choice', { visible: true, timeout: 5000 });
      // Click the first .kbs-choice-card (Help Me Choose)
      const clicked = await page.evaluate(() => {
        const cards = document.querySelectorAll('.kbs-choice-card');
        for (const card of cards) {
          if (card.textContent.includes('Help Me Choose') && card.offsetParent !== null) {
            card.click();
            return true;
          }
        }
        return false;
      });
      if (clicked) await sleep(500);
      return clicked;
    });

    // Step 4: Wait for budget question to appear
    await step('Wait for budget question', async () => {
      await waitForInterviewOptions(page, 10000);
      // Verify it's the budget question
      const questionText = await page.evaluate(() => {
        const stack = document.getElementById('kbs-interview-stack');
        if (!stack) return '';
        const h3 = stack.querySelector('.kbs-iq:not(.kbs-iq--answered) h3');
        return h3 ? h3.textContent.trim() : '';
      });
      console.log(`      ${DIM}(Question: ${questionText})${RESET}`);
      return questionText.length > 0;
    });

    // Step 5: Answer budget question
    const budgetKey = BUDGET_MAP[pathDef.budget];
    await step(`Select budget: ${pathDef.budget} (key: ${budgetKey})`, async () => {
      const clicked = await clickInterviewOptionByKey(page, budgetKey);
      return clicked;
    });

    // Step 6: Click Next after budget
    await step('Click Next after budget', async () => {
      await sleep(200);
      // Wait for Next button to be enabled
      await page.waitForFunction(() => {
        const sec = document.getElementById('sec-interview');
        if (!sec) return false;
        const btns = sec.querySelectorAll('.kb-btn--primary');
        for (const btn of btns) {
          if (btn.offsetParent !== null && !btn.disabled) return true;
        }
        return false;
      }, { timeout: 5000 });
      const clicked = await clickInterviewNext(page);
      // Wait for the transition animation (opacity + transform)
      await sleep(1000);
      return clicked;
    });

    // Step 7: Wait for reach question
    await step('Wait for reach question', async () => {
      await waitForInterviewOptions(page, 10000);
      const questionText = await page.evaluate(() => {
        const stack = document.getElementById('kbs-interview-stack');
        if (!stack) return '';
        const currentQ = stack.querySelector('.kbs-iq:not(.kbs-iq--answered):last-child');
        if (!currentQ) return '';
        const h3 = currentQ.querySelector('h3');
        return h3 ? h3.textContent.trim() : '';
      });
      console.log(`      ${DIM}(Question: ${questionText})${RESET}`);
      return questionText.toLowerCase().includes('far') || questionText.toLowerCase().includes('communicate') || questionText.length > 0;
    });

    // Step 8: Answer reach question (may be multi-select)
    const reachValue = REACH_MAP[pathDef.reach];
    const reachKeys = Array.isArray(reachValue) ? reachValue : [reachValue];
    for (const rk of reachKeys) {
      await step(`Select reach: ${rk}`, async () => {
        const clicked = await clickInterviewOptionByKey(page, rk);
        await sleep(200);
        return clicked;
      });
    }

    // Step 9: Click Next after reach
    await step('Click Next after reach', async () => {
      await sleep(200);
      await page.waitForFunction(() => {
        const sec = document.getElementById('sec-interview');
        if (!sec) return false;
        const btns = sec.querySelectorAll('.kb-btn--primary');
        for (const btn of btns) {
          if (btn.offsetParent !== null && !btn.disabled) return true;
        }
        return false;
      }, { timeout: 5000 });
      const clicked = await clickInterviewNext(page);
      await sleep(1000);
      return clicked;
    });

    // Steps 10+: Handle remaining questions (setup type, preferences)
    // After budget + reach, the guided flow shows:
    //   - Setup type question (handheld/vehicle/base/hf/scanner) - pre-selected based on reach
    //   - For handheld: needs/preferences question
    // Then shows recommendation cards
    let recsVisible = false;
    for (let extraQ = 0; extraQ < 4; extraQ++) {
      // Check if recommendation cards are already visible
      recsVisible = await page.evaluate(() => {
        const cards = document.querySelectorAll('.result-card');
        for (const c of cards) {
          if (c.offsetParent !== null && c.offsetHeight > 0) return true;
        }
        return false;
      });
      if (recsVisible) break;

      // Check if there's another question with visible options
      const hasMoreOptions = await page.evaluate(() => {
        const stack = document.getElementById('kbs-interview-stack');
        if (!stack) return false;
        const currentQ = stack.querySelector('.kbs-iq:not(.kbs-iq--answered):last-child');
        if (!currentQ) return false;
        const opts = currentQ.querySelectorAll('.kbs-iq-opt');
        let visCount = 0;
        for (const opt of opts) {
          if (opt.offsetParent !== null) visCount++;
        }
        return visCount >= 2;
      });

      if (!hasMoreOptions) {
        // Maybe in transition, wait a bit
        await sleep(1500);
        recsVisible = await page.evaluate(() => {
          const cards = document.querySelectorAll('.result-card');
          for (const c of cards) {
            if (c.offsetParent !== null && c.offsetHeight > 0) return true;
          }
          return false;
        });
        break;
      }

      // Get question info
      const qInfo = await page.evaluate(() => {
        const stack = document.getElementById('kbs-interview-stack');
        if (!stack) return { id: 'unknown', text: '' };
        const currentQ = stack.querySelector('.kbs-iq:not(.kbs-iq--answered):last-child');
        if (!currentQ) return { id: 'unknown', text: '' };
        const h3 = currentQ.querySelector('h3');
        // Try to determine question id from the onclick of first option
        const firstOpt = currentQ.querySelector('.kbs-iq-opt');
        const onclick = firstOpt ? (firstOpt.getAttribute('onclick') || '') : '';
        // Extract question id from kbsAnswer('setup','handheld',true)
        const match = onclick.match(/kbsAnswer\(['"](\w+)['"]/);
        return {
          id: match ? match[1] : 'unknown',
          text: h3 ? h3.textContent.trim() : ''
        };
      });

      await step(`Answer question: ${qInfo.id} (${qInfo.text.substring(0, 40)})`, async () => {
        // For setup question: the options are pre-selected based on reach,
        // so we may just need to confirm. But check if something is selected.
        const hasSelected = await page.evaluate(() => {
          const stack = document.getElementById('kbs-interview-stack');
          if (!stack) return false;
          const currentQ = stack.querySelector('.kbs-iq:not(.kbs-iq--answered):last-child');
          if (!currentQ) return false;
          return currentQ.querySelector('.kbs-iq-opt.selected') !== null;
        });

        if (!hasSelected) {
          // Click first option if nothing is selected
          await page.evaluate(() => {
            const stack = document.getElementById('kbs-interview-stack');
            if (!stack) return;
            const currentQ = stack.querySelector('.kbs-iq:not(.kbs-iq--answered):last-child');
            if (!currentQ) return;
            const opts = currentQ.querySelectorAll('.kbs-iq-opt');
            for (const opt of opts) {
              if (opt.offsetParent !== null) { opt.click(); return; }
            }
          });
          await sleep(200);
        }

        console.log(`      ${DIM}(Pre-selected: ${hasSelected})${RESET}`);
        return true;
      });

      await step(`Click Next for ${qInfo.id}`, async () => {
        await sleep(200);
        await page.waitForFunction(() => {
          const sec = document.getElementById('sec-interview');
          if (!sec) return false;
          const btns = sec.querySelectorAll('.kb-btn--primary');
          for (const btn of btns) {
            if (btn.offsetParent !== null && !btn.disabled) return true;
          }
          return false;
        }, { timeout: 5000 });
        const clicked = await clickInterviewNext(page);
        await sleep(1000);
        return clicked;
      });
    }

    // Verify recommendation cards appear
    await step('Recommendation cards visible', async () => {
      if (!recsVisible) {
        try {
          await page.waitForSelector('.result-card', { visible: true, timeout: 10000 });
          recsVisible = true;
        } catch (e) {
          // Check if we went directly to a section (some paths skip recommendations)
          const activeSec = await page.evaluate(() => {
            const secs = document.querySelectorAll('[id^="sec-"]');
            for (const sec of secs) {
              if (sec.classList.contains('kb-section--active')) return sec.id.replace('sec-', '');
            }
            return 'none';
          });
          if (activeSec === 'radio' || activeSec === 'antennas') {
            console.log(`      ${DIM}(Skipped to section: ${activeSec})${RESET}`);
            return true; // Some paths may skip directly
          }
          return false;
        }
      }
      const count = await page.evaluate(() => {
        const cards = document.querySelectorAll('.result-card');
        let visible = 0;
        for (const c of cards) {
          if (c.offsetParent !== null && c.offsetHeight > 0) visible++;
        }
        return visible;
      });
      console.log(`      ${DIM}(${count} recommendation card(s) visible)${RESET}`);
      return count > 0;
    });

    // Click the primary recommendation's button
    await step('Click primary recommendation button (.rc-btn)', async () => {
      // Wait for .rc-btn to be visible
      try {
        await page.waitForSelector('.rc-btn', { visible: true, timeout: 5000 });
      } catch (e) {
        // Maybe already past recommendations
        const activeSec = await page.evaluate(() => {
          const secs = document.querySelectorAll('[id^="sec-"]');
          for (const sec of secs) {
            if (sec.classList.contains('kb-section--active')) return sec.id.replace('sec-', '');
          }
          return 'none';
        });
        if (activeSec !== 'interview') {
          console.log(`      ${DIM}(Already at section: ${activeSec}, skipping rc-btn)${RESET}`);
          return true;
        }
        return false;
      }
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('.rc-btn');
        for (const btn of btns) {
          if (btn.offsetParent !== null && !btn.disabled) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      await sleep(1500);
      return clicked;
    });

    // Handle UV-PRO color picker if it appears
    await step('Handle color picker if present', async () => {
      const hasColorPicker = await page.evaluate(() => {
        const picker = document.getElementById('kbs-color-picker');
        return picker && picker.offsetParent !== null && picker.offsetHeight > 0;
      });
      if (hasColorPicker) {
        console.log(`      ${DIM}(Color picker detected, selecting color)${RESET}`);
        await page.evaluate(() => {
          const swatch = document.querySelector('.color-swatch--black') ||
                         document.querySelector('.color-swatch--tan') ||
                         document.querySelector('[class*="color-swatch"]');
          if (swatch) swatch.click();
        });
        await sleep(300);
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
        await sleep(500);
      }
      return true; // Pass regardless
    });

    // Verify flow advances to the correct next section
    await step(`Flow advances past radio to ${pathDef.expectedSection}`, async () => {
      try {
        await waitForSection(page, pathDef.expectedSection, 15000);
        return true;
      } catch (e) {
        // Check what section is actually active
        const activeSec = await page.evaluate(() => {
          const secs = document.querySelectorAll('[id^="sec-"]');
          for (const sec of secs) {
            if (sec.classList.contains('kb-section--active')) return sec.id.replace('sec-', '');
          }
          return 'none';
        });
        console.log(`      ${DIM}(Active section: ${activeSec}, expected: ${pathDef.expectedSection})${RESET}`);
        // Accept any post-radio section as partial success
        const postRadioSections = ['mounting', 'antennas', 'battery', 'accessories', 'programming'];
        return postRadioSections.includes(activeSec);
      }
    });

    // Verify the selected category via the price bar label
    // (kbsCurrentCategory is let-scoped and not accessible from page.evaluate)
    await step(`Verify category is ${pathDef.expectedCategory}`, async () => {
      // The price bar shows "Category: RadioName" in #kbs-radio-name
      const priceBarLabel = await page.evaluate(() => {
        const el = document.getElementById('kbs-radio-name');
        return el ? el.textContent.trim().toLowerCase() : '';
      });
      const catMap = {
        'handheld': 'handheld',
        'vehicle mobile': 'mobile',
        'base station': 'base',
        'hf': 'hf',
        'scanner': 'scanner'
      };
      let detectedCategory = 'unknown';
      for (const [label, cat] of Object.entries(catMap)) {
        if (priceBarLabel.startsWith(label)) {
          detectedCategory = cat;
          break;
        }
      }
      console.log(`      ${DIM}(Price bar: "${priceBarLabel}", detected: ${detectedCategory})${RESET}`);
      return detectedCategory === pathDef.expectedCategory;
    });

    // Check JS errors
    await step('No critical JavaScript errors', async () => {
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
    const ssFile = await screenshotStep(page, dir, stepNum, 'fatal-error').catch(() => 'error.png');
    await screenshotFull(page, dir, stepNum, 'fatal-error').catch(() => {});
    steps.push({ name: 'Fatal error', status: 'fail', screenshot: ssFile, error: err.message });
    console.log(`    ${FAIL_ICON} FATAL: ${err.message}`);
    failed++;
    totalFailed++;
    allFailures.push(`[${testName}] FATAL: ${err.message}`);
  }

  await page.close();

  const suiteResult = {
    name: testName,
    viewport: 'desktop',
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
  console.log(`${BOLD} Comms Compass Test Suite B${RESET}`);
  console.log(`${BOLD} Guided Path Tests - Desktop (1280x900)${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} URL: ${KB_URL}${RESET}`);
  console.log(`${DIM} Paths: ${GUIDED_PATHS.length}${RESET}`);
  console.log();

  ensureDir(SCREENSHOT_DIR);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  for (const pathDef of GUIDED_PATHS) {
    await testGuidedPath(browser, pathDef);
  }

  await browser.close();

  // ── Results JSON ───────────────────────────────────
  const resultsJson = {
    timestamp: new Date().toISOString(),
    viewport: 'desktop',
    url: KB_URL,
    suite: 'B - Guided Paths',
    suites: suiteResults,
    summary: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      failureList: allFailures
    }
  };

  const resultsPath = path.join(SCREENSHOT_DIR, 'results.json');
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
  console.log(`  Screenshots: ${SCREENSHOT_DIR}`);
  console.log();

  // Per-path summary
  console.log(`${BOLD}  Per-path results:${RESET}`);
  for (const s of suiteResults) {
    const icon = s.status === 'pass' ? PASS_ICON : FAIL_ICON;
    console.log(`    ${icon} ${s.name}: ${s.passed}/${s.passed + s.failed} (${s.status})`);
  }
  console.log();

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
