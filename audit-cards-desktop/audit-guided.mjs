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
  return false;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // === Guided Flow: Get to recommendation cards ===
  console.log('\n=== Guided Flow ===');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await page.evaluate(() => { kbsSkipEmail(); });
  await waitForSection(page, 'sec-interview');
  await sleep(500);

  // Start guided
  await page.evaluate(() => { kbsStartGuided(); });
  await sleep(2000);

  // Q1: Budget tier - click "Economical"
  await page.evaluate(() => {
    kbsAnswer('budget', 'low', false);
  });
  await sleep(2000);
  await shot(page, '40-guided-after-budget.png');

  // Q2: Reach - click "Nearby"
  // Check what the current question is
  const q2text = await page.evaluate(() => {
    return document.querySelector('.kbs-iq h3')?.textContent || '';
  });
  console.log('Q2:', q2text);

  // Multi-select reach question
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) {
      if (o.textContent.includes('Nearby')) { o.click(); return; }
    }
  });
  await sleep(1000);

  // Click Next for multi-select
  await page.evaluate(() => {
    const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
    if (btn) btn.click();
  });
  await sleep(2000);
  await shot(page, '41-guided-after-reach.png');

  // Q3: Setup type - should be auto-selected based on reach; click Next
  const q3text = await page.evaluate(() => {
    return document.querySelector('.kbs-iq h3')?.textContent || '';
  });
  console.log('Q3:', q3text);

  // If it's setup question, just click Next (handheld should be pre-selected)
  await page.evaluate(() => {
    const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
    if (btn) { btn.click(); return; }
    // Or click first option and next
    const opts = document.querySelectorAll('.kbs-iq-opt:not(.selected)');
    if (opts.length > 0) opts[0].click();
  });
  await sleep(2000);
  await shot(page, '42-guided-after-setup.png');

  // Q4: Features - click "No specific needs" then "SEE RESULTS"
  const q4text = await page.evaluate(() => {
    return document.querySelector('.kbs-iq h3')?.textContent || '';
  });
  console.log('Q4:', q4text);

  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) {
      if (o.textContent.includes('No specific needs')) { o.click(); return; }
    }
  });
  await sleep(1000);

  // Click SEE RESULTS / Next
  await page.evaluate(() => {
    const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
    if (btn) btn.click();
  });
  await sleep(3000);
  await shot(page, '43-guided-results.png');

  // Check if radio section is now active
  const radioActive = await page.evaluate(() => {
    const sec = document.getElementById('sec-radio');
    return sec?.classList?.contains('kb-section--active');
  });
  console.log('Radio section active:', radioActive);

  // Scroll to radio section
  await page.evaluate(() => {
    document.getElementById('sec-radio')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await sleep(500);
  await shot(page, '44-guided-radio-top.png');

  // Scroll to recommendation cards
  await page.evaluate(() => {
    const rec = document.getElementById('kbs-recommendation');
    if (rec) rec.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await sleep(500);
  await shot(page, '45-guided-rec-cards.png');

  // Scroll further
  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '46-guided-rec-cards2.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '47-guided-rec-cards3.png');

  // === Vehicle Flow: Check why sections were empty ===
  console.log('\n=== Vehicle Check ===');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 900 });
  await page2.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await page2.evaluate(() => { kbsSkipEmail(); });
  await waitForSection(page2, 'sec-interview');
  await sleep(500);

  await page2.evaluate(() => { kbsStartDirect(); });
  await sleep(1000);
  await page2.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) { if (opt.textContent.includes('Vehicle')) { opt.click(); break; } }
  });
  await sleep(500);
  await page2.evaluate(() => { kbsDirectProceed(); });
  await waitForSection(page2, 'sec-radio');
  await sleep(1500);

  // Check what's in the radio grid for vehicle
  const vehGridInfo = await page2.evaluate(() => {
    const grid = document.getElementById('kbs-radio-grid');
    const picks = grid?.querySelectorAll('.radio-pick');
    return {
      html: grid?.innerHTML?.substring(0, 500) || 'empty',
      pickCount: picks?.length || 0,
      pickTexts: [...(picks || [])].map(p => p.textContent.substring(0, 50))
    };
  });
  console.log('Vehicle grid:', JSON.stringify(vehGridInfo));

  await shot(page2, '50-veh-radio-grid.png');

  // Click the first radio-pick element directly
  await page2.evaluate(() => {
    const picks = document.querySelectorAll('.radio-pick');
    if (picks.length > 0) picks[0].click();
  });
  await sleep(3000);
  await shot(page2, '51-veh-after-pick.png');

  // Check sections
  const vStates = await page2.evaluate(() => {
    return [...document.querySelectorAll('.kb-section')].map(s => ({
      id: s.id,
      active: s.classList.contains('kb-section--active'),
      complete: s.classList.contains('kb-section--complete'),
      locked: s.classList.contains('kb-section--locked'),
      hidden: s.style.display === 'none'
    })).filter(s => !s.hidden);
  });
  console.log('Vehicle states:', JSON.stringify(vStates));

  // Check if mounting is visible and what's active
  const activeSection = vStates.find(s => s.active);
  console.log('Active section:', activeSection?.id);

  if (activeSection) {
    await page2.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, activeSection.id);
    await sleep(500);
    await shot(page2, '52-veh-active-section.png');

    const cardCount = await page2.evaluate((id) => {
      const el = document.getElementById(id);
      return el?.querySelectorAll('.opt-card')?.length || 0;
    }, activeSection.id);
    console.log('Cards in active section:', cardCount);

    // Scroll down to see cards
    await page2.evaluate((id) => {
      const el = document.getElementById(id);
      const grid = el?.querySelector('.options-grid');
      if (grid) grid.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, activeSection.id);
    await sleep(500);
    await shot(page2, '53-veh-cards.png');

    await page2.evaluate(() => window.scrollBy(0, 500));
    await sleep(400);
    await shot(page2, '54-veh-cards2.png');
  }

  await page.close();
  await page2.close();
  await browser.close();
  console.log('\nDone!');
})();
