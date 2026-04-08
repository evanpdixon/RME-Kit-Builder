const puppeteer = require('puppeteer');
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

const PAGES = [
  'https://staging12.radiomadeeasy.com/',
  'https://staging12.radiomadeeasy.com/kit-builder/',
  'https://staging12.radiomadeeasy.com/shop/',
  'https://staging12.radiomadeeasy.com/training/',
  'https://staging12.radiomadeeasy.com/about/',
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  for (const url of PAGES) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport(MOBILE);
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));

    const result = await page.evaluate(() => {
      const mc = document.querySelector('[id^="mcforms-"]');
      if (!mc) return { found: false };
      const s = window.getComputedStyle(mc);
      return {
        found: true, id: mc.id,
        pointerEvents: s.pointerEvents, zIndex: s.zIndex,
        position: s.position, display: s.display,
      };
    });

    const status = result.found
      ? `pointer:${result.pointerEvents} z:${result.zIndex} ${result.pointerEvents === 'none' ? 'BROKEN' : 'OK'}`
      : 'no popup';
    console.log(`${url.padEnd(55)} ${status}`);
    await ctx.close();
  }
  await browser.close();
})();
