import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const URL_BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(page, name) {
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log('  -> ' + name);
}

async function waitForSection(page, sectionId, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const active = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el && el.classList.contains('kb-section--active');
    }, sectionId);
    if (active) return true;
    await sleep(300);
  }
  console.log(`  [TIMEOUT] Waiting for ${sectionId}`);
  return false;
}

async function initAndSkipEmail(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await page.evaluate(() => { kbsSkipEmail(); });
  await waitForSection(page, 'sec-interview');
  await sleep(500);
  return page;
}

// Complete a section (click Continue) and wait for next to activate
async function completeAndWait(page, sectionName, nextSection) {
  await page.evaluate((name) => { kbsCompleteSection(name); }, sectionName);
  if (nextSection) {
    await waitForSection(page, nextSection);
    await sleep(1000);
  } else {
    await sleep(2000);
  }
}

// Scroll to section and take screenshots of the cards area
async function auditSection(page, sectionId, prefix) {
  const info = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return { exists: false };
    if (el.style.display === 'none') return { exists: true, hidden: true };
    const content = el.querySelector('.kb-section__content');
    const optCards = el.querySelectorAll('.opt-card');
    const grid = el.querySelector('.options-grid');
    return {
      exists: true,
      hidden: false,
      active: el.classList.contains('kb-section--active'),
      optCardCount: optCards.length,
      hasGrid: !!grid
    };
  }, sectionId);

  if (!info.exists || info.hidden) {
    console.log(`  [HIDDEN] ${sectionId}`);
    return false;
  }
  if (!info.active) {
    console.log(`  [NOT ACTIVE] ${sectionId} (${info.optCardCount} cards)`);
    return false;
  }

  console.log(`  ${sectionId}: ${info.optCardCount} opt-cards`);

  // Scroll to section header
  await page.evaluate((id) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, sectionId);
  await sleep(500);
  await shot(page, `${prefix}-top.png`);

  if (info.optCardCount > 0) {
    // Scroll to the grid of cards
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      const grid = el?.querySelector('.options-grid');
      if (grid) grid.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, sectionId);
    await sleep(400);
    await shot(page, `${prefix}-cards1.png`);

    // Keep scrolling to see more cards
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(400);
    await shot(page, `${prefix}-cards2.png`);

    if (info.optCardCount > 4) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(400);
      await shot(page, `${prefix}-cards3.png`);
    }
  }

  return true;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // ============ FLOW 1: Handheld UV-5R ============
  console.log('\n=== FLOW 1: Handheld UV-5R ===');
  let page = await initAndSkipEmail(browser);

  // Direct > Handheld > UV-5R
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(1000);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) { if (opt.textContent.includes('Handheld')) { opt.click(); break; } }
  });
  await sleep(500);
  await page.evaluate(() => { kbsDirectProceed(); });
  await waitForSection(page, 'sec-radio');
  await sleep(1500);
  await page.evaluate(() => { kbsSelectRadio('uv5r'); });
  await sleep(3000);

  // Now antennas should be active
  await auditSection(page, 'sec-antennas', '01-hh-ant');
  await completeAndWait(page, 'antennas', 'sec-battery');

  await auditSection(page, 'sec-battery', '02-hh-bat');
  await completeAndWait(page, 'battery', 'sec-accessories');

  await auditSection(page, 'sec-accessories', '03-hh-acc');
  await completeAndWait(page, 'accessories', 'sec-programming');

  await auditSection(page, 'sec-programming', '04-hh-prog');
  await completeAndWait(page, 'programming', 'sec-review');

  await auditSection(page, 'sec-review', '05-hh-rev');
  await page.close();

  // ============ FLOW 2: Vehicle UV-50PRO ============
  console.log('\n=== FLOW 2: Vehicle UV-50PRO ===');
  page = await initAndSkipEmail(browser);

  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(1000);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) { if (opt.textContent.includes('Vehicle')) { opt.click(); break; } }
  });
  await sleep(500);
  await page.evaluate(() => { kbsDirectProceed(); });
  await waitForSection(page, 'sec-radio');
  await sleep(1500);
  await page.evaluate(() => { kbsSelectNonHandheld('uv50pro', 'vehicle'); });
  await sleep(3000);

  // Check if mounting is visible
  const mountingVisible = await page.evaluate(() => {
    const el = document.getElementById('sec-mounting');
    return el && el.style.display !== 'none';
  });
  console.log('Mounting visible:', mountingVisible);

  if (mountingVisible) {
    await auditSection(page, 'sec-mounting', '10-veh-mount');
    await completeAndWait(page, 'mounting', 'sec-antennas');
  }

  await auditSection(page, 'sec-antennas', '11-veh-ant');
  await completeAndWait(page, 'antennas', 'sec-battery');

  // For vehicle, battery might be hidden - check
  const batteryVisible = await page.evaluate(() => {
    const el = document.getElementById('sec-battery');
    return el && el.style.display !== 'none';
  });
  if (batteryVisible) {
    await auditSection(page, 'sec-battery', '12-veh-bat');
    await completeAndWait(page, 'battery', 'sec-accessories');
  }

  await auditSection(page, 'sec-accessories', '13-veh-acc');
  await completeAndWait(page, 'accessories', 'sec-programming');

  await auditSection(page, 'sec-programming', '14-veh-prog');
  await page.close();

  // ============ FLOW 3: Scanner SDS200 ============
  console.log('\n=== FLOW 3: Scanner SDS200 ===');
  page = await initAndSkipEmail(browser);

  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(1000);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) { if (opt.textContent.includes('Scanner')) { opt.click(); break; } }
  });
  await sleep(500);
  await page.evaluate(() => { kbsDirectProceed(); });
  await waitForSection(page, 'sec-radio');
  await sleep(1500);
  await page.evaluate(() => { kbsSelectNonHandheld('sds200', 'scanner'); });
  await sleep(3000);

  await auditSection(page, 'sec-antennas', '20-scan-ant');
  await completeAndWait(page, 'antennas', 'sec-accessories');

  await auditSection(page, 'sec-accessories', '21-scan-acc');
  await completeAndWait(page, 'accessories', 'sec-programming');

  await auditSection(page, 'sec-programming', '22-scan-prog');
  await page.close();

  // ============ FLOW 4: Guided - Help Me Choose ============
  console.log('\n=== FLOW 4: Guided - Help Me Choose ===');
  page = await initAndSkipEmail(browser);
  await page.evaluate(() => { kbsStartGuided(); });
  await sleep(2000);

  // The guided flow asks: budget tier, reach, setup type, then specific questions
  // Answer "Economical" (budget)
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) { if (o.textContent.toLowerCase().includes('economical') || o.textContent.toLowerCase().includes('budget')) { o.click(); return; } }
  });
  await sleep(2000);

  // Answer reach: Nearby
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) { if (o.textContent.toLowerCase().includes('nearby')) { o.click(); return; } }
  });
  await sleep(1500);

  // Multi-select might need Next
  await page.evaluate(() => {
    const btn = document.querySelector('#kbs-interview-stack button.kb-btn--primary:not([disabled])');
    if (btn) btn.click();
  });
  await sleep(2000);

  // Click through remaining questions (up to 10 more)
  for (let i = 0; i < 10; i++) {
    const atRadio = await page.evaluate(() => {
      const sec = document.getElementById('sec-radio');
      return sec && sec.classList.contains('kb-section--active');
    });
    if (atRadio) { console.log('  Reached radio section at step', i); break; }

    // Try clicking first option
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq-opt:not(.selected)');
      if (opts.length > 0) { opts[0].click(); return; }
      const btn = document.querySelector('#kbs-interview-stack button.kb-btn--primary:not([disabled])');
      if (btn) btn.click();
    });
    await sleep(2000);
  }

  // Now we should have recommendations
  await shot(page, '30-guided-rec.png');

  // Scroll to radio section to see recommendation cards
  await page.evaluate(() => {
    document.getElementById('sec-radio')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await sleep(500);
  await shot(page, '31-guided-radio-top.png');

  // Scroll to see the recommendation cards
  await page.evaluate(() => {
    const rec = document.getElementById('kbs-recommendation');
    if (rec) rec.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await sleep(500);
  await shot(page, '32-guided-radio-cards.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '33-guided-radio-cards2.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '34-guided-radio-cards3.png');

  await page.close();
  await browser.close();
  console.log('\nDone!');
})();
