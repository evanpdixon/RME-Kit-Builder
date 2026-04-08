const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname);
const BASE_URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const VIEWPORT = { width: 1280, height: 900 };

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshot(page, name) {
  await delay(500);
  const fpath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: fpath, fullPage: true });
  console.log(`  Saved: ${name}.png`);
}

async function scrollScreenshot(page, name) {
  // Take a full-page screenshot
  await delay(500);
  const fpath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: fpath, fullPage: true });
  console.log(`  Saved: ${name}.png`);
}

async function clickText(page, text, selector = '') {
  const sel = selector || 'button, .opt-card, .radio-card, .category-card, h3, h4, label, a, [role="button"]';
  const els = await page.$$(sel);
  for (const el of els) {
    const t = await el.evaluate(e => e.textContent.trim());
    if (t.includes(text)) {
      await el.scrollIntoViewIfNeeded();
      await el.click();
      await delay(1000);
      return true;
    }
  }
  console.log(`  WARNING: Could not find "${text}"`);
  return false;
}

async function clickSelector(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    const el = await page.$(selector);
    if (el) {
      await el.scrollIntoViewIfNeeded();
      await el.click();
      await delay(1000);
      return true;
    }
  } catch (e) {
    console.log(`  WARNING: Selector not found: ${selector}`);
  }
  return false;
}

async function navigateToKitBuilder(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1500);
}

// Utility: scroll down the page in steps and capture visible sections
async function scrollAndCapture(page, name) {
  await delay(500);
  // Full page screenshot
  const fpath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: fpath, fullPage: true });
  console.log(`  Saved: ${name}.png`);
}

async function findAndClickCard(page, radioName) {
  // Try clicking on a radio card by partial text match
  const cards = await page.$$('.radio-card, .opt-card, [class*="card"]');
  for (const card of cards) {
    const text = await card.evaluate(e => e.textContent.trim());
    if (text.includes(radioName)) {
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await delay(1000);
      return true;
    }
  }
  console.log(`  WARNING: Card "${radioName}" not found`);
  return false;
}

