const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = 'C:/Claude/temp/kb-v2-reaudit/desktop';
const URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const VIEWPORT = { width: 1280, height: 800 };

let screenshotIndex = 0;

async function ss(page, name, opts = {}) {
  screenshotIndex++;
  const prefix = String(screenshotIndex).padStart(2, '0');
  const filename = `${prefix}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: opts.fullPage !== false, ...opts });
  console.log(`  [${prefix}] ${filename}`);
  return filepath;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForSection(page, sectionId, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const isActive = await page.evaluate((id) => {
      const sec = document.getElementById(id);
      return sec && sec.classList.contains('kb-section--active');
    }, sectionId);
    if (isActive) return true;
    await sleep(300);
  }
  console.log(`  WARNING: Section "${sectionId}" did not become active within ${timeout}ms`);
  return false;
}

async function guidedFlow(page) {
  console.log('\n========================================');
  console.log('  GUIDED FLOW (Handheld, Mid-range)');
  console.log('========================================\n');

  // 1. Initial state
  console.log('Step 1: Loading page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  await ss(page, 'initial-state');

  // 2. Enter email and submit
  console.log('Step 2: Email entry...');
  await page.fill('#kbs-lead-email', 'test@reaudit.com');
  await sleep(300);
  await page.evaluate(() => kbsSubmitEmail());
  await sleep(2000);
  await waitForSection(page, 'sec-interview');
  await sleep(500);
  await ss(page, 'path-choice');

  // 3. Help Me Choose
  console.log('Step 3: Help Me Choose...');
  await page.evaluate(() => kbsStartGuided());
  await sleep(1500);
  await ss(page, 'q1-budget');

  // 4. Q1: Budget -> Mid-range, then Next
  console.log('Step 4: Q1 Budget = Mid-range...');
  await page.evaluate(() => kbsAnswer('budget', 'mid', false));
  await sleep(500);
  await ss(page, 'q1-midrange-selected');
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  await ss(page, 'q2-reach');

  // 5. Q2: Reach -> Local (multi-select), then Next
  console.log('Step 5: Q2 Reach = Local...');
  await page.evaluate(() => kbsAnswer('reach', 'local', true));
  await sleep(500);
  await ss(page, 'q2-local-selected');
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  await ss(page, 'q3-setup-type');

  // 6. Q3: Setup type -> Handheld (multi-select)
  console.log('Step 6: Q3 Setup = Handheld...');
  // CHECK: Verify no license text on this screen
  const q3Text = await page.evaluate(() => {
    const stack = document.getElementById('kbs-interview-stack');
    return stack ? stack.textContent : '';
  });
  console.log('  Q3 contains "license":', q3Text.toLowerCase().includes('license'));
  console.log('  Q3 contains "FCC":', q3Text.toLowerCase().includes('fcc'));

  await page.evaluate(() => kbsAnswer('setup', 'handheld', true));
  await sleep(500);
  await ss(page, 'q3-handheld-selected');
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  await ss(page, 'q4-features');

  // 7. Q4: Features/Needs - select a couple
  console.log('Step 7: Q4 Features...');
  // Get the available options
  const featureOpts = await page.evaluate(() => {
    const stack = document.getElementById('kbs-interview-stack');
    if (!stack) return [];
    const opts = stack.querySelectorAll('.kbs-iq:last-child .kbs-iq-opt');
    return Array.from(opts).map(o => {
      const onclick = o.getAttribute('onclick') || '';
      const match = onclick.match(/kbsAnswer\('(\w+)','(\w+)',/);
      return { text: o.textContent.trim().substring(0, 50), qId: match?.[1], optKey: match?.[2] };
    });
  });
  console.log('  Feature options:', featureOpts.map(f => f.optKey + ': ' + f.text).join(' | '));

  // Select first two features
  if (featureOpts.length >= 2) {
    const qId = featureOpts[0].qId;
    await page.evaluate(({qId, k}) => kbsAnswer(qId, k, true), { qId, k: featureOpts[0].optKey });
    await sleep(300);
    await page.evaluate(({qId, k}) => kbsAnswer(qId, k, true), { qId, k: featureOpts[1].optKey });
    await sleep(500);
  }
  await ss(page, 'q4-features-selected');

  // Click See Results (last question Next button becomes "See Results")
  console.log('Step 8: See Results...');
  await page.evaluate(() => kbsNextQ());
  await sleep(2500);
  await ss(page, 'recommendation-results');

  // Scroll to see the full recommendation
  await page.evaluate(() => {
    const cards = document.querySelector('.result-cards');
    if (cards) cards.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'recommendation-cards');

  // Check recommendation content
  const recText = await page.evaluate(() => {
    const stack = document.getElementById('kbs-interview-stack');
    return stack ? stack.textContent : '';
  });
  console.log('  Recommendation shows "Best Match":', recText.includes('Best Match'));
  console.log('  Shows setup answer:', recText.includes('Handheld'));

  // 9. Select the recommended radio
  console.log('Step 9: Select recommended radio...');
  const topRadioKey = await page.evaluate(() => {
    const btn = document.querySelector('.result-card.recommended .rc-btn');
    if (btn) {
      const onclick = btn.getAttribute('onclick') || '';
      const match = onclick.match(/kbsSelectRadio\('(\w+)'\)/);
      return match ? match[1] : null;
    }
    return null;
  });
  console.log('  Top radio key:', topRadioKey);

  if (topRadioKey) {
    await page.evaluate((key) => kbsSelectRadio(key), topRadioKey);
  } else {
    // Fallback: click first radio card
    await page.evaluate(() => {
      const card = document.querySelector('.result-card.recommended');
      if (card) card.click();
    });
  }
  await sleep(2000);
  await ss(page, 'radio-selected-antennas');

  // 10. Antennas section
  console.log('Step 10: Antennas section...');
  await waitForSection(page, 'sec-antennas', 10000);
  await sleep(1000);
  await page.evaluate(() => {
    const sec = document.getElementById('sec-antennas');
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'antennas-top');

  // Check antenna content for BNC language and BEST FOR labels
  const antennaText = await page.evaluate(() => {
    const sec = document.getElementById('sec-antennas');
    return sec ? sec.textContent : '';
  });
  console.log('  Antennas contain "BNC":', antennaText.includes('BNC'));
  console.log('  Antennas contain "BEST FOR":', antennaText.toUpperCase().includes('BEST FOR'));
  console.log('  Antennas contain "best for":', antennaText.toLowerCase().includes('best for'));

  // Check for sticky buttons
  const antennaHTML = await page.evaluate(() => {
    const sec = document.getElementById('sec-antennas');
    return sec ? sec.innerHTML.substring(0, 5000) : '';
  });
  console.log('  Antennas HTML has sticky:', antennaHTML.includes('sticky'));

  // Scroll down to see more antenna options
  await page.evaluate(() => window.scrollBy(0, 600));
  await sleep(300);
  await ss(page, 'antennas-scrolled');

  // Select first antenna
  console.log('Step 11: Select an antenna...');
  const antennaClicked = await page.evaluate(() => {
    const container = document.getElementById('antenna-options');
    if (!container) return 'no container';
    const cards = container.querySelectorAll('.addon-card, .option-card, [onclick]');
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        card.click();
        return 'clicked: ' + card.textContent?.trim().substring(0, 60);
      }
    }
    return 'no clickable antenna cards';
  });
  console.log('  Antenna click result:', antennaClicked);
  await sleep(1500);
  await ss(page, 'antenna-selected');

  // Check for adapter modal
  const adapterVisible = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    if (!modal) return false;
    return window.getComputedStyle(modal).display !== 'none';
  });
  if (adapterVisible) {
    console.log('  ** Adapter modal visible! **');
    await ss(page, 'adapter-modal-popup');
    await page.evaluate(() => adapterModalAdd());
    await sleep(1000);
    await ss(page, 'after-adapter-modal');
  }

  // Continue past antennas
  console.log('Step 12: Continue past antennas...');
  await page.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(1500);

  // 11. Battery section
  console.log('Step 13: Battery section...');
  await waitForSection(page, 'sec-battery', 10000);
  await sleep(1000);
  await page.evaluate(() => {
    const sec = document.getElementById('sec-battery');
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'battery-section');

  // Check battery content for runtime text
  const batteryText = await page.evaluate(() => {
    const sec = document.getElementById('sec-battery');
    return sec ? sec.textContent : '';
  });
  console.log('  Battery contains "runtime":', batteryText.toLowerCase().includes('runtime'));
  console.log('  Battery contains "hour":', batteryText.toLowerCase().includes('hour'));
  console.log('  Battery text excerpt:', batteryText.substring(0, 300));

  await page.evaluate(() => kbsCompleteSection('battery'));
  await sleep(1500);

  // 12. Accessories section
  console.log('Step 14: Accessories section...');
  await waitForSection(page, 'sec-accessories', 10000);
  await sleep(1000);
  await page.evaluate(() => {
    const sec = document.getElementById('sec-accessories');
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'accessories-section');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(300);
  await ss(page, 'accessories-scrolled');

  await page.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(1500);

  // 13. Programming section
  console.log('Step 15: Programming section...');
  await waitForSection(page, 'sec-programming', 10000);
  await sleep(1000);
  await page.evaluate(() => {
    const sec = document.getElementById('sec-programming');
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'programming-section');

  // Check for GMRS/FRS/NOAA text
  const progText = await page.evaluate(() => {
    const sec = document.getElementById('sec-programming');
    return sec ? sec.textContent : '';
  });
  console.log('  Programming contains "GMRS":', progText.includes('GMRS'));
  console.log('  Programming contains "FRS":', progText.includes('FRS'));
  console.log('  Programming contains "NOAA":', progText.includes('NOAA'));
  console.log('  Programming text excerpt:', progText.substring(0, 400));

  await page.evaluate(() => window.scrollBy(0, 400));
  await sleep(300);
  await ss(page, 'programming-scrolled');

  await page.evaluate(() => kbsCompleteSection('programming'));
  await sleep(1500);

  // 14. Review section
  console.log('Step 16: Review section...');
  await waitForSection(page, 'sec-review', 10000);
  await sleep(1000);
  await page.evaluate(() => {
    const sec = document.getElementById('sec-review');
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'review-section');

  // Check for "Continue to Checkout" button text
  const reviewHTML = await page.evaluate(() => {
    const sec = document.getElementById('sec-review');
    return sec ? sec.innerHTML : '';
  });
  console.log('  Review has "Continue to Checkout" button:', reviewHTML.includes('Continue to Checkout'));

  // Check for x buttons (remove items)
  const hasRemoveBtns = reviewHTML.includes('remove') || reviewHTML.includes('&times;') || reviewHTML.includes('×');
  console.log('  Review has remove/x buttons:', hasRemoveBtns);

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(300);
  await ss(page, 'review-scrolled');

  // Click Continue to Checkout
  console.log('Step 17: Continue to Checkout...');
  await page.evaluate(() => kbsCompleteSection('review'));
  await sleep(2000);

  // 15. Quantity section
  console.log('Step 18: Quantity section...');
  await waitForSection(page, 'sec-quantity', 10000);
  await sleep(1000);
  await page.evaluate(() => {
    const sec = document.getElementById('sec-quantity');
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await ss(page, 'quantity-section');

  // 16. Price bar check
  console.log('Step 19: Price bar analysis...');
  const priceBarInfo = await page.evaluate(() => {
    const bar = document.querySelector('.kb-scroll-price-bar');
    if (!bar) return { found: false };
    const style = window.getComputedStyle(bar);
    return {
      found: true,
      visible: style.display !== 'none',
      text: bar.textContent?.trim(),
      html: bar.innerHTML.substring(0, 1000),
      classes: bar.className,
    };
  });
  console.log('  Price bar:', JSON.stringify(priceBarInfo, null, 2));
  // Does it show total or base+addons separately?
  if (priceBarInfo.text) {
    console.log('  Shows "Total":', priceBarInfo.text.includes('Total'));
    console.log('  Shows "Base":', priceBarInfo.text.includes('Base'));
    console.log('  Shows "Addons":', priceBarInfo.text.includes('Addon'));
  }

  await ss(page, 'final-fullpage');
}

async function directPath(page) {
  console.log('\n========================================');
  console.log('  DIRECT PATH (I Know What I Want)');
  console.log('========================================\n');

  screenshotIndex = 30; // Offset for direct path screenshots

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);

  // Skip email
  console.log('Step 1: Skip email...');
  await page.evaluate(() => kbsSkipEmail());
  await sleep(1500);
  await waitForSection(page, 'sec-interview');
  await sleep(500);

  // Click I Know What I Want
  console.log('Step 2: I Know What I Want...');
  await page.evaluate(() => kbsStartDirect());
  await sleep(1500);
  await ss(page, 'direct-category-selection');

  // Get the direct path question info
  const directQ = await page.evaluate(() => {
    const stack = document.getElementById('kbs-interview-stack');
    if (!stack) return 'no stack';
    return stack.textContent?.substring(0, 500);
  });
  console.log('  Direct path content:', directQ.substring(0, 200));

  // Select Handheld
  console.log('Step 3: Select Handheld...');
  await page.evaluate(() => kbsAnswer('usage', 'handheld', true));
  await sleep(500);
  await ss(page, 'direct-handheld-selected');

  // Click Next/Proceed
  await page.evaluate(() => kbsNextQ());
  await sleep(2000);

  // Check what happened - might go to radio grid directly or ask more questions
  const currentState = await page.evaluate(() => {
    const states = {};
    ['sec-interview', 'sec-radio'].forEach(id => {
      const el = document.getElementById(id);
      states[id] = el ? el.className : 'not found';
    });
    return states;
  });
  console.log('  Section states:', currentState);

  await ss(page, 'direct-after-category');

  // If radio section is active, screenshot it
  if (currentState['sec-radio']?.includes('active')) {
    await page.evaluate(() => {
      const sec = document.getElementById('sec-radio');
      if (sec) sec.scrollIntoView({ block: 'start' });
    });
    await sleep(500);
    await ss(page, 'direct-radio-grid');

    await page.evaluate(() => window.scrollBy(0, 600));
    await sleep(300);
    await ss(page, 'direct-radio-grid-scrolled');
  } else {
    // Might need to answer more questions for direct handheld path
    // The direct path for handheld also asks interview questions (budget, reach, etc.)
    console.log('  Need to answer interview questions for direct handheld...');
    await ss(page, 'direct-interview-questions');

    // Answer them quickly
    // Check what question we're on
    const qText = await page.evaluate(() => {
      const stack = document.getElementById('kbs-interview-stack');
      const current = stack?.querySelector('.kbs-iq:last-child h3');
      return current?.textContent || 'unknown';
    });
    console.log('  Current question:', qText);
  }
}

async function main() {
  console.log('Launching Chromium headless at 1280x800...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  page.on('pageerror', err => console.log('  PAGE JS ERROR:', err.message));

  try {
    await guidedFlow(page);
  } catch (err) {
    console.error('ERROR in guided flow:', err.message);
    await ss(page, 'ERROR-guided-flow');
  }

  try {
    await directPath(page);
  } catch (err) {
    console.error('ERROR in direct path:', err.message);
    await ss(page, 'ERROR-direct-path');
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to:', SCREENSHOT_DIR);
}

main().catch(console.error);
