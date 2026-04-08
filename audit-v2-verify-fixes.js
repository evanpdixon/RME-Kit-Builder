/**
 * Verify audit fixes on staging12
 * Checks: section numbering, mounting step, scanner sections, FT-891 visibility
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const DIR = path.join(__dirname, 'audit-screenshots', 'verify-fixes-' + Date.now());
fs.mkdirSync(DIR, { recursive: true });

let n = 0;
async function shot(page, label) {
  n++;
  const name = `${String(n).padStart(3,'0')}-${label}.png`;
  await page.screenshot({ path: path.join(DIR, name), fullPage: true });
  console.log(`  [${name}]`);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  for (const vp of ['desktop', 'mobile']) {
    const w = vp === 'mobile' ? 375 : 1280;
    const h = vp === 'mobile' ? 812 : 900;
    await page.setViewport({ width: w, height: h });

    // ── 1. Landing: check section numbering ──
    console.log(`\n=== Landing (${vp}) ===`);
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await shot(page, `${vp}-01-landing-numbering`);

    // Verify section numbers are sequential (no gap)
    const numbers = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.kb-section__number')).map(el => ({
        num: el.textContent.trim(),
        visible: el.closest('.kb-section').style.display !== 'none'
      })).filter(x => x.visible).map(x => x.num);
    });
    console.log(`  Section numbers: ${numbers.join(', ')}`);
    const expected = numbers.map((_, i) => String(i + 1));
    if (JSON.stringify(numbers) === JSON.stringify(expected)) {
      console.log('  [PASS] Sequential numbering');
    } else {
      console.log('  [FAIL] Expected ' + expected.join(',') + ' got ' + numbers.join(','));
    }

    // ── 2. Skip email, go direct, pick vehicle ──
    console.log(`\n=== Vehicle flow (${vp}) ===`);
    await page.evaluate(() => { kbsSkipEmail(); });
    await sleep(2000);
    await page.evaluate(() => { kbsStartDirect(); });
    await sleep(1000);
    await page.evaluate(() => {
      kbsDirectToggleCat(document.querySelector('.kbs-iq-opt[onclick*="vehicle"]'), 'vehicle');
    });
    await sleep(500);
    await page.evaluate(() => { kbsDirectProceed(); });
    await sleep(3000);
    await shot(page, `${vp}-02-vehicle-radio-grid`);

    // Select first radio
    await page.evaluate(() => { document.querySelector('.radio-pick:not(.radio-pick--oos)').click(); });
    await sleep(3000);
    await shot(page, `${vp}-03-vehicle-after-radio`);

    // Check: is mounting section active?
    const mountingActive = await page.evaluate(() => {
      const el = document.getElementById('sec-mounting');
      return el && el.classList.contains('kb-section--active');
    });
    console.log(`  Mounting step visible: ${mountingActive ? '[PASS]' : '[FAIL] - still skipping'}`);

    // Check renumbered sections with mounting visible
    const numsAfter = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.kb-section__number')).map(el => ({
        num: el.textContent.trim(),
        visible: el.closest('.kb-section').style.display !== 'none'
      })).filter(x => x.visible).map(x => x.num);
    });
    console.log(`  Section numbers after mounting: ${numsAfter.join(', ')}`);

    // Continue through mounting
    const mountContinue = await page.$('#sec-mounting .kb-btn--primary');
    if (mountContinue) {
      await mountContinue.click();
      await sleep(3000);
      await shot(page, `${vp}-04-vehicle-antennas`);
    }

    // Continue through rest quickly
    for (const sec of ['antennas', 'battery', 'accessories', 'programming', 'review']) {
      try {
        const btn = await page.$(`#sec-${sec} .kb-btn--primary:not(.kb-btn--cart)`);
        if (btn) {
          const visible = await page.evaluate(el => {
            const s = el.closest('.kb-section');
            return s && s.classList.contains('kb-section--active');
          }, btn);
          if (visible) {
            await btn.click();
            await sleep(2500);
          }
        }
      } catch(e) {}
    }
    await shot(page, `${vp}-05-vehicle-quantity`);

    // ── 3. HF flow: check FT-891 visible ──
    console.log(`\n=== HF flow (${vp}) ===`);
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.evaluate(() => { kbsSkipEmail(); });
    await sleep(2000);
    await page.evaluate(() => { kbsStartDirect(); });
    await sleep(1000);
    await page.evaluate(() => {
      kbsDirectToggleCat(document.querySelector('.kbs-iq-opt[onclick*="hf"]'), 'hf');
    });
    await sleep(500);
    await page.evaluate(() => { kbsDirectProceed(); });
    await sleep(3000);
    await shot(page, `${vp}-06-hf-radio-grid`);

    const hfRadios = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.radio-pick')).map(el => ({
        name: el.querySelector('h4')?.textContent || '',
        oos: el.classList.contains('radio-pick--oos')
      }));
    });
    console.log('  HF radios:');
    hfRadios.forEach(r => console.log(`    ${r.name}${r.oos ? ' [OUT OF STOCK]' : ''}`));

    // ── 4. Scanner flow: check battery section hidden ──
    console.log(`\n=== Scanner flow (${vp}) ===`);
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.evaluate(() => { kbsSkipEmail(); });
    await sleep(2000);
    await page.evaluate(() => { kbsStartDirect(); });
    await sleep(1000);
    await page.evaluate(() => {
      kbsDirectToggleCat(document.querySelector('.kbs-iq-opt[onclick*="scanner"]'), 'scanner');
    });
    await sleep(500);
    await page.evaluate(() => { kbsDirectProceed(); });
    await sleep(3000);
    // Select first scanner
    await page.evaluate(() => { document.querySelector('.radio-pick:not(.radio-pick--oos)').click(); });
    await sleep(3000);
    await shot(page, `${vp}-07-scanner-after-radio`);

    // Walk through to see sections
    const scannerBtn = await page.$('#sec-antennas .kb-btn--primary');
    if (scannerBtn) { await scannerBtn.click(); await sleep(3000); }
    await shot(page, `${vp}-08-scanner-after-antennas`);

    const batteryHidden = await page.evaluate(() => {
      const el = document.getElementById('sec-battery');
      return el && el.style.display === 'none';
    });
    console.log(`  Battery section hidden for scanner: ${batteryHidden ? '[PASS]' : '[FAIL]'}`);

    // Check scanner section numbers
    const scannerNums = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.kb-section__number')).map(el => ({
        num: el.textContent.trim(),
        visible: el.closest('.kb-section').style.display !== 'none'
      })).filter(x => x.visible).map(x => x.num);
    });
    console.log(`  Scanner section numbers: ${scannerNums.join(', ')}`);

    // ── 5. Handheld: check antenna order + battery description ──
    console.log(`\n=== Handheld flow (${vp}) ===`);
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.evaluate(() => { kbsSkipEmail(); });
    await sleep(2000);
    await page.evaluate(() => { kbsStartDirect(); });
    await sleep(1000);
    await page.evaluate(() => {
      kbsDirectToggleCat(document.querySelector('.kbs-iq-opt[onclick*="handheld"]'), 'handheld');
    });
    await sleep(500);
    await page.evaluate(() => { kbsDirectProceed(); });
    await sleep(3000);
    // Select first handheld
    await page.evaluate(() => { document.querySelector('.radio-pick').click(); });
    await sleep(3000);
    await shot(page, `${vp}-09-handheld-antennas`);

    // Check antenna order
    const antennaNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#antenna-options .opt-card .oc-name')).map(el => el.textContent.trim());
    });
    console.log('  Antenna order:');
    antennaNames.forEach((a, i) => console.log(`    ${i+1}. ${a}`));

    // Continue to battery
    const antBtn = await page.$('#sec-antennas .kb-btn--primary');
    if (antBtn) { await antBtn.click(); await sleep(3000); }
    await shot(page, `${vp}-10-handheld-battery`);

    // Check battery description
    const battDesc = await page.evaluate(() => {
      const p = document.querySelector('#sec-battery .kb-section__content > p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`  Battery description: "${battDesc.substring(0, 60)}..."`);
    console.log(`  ${battDesc.length > 5 ? '[PASS] Not empty' : '[FAIL] Still empty'}`);
  }

  console.log(`\nScreenshots: ${DIR}`);
  console.log(`Total: ${n}`);
  await browser.close();
})();
