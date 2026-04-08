/**
 * RME Kit Builder V2 Scroll Variant - Comprehensive Mobile UI Audit
 * Viewport: 375x812 (iPhone)
 * Flow: Email skip > Help Me Choose > handheld > mid budget > outdoor > waterproof > UV-PRO > antennas > battery > accessories > programming > review
 *
 * Run: node mobile-ui-audit-v2.js
 */

const puppeteer = require('puppeteer');
const path = require('path');

const KB_URL = 'https://staging12.radiomadeeasy.com/kit-builder-v2/';
const SCREENSHOT_DIR = path.resolve(__dirname, 'audit-screenshots');
const VIEWPORT = { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

const sleep = ms => new Promise(r => setTimeout(r, ms));

const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const WARN = '\x1b[33m[WARN]\x1b[0m';
const SECTION = '\x1b[36m';
const RESET = '\x1b[0m';

let passed = 0, failed = 0, warnings = 0;
const issues = [];

function assert(condition, msg, detail) {
  if (condition) {
    console.log(`  ${PASS} ${msg}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${msg}${detail ? ' -- ' + detail : ''}`);
    failed++;
    issues.push({ type: 'FAIL', msg, detail: detail || '' });
  }
}

function warn(msg, detail) {
  console.log(`  ${WARN} ${msg}${detail ? ' -- ' + detail : ''}`);
  warnings++;
  issues.push({ type: 'WARN', msg, detail: detail || '' });
}

// Check minimum font size (12px) for all visible text elements
async function checkFontSizes(page, stepName) {
  const smallText = await page.evaluate(() => {
    const results = [];
    const walker = document.createTreeWalker(
      document.querySelector('#rme-kit-builder-scroll') || document.body,
      NodeFilter.SHOW_ELEMENT
    );
    let node;
    while (node = walker.nextNode()) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || node.offsetParent === null) continue;
      // Only check elements with direct text content
      const hasText = [...node.childNodes].some(c => c.nodeType === 3 && c.textContent.trim().length > 0);
      if (!hasText) continue;
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 12) {
        results.push({
          tag: node.tagName,
          classes: node.className?.substring?.(0, 80) || '',
          text: node.textContent.trim().substring(0, 50),
          fontSize: fontSize
        });
      }
    }
    return results;
  });

  if (smallText.length === 0) {
    assert(true, `[${stepName}] All text >= 12px`);
  } else {
    smallText.forEach(el => {
      assert(false, `[${stepName}] Text too small (${el.fontSize}px)`,
        `${el.tag}.${el.classes} "${el.text}"`);
    });
  }
}

// Check touch targets (minimum 44px)
async function checkTouchTargets(page, stepName) {
  const smallTargets = await page.evaluate(() => {
    const results = [];
    const container = document.querySelector('#rme-kit-builder-scroll') || document.body;
    const interactive = container.querySelectorAll('button, a, [onclick], input, select, .kbs-iq-opt, .kbs-choice-card, .radio-pick, .opt-card, .result-card');
    interactive.forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.height < 44 || rect.width < 44) {
        results.push({
          tag: el.tagName,
          classes: (el.className?.substring?.(0, 80) || ''),
          text: el.textContent?.trim().substring(0, 40) || '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          selector: el.id ? '#' + el.id : (el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''))
        });
      }
    });
    return results;
  });

  if (smallTargets.length === 0) {
    assert(true, `[${stepName}] All touch targets >= 44px`);
  } else {
    smallTargets.forEach(el => {
      if (el.height < 44 && el.width >= 44) {
        warn(`[${stepName}] Touch target short (${el.width}x${el.height}px)`,
          `${el.selector} "${el.text}"`);
      } else {
        warn(`[${stepName}] Touch target small (${el.width}x${el.height}px)`,
          `${el.selector} "${el.text}"`);
      }
    });
  }
}

