/**
 * RME Kit Builder Scroll Variant — Desktop + Mobile UI Audit
 * Run: node test-scroll-audit.js
 */

const puppeteer = require('puppeteer');

const KB_URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0;
const jsErrors = [];

function assert(condition, msg) {
  if (condition) { console.log(`  ${PASS} ${msg}`); passed++; }
  else { console.log(`  ${FAIL} ${msg}`); failed++; }
}

async function runAudit(page, viewport, label) {
  console.log(`\n${SECTION}══════ ${label} (${viewport.width}x${viewport.height}) ══════${RESET}\n`);
  await page.setViewport(viewport);
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(500);

  // ── 1. Page Structure ──
  console.log(`${SECTION}1. Page Structure${RESET}`);
  const container = await page.$('#rme-kit-builder-scroll');
  assert(container, 'Scroll container exists');

  const sections = await page.evaluate(() => {
    return [...document.querySelectorAll('.kb-section')].map(s => ({
      id: s.id,
      state: s.classList.contains('kb-section--active') ? 'active'
           : s.classList.contains('kb-section--locked') ? 'locked'
           : s.classList.contains('kb-section--complete') ? 'complete' : 'unknown',
      visible: s.offsetParent !== null,
    }));
  });
  assert(sections.length === 8, `8 sections present (got ${sections.length})`);
  assert(sections[0].state === 'active', `Email section is active (${sections[0].state})`);
  const lockedCount = sections.filter(s => s.state === 'locked').length;
  assert(lockedCount === 7, `7 sections locked on load (got ${lockedCount})`);

  // ── 2. Price Bar Hidden Initially ──
  console.log(`\n${SECTION}2. Price Bar${RESET}`);
  const priceBarHidden = await page.evaluate(() => {
    const bar = document.getElementById('kb-scroll-price-bar');
    return bar && bar.style.display === 'none';
  });
  assert(priceBarHidden, 'Price bar hidden on page load');

  // ── 3. Email Skip ──
  console.log(`\n${SECTION}3. Email Skip${RESET}`);
  await page.evaluate(() => { if (typeof kbsSkipEmail === 'function') kbsSkipEmail(); });
  await sleep(600);

  const emailComplete = await page.evaluate(() => {
    const el = document.getElementById('sec-email');
    return el && el.classList.contains('kb-section--complete');
  });
  assert(emailComplete, 'Email section is complete after skip');

  const interviewActive = await page.evaluate(() => {
    const el = document.getElementById('sec-interview');
    return el && el.classList.contains('kb-section--active');
  });
  assert(interviewActive, 'Interview section is active after email skip');

  // ── 4. Choice Screen ──
  console.log(`\n${SECTION}4. Choice Screen${RESET}`);
  const choiceVisible = await page.evaluate(() => {
    const el = document.getElementById('kbs-interview-choice');
    return el && el.style.display !== 'none' && el.offsetParent !== null;
  });
  assert(choiceVisible, 'Help Me Choose / I Know What I Want choice visible');

  const choiceCards = await page.$$('.kbs-choice-card');
  assert(choiceCards.length === 2, `2 choice cards present (got ${choiceCards.length})`);

  // ── 5. "I Know What I Want" Path ──
  console.log(`\n${SECTION}5. Direct Radio Selection Path${RESET}`);
  await page.evaluate(() => { if (typeof kbsStartDirect === 'function') kbsStartDirect(); });
  await sleep(600);

  const radioActive = await page.evaluate(() => {
    const el = document.getElementById('sec-radio');
    return el && el.classList.contains('kb-section--active');
  });
  assert(radioActive, 'Radio section active after "I Know What I Want"');

  const radioCards = await page.$$('#kbs-radio-grid .radio-pick');
  assert(radioCards.length === 5, `5 radio cards in grid (got ${radioCards.length})`);

  // ── 6. Select Radio ──
  console.log(`\n${SECTION}6. Radio Selection${RESET}`);
  await page.evaluate(() => { if (typeof kbsSelectRadio === 'function') kbsSelectRadio('uv-pro'); });
  await sleep(800);

  const antennasActive = await page.evaluate(() => {
    const el = document.getElementById('sec-antennas');
    return el && el.classList.contains('kb-section--active');
  });
  assert(antennasActive, 'Antennas section active after radio selection');

  const priceBarVisible = await page.evaluate(() => {
    const bar = document.getElementById('kb-scroll-price-bar');
    return bar && bar.style.display !== 'none';
  });
  assert(priceBarVisible, 'Price bar visible after radio selection');

  const priceText = await page.evaluate(() => {
    const el = document.getElementById('kbs-total');
    return el ? el.textContent : '';
  });
  assert(priceText.includes('$'), `Price bar shows total: ${priceText}`);

  // ── 7. Section Completion States ──
  console.log(`\n${SECTION}7. Completed Section Styling${RESET}`);
  const completedOpacity = await page.evaluate(() => {
    const el = document.getElementById('sec-email');
    return el ? parseFloat(getComputedStyle(el).opacity) : 1;
  });
  assert(completedOpacity <= 0.5, `Completed sections dimmed (opacity: ${completedOpacity})`);

  // ── 8. Antenna Grid Layout ──
  console.log(`\n${SECTION}8. Antenna Grid Layout${RESET}`);
  const antennaCards = await page.$$('#antenna-options .opt-card');
  assert(antennaCards.length >= 4, `Antenna cards rendered (got ${antennaCards.length})`);

  if (viewport.width >= 768) {
    const gridCols = await page.evaluate(() => {
      const grid = document.querySelector('#rme-kit-builder-scroll .options-grid');
      if (!grid) return '';
      return getComputedStyle(grid).gridTemplateColumns;
    });
    const colCount = gridCols.split(' ').filter(s => s.trim()).length;
    assert(colCount >= 2, `Grid has ${colCount} columns on desktop`);
  }

  // ── 9. Best-Use Labels ──
  console.log(`\n${SECTION}9. Best-Use Labels${RESET}`);
  const bestUseLabels = await page.$$('.oc-best-use');
  assert(bestUseLabels.length >= 3, `Best-use labels present (${bestUseLabels.length})`);

  // ── 10. Section Divider ──
  console.log(`\n${SECTION}10. Antenna Subsection Divider${RESET}`);
  const divider = await page.$('.antenna-section-divider');
  assert(divider, 'Add More Antennas divider present');

  // ── 11. Continue Through Steps ──
  console.log(`\n${SECTION}11. Step Progression${RESET}`);
  // Complete antennas
  await page.evaluate(() => { if (typeof kbsCompleteSection === 'function') kbsCompleteSection('antennas'); });
  await sleep(500);
  const batteryActive = await page.evaluate(() => document.getElementById('sec-battery')?.classList.contains('kb-section--active'));
  assert(batteryActive, 'Battery section active after completing antennas');

  // Complete battery
  await page.evaluate(() => { if (typeof kbsCompleteSection === 'function') kbsCompleteSection('battery'); });
  await sleep(500);
  const accActive = await page.evaluate(() => document.getElementById('sec-accessories')?.classList.contains('kb-section--active'));
  assert(accActive, 'Accessories section active after completing battery');

  // ── 12. Accessories Help Panel ──
  console.log(`\n${SECTION}12. Accessories Help Panel${RESET}`);
  const helpToggle = await page.$('.acc-help-toggle');
  assert(helpToggle, 'Help toggle present in accessories');

  // Complete accessories
  await page.evaluate(() => { if (typeof kbsCompleteSection === 'function') kbsCompleteSection('accessories'); });
  await sleep(500);
  const progActive = await page.evaluate(() => document.getElementById('sec-programming')?.classList.contains('kb-section--active'));
  assert(progActive, 'Programming section active after completing accessories');

  // Complete programming
  await page.evaluate(() => { if (typeof kbsCompleteSection === 'function') kbsCompleteSection('programming'); });
  await sleep(500);
  const reviewActive = await page.evaluate(() => document.getElementById('sec-review')?.classList.contains('kb-section--active'));
  assert(reviewActive, 'Review section active after completing programming');

  // ── 13. Cart Button ──
  console.log(`\n${SECTION}13. Cart Button${RESET}`);
  const cartEnabled = await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn');
    return btn && !btn.disabled;
  });
  assert(cartEnabled, 'Add to Cart button enabled on review step');

  // ── 14. Edit Section ──
  console.log(`\n${SECTION}14. Edit Completed Section${RESET}`);
  await page.evaluate(() => { if (typeof kbsEditSection === 'function') kbsEditSection('antennas'); });
  await sleep(500);
  const antennasActiveAgain = await page.evaluate(() => document.getElementById('sec-antennas')?.classList.contains('kb-section--active'));
  assert(antennasActiveAgain, 'Antennas section re-activates on edit');

  const reviewLocked = await page.evaluate(() => document.getElementById('sec-review')?.classList.contains('kb-section--locked'));
  assert(reviewLocked, 'Downstream sections locked after edit');

  const cartDisabled = await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn');
    return btn && btn.disabled;
  });
  assert(cartDisabled, 'Cart button disabled after editing');

  // ── 15. Consult Link ──
  console.log(`\n${SECTION}15. Consultation Link${RESET}`);
  const consultLink = await page.evaluate(() => {
    const el = document.getElementById('kbs-consult-btn');
    return el ? el.href : '';
  });
  assert(consultLink.includes('calendly'), `Consult link points to Calendly: ${consultLink.substring(0, 40)}...`);

  // ── 16. JS Errors ──
  console.log(`\n${SECTION}16. JavaScript Errors${RESET}`);
  const criticalErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('404'));
  if (criticalErrors.length === 0) {
    console.log(`  ${PASS} No JS errors`);
    passed++;
  } else {
    criticalErrors.forEach(e => console.log(`  ${FAIL} ${e}`));
    failed += criticalErrors.length;
  }

  // ── 17. Font & Touch Targets (mobile) ──
  if (viewport.width < 768) {
    console.log(`\n${SECTION}17. Mobile Specifics${RESET}`);
    const gridSingleCol = await page.evaluate(() => {
      const grid = document.querySelector('#rme-kit-builder-scroll .options-grid');
      if (!grid) return true;
      const cols = getComputedStyle(grid).gridTemplateColumns;
      return cols.split(' ').filter(s => s.trim()).length === 1;
    });
    assert(gridSingleCol, 'Options grid is single column on mobile');

    const choiceCardsStack = await page.evaluate(() => {
      const screen = document.querySelector('.kbs-choice-screen');
      if (!screen) return true;
      return getComputedStyle(screen).flexDirection === 'column' || screen.scrollWidth <= screen.clientWidth + 10;
    });
    assert(choiceCardsStack, 'Choice cards fit within mobile viewport');
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  // Desktop audit
  await runAudit(page, { width: 1440, height: 900 }, 'DESKTOP');

  // Reset errors for mobile
  jsErrors.length = 0;

  // Mobile audit
  await runAudit(page, { width: 375, height: 812 }, 'MOBILE (iPhone)');

  // Summary
  console.log(`\n${SECTION}══════ SUMMARY ══════${RESET}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${passed + failed}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
