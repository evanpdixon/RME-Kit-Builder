/**
 * Complete V2 Kit Builder Visual Audit
 * Tests all 5 category flows (handheld, vehicle, base, HF, scanner)
 * on both desktop (1280x900) and mobile (375x812) viewports.
 * Screenshots every step for visual review.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const SCREENSHOT_DIR = path.join(__dirname, 'audit-screenshots', 'v2-complete-' + Date.now());
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let shotCount = 0;
async function shot(page, label) {
  shotCount++;
  const name = `${String(shotCount).padStart(3, '0')}-${label}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), fullPage: true });
  console.log(`  [screenshot] ${name}`);
}

async function waitAndClick(page, selector, timeout = 8000) {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.click(selector);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForSection(page, sectionName, state = 'active', timeout = 15000) {
  const sel = `#sec-${sectionName}.kb-section--${state}`;
  try {
    await page.waitForSelector(sel, { visible: true, timeout });
  } catch (e) {
    console.warn(`  [WARN] Section ${sectionName} did not reach state ${state} within ${timeout}ms`);
  }
  await sleep(500); // let animations finish
}

async function runFlow(page, flowName, viewport, steps) {
  const vp = viewport === 'mobile' ? { width: 375, height: 812 } : { width: 1280, height: 900 };
  await page.setViewport(vp);
  console.log(`\n=== ${flowName} (${viewport}) ===`);

  // Navigate fresh
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await shot(page, `${flowName}-${viewport}-01-landing`);

  // Skip email
  try {
    await waitAndClick(page, '.kb-skip-link');
    await sleep(2000);
    await shot(page, `${flowName}-${viewport}-02-after-email`);
  } catch (e) {
    console.warn('  [WARN] Could not skip email:', e.message);
  }

  // Run custom steps
  await steps(page, `${flowName}-${viewport}`);
}

async function directCategoryFlow(page, prefix, categoryKey, radioSelector) {
  // Click "I Know What I Want"
  await sleep(500);
  try {
    await page.evaluate(() => { kbsStartDirect(); });
    await sleep(1500);
    await shot(page, `${prefix}-03-category-select`);
  } catch (e) {
    console.warn('  [WARN] kbsStartDirect failed:', e.message);
    return;
  }

  // Select category
  await page.evaluate((cat) => { kbsDirectToggleCat(document.querySelector(`.kbs-iq-opt[onclick*="${cat}"]`), cat); }, categoryKey);
  await sleep(500);
  await shot(page, `${prefix}-04-category-selected`);

  // Click Next
  await page.evaluate(() => { kbsDirectProceed(); });
  await sleep(3000);
  await shot(page, `${prefix}-05-radio-selection`);

  // Select first available radio
  if (radioSelector) {
    try {
      await page.evaluate((sel) => { document.querySelector(sel).click(); }, radioSelector);
    } catch (e) {
      // Click first radio-pick
      await page.evaluate(() => { document.querySelector('.radio-pick').click(); });
    }
  } else {
    await page.evaluate(() => { document.querySelector('.radio-pick').click(); });
  }
  await sleep(3000);
  await shot(page, `${prefix}-06-after-radio`);

  // Walk through remaining sections
  const sections = ['mounting', 'antennas', 'battery', 'accessories', 'programming', 'review', 'quantity'];
  let stepNum = 7;
  for (const sec of sections) {
    try {
      const secEl = await page.$(`#sec-${sec}`);
      if (!secEl) continue;
      const isVisible = await page.evaluate(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && !el.classList.contains('kb-section--locked');
      }, secEl);

      if (!isVisible) continue;

      await waitForSection(page, sec, 'active', 10000);
      await shot(page, `${prefix}-${String(stepNum).padStart(2, '0')}-${sec}`);
      stepNum++;

      // Select first option if available (for antennas, battery, accessories)
      if (['antennas', 'battery', 'accessories'].includes(sec)) {
        const cards = await page.$$(`#sec-${sec} .opt-card:not(.selected)`);
        if (cards.length > 0) {
          await cards[0].click();
          await sleep(800);
          await shot(page, `${prefix}-${String(stepNum).padStart(2, '0')}-${sec}-selected`);
          stepNum++;
        }
      }

      // Click Continue
      const continueBtn = await page.$(`#sec-${sec} .kb-btn--primary`);
      if (continueBtn) {
        const btnText = await page.evaluate(el => el.textContent, continueBtn);
        if (btnText.includes('Continue') || btnText.includes('Looks Good')) {
          await continueBtn.click();
          await sleep(3000);
        }
      }
    } catch (e) {
      console.warn(`  [WARN] Section ${sec}: ${e.message}`);
    }
  }

  // Final state
  await shot(page, `${prefix}-${String(stepNum).padStart(2, '0')}-final`);
}

async function guidedHandheldFlow(page, prefix) {
  // Click "Help Me Choose"
  await sleep(500);
  try {
    await page.evaluate(() => { kbsStartGuided(); });
    await sleep(1500);
    await shot(page, `${prefix}-03-budget-question`);
  } catch (e) {
    console.warn('  [WARN] kbsStartGuided failed:', e.message);
    return;
  }

  // Answer budget: Mid-range
  await page.evaluate(() => { kbsAnswer('budget', 'mid', false); });
  await sleep(500);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(1500);
  await shot(page, `${prefix}-04-reach-question`);

  // Answer reach: Local
  await page.evaluate(() => { kbsAnswer('reach', 'local', true); });
  await sleep(500);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(1500);
  await shot(page, `${prefix}-05-setup-question`);

  // Answer setup: Handheld
  await page.evaluate(() => { kbsAnswer('setup', 'handheld', true); });
  await sleep(500);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(1500);
  await shot(page, `${prefix}-06-needs-question`);

  // Answer needs: waterproof
  await page.evaluate(() => { kbsAnswer('needs', 'water', true); });
  await sleep(500);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(3000);
  await shot(page, `${prefix}-07-recommendation`);

  // Select recommended radio
  const topRadioKey = await page.evaluate(() => {
    const btn = document.querySelector('.result-card.recommended .rc-btn');
    if (btn) {
      const onclick = btn.getAttribute('onclick');
      const match = onclick.match(/kbsSelectRadio\('([^']+)'\)/);
      return match ? match[1] : null;
    }
    return null;
  });

  if (topRadioKey) {
    await page.evaluate((key) => { kbsSelectRadio(key); }, topRadioKey);
  } else {
    await page.evaluate(() => { document.querySelector('.result-card.recommended').click(); });
  }
  await sleep(3000);
  await shot(page, `${prefix}-08-after-radio-select`);

  // Walk through sections with selections
  const productSections = [
    { name: 'antennas', selectFirst: true },
    { name: 'battery', selectFirst: true },
    { name: 'accessories', selectFirst: true },
    { name: 'programming', selectFirst: false },
    { name: 'review', selectFirst: false },
    { name: 'quantity', selectFirst: false },
  ];

  let stepNum = 9;
  for (const sec of productSections) {
    try {
      await waitForSection(page, sec.name, 'active', 10000);
      await shot(page, `${prefix}-${String(stepNum).padStart(2, '0')}-${sec.name}`);
      stepNum++;

      if (sec.selectFirst) {
        const cards = await page.$$(`#sec-${sec.name} .opt-card:not(.selected)`);
        if (cards.length > 0) {
          await cards[0].click();
          await sleep(800);
          await shot(page, `${prefix}-${String(stepNum).padStart(2, '0')}-${sec.name}-selected`);
          stepNum++;
        }
      }

      // Click Continue / Looks Good
      const continueBtn = await page.$(`#sec-${sec.name} .kb-btn--primary:not(.kb-btn--cart)`);
      if (continueBtn) {
        await continueBtn.click();
        await sleep(3000);
      }
    } catch (e) {
      console.warn(`  [WARN] ${sec.name}: ${e.message}`);
    }
  }

  await shot(page, `${prefix}-${String(stepNum).padStart(2, '0')}-final-quantity`);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  const issues = [];

  // ── HANDHELD GUIDED FLOW ──
  for (const vp of ['desktop', 'mobile']) {
    await runFlow(page, 'handheld-guided', vp, async (pg, prefix) => {
      await guidedHandheldFlow(pg, prefix);
    });
  }

  // ── HANDHELD DIRECT FLOW ──
  for (const vp of ['desktop', 'mobile']) {
    await runFlow(page, 'handheld-direct', vp, async (pg, prefix) => {
      await directCategoryFlow(pg, prefix, 'handheld', null);
    });
  }

  // ── VEHICLE FLOW ──
  for (const vp of ['desktop', 'mobile']) {
    await runFlow(page, 'vehicle', vp, async (pg, prefix) => {
      await directCategoryFlow(pg, prefix, 'vehicle', null);
    });
  }

  // ── BASE STATION FLOW ──
  for (const vp of ['desktop', 'mobile']) {
    await runFlow(page, 'base', vp, async (pg, prefix) => {
      await directCategoryFlow(pg, prefix, 'base', null);
    });
  }

  // ── HF FLOW ──
  for (const vp of ['desktop', 'mobile']) {
    await runFlow(page, 'hf', vp, async (pg, prefix) => {
      await directCategoryFlow(pg, prefix, 'hf', null);
    });
  }

  // ── SCANNER FLOW ──
  for (const vp of ['desktop', 'mobile']) {
    await runFlow(page, 'scanner', vp, async (pg, prefix) => {
      await directCategoryFlow(pg, prefix, 'scanner', null);
    });
  }

  // ── MULTI-CATEGORY FLOW (handheld + vehicle) ──
  await runFlow(page, 'multi-cat', 'desktop', async (pg, prefix) => {
    await pg.evaluate(() => { kbsStartDirect(); });
    await sleep(1500);
    // Select handheld + vehicle
    await pg.evaluate(() => {
      kbsDirectToggleCat(document.querySelectorAll('.kbs-iq-opt')[0], 'handheld');
      kbsDirectToggleCat(document.querySelectorAll('.kbs-iq-opt')[1], 'vehicle');
    });
    await sleep(500);
    await shot(pg, `${prefix}-03-multi-select`);
    await pg.evaluate(() => { kbsDirectProceed(); });
    await sleep(3000);
    await shot(pg, `${prefix}-04-radio-grid`);
    // Select first handheld radio
    await pg.evaluate(() => { document.querySelector('.radio-pick').click(); });
    await sleep(3000);
    await shot(pg, `${prefix}-05-after-handheld-radio`);
    // Quick walk through handheld sections
    for (const sec of ['antennas', 'battery', 'accessories', 'programming', 'review', 'quantity']) {
      try {
        await waitForSection(pg, sec, 'active', 8000);
        const btn = await pg.$(`#sec-${sec} .kb-btn--primary:not(.kb-btn--cart)`);
        if (btn) { await btn.click(); await sleep(3000); }
      } catch (e) { /* skip */ }
    }
    await shot(pg, `${prefix}-06-quantity-add`);
    // Try to add to cart (will show multi-kit prompt)
    try {
      await pg.evaluate(() => { kbsAddToCart(); });
      await sleep(3000);
      await shot(pg, `${prefix}-07-multi-kit-prompt`);
    } catch (e) {
      console.warn('  [WARN] Multi-cat add to cart:', e.message);
    }
  });

  // ── Check for null product IDs ──
  console.log('\n=== Product ID Check ===');
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  const nullIds = await page.evaluate(() => {
    const results = [];
    // Check mobile products
    if (typeof mobileProducts !== 'undefined') {
      (mobileProducts.antennaMounts || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'mobileProducts.antennaMounts' }); });
      (mobileProducts.vehicleMounts || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'mobileProducts.vehicleMounts' }); });
      (mobileProducts.accessories || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'mobileProducts.accessories' }); });
    }
    if (typeof hfProducts !== 'undefined') {
      (hfProducts.antennas || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'hfProducts.antennas' }); });
      (hfProducts.accessories || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'hfProducts.accessories' }); });
    }
    if (typeof scannerProducts !== 'undefined') {
      (scannerProducts.antennas || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'scannerProducts.antennas' }); });
      (scannerProducts.accessories || []).forEach(p => { if (!p.id) results.push({ product: p.name, category: 'scannerProducts.accessories' }); });
    }
    return results;
  });

  if (nullIds.length > 0) {
    console.log('Products with null IDs (cannot add to cart):');
    nullIds.forEach(p => console.log(`  - ${p.product} (${p.category})`));
    issues.push(...nullIds.map(p => `NULL ID: ${p.product} in ${p.category}`));
  }

  // ── Check for missing images ──
  console.log('\n=== Missing Image Check ===');
  const missingImgs = await page.evaluate(() => {
    const results = [];
    function checkList(items, label) {
      (items || []).forEach(p => { if (!p.img) results.push({ product: p.name, category: label }); });
    }
    if (typeof mobileProducts !== 'undefined') {
      checkList(mobileProducts.antennaMounts, 'mobileProducts.antennaMounts');
      checkList(mobileProducts.vehicleMounts, 'mobileProducts.vehicleMounts');
      checkList(mobileProducts.vehicleAntennas, 'mobileProducts.vehicleAntennas');
      checkList(mobileProducts.power, 'mobileProducts.power');
      checkList(mobileProducts.accessories, 'mobileProducts.accessories');
    }
    if (typeof baseProducts !== 'undefined') {
      checkList(baseProducts.antennaPath.quick.items, 'baseProducts.quick');
      checkList(baseProducts.antennaPath.permanent.antennas, 'baseProducts.permanent');
    }
    if (typeof hfProducts !== 'undefined') {
      checkList(hfProducts.antennas, 'hfProducts.antennas');
      checkList(hfProducts.accessories, 'hfProducts.accessories');
    }
    if (typeof scannerProducts !== 'undefined') {
      checkList(scannerProducts.antennas, 'scannerProducts.antennas');
      checkList(scannerProducts.accessories, 'scannerProducts.accessories');
    }
    return results;
  });

  if (missingImgs.length > 0) {
    console.log('Products without images (will use SVG placeholder):');
    missingImgs.forEach(p => console.log(`  - ${p.product} (${p.category})`));
  }

  // ── Console errors ──
  console.log('\n=== Summary ===');
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log(`Total screenshots: ${shotCount}`);
  console.log(`Issues found: ${issues.length}`);
  issues.forEach(i => console.log(`  ! ${i}`));

  await browser.close();
})();
