const puppeteer = require('puppeteer');
const path = require('path');
const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const PASS = '[PASS]';
const FAIL = '[FAIL]';
let failures = [];
function check(label, condition, detail) {
  if (condition) { console.log(PASS, label); }
  else { console.log(FAIL, label, detail || ''); failures.push(label + (detail ? ': ' + detail : '')); }
}

async function getState(page, section) {
  return page.evaluate((sec) => {
    const el = document.getElementById('sec-' + sec);
    if (!el) return 'missing';
    if (el.classList.contains('kb-section--complete')) return 'complete';
    if (el.classList.contains('kb-section--active')) return 'active';
    if (el.classList.contains('kb-section--loading')) return 'loading';
    if (el.classList.contains('kb-section--locked')) return 'locked';
    return 'unknown';
  }, section);
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  // Intercept navigation to prevent cart redirect from killing the page
  let redirected = false;
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame() && frame.url().includes('/cart')) {
      redirected = true;
    }
  });

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(2000);

  console.log('=== MULTI-CATEGORY FLOW: All 5 Types ===\n');

  // Skip email
  await page.click('a.kb-skip-link');
  await sleep(3000);

  // Direct pick -> Select ALL categories
  await page.evaluate(() => kbsStartDirect());
  await sleep(800);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
    opts.forEach(o => o.click()); // Click all 5
  });
  await sleep(300);

  // Verify all 5 selected
  const selectedCount = await page.evaluate(() => {
    return document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt.selected').length;
  });
  check('All 5 categories selected', selectedCount === 5, 'got ' + selectedCount);

  // Proceed
  await page.evaluate(() => kbsDirectProceed());
  await sleep(3000);

  // First detected category should be handheld
  const firstCat = await page.evaluate(() => kbsDetectCategory());
  check('First detected category is handheld', firstCat === 'handheld', 'got ' + firstCat);

  // ── CATEGORY 1: Handheld ──
  console.log('\n--- Category 1: Handheld ---');

  // Radio section should be active
  check('Radio section active for handheld', await getState(page, 'radio') === 'active');

  // Select first handheld radio
  await page.evaluate(() => {
    const pick = document.querySelector('#kbs-radio-grid .radio-pick');
    if (pick) pick.click();
  });
  await sleep(4000);

  check('Antennas active after handheld radio', await getState(page, 'antennas') === 'active');

  // Rush through all sections
  for (const sec of ['antennas', 'battery', 'accessories', 'programming']) {
    await page.evaluate((s) => kbsCompleteSection(s), sec);
    await sleep(2500);
  }
  check('Review active for handheld', await getState(page, 'review') === 'active');

  // Click "Looks Good"
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) { b.click(); break; } }
  });
  await sleep(3500);

  check('Quantity active for handheld', await getState(page, 'quantity') === 'active');

  // Add to cart (qty=1)
  await page.evaluate(() => {
    const btn = document.querySelector('#sec-quantity .kb-btn--cart');
    if (btn) btn.click();
  });
  await sleep(5000);

  // Should NOT have redirected to cart
  check('Did not redirect to cart (remaining categories)', !redirected);

  // Should show prompt for next category (vehicle)
  const promptText = await page.evaluate(() => {
    const picker = document.getElementById('kbs-qty-picker');
    return picker ? picker.textContent : '';
  });
  check('Prompt shows for Vehicle', promptText.includes('Vehicle'), 'got: ' + promptText.substring(0, 80));

  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'multi-cat-after-handheld.png'), fullPage: false });

  // ── CATEGORY 2: Vehicle ──
  console.log('\n--- Category 2: Vehicle ---');

  await page.evaluate(() => kbsStartNextCategory('vehicle'));
  await sleep(2000);

  check('Radio section active for vehicle', await getState(page, 'radio') === 'active');

  // Should show mobile radio lineup
  const vehicleRadios = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#kbs-radio-grid .radio-pick h4')).map(h => h.textContent);
  });
  console.log('  Vehicle radios:', vehicleRadios);
  check('Vehicle radios shown (not handheld)', vehicleRadios.some(n => n.includes('UV-50PRO') || n.includes('D578')));

  // Select first vehicle radio
  await page.evaluate(() => {
    const pick = document.querySelector('#kbs-radio-grid .radio-pick');
    if (pick) pick.click();
  });
  await sleep(4000);

  // Verify antenna section has mobile products (antenna + mount groups)
  const hasGroups = await page.evaluate(() => {
    return document.querySelectorAll('#antenna-options .kbs-group-label').length;
  });
  check('Vehicle antennas have group labels', hasGroups >= 2, 'found ' + hasGroups);

  // Rush through
  for (const sec of ['antennas', 'battery', 'accessories', 'programming']) {
    await page.evaluate((s) => kbsCompleteSection(s), sec);
    await sleep(2500);
  }

  // Review -> Looks Good -> Qty -> Add to Cart
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) { b.click(); break; } }
  });
  await sleep(3500);
  await page.evaluate(() => {
    const btn = document.querySelector('#sec-quantity .kb-btn--cart');
    if (btn) btn.click();
  });
  await sleep(5000);

  check('Still not redirected after vehicle', !redirected);

  const prompt2 = await page.evaluate(() => {
    const picker = document.getElementById('kbs-qty-picker');
    return picker ? picker.textContent : '';
  });
  check('Prompt shows for Base Station', prompt2.includes('Base'), 'got: ' + prompt2.substring(0, 80));

  await page.screenshot({ path: path.join(__dirname, 'audit-screenshots', 'multi-cat-after-vehicle.png'), fullPage: false });

  // ── CATEGORY 3: Base ──
  console.log('\n--- Category 3: Base ---');
  await page.evaluate(() => kbsStartNextCategory('base'));
  await sleep(2000);
  check('Radio active for base', await getState(page, 'radio') === 'active');

  await page.evaluate(() => {
    const pick = document.querySelector('#kbs-radio-grid .radio-pick');
    if (pick) pick.click();
  });
  await sleep(4000);
  for (const sec of ['antennas', 'battery', 'accessories', 'programming']) {
    await page.evaluate((s) => kbsCompleteSection(s), sec);
    await sleep(2500);
  }
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) { b.click(); break; } }
  });
  await sleep(3500);
  await page.evaluate(() => {
    const btn = document.querySelector('#sec-quantity .kb-btn--cart');
    if (btn) btn.click();
  });
  await sleep(5000);

  const prompt3 = await page.evaluate(() => {
    const picker = document.getElementById('kbs-qty-picker');
    return picker ? picker.textContent : '';
  });
  check('Prompt shows for HF', prompt3.includes('HF'), 'got: ' + prompt3.substring(0, 80));

  // ── CATEGORY 4: HF ──
  console.log('\n--- Category 4: HF ---');
  await page.evaluate(() => kbsStartNextCategory('hf'));
  await sleep(2000);

  await page.evaluate(() => {
    const pick = document.querySelector('#kbs-radio-grid .radio-pick');
    if (pick) pick.click();
  });
  await sleep(4000);
  for (const sec of ['antennas', 'battery', 'accessories', 'programming']) {
    await page.evaluate((s) => kbsCompleteSection(s), sec);
    await sleep(2500);
  }
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) { b.click(); break; } }
  });
  await sleep(3500);
  await page.evaluate(() => {
    const btn = document.querySelector('#sec-quantity .kb-btn--cart');
    if (btn) btn.click();
  });
  await sleep(5000);

  const prompt4 = await page.evaluate(() => {
    const picker = document.getElementById('kbs-qty-picker');
    return picker ? picker.textContent : '';
  });
  check('Prompt shows for Scanner', prompt4.includes('Scanner'), 'got: ' + prompt4.substring(0, 80));

  // ── CATEGORY 5: Scanner (last one) ──
  console.log('\n--- Category 5: Scanner (final) ---');
  await page.evaluate(() => kbsStartNextCategory('scanner'));
  await sleep(2000);

  await page.evaluate(() => {
    const pick = document.querySelector('#kbs-radio-grid .radio-pick');
    if (pick) pick.click();
  });
  await sleep(4000);
  for (const sec of ['antennas', 'battery', 'accessories', 'programming']) {
    await page.evaluate((s) => kbsCompleteSection(s), sec);
    await sleep(2500);
  }
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#sec-review .kb-btn--primary');
    for (const b of btns) { if (b.textContent.includes('Looks Good')) { b.click(); break; } }
  });
  await sleep(3500);

  // On the last category, adding to cart SHOULD redirect
  const urlBefore = page.url();
  await page.evaluate(() => {
    const btn = document.querySelector('#sec-quantity .kb-btn--cart');
    if (btn) btn.click();
  });
  await sleep(5000);

  const urlAfter = page.url();
  check('Last category redirects to cart', urlAfter.includes('/cart') || redirected, 'url: ' + urlAfter);

  // ── SUMMARY ──
  console.log('\n' + '='.repeat(50));
  console.log('RESULTS: ' + (failures.length === 0 ? 'ALL PASSED' : failures.length + ' FAILED'));
  if (failures.length) failures.forEach(f => console.log('  -', f));

  await browser.close();
  process.exit(failures.length > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
