/**
 * RME Kit Builder — UI Audit after Testing Feedback Changes
 * Run: node test-ui-audit.js
 */

const puppeteer = require('puppeteer');

const KB_URL = 'https://staging12.radiomadeeasy.com/kit-builder/';
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const WARN = '\x1b[33m[WARN]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0, warned = 0;
const jsErrors = [];

function assert(condition, msg) {
  if (condition) { console.log(`  ${PASS} ${msg}`); passed++; }
  else { console.log(`  ${FAIL} ${msg}`); failed++; }
}

async function clickByText(page, selector, text) {
  return page.evaluate((sel, txt) => {
    const els = [...document.querySelectorAll(sel)];
    const el = els.find(e => e.textContent.includes(txt));
    if (el) { el.click(); return true; }
    return false;
  }, selector, text);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });

  console.log(`\n${SECTION}=== RME Kit Builder UI Audit ===${RESET}\n`);

  // ── 1. Page Load ──
  console.log(`${SECTION}1. Page Load${RESET}`);
  await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  assert(await page.$('#rme-kit-builder'), 'Kit builder container loads');

  // ── 2. Email Capture (skip) ──
  console.log(`\n${SECTION}2. Email Capture${RESET}`);
  assert(await page.$('#email-capture-phase'), 'Email capture phase exists');
  await page.evaluate(() => { if (typeof skipEmailCapture === 'function') skipEmailCapture(); });
  await sleep(800);

  // ── 3. Needs Assessment Landing ──
  console.log(`\n${SECTION}3. Needs Assessment Landing${RESET}`);
  const needsVisible = await page.evaluate(() => {
    const el = document.getElementById('needs-phase');
    return el && el.style.display !== 'none';
  });
  assert(needsVisible, 'Needs assessment phase is visible after email skip');

  // Click "I Know What I Need" to go to category picker
  await page.evaluate(() => { if (typeof showCategoryPicker === 'function') showCategoryPicker(); });
  await sleep(600);

  // Select "Handheld" category to reach the selector-phase
  const clickedHandheld = await page.evaluate(() => {
    // Look for a category card or button for handheld
    const cards = [...document.querySelectorAll('.nq-option, .cat-card, [onclick*="handheld"], [onclick*="Handheld"]')];
    if (cards.length > 0) { cards[0].click(); return true; }
    // Try clicking text-based
    const btns = [...document.querySelectorAll('button, .selector-path, .cat-pick, div[onclick]')];
    const hh = btns.find(b => b.textContent.toLowerCase().includes('handheld'));
    if (hh) { hh.click(); return true; }
    return false;
  });
  await sleep(600);

  // If that didn't work, try the direct approach - just go to selector phase
  const selectorVisible = await page.evaluate(() => {
    const el = document.getElementById('selector-phase');
    return el && el.style.display !== 'none';
  });

  if (!selectorVisible) {
    // Alternative: use startNeedsAssessment flow or navigate via needs questions
    console.log('  (Navigating to selector via needs assessment...)');
    await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => { if (typeof skipEmailCapture === 'function') skipEmailCapture(); });
    await sleep(600);
    // Click "I Know What I Need" then pick handheld category
    await page.evaluate(() => { if (typeof showCategoryPicker === 'function') showCategoryPicker(); });
    await sleep(600);

    // Debug: what's visible now?
    const debugState = await page.evaluate(() => {
      const ids = ['email-capture-phase','needs-phase','needs-landing','needs-container','kit-plan-container','selector-phase','wizard-phase'];
      return ids.map(id => {
        const el = document.getElementById(id);
        return id + ': ' + (el ? (el.style.display || 'default') + (el.offsetParent ? ' (visible)' : ' (hidden)') : 'null');
      });
    });
    console.log('  Debug state:', debugState.join(' | '));
  }

  // ── 4. Selector Landing (Handheld) ──
  console.log(`\n${SECTION}4. Selector Landing${RESET}`);

  // Try to find selector paths regardless of how we got here
  const selectorPaths = await page.evaluate(() => {
    const landing = document.getElementById('selector-landing');
    if (!landing) return { count: 0, texts: [] };
    const paths = landing.querySelectorAll('.selector-path');
    return {
      count: paths.length,
      texts: [...paths].map(p => p.textContent.trim().substring(0, 50))
    };
  });

  if (selectorPaths.count > 0) {
    assert(selectorPaths.count === 1, `Only 1 selector path shown (got ${selectorPaths.count}) — "I Know What I Want" removed`);
    const hasIKnow = selectorPaths.texts.some(t => t.includes('I Know What I Want'));
    assert(!hasIKnow, '"I Know What I Want" is not present');
    const hasGuided = selectorPaths.texts.some(t => t.includes("Let's Get Started"));
    assert(hasGuided, '"Let\'s Get Started" guided path is present');
  } else {
    console.log('  (Selector landing not reached via category flow — testing via direct navigation)');
  }

  // ── 5. Get into wizard via direct radio selection ──
  console.log(`\n${SECTION}5. Enter Wizard (direct radio select)${RESET}`);
  // Use selectRadio directly to get into wizard
  await page.evaluate(() => { if (typeof selectRadio === 'function') selectRadio('uv5r'); });
  await sleep(1000);

  const wizardVisible = await page.evaluate(() => {
    const el = document.getElementById('wizard-phase');
    return el && el.style.display !== 'none';
  });
  assert(wizardVisible, 'Wizard phase is visible after selecting UV-5R');

  // ── 6. Merged Antenna Step ──
  console.log(`\n${SECTION}6. Antenna Step (merged)${RESET}`);
  const step0Active = await page.evaluate(() => {
    const el = document.getElementById('step-0');
    return el && el.style.display !== 'none';
  });
  assert(step0Active, 'Step 0 (Antennas) is active');

  const heading = await page.evaluate(() => {
    const h2 = document.querySelector('#step-0 .section-head h2');
    return h2 ? h2.textContent : '';
  });
  assert(heading === 'Antennas', `Heading is "Antennas" (got "${heading}")`);

  const divider = await page.$('.antenna-section-divider');
  assert(divider, '"Add More Antennas" subsection divider present');

  const bestUseLabels = await page.$$('.oc-best-use');
  assert(bestUseLabels.length >= 3, `Best-use labels present (${bestUseLabels.length} found)`);

  const firstLabel = await page.evaluate(el => el ? el.textContent : '', bestUseLabels[0]);
  assert(firstLabel.includes('Best for:'), `Best-use label format: "${firstLabel}"`);

  const step1Hidden = await page.evaluate(() => {
    const el = document.getElementById('step-1');
    return !el || el.style.display === 'none';
  });
  assert(step1Hidden, 'Old step-1 (More Antennas) is hidden');

  // Count total upgrade antenna cards (with toggleAntenna) and additional (with toggleAddlAntenna)
  const antennaCounts = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#antenna-options .opt-card[onclick]')];
    const upgrade = cards.filter(c => c.getAttribute('onclick').includes('toggleAntenna('));
    const addl = cards.filter(c => c.getAttribute('onclick').includes('toggleAddlAntenna('));
    return { upgrade: upgrade.length, additional: addl.length };
  });
  assert(antennaCounts.upgrade === 3, `3 upgrade antenna cards (got ${antennaCounts.upgrade})`);
  assert(antennaCounts.additional === 5, `5 additional antenna cards (got ${antennaCounts.additional})`);

  // ── 7. Additional Antenna Selection Visual State ──
  console.log(`\n${SECTION}7. Additional Antenna Selection Visual${RESET}`);
  // Click the Extra Adapter (doesn't need adapter modal)
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('extraadapter'); });
  await sleep(500);

  const adapterSelected = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#antenna-options .opt-card')];
    const adapter = cards.find(c => c.getAttribute('onclick') && c.getAttribute('onclick').includes("'extraadapter'"));
    return adapter ? adapter.classList.contains('selected') : false;
  });
  assert(adapterSelected, 'Extra Adapter card shows selected state visually');

  const adapterCheck = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#antenna-options .opt-card.selected')];
    const adapter = cards.find(c => c.getAttribute('onclick') && c.getAttribute('onclick').includes("'extraadapter'"));
    if (!adapter) return false;
    const check = adapter.querySelector('.oc-check');
    return check && check.textContent.trim() === '\u2713';
  });
  assert(adapterCheck, 'Selected card has checkmark');

  // Deselect it
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('extraadapter'); });
  await sleep(300);

  const adapterDeselected = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#antenna-options .opt-card')];
    const adapter = cards.find(c => c.getAttribute('onclick') && c.getAttribute('onclick').includes("'extraadapter'"));
    return adapter ? !adapter.classList.contains('selected') : false;
  });
  assert(adapterDeselected, 'Card deselects properly');

  // Now test an antenna that needs the adapter modal (Wearable)
  await page.evaluate(() => { if (typeof toggleAddlAntenna === 'function') toggleAddlAntenna('wearable'); });
  await sleep(500);

  const modalOpen = await page.evaluate(() => {
    const modal = document.getElementById('adapter-modal');
    return modal && modal.classList.contains('open');
  });
  assert(modalOpen, 'Adapter modal opens for BNC antenna without adapter');

  if (modalOpen) {
    // Add adapter via modal
    await page.evaluate(() => { if (typeof adapterModalAdd === 'function') adapterModalAdd(); });
    await sleep(500);

    const wearableSelected = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#antenna-options .opt-card')];
      const w = cards.find(c => c.getAttribute('onclick') && c.getAttribute('onclick').includes("'wearable'"));
      return w ? w.classList.contains('selected') : false;
    });
    assert(wearableSelected, 'Wearable antenna shows selected after adapter modal');
  }

  // ── 8. Step Navigation & Consult Button ──
  console.log(`\n${SECTION}8. Step Navigation & Consult Button${RESET}`);
  const totalSteps = await page.evaluate(() => document.querySelectorAll('.step-label').length);
  console.log(`  Total steps: ${totalSteps}`);

  // Navigate to first step
  await page.evaluate(() => { if (typeof goStep === 'function') goStep(0); });
  await sleep(300);

  for (let s = 0; s < totalSteps; s++) {
    await page.evaluate((step) => { if (typeof goStep === 'function') goStep(step); }, s);
    await sleep(400);

    const stepInfo = await page.evaluate(() => {
      const active = document.querySelector('.step-label.active');
      const name = active ? active.textContent.trim() : 'unknown';
      const btn = document.getElementById('btn-consult');
      const visible = btn && btn.style.display !== 'none';
      const opacity = btn ? btn.style.opacity : '0';
      return { name, visible, opacity };
    });
    assert(stepInfo.visible, `Step "${stepInfo.name}": Consult button visible (opacity: ${stepInfo.opacity || '1'})`);
  }

  // ── 9. Accessories Help Panel ──
  console.log(`\n${SECTION}9. Accessories Help Panel${RESET}`);
  // Navigate to accessories
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll('.step-label')];
    const acc = labels.findIndex(l => l.textContent.trim() === 'Accessories');
    if (acc >= 0 && typeof goStep === 'function') goStep(acc);
  });
  await sleep(500);

  const helpToggle = await page.$('.acc-help-toggle');
  assert(helpToggle, 'Help toggle button exists');

  if (helpToggle) {
    const closedFirst = await page.evaluate(() => !document.querySelector('.acc-help-panel').classList.contains('open'));
    assert(closedFirst, 'Help panel closed by default');

    await page.evaluate(() => document.querySelector('.acc-help-toggle').click());
    await sleep(400);
    const opened = await page.evaluate(() => document.querySelector('.acc-help-panel').classList.contains('open'));
    assert(opened, 'Help panel opens on click');

    const items = await page.$$('.acc-help-panel li');
    assert(items.length >= 5, `Help panel has ${items.length} guide items`);

    await page.evaluate(() => document.querySelector('.acc-help-toggle').click());
    await sleep(400);
    const closed = await page.evaluate(() => !document.querySelector('.acc-help-panel').classList.contains('open'));
    assert(closed, 'Help panel closes on second click');
  }

  // ── 10. Font Sizes ──
  console.log(`\n${SECTION}10. Font Sizes${RESET}`);
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll('.step-label')];
    const ant = labels.findIndex(l => l.textContent.trim() === 'Antennas');
    if (ant >= 0 && typeof goStep === 'function') goStep(ant);
  });
  await sleep(400);

  const fonts = await page.evaluate(() => {
    const get = sel => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; };
    return {
      cardName: get('.opt-card .oc-name'),
      cardDesc: get('.opt-card .oc-desc'),
      cardPrice: get('.opt-card .oc-price'),
      sectionP: get('.section-head p'),
      stepLabel: get('.step-label'),
    };
  });
  assert(fonts.cardName >= 16, `Card name >= 16px (${fonts.cardName}px)`);
  assert(fonts.cardDesc >= 13, `Card desc >= 13px (${fonts.cardDesc}px)`);
  assert(fonts.cardPrice >= 17, `Card price >= 17px (${fonts.cardPrice}px)`);
  assert(fonts.sectionP >= 15, `Section p >= 15px (${fonts.sectionP}px)`);
  assert(fonts.stepLabel >= 12, `Step label >= 12px (${fonts.stepLabel}px)`);

  // ── 11. Bottom Bar ──
  console.log(`\n${SECTION}11. Bottom Bar${RESET}`);
  const bb = await page.evaluate(() => {
    const bar = document.querySelector('.rme-kb-bottom-bar');
    if (!bar) return null;
    return {
      visible: bar.style.display !== 'none',
      back: !!document.getElementById('btn-back'),
      next: !!document.getElementById('btn-next'),
      consult: !!document.getElementById('btn-consult'),
    };
  });
  assert(bb && bb.visible, 'Bottom bar visible');
  assert(bb && bb.back, 'Back button present');
  assert(bb && bb.next, 'Next button present');
  assert(bb && bb.consult, 'Consult button present');

  // ── 12. All 5 Radios in Grid ──
  console.log(`\n${SECTION}12. Radio Grid${RESET}`);
  // Go back to test radio picker
  await page.evaluate(() => { if (typeof showRadioPicker === 'function') showRadioPicker(); });
  await sleep(500);

  const radioCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('.radio-pick');
    return [...cards].map(c => ({
      name: c.querySelector('h4') ? c.querySelector('h4').textContent : 'unknown',
      hasClick: !!c.getAttribute('onclick'),
      cursor: getComputedStyle(c).cursor,
    }));
  });

  assert(radioCards.length === 5, `5 radio cards in grid (got ${radioCards.length})`);
  radioCards.forEach(r => {
    assert(r.hasClick && r.cursor === 'pointer', `"${r.name}" clickable (cursor: ${r.cursor})`);
  });

  // ── 13. JS Errors ──
  console.log(`\n${SECTION}13. JavaScript Errors${RESET}`);
  // Filter out non-critical errors
  const criticalErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('404'));
  if (criticalErrors.length === 0) {
    console.log(`  ${PASS} No JS errors detected`);
    passed++;
  } else {
    criticalErrors.forEach(e => console.log(`  ${FAIL} JS Error: ${e}`));
    failed += criticalErrors.length;
  }

  // ── Summary ──
  console.log(`\n${SECTION}=== SUMMARY ===${RESET}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Warnings: ${warned}`);
  console.log(`  Total: ${passed + failed + warned}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
