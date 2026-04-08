const puppeteer = require('puppeteer');
const path = require('path');

const DIR = path.resolve(__dirname);
const URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const VP = { width: 1280, height: 900 };
const delay = ms => new Promise(r => setTimeout(r, ms));

async function snap(page, name) {
  await delay(700);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true });
  console.log(`  [OK] ${name}.png`);
}

async function fresh(page) {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);
  // Skip email
  await page.evaluate(() => { if (typeof kbsSkipEmail === 'function') kbsSkipEmail(); });
  await delay(2000);
}

async function directPick(page, category) {
  // Click "I Know What I Want"
  await page.evaluate(() => { kbsStartDirect(); });
  await delay(1500);

  // Select category
  await page.evaluate((cat) => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) {
      if (o.textContent.toLowerCase().includes(cat.toLowerCase())) {
        o.click();
        break;
      }
    }
  }, category);
  await delay(500);

  // Click Next
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-interview .kb-btn--primary');
    for (const b of btns) {
      if (b.textContent.includes('Next')) { b.click(); break; }
    }
  });
  await delay(2000);
}

async function selectRadio(page, radioName) {
  await page.evaluate((name) => {
    const picks = document.querySelectorAll('.radio-pick');
    for (const p of picks) {
      if (p.textContent.includes(name)) { p.click(); return; }
    }
    // Fallback: click first non-OOS
    for (const p of picks) {
      if (!p.classList.contains('radio-pick--oos')) { p.click(); return; }
    }
  }, radioName);
  await delay(2500);
}

async function clickContinue(page, section) {
  await page.evaluate((sec) => {
    if (typeof kbsCompleteSection === 'function') kbsCompleteSection(sec);
  }, section);
  await delay(2000);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1280,900']
  });
  const page = await browser.newPage();
  await page.setViewport(VP);

  // ============================================
  // FLOW 1: Handheld - UV-5R
  // ============================================
  console.log('\n=== FLOW 1: Handheld UV-5R ===');
  await fresh(page);
  await directPick(page, 'Handheld');
  await snap(page, '01-handheld-radio-grid');

  await selectRadio(page, 'UV-5R');
  await snap(page, '02-handheld-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '03-handheld-battery');

  await clickContinue(page, 'battery');
  await snap(page, '04-handheld-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '05-handheld-programming');

  await clickContinue(page, 'programming');
  await snap(page, '06-handheld-review');

  // ============================================
  // FLOW 2: Vehicle
  // ============================================
  console.log('\n=== FLOW 2: Vehicle ===');
  await fresh(page);
  await directPick(page, 'Vehicle');
  await snap(page, '10-vehicle-radio-grid');

  // Select first vehicle radio
  await selectRadio(page, 'UV-50X2');
  await snap(page, '11-vehicle-mounting');

  await clickContinue(page, 'mounting');
  await snap(page, '12-vehicle-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '13-vehicle-battery');

  await clickContinue(page, 'battery');
  await snap(page, '14-vehicle-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '15-vehicle-programming');

  // ============================================
  // FLOW 3: Base Station
  // ============================================
  console.log('\n=== FLOW 3: Base Station ===');
  await fresh(page);
  await directPick(page, 'Base');
  await snap(page, '20-base-radio-grid');

  await selectRadio(page, '');  // first available
  await snap(page, '21-base-mounting');

  await clickContinue(page, 'mounting');
  await snap(page, '22-base-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '23-base-power');

  await clickContinue(page, 'battery');
  await snap(page, '24-base-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '25-base-programming');

  // ============================================
  // FLOW 4: HF
  // ============================================
  console.log('\n=== FLOW 4: HF ===');
  await fresh(page);
  await directPick(page, 'HF');
  await snap(page, '30-hf-radio-grid');

  await selectRadio(page, 'G90');
  await snap(page, '31-hf-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '32-hf-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '33-hf-programming');

  // ============================================
  // FLOW 5: Scanner
  // ============================================
  console.log('\n=== FLOW 5: Scanner ===');
  await fresh(page);
  await directPick(page, 'Scanner');
  await snap(page, '40-scanner-radio-grid');

  await selectRadio(page, 'SDS200');
  await snap(page, '41-scanner-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '42-scanner-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '43-scanner-programming');

  // ============================================
  // FLOW 6: Guided - Help Me Choose
  // ============================================
  console.log('\n=== FLOW 6: Guided ===');
  await fresh(page);

  // Click "Help Me Choose"
  await page.evaluate(() => { kbsStartGuided(); });
  await delay(1500);
  await snap(page, '50-guided-q1-type');

  // Answer: Budget friendly
  await page.evaluate(() => { kbsAnswer('budget', 'low', false); });
  await delay(1500);
  await snap(page, '51-guided-q2');

  // Answer the reach question: Nearby
  await page.evaluate(() => { kbsAnswer('reach', 'local', false); });
  await delay(1500);
  await snap(page, '52-guided-q3');

  // Continue answering remaining questions
  // The questions are dynamic based on answers. Let's just click through visible options.
  for (let i = 3; i <= 7; i++) {
    const clicked = await page.evaluate(() => {
      // Find the last visible unanswered question's first option
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt:not(.selected)');
      const visible = Array.from(opts).filter(o => o.offsetParent !== null);
      if (visible.length > 0) {
        visible[0].click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    await delay(1500);
    await snap(page, `53-guided-q${i}`);
  }

  // After all guided questions, we should see recommendations
  await delay(2000);
  await snap(page, '54-guided-recommendations');

  // Also try to see radio grid from guided flow
  const radioSection = await page.evaluate(() => {
    const sec = document.querySelector('#sec-radio');
    return sec ? sec.className : 'not found';
  });
  console.log('  Radio section state:', radioSection);
  await snap(page, '55-guided-radio-section');

  await browser.close();
  console.log('\nDone! Screenshots in:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