// Check for horizontal overflow
async function checkHorizontalOverflow(page, stepName) {
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const overflowing = [];
    if (scrollWidth > docWidth + 2) {
      // Find elements causing overflow
      const all = document.querySelectorAll('#rme-kit-builder-scroll *');
      all.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 2 || rect.left < -2) {
          overflowing.push({
            tag: el.tagName,
            classes: (el.className?.substring?.(0, 80) || ''),
            right: Math.round(rect.right),
            left: Math.round(rect.left),
            docWidth
          });
        }
      });
    }
    return { scrollWidth, docWidth, overflowing: overflowing.slice(0, 5) };
  });

  if (overflow.scrollWidth <= overflow.docWidth + 2) {
    assert(true, `[${stepName}] No horizontal overflow`);
  } else {
    assert(false, `[${stepName}] Horizontal overflow detected`,
      `scrollWidth=${overflow.scrollWidth} > viewportWidth=${overflow.docWidth}`);
    overflow.overflowing.forEach(el => {
      warn(`  Overflowing: ${el.tag}.${el.classes}`,
        `left=${el.left}, right=${el.right}`);
    });
  }
}

// Check images are appropriately sized
async function checkImages(page, stepName) {
  const imageIssues = await page.evaluate(() => {
    const results = [];
    const container = document.querySelector('#rme-kit-builder-scroll') || document.body;
    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
      if (img.offsetParent === null) return;
      const rect = img.getBoundingClientRect();
      if (rect.width === 0) return;
      const viewportW = document.documentElement.clientWidth;
      if (rect.width > viewportW) {
        results.push({
          src: img.src.split('/').pop(),
          displayW: Math.round(rect.width),
          displayH: Math.round(rect.height),
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          issue: 'wider than viewport'
        });
      }
      // Check if image is tiny (display area < 20x20 which could be broken)
      if (rect.width < 20 && rect.height < 20 && img.naturalWidth > 100) {
        results.push({
          src: img.src.split('/').pop(),
          displayW: Math.round(rect.width),
          displayH: Math.round(rect.height),
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          issue: 'displayed very small'
        });
      }
    });
    return results;
  });

  if (imageIssues.length === 0) {
    assert(true, `[${stepName}] Images appropriately sized`);
  } else {
    imageIssues.forEach(img => {
      assert(false, `[${stepName}] Image issue: ${img.issue}`,
        `${img.src} display=${img.displayW}x${img.displayH} natural=${img.naturalW}x${img.naturalH}`);
    });
  }
}

