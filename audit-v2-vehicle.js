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

  console.log('\n=== Vehicle path: Guided -> Vehicle -> UV-50PRO ===');
  const p = await browser.newPage();
  await p.setViewport({ width: 375, height: 812 });
  await p.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p.click('a.kb-skip-link');
  await sleep(2500);
  await p.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Budget - mid
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Reach - local
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Setup type - change to vehicle only
  await p.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    // deselect handheld (index 0)
    if (opts[0] && opts[0].classList.contains('selected')) opts[0].click();
    // select vehicle (index 1)
    if (opts[1] && !opts[1].classList.contains('selected')) opts[1].click();
  });
  await sleep(500);
  const setupAnswers = await p.evaluate(() => kbsAnswers['setup']);
  console.log('  Setup answers:', JSON.stringify(setupAnswers));
  const detectedCat = await p.evaluate(() => kbsDetectCategory());
  console.log('  Detected category:', detectedCat);
  await p.evaluate(() => kbsNextQ());
  await sleep(2000);
  // Should show vehicle results
  await shot(p, 'vehicle-guided-results');

  // Select first radio (UV-50PRO)
  const radioClicked = await p.evaluate(() => {
    const cards = document.querySelectorAll('.result-card');
    if (cards.length) { cards[0].click(); return cards[0].querySelector('h3')?.textContent; }
    return 'NO CARDS';
  });
  console.log('  Clicked radio:', radioClicked);
  await sleep(4000);

  // Screenshot antennas
  await shot(p, 'vehicle-antennas-top');
  await p.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(p, 'vehicle-antennas-scroll1');
  await p.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(p, 'vehicle-antennas-scroll2');
  await p.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(p, 'vehicle-antennas-scroll3');
  await p.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(p, 'vehicle-antennas-scroll4');

  // Count antenna options
  const antennaCount = await p.evaluate(() => document.querySelectorAll('#antenna-options .opt-card').length);
  console.log('  Antenna options count:', antennaCount);

  // Get antenna names
  const antennaNames = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#antenna-options .opt-card .oc-name')).map(el => el.textContent);
  });
  console.log('  Antenna names:', JSON.stringify(antennaNames));

  // Complete antennas -> battery
  await p.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(3000);
  await shot(p, 'vehicle-battery');

  // Complete battery -> accessories
  await p.evaluate(() => kbsCompleteSection('battery'));
  await sleep(3000);
  await shot(p, 'vehicle-accessories-top');

  // Get accessory names
  const accNames = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#accessory-options .opt-card .oc-name')).map(el => el.textContent);
  });
  console.log('  Accessory names:', JSON.stringify(accNames));

  await p.evaluate(() => window.scrollBy(0, 300));
  await sleep(500);
  await shot(p, 'vehicle-accessories-scroll1');

  await p.close();
  await browser.close();
  console.log('\nDone!');
}
run().catch(e => { console.error(e); process.exit(1); });
