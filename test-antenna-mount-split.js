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

  // Skip email -> Direct -> Vehicle -> UV-50PRO
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

  // Check for group labels
  const groupLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#antenna-options .kbs-group-label')).map(el => el.textContent.trim());
  });
  console.log('Group labels:', groupLabels);

  const hasAntennaGroup = groupLabels.some(l => l.toLowerCase().includes('antenna'));
  const hasMountGroup = groupLabels.some(l => l.toLowerCase().includes('mount'));
  console.log(hasAntennaGroup ? '[PASS] Antenna group label found' : '[FAIL] No antenna group label');
  console.log(hasMountGroup ? '[PASS] Mount group label found' : '[FAIL] No mount group label');

  // Get all product names in order
  const productNames = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#antenna-options .opt-card .oc-name')).map(el => el.textContent.trim());
  });
  console.log('\nProducts in order:');
  productNames.forEach((name, i) => console.log('  ' + (i+1) + '. ' + name));

  // Verify antennas come before mounts
  const sarIdx = productNames.findIndex(n => n.includes('Search and Rescue'));
  const lipIdx = productNames.findIndex(n => n.includes('Lip Mount'));
  console.log('\n' + (sarIdx < lipIdx ? '[PASS]' : '[FAIL]') + ' Antenna (SAR) appears before mount (Lip Mount)');

  // Toggle an antenna - should stay in place
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      if (c.querySelector('.oc-name')?.textContent.includes('Search and Rescue')) { c.click(); break; }
    }
  });
  await sleep(800);

  const afterToggle = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#antenna-options .kbs-group-label')).map(el => el.textContent.trim());
  });
  console.log(afterToggle.length === 2 ? '[PASS] Group labels preserved after toggle' : '[FAIL] Group labels lost after toggle');

  const sarSelected = await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      if (c.querySelector('.oc-name')?.textContent.includes('Search and Rescue')) return c.classList.contains('selected');
    }
    return false;
  });
  console.log(sarSelected ? '[PASS] SAR antenna selected' : '[FAIL] SAR antenna not selected');

  // Toggle a mount too
  await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      if (c.querySelector('.oc-name')?.textContent.includes('Mag Mount')) { c.click(); break; }
    }
  });
  await sleep(800);

  const magSelected = await page.evaluate(() => {
    const cards = document.querySelectorAll('#antenna-options .opt-card');
    for (const c of cards) {
      if (c.querySelector('.oc-name')?.textContent.includes('Mag Mount')) return c.classList.contains('selected');
    }
    return false;
  });
  console.log(magSelected ? '[PASS] Mag mount selected' : '[FAIL] Mag mount not selected');

  // Screenshot
  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'vehicle-antenna-mount-split.png'), fullPage: true });

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