// Check consultation link visibility
async function checkConsultationLink(page, stepName) {
  const linkInfo = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    const consultLinks = [];
    links.forEach(l => {
      if (l.textContent.toLowerCase().includes('consult') || l.href?.includes('consult')) {
        const rect = l.getBoundingClientRect();
        consultLinks.push({
          text: l.textContent.trim().substring(0, 60),
          href: l.href,
          visible: l.offsetParent !== null && rect.height > 0,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });
    // Also check for the escape link in interview
    const escapeLinks = document.querySelectorAll('.kbs-consult-escape, .kbs-consult-link');
    escapeLinks.forEach(l => {
      const rect = l.getBoundingClientRect();
      consultLinks.push({
        text: l.textContent.trim().substring(0, 60),
        href: l.href || '',
        visible: l.offsetParent !== null && rect.height > 0,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        className: l.className
      });
    });
    return consultLinks;
  });

  if (linkInfo.length > 0) {
    const visibleLinks = linkInfo.filter(l => l.visible);
    if (visibleLinks.length > 0) {
      assert(true, `[${stepName}] Consultation link visible (${visibleLinks.length} found)`);
    } else {
      warn(`[${stepName}] Consultation links exist but none visible`, JSON.stringify(linkInfo[0]));
    }
  } else {
    // Not all steps need a consultation link
  }
}

// Check for visual issues (overlap, clipping, spacing)
async function checkVisualIssues(page, stepName) {
  const visualIssues = await page.evaluate(() => {
    const results = [];
    const container = document.querySelector('#rme-kit-builder-scroll');
    if (!container) return results;

    // Check for text clipping (overflow hidden with content)
    const allEls = container.querySelectorAll('*');
    allEls.forEach(el => {
      const style = getComputedStyle(el);
      if (el.offsetParent === null) return;

      // Check for text overflow clipping
      if (style.overflow === 'hidden' && el.scrollHeight > el.clientHeight + 4) {
        const text = el.textContent?.trim();
        if (text && text.length > 5) {
          results.push({
            type: 'clipping',
            tag: el.tagName,
            classes: (el.className?.substring?.(0, 60) || ''),
            clientH: el.clientHeight,
            scrollH: el.scrollHeight,
            text: text.substring(0, 40)
          });
        }
      }

      // Check for negative margins causing overlap
      const marginTop = parseFloat(style.marginTop);
      const marginLeft = parseFloat(style.marginLeft);
      if (marginTop < -20 || marginLeft < -20) {
        results.push({
          type: 'negative-margin',
          tag: el.tagName,
          classes: (el.className?.substring?.(0, 60) || ''),
          marginTop, marginLeft
        });
      }
    });

    return results.slice(0, 10);
  });

  if (visualIssues.length === 0) {
    assert(true, `[${stepName}] No clipping or overlap issues`);
  } else {
    visualIssues.forEach(issue => {
      if (issue.type === 'clipping') {
        warn(`[${stepName}] Content clipped: ${issue.tag}.${issue.classes}`,
          `clientH=${issue.clientH} scrollH=${issue.scrollH} "${issue.text}"`);
      } else {
        warn(`[${stepName}] Negative margin: ${issue.tag}.${issue.classes}`,
          `marginTop=${issue.marginTop} marginLeft=${issue.marginLeft}`);
      }
    });
  }
}

async function auditStep(page, stepNum, stepName, desc) {
  const filename = `mobile-${String(stepNum).padStart(2, '0')}-${stepName}.png`;
  console.log(`\n${SECTION}=== Step ${stepNum}: ${desc} ===${RESET}`);

  // Take screenshot
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: false
  });
  console.log(`  Screenshot: ${filename}`);

  // Run all checks
  await checkFontSizes(page, stepName);
  await checkTouchTargets(page, stepName);
  await checkHorizontalOverflow(page, stepName);
  await checkImages(page, stepName);
  await checkConsultationLink(page, stepName);
  await checkVisualIssues(page, stepName);
}

