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

  console.log('\n=== Accessories step check ===');
  const p = await browser.newPage();
  await p.setViewport({ width: 375, height: 812 });
  await p.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p.click('a.kb-skip-link');
  await sleep(2500);
  // Guided path
  await p.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Budget
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Reach
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Setup type - accept pre-selected handheld
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Features
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(2000);
  // Results - screenshot
  await shot(p, 'quickcheck-results');
  // Select recommended radio
  await p.evaluate(() => { const c = document.querySelector('.result-card.recommended'); if (c) c.click(); });
  await sleep(3500);
  await shot(p, 'quickcheck-antennas');
  // Complete antennas
  await p.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(2500);
  await shot(p, 'quickcheck-battery');
  // Complete battery
  await p.evaluate(() => kbsCompleteSection('battery'));
  await sleep(2500);
  // Accessories step - screenshot top and scroll
  await shot(p, 'quickcheck-accessories-top');
  await p.evaluate(() => window.scrollBy(0, 300));
  await sleep(500);
  await shot(p, 'quickcheck-accessories-scroll1');
  await p.evaluate(() => window.scrollBy(0, 300));
  await sleep(500);
  await shot(p, 'quickcheck-accessories-scroll2');

  await p.close();
  await browser.close();
  console.log('\nDone!');
}
run().catch(e => { console.error(e); process.exit(1); });
