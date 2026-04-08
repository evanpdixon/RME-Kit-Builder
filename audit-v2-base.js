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

  // Test base station flow on mobile
  console.log('\n=== MOBILE: Base Station Flow ===');
  const m = await browser.newPage();
  await m.setViewport({ width: 375, height: 812 });
  await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await m.click('a.kb-skip-link');
  await sleep(2500);
  // Direct -> Base Station
  await m.evaluate(() => kbsStartDirect());
  await sleep(800);
  await m.evaluate(() => {
    document.querySelectorAll('.kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Base Station')) o.click();
    });
  });
  await sleep(300);
  await m.evaluate(() => kbsDirectProceed());
  await sleep(3000);
  await shot(m, 'base-radio-grid-mobile');
  // Select first radio
  await m.evaluate(() => {
    const picks = document.querySelectorAll('.radio-pick, .result-card');
    if (picks.length) picks[0].click();
  });
  await sleep(3500);
  await shot(m, 'base-antennas-mobile-top');
  await m.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(m, 'base-antennas-mobile-scroll');
  await m.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(m, 'base-antennas-mobile-scroll2');

  // Also vehicle flow
  await m.close();
  console.log('\n=== MOBILE: Vehicle Flow ===');
  const v = await browser.newPage();
  await v.setViewport({ width: 375, height: 812 });
  await v.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await v.click('a.kb-skip-link');
  await sleep(2500);
  await v.evaluate(() => kbsStartDirect());
  await sleep(800);
  await v.evaluate(() => {
    document.querySelectorAll('.kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Vehicle')) o.click();
    });
  });
  await sleep(300);
  await v.evaluate(() => kbsDirectProceed());
  await sleep(3000);
  await shot(v, 'vehicle-results-mobile');
  await v.evaluate(() => {
    const picks = document.querySelectorAll('.radio-pick, .result-card');
    if (picks.length) picks[0].click();
  });
  await sleep(3500);
  await shot(v, 'vehicle-antennas-mobile-top');
  await v.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(v, 'vehicle-antennas-mobile-scroll');

  await v.close();
  await browser.close();
  console.log('\nDone!');
}
run().catch(e => { console.error(e); process.exit(1); });
