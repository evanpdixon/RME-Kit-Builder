const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log('Step 1: Navigate to kit builder');
  await page.goto('https://staging12.radiomadeeasy.com/kit-builder-v2/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Dismiss any resume prompt
  await page.evaluate(() => {
    const btn = document.getElementById('kbs-resume-no');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Skip email
  console.log('Step 1b: Skip email');
  await page.evaluate(() => { kbsSkipEmail(); });
  await new Promise(r => setTimeout(r, 2500));

  // Step 2: Click "I Know What I Want"
  console.log('Step 2: Click "I Know What I Want"');
  await page.evaluate(() => { kbsStartDirect(); });
  await new Promise(r => setTimeout(r, 2000));

  // Step 3: Select Scanner category
  console.log('Step 3: Select Scanner');
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) {
      if (opt.textContent.toLowerCase().includes('scanner')) { opt.click(); break; }
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Step 4: Click Next
  console.log('Step 4: Click Next');
  await page.click('#kbs-direct-next');
  await new Promise(r => setTimeout(r, 3000));

  // Step 5: Select first scanner radio card
  console.log('Step 5: Select first scanner radio');
  const radioClicked = await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-pick');
    if (cards.length > 0) { cards[0].click(); return cards[0].textContent.trim().substring(0, 60); }
    return null;
  });
  console.log('  Radio:', radioClicked);
  await new Promise(r => setTimeout(r, 3000));

  // Step 6: Complete antenna section
  console.log('Step 6: Complete antennas');
  await page.evaluate(() => { kbsCompleteSection('antennas'); });

  // Wait for the full state machine transition (800ms loading + 1200ms fade + rendering)
  await new Promise(r => setTimeout(r, 4000));

  // Step 7: Verify accessories is active and battery is skipped
  const state = await page.evaluate(() => {
    const sections = document.querySelectorAll('.kb-section');
    const result = {};
    sections.forEach(s => {
      const sec = s.dataset.section;
      result[sec] = {
        state: s.classList.contains('kb-section--active') ? 'ACTIVE' :
               s.classList.contains('kb-section--complete') ? 'complete' :
               s.classList.contains('kb-section--loading') ? 'loading' :
               s.classList.contains('kb-section--locked') ? 'locked' : 'unknown',
        visible: s.style.display !== 'none'
      };
    });
    return result;
  });
  console.log('Section states:', JSON.stringify(state, null, 2));

  // Scroll to accessories section
  await page.evaluate(() => {
    const sec = document.getElementById('sec-accessories');
    if (sec) sec.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'C:/Claude/rme-kit-builder/verify-scanner-fix.png', fullPage: false });
  console.log('Screenshot saved: verify-scanner-fix.png');

  await browser.close();
})();