async function fullPageScreenshot(page, stepNum, stepName) {
  const filename = `mobile-${String(stepNum).padStart(2, '0')}-${stepName}-full.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true
  });
  console.log(`  Full-page screenshot: ${filename}`);
}

(async () => {
  console.log(`\n${SECTION}====================================================`);
  console.log('  RME Kit Builder V2 - Mobile UI Audit (375x812)');
  console.log(`====================================================${RESET}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  // Collect console errors
  const jsErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') jsErrors.push(msg.text());
  });
  page.on('pageerror', err => jsErrors.push(err.message));

  try {
    // ── Load page ──
    console.log('Loading kit builder V2...');
    await page.goto(KB_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1000);

    // ── Step 1: Email screen ──
    await auditStep(page, 1, 'email', 'Email capture screen');

    // Check email form elements
    const emailFormInfo = await page.evaluate(() => {
      const section = document.getElementById('sec-email');
      if (!section) return { exists: false };
      const skipBtn = section.querySelector('[onclick*="kbsSkipEmail"]') || section.querySelector('.kbs-skip');
      const emailInput = section.querySelector('input[type="email"]');
      const submitBtn = section.querySelector('button[type="submit"]') || section.querySelector('.kb-btn--primary');
      return {
        exists: true,
        active: section.classList.contains('kb-section--active'),
        skipBtn: skipBtn ? { text: skipBtn.textContent.trim(), height: skipBtn.getBoundingClientRect().height, width: skipBtn.getBoundingClientRect().width } : null,
        emailInput: emailInput ? { height: emailInput.getBoundingClientRect().height } : null,
        submitBtn: submitBtn ? { text: submitBtn.textContent.trim(), height: submitBtn.getBoundingClientRect().height } : null
      };
    });
    assert(emailFormInfo.exists && emailFormInfo.active, 'Email section is active on load');

    // ── Step 2: Skip email ──
    await page.evaluate(() => { if (typeof kbsSkipEmail === 'function') kbsSkipEmail(); });
    await sleep(800);

    await auditStep(page, 2, 'choice', 'Help Me Choose / I Know What I Want');

    const choiceInfo = await page.evaluate(() => {
      const el = document.getElementById('kbs-interview-choice');
      if (!el) return { visible: false };
      const cards = el.querySelectorAll('.kbs-choice-card');
      const cardData = [];
      cards.forEach(c => {
        const rect = c.getBoundingClientRect();
        cardData.push({
          text: c.textContent.trim().substring(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      });
      return { visible: el.style.display !== 'none', cards: cardData };
    });
    assert(choiceInfo.visible, 'Choice screen is visible after email skip');
    if (choiceInfo.cards) {
      choiceInfo.cards.forEach((c, i) => {
        assert(c.height >= 44, `Choice card ${i + 1} tappable height (${c.height}px)`, c.text);
      });
    }

    // ── Step 3: Click "Help Me Choose" ──
    await page.evaluate(() => { if (typeof kbsStartGuided === 'function') kbsStartGuided(); });
    await sleep(800);

    await auditStep(page, 3, 'q1-usage', 'Q1: What do you need radios for?');

    // ── Step 4: Answer Q1 - Select "handheld" ──
    await page.evaluate(() => { kbsAnswer('usage', 'handheld', true); });
    await sleep(400);

    // Take screenshot showing selection
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-04-q1-selected.png'),
      fullPage: false
    });
    console.log(`\n${SECTION}=== Step 4: Q1 handheld selected ===${RESET}`);
    console.log('  Screenshot: mobile-04-q1-selected.png');

    // Check selection visual feedback
    const selectionFeedback = await page.evaluate(() => {
      const selected = document.querySelector('.kbs-iq-opt.selected');
      if (!selected) return null;
      const style = getComputedStyle(selected);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        text: selected.textContent.trim().substring(0, 30)
      };
    });
    assert(selectionFeedback, 'Selection has visual feedback', selectionFeedback ? `bg=${selectionFeedback.backgroundColor}` : '');

    // Click Next
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(800);

    // ── Step 5: Q2 - Preferences (What matters most?) ──
    // Since we selected handheld (not "notsure"), distance and where are skipped
    await auditStep(page, 5, 'q2-preferences', 'Q2: What matters most to you?');

    // Answer: waterproof
    await page.evaluate(() => { kbsAnswer('preferences', 'waterproof', true); });
    await sleep(400);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-05b-pref-selected.png'),
      fullPage: false
    });

    // Click Next -> moves to interview questions (budget)
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(800);

    // ── Step 6: Q3 - Budget ──
    await auditStep(page, 6, 'q3-budget', 'Q3: What kind of radio? (Budget)');

    // Scroll to see current question
    await page.evaluate(() => {
      const qs = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
      if (qs.length) qs[qs.length - 1].scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-06b-budget-scrolled.png'),
      fullPage: false
    });

    // Answer: mid-range
    await page.evaluate(() => { kbsAnswer('budget', 'mid', false); });
    await sleep(400);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(800);

    // ── Step 7: Q4 - Use (Where will you use?) ──
    await page.evaluate(() => {
      const qs = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
      if (qs.length) qs[qs.length - 1].scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(300);

    await auditStep(page, 7, 'q4-use', 'Q4: Where will you use your radio?');

    // Answer: outdoor
    await page.evaluate(() => { kbsAnswer('use', 'outdoor', true); });
    await sleep(400);
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(800);

    // ── Step 8: Q5 - Features ──
    await page.evaluate(() => {
      const qs = document.querySelectorAll('.kbs-iq:not(.kbs-iq--answered)');
      if (qs.length) qs[qs.length - 1].scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(300);

    await auditStep(page, 8, 'q5-features', 'Q5: What matters most? (Features)');

    // Answer: waterproof feature
    await page.evaluate(() => { kbsAnswer('features', 'waterproof', true); });
    await sleep(400);

    // Click "See Results"
    await page.evaluate(() => { kbsNextQ(); });
    await sleep(1500);

    // ── Step 9: Recommendation results ──
    await page.evaluate(() => {
      const resultSection = document.querySelector('.kbs-results') || document.getElementById('sec-interview');
      if (resultSection) resultSection.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(500);

    await auditStep(page, 9, 'results', 'Radio recommendation results');
    await fullPageScreenshot(page, 9, 'results');

    // Check result cards
    const resultInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('.result-card');
      const data = [];
      cards.forEach(c => {
        const rect = c.getBoundingClientRect();
        const name = c.querySelector('.rc-name, h3, h4');
        const btn = c.querySelector('.rc-btn, button');
        data.push({
          name: name ? name.textContent.trim() : 'unknown',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          recommended: c.classList.contains('recommended'),
          btnHeight: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
          btnWidth: btn ? Math.round(btn.getBoundingClientRect().width) : 0,
        });
      });
      return data;
    });

    if (resultInfo.length > 0) {
      resultInfo.forEach(r => {
        console.log(`  Result card: "${r.name}" ${r.width}x${r.height}px ${r.recommended ? '(RECOMMENDED)' : ''}`);
        assert(r.width <= 375, `[results] Card "${r.name}" fits viewport width`, `width=${r.width}`);
        if (r.btnHeight > 0) {
          assert(r.btnHeight >= 44, `[results] Button tappable in "${r.name}"`, `height=${r.btnHeight}px`);
        }
      });
    } else {
      assert(false, '[results] No result cards found');
    }

    // ── Step 10: Select UV-PRO ──
    await page.evaluate(() => { kbsSelectRadio('uv-pro'); });
    await sleep(1200);

    // ── Step 11: Antennas ──
    await page.evaluate(() => {
      const sec = document.getElementById('sec-antennas');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(500);

    await auditStep(page, 10, 'antennas', 'Antenna selection step');
    await fullPageScreenshot(page, 10, 'antennas');

    // Check antenna grid
    const antennaInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('#antenna-options .opt-card');
      const data = [];
      cards.forEach(c => {
        const rect = c.getBoundingClientRect();
        const name = c.querySelector('.oc-name, h4, h3');
        const price = c.querySelector('.oc-price');
        const img = c.querySelector('img');
        data.push({
          name: name ? name.textContent.trim() : 'unknown',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          priceSize: price ? parseFloat(getComputedStyle(price).fontSize) : 0,
          imgW: img ? Math.round(img.getBoundingClientRect().width) : 0,
          imgH: img ? Math.round(img.getBoundingClientRect().height) : 0
        });
      });
      // Check grid layout
      const grid = document.querySelector('#rme-kit-builder-scroll .options-grid, #antenna-options');
      const gridStyle = grid ? getComputedStyle(grid) : null;
      return {
        cards: data,
        gridCols: gridStyle ? gridStyle.gridTemplateColumns : 'none',
        gridGap: gridStyle ? gridStyle.gap : 'none'
      };
    });

    console.log(`  Grid columns: ${antennaInfo.gridCols}`);
    antennaInfo.cards.forEach(c => {
      assert(c.width <= 375, `[antennas] Card "${c.name}" fits viewport`, `width=${c.width}`);
    });

    // Check price bar is visible
    const priceBarInfo = await page.evaluate(() => {
      const bar = document.getElementById('kb-scroll-price-bar');
      if (!bar) return null;
      const rect = bar.getBoundingClientRect();
      const style = getComputedStyle(bar);
      return {
        visible: bar.style.display !== 'none' && rect.height > 0,
        position: style.position,
        bottom: style.bottom,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        fontSize: parseFloat(style.fontSize),
        total: document.getElementById('kbs-total')?.textContent || ''
      };
    });

    if (priceBarInfo) {
      assert(priceBarInfo.visible, '[antennas] Price bar visible', `${priceBarInfo.width}x${priceBarInfo.height}`);
      assert(priceBarInfo.width <= 375, '[antennas] Price bar fits viewport', `width=${priceBarInfo.width}`);
      console.log(`  Price bar: position=${priceBarInfo.position} total=${priceBarInfo.total}`);
    }

    // Check consultation link
    const consultLink = await page.evaluate(() => {
      const links = document.querySelectorAll('.kbs-consult-escape, .kbs-consult-link, a[href*="consult"]');
      const data = [];
      links.forEach(l => {
        const rect = l.getBoundingClientRect();
        data.push({
          text: l.textContent.trim().substring(0, 50),
          href: l.href,
          visible: l.offsetParent !== null,
          height: Math.round(rect.height)
        });
      });
      return data;
    });
    console.log(`  Consultation links found: ${consultLink.length}`);

    // ── Step 12: Complete antennas, move to battery ──
    await page.evaluate(() => { kbsCompleteSection('antennas'); });
    await sleep(800);

    await page.evaluate(() => {
      const sec = document.getElementById('sec-battery');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(500);

    await auditStep(page, 11, 'battery', 'Battery selection step');
    await fullPageScreenshot(page, 11, 'battery');

    // Check battery cards
    const batteryInfo = await page.evaluate(() => {
      const section = document.getElementById('sec-battery');
      if (!section) return { active: false };
      const cards = section.querySelectorAll('.opt-card');
      return {
        active: section.classList.contains('kb-section--active'),
        cardCount: cards.length,
        cards: [...cards].slice(0, 5).map(c => {
          const rect = c.getBoundingClientRect();
          return {
            name: c.querySelector('.oc-name, h4')?.textContent?.trim() || '',
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
      };
    });
    assert(batteryInfo.active, '[battery] Battery section is active');
    console.log(`  Battery cards: ${batteryInfo.cardCount}`);

    // ── Step 13: Complete battery, move to accessories ──
    await page.evaluate(() => { kbsCompleteSection('battery'); });
    await sleep(800);

    await page.evaluate(() => {
      const sec = document.getElementById('sec-accessories');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(500);

    await auditStep(page, 12, 'accessories', 'Accessories selection step');
    await fullPageScreenshot(page, 12, 'accessories');

    // Check accessories
    const accInfo = await page.evaluate(() => {
      const section = document.getElementById('sec-accessories');
      if (!section) return { active: false };
      const cards = section.querySelectorAll('.opt-card');
      const helpToggle = section.querySelector('.acc-help-toggle');
      return {
        active: section.classList.contains('kb-section--active'),
        cardCount: cards.length,
        helpToggle: helpToggle ? {
          text: helpToggle.textContent.trim().substring(0, 40),
          height: Math.round(helpToggle.getBoundingClientRect().height)
        } : null
      };
    });
    assert(accInfo.active, '[accessories] Accessories section is active');
    console.log(`  Accessory cards: ${accInfo.cardCount}`);
    if (accInfo.helpToggle) {
      assert(accInfo.helpToggle.height >= 44, '[accessories] Help toggle tappable', `height=${accInfo.helpToggle.height}px`);
    }

    // ── Step 14: Complete accessories, move to programming ──
    await page.evaluate(() => { kbsCompleteSection('accessories'); });
    await sleep(800);

    await page.evaluate(() => {
      const sec = document.getElementById('sec-programming');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(500);

    await auditStep(page, 13, 'programming', 'Programming selection step');
    await fullPageScreenshot(page, 13, 'programming');

    const progInfo = await page.evaluate(() => {
      const section = document.getElementById('sec-programming');
      if (!section) return { active: false };
      const cards = section.querySelectorAll('.opt-card');
      return {
        active: section.classList.contains('kb-section--active'),
        cardCount: cards.length,
        cards: [...cards].slice(0, 5).map(c => {
          const rect = c.getBoundingClientRect();
          return {
            name: c.querySelector('.oc-name, h4')?.textContent?.trim() || '',
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
      };
    });
    assert(progInfo.active, '[programming] Programming section is active');
    console.log(`  Programming cards: ${progInfo.cardCount}`);

    // ── Step 15: Complete programming, move to review ──
    await page.evaluate(() => { kbsCompleteSection('programming'); });
    await sleep(800);

    await page.evaluate(() => {
      const sec = document.getElementById('sec-review');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(500);

    await auditStep(page, 14, 'review', 'Review / cart step');
    await fullPageScreenshot(page, 14, 'review');

    // Check review section details
    const reviewInfo = await page.evaluate(() => {
      const section = document.getElementById('sec-review');
      if (!section) return { active: false };
      const cartBtn = document.getElementById('kbs-cart-btn');
      const items = section.querySelectorAll('.review-item, .rv-line, tr');
      const totalEl = document.getElementById('kbs-total') || section.querySelector('.rv-total, .review-total');

      return {
        active: section.classList.contains('kb-section--active'),
        cartBtn: cartBtn ? {
          text: cartBtn.textContent.trim(),
          disabled: cartBtn.disabled,
          width: Math.round(cartBtn.getBoundingClientRect().width),
          height: Math.round(cartBtn.getBoundingClientRect().height),
          fontSize: parseFloat(getComputedStyle(cartBtn).fontSize)
        } : null,
        itemCount: items.length,
        total: totalEl ? totalEl.textContent.trim() : 'not found'
      };
    });

    assert(reviewInfo.active, '[review] Review section is active');
    if (reviewInfo.cartBtn) {
      assert(!reviewInfo.cartBtn.disabled, '[review] Cart button is enabled');
      assert(reviewInfo.cartBtn.height >= 44, '[review] Cart button tappable', `height=${reviewInfo.cartBtn.height}px`);
      assert(reviewInfo.cartBtn.width >= 200, '[review] Cart button wide enough', `width=${reviewInfo.cartBtn.width}px`);
      assert(reviewInfo.cartBtn.fontSize >= 14, '[review] Cart button text readable', `fontSize=${reviewInfo.cartBtn.fontSize}px`);
      console.log(`  Cart button: "${reviewInfo.cartBtn.text}" ${reviewInfo.cartBtn.width}x${reviewInfo.cartBtn.height}px`);
    } else {
      assert(false, '[review] Cart button not found');
    }
    console.log(`  Review items: ${reviewInfo.itemCount}, Total: ${reviewInfo.total}`);

    // ── Final: check JS errors ──
    console.log(`\n${SECTION}=== JavaScript Errors ===${RESET}`);
    if (jsErrors.length === 0) {
      assert(true, 'No JavaScript errors during flow');
    } else {
      jsErrors.forEach(err => {
        warn('JS error', err.substring(0, 120));
      });
    }

    // ── Summary ──
    console.log(`\n${SECTION}══════════════════════════════════════════════════`);
    console.log(`  MOBILE UI AUDIT SUMMARY`);
    console.log(`══════════════════════════════════════════════════${RESET}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Warnings: ${warnings}`);
    console.log(`  Screenshots saved to: audit-screenshots/\n`);

    if (issues.length > 0) {
      console.log(`${SECTION}Issues Found:${RESET}`);
      issues.forEach((issue, i) => {
        const icon = issue.type === 'FAIL' ? FAIL : WARN;
        console.log(`  ${i + 1}. ${icon} ${issue.msg}${issue.detail ? '\n     Detail: ' + issue.detail : ''}`);
      });
    }

  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    await browser.close();
  }
})();
