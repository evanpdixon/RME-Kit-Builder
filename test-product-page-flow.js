/**
 * Product Page → Kit Builder Flow Test
 *
 * Tests the full flow starting from each radio's WooCommerce product page:
 * 1. Product page loads with "Build Your Kit" CTA (no WOOSPPO, no default add-to-cart)
 * 2. CTA links to /comms-compass/ with correct hash params (radio, cat, from=product)
 * 3. Kit builder opens with interview/radio hidden, email shown
 * 4. After skipping email, radio is pre-selected and correct first section activates
 * 5. Full section walk-through to quantity/cart
 *
 * Run:
 *   node test-product-page-flow.js
 *   node test-product-page-flow.js --desktop-only
 *   node test-product-page-flow.js --radio=da-7x2
 *   node test-product-page-flow.js --category=handheld
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SITE = 'https://staging12.radiomadeeasy.com';
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const args = process.argv.slice(2);
const getArg = name => { const a = args.find(x => x.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null; };
const hasFlag = name => args.includes(`--${name}`);

const desktopOnly = hasFlag('desktop-only');
const mobileOnly = hasFlag('mobile-only');
const radioFilter = getArg('radio');
const categoryFilter = getArg('category');

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812, isMobile: true };

let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];

// Product page slugs mapped to kit builder radio keys
const RADIOS = [
  { slug: 'uv-5r-essentials-kit', key: 'uv5r', cat: 'handheld', name: 'UV-5R', hasMounting: false, hasBattery: true, hasColorPicker: false },
  { slug: 'uv-5r-mini-essentials-kit', key: 'uv5r-mini', cat: 'handheld', name: 'UV-5R Mini', hasMounting: false, hasBattery: true, hasColorPicker: false },
  { slug: 'uv-pro-essentials-kit', key: 'uv-pro', cat: 'handheld', name: 'UV-PRO', hasMounting: false, hasBattery: true, hasColorPicker: true },
  { slug: 'dmr-6x2-pro-essentials-kit', key: 'dmr-6x2', cat: 'handheld', name: 'DMR 6X2 PRO', hasMounting: false, hasBattery: true, hasColorPicker: false },
  { slug: 'da-7x2-essentials-kit', key: 'da-7x2', cat: 'handheld', name: 'DA-7X2', hasMounting: false, hasBattery: true, hasColorPicker: false },
  { slug: 'uv-50pro-essentials-kit', key: 'uv50pro', cat: 'mobile', name: 'UV-50PRO', hasMounting: true, hasBattery: true, hasColorPicker: false },
  { slug: 'dmr-d578-mobile-radio-kit', key: 'd578', cat: 'mobile', name: 'D578', hasMounting: true, hasBattery: true, hasColorPicker: false },
  { slug: 'xiegu-g90-mobile-radio-kit', key: 'g90', cat: 'hf', name: 'Xiegu G90', hasMounting: false, hasBattery: true, hasColorPicker: false },
  { slug: 'yaesu-ft-891-mobile-radio-kit', key: 'ft891', cat: 'hf', name: 'Yaesu FT-891', hasMounting: false, hasBattery: true, hasColorPicker: false },
  { slug: 'uniden-sds200-digital-scanner', key: 'sds200', cat: 'scanner', name: 'SDS200', hasMounting: false, hasBattery: false, hasColorPicker: false },
  { slug: 'uniden-sds100', key: 'sds100', cat: 'scanner', name: 'SDS100', hasMounting: false, hasBattery: false, hasColorPicker: false },
  { slug: 'sdr-essentials-kit', key: 'sdr-kit', cat: 'scanner', name: 'SDR', hasMounting: false, hasBattery: false, hasColorPicker: false },
];

const ssDir = path.join(__dirname, '_screenshots', 'product-page-flow');
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function dismissPopup(page) {
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, div[role="button"]');
    for (const b of btns) {
      if (b.textContent.trim().toUpperCase().includes('NO, THANKS') ||
          b.textContent.trim().toUpperCase().includes('NO THANKS')) {
        b.click(); return;
      }
    }
    const overlay = document.querySelector('.mc-closeModal, .mc-modal-close, [data-action="close"]');
    if (overlay) overlay.click();
  });
}

async function testRadioFromProductPage(browser, radio, viewport) {
  const vpLabel = viewport.isMobile ? 'mobile' : 'desktop';
  const testLabel = `[${vpLabel}] ${radio.name} (${radio.cat})`;
  const dir = path.join(ssDir, vpLabel, radio.key);
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  ${testLabel}${RESET}`);

  let passed = 0, failed = 0, stepNum = 0;
  const jsErrors = [];

  function assert(ok, msg) {
    stepNum++;
    if (ok) {
      console.log(`    ${PASS} ${msg}`);
      passed++; totalPassed++;
    } else {
      console.log(`    ${FAIL} ${msg}`);
      failed++; totalFailed++;
      allFailures.push(`${testLabel} ${msg}`);
    }
    return ok;
  }

  const page = await browser.newPage();
  await page.setViewport(viewport.isMobile
    ? { width: viewport.width, height: viewport.height, isMobile: true, hasTouch: true }
    : { width: viewport.width, height: viewport.height });
  page.on('pageerror', err => jsErrors.push(err.message));

  try {
    // ── Step 1: Product page loads ──
    const productUrl = `${SITE}/product/${radio.slug}/`;
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await client.detach();
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
    await sleep(1500);
    await dismissPopup(page);
    await sleep(500);

    assert(true, 'Product page loaded');

    // ── Step 2: CTA present, no WOOSPPO, no default add-to-cart ──
    const pageState = await page.evaluate(() => {
      const cta = document.querySelector('.rme-kb-product-cta');
      const woosppo = document.querySelector('.plugify_expo_sty_div, .woosppo_main_parent_divv');
      const addToCart = document.querySelector('form.cart .single_add_to_cart_button');
      const ctaLink = cta ? cta.querySelector('a') : null;
      return {
        hasCta: !!cta,
        ctaText: ctaLink ? ctaLink.textContent.trim() : '',
        ctaHref: ctaLink ? ctaLink.href : '',
        hasWoosppo: !!woosppo,
        hasDefaultAddToCart: !!addToCart,
      };
    });

    assert(pageState.hasCta, 'Build Your Kit CTA present');
    assert(pageState.ctaText.toUpperCase() === 'BUILD YOUR KIT', `CTA text is "Build Your Kit" (got "${pageState.ctaText}")`);
    assert(!pageState.hasWoosppo, 'No WOOSPPO markup on page');
    assert(!pageState.hasDefaultAddToCart, 'Default add-to-cart button hidden');

    // ── Step 3: CTA href is correct ──
    const href = pageState.ctaHref;
    assert(href.includes('/comms-compass/'), 'CTA links to /comms-compass/');
    assert(href.includes('radio=' + radio.key), `CTA hash has radio=${radio.key}`);
    assert(href.includes('from=product'), 'CTA hash has from=product');
    if (radio.cat !== 'handheld') {
      assert(href.includes('cat=' + radio.cat), `CTA hash has cat=${radio.cat}`);
    }

    await page.screenshot({ path: path.join(dir, '01-product-page.png') });

    // ── Step 4: Click CTA, navigate to kit builder ──
    await page.evaluate(() => {
      const cta = document.querySelector('.rme-kb-product-cta a');
      if (cta) cta.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await sleep(2500);
    await dismissPopup(page);
    await sleep(500);

    const onKbPage = await page.evaluate(() => !!document.getElementById('rme-kit-builder-scroll'));
    assert(onKbPage, 'Kit builder page loaded');

    await page.screenshot({ path: path.join(dir, '02-kit-builder-loaded.png') });

    // ── Step 5: No resume prompt shown ──
    const hasResumePrompt = await page.evaluate(() => !!document.querySelector('.kbs-resume-overlay'));
    assert(!hasResumePrompt, 'No resume prompt shown (from=product skips it)');

    // ── Step 6: Interview and radio sections hidden ──
    const sectionVisibility = await page.evaluate(() => {
      const interview = document.getElementById('sec-interview');
      const radio = document.getElementById('sec-radio');
      return {
        interviewHidden: interview && (interview.style.display === 'none' || interview.offsetHeight === 0),
        radioHidden: radio && (radio.style.display === 'none' || radio.offsetHeight === 0),
      };
    });
    assert(sectionVisibility.interviewHidden, 'Interview section is hidden');
    assert(sectionVisibility.radioHidden, 'Radio section is hidden');

    // ── Step 7: Email section is active ──
    const emailActive = await page.evaluate(() => {
      const sec = document.getElementById('sec-email');
      return sec && sec.classList.contains('kb-section--active');
    });
    assert(emailActive, 'Email section is active');

    // ── Step 8: Skip email ──
    const emailSkipped = await page.evaluate(() => {
      const sec = document.getElementById('sec-email');
      if (!sec) return false;
      const btns = sec.querySelectorAll('button, a, .kb-btn, .kb-btn--secondary, .kb-btn--link');
      for (const b of btns) {
        const txt = b.textContent.trim().toUpperCase();
        if (txt.includes('SKIP') || txt.includes('NO THANKS') || txt.includes('NO, THANKS')) {
          b.click(); return true;
        }
      }
      return false;
    });
    assert(emailSkipped, 'Email skipped');
    await sleep(2000);

    await page.screenshot({ path: path.join(dir, '03-after-email-skip.png') });

    // ── Step 9: Correct first section is active ──
    const firstSection = radio.hasMounting ? 'mounting' : 'antennas';
    const firstSectionActive = await page.evaluate(sec => {
      const el = document.getElementById('sec-' + sec);
      return el && el.classList.contains('kb-section--active');
    }, firstSection);
    assert(firstSectionActive, `First section active: ${firstSection}`);

    // ── Step 10: Verify radio is pre-selected (check price bar) ──
    const priceBarState = await page.evaluate(() => {
      const total = document.getElementById('kbs-total');
      return total ? total.textContent.trim() : '';
    });
    assert(priceBarState.includes('$'), 'Price bar shows dollar amount');
    const numericPrice = parseFloat(priceBarState.replace(/[^0-9.]/g, ''));
    assert(numericPrice > 0, `Price is non-zero ($${numericPrice})`);

    await page.screenshot({ path: path.join(dir, '04-first-section.png') });

    // ── Step 11: Walk through sections to cart ──
    const sections = [];
    if (radio.hasMounting) sections.push('mounting');
    sections.push('antennas');
    if (radio.hasBattery) sections.push('battery');
    sections.push('accessories', 'programming', 'review', 'quantity');

    // UV-PRO color picker
    if (radio.hasColorPicker) {
      const colorHandled = await page.evaluate(() => {
        const picker = document.getElementById('kbs-color-picker');
        if (!picker || picker.style.display === 'none') return true; // not shown = OK
        const swatch = picker.querySelector('[class*="color-swatch"]');
        if (swatch) swatch.click();
        const btn = picker.querySelector('.kb-btn--primary, button');
        if (btn && !btn.disabled) btn.click();
        return true;
      });
      await sleep(500);
    }

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const nextSec = sections[i + 1] || null;

      // Battery skip for scanners
      if (sec === 'battery' && !radio.hasBattery) {
        const batterySkipped = await page.evaluate(() => {
          const el = document.getElementById('sec-battery');
          return !el || el.style.display === 'none' || el.offsetHeight === 0;
        });
        assert(batterySkipped, 'Battery section skipped (scanner)');
        continue;
      }

      // Wait for section to be active
      try {
        await page.waitForFunction(
          n => { const el = document.getElementById('sec-' + n); return el && el.classList.contains('kb-section--active'); },
          { timeout: 10000 }, sec
        );
        await sleep(300);
      } catch (e) {
        assert(false, `Section active: ${sec} (timeout)`);
        break;
      }

      const hasContent = await page.evaluate(n => {
        const el = document.getElementById('sec-' + n);
        if (!el) return false;
        const content = el.querySelector('.kb-section__content');
        return content && content.offsetHeight > 10;
      }, sec);
      assert(hasContent, `Section has content: ${sec}`);

      // Review: verify radio name
      if (sec === 'review') {
        const reviewHasRadio = await page.evaluate(name => {
          const el = document.getElementById('sec-review');
          return el && el.textContent.includes(name);
        }, radio.name);
        assert(reviewHasRadio, `Review shows radio: ${radio.name}`);
      }

      // Quantity: verify cart button
      if (sec === 'quantity') {
        const cartBtnOk = await page.evaluate(() => {
          const btn = document.querySelector('.kb-btn--cart') || document.getElementById('kbs-cart-btn');
          return btn && !btn.disabled && btn.offsetParent !== null;
        });
        assert(cartBtnOk, 'Add to Cart button enabled');
      }

      await page.screenshot({ path: path.join(dir, `${String(5 + i).padStart(2, '0')}-${sec}.png`) });

      // Click continue (except quantity)
      if (sec !== 'quantity') {
        await page.evaluate(secName => {
          const el = document.getElementById('sec-' + secName);
          if (!el) return;
          const btns = el.querySelectorAll('.kb-section__actions .kb-btn--primary');
          for (const btn of btns) {
            if (btn.offsetParent !== null && !btn.disabled) { btn.click(); break; }
          }
        }, sec);
        await sleep(1500);
      }
    }

    // ── Step 12: JS errors ──
    const criticalErrors = jsErrors.filter(e =>
      !e.includes('favicon') && !e.includes('Failed to load resource') &&
      !e.includes('net::ERR') && !e.includes('mailchimp') && !e.toLowerCase().includes('mc.')
    );
    assert(criticalErrors.length === 0, `No critical JS errors${criticalErrors.length ? ': ' + criticalErrors[0] : ''}`);

  } catch (err) {
    assert(false, `FATAL: ${err.message}`);
    await page.screenshot({ path: path.join(dir, 'fatal-error.png'), fullPage: true }).catch(() => {});
  }

  await page.close();
  return { passed, failed };
}

async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Product Page → Kit Builder Flow Test${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} Site: ${SITE}${RESET}`);
  console.log(`${DIM} Radios: ${RADIOS.length}${RESET}`);
  if (radioFilter) console.log(`${DIM} Filter: radio=${radioFilter}${RESET}`);
  if (categoryFilter) console.log(`${DIM} Filter: category=${categoryFilter}${RESET}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const viewports = [];
  if (!mobileOnly) viewports.push({ label: 'desktop', vp: DESKTOP });
  if (!desktopOnly) viewports.push({ label: 'mobile', vp: MOBILE });

  let radios = RADIOS;
  if (radioFilter) radios = radios.filter(r => r.key === radioFilter || r.slug.includes(radioFilter));
  if (categoryFilter) radios = radios.filter(r => r.cat === categoryFilter);

  for (const { label, vp } of viewports) {
    console.log(`\n${BOLD}${CYAN}── Viewport: ${label} (${vp.width}x${vp.height}) ──${RESET}`);
    for (const radio of radios) {
      await testRadioFromProductPage(browser, radio, vp);
    }
  }

  await browser.close();

  // Save results
  ensureDir(ssDir);
  fs.writeFileSync(path.join(ssDir, 'results.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    site: SITE,
    totalPassed, totalFailed,
    failures: allFailures,
  }, null, 2));

  // Summary
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} RESULTS${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`  Total: ${totalPassed + totalFailed}`);
  console.log(`  ${PASS} Passed: ${totalPassed}`);
  console.log(`  ${FAIL} Failed: ${totalFailed}`);
  if (allFailures.length) {
    console.log(`\n${BOLD}  Failures:${RESET}`);
    allFailures.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
  }
  console.log();

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
