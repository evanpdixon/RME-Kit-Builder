const puppeteer = require('puppeteer');
const path = require('path');
const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);

  // Skip email -> Direct -> Vehicle -> UV-50PRO -> skip antennas
  await page.click('a.kb-skip-link');
  await sleep(3000);
  await page.evaluate(() => kbsStartDirect());
  await sleep(800);
  await page.evaluate(() => {
    document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Vehicle')) o.click();
    });
  });
  await sleep(300);
  await page.evaluate(() => kbsDirectProceed());
  await sleep(3000);
  await page.evaluate(() => {
    document.querySelectorAll('#kbs-radio-grid .radio-pick').forEach(p => {
      if (p.textContent.includes('UV-50PRO')) p.click();
    });
  });
  await sleep(4000);
  await page.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(3500);

  // Now on Power Setup section
  const powerActive = await page.evaluate(() => {
    const el = document.getElementById('sec-battery');
    return el && el.classList.contains('kb-section--active');
  });
  console.log(powerActive ? '[PASS] Power section active' : '[FAIL] Power section not active');

  // Check for included items
  const includedItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#battery-options .kbs-included-item strong')).map(el => el.textContent.trim());
  });
  console.log('Included items:', includedItems);
  console.log(includedItems.some(n => n.includes('Cigarette')) ? '[PASS] Cigarette lighter shown as included' : '[FAIL] Missing cigarette lighter');
  console.log(includedItems.some(n => n.includes('Wire') || n.includes('Harness')) ? '[PASS] Wire harness shown as included' : '[FAIL] Missing wire harness');

  // Check NO LiFePO4 options
  const allText = await page.evaluate(() => document.getElementById('battery-options')?.textContent || '');
  console.log(allText.includes('LiFePO4') ? '[FAIL] LiFePO4 still showing' : '[PASS] No LiFePO4 options');

  // Check spare harness available
  const hasSpare = await page.evaluate(() => {
    const cards = document.querySelectorAll('#battery-options .opt-card');
    for (const c of cards) {
      if (c.querySelector('.oc-name')?.textContent.includes('Spare')) return true;
    }
    return false;
  });
  console.log(hasSpare ? '[PASS] Spare harness option available' : '[FAIL] No spare harness option');

  // Check section description updated
  const desc = await page.evaluate(() => {
    const p = document.querySelector('#sec-battery .kb-section__content > p');
    return p ? p.textContent : '';
  });
  console.log(desc.includes('includes') ? '[PASS] Section description mentions included power' : '[FAIL] Description not updated');

  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'vehicle-power-simplified.png'), fullPage: false });
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
