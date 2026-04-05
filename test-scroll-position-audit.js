/**
 * RME Kit Builder Scroll Variant — Scroll Position Audit
 * Tests that every step transition scrolls to show the section heading
 * on both desktop and mobile viewports.
 *
 * Run: node test-scroll-position-audit.js
 */

const puppeteer = require('puppeteer');

const KB_URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { console.log(`  ${PASS} ${msg}`); passed++; }
  else { console.log(`  ${FAIL} ${msg}`); failed++; }
}

async function isHeaderVisible(page, sectionId) {
  return page.evaluate((id) => {
    const section = document.getElementById(id);
    if (!section) return { visible: false, reason: 'section not found' };
    const header = section.querySelector('.kb-section__header');
    if (!header) return { visible: false, reason: 'header not found' };
    const rect = header.getBoundingClientRect();
    const vpHeight = window.innerHeight;
    // Check header is within viewport (accounting for sticky site header ~80px)
    const siteHeaderHeight = 80;
    const topVisible = rect.top >= siteHeaderHeight - 10; // small tolerance
    const bottomVisible = rect.bottom <= vpHeight;
    const inViewport = topVisible && bottomVisible;
    return {
      visible: inViewport,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      vpHeight,
      siteHeaderHeight,
      reason: !topVisible ? `header top (${Math.round(rect.top)}px) is behind site header (${siteHeaderHeight}px)` :
              !bottomVisible ? `header bottom (${Math.round(rect.bottom)}px) exceeds viewport (${vpHeight}px)` : 'ok'
    };
  }, sectionId);
}

async function isQuestionVisible(page) {
  return page.evaluate(() => {
    const questions = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
    if (questions.length === 0) return { visible: false, reason: 'no active question' };
    const q = questions[questions.length - 1];
    const h3 = q.querySelector('h3');
    if (!h3) return { visible: false, reason: 'no h3 in question' };
    const rect = h3.getBoundingClientRect();
    const vpHeight = window.innerHeight;
    const siteHeaderHeight = 80;
    const topVisible = rect.top >= siteHeaderHeight - 10;
    const bottomVisible = rect.bottom <= vpHeight;
    return {
      visible: topVisible && bottomVisible,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      vpHeight,
      text: h3.textContent.substring(0, 50),
      reason: !topVisible ? `question top (${Math.round(rect.top)}px) behind header` :
              !bottomVisible ? `question bottom past viewport` : 'ok'
    };
  });
}

