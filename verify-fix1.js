const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Navigate without hash to start fresh
  console.log('Navigating fresh (no hash)...');
  await page.goto('https://staging12.radiomadeeasy.com/kit-builder-v2/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Dismiss any resume prompt by clicking "Start Fresh"
  await page.evaluate(() => {
    const btn = document.getElementById('kbs-resume-no');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Skip email
  console.log('Skipping email...');
  await page.evaluate(() => { kbsSkipEmail(); });
  await new Promise(r => setTimeout(r, 2500));

  // Click "I Know What I Want"
  console.log('Starting direct flow...');
  await page.evaluate(() => { kbsStartDirect(); });
  await new Promise(r => setTimeout(r, 1500));

  // Select Handheld category
  console.log('Selecting Handheld...');
  await page.evaluate(() => {
    const opts = document.querySelectorAll('.kbs-iq-opt');
    for (const opt of opts) {
      if (opt.textContent.toLowerCase().includes('handheld')) { opt.click(); break; }
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Click Next
  await page.click('#kbs-direct-next');
  await new Promise(r => setTimeout(r, 3000));

  // Select DA-7x2 radio (look for it in the grid)
  console.log('Selecting radio...');
  const radioFound = await page.evaluate(() => {
    const cards = document.querySelectorAll('#kbs-radio-grid .radio-pick');
    for (const card of cards) {
      const text = card.textContent.toLowerCase();
      if (text.includes('7x2') || text.includes('da-7')) {
        card.click();
        return card.textContent.trim().substring(0, 60);
      }
    }
    // List all available radios for debugging
    const names = Array.from(cards).map(c => c.textContent.trim().substring(0, 40));
    return { notFound: true, available: names };
  });
  console.log('Radio:', JSON.stringify(radioFound));
  await new Promise(r => setTimeout(r, 3000));

  // Check active section - should be antennas for handheld (no mounting)
  let active = await page.evaluate(() => {
    const sections = document.querySelectorAll('.kb-section');
    return Array.from(sections)
      .filter(s => s.classList.contains('kb-section--active'))
      .map(s => s.dataset.section);
  });
  console.log('Active sections after radio:', active);

  // Wait for antenna options to render
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to antenna section
  await page.evaluate(() => {
    const sec = document.getElementById('sec-antennas');
    if (sec) sec.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 500));

  // Debug: look at what's in the antenna options
  const antennaDebug = await page.evaluate(() => {
    const optionsDiv = document.getElementById('antenna-options');
    if (!optionsDiv) return 'no antenna-options div found';
    return optionsDiv.innerHTML.substring(0, 1000);
  });
  console.log('Antenna options HTML:', antennaDebug.substring(0, 300));

  // Now scroll to show the factory antenna card specifically
  await page.evaluate(() => {
    const optionsDiv = document.getElementById('antenna-options');
    if (!optionsDiv) return;
    // Find the card with "factory" in its content
    const allDivs = optionsDiv.querySelectorAll('div, label');
    for (const el of allDivs) {
      if (el.textContent.toLowerCase().includes('factory antenna') && el.clientHeight > 40) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        // Add a visual highlight border for the screenshot
        el.style.outline = '3px solid #ff6600';
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'C:/Claude/rme-kit-builder/verify-antenna-fix.png', fullPage: false });
  console.log('Screenshot saved: verify-antenna-fix.png');

  await browser.close();
})();
