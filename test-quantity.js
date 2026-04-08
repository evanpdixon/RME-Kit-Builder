const puppeteer = require('puppeteer');
const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const PASS = '[PASS]';
const FAIL = '[FAIL]';
let failures = [];

function check(label, condition, detail) {
  if (condition) { console.log(PASS, label); }
  else { console.log(FAIL, label, detail || ''); failures.push(label); }
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);

  // Skip email -> Direct -> Handheld -> Select radio
  await page.click('a.kb-skip-link');
  await sleep(3000);
  await page.evaluate(() => kbsStartDirect());
  await sleep(800);
  await page.evaluate(() => {
    document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Handheld')) o.click();
    });
  });
  await sleep(300);
  await page.evaluate(() => kbsDirectProceed());
  await sleep(3000);
  await page.evaluate(() => {
    const pick = document.querySelector('#kbs-radio-grid .radio-pick');
    if (pick) pick.click();
  });
  await sleep(4000);

  // Advance through antennas, battery, accessories, programming
  for (const sec of ['antennas', 'battery', 'accessories', 'programming']) {
    await sleep(2500);
    await page.evaluate((s) => kbsCompleteSection(s), sec);
  }
  await sleep(3000);

  // Review should be active with "Looks Good" button
  const reviewActive = await page.evaluate(() => {
    const el = document.getElementById('sec-review');
    return el && el.classList.contains('kb-section--active');
  });
  check('Review section active', reviewActive);

  const looksGoodBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) return true; }
    return false;
  });
  check('"Looks Good" button visible in review', looksGoodBtn);

  // Click "Looks Good" to advance to quantity
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) { b.click(); break; } }
  });
  await sleep(3500);

  // Quantity section should be active
  const qtyActive = await page.evaluate(() => {
    const el = document.getElementById('sec-quantity');
    return el && el.classList.contains('kb-section--active');
  });
  check('Quantity section active after review', qtyActive);

  // Should show qty=1 by default
  const qtyValue = await page.evaluate(() => {
    const el = document.querySelector('.kbs-qty-value');
    return el ? el.textContent.trim() : '';
  });
  check('Default quantity is 1', qtyValue === '1');

  // Cart button should be enabled
  const cartEnabled = await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn');
    return btn && !btn.disabled;
  });
  check('Cart button enabled on quantity step', cartEnabled);

  // Get base price
  const basePrice = await page.evaluate(() => {
    return document.getElementById('kbs-total')?.textContent || '';
  });
  console.log('  Price at qty=1:', basePrice);

  // Increase to 2
  await page.evaluate(() => kbsAdjustQty(1));
  await sleep(500);

  const qtyValue2 = await page.evaluate(() => {
    const el = document.querySelector('.kbs-qty-value');
    return el ? el.textContent.trim() : '';
  });
  check('Quantity increased to 2', qtyValue2 === '2');

  // Should show Team Pack badge
  const tierBadge = await page.evaluate(() => {
    const el = document.querySelector('.kbs-tier-badge');
    return el ? el.textContent : '';
  });
  check('Team Pack badge shown at qty=2', tierBadge.includes('Team Pack'));

  // Should show nudge for next tier
  const nudge = await page.evaluate(() => {
    const el = document.querySelector('.kbs-tier-nudge');
    return el ? el.textContent : '';
  });
  check('Nudge shown for next tier', nudge.includes('more'));

  // Price should reflect 2x with discount
  const price2 = await page.evaluate(() => {
    return document.getElementById('kbs-total')?.textContent || '';
  });
  console.log('  Price at qty=2:', price2);
  // Price at 2 should be less than 2x base price (due to 5% discount on base)
  const basePriceNum = parseInt(basePrice.replace('$', ''));
  const price2Num = parseInt(price2.replace('$', ''));
  check('Price at qty=2 is less than 2x base', price2Num < basePriceNum * 2, 'base=' + basePriceNum + ' x2=' + price2Num);

  // Increase to 4 (Group Pack)
  await page.evaluate(() => kbsAdjustQty(1));
  await page.evaluate(() => kbsAdjustQty(1));
  await sleep(500);

  const tierBadge4 = await page.evaluate(() => {
    const el = document.querySelector('.kbs-tier-badge');
    return el ? el.textContent : '';
  });
  check('Group Pack badge shown at qty=4', tierBadge4.includes('Group Pack'));

  const price4 = await page.evaluate(() => {
    return document.getElementById('kbs-total')?.textContent || '';
  });
  console.log('  Price at qty=4:', price4);

  // Decrease back to 1
  await page.evaluate(() => { for (var i = 0; i < 3; i++) kbsAdjustQty(-1); });
  await sleep(500);

  const qtyBack1 = await page.evaluate(() => {
    const el = document.querySelector('.kbs-qty-value');
    return el ? el.textContent.trim() : '';
  });
  check('Decreased back to 1', qtyBack1 === '1');

  const noBadge = await page.evaluate(() => {
    const el = document.querySelector('.kbs-tier-badge');
    return el === null;
  });
  check('No tier badge at qty=1', noBadge);

  // Cannot go below 1
  await page.evaluate(() => kbsAdjustQty(-1));
  await sleep(200);
  const qtyMin = await page.evaluate(() => {
    const el = document.querySelector('.kbs-qty-value');
    return el ? el.textContent.trim() : '';
  });
  check('Cannot go below 1', qtyMin === '1');

  // Take screenshot
  await page.evaluate(() => kbsAdjustQty(1)); // set to 2 for screenshot
  await sleep(500);
  const path = require('path');
  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'quantity-picker.png'), fullPage: true });

  console.log('\n' + '='.repeat(40));
  console.log('RESULTS: ' + (failures.length === 0 ? 'ALL PASSED' : failures.length + ' FAILED'));
  if (failures.length) failures.forEach(f => console.log('  -', f));

  await browser.close();
  process.exit(failures.length > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
