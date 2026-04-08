const puppeteer = require('puppeteer');
const path = require('path');
const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  // Desktop
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);
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
  // Select UV-PRO (has most accessories)
  await page.evaluate(() => {
    document.querySelectorAll('#kbs-radio-grid .radio-pick').forEach(p => {
      if (p.textContent.includes('UV-PRO')) p.click();
    });
  });
  await sleep(4000);

  // Screenshot antennas
  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'card-layout-antennas-desktop.png'), fullPage: false });

  // Go to accessories
  await page.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(3000);
  await page.evaluate(() => kbsCompleteSection('battery'));
  await sleep(3000);

  // Select a couple accessories to see selected state
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#accessory-options .opt-card');
    if (cards[0]) cards[0].click();
    if (cards[1]) cards[1].click();
  });
  await sleep(500);

  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'card-layout-accessories-desktop.png'), fullPage: false });

  // Check overlap: get bounding boxes of check and price in first card
  const overlap = await page.evaluate(() => {
    const cards = document.querySelectorAll('#accessory-options .opt-card');
    const results = [];
    cards.forEach((card, i) => {
      const check = card.querySelector('.oc-check');
      const price = card.querySelector('.oc-price');
      if (check && price) {
        const cr = check.getBoundingClientRect();
        const pr = price.getBoundingClientRect();
        const overlapping = !(cr.bottom <= pr.top || pr.bottom <= cr.top || cr.right <= pr.left || pr.right <= cr.left);
        results.push({
          card: i,
          name: card.querySelector('.oc-name')?.textContent?.trim() || '',
          check: { top: Math.round(cr.top), bottom: Math.round(cr.bottom), left: Math.round(cr.left), right: Math.round(cr.right) },
          price: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), left: Math.round(pr.left), right: Math.round(pr.right) },
          overlapping
        });
      }
    });
    return results;
  });

  console.log('=== Desktop Accessory Card Layout ===');
  overlap.forEach(r => {
    console.log(`  Card ${r.card} "${r.name}": check(${r.check.top}-${r.check.bottom}) price(${r.price.top}-${r.price.bottom}) ${r.overlapping ? '[OVERLAP]' : '[OK]'}`);
  });

  // Mobile
  const mobile = await browser.newPage();
  await mobile.setCacheEnabled(false);
  await mobile.setViewport({ width: 375, height: 812 });
  await mobile.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);
  await mobile.click('a.kb-skip-link');
  await sleep(3000);
  await mobile.evaluate(() => kbsStartDirect());
  await sleep(800);
  await mobile.evaluate(() => {
    document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Handheld')) o.click();
    });
  });
  await sleep(300);
  await mobile.evaluate(() => kbsDirectProceed());
  await sleep(3000);
  await mobile.evaluate(() => {
    document.querySelectorAll('#kbs-radio-grid .radio-pick').forEach(p => {
      if (p.textContent.includes('UV-PRO')) p.click();
    });
  });
  await sleep(4000);
  await mobile.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(3000);
  await mobile.evaluate(() => kbsCompleteSection('battery'));
  await sleep(3000);

  await mobile.evaluate(() => {
    const cards = document.querySelectorAll('#accessory-options .opt-card');
    if (cards[0]) cards[0].click();
  });
  await sleep(500);

  await mobile.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'card-layout-accessories-mobile.png'), fullPage: false });

  const mobileOverlap = await mobile.evaluate(() => {
    const cards = document.querySelectorAll('#accessory-options .opt-card');
    const results = [];
    cards.forEach((card, i) => {
      const check = card.querySelector('.oc-check');
      const price = card.querySelector('.oc-price');
      if (check && price) {
        const cr = check.getBoundingClientRect();
        const pr = price.getBoundingClientRect();
        const overlapping = !(cr.bottom <= pr.top || pr.bottom <= cr.top || cr.right <= pr.left || pr.right <= cr.left);
        results.push({
          card: i,
          name: card.querySelector('.oc-name')?.textContent?.trim()?.substring(0, 30) || '',
          overlapping,
          checkTop: Math.round(cr.top), priceTop: Math.round(pr.top),
          gap: Math.round(pr.top - cr.bottom)
        });
      }
    });
    return results;
  });

  console.log('\n=== Mobile Accessory Card Layout ===');
  mobileOverlap.forEach(r => {
    console.log(`  Card ${r.card} "${r.name}": gap=${r.gap}px ${r.overlapping ? '[OVERLAP]' : '[OK]'}`);
  });

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
