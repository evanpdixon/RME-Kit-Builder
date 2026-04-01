/**
 * Mobile rendering audit for kit builder
 */
const puppeteer = require('puppeteer');

const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
let p = 0, f = 0;
function ok(c, m) { if (c) { console.log('  ' + PASS + ' ' + m); p++; } else { console.log('  ' + FAIL + ' ' + m); f++; } }
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('\x1b[36m== MOBILE RENDERING AUDIT (390x844 — iPhone 14) ==\x1b[0m');

  await page.goto('https://staging12.radiomadeeasy.com/kit-builder/', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(500);

  // 1. Email capture
  console.log('\n  -- Email Capture Phase --');
  let r = await page.evaluate(() => {
    const phase = document.getElementById('email-capture-phase');
    const input = document.getElementById('kb-lead-email');
    const btn = document.getElementById('kb-start-btn');
    return {
      visible: getComputedStyle(phase).display !== 'none',
      inputWidth: Math.round(input.getBoundingClientRect().width),
      btnHeight: Math.round(btn.getBoundingClientRect().height),
      overflow: phase.scrollWidth > window.innerWidth
    };
  });
  ok(r.visible, 'Email capture visible');
  ok(r.inputWidth <= 390, 'Input fits viewport (' + r.inputWidth + 'px)');
  ok(r.btnHeight >= 44, 'Button meets 44px touch target (' + r.btnHeight + 'px)');
  ok(!r.overflow, 'No horizontal overflow');

  // 2. Needs landing
  await page.evaluate(() => skipEmailCapture());
  await delay(400);

  console.log('\n  -- Needs Landing --');
  r = await page.evaluate(() => {
    const paths = document.querySelectorAll('#needs-landing .selector-path');
    const anyOverflow = Array.from(paths).some(p => p.getBoundingClientRect().right > window.innerWidth);
    const allTouch = Array.from(paths).every(p => p.getBoundingClientRect().height >= 44);
    return { count: paths.length, anyOverflow, allTouch };
  });
  ok(r.count === 2, 'Two selector paths');
  ok(!r.anyOverflow, 'Paths fit viewport');
  ok(r.allTouch, 'Paths meet touch targets');

  // 3. Category picker
  await page.evaluate(() => document.querySelectorAll('#needs-landing .selector-path')[1].click());
  await delay(400);

  console.log('\n  -- Category Picker --');
  r = await page.evaluate(() => {
    const opts = document.querySelectorAll('.nq-option');
    const anyOverflow = Array.from(opts).some(o => o.getBoundingClientRect().right > window.innerWidth);
    const allTouch = Array.from(opts).every(o => o.getBoundingClientRect().height >= 44);
    return { count: opts.length, anyOverflow, allTouch };
  });
  ok(r.count >= 4, r.count + ' category options');
  ok(!r.anyOverflow, 'Options fit viewport');
  ok(r.allTouch, 'Options meet touch targets');

  // 4. Navigate to wizard
  await page.evaluate(() => document.querySelectorAll('.nq-option')[0].click());
  await delay(300);
  await page.evaluate(() => { const b = document.querySelector('.btn-next'); if (b) b.click(); });
  await delay(300);
  await page.evaluate(() => { const b = document.querySelector('.btn-next'); if (b) b.click(); });
  await delay(500);

  // Radio grid
  await page.evaluate(() => document.querySelectorAll('#selector-phase .selector-path')[1].click());
  await delay(400);

  console.log('\n  -- Radio Grid --');
  r = await page.evaluate(() => {
    const picks = document.querySelectorAll('.radio-pick');
    const anyOverflow = Array.from(picks).some(p => p.getBoundingClientRect().right > window.innerWidth + 2);
    return { count: picks.length, anyOverflow };
  });
  ok(r.count >= 3, r.count + ' radios in grid');
  ok(!r.anyOverflow, 'Radio grid fits viewport');

  // Select radio -> wizard
  await page.evaluate(() => document.querySelectorAll('#radio-grid .radio-pick')[0].click());
  await delay(600);

  console.log('\n  -- Wizard Phase --');
  r = await page.evaluate(() => {
    const hero = document.querySelector('#wizard-phase .hero');
    const heroDir = hero ? getComputedStyle(hero).flexDirection : 'N/A';
    const heroOverflow = hero ? hero.getBoundingClientRect().right > window.innerWidth : false;
    const stepMobile = document.getElementById('step-mobile');
    const stepLabels = document.querySelector('.step-labels');
    const progress = document.querySelector('.progress');
    return {
      heroDir,
      heroOverflow,
      stepMobileVisible: stepMobile && getComputedStyle(stepMobile).display !== 'none',
      stepLabelsHidden: stepLabels && getComputedStyle(stepLabels).display === 'none',
      progressHidden: progress && getComputedStyle(progress).display === 'none'
    };
  });
  ok(r.heroDir === 'column', 'Hero stacks vertically (' + r.heroDir + ')');
  ok(!r.heroOverflow, 'Hero fits viewport');
  ok(r.stepMobileVisible, 'Mobile step indicator visible');
  ok(r.stepLabelsHidden, 'Desktop step labels hidden');
  ok(r.progressHidden, 'Desktop progress bar hidden');

  // Option cards
  console.log('\n  -- Option Cards (Step 0: Antennas) --');
  r = await page.evaluate(() => {
    const cards = document.querySelectorAll('#step-0 .opt-card, #antenna-options .opt-card');
    const anyOverflow = Array.from(cards).some(c => c.getBoundingClientRect().right > window.innerWidth + 2);
    const allTouch = Array.from(cards).every(c => c.getBoundingClientRect().height >= 44);
    const widths = Array.from(cards).map(c => Math.round(c.getBoundingClientRect().width));
    return { count: cards.length, anyOverflow, allTouch, widths };
  });
  ok(r.count >= 1, r.count + ' antenna option cards');
  ok(!r.anyOverflow, 'Option cards fit viewport (widths: ' + r.widths.join(', ') + ')');
  ok(r.allTouch, 'Option cards meet touch targets');

  // THE KEY ISSUE: Bottom bar vs consultation footer
  console.log('\n  -- Bottom Bar vs Consultation Footer (THE BUG) --');
  r = await page.evaluate(() => {
    const bb = document.querySelector('.rme-kb-bottom-bar');
    const cf = document.getElementById('consultation-footer');
    const bbRect = bb ? bb.getBoundingClientRect() : null;
    const bbCs = bb ? getComputedStyle(bb) : null;
    const cfVisible = cf && cf.style.display !== 'none';
    const cfRect = cfVisible ? cf.getBoundingClientRect() : null;
    const cfCs = cfVisible ? getComputedStyle(cf) : null;

    return {
      bbVisible: bbCs && bbCs.display !== 'none',
      bbTop: bbRect ? Math.round(bbRect.top) : 'N/A',
      bbBottom: bbRect ? Math.round(bbRect.bottom) : 'N/A',
      bbHeight: bbRect ? Math.round(bbRect.height) : 'N/A',
      bbZIndex: bbCs ? bbCs.zIndex : 'N/A',
      cfVisible,
      cfTop: cfRect ? Math.round(cfRect.top) : 'N/A',
      cfBottom: cfRect ? Math.round(cfRect.bottom) : 'N/A',
      cfHeight: cfRect ? Math.round(cfRect.height) : 'N/A',
      cfZIndex: cfCs ? cfCs.zIndex : 'N/A',
      bbCoveredByCf: cfVisible && cfRect && bbRect && Number(cfCs.zIndex) > Number(bbCs.zIndex) && cfRect.top < bbRect.bottom,
      viewportHeight: window.innerHeight
    };
  });

  ok(r.bbVisible, 'Bottom bar visible');
  console.log('    Bottom bar:  top=' + r.bbTop + ' bottom=' + r.bbBottom + ' h=' + r.bbHeight + ' z=' + r.bbZIndex);
  console.log('    Consult ftr: top=' + r.cfTop + ' bottom=' + r.cfBottom + ' h=' + r.cfHeight + ' z=' + r.cfZIndex + ' visible=' + r.cfVisible);
  ok(!r.bbCoveredByCf, 'Bottom bar NOT obscured by consultation footer');

  // Check if Next button is actually tappable
  const nextTappable = await page.evaluate(() => {
    const btn = document.getElementById('btn-next');
    if (!btn) return { exists: false };
    const rect = btn.getBoundingClientRect();
    // Check element at the center of the button
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const elementAtPoint = document.elementFromPoint(centerX, centerY);
    return {
      exists: true,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
      tappableElement: elementAtPoint ? elementAtPoint.tagName + '#' + elementAtPoint.id + '.' + elementAtPoint.className.split(' ')[0] : 'null',
      isActuallyBtn: elementAtPoint === btn || (elementAtPoint && btn.contains(elementAtPoint))
    };
  });
  ok(nextTappable.exists, 'Next button exists');
  ok(nextTappable.inViewport, 'Next button in viewport (top: ' + nextTappable.top + ')');
  ok(nextTappable.isActuallyBtn, 'Next button is tappable (element at center: ' + nextTappable.tappableElement + ')');

  // Check Back button similarly
  const backTappable = await page.evaluate(() => {
    const btn = document.getElementById('btn-back');
    if (!btn || btn.style.display === 'none') return { exists: false, hidden: true };
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const elementAtPoint = document.elementFromPoint(centerX, centerY);
    return {
      exists: true,
      hidden: false,
      isActuallyBtn: elementAtPoint === btn || (elementAtPoint && btn.contains(elementAtPoint)),
      tappableElement: elementAtPoint ? elementAtPoint.tagName + '#' + elementAtPoint.id : 'null'
    };
  });
  if (!backTappable.hidden) {
    ok(backTappable.isActuallyBtn, 'Back button tappable (element: ' + backTappable.tappableElement + ')');
  }

  // Horizontal scroll check at every phase
  console.log('\n  -- Global Checks --');
  r = await page.evaluate(() => {
    return {
      horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    };
  });
  ok(!r.horizontalScroll, 'No horizontal scroll (scroll: ' + r.scrollWidth + ' viewport: ' + r.viewportWidth + ')');

  await browser.close();
  console.log('\n\x1b[36m=== MOBILE AUDIT: ' + p + ' passed, ' + f + ' failed ===\x1b[0m');
  process.exit(f > 0 ? 1 : 0);
})();
