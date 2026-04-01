const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('https://staging12.radiomadeeasy.com/kit-builder/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => skipEmailCapture());
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => document.querySelectorAll('#needs-landing .selector-path')[1].click());
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => document.querySelectorAll('.nq-option')[0].click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { const b = document.querySelector('.btn-next'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { const b = document.querySelector('.btn-next'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => document.querySelectorAll('#selector-phase .selector-path')[1].click());
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => document.querySelectorAll('#radio-grid .radio-pick')[0].click());
  await new Promise(r => setTimeout(r, 600));

  // Check what's at the Next button center
  const btnInfo = await page.evaluate(() => {
    const btn = document.getElementById('btn-next');
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const atPoint = document.elementFromPoint(cx, cy);
    return {
      btnRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      atCenter: atPoint ? (atPoint.tagName + '#' + atPoint.id) : 'null'
    };
  });
  console.log('Button info:', JSON.stringify(btnInfo));

  // Try touchscreen tap
  const box = btnInfo.btnRect;
  await page.touchscreen.tap(box.x + box.w / 2, box.y + box.h / 2);
  await new Promise(r => setTimeout(r, 500));

  const after = await page.evaluate(() => {
    const s1 = document.getElementById('step-1');
    return { step1active: s1 && s1.classList.contains('active') };
  });
  console.log(after.step1active ? 'TAP WORKED — advanced to step 1' : 'TAP BLOCKED — still on step 0');

  // Also try pointer-events: none on mcforms and retry
  if (!after.step1active) {
    await page.evaluate(() => {
      const mc = document.querySelector('[id^="mcforms-"]');
      if (mc) mc.style.pointerEvents = 'none';
    });
    await page.touchscreen.tap(box.x + box.w / 2, box.y + box.h / 2);
    await new Promise(r => setTimeout(r, 500));
    const after2 = await page.evaluate(() => {
      const s1 = document.getElementById('step-1');
      return { step1active: s1 && s1.classList.contains('active') };
    });
    console.log(after2.step1active ? 'TAP WITH pointer-events:none WORKED' : 'STILL BLOCKED');
  }

  await browser.close();
})();
