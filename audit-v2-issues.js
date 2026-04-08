/**
 * Targeted screenshots for specific issues
 */
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

  // Mobile flow - get to programming step
  console.log('\n=== MOBILE: Programming + Battery + Accessories ===');
  const m = await browser.newPage();
  await m.setViewport({ width: 375, height: 812 });
  await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // Skip email
  await m.click('a.kb-skip-link');
  await sleep(2500);

  // Direct path -> handheld
  await m.evaluate(() => kbsStartDirect());
  await sleep(800);
  await m.evaluate(() => {
    document.querySelectorAll('.kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Handheld')) o.click();
    });
  });
  await sleep(300);
  await m.evaluate(() => kbsDirectProceed());
  await sleep(3000);

  // Select first radio (UV-5R for color options)
  await m.evaluate(() => {
    const picks = document.querySelectorAll('.radio-pick');
    // Find UV-Pro or UV-5R for battery color
    for (const p of picks) {
      if (p.textContent.includes('UV-Pro')) { p.click(); return; }
    }
    // fallback to first
    if (picks.length) picks[0].click();
  });
  await sleep(3000);

  // Antennas - scroll down to see full content
  await shot(m, 'issue-antennas-mobile');
  await m.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(2500);

  // Battery step - look for color picker
  await shot(m, 'issue-battery-mobile-top');
  await m.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(m, 'issue-battery-mobile-scroll');

  await m.evaluate(() => kbsCompleteSection('battery'));
  await sleep(2500);

  // Accessories step
  await shot(m, 'issue-accessories-mobile-top');
  await m.evaluate(() => window.scrollBy(0, 300));
  await sleep(500);
  await shot(m, 'issue-accessories-mobile-scroll');
  await m.evaluate(() => window.scrollBy(0, 300));
  await sleep(500);
  await shot(m, 'issue-accessories-mobile-scroll2');

  await m.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(2500);

  // Programming step
  await shot(m, 'issue-programming-mobile-top');
  await m.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(m, 'issue-programming-mobile-scroll');
  await m.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(m, 'issue-programming-mobile-scroll2');

  // Also desktop programming for comparison
  await m.close();

  console.log('\n=== DESKTOP: Programming + Accessories ===');
  const d = await browser.newPage();
  await d.setViewport({ width: 1280, height: 900 });
  await d.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await d.click('a.kb-skip-link');
  await sleep(2500);
  await d.evaluate(() => kbsStartDirect());
  await sleep(800);
  await d.evaluate(() => {
    document.querySelectorAll('.kbs-iq-opt').forEach(o => {
      if (o.textContent.includes('Handheld')) o.click();
    });
  });
  await sleep(300);
  await d.evaluate(() => kbsDirectProceed());
  await sleep(3000);
  // Select UV-Pro if available
  await d.evaluate(() => {
    const picks = document.querySelectorAll('.radio-pick');
    for (const p of picks) {
      if (p.textContent.includes('UV-Pro')) { p.click(); return; }
    }
    if (picks.length) picks[0].click();
  });
  await sleep(3000);
  await d.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(2500);
  await shot(d, 'issue-battery-desktop');
  await d.evaluate(() => kbsCompleteSection('battery'));
  await sleep(2500);
  await shot(d, 'issue-accessories-desktop');
  await d.evaluate(() => window.scrollBy(0, 400));
  await sleep(500);
  await shot(d, 'issue-accessories-desktop-scroll');
  await d.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(2500);
  await shot(d, 'issue-programming-desktop');
  await d.evaluate(() => window.scrollBy(0, 500));
  await sleep(500);
  await shot(d, 'issue-programming-desktop-scroll');

  await d.close();
  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
