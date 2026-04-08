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
async function waitActive(page, sectionId, ms = 10000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const ok = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el && el.classList.contains('kb-section--active');
    }, sectionId);
    if (ok) return true;
    await sleep(300);
  }
  console.log(`  [TIMEOUT] ${sectionId}`);
  return false;
}

async function initPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await page.evaluate(() => { kbsSkipEmail(); });
  await waitActive(page, 'sec-interview');
  return page;
}

async function auditSection(page, sectionId, prefix) {
  const info = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el || el.style.display === 'none') return null;
    return { active: el.classList.contains('kb-section--active'), cards: el.querySelectorAll('.opt-card').length };
  }, sectionId);
  if (!info || !info.active) { console.log(`  [SKIP] ${sectionId}`); return; }
  console.log(`  ${sectionId}: ${info.cards} cards`);
  await page.evaluate((id) => { document.getElementById(id)?.scrollIntoView({ block: 'start' }); }, sectionId);
  await sleep(500);
  await shot(page, `${prefix}-top.png`);
  if (info.cards > 0) {
    await page.evaluate((id) => {
      const g = document.getElementById(id)?.querySelector('.options-grid');
      if (g) g.scrollIntoView({ block: 'start' });
    }, sectionId);
    await sleep(400);
    await shot(page, `${prefix}-cards.png`);
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(400);
    await shot(page, `${prefix}-more.png`);
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // === Vehicle UV-50PRO (correct 'mobile' category) ===
  console.log('\n=== Vehicle UV-50PRO (full flow) ===');
  let page = await initPage(browser);
  await page.evaluate(() => { kbsStartDirect(); });
  await sleep(1000);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) { if (o.textContent.includes('Vehicle')) { o.click(); break; } }
  });
  await sleep(500);
  await page.evaluate(() => { kbsDirectProceed(); });
  await waitActive(page, 'sec-radio');
  await sleep(1000);

  // Use the correct category key 'mobile' (not 'vehicle')
  await page.evaluate(() => { kbsSelectNonHandheld('uv50pro', 'mobile'); });
  await sleep(3000);

  // Mounting
  await auditSection(page, 'sec-mounting', '60-veh-mount');
  await page.evaluate(() => { kbsCompleteSection('mounting'); });
  await waitActive(page, 'sec-antennas');
  await sleep(1000);

  // Antennas
  await auditSection(page, 'sec-antennas', '61-veh-ant');
  await page.evaluate(() => { kbsCompleteSection('antennas'); });
  await sleep(2000);

  // Check what section is next (battery may be hidden for vehicle)
  const nextAfterAnt = await page.evaluate(() => {
    return [...document.querySelectorAll('.kb-section')].find(s => s.classList.contains('kb-section--active'))?.id || 'none';
  });
  console.log('After antennas, active:', nextAfterAnt);

  if (nextAfterAnt === 'sec-battery') {
    await auditSection(page, 'sec-battery', '62-veh-bat');
    await page.evaluate(() => { kbsCompleteSection('battery'); });
    await sleep(2000);
  }

  await auditSection(page, 'sec-accessories', '63-veh-acc');
  await page.evaluate(() => { kbsCompleteSection('accessories'); });
  await waitActive(page, 'sec-programming');
  await sleep(1000);

  await auditSection(page, 'sec-programming', '64-veh-prog');
  await page.close();

  // === Guided: Budget > Nearby > through to recommendation ===
  console.log('\n=== Guided Flow (complete) ===');
  page = await initPage(browser);
  await page.evaluate(() => { kbsStartGuided(); });
  await sleep(2000);

  // Q1: Budget = Economical
  await page.evaluate(() => { kbsAnswer('budget', 'low', false); });
  await sleep(2000);

  // Q2: Reach = Nearby (multi-select, need to select + Next)
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) { if (o.textContent.includes('Nearby')) { o.click(); break; } }
  });
  await sleep(500);
  await page.evaluate(() => {
    const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
    if (btn) btn.click();
  });
  await sleep(2000);

  // Q3: Setup type - handheld should be pre-selected, click Next
  const q3 = await page.evaluate(() => document.querySelector('.kbs-iq h3')?.textContent || '');
  console.log('Q3:', q3);
  await page.evaluate(() => {
    const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
    if (btn) btn.click();
  });
  await sleep(2000);

  // Q4: Features - click "No specific needs" then Next/See Results
  const q4 = await page.evaluate(() => document.querySelector('.kbs-iq h3')?.textContent || '');
  console.log('Q4:', q4);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const o of opts) { if (o.textContent.includes('No specific needs')) { o.click(); break; } }
  });
  await sleep(500);
  await page.evaluate(() => {
    const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
    if (btn) btn.click();
  });
  await sleep(3000);

  // Check if we're at radio section now
  const atRadio = await page.evaluate(() => {
    return document.getElementById('sec-radio')?.classList?.contains('kb-section--active');
  });
  console.log('At radio section:', atRadio);

  if (!atRadio) {
    // Maybe there's one more question
    const qExtra = await page.evaluate(() => document.querySelector('.kbs-iq h3')?.textContent || 'none');
    console.log('Extra Q:', qExtra);
    await shot(page, '70-guided-extra-q.png');

    // Try answering it
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq-opt');
      if (opts.length > 0) opts[opts.length - 1].click(); // click last option
    });
    await sleep(500);
    await page.evaluate(() => {
      const btn = document.querySelector('.kbs-iq button.kb-btn--primary:not([disabled])');
      if (btn) btn.click();
    });
    await sleep(3000);
  }

  // Now we should have recommendation cards
  await page.evaluate(() => {
    document.getElementById('sec-radio')?.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await shot(page, '71-guided-radio-section.png');

  // Scroll to recommendation
  await page.evaluate(() => {
    const rec = document.getElementById('kbs-recommendation');
    if (rec) rec.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await shot(page, '72-guided-rec-cards.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '73-guided-rec-cards2.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '74-guided-rec-cards3.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '75-guided-rec-cards4.png');

  await page.close();
  await browser.close();
  console.log('\nDone!');
})();
