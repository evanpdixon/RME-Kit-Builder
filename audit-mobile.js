const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'audit-cards-mobile');
const URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const VIEWPORT = { width: 375, height: 812, deviceScaleFactor: 2 };
const delay = ms => new Promise(r => setTimeout(r, ms));

async function fullshot(page, name) {
  await delay(500);
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  [full] ${name}.png`);
}

async function viewshot(page, name) {
  await delay(300);
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath });
  console.log(`  [view] ${name}.png`);
}

// Screenshot a section by scrolling through it in viewport chunks
async function sectionShots(page, sectionId, prefix) {
  await delay(500);
  const info = await page.evaluate(id => {
    const el = document.getElementById(id);
    if (!el) return null;
    return { top: el.getBoundingClientRect().top + window.scrollY, height: el.scrollHeight, display: getComputedStyle(el).display };
  }, sectionId);

  if (!info || info.display === 'none' || info.height < 10) {
    console.log(`  [skip] ${prefix} - section ${sectionId} not visible (${info ? info.display + ' h=' + info.height : 'null'})`);
    return;
  }

  const chunks = Math.ceil(info.height / 750);
  if (chunks <= 1) {
    await page.evaluate(top => window.scrollTo(0, top), info.top);
    await delay(300);
    await viewshot(page, prefix);
  } else {
    for (let i = 0; i < Math.min(chunks, 6); i++) {
      await page.evaluate((top, offset) => window.scrollTo(0, top + offset), info.top, i * 700);
      await delay(300);
      await viewshot(page, `${prefix}-${i + 1}of${Math.min(chunks, 6)}`);
    }
  }
}

// Analyze all visible opt-cards and buttons for issues
async function analyzeSection(page, label) {
  return await page.evaluate((label) => {
    const issues = [];

    // 1. opt-card analysis
    const optCards = Array.from(document.querySelectorAll('.opt-card')).filter(c => {
      const r = c.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    // Check individual cards
    optCards.forEach((card, i) => {
      const name = (card.querySelector('h4, h3, .opt-title')?.textContent?.trim() || `card-${i}`).substring(0, 50);
      const rect = card.getBoundingClientRect();

      // Horizontal overflow
      if (card.scrollWidth > card.clientWidth + 2) {
        issues.push(`OVERFLOW [${label}] "${name}": horizontal (${card.scrollWidth} > ${card.clientWidth})`);
      }

      // Check text-checkbox overlap by examining all text elements vs checkbox/check areas
      const allText = card.querySelectorAll('h4, h3, p, .opt-desc, .opt-title, label, span');
      const checkEls = card.querySelectorAll('input[type="checkbox"], .opt-check, .opt-card-check, svg.check-icon');
      checkEls.forEach(chk => {
        const cr = chk.getBoundingClientRect();
        if (cr.width === 0) return;
        allText.forEach(txt => {
          const tr = txt.getBoundingClientRect();
          if (tr.width === 0) return;
          const hOverlap = Math.min(cr.right, tr.right) - Math.max(cr.left, tr.left);
          const vOverlap = Math.min(cr.bottom, tr.bottom) - Math.max(cr.top, tr.top);
          if (hOverlap > 3 && vOverlap > 3) {
            issues.push(`TEXT-CHECK OVERLAP [${label}] "${name}": text "${txt.textContent.trim().substring(0,30)}" overlaps check by ${Math.round(hOverlap)}x${Math.round(vOverlap)}px`);
          }
        });
      });

      // Price overflow
      const price = card.querySelector('.opt-price, [class*="price"]');
      if (price) {
        const pr = price.getBoundingClientRect();
        if (pr.right > rect.right + 2) {
          issues.push(`PRICE OVERFLOW [${label}] "${name}": price extends ${Math.round(pr.right - rect.right)}px past card`);
        }
      }
    });

    // 2. Card height consistency within options-grids
    const grids = document.querySelectorAll('.options-grid');
    grids.forEach((grid, gi) => {
      const cards = Array.from(grid.querySelectorAll('.opt-card')).filter(c => c.getBoundingClientRect().height > 0);
      if (cards.length < 2) return;

      // Group by row (same Y position)
      const rows = {};
      cards.forEach(c => {
        const r = c.getBoundingClientRect();
        const rowKey = Math.round(r.top / 10) * 10; // group by ~10px bands
        if (!rows[rowKey]) rows[rowKey] = [];
        rows[rowKey].push({ name: c.querySelector('h4,h3')?.textContent?.trim()?.substring(0,30) || '?', height: Math.round(r.height) });
      });

      // On mobile 375px, cards likely stack single-column, but check anyway
      const allHeights = cards.map(c => Math.round(c.getBoundingClientRect().height));
      const unique = [...new Set(allHeights)];
      if (unique.length > 1 && cards.length > 1) {
        const min = Math.min(...unique);
        const max = Math.max(...unique);
        if (max - min > 20) {
          issues.push(`CARD HEIGHT VARIANCE [${label}] grid-${gi}: ${unique.length} heights, range ${min}-${max}px across ${cards.length} cards`);
        }
      }
    });

    // 3. Button height consistency in section actions
    const activeSections = document.querySelectorAll('.kb-section--active');
    activeSections.forEach(sec => {
      const actions = sec.querySelector('.kb-section__actions');
      if (!actions) return;
      const btns = Array.from(actions.querySelectorAll('.kb-btn')).filter(b => b.getBoundingClientRect().height > 0);
      const heights = btns.map(b => ({ text: b.textContent.trim().substring(0,20), h: Math.round(b.getBoundingClientRect().height) }));
      const uniqueH = [...new Set(heights.map(h => h.h))];
      if (uniqueH.length > 1) {
        issues.push(`BTN HEIGHT MISMATCH [${label}]: ${heights.map(h => `"${h.text}"=${h.h}px`).join(', ')}`);
      }
      // Touch target check
      heights.forEach(h => {
        if (h.h < 44) {
          issues.push(`TOUCH TARGET [${label}] button "${h.text}": ${h.h}px < 44px minimum`);
        }
      });
    });

    // 4. radio-pick card analysis
    const radioPicks = Array.from(document.querySelectorAll('.radio-pick')).filter(c => c.getBoundingClientRect().height > 0);
    if (radioPicks.length > 0) {
      const rHeights = radioPicks.map(c => Math.round(c.getBoundingClientRect().height));
      const rUnique = [...new Set(rHeights)];
      if (rUnique.length > 1 && Math.max(...rUnique) - Math.min(...rUnique) > 15) {
        issues.push(`RADIO CARD HEIGHT VARIANCE [${label}]: ${rUnique.length} heights, range ${Math.min(...rUnique)}-${Math.max(...rUnique)}px`);
      }

      radioPicks.forEach((rp, i) => {
        if (rp.scrollWidth > rp.clientWidth + 2) {
          issues.push(`RADIO CARD OVERFLOW [${label}] radio-pick ${i}: horizontal overflow`);
        }
      });
    }

    // 5. kbs-iq-opt (interview option) card analysis
    const iqOpts = Array.from(document.querySelectorAll('.kbs-iq-opt')).filter(c => c.getBoundingClientRect().height > 0);
    if (iqOpts.length > 0) {
      const iqHeights = iqOpts.map(c => Math.round(c.getBoundingClientRect().height));
      const iqUnique = [...new Set(iqHeights)];
      if (iqUnique.length > 1 && Math.max(...iqUnique) - Math.min(...iqUnique) > 10) {
        issues.push(`INTERVIEW OPTION HEIGHT VARIANCE [${label}]: ${iqUnique.join(', ')}px`);
      }
    }

    const summary = `Analyzed: ${optCards.length} opt-cards, ${radioPicks.length} radio-picks, ${iqOpts.length} iq-opts`;
    return { issues, summary };
  }, label);
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allIssues = [];

  // ===== FLOW 1: HANDHELD UV-5R =====
  console.log('\n=== FLOW 1: HANDHELD (UV-5R) ===');
  {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    await fullshot(page, '01-landing');

    // Skip email
    await page.evaluate(() => kbsSkipEmail());
    await delay(1500);
    await sectionShots(page, 'sec-interview', '02-interview');

    // Start direct pick
    await page.evaluate(() => kbsStartDirect());
    await delay(1000);
    await sectionShots(page, 'sec-interview', '03-direct-categories');

    let result = await analyzeSection(page, 'Direct-Categories');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    // Select Handheld category and proceed
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq-opt');
      for (const opt of opts) {
        if (opt.textContent.includes('Handheld')) {
          kbsDirectToggleCat(opt, 'handheld');
          break;
        }
      }
    });
    await delay(500);
    await page.evaluate(() => kbsDirectProceed());
    await delay(2000);

    // Radio selection section
    await sectionShots(page, 'sec-radio', '04-handheld-radios');
    result = await analyzeSection(page, 'Handheld-Radios');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    // Select UV-5R
    await page.evaluate(() => kbsSelectRadio('uv5r'));
    await delay(2500);

    // Antennas (should now be active)
    await sectionShots(page, 'sec-antennas', '05-handheld-antennas');
    result = await analyzeSection(page, 'Handheld-Antennas');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    // Continue
    await page.evaluate(() => kbsCompleteSection('antennas'));
    await delay(2000);
    await sectionShots(page, 'sec-battery', '06-handheld-battery');
    result = await analyzeSection(page, 'Handheld-Battery');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('battery'));
    await delay(2000);
    await sectionShots(page, 'sec-accessories', '07-handheld-accessories');
    result = await analyzeSection(page, 'Handheld-Accessories');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('accessories'));
    await delay(2000);
    await sectionShots(page, 'sec-programming', '08-handheld-programming');
    result = await analyzeSection(page, 'Handheld-Programming');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('programming'));
    await delay(2000);
    await sectionShots(page, 'sec-review', '09-handheld-review');
    result = await analyzeSection(page, 'Handheld-Review');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await fullshot(page, '10-handheld-full');
    await page.close();
  }

  // ===== FLOW 2: VEHICLE UV-50PRO =====
  console.log('\n=== FLOW 2: VEHICLE (UV-50PRO) ===');
  {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    await page.evaluate(() => kbsSkipEmail());
    await delay(1500);
    await page.evaluate(() => kbsStartDirect());
    await delay(1000);

    // Select Vehicle/Mobile
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq-opt');
      for (const opt of opts) {
        if (opt.textContent.includes('Vehicle')) {
          kbsDirectToggleCat(opt, 'vehicle');
          break;
        }
      }
    });
    await delay(500);
    await page.evaluate(() => kbsDirectProceed());
    await delay(2000);

    await sectionShots(page, 'sec-radio', '11-vehicle-radios');
    let result = await analyzeSection(page, 'Vehicle-Radios');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    // Select first available vehicle radio (UV-50PRO or similar)
    await page.evaluate(() => {
      // Try UV-50X2 first, then UV-50PRO
      if (typeof kbsSelectNonHandheld === 'function') {
        try { kbsSelectNonHandheld('uv50x2', 'mobile'); } catch(e) {
          try { kbsSelectNonHandheld('uv50pro', 'mobile'); } catch(e2) {}
        }
      }
    });
    await delay(2500);

    // Mounting
    await sectionShots(page, 'sec-mounting', '12-vehicle-mounting');
    result = await analyzeSection(page, 'Vehicle-Mounting');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('mounting'));
    await delay(2000);

    // Antennas
    await sectionShots(page, 'sec-antennas', '13-vehicle-antennas');
    result = await analyzeSection(page, 'Vehicle-Antennas');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('antennas'));
    await delay(2000);

    // Battery/Power
    await sectionShots(page, 'sec-battery', '14-vehicle-battery');
    result = await analyzeSection(page, 'Vehicle-Battery');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('battery'));
    await delay(2000);

    // Accessories
    await sectionShots(page, 'sec-accessories', '15-vehicle-accessories');
    result = await analyzeSection(page, 'Vehicle-Accessories');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('accessories'));
    await delay(2000);

    // Programming
    await sectionShots(page, 'sec-programming', '16-vehicle-programming');
    result = await analyzeSection(page, 'Vehicle-Programming');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('programming'));
    await delay(2000);

    // Review
    await sectionShots(page, 'sec-review', '17-vehicle-review');
    result = await analyzeSection(page, 'Vehicle-Review');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await fullshot(page, '18-vehicle-full');
    await page.close();
  }

  // ===== FLOW 3: SCANNER SDS200 =====
  console.log('\n=== FLOW 3: SCANNER (SDS200) ===');
  {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    await page.evaluate(() => kbsSkipEmail());
    await delay(1500);
    await page.evaluate(() => kbsStartDirect());
    await delay(1000);

    // Select Scanner
    await page.evaluate(() => {
      const opts = document.querySelectorAll('.kbs-iq-opt');
      for (const opt of opts) {
        if (opt.textContent.includes('Scanner')) {
          kbsDirectToggleCat(opt, 'scanner');
          break;
        }
      }
    });
    await delay(500);
    await page.evaluate(() => kbsDirectProceed());
    await delay(2000);

    await sectionShots(page, 'sec-radio', '19-scanner-radios');
    let result = await analyzeSection(page, 'Scanner-Radios');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    // Select SDS200
    await page.evaluate(() => {
      if (typeof kbsSelectNonHandheld === 'function') {
        kbsSelectNonHandheld('sds200', 'scanner');
      }
    });
    await delay(2500);

    // Scanner skips mounting and battery
    await sectionShots(page, 'sec-antennas', '20-scanner-antennas');
    result = await analyzeSection(page, 'Scanner-Antennas');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('antennas'));
    await delay(2000);

    await sectionShots(page, 'sec-accessories', '21-scanner-accessories');
    result = await analyzeSection(page, 'Scanner-Accessories');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('accessories'));
    await delay(2000);

    await sectionShots(page, 'sec-programming', '22-scanner-programming');
    result = await analyzeSection(page, 'Scanner-Programming');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await page.evaluate(() => kbsCompleteSection('programming'));
    await delay(2000);

    await sectionShots(page, 'sec-review', '23-scanner-review');
    result = await analyzeSection(page, 'Scanner-Review');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await fullshot(page, '24-scanner-full');
    await page.close();
  }

  // ===== FLOW 4: GUIDED =====
  console.log('\n=== FLOW 4: GUIDED (Help Me Choose) ===');
  {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    await page.evaluate(() => kbsSkipEmail());
    await delay(1500);

    await page.evaluate(() => kbsStartGuided());
    await delay(1500);
    await sectionShots(page, 'sec-interview', '25-guided-q1');

    let result = await analyzeSection(page, 'Guided-Q1');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    // Answer first question: click first option (Budget/affordable)
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      const visible = Array.from(opts).filter(o => o.getBoundingClientRect().height > 0);
      if (visible.length > 0) visible[0].click();
    });
    await delay(1000);

    // Click Next if present
    await page.evaluate(() => {
      const next = document.querySelector('#kbs-interview-stack .kbs-iq-next:not([disabled])');
      if (next) next.click();
    });
    await delay(1500);
    await sectionShots(page, 'sec-interview', '26-guided-q2');

    // Answer second question: click first option (Nearby)
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      const visible = Array.from(opts).filter(o => o.getBoundingClientRect().height > 0);
      if (visible.length > 0) visible[0].click();
    });
    await delay(1000);
    await page.evaluate(() => {
      const next = document.querySelector('#kbs-interview-stack .kbs-iq-next:not([disabled])');
      if (next) next.click();
    });
    await delay(1500);
    await sectionShots(page, 'sec-interview', '27-guided-q3');

    // Answer third question: click first option
    await page.evaluate(() => {
      const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
      const visible = Array.from(opts).filter(o => o.getBoundingClientRect().height > 0);
      if (visible.length > 0) visible[0].click();
    });
    await delay(1000);
    await page.evaluate(() => {
      const next = document.querySelector('#kbs-interview-stack .kbs-iq-next:not([disabled])');
      if (next) next.click();
    });
    await delay(2000);

    // May need more questions - try a couple more
    for (let q = 4; q <= 6; q++) {
      const hasQ = await page.evaluate(() => {
        const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
        return Array.from(opts).filter(o => o.getBoundingClientRect().height > 0).length;
      });
      if (hasQ > 0) {
        await sectionShots(page, 'sec-interview', `28-guided-q${q}`);
        await page.evaluate(() => {
          const opts = document.querySelectorAll('#kbs-interview-stack .kbs-iq-opt');
          const visible = Array.from(opts).filter(o => o.getBoundingClientRect().height > 0);
          if (visible.length > 0) visible[0].click();
        });
        await delay(800);
        await page.evaluate(() => {
          const next = document.querySelector('#kbs-interview-stack .kbs-iq-next:not([disabled])');
          if (next) next.click();
        });
        await delay(1500);
      }
    }

    // Check if we've reached radio selection / recommendations
    await sectionShots(page, 'sec-radio', '29-guided-recommendations');
    result = await analyzeSection(page, 'Guided-Recommendations');
    console.log(`  ${result.summary}`);
    allIssues.push(...result.issues);

    await fullshot(page, '30-guided-full');
    await page.close();
  }

  // ===== FINAL REPORT =====
  console.log('\n\n====================================');
  console.log('  MOBILE AUDIT REPORT (375x812 @2x)');
  console.log('====================================');

  if (allIssues.length === 0) {
    console.log('\n  No issues detected.\n');
  } else {
    console.log(`\n  Found ${allIssues.length} issues:\n`);
    allIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  console.log('\n====================================\n');

  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'issues.txt'), allIssues.join('\n'));

  await browser.close();
  console.log('Done.');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
