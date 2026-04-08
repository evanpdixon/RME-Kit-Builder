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

  // Test 1: Guided -> handheld (should see setup then features then handheld results)
  console.log('\n=== TEST 1: Guided -> Handheld ===');
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 375, height: 812 });
  await p1.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p1.click('a.kb-skip-link');
  await sleep(2500);
  await p1.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Q1: Budget - pick mid
  await p1.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p1.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q2: Reach - pick nearby
  await p1.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
  await sleep(300);
  await p1.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q3: Setup type - should be pre-selected with Handheld
  await shot(p1, 'setup-q3-handheld-preselected');
  // Check what's pre-selected
  const preSelected = await p1.evaluate(() => kbsAnswers['setup']);
  console.log('  Pre-selected setup:', JSON.stringify(preSelected));
  // Accept and continue
  await p1.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q4: Features - should appear for handheld
  await shot(p1, 'setup-q4-features-handheld');
  const q4Question = await p1.evaluate(() => {
    const q = document.querySelector('.kbs-iq:not(.kbs-iq--answered) h3');
    return q ? q.textContent : 'NO QUESTION';
  });
  console.log('  Q4 question:', q4Question);
  // Pick a feature and see results
  await p1.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
  await sleep(300);
  await p1.evaluate(() => kbsNextQ());
  await sleep(1500);
  await shot(p1, 'setup-handheld-results');
  await p1.close();

  // Test 2: Guided -> Vehicle (should see setup, skip features, show vehicle results)
  console.log('\n=== TEST 2: Guided -> Vehicle ===');
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 375, height: 812 });
  await p2.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p2.click('a.kb-skip-link');
  await sleep(2500);
  await p2.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Q1: Budget - pick mid
  await p2.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p2.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q2: Reach - pick local
  await p2.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p2.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q3: Setup type - change to Vehicle
  await shot(p2, 'setup-q3-before-vehicle');
  // Deselect handheld, select vehicle
  await p2.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    // Click handheld to deselect (index 0)
    if (opts[0]) opts[0].click();
    // Click vehicle (index 1)
    if (opts[1]) opts[1].click();
  });
  await sleep(500);
  await shot(p2, 'setup-q3-vehicle-selected');
  const vehicleSetup = await p2.evaluate(() => kbsAnswers['setup']);
  console.log('  Setup answers:', JSON.stringify(vehicleSetup));
  await p2.evaluate(() => kbsNextQ());
  await sleep(1500);
  // Should go straight to results (no features for vehicle)
  await shot(p2, 'setup-vehicle-results');
  await p2.close();

  // Test 3: Guided -> Base Station
  console.log('\n=== TEST 3: Guided -> Base Station ===');
  const p3 = await browser.newPage();
  await p3.setViewport({ width: 375, height: 812 });
  await p3.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p3.click('a.kb-skip-link');
  await sleep(2500);
  await p3.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Q1: Budget
  await p3.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[0].click(); });
  await sleep(300);
  await p3.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q2: Reach - local
  await p3.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p3.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q3: Setup - deselect handheld, select base
  await p3.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    if (opts[0]) opts[0].click(); // deselect handheld
    if (opts[2]) opts[2].click(); // select base
  });
  await sleep(300);
  await p3.evaluate(() => kbsNextQ());
  await sleep(1500);
  await shot(p3, 'setup-base-results');
  await p3.close();

  // Test 4: Guided -> Listen -> Scanner pre-select
  console.log('\n=== TEST 4: Guided -> Listen -> Scanner ===');
  const p4 = await browser.newPage();
  await p4.setViewport({ width: 375, height: 812 });
  await p4.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await p4.click('a.kb-skip-link');
  await sleep(2500);
  await p4.evaluate(() => kbsStartGuided());
  await sleep(800);
  // Q1: Budget
  await p4.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[1].click(); });
  await sleep(300);
  await p4.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q2: Reach - listen only
  await p4.evaluate(() => { document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt')[3].click(); });
  await sleep(300);
  await p4.evaluate(() => kbsNextQ());
  await sleep(1000);
  // Q3: Should pre-select scanner
  await shot(p4, 'setup-q3-scanner-preselected');
  const scannerSetup = await p4.evaluate(() => kbsAnswers['setup']);
  console.log('  Pre-selected setup:', JSON.stringify(scannerSetup));
  await p4.close();

  await browser.close();
  console.log('\nDone!');
}
run().catch(e => { console.error(e); process.exit(1); });