async function clickNextOrContinue(page) {
  // Look for next/continue buttons
  const btns = await page.$$('button, .btn, [role="button"], a.button, .next-btn, .continue-btn');
  for (const btn of btns) {
    const text = await btn.evaluate(e => e.textContent.trim().toLowerCase());
    if (text.includes('next') || text.includes('continue') || text.includes('proceed')) {
      const visible = await btn.evaluate(e => {
        const s = getComputedStyle(e);
        return s.display !== 'none' && s.visibility !== 'hidden' && e.offsetParent !== null;
      });
      if (visible) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await delay(1500);
        return true;
      }
    }
  }
  console.log('  WARNING: No next/continue button found');
  return false;
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  try {
    // ============================================
    // FLOW 1: Handheld - UV-5R ("I Know What I Want")
    // ============================================
    console.log('\n=== FLOW 1: Handheld UV-5R ===');
    await navigateToKitBuilder(page);
    await scrollAndCapture(page, '01-landing-page');

    // Click "I Know What I Want"
    await clickText(page, 'I Know What I Want');
    await delay(1000);
    await scrollAndCapture(page, '02-category-selection');

    // Click Handheld
    await clickText(page, 'Handheld');
    await delay(1000);
    await scrollAndCapture(page, '03-handheld-radios');

    // Click UV-5R
    await findAndClickCard(page, 'UV-5R');
    await delay(1500);
    await scrollAndCapture(page, '04-handheld-uv5r-selected');

    // Navigate through sections - click next/continue
    await clickNextOrContinue(page);
    await scrollAndCapture(page, '05-handheld-antennas');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '06-handheld-battery');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '07-handheld-accessories');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '08-handheld-programming');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '09-handheld-review');

    // ============================================
    // FLOW 2: Vehicle - UV-50PRO
    // ============================================
    console.log('\n=== FLOW 2: Vehicle UV-50PRO ===');
    await navigateToKitBuilder(page);

    await clickText(page, 'I Know What I Want');
    await delay(1000);

    await clickText(page, 'Vehicle');
    await delay(1000);
    await scrollAndCapture(page, '10-vehicle-radios');

    // Try UV-50X2 or similar vehicle radio names
    let found = await findAndClickCard(page, 'UV-50PRO');
    if (!found) found = await findAndClickCard(page, 'UV-50');
    if (!found) found = await findAndClickCard(page, '50PRO');
    if (!found) {
      // Just click the first radio card
      const cards = await page.$$('.radio-card, [class*="card"]');
      if (cards.length > 0) {
        await cards[0].scrollIntoViewIfNeeded();
        await cards[0].click();
        await delay(1000);
        console.log('  Clicked first vehicle radio card');
      }
    }
    await delay(1500);
    await scrollAndCapture(page, '11-vehicle-radio-selected');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '12-vehicle-mounting');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '13-vehicle-antennas');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '14-vehicle-battery-power');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '15-vehicle-accessories');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '16-vehicle-programming');

    // ============================================
    // FLOW 3: Base Station - D578
    // ============================================
    console.log('\n=== FLOW 3: Base Station D578 ===');
    await navigateToKitBuilder(page);

    await clickText(page, 'I Know What I Want');
    await delay(1000);

    await clickText(page, 'Base Station');
    if (!(await findAndClickCard(page, 'Base'))) {
      await clickText(page, 'Base');
    }
    await delay(1000);
    await scrollAndCapture(page, '17-base-radios');

    found = await findAndClickCard(page, 'D578');
    if (!found) found = await findAndClickCard(page, '578');
    if (!found) {
      const cards = await page.$$('.radio-card, [class*="card"]');
      if (cards.length > 0) {
        await cards[0].scrollIntoViewIfNeeded();
        await cards[0].click();
        console.log('  Clicked first base station radio card');
      }
    }
    await delay(1500);
    await scrollAndCapture(page, '18-base-radio-selected');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '19-base-antennas');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '20-base-power');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '21-base-accessories');

    // ============================================
    // FLOW 4: HF - G90
    // ============================================
    console.log('\n=== FLOW 4: HF G90 ===');
    await navigateToKitBuilder(page);

    await clickText(page, 'I Know What I Want');
    await delay(1000);

    await clickText(page, 'HF');
    await delay(1000);
    await scrollAndCapture(page, '22-hf-radios');

    found = await findAndClickCard(page, 'G90');
    if (!found) {
      const cards = await page.$$('.radio-card, [class*="card"]');
      if (cards.length > 0) {
        await cards[0].scrollIntoViewIfNeeded();
        await cards[0].click();
        console.log('  Clicked first HF radio card');
      }
    }
    await delay(1500);
    await scrollAndCapture(page, '23-hf-radio-selected');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '24-hf-antennas');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '25-hf-accessories');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '26-hf-programming');

    // ============================================
    // FLOW 5: Scanner - SDS200
    // ============================================
    console.log('\n=== FLOW 5: Scanner SDS200 ===');
    await navigateToKitBuilder(page);

    await clickText(page, 'I Know What I Want');
    await delay(1000);

    await clickText(page, 'Scanner');
    await delay(1000);
    await scrollAndCapture(page, '27-scanner-radios');

    found = await findAndClickCard(page, 'SDS200');
    if (!found) found = await findAndClickCard(page, 'SDS');
    if (!found) {
      const cards = await page.$$('.radio-card, [class*="card"]');
      if (cards.length > 0) {
        await cards[0].scrollIntoViewIfNeeded();
        await cards[0].click();
        console.log('  Clicked first scanner radio card');
      }
    }
    await delay(1500);
    await scrollAndCapture(page, '28-scanner-radio-selected');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '29-scanner-antennas');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '30-scanner-accessories');

    await clickNextOrContinue(page);
    await scrollAndCapture(page, '31-scanner-programming');

    // ============================================
    // FLOW 6: Guided - Help Me Choose
    // ============================================
    console.log('\n=== FLOW 6: Guided Flow ===');
    await navigateToKitBuilder(page);

    await clickText(page, 'Help Me Choose');
    await delay(1000);
    await scrollAndCapture(page, '32-guided-start');

    // Budget question
    await clickText(page, 'Budget');
    await delay(1000);
    await scrollAndCapture(page, '33-guided-budget');

    // Nearby / distance question
    await clickText(page, 'Nearby');
    if (!(await findAndClickCard(page, 'Nearby'))) {
      await clickText(page, 'Short');
    }
    await delay(1500);
    await scrollAndCapture(page, '34-guided-recommendations');

    // Try to continue through guided flow
    await clickNextOrContinue(page);
    await scrollAndCapture(page, '35-guided-next');

  } catch (err) {
    console.error('Error:', err.message);
    await scrollAndCapture(page, 'ERROR-state');
  }

  await browser.close();
  console.log('\nAudit complete! Screenshots saved to:', SCREENSHOT_DIR);
}

run().catch(console.error);
