/**
 * V2 Scroll Workflow Audit - Screenshot walkthrough
 * Captures screenshots at each step of the kit builder flow
 */
const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const OUTDIR = path.join(__dirname, 'audit-screenshots');
const fs = require('fs');
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812 };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(page, name) {
  await sleep(500); // let animations settle
  await page.screenshot({ path: path.join(OUTDIR, name + '.png'), fullPage: false });
  console.log('  >> ' + name);
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  // ─── DESKTOP FLOW ───────────────────────────
  console.log('\n=== DESKTOP FLOW ===');
  const page = await browser.newPage();
  await page.setViewport(DESKTOP);
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // Step 1: Email capture (initial state)
  await shot(page, '01-email-desktop');

  // Skip email
  await page.click('a.kb-skip-link');
  await sleep(2500); // animation: fade + spinner + reveal

  // Step 2: Interview choice screen
  await shot(page, '02-interview-choice-desktop');

  // Click "Help Me Choose" (guided path)
  await page.evaluate(() => kbsStartGuided());
  await sleep(1000);
  await shot(page, '03-guided-q1-desktop');

  // Answer first question (budget) - click first option
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    if (opts.length) opts[0].click();
  });
  await sleep(300);
  await shot(page, '04-guided-q1-answered-desktop');

  // Click Next
  await page.evaluate(() => kbsNextQ());
  await sleep(1500);
  await shot(page, '05-guided-q2-desktop');

  // Test Back button on question 2
  await page.evaluate(() => kbsPrevQ());
  await sleep(1500);
  await shot(page, '06-guided-back-q1-desktop');

  // Re-answer q1 and proceed through all questions
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    if (opts.length) opts[0].click();
  });
  await sleep(200);
  await page.evaluate(() => kbsNextQ());
  await sleep(1200);

  // Answer q2
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
    if (opts.length) opts[0].click();
  });
  await sleep(200);
  await page.evaluate(() => kbsNextQ());
  await sleep(1200);

  // Check if there's a q3 or results
  const hasQ3 = await page.evaluate(() => {
    return document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)').length > 0;
  });
  if (hasQ3) {
    // Answer q3
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered) .kbs-iq-opt');
      if (opts.length) opts[0].click();
    });
    await sleep(200);
    await page.evaluate(() => kbsNextQ());
    await sleep(1500);
  }

  // Should be at results now
  await shot(page, '07-results-desktop');

  // Test Back button from results
  const hasBackBtn = await page.evaluate(() => {
    return !!document.querySelector('button[onclick="kbsBackToLastQuestion()"]');
  });
  console.log('  Back button on results:', hasBackBtn ? 'YES' : 'MISSING');

  // Select the recommended radio
  await page.evaluate(() => {
    const card = document.querySelector('.result-card.recommended');
    if (card) card.click();
  });
  await sleep(3000); // full transition animation

  // Step 4: Antennas
  await shot(page, '08-antennas-desktop');

  // Check back button
  const antBack = await page.evaluate(() => {
    return !!document.querySelector('#sec-antennas button[onclick="kbsGoBack(\'antennas\')"]');
  });
  console.log('  Back button on antennas:', antBack ? 'YES' : 'MISSING');

  // Continue without selecting antennas
  await page.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(2500);

  // Step 5: Battery
  await shot(page, '09-battery-desktop');

  await page.evaluate(() => kbsCompleteSection('battery'));
  await sleep(2500);

  // Step 6: Accessories
  await shot(page, '10-accessories-desktop');

  await page.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(2500);

  // Step 7: Programming
  await shot(page, '11-programming-desktop');

  // Test edit (back) from programming to accessories
  await page.evaluate(() => kbsGoBack('programming'));
  await sleep(1500);
  await shot(page, '12-back-to-accessories-desktop');

  // Go forward again
  await page.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(2500);

  await page.evaluate(() => kbsCompleteSection('programming'));
  await sleep(2500);

  // Step 8: Review
  await shot(page, '13-review-desktop');

  // Check completed sections readability
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await shot(page, '14-completed-sections-desktop');

  // Check price bar
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(500);
  await shot(page, '15-price-bar-desktop');

  await page.close();

  // ─── MOBILE FLOW ────────────────────────────
  console.log('\n=== MOBILE FLOW ===');
  const mpage = await browser.newPage();
  await mpage.setViewport(MOBILE);
  await mpage.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // Email step on mobile
  await shot(mpage, '16-email-mobile');

  // Skip email
  await mpage.click('a.kb-skip-link');
  await sleep(2500);

  // Interview choice
  await shot(mpage, '17-interview-choice-mobile');

  // Test "I Know What I Want" (direct path)
  await mpage.evaluate(() => kbsStartDirect());
  await sleep(800);
  await shot(mpage, '18-direct-categories-mobile');

  // Check back button on direct path
  const directBack = await mpage.evaluate(() => {
    return !!document.querySelector('button[onclick="kbsBackToChoices()"]');
  });
  console.log('  Back button on direct categories:', directBack ? 'YES' : 'MISSING');

  // Select handheld
  await mpage.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    opts.forEach(o => { if (o.textContent.includes('Handheld')) o.click(); });
  });
  await sleep(300);
  await shot(mpage, '19-direct-handheld-selected-mobile');

  // Click Next
  await mpage.evaluate(() => kbsDirectProceed());
  await sleep(3000);

  // Radio grid
  await shot(mpage, '20-radio-grid-mobile');

  // Select first radio
  await mpage.evaluate(() => {
    const pick = document.querySelector('.radio-pick');
    if (pick) pick.click();
  });
  await sleep(3000);

  // Antennas on mobile
  await shot(mpage, '21-antennas-mobile');

  // Continue through all steps
  await mpage.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(2500);
  await shot(mpage, '22-battery-mobile');

  await mpage.evaluate(() => kbsCompleteSection('battery'));
  await sleep(2500);
  await shot(mpage, '23-accessories-mobile');

  await mpage.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(2500);
  await shot(mpage, '24-programming-mobile');

  await mpage.evaluate(() => kbsCompleteSection('programming'));
  await sleep(2500);
  await shot(mpage, '25-review-mobile');

  // Scroll to top to see completed sections + active indicator
  await mpage.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await shot(mpage, '26-completed-sections-mobile');

  // Check price bar on mobile
  await mpage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(500);
  await shot(mpage, '27-price-bar-mobile');

  await mpage.close();
  await browser.close();
  console.log('\nDone! Screenshots in audit-screenshots/');
}

run().catch(e => { console.error(e); process.exit(1); });
