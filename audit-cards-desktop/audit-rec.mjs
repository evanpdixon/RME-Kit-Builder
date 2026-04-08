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

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  await page.evaluate(() => { kbsSkipEmail(); });
  await sleep(2000);
  await page.evaluate(() => { kbsStartGuided(); });
  await sleep(2000);

  // Q0: Budget = "Economical" -> click option then Next
  await page.evaluate(() => { kbsAnswer('budget', 'low', false); });
  await sleep(300);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(2000);

  console.log('Step:', await page.evaluate(() => kbsStep));

  // Q1: Reach = "Nearby" -> click option then Next
  await page.evaluate(() => { kbsAnswer('reach', 'nearby', true); });
  await sleep(300);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(2000);

  console.log('Step:', await page.evaluate(() => kbsStep));

  // Q2: Setup type - handheld pre-selected -> just click Next
  // But first verify setup is pre-selected
  const setupAnswers = await page.evaluate(() => kbsAnswers['setup']);
  console.log('Setup pre-selected:', setupAnswers);
  if (!setupAnswers || setupAnswers.length === 0) {
    await page.evaluate(() => { kbsAnswer('setup', 'handheld', true); });
    await sleep(300);
  }
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(2000);

  console.log('Step:', await page.evaluate(() => kbsStep));

  // Q3: Features/needs -> "No specific needs" then See Results
  const currentQ = await page.evaluate(() => {
    const qs = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
    return qs.length > 0 ? qs[qs.length - 1].querySelector('h3')?.textContent : 'none';
  });
  console.log('Current Q:', currentQ);

  await page.evaluate(() => { kbsAnswer('needs', 'none', true); });
  await sleep(300);
  await page.evaluate(() => { kbsNextQ(); });
  await sleep(3000);

  // Check results
  const state = await page.evaluate(() => ({
    step: kbsStep,
    hasResults: !!document.querySelector('.kbs-results-heading'),
    radioActive: document.getElementById('sec-radio')?.classList?.contains('kb-section--active'),
    recContent: document.getElementById('kbs-recommendation')?.textContent?.substring(0, 100) || 'empty'
  }));
  console.log('Final state:', JSON.stringify(state, null, 2));

  // Screenshot the recommendation cards
  await page.evaluate(() => {
    const h = document.querySelector('.kbs-results-heading');
    if (h) h.scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await shot(page, '80-rec-heading.png');

  await page.evaluate(() => {
    const cards = document.querySelectorAll('.result-card');
    if (cards.length > 0) cards[0].scrollIntoView({ block: 'start' });
  });
  await sleep(500);
  await shot(page, '81-rec-card1.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '82-rec-card2.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '83-rec-card3.png');

  await page.evaluate(() => window.scrollBy(0, 500));
  await sleep(400);
  await shot(page, '84-rec-card4.png');

  await page.close();
  await browser.close();
  console.log('\nDone!');
})();
