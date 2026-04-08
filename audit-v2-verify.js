const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const OUTDIR = path.join(__dirname, 'audit-screenshots');
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function shot(page, name) {
  await sleep(600);
  await page.screenshot({ path: path.join(OUTDIR, name + '.png'), fullPage: false });
  console.log('  >> ' + name);
}
async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('\n=== MOBILE: Handheld verify ===');
  const m = await browser.newPage();
  await m.setViewport({ width: 375, height: 812 });
  await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await m.click('a.kb-skip-link');
  await sleep(2500);
  // Guided path
  await m.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Answer budget q
  await m.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await m.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Answer reach q
  await m.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
  await sleep(300);
  await m.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Answer features q if present
  const hasMore = await m.evaluate(() => document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)').length > 0);
  if (hasMore) {
    await m.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
    await sleep(300);
    await m.evaluate(() => kbsNextQ());
    await sleep(1500);
  }
  // Should see recommendations - check scroll position
  await shot(m, 'verify-results-mobile');

  // Select recommended radio
  await m.evaluate(() => { const c = document.querySelector('.result-card.recommended'); if (c) c.click(); });
  await sleep(3000);

  // Skip through to accessories
  await m.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(2500);
  await m.evaluate(() => kbsCompleteSection('battery'));
  await sleep(2500);

  // Accessories without overview guide
  await shot(m, 'verify-accessories-mobile');

  await m.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(2500);

  // Programming mobile
  await shot(m, 'verify-programming-mobile-top');
  await m.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(m, 'verify-programming-mobile-scroll');

  await m.close();
  await browser.close();
  console.log('\nDone!');
}
run().catch(e => { console.error(e); process.exit(1); });
