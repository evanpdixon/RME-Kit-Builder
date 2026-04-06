/**
 * Kit Builder V2 - Comprehensive Review #3 Audit
 * Tests all 5 category flows on desktop (1280x800) and mobile (375x812)
 * Captures screenshots at each step and issue found.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const DESKTOP = { width: 1280, height: 800, label: 'desktop' };
const MOBILE = { width: 375, height: 812, label: 'mobile', isMobile: true };
const SCREENSHOT_DIR = path.join(__dirname, 'docs', 'review3-screenshots');
const issues = [];
let screenshotIdx = 0;

function slug(t) { return t.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, label, vp) {
  screenshotIdx++;
  const dir = path.join(SCREENSHOT_DIR, vp.label);
  fs.mkdirSync(dir, { recursive: true });
  const f = `${String(screenshotIdx).padStart(3, '0')}-${slug(label)}.png`;
  const fp = path.join(dir, f);
  await page.screenshot({ path: fp, fullPage: false });
  return path.relative(__dirname, fp).replace(/\\/g, '/');
}

async function ssFull(page, label, vp) {
  screenshotIdx++;
  const dir = path.join(SCREENSHOT_DIR, vp.label);
  fs.mkdirSync(dir, { recursive: true });
  const f = `${String(screenshotIdx).padStart(3, '0')}-${slug(label)}-full.png`;
  const fp = path.join(dir, f);
  await page.screenshot({ path: fp, fullPage: true });
  return path.relative(__dirname, fp).replace(/\\/g, '/');
}

function issue(sev, title, where, type, detail, shot) {
  issues.push({ severity: sev, title, where, type, detail, screenshot: shot });
}

async function freshLoad(page) {
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  await client.detach();
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
  await sleep(2000);
}

async function activeSection(page) {
  return page.evaluate(() => {
    for (const s of ['email','interview','radio','mounting','antennas','battery','accessories','programming','review','quantity']) {
      const el = document.getElementById('sec-' + s);
      if (el && el.classList.contains('kb-section--active')) return s;
    }
    return null;
  });
}

async function waitSec(page, name, timeout = 15000) {
  try {
    await page.waitForFunction(n => {
      const el = document.getElementById('sec-' + n);
      return el && el.classList.contains('kb-section--active');
    }, { timeout }, name);
    await sleep(500);
    return true;
  } catch(e) {
    console.log(`    ⚠ Timeout waiting for "${name}"`);
    return false;
  }
}

async function completeSec(page, name) {
  await page.evaluate(n => {
    if (typeof kbsCompleteSection === 'function') kbsCompleteSection(n);
  }, name);
  await sleep(2500);
}

async function priceBarInfo(page) {
  return page.evaluate(() => {
    const bar = document.getElementById('kb-scroll-price-bar') || document.querySelector('.kb-scroll-price-bar, .kbs-price-bar');
    if (!bar) return { found: false };
    const text = bar.textContent;
    const match = text.match(/\$(\d+(?:\.\d{2})?)/);
    const style = window.getComputedStyle(bar);
    const rect = bar.getBoundingClientRect();
    return {
      found: true,
      total: match ? parseFloat(match[1]) : null,
      text: text.trim().slice(0, 200),
      position: style.position,
      display: style.display,
      opacity: style.opacity,
      inViewport: rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
    };
  });
}

// ── Navigation helpers ──

async function skipEmail(page) {
  await page.evaluate(() => kbsSkipEmail());
  await waitSec(page, 'interview');
}

async function directPath(page, catLabels) {
  await page.evaluate(() => kbsStartDirect());
  await sleep(600);
  for (const label of catLabels) {
    await page.evaluate(l => {
      document.querySelectorAll('.kbs-iq-opt').forEach(o => { if (o.textContent.includes(l)) o.click(); });
    }, label);
    await sleep(200);
  }
  await page.evaluate(() => kbsDirectProceed());
  await waitSec(page, 'radio');
}

async function guidedPath(page, budget, reaches, needs) {
  await page.evaluate(() => kbsStartGuided());
  await sleep(600);

  // Q1: Budget
  const budgetLabels = { low: 'Economical', mid: 'Mid-range', high: 'Best of the best' };
  await page.evaluate(l => {
    document.querySelectorAll('.kbs-iq-opt').forEach(o => { if (o.textContent.includes(l)) o.click(); });
  }, budgetLabels[budget]);
  await sleep(200);
  await page.evaluate(() => kbsNextQ());
  await sleep(600);

  // Q2: Reach
  const reachLabels = { nearby: 'Nearby', local: 'Local', far: 'Long distance', listen: 'Just listening' };
  for (const r of reaches) {
    await page.evaluate(l => {
      document.querySelectorAll('.kbs-iq-opt').forEach(o => { if (o.textContent.includes(l)) o.click(); });
    }, reachLabels[r]);
    await sleep(200);
  }
  await page.evaluate(() => kbsNextQ());
  await sleep(600);

  // Q3: Setup type (pre-selected) - just advance
  const preSelected = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.kbs-iq-opt.selected')).map(o => o.textContent.trim().slice(0, 20))
  );
  console.log(`    Pre-selected setup: ${preSelected.join(', ') || 'none'}`);
  await page.evaluate(() => kbsNextQ());
  await sleep(600);

  // Q4: Needs (if shown for handheld)
  const hasNeeds = await page.evaluate(() => {
    const btns = document.querySelectorAll('#kbs-interview-stack button');
    return Array.from(btns).some(b => b.textContent.includes('See Results'));
  });
  if (hasNeeds && needs && needs.length > 0) {
    const needLabels = {
      water: 'Waterproof', gps: 'GPS', bluetooth: 'Bluetooth',
      texting: 'Text messaging', encryption: 'Secure', repeater: 'repeater',
      channels: 'channel capacity', nopreference: 'No specific needs'
    };
    for (const n of needs) {
      await page.evaluate(l => {
        document.querySelectorAll('.kbs-iq-opt').forEach(o => { if (o.textContent.includes(l)) o.click(); });
      }, needLabels[n]);
      await sleep(200);
    }
  }

  // Click See Results or Next
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#kbs-interview-stack button');
    for (const b of btns) {
      if (b.textContent.includes('See Results') || b.textContent.includes('Next')) { b.click(); break; }
    }
  });
  await sleep(2000);
  // The interview section should now complete and radio section activates
  await waitSec(page, 'radio', 20000);
}

async function selectRadio(page, key) {
  await page.evaluate(k => {
    // Try handheld first, then non-handheld
    if (typeof kbsSelectRadio === 'function') {
      // Check if it's a handheld radio
      const hhCard = document.querySelector('[onclick*="kbsSelectRadio(\'' + k + '\')"]');
      if (hhCard) { kbsSelectRadio(k); return; }
    }
    // Non-handheld: find the card and click it
    const cards = document.querySelectorAll('#sec-radio [onclick]');
    for (const c of cards) {
      const oc = c.getAttribute('onclick');
      if (oc && oc.includes("'" + k + "'")) { c.click(); return; }
    }
  }, key);
  await sleep(500);
}

async function selectRadioByText(page, fragment) {
  const result = await page.evaluate(frag => {
    const cards = document.querySelectorAll('#sec-radio [onclick*="Select"]');
    for (const c of cards) {
      if (c.textContent.includes(frag)) {
        c.click();
        return 'clicked';
      }
    }
    // Also try radio-pick class
    const picks = document.querySelectorAll('#sec-radio .radio-pick');
    for (const p of picks) {
      if (p.textContent.includes(frag)) {
        p.click();
        return 'clicked-pick';
      }
    }
    return null;
  }, fragment);
  if (result) return result;
  console.log(`    ⚠ No radio card matching "${fragment}"`);
  return null;
}

async function selectProgChoice(page, choice) {
  // choice: 'standard', 'multi', 'self'
  await page.evaluate(c => {
    const labels = { standard: 'Standard', multi: 'Multi-Location', self: "Program It Myself" };
    const target = labels[c];
    const sec = document.getElementById('sec-programming');
    if (!sec) return;
    const cards = sec.querySelectorAll('[onclick], .kbs-prog-opt, .kb-card, .kbs-iq-opt');
    for (const card of cards) {
      if (card.textContent.includes(target)) { card.click(); return; }
    }
  }, choice);
  await sleep(400);
}

async function checkJargon(page) {
  return page.evaluate(() => {
    const active = document.querySelector('.kb-section--active .kb-section__content');
    if (!active) return [];
    const text = active.textContent;
    const terms = ['GMRS', 'FRS', 'MURS', 'Part 90', 'Part 95', 'TNC', 'NXDN', 'EDACS', 'P25', 'APRS', 'Winlink', 'DMR', 'BNC', 'NMO', 'SO-239', 'PL-259', 'SMA', 'crossband repeat'];
    return terms.filter(t => text.includes(t));
  });
}

async function sectionButtonTexts(page, secName) {
  return page.evaluate(n => {
    const sec = document.getElementById('sec-' + n);
    if (!sec) return [];
    return Array.from(sec.querySelectorAll('button, .kb-btn')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 50));
  }, secName);
}

async function productCardCount(page, secName) {
  return page.evaluate(n => {
    const sec = document.getElementById('sec-' + n);
    if (!sec) return 0;
    const cards = sec.querySelectorAll('.kb-product-card, .kb-card, .radio-pick, [onclick*="select"], [onclick*="toggle"]');
    return cards.length;
  }, secName);
}

async function sectionContentText(page, secName) {
  return page.evaluate(n => {
    const sec = document.getElementById('sec-' + n);
    return sec ? sec.textContent : '';
  }, secName);
}

// ── Flow through product sections (antennas → battery → accessories → programming → review → quantity) ──
async function flowThroughProducts(page, vp, label, opts = {}) {
  const results = {};

  // ANTENNAS
  const antOk = await waitSec(page, 'antennas', 15000);
  if (!antOk) {
    const cur = await activeSection(page);
    console.log(`    Antennas didn't activate, at: ${cur}`);
    results.antennasSkipped = true;
    // Try advancing from wherever we are
    if (cur === 'mounting') { await completeSec(page, 'mounting'); await waitSec(page, 'antennas', 10000); }
  }
  results.antScreenshot = await ss(page, `${label}-antennas`, vp);
  const jargonAnt = await checkJargon(page);
  if (jargonAnt.length > 0) {
    issue('medium', `Jargon in antenna section (${vp.label}): ${jargonAnt.join(', ')}`, 'Antennas', 'ux',
      `Technical terms found: ${jargonAnt.join(', ')}. A first-time user may not understand these.`, results.antScreenshot);
  }

  // Select an upgrade antenna if requested
  if (opts.selectAntenna) {
    await page.evaluate(() => {
      const sec = document.getElementById('sec-antennas');
      if (!sec) return;
      const cards = sec.querySelectorAll('[onclick*="toggle"], [onclick*="select"], .kb-product-card');
      for (const c of cards) {
        if (!c.textContent.includes('Included') && !c.textContent.includes('Factory')) { c.click(); return; }
      }
    });
    await sleep(300);
  }
  await completeSec(page, 'antennas');

  // BATTERY
  const batActive = await activeSection(page);
  if (batActive === 'battery') {
    results.batScreenshot = await ss(page, `${label}-battery`, vp);
    if (opts.selectBattery) {
      await page.evaluate(() => {
        const sec = document.getElementById('sec-battery');
        if (!sec) return;
        const cards = sec.querySelectorAll('[onclick*="toggle"], [onclick*="select"], .kb-product-card');
        for (const c of cards) { if (!c.textContent.includes('Included') && !c.textContent.includes('Factory')) { c.click(); return; } }
      });
      await sleep(300);
    }
    await completeSec(page, 'battery');
  } else {
    console.log(`    Battery skipped (at: ${batActive})`);
    results.batterySkipped = true;
  }

  // ACCESSORIES
  const accOk = await waitSec(page, 'accessories', 10000);
  if (accOk) {
    results.accScreenshot = await ss(page, `${label}-accessories`, vp);
    const accJargon = await checkJargon(page);
    if (accJargon.length > 0) {
      issue('low', `Jargon in accessories (${vp.label}): ${accJargon.join(', ')}`, 'Accessories', 'ux',
        `Terms: ${accJargon.join(', ')}`, results.accScreenshot);
    }
    if (opts.selectAccessory) {
      await page.evaluate(() => {
        const sec = document.getElementById('sec-accessories');
        if (!sec) return;
        const cards = sec.querySelectorAll('[onclick*="toggle"], [onclick*="select"], .kb-product-card');
        if (cards[0]) cards[0].click();
      });
      await sleep(300);
    }
    await completeSec(page, 'accessories');
  } else {
    results.accessoriesSkipped = true;
    console.log(`    Accessories didn't activate`);
  }

  // PROGRAMMING
  const progOk = await waitSec(page, 'programming', 10000);
  if (progOk) {
    results.progScreenshot = await ss(page, `${label}-programming`, vp);
    const progText = await sectionContentText(page, 'programming');
    if (progText.includes('license') && !progText.includes('itinerant license')) {
      issue('medium', `Programming mentions "license" (${vp.label})`, 'Programming', 'ux',
        'The word "license" may confuse unlicensed beginners.', results.progScreenshot);
    }
    const progJargon = await checkJargon(page);
    if (progJargon.length > 0 && !progJargon.every(t => ['DMR'].includes(t))) {
      issue('low', `Jargon in programming (${vp.label}): ${progJargon.join(', ')}`, 'Programming', 'ux',
        `Terms: ${progJargon.join(', ')}`, results.progScreenshot);
    }
    await selectProgChoice(page, opts.programming || 'standard');
    await sleep(300);
    await completeSec(page, 'programming');
  }

  // REVIEW
  const revOk = await waitSec(page, 'review', 10000);
  if (revOk) {
    results.revScreenshot = await ss(page, `${label}-review`, vp);
    // Check for dual primary buttons
    const btnTexts = await sectionButtonTexts(page, 'review');
    const primaryBtns = btnTexts.filter(t => t.includes('Cart') || t.includes('Checkout') || t.includes('Continue'));
    if (primaryBtns.length > 1) {
      issue('high', `Dual action buttons in review (${vp.label})`, 'Review', 'ux',
        `Found multiple action buttons: ${primaryBtns.join(', ')}. User won't know which to click.`, results.revScreenshot);
    }
    await completeSec(page, 'review');
  }

  // QUANTITY
  const qtyOk = await waitSec(page, 'quantity', 10000);
  if (qtyOk) {
    results.qtyScreenshot = await ss(page, `${label}-quantity`, vp);
    const pb = await priceBarInfo(page);
    results.finalPrice = pb.total;
    results.priceBarPosition = pb.position;
    results.priceBarInViewport = pb.inViewport;
    console.log(`    Final price: $${pb.total}, bar position: ${pb.position}, in viewport: ${pb.inViewport}`);

    if (pb.found && !pb.inViewport) {
      issue('medium', `Price bar not visible at quantity (${vp.label})`, 'Price bar', 'bug',
        'Price bar is not visible in the viewport.', results.qtyScreenshot);
    }
    if (pb.found && pb.position !== 'fixed' && pb.position !== 'sticky') {
      issue('medium', `Price bar position is "${pb.position}" (${vp.label})`, 'Price bar', 'bug',
        'Expected fixed or sticky positioning.', results.qtyScreenshot);
    }
  }

  return results;
}

// ══════════════════════════════════════════════════
// CATEGORY TESTS
// ═════��═══════════════════���════════════════════════

async function testHandheldDirect(page, vp, radioKey, radioLabel) {
  const label = `D-HH-${radioKey}`;
  console.log(`  [${vp.label}] Direct Handheld: ${radioLabel}`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Handheld']);

  const s1 = await ss(page, `${label}-radio-grid`, vp);

  // Count radio cards
  const count = await page.evaluate(() =>
    document.querySelectorAll('#sec-radio .radio-pick').length
  );
  console.log(`    Radio cards: ${count}`);
  if (count !== 5) {
    issue('high', `Handheld grid shows ${count} radios, expected 5 (${vp.label})`, 'Radio grid', 'bug',
      `Expected 5 handheld radios, got ${count}.`, s1);
  }

  // Check radio card images
  const missingImgs = await page.evaluate(() => {
    const cards = document.querySelectorAll('#sec-radio [onclick*="kbsSelectRadio"]');
    return Array.from(cards).filter(c => {
      const img = c.querySelector('img');
      return !img || !img.src || img.src.includes('placeholder');
    }).map(c => c.textContent.trim().slice(0, 20));
  });
  if (missingImgs.length > 0) {
    issue('low', `Missing radio images: ${missingImgs.join(', ')}`, 'Radio grid', 'ux',
      'Some radio cards have missing or placeholder images.', s1);
  }

  await selectRadio(page, radioKey);
  const s2 = await ss(page, `${label}-selected`, vp);

  // For handheld, radio section auto-completes or we need to advance
  await completeSec(page, 'radio');

  // Mounting should be skipped for handheld
  await sleep(1000);
  const afterRadio = await activeSection(page);
  if (afterRadio === 'mounting') {
    issue('high', `Mounting shown for handheld (${vp.label})`, 'Section flow', 'bug',
      'Handheld kits should skip the mounting section.', await ss(page, `${label}-mount-bad`, vp));
    await completeSec(page, 'mounting');
  }

  const res = await flowThroughProducts(page, vp, label, { selectAntenna: true, selectAccessory: true });
  console.log(`    ✓ ${radioLabel} done`);
  return res;
}

async function testGuidedHandheld(page, vp, budget, reaches, needs) {
  const label = `G-${budget}-${reaches.join('+')}`;
  console.log(`  [${vp.label}] Guided: ${budget}/${reaches.join('+')}`);
  await freshLoad(page);
  await skipEmail(page);
  await guidedPath(page, budget, reaches, needs);

  const s1 = await ss(page, `${label}-recommendation`, vp);

  // Check recommendation result
  const recCount = await page.evaluate(() =>
    document.querySelectorAll('#sec-radio .radio-pick').length
  );
  console.log(`    Recommendations: ${recCount}`);
  if (recCount === 0) {
    issue('high', `No recommendations for ${budget}/${reaches.join('+')} (${vp.label})`, 'Recommendation', 'bug',
      'Zero radio cards shown.', s1);
    return;
  }

  // Check feature text for jargon
  const jargon = await checkJargon(page);
  if (jargon.length > 0) {
    issue('medium', `Jargon in recommendations (${vp.label}): ${jargon.join(', ')}`, 'Radio cards', 'ux',
      `Feature lists contain: ${jargon.join(', ')}. First-time users won't understand these.`, s1);
  }

  // Select first recommendation
  await page.evaluate(() => {
    const card = document.querySelector('#sec-radio .radio-pick');
    if (card) card.click();
  });
  await completeSec(page, 'radio');

  const res = await flowThroughProducts(page, vp, label, { programming: needs.length === 0 ? 'self' : 'standard' });
  console.log(`    ✓ Guided ${budget}/${reaches.join('+')} done`);
  return res;
}

async function testVehicleDirect(page, vp) {
  const label = 'D-Vehicle';
  console.log(`  [${vp.label}] Direct Vehicle`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Vehicle / Mobile']);

  const s1 = await ss(page, `${label}-radio-grid`, vp);
  const count = await page.evaluate(() =>
    document.querySelectorAll('#sec-radio .radio-pick').length
  );
  console.log(`    Vehicle radios: ${count}`);
  if (count < 2) {
    issue('high', `Vehicle grid shows ${count} radios, expected 2 (${vp.label})`, 'Radio grid', 'bug', '', s1);
  }

  await selectRadioByText(page, 'UV-50PRO');
  await completeSec(page, 'radio');

  // Mounting SHOULD appear for vehicle
  const mountOk = await waitSec(page, 'mounting', 10000);
  if (!mountOk) {
    issue('high', `Mounting skipped for vehicle (${vp.label})`, 'Section flow', 'bug',
      'Vehicle kits should show the mounting section.', await ss(page, `${label}-no-mount`, vp));
  } else {
    const ms = await ss(page, `${label}-mounting`, vp);
    // Check for vehicle-specific mount options
    const mountText = await sectionContentText(page, 'mounting');
    console.log(`    Mounting text: "${mountText.slice(0, 60)}..."`);

    // Check jargon in mounting
    const mj = await checkJargon(page);
    if (mj.length > 0) {
      issue('medium', `Jargon in mounting (${vp.label}): ${mj.join(', ')}`, 'Mounting', 'ux',
        `Terms: ${mj.join(', ')}`, ms);
    }
    await completeSec(page, 'mounting');
  }

  const res = await flowThroughProducts(page, vp, label, {
    selectAntenna: true, selectAccessory: true, programming: 'multi'
  });
  console.log(`    ✓ Vehicle done`);
  return res;
}

async function testBaseStationDirect(page, vp) {
  const label = 'D-Base';
  console.log(`  [${vp.label}] Direct Base Station`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Base Station']);

  const s1 = await ss(page, `${label}-radio-grid`, vp);
  const count = await page.evaluate(() =>
    document.querySelectorAll('#sec-radio .radio-pick').length
  );
  console.log(`    Base radios: ${count}`);

  await selectRadioByText(page, 'D578');
  await completeSec(page, 'radio');

  // Base should also show mounting
  const mountOk = await waitSec(page, 'mounting', 10000);
  if (mountOk) {
    await ss(page, `${label}-mounting`, vp);
    await completeSec(page, 'mounting');
  } else {
    console.log(`    Mounting skipped for base`);
  }

  const res = await flowThroughProducts(page, vp, label, {
    selectAntenna: true, programming: 'standard'
  });

  // Check that antenna section shows base-specific options (quick vs permanent)
  console.log(`    ✓ Base Station done`);
  return res;
}

async function testHFDirect(page, vp) {
  const label = 'D-HF';
  console.log(`  [${vp.label}] Direct HF`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['HF (Long-Distance)']);

  const s1 = await ss(page, `${label}-radio-grid`, vp);
  const count = await page.evaluate(() =>
    document.querySelectorAll('#sec-radio .radio-pick').length
  );
  console.log(`    HF radios: ${count}`);
  if (count < 2) {
    issue('high', `HF grid shows ${count} radios (${vp.label})`, 'Radio grid', 'bug', 'Expected 2 HF radios.', s1);
  }

  await selectRadioByText(page, 'G90');
  await completeSec(page, 'radio');

  // HF should skip mounting
  await sleep(1500);
  const after = await activeSection(page);
  if (after === 'mounting') {
    issue('medium', `Mounting shown for HF (${vp.label})`, 'Section flow', 'bug',
      'HF radios should skip mounting.', await ss(page, `${label}-mount-bad`, vp));
    await completeSec(page, 'mounting');
  }

  const res = await flowThroughProducts(page, vp, label, { programming: 'standard' });

  // Check HF-specific content
  console.log(`    ✓ HF done`);
  return res;
}

async function testScannerDirect(page, vp) {
  const label = 'D-Scanner';
  console.log(`  [${vp.label}] Direct Scanner`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Scanner / SDR']);

  const s1 = await ss(page, `${label}-radio-grid`, vp);
  const count = await page.evaluate(() =>
    document.querySelectorAll('#sec-radio .radio-pick').length
  );
  console.log(`    Scanner cards: ${count}`);
  if (count < 3) {
    issue('high', `Scanner grid shows ${count} cards (${vp.label})`, 'Radio grid', 'bug', 'Expected 4 scanners.', s1);
  }

  // Select SDR kit (cheapest)
  await selectRadioByText(page, 'SDR');
  await completeSec(page, 'radio');

  // Scanner should skip mounting
  await sleep(1500);
  const after = await activeSection(page);
  if (after === 'mounting') {
    issue('medium', `Mounting shown for scanner (${vp.label})`, 'Section flow', 'bug',
      'Scanners should skip mounting.', await ss(page, `${label}-mount-bad`, vp));
    await completeSec(page, 'mounting');
  }

  const res = await flowThroughProducts(page, vp, label, { programming: 'standard' });
  console.log(`    ✓ Scanner done`);
  return res;
}

// ══════════════════════════════════════════════════
// EDGE CASE TESTS
// ══════════════════════════════════════════���═══════

async function testSkipAll(page, vp) {
  const label = 'E-SkipAll';
  console.log(`  [${vp.label}] Edge: Skip all optional steps`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Handheld']);

  await selectRadio(page, 'uv5r-mini');
  await completeSec(page, 'radio');

  // Skip everything without selecting upgrades
  const res = await flowThroughProducts(page, vp, label, { programming: 'self' });

  // Minimal price should be base radio price ($39 for UV-5R Mini)
  if (res.finalPrice && res.finalPrice < 30) {
    issue('high', 'Minimal kit price too low', 'Pricing', 'bug',
      `$${res.finalPrice} is below the UV-5R Mini base price of $39.`, res.qtyScreenshot);
  }
  console.log(`    ✓ Skip all done`);
}

async function testReEdit(page, vp) {
  const label = 'E-ReEdit';
  console.log(`  [${vp.label}] Edge: Re-edit completed section`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Handheld']);

  await selectRadio(page, 'uv5r');
  await completeSec(page, 'radio');
  await waitSec(page, 'antennas');
  await completeSec(page, 'antennas');
  await waitSec(page, 'battery');

  const s1 = await ss(page, `${label}-at-battery`, vp);

  // Click radio header to re-edit
  await page.evaluate(() => kbsEditSection('radio'));
  await sleep(1500);

  const active = await activeSection(page);
  console.log(`    After re-edit radio: ${active}`);
  const s2 = await ss(page, `${label}-re-edit-radio`, vp);

  if (active !== 'radio' && active !== 'interview') {
    issue('medium', `Re-edit didn't reactivate radio section (${vp.label})`, 'Section editing', 'bug',
      `Expected radio, got "${active}".`, s2);
  }

  // Check downstream sections are locked
  const locked = await page.evaluate(() => {
    return ['antennas','battery','accessories','programming','review','quantity'].every(s => {
      const el = document.getElementById('sec-' + s);
      return !el || el.classList.contains('kb-section--locked');
    });
  });
  if (!locked) {
    issue('medium', `Downstream sections not locked after re-edit (${vp.label})`, 'Section state', 'bug',
      'Editing an earlier section should lock all downstream sections.', s2);
  }

  // Change to different radio
  await selectRadio(page, 'uv-pro');
  await completeSec(page, 'radio');
  await waitSec(page, 'antennas');
  const s3 = await ss(page, `${label}-after-change`, vp);

  // Price should reflect UV-PRO ($159)
  const pb = await priceBarInfo(page);
  console.log(`    Price after change: $${pb.total}`);
  console.log(`    ✓ Re-edit done`);
}

async function testMultiCategory(page, vp) {
  const label = 'E-MultiCat';
  console.log(`  [${vp.label}] Edge: Multi-category flow`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Handheld', 'Vehicle / Mobile']);

  // Quick through handheld
  await selectRadio(page, 'uv5r');
  await completeSec(page, 'radio');
  await flowThroughProducts(page, vp, `${label}-hh`, { programming: 'standard' });

  // At quantity - add to cart
  const added = await page.evaluate(() => {
    const btn = document.getElementById('kbs-cart-btn');
    if (btn && !btn.disabled) { btn.click(); return true; }
    return false;
  });
  await sleep(4000);
  const s1 = await ss(page, `${label}-after-cart`, vp);

  // Check next category prompt
  const hasPrompt = await page.evaluate(() => {
    const sec = document.getElementById('sec-quantity');
    return sec ? (sec.textContent.includes('Build') || sec.textContent.includes('Vehicle')) : false;
  });
  console.log(`    Next category prompt: ${hasPrompt}`);
  if (!hasPrompt) {
    issue('medium', `No next-category prompt (${vp.label})`, 'Multi-category', 'ux',
      'After adding first kit, should prompt for next category.', s1);
  }

  // Check discount mention
  const discountMentioned = await page.evaluate(() => {
    const sec = document.getElementById('sec-quantity');
    return sec ? (sec.textContent.includes('discount') || sec.textContent.includes('5%') || sec.textContent.includes('off')) : false;
  });
  console.log(`    Discount mentioned: ${discountMentioned}`);
  if (!discountMentioned) {
    issue('low', `Cross-category discount not mentioned (${vp.label})`, 'Multi-category', 'ux',
      'The 5% cross-category discount should be highlighted to encourage building the next kit.', s1);
  }

  console.log(`    ✓ Multi-category done`);
}

async function testBackNav(page, vp) {
  const label = 'E-BackNav';
  console.log(`  [${vp.label}] Edge: Back navigation`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Handheld']);

  await selectRadio(page, 'uv5r');
  await completeSec(page, 'radio');
  await waitSec(page, 'antennas');
  await completeSec(page, 'antennas');
  await waitSec(page, 'battery');

  // Use kbsGoBack
  await page.evaluate(() => kbsGoBack('battery'));
  await sleep(1500);

  const after = await activeSection(page);
  console.log(`    After back from battery: ${after}`);
  const s1 = await ss(page, `${label}-after-back`, vp);

  if (after !== 'antennas') {
    issue('medium', `Back from battery went to "${after}" (${vp.label})`, 'Back nav', 'bug',
      'Expected to go back to antennas section.', s1);
  }
  console.log(`    ✓ Back nav done`);
}

async function testStickyAndLayout(page, vp) {
  const label = 'E-Sticky';
  console.log(`  [${vp.label}] Edge: Sticky elements & layout`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Handheld']);

  await selectRadio(page, 'uv-pro');
  await completeSec(page, 'radio');
  await waitSec(page, 'antennas');

  // Scroll to middle
  await page.evaluate(() => {
    const sec = document.getElementById('sec-antennas');
    if (sec) sec.scrollIntoView({ block: 'center' });
  });
  await sleep(500);

  const s1 = await ss(page, `${label}-mid-scroll`, vp);
  const pb = await priceBarInfo(page);
  console.log(`    Price bar: position=${pb.position}, visible=${pb.inViewport}`);

  // Check for content overlap
  const overlap = await page.evaluate(() => {
    const sec = document.getElementById('sec-antennas');
    if (!sec) return false;
    const cards = sec.querySelectorAll('.kb-product-card, .kb-card, [onclick]');
    const last = cards[cards.length - 1];
    if (!last) return false;
    const rect = last.getBoundingClientRect();
    const bar = document.querySelector('#kbs-price-bar, .kbs-price-bar');
    if (bar) {
      const barRect = bar.getBoundingClientRect();
      if (rect.bottom > barRect.top + 5) return true;
    }
    return false;
  });
  if (overlap) {
    issue('medium', `Content overlaps with price bar (${vp.label})`, 'Layout', 'ux',
      'Product cards extend behind the sticky price bar.', s1);
  }

  // Check empty space below on mobile
  if (vp.isMobile) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(300);
    const s2 = await ss(page, `${label}-bottom`, vp);
    const gap = await page.evaluate(() => {
      const lastVisible = document.querySelector('.kb-section--active');
      if (!lastVisible) return 0;
      const bottom = lastVisible.getBoundingClientRect().bottom + window.scrollY;
      return document.body.scrollHeight - bottom;
    });
    if (gap > 500) {
      issue('low', `Large empty space below content (${gap}px) (mobile)`, 'Layout', 'ux',
        'Hidden locked sections leave empty space before footer.', s2);
    }
  }

  console.log(`    ✓ Sticky & layout done`);
}

async function testSecondScannerRadio(page, vp) {
  const label = 'D-Scanner2';
  console.log(`  [${vp.label}] Direct Scanner (SDS200)`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Scanner / SDR']);

  await selectRadioByText(page, 'SDS200');
  await completeSec(page, 'radio');
  await sleep(1500);

  const res = await flowThroughProducts(page, vp, label, { programming: 'standard' });
  console.log(`    ✓ Scanner SDS200 done`);
}

async function testHFSecondRadio(page, vp) {
  const label = 'D-HF2';
  console.log(`  [${vp.label}] Direct HF (FT-891)`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['HF (Long-Distance)']);

  await selectRadioByText(page, 'FT-891');
  await completeSec(page, 'radio');
  await sleep(1500);

  const res = await flowThroughProducts(page, vp, label, { programming: 'standard' });
  console.log(`    ✓ HF FT-891 done`);
}

async function testVehicleD578(page, vp) {
  const label = 'D-Vehicle2';
  console.log(`  [${vp.label}] Direct Vehicle (D578)`);
  await freshLoad(page);
  await skipEmail(page);
  await directPath(page, ['Vehicle / Mobile']);

  await selectRadioByText(page, 'D578');
  await completeSec(page, 'radio');
  const mountOk = await waitSec(page, 'mounting', 10000);
  if (mountOk) await completeSec(page, 'mounting');

  const res = await flowThroughProducts(page, vp, label, { programming: 'standard' });
  console.log(`    ✓ Vehicle D578 done`);
}

// ══════════════════════════════════════════════════
// MAIN
// ═══��══════════════════════���═══════════════════════

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('Kit Builder V2 - Comprehensive Review #3');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════\n');

  if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  for (const vp of [DESKTOP, MOBILE]) {
    console.log(`\n${'━'.repeat(50)}`);
    console.log(`VIEWPORT: ${vp.label} (${vp.width}x${vp.height})`);
    console.log(`${'━'.repeat(50)}\n`);

    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile || false });
    if (vp.isMobile) {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    }

    const tests = [
      // All 5 handheld radios
      () => testHandheldDirect(page, vp, 'uv5r', 'UV-5R'),
      () => testHandheldDirect(page, vp, 'uv5r-mini', 'UV-5R Mini'),
      () => testHandheldDirect(page, vp, 'uv-pro', 'UV-PRO'),
      () => testHandheldDirect(page, vp, 'dmr-6x2', 'DMR 6X2 PRO'),
      () => testHandheldDirect(page, vp, 'da-7x2', 'DA-7X2'),
      // Guided combos
      () => testGuidedHandheld(page, vp, 'low', ['nearby'], ['nopreference']),
      () => testGuidedHandheld(page, vp, 'mid', ['local'], ['water', 'gps']),
      () => testGuidedHandheld(page, vp, 'high', ['far'], ['encryption', 'repeater']),
      () => testGuidedHandheld(page, vp, 'mid', ['nearby', 'local'], ['bluetooth']),
      () => testGuidedHandheld(page, vp, 'low', ['listen'], []),
      // Other categories
      () => testVehicleDirect(page, vp),
      () => testVehicleD578(page, vp),
      () => testBaseStationDirect(page, vp),
      () => testHFDirect(page, vp),
      () => testHFSecondRadio(page, vp),
      () => testScannerDirect(page, vp),
      () => testSecondScannerRadio(page, vp),
      // Edge cases
      () => testSkipAll(page, vp),
      () => testReEdit(page, vp),
      () => testMultiCategory(page, vp),
      () => testBackNav(page, vp),
      () => testStickyAndLayout(page, vp),
    ];

    for (const test of tests) {
      try { await test(); }
      catch(e) {
        console.log(`    ✗ CRASHED: ${e.message.slice(0, 120)}`);
        issue('high', `Test crash: ${e.message.slice(0, 80)}`, 'Test', 'crash', e.stack?.slice(0, 300) || e.message, null);
        // Take a recovery screenshot
        try { await ss(page, 'crash-recovery', vp); } catch(e2) {}
      }
    }

    await page.close();
  }

  await browser.close();

  // ── Deduplicate and report ──
  const seen = new Set();
  const deduped = issues.filter(i => {
    const k = i.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const sevOrder = { high: 0, medium: 1, low: 2 };
  deduped.sort((a, b) => (sevOrder[a.severity] || 3) - (sevOrder[b.severity] || 3));

  fs.writeFileSync(path.join(__dirname, 'review3-issues.json'), JSON.stringify(deduped, null, 2));

  console.log('\n═══════════════════════════════════════');
  console.log(`RESULTS: ${deduped.length} unique issues`);
  console.log('════════���═════════════════════════���════\n');

  for (const i of deduped) {
    console.log(`  [${i.severity.toUpperCase()}] ${i.title}`);
    console.log(`    Where: ${i.where} | Type: ${i.type}`);
    if (i.detail) console.log(`    ${i.detail.slice(0, 150)}`);
    if (i.screenshot) console.log(`    📸 ${i.screenshot}`);
    console.log();
  }

  console.log(`Total: ${deduped.length} unique issues (${issues.length} including duplicates across viewports)`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
