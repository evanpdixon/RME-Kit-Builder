const puppeteer = require('puppeteer');
const path = require('path');

const DIR = path.resolve(__dirname);
const URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const VP = { width: 1280, height: 900 };

const delay = ms => new Promise(r => setTimeout(r, ms));

async function snap(page, name) {
  await delay(600);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true });
  console.log(`  [OK] ${name}.png`);
}

async function fresh(page) {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1500);
  // Skip email
  await page.evaluate(() => { if (typeof kbsSkipEmail === 'function') kbsSkipEmail(); });
  await delay(1500);
}

async function clickChoiceCard(page, text) {
  await page.evaluate((t) => {
    const cards = document.querySelectorAll('.kbs-choice-card h3');
    for (const h of cards) {
      if (h.textContent.includes(t)) { h.closest('.kbs-choice-card').click(); return; }
    }
  }, text);
  await delay(1500);
}

async function clickCategoryBtn(page, cat) {
  await page.evaluate((c) => {
    const btns = document.querySelectorAll('.kbs-cat-btn, .category-btn, button');
    for (const b of btns) {
      if (b.textContent.trim().toLowerCase().includes(c.toLowerCase())) { b.click(); return; }
    }
    // Fallback: look for data attributes
    const all = document.querySelectorAll('[data-category]');
    for (const el of all) {
      if (el.dataset.category === c.toLowerCase()) { el.click(); return; }
    }
  }, cat);
  await delay(1500);
}

