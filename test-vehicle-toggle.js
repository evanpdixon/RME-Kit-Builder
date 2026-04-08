const puppeteer = require('puppeteer');
const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);

  // Skip email
  await page.click('a.kb-skip-link');
  await sleep(3000);

  // Direct pick -> Vehicle
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

  // Select UV-50PRO
  await page.evaluate(() => {
    const picks = document.querySelectorAll('#kbs-radio-grid .radio-pick');
    picks.forEach(p => { if (p.textContent.includes('UV-50PRO')) p.click(); });
  });
  await sleep(4000);

  // Capture antenna options BEFORE click
  const beforeCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    return Array.from(cards).map(c => {
      const name = c.querySelector('.oc-name');
      return name ? name.textContent.trim() : '';
    });
  });
  console.log('Antenna options before toggle:', beforeCards);

  // Find and click the lip mount card
  const lipMountFound = await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      const name = c.querySelector('.oc-name');
      if (name && name.textContent.includes('Lip Mount')) {
        c.click();
        return name.textContent.trim();
      }
    }
    return null;
  });
  console.log('Clicked:', lipMountFound || 'NOT FOUND');
  await sleep(800);

  // Capture antenna options AFTER click
  const afterCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    return Array.from(cards).map(c => {
      const name = c.querySelector('.oc-name');
      const selected = c.classList.contains('selected');
      return { name: name ? name.textContent.trim() : '', selected };
    });
  });
  console.log('Antenna options after toggle:', afterCards);

  // Verify same products are shown (not handheld replacements)
  const afterNames = afterCards.map(c => c.name);
  const sameProducts = beforeCards.every(name => afterNames.includes(name));
  const lipMountSelected = afterCards.find(c => c.name.includes('Lip Mount'));

  console.log('\n--- RESULTS ---');
  if (sameProducts) console.log('[PASS] Same mobile products shown after toggle');
  else console.log('[FAIL] Products changed after toggle! Before:', beforeCards, 'After:', afterNames);

  if (lipMountSelected && lipMountSelected.selected) console.log('[PASS] Lip mount is now selected (checked)');
  else console.log('[FAIL] Lip mount not selected after click');

  // Click again to deselect
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      const name = c.querySelector('.oc-name');
      if (name && name.textContent.includes('Lip Mount')) { c.click(); break; }
    }
  });
  await sleep(800);

  const afterDeselect = await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      const name = c.querySelector('.oc-name');
      if (name && name.textContent.includes('Lip Mount')) return c.classList.contains('selected');
    }
    return null;
  });
  if (afterDeselect === false) console.log('[PASS] Lip mount deselected on second click');
  else console.log('[FAIL] Lip mount still selected after deselect');

  // Verify price bar updates
  const priceText = await page.evaluate(() => {
    return document.getElementById('kbs-total')?.textContent || '';
  });
  console.log('[INFO] Price bar total:', priceText);

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
