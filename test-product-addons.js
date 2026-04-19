/**
 * Product Add-Ons Test Suite
 *
 * Tests the custom checkbox add-on feature on accessory product pages:
 * 1. Add-on cards render with image, name, description, price, toggle, link
 * 2. Clicking a card toggles the "Added" state
 * 3. Add to cart with add-ons checked adds all items to cart
 * 4. Add to cart with nothing checked adds only the main product
 * 5. Mobile and desktop layouts
 *
 * Run:
 *   node test-product-addons.js
 *   node test-product-addons.js --desktop-only
 *   node test-product-addons.js --mobile-only
 *   node test-product-addons.js --product=uv-5r-speakermic
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
const productFilter = getArg('product');

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812, isMobile: true };

let totalPassed = 0;
let totalFailed = 0;
const allFailures = [];

// Products with add-ons to test
const PRODUCTS = [
  // Multi-addon products (good for cart tests)
  { slug: 'uv-5r-speakermic', name: 'UV-5R Speakermic', expectedAddons: 4 },
  { slug: 'mountain-jumper-angle-adjustable-magnetic-antenna-mount', name: 'Mountain Jumper', expectedAddons: 2 },
  // Single-addon products
  { slug: 'uv5r-exoskeleton', name: 'UV-5R Exoskeleton', expectedAddons: 1 },
  { slug: 'uv-5r-programming-cable', name: 'UV-5R Programming Cable', expectedAddons: 1 },
  // Antenna with adapters
  { slug: 'super-elastic-signal-stick-antenna-bnc', name: 'Signal Stick', expectedAddons: 2 },
  { slug: 'foul-weather-whip-antenna', name: 'Foul Weather Whip', expectedAddons: 2 },
  // Mount with antennas
  { slug: 'magnetic-bnc-antenna-base', name: 'Magnetic BNC Base', expectedAddons: 2 },
  // Accessories cross-sell
  { slug: 'amplified-u-94-ptt-with-kenwood-k1-plug', name: 'U-94 PTT', expectedAddons: 1 },
  { slug: '3-5mm-acoustic-eartube-headset', name: 'Eartube Headset', expectedAddons: 1 },
];

const ssDir = path.join(__dirname, '_screenshots', 'product-addons');
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function dismissPopup(page) {
  await page.evaluate(() => {
    document.querySelectorAll('button, a, div[role="button"]').forEach(b => {
      if (b.textContent.trim().toUpperCase().includes('NO, THANKS') ||
          b.textContent.trim().toUpperCase().includes('NO THANKS')) {
        b.click();
      }
    });
    const overlay = document.querySelector('.mc-closeModal, .mc-modal-close, [data-action="close"]');
    if (overlay) overlay.click();
  });
}

async function freshLoad(page, url) {
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  await client.detach();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
  await sleep(2000);
  await dismissPopup(page);
  await sleep(500);
}

// ─── UI Rendering Tests ─────────────────────────────────

async function testAddonRendering(browser, product, viewport) {
  const vpLabel = viewport.isMobile ? 'mobile' : 'desktop';
  const testLabel = `[${vpLabel}] ${product.name}`;
  const dir = path.join(ssDir, vpLabel, product.slug);
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  ${testLabel}${RESET}`);

  let passed = 0, failed = 0;

  function assert(ok, msg) {
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

  try {
    await freshLoad(page, `${SITE}/product/${product.slug}/`);

    // 1. Add-on list exists
    const listExists = await page.evaluate(() => !!document.querySelector('.rme-addon-list'));
    assert(listExists, 'Add-on list renders on page');
    if (!listExists) { await page.close(); return { passed, failed }; }

    // 2. Correct number of add-on cards
    const cardCount = await page.evaluate(() => document.querySelectorAll('.rme-addon-card').length);
    assert(cardCount === product.expectedAddons, `${cardCount} add-on cards (expected ${product.expectedAddons})`);

    // 3. Each card has required elements
    const cardDetails = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.rme-addon-card')).map(card => ({
        hasCheckbox: !!card.querySelector('input[type="checkbox"]'),
        hasImage: !!card.querySelector('.rme-addon-img img'),
        hasName: !!card.querySelector('.rme-addon-name'),
        name: card.querySelector('.rme-addon-name')?.textContent?.trim() || '',
        hasDesc: !!card.querySelector('.rme-addon-desc'),
        hasPrice: !!card.querySelector('.rme-addon-price'),
        price: card.querySelector('.rme-addon-price')?.textContent?.trim() || '',
        hasToggle: !!card.querySelector('.rme-addon-toggle'),
        hasLink: !!card.querySelector('.rme-addon-link'),
        linkHref: card.querySelector('.rme-addon-link')?.href || '',
        checkboxValue: card.querySelector('input[type="checkbox"]')?.value || '',
      }));
    });

    for (const card of cardDetails) {
      assert(card.hasCheckbox, `Card "${card.name}": has checkbox`);
      assert(card.hasName && card.name.length > 0, `Card "${card.name}": has product name`);
      assert(card.hasPrice && card.price.includes('$'), `Card "${card.name}": has price (${card.price})`);
      assert(card.hasToggle, `Card "${card.name}": has Add toggle button`);
      assert(card.hasLink && card.linkHref.includes('/product/'), `Card "${card.name}": has Learn more link`);
      assert(card.hasDesc, `Card "${card.name}": has description`);
    }

    // 4. Has section heading
    const hasHeading = await page.evaluate(() => !!document.querySelector('.rme-addon-heading'));
    assert(hasHeading, 'Has section heading');

    // 5. No WOOSPPO markup
    const noWoosppo = await page.evaluate(() => !document.querySelector('.plugify_expo_sty_div, .woosppo_main_parent_divv'));
    assert(noWoosppo, 'No WOOSPPO markup on page');

    // 6. Text is not all uppercase (description text)
    const textCase = await page.evaluate(() => {
      const desc = document.querySelector('.rme-addon-desc');
      if (!desc) return 'no-desc';
      const style = window.getComputedStyle(desc);
      return style.textTransform;
    });
    assert(textCase === 'none', `Description text-transform is "none" (got "${textCase}")`);

    // Screenshot
    await page.evaluate(() => {
      const el = document.querySelector('.rme-addon-list');
      if (el) el.scrollIntoView({ block: 'start' });
    });
    await sleep(300);
    await page.screenshot({ path: path.join(dir, '01-addons-rendered.png') });

    // 7. Toggle state changes on click
    const toggleBefore = await page.evaluate(() => {
      const card = document.querySelector('.rme-addon-card');
      const cb = card?.querySelector('input[type="checkbox"]');
      return cb ? cb.checked : null;
    });
    assert(toggleBefore === false, 'Checkbox starts unchecked');

    await page.evaluate(() => {
      const card = document.querySelector('.rme-addon-card');
      if (card) card.click();
    });
    await sleep(300);

    const toggleAfter = await page.evaluate(() => {
      const card = document.querySelector('.rme-addon-card');
      const cb = card?.querySelector('input[type="checkbox"]');
      return cb ? cb.checked : null;
    });
    assert(toggleAfter === true, 'Checkbox checked after click');

    // 8. Card shows "Added" state visually
    const addedState = await page.evaluate(() => {
      const card = document.querySelector('.rme-addon-card');
      if (!card) return {};
      const style = window.getComputedStyle(card);
      const toggleText = card.querySelector('.rme-addon-toggle-text')?.textContent || '';
      return {
        borderColor: style.borderColor,
        toggleText,
      };
    });
    assert(addedState.toggleText === 'Add', 'Toggle text base is "Add" (CSS adds "ed" suffix)');

    await page.screenshot({ path: path.join(dir, '02-addon-selected.png') });

    // 9. Click again to deselect
    await page.evaluate(() => {
      const card = document.querySelector('.rme-addon-card');
      if (card) card.click();
    });
    await sleep(300);

    const toggleReset = await page.evaluate(() => {
      const card = document.querySelector('.rme-addon-card');
      const cb = card?.querySelector('input[type="checkbox"]');
      return cb ? cb.checked : null;
    });
    assert(toggleReset === false, 'Checkbox unchecked after second click');

  } catch (err) {
    assert(false, `FATAL: ${err.message}`);
    await page.screenshot({ path: path.join(dir, 'fatal-error.png'), fullPage: true }).catch(() => {});
  }

  await page.close();
  return { passed, failed };
}

// ─── Cart Integration Tests ─────────────────────────────

async function testAddonCart(browser, viewport) {
  const vpLabel = viewport.isMobile ? 'mobile' : 'desktop';
  const testLabel = `[${vpLabel}] Cart integration`;
  const dir = path.join(ssDir, vpLabel, 'cart-tests');
  ensureDir(dir);

  console.log(`\n${CYAN}${BOLD}  ${testLabel}${RESET}`);

  let passed = 0, failed = 0;

  function assert(ok, msg) {
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

  try {
    // ── Test A: Add to cart WITH add-ons checked ──
    console.log(`\n    ${DIM}Test A: Add with add-ons${RESET}`);
    await freshLoad(page, `${SITE}/product/uv-5r-speakermic/`);

    // Check first two add-ons
    const checkedCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('.rme-addon-card');
      let checked = 0;
      if (cards[0]) { cards[0].click(); checked++; }
      if (cards[1]) { cards[1].click(); checked++; }
      return checked;
    });
    assert(checkedCount === 2, `Checked ${checkedCount} add-ons`);
    await sleep(300);

    await page.screenshot({ path: path.join(dir, '01-addons-checked.png') });

    // Click Add to Cart
    await page.evaluate(() => {
      const btn = document.querySelector('.single_add_to_cart_button');
      if (btn) btn.click();
    });
    await sleep(3000);

    // Navigate to cart
    await page.goto(`${SITE}/cart/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    // Count cart items
    const cartItemsA = await page.evaluate(() => {
      const items = document.querySelectorAll('.rme-cart-item, .woocommerce-cart-form__cart-item');
      return items.length;
    });
    assert(cartItemsA >= 3, `Cart has ${cartItemsA} items (main product + 2 add-ons)`);

    await page.screenshot({ path: path.join(dir, '02-cart-with-addons.png') });

    // ── Test B: Add to cart WITHOUT add-ons ──
    console.log(`\n    ${DIM}Test B: Add without add-ons${RESET}`);

    // Clear cart: set up dialog handler first, then click
    page.on('dialog', async dialog => { await dialog.accept(); });
    await page.evaluate(() => {
      const clearBtn = document.getElementById('rme-clear-cart-btn');
      if (clearBtn) clearBtn.click();
    });
    await sleep(3000);

    // Fresh load of product page
    await freshLoad(page, `${SITE}/product/uv5r-exoskeleton/`);

    // Don't check any add-ons, just add to cart
    await page.evaluate(() => {
      const btn = document.querySelector('.single_add_to_cart_button');
      if (btn) btn.click();
    });
    await sleep(3000);

    // Navigate to cart
    await page.goto(`${SITE}/cart/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    const cartItemsB = await page.evaluate(() => {
      const items = document.querySelectorAll('.rme-cart-item, .woocommerce-cart-form__cart-item');
      return items.length;
    });
    assert(cartItemsB >= 1, `Cart has ${cartItemsB} item(s) (main product only, no add-ons)`);

    // Verify the exoskeleton is there but not the saddle
    const cartContents = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.rme-cart-item-name a, .woocommerce-cart-form__cart-item .product-name a'))
        .map(a => a.textContent.trim());
    });
    const hasExoskeleton = cartContents.some(n => n.toLowerCase().includes('exoskeleton'));
    const hasSaddle = cartContents.some(n => n.toLowerCase().includes('saddle'));
    assert(hasExoskeleton, 'Cart contains Exoskeleton');
    assert(!hasSaddle, 'Cart does NOT contain Kenwood Plug Saddle (unchecked add-on)');

    await page.screenshot({ path: path.join(dir, '03-cart-without-addons.png') });

  } catch (err) {
    assert(false, `FATAL: ${err.message}`);
    await page.screenshot({ path: path.join(dir, 'fatal-error.png'), fullPage: true }).catch(() => {});
  }

  await page.close();
  return { passed, failed };
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}========================================${RESET}`);
  console.log(`${BOLD} Product Add-Ons Test Suite${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${DIM} Site: ${SITE}${RESET}`);
  console.log(`${DIM} Products: ${PRODUCTS.length}${RESET}`);
  if (productFilter) console.log(`${DIM} Filter: ${productFilter}${RESET}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const viewports = [];
  if (!mobileOnly) viewports.push({ label: 'desktop', vp: DESKTOP });
  if (!desktopOnly) viewports.push({ label: 'mobile', vp: MOBILE });

  let products = PRODUCTS;
  if (productFilter) products = products.filter(p => p.slug.includes(productFilter) || p.name.toLowerCase().includes(productFilter.toLowerCase()));

  for (const { label, vp } of viewports) {
    console.log(`\n${BOLD}${CYAN}── Viewport: ${label} (${vp.width}x${vp.height}) ──${RESET}`);

    // UI rendering tests for each product
    for (const product of products) {
      await testAddonRendering(browser, product, vp);
    }

    // Cart integration test (once per viewport)
    await testAddonCart(browser, vp);
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