async function runAudit(page, viewport, label) {
  console.log(`\n${SECTION}══════ ${label} (${viewport.width}x${viewport.height}) ══════${RESET}\n`);
  await page.setViewport(viewport);
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(800);

  // ── Email skip → Interview visible ──
  console.log(`${SECTION}Step 1→2: Email skip${RESET}`);
  await page.evaluate(() => kbsSkipEmail());
  await sleep(1000);
  let pos = await isHeaderVisible(page, 'sec-interview');
  assert(pos.visible, `Interview header visible after email skip (top: ${pos.top}px) ${pos.reason}`);

  // ── Choose "Help Me Choose" ──
  console.log(`\n${SECTION}Step 2: Start guided interview${RESET}`);
  await page.evaluate(() => kbsStartGuided());
  await sleep(800);
  let qpos = await isQuestionVisible(page);
  assert(qpos.visible, `First question visible: "${qpos.text}" (top: ${qpos.top}px) ${qpos.reason}`);

  // ── Answer Q1 (usage: handheld) ──
  console.log(`\n${SECTION}Interview Q1: Usage${RESET}`);
  await page.evaluate(() => kbsAnswer('usage', 'handheld', true));
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  qpos = await isQuestionVisible(page);
  assert(qpos.visible, `Q2 visible after answering Q1: "${qpos.text}" (top: ${qpos.top}px) ${qpos.reason}`);

  // ── Answer Q2 (preferences) ──
  console.log(`\n${SECTION}Interview Q2: Preferences${RESET}`);
  await page.evaluate(() => kbsAnswer('preferences', 'waterproof', true));
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  qpos = await isQuestionVisible(page);
  assert(qpos.visible, `Q3 visible after answering Q2: "${qpos.text}" (top: ${qpos.top}px) ${qpos.reason}`);

  // ── Answer Q3 (budget) ──
  console.log(`\n${SECTION}Interview Q3: Budget${RESET}`);
  await page.evaluate(() => kbsAnswer('budget', 'mid', false));
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  qpos = await isQuestionVisible(page);
  assert(qpos.visible, `Q4 visible after answering Q3: "${qpos.text}" (top: ${qpos.top}px) ${qpos.reason}`);

  // ── Answer Q4 (use location) ──
  console.log(`\n${SECTION}Interview Q4: Use location${RESET}`);
  await page.evaluate(() => kbsAnswer('use', 'outdoor', true));
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1000);
  qpos = await isQuestionVisible(page);
  assert(qpos.visible, `Q5 visible after answering Q4: "${qpos.text}" (top: ${qpos.top}px) ${qpos.reason}`);

  // ── Answer Q5 (features) → Results ──
  console.log(`\n${SECTION}Interview Q5: Features → Results${RESET}`);
  await page.evaluate(() => kbsAnswer('features', 'waterproof', true));
  await sleep(300);
  await page.evaluate(() => kbsNextQ());
  await sleep(1200);
  // Results should show recommendation cards
  const resultsVisible = await page.evaluate(() => {
    const cards = document.querySelectorAll('.result-card');
    if (cards.length === 0) return { visible: false, reason: 'no result cards' };
    const rect = cards[0].getBoundingClientRect();
    return { visible: rect.top >= 0 && rect.top < window.innerHeight, top: Math.round(rect.top) };
  });
  assert(resultsVisible.visible, `Recommendation cards visible (top: ${resultsVisible.top}px)`);

  // ── Select radio → Antennas visible ──
  console.log(`\n${SECTION}Radio → Antennas${RESET}`);
  await page.evaluate(() => kbsSelectRadio('uv-pro'));
  await sleep(1200);
  pos = await isHeaderVisible(page, 'sec-antennas');
  assert(pos.visible, `Antennas header visible after radio select (top: ${pos.top}px) ${pos.reason}`);

  // ── Antennas → Battery ──
  console.log(`\n${SECTION}Antennas → Battery${RESET}`);
  await page.evaluate(() => kbsCompleteSection('antennas'));
  await sleep(1200);
  pos = await isHeaderVisible(page, 'sec-battery');
  assert(pos.visible, `Battery header visible (top: ${pos.top}px) ${pos.reason}`);

  // ── Battery → Accessories ──
  console.log(`\n${SECTION}Battery → Accessories${RESET}`);
  await page.evaluate(() => kbsCompleteSection('battery'));
  await sleep(1200);
  pos = await isHeaderVisible(page, 'sec-accessories');
  assert(pos.visible, `Accessories header visible (top: ${pos.top}px) ${pos.reason}`);

  // ── Accessories → Programming ──
  console.log(`\n${SECTION}Accessories → Programming${RESET}`);
  await page.evaluate(() => kbsCompleteSection('accessories'));
  await sleep(1200);
  pos = await isHeaderVisible(page, 'sec-programming');
  assert(pos.visible, `Programming header visible (top: ${pos.top}px) ${pos.reason}`);

  // ── Programming → Review ──
  console.log(`\n${SECTION}Programming → Review${RESET}`);
  await page.evaluate(() => kbsCompleteSection('programming'));
  await sleep(1200);
  pos = await isHeaderVisible(page, 'sec-review');
  assert(pos.visible, `Review header visible (top: ${pos.top}px) ${pos.reason}`);

  // ── Back button: Programming ← Review ──
  console.log(`\n${SECTION}Back: Review → Programming${RESET}`);
  await page.evaluate(() => kbsGoBack('review'));
  await sleep(1200);
  // After back, programming should re-open - but kbsGoBack edits the previous completed section
  // Actually kbsGoBack('review') doesn't exist since review has no back button in actions
  // Let's test from programming going back
  await page.evaluate(() => kbsCompleteSection('programming')); // re-complete to get to review
  await sleep(800);
  await page.evaluate(() => kbsEditSection('antennas'));
  await sleep(1200);
  pos = await isHeaderVisible(page, 'sec-antennas');
  assert(pos.visible, `Antennas header visible after edit (top: ${pos.top}px) ${pos.reason}`);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Desktop
  await runAudit(page, { width: 1440, height: 900 }, 'DESKTOP');

  // Mobile
  await runAudit(page, { width: 375, height: 812 }, 'MOBILE (iPhone)');

  // Tablet
  await runAudit(page, { width: 768, height: 1024 }, 'TABLET (iPad)');

  console.log(`\n${SECTION}══════ SUMMARY ══════${RESET}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${passed + failed}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