async function clickRadioCard(page, radioName) {
  await page.evaluate((name) => {
    const cards = document.querySelectorAll('.radio-card, .kbs-radio-card');
    for (const c of cards) {
      if (c.textContent.includes(name)) { c.click(); return; }
    }
  }, radioName);
  await delay(1500);
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
  await snap(page, '01-interview-choice');

  // "I Know What I Want"
  await clickChoiceCard(page, 'I Know What I Want');
  await delay(1000);
  await snap(page, '02-direct-categories');

  // Dump the category buttons to see what's on screen
  const catButtons = await page.evaluate(() => {
    const els = document.querySelectorAll('#sec-interview button, #sec-interview .kbs-cat-btn, #sec-interview [data-category]');
    return Array.from(els).map(e => ({ tag: e.tagName, text: e.textContent.trim().slice(0, 60), classes: e.className, dataCat: e.dataset.category || '' }));
  });
  console.log('  Category buttons found:', JSON.stringify(catButtons, null, 2));

  // Click Handheld category
  await clickCategoryBtn(page, 'Handheld');
  await delay(1500);
  await snap(page, '03-handheld-radio-grid');

  // Dump radio cards
  const radioCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-card, #kbs-radio-grid [class*="radio"]');
    return Array.from(cards).map(e => e.textContent.trim().slice(0, 80));
  });
  console.log('  Radio cards:', radioCards);

  // Click UV-5R
  await clickRadioCard(page, 'UV-5R');
  await delay(1500);
  await snap(page, '04-handheld-uv5r-antennas');

  // Now we should be in antennas section
  await snap(page, '05-handheld-antennas-full');

  // Continue through each section
  await clickContinue(page, 'antennas');
  await snap(page, '06-handheld-battery');

  await clickContinue(page, 'battery');
  await snap(page, '07-handheld-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '08-handheld-programming');

  await clickContinue(page, 'programming');
  await snap(page, '09-handheld-review');

  // ============================================
  // FLOW 2: Vehicle - look for available radios
  // ============================================
  console.log('\n=== FLOW 2: Vehicle ===');
  await fresh(page);
  await clickChoiceCard(page, 'I Know What I Want');
  await delay(1000);

  await clickCategoryBtn(page, 'Vehicle');
  await delay(1500);
  await snap(page, '10-vehicle-radio-grid');

  // Dump vehicle radio names
  const vRadios = await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-card');
    return Array.from(cards).map(e => e.textContent.trim().slice(0, 80));
  });
  console.log('  Vehicle radios:', vRadios);

  // Click first available vehicle radio (likely UV-50X2 PRO or similar)
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-card');
    if (cards.length) cards[0].click();
  });
  await delay(2000);
  await snap(page, '11-vehicle-radio-selected');

  // Mounting
  await snap(page, '12-vehicle-mounting');
  await clickContinue(page, 'mounting');
  await snap(page, '13-vehicle-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '14-vehicle-battery-power');

  await clickContinue(page, 'battery');
  await snap(page, '15-vehicle-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '16-vehicle-programming');

  // ============================================
  // FLOW 3: Base Station
  // ============================================
  console.log('\n=== FLOW 3: Base Station ===');
  await fresh(page);
  await clickChoiceCard(page, 'I Know What I Want');
  await delay(1000);

  await clickCategoryBtn(page, 'Base');
  await delay(1500);
  await snap(page, '17-base-radio-grid');

  // Click first base radio
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-card');
    if (cards.length) cards[0].click();
  });
  await delay(2000);
  await snap(page, '18-base-radio-selected');

  await clickContinue(page, 'mounting');
  await snap(page, '19-base-antennas');

  await clickContinue(page, 'antennas');
  await snap(page, '20-base-power');

  await clickContinue(page, 'battery');
  await snap(page, '21-base-accessories');

  // ============================================
  // FLOW 4: HF - G90
  // ============================================
  console.log('\n=== FLOW 4: HF ===');
  await fresh(page);
  await clickChoiceCard(page, 'I Know What I Want');
  await delay(1000);

  await clickCategoryBtn(page, 'HF');
  await delay(1500);
  await snap(page, '22-hf-radio-grid');

  await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-card');
    if (cards.length) cards[0].click();
  });
  await delay(2000);
  await snap(page, '23-hf-radio-selected');

  await clickContinue(page, 'antennas');
  await snap(page, '24-hf-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '25-hf-programming');

  // ============================================
  // FLOW 5: Scanner
  // ============================================
  console.log('\n=== FLOW 5: Scanner ===');
  await fresh(page);
  await clickChoiceCard(page, 'I Know What I Want');
  await delay(1000);

  await clickCategoryBtn(page, 'Scanner');
  await delay(1500);
  await snap(page, '26-scanner-radio-grid');

  await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-card');
    if (cards.length) cards[0].click();
  });
  await delay(2000);
  await snap(page, '27-scanner-radio-selected');

  await clickContinue(page, 'antennas');
  await snap(page, '28-scanner-accessories');

  await clickContinue(page, 'accessories');
  await snap(page, '29-scanner-programming');

  // ============================================
  // FLOW 6: Guided - Help Me Choose
  // ============================================
  console.log('\n=== FLOW 6: Guided ===');
  await fresh(page);
  await clickChoiceCard(page, 'Help Me Choose');
  await delay(1500);
  await snap(page, '30-guided-q1');

  // Dump the guided interview to see what questions appear
  const interviewContent = await page.evaluate(() => {
    const stack = document.querySelector('#kbs-interview-stack');
    return stack ? stack.innerHTML.slice(0, 3000) : 'stack not found';
  });
  console.log('  Interview HTML (first 500):', interviewContent.slice(0, 500));

  // Click first answer option
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#kbs-interview-stack .kbs-answer-btn, #kbs-interview-stack button, #kbs-interview-stack .kbs-choice-card');
    if (btns.length) btns[0].click();
  });
  await delay(1500);
  await snap(page, '31-guided-q2');

  // Click first answer again
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#kbs-interview-stack .kbs-answer-btn, #kbs-interview-stack button, #kbs-interview-stack .kbs-choice-card');
    // Click the last visible one (latest question)
    const visible = Array.from(btns).filter(b => b.offsetParent !== null);
    if (visible.length) visible[visible.length - 1].click();
  });
  await delay(1500);
  await snap(page, '32-guided-q3');

  // Keep answering
  for (let i = 3; i <= 6; i++) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('#kbs-interview-stack .kbs-answer-btn, #kbs-interview-stack button');
      const visible = Array.from(btns).filter(b => b.offsetParent !== null && !b.classList.contains('selected'));
      if (visible.length) visible[visible.length - 1].click();
    });
    await delay(1500);
    await snap(page, `33-guided-q${i}`);
  }

  // Check if we reached recommendations
  await snap(page, '34-guided-recommendations');

  await browser.close();
  console.log('\nDone! Screenshots in:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
