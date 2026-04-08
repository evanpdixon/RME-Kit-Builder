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

  // Exact user flow: guided, reach=local, setup=vehicle, click UV-50PRO
  console.log('\n=== DEBUG: Guided -> Local -> Vehicle -> UV-50PRO ===');
  const p = await browser.newPage();
  await p.setViewport({ width: 375, height: 812 });

  // Listen for console messages
  p.on('console', msg => {
    if (msg.text().includes('kbs') || msg.text().includes('category') || msg.text().includes('antenna'))
      console.log('  [console]', msg.text());
  });

  await p.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p.click('a.kb-skip-link');
  await sleep(2500);
  await p.evaluate(() => kbsStartGuided());
  await sleep(800);

  // Q1: Budget - mid
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);

  // Q2: Reach - local (index 1)
  await p.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p.evaluate(() => kbsNextQ());
  await sleep(1200);

  // Q3: Setup type - should be pre-selected with handheld. Change to vehicle.
  const preSelected = await p.evaluate(() => kbsAnswers['setup']);
  console.log('  Pre-selected setup:', JSON.stringify(preSelected));
  await shot(p, 'debug-setup-before');

  // Deselect handheld, select vehicle
  await p.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    console.log('Setup options count: ' + opts.length);
    opts.forEach((o, i) => console.log('  opt ' + i + ': ' + o.textContent.trim().substring(0, 30) + ' selected=' + o.classList.contains('selected')));
    // Deselect handheld (should be first)
    if (opts[0] && opts[0].classList.contains('selected')) opts[0].click();
    // Select vehicle (should be second)
    if (opts[1] && !opts[1].classList.contains('selected')) opts[1].click();
  });
  await sleep(500);

  const afterSetup = await p.evaluate(() => kbsAnswers['setup']);
  console.log('  Setup after change:', JSON.stringify(afterSetup));
  const detCat = await p.evaluate(() => kbsDetectCategory());
  console.log('  Detected category:', detCat);
  await shot(p, 'debug-setup-after');

  // Click Next
  await p.evaluate(() => kbsNextQ());
  await sleep(2000);

  // Check what we see
  const resultHeading = await p.evaluate(() => {
    const h = document.querySelector('.kbs-results-heading h3');
    return h ? h.textContent : 'NO HEADING';
  });
  console.log('  Results heading:', resultHeading);
  await shot(p, 'debug-results');

  // Check result card onclick attributes
  const cardOnclicks = await p.evaluate(() => {
    const cards = document.querySelectorAll('.result-card');
    return Array.from(cards).map(c => c.getAttribute('onclick'));
  });
  console.log('  Card onclicks:', JSON.stringify(cardOnclicks));

  // Click the recommended radio
  await p.evaluate(() => {
    const card = document.querySelector('.result-card.recommended');
    if (card) {
      const onclick = card.getAttribute('onclick');
      console.log('Clicking card with onclick: ' + onclick);
      card.click();
    }
  });
  await sleep(4000);

  // Check what antennas are shown
  const antennaSection = await p.evaluate(() => {
    const h = document.querySelector('#sec-antennas .kb-section__header h2');
    const desc = document.querySelector('#sec-antennas .kb-section__content > p');
    return { heading: h?.textContent, desc: desc?.textContent };
  });
  console.log('  Antenna section:', JSON.stringify(antennaSection));

  const antennaNames = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('#antenna-options .opt-card .oc-name')).map(el => el.textContent);
  });
  console.log('  Antenna names:', JSON.stringify(antennaNames));

  // Check for factory antenna (handheld indicator)
  const hasFactoryAntenna = antennaNames.some(n => n.includes('Factory'));
  console.log('  Has Factory Antenna (handheld):', hasFactoryAntenna);

  // Check for fender picker (vehicle indicator)
  const hasFenderPicker = await p.evaluate(() => !!document.querySelector('.kbs-fender-picker'));
  console.log('  Has Fender Picker (vehicle):', hasFenderPicker);

  await shot(p, 'debug-antennas');
  await p.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(p, 'debug-antennas-scroll');

  await p.close();
  await browser.close();
  console.log('\nDone!');
}
run().catch(e => { console.error(e); process.exit(1); });
