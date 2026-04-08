# Comms Compass - Automated Test Generation Prompt

Use this prompt when generating Puppeteer test scripts for the Comms Compass flow. Copy the entire prompt below the line, including the architecture reference and test matrix. Adapt the "What to Test" section based on the specific testing need.

---

## Prompt

You are writing a Puppeteer test suite for the Comms Compass, a single-page radio kit builder wizard at `https://staging12.radiomadeeasy.com/comms-compass/`. The wizard is built as a vertical scroll of sections that unlock progressively. Users select a radio category, choose a radio, then walk through product add-on sections before adding to cart.

### Critical Testing Rules

1. **Click the UI, don't call JavaScript functions.** Tests must simulate real user behavior by clicking buttons, checkboxes, and cards in the DOM. Do NOT call internal functions like `kbsCompleteSection()`, `kbsAnswer()`, `kbsNextQ()`, `kbsStartDirect()`, etc. The only exception is reading state for assertions (e.g., checking `sectionState` or `selectedRadioKey` via `page.evaluate`).

2. **Wait for transitions, don't use fixed sleeps.** The state machine has animated transitions between sections (800ms fade + 1200ms render = ~2500ms total). Instead of `await sleep(2500)`, wait for the target section to become active:
```javascript
await page.waitForFunction(
  name => document.getElementById('sec-' + name)?.classList.contains('kb-section--active'),
  { timeout: 10000 },
  'antennas'
);
```
Use `page.waitForSelector` for elements that appear dynamically:
```javascript
await page.waitForSelector('.result-card', { visible: true, timeout: 10000 });
```
Only use `sleep()` as a last resort after a transition where no reliable DOM signal exists, and keep it under 500ms.

3. **Dismiss the Mailchimp popup first.** On every fresh page load, wait 2 seconds then check for and dismiss the Mailchimp popup overlay. It blocks clicks if not dismissed. Use this helper:
```javascript
async function dismissPopup(page) {
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, div[role="button"]');
    for (const b of btns) {
      if (b.textContent.trim().toUpperCase().includes('NO, THANKS') ||
          b.textContent.trim().toUpperCase().includes('NO THANKS')) {
        b.click(); return;
      }
    }
    // Also try closing any modal overlay
    const overlay = document.querySelector('.mc-closeModal, .mc-modal-close, [data-action="close"]');
    if (overlay) overlay.click();
  });
}
```

4. **Take a screenshot on every assertion.** Capture a viewport screenshot for EVERY test step (not just failures). Save to `_screenshots/{suite}/{test-name}/{step-number}-{description}.png`. On failure, additionally save a full-page screenshot with `-FAIL` suffix. This creates a visual record of the entire test run.

5. **Each test gets a fresh page with cleared state.** Clear localStorage, sessionStorage, and cookies before each test. The wizard persists state in localStorage and URL hash. Stale state causes false results.
```javascript
async function freshLoad(page, url) {
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  await client.detach();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
  await new Promise(r => setTimeout(r, 2000));
  await dismissPopup(page);
  await new Promise(r => setTimeout(r, 500));
}
```

6. **Test both viewports.** Run each flow test at desktop (1280x900) AND mobile (375x812). Many layout and interaction bugs only appear on one viewport. Mobile uses `isMobile: true` in Puppeteer's viewport config.

7. **Verify element visibility before clicking.** Before clicking any element, verify it exists and is visible. Use `page.waitForSelector` with `{ visible: true }` or check `offsetParent !== null` via `page.evaluate`. Stale or hidden elements cause silent failures.

8. **Collect and report JavaScript console errors.** Listen for `pageerror` and `console` error events. Report them in the test output. Any unexpected JS error is a test failure even if the assertions pass.
```javascript
const jsErrors = [];
page.on('pageerror', err => jsErrors.push(err.message));
page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
```

### Architecture Reference

**Page URL:** `https://staging12.radiomadeeasy.com/comms-compass/` (also accessible at `/kit-builder-v2/`)

**Section flow order:** email, interview, radio, mounting, antennas, battery, accessories, programming, review, quantity

**Section state machine:** `locked` > `loading` > `active` > `fading` > `complete`. CSS classes: `kb-section--locked`, `kb-section--loading`, `kb-section--active`, `kb-section--complete`. The `kb-section--fading` class is added during transition.

**Category-specific section skips:**
- Mounting: hidden for handheld, HF, and scanner. Only visible for vehicle/mobile and base station.
- Battery: hidden for scanner. Visible for all other categories.

**5 radio categories and their radios:**
- **Handheld** (key: `handheld`): UV-5R, UV-5R Mini, UV-PRO, DMR 6X2 PRO, DA-7X2
- **Vehicle/Mobile** (key: `mobile`): UV-50PRO, D578
- **Base Station** (key: `base`): UV-50PRO, D578 (same radios as vehicle)
- **HF** (key: `hf`): G90, FT-891
- **Scanner** (key: `scanner`): SDS200, SDS100, SDR, SDS150

**Two entry paths:**
1. **Guided ("Help Me Choose"):** Multi-step interview (budget, reach, setup type, preferences) leading to recommendation cards. Recommendation auto-selects a radio.
2. **Direct ("I Know What I Want"):** User picks category checkboxes, then selects radio from a grid.

**UV-PRO special behavior:** After selecting UV-PRO radio, a color picker appears with a single product image and color swatches (Tan first, Black second). Black is pre-selected. User picks a color and clicks Continue before proceeding to antennas.

**Multi-category flow:** Users can select multiple categories in Direct mode. After adding first kit to cart, they're prompted to build the next category with a 5% cross-category discount on the full kit total (not just base price).

**Key DOM elements:**
- Sections: `#sec-email`, `#sec-interview`, `#sec-radio`, `#sec-mounting`, `#sec-antennas`, `#sec-battery`, `#sec-accessories`, `#sec-programming`, `#sec-review`, `#sec-quantity`
- Product option cards: `.opt-card` (click to toggle selection)
- Radio cards in grid: `.radio-pick` (click to select radio)
- Recommendation cards: `.result-card` with `.rc-btn` button
- Section action buttons: `.kb-btn--primary` (Continue/Next), `.kb-btn--secondary` (Back)
- Price bar: `#kb-scroll-price-bar` with `#kbs-total` for total price
- Cart button: `.kb-btn--cart` or `#kbs-cart-btn`
- Active section content: `.kb-section__content`
- Section summary (when complete): `.kb-section__summary`
- Email skip button: contains text "Skip" or "No thanks" inside `#sec-email`
- Interview choice buttons: text "Help Me Choose" and "I Know What I Want" inside `#sec-interview`
- Category checkboxes in Direct mode: `.kbs-iq-opt` elements with category names
- Continue button after category selection: `.kb-btn--primary` inside `#sec-interview`
- Color picker swatches: `.color-swatch--black`, `.color-swatch--tan` inside `#kbs-color-picker`
- Color picker confirm: `.kb-btn--primary` inside `#kbs-color-picker`

**How to click through a section:**
1. Wait for section to be active: `await page.waitForFunction(name => document.getElementById('sec-' + name)?.classList.contains('kb-section--active'), { timeout: 10000 }, sectionName);`
2. Optionally interact with product cards (click `.opt-card` to select/deselect)
3. Click the Continue button: find `.kb-btn--primary` inside `#sec-{name} .kb-section__actions` that is visible
4. Wait for the NEXT section to become active

**How to select a radio in Direct mode:**
1. Skip email (click the skip/no-thanks button in the email section)
2. Wait for interview section to be active
3. Click "I Know What I Want" button
4. Wait for category options to appear (`.kbs-iq-opt` elements)
5. Click the category option matching the desired category
6. Click the Continue button in the interview section
7. Wait for radio section to be active
8. Click the `.radio-pick` card matching the desired radio
9. For UV-PRO: wait for `#kbs-color-picker` to appear, click a color swatch, click Continue inside the picker
10. Wait for the next section (mounting or antennas, depending on category) to be active

**How to click a Continue button within a section:**
```javascript
async function clickContinue(page, sectionName) {
  await page.evaluate(secName => {
    const sec = document.getElementById('sec-' + secName);
    if (!sec) return;
    const btns = sec.querySelectorAll('.kb-section__actions .kb-btn--primary');
    for (const btn of btns) {
      if (btn.offsetParent !== null && !btn.disabled) { btn.click(); break; }
    }
  }, sectionName);
}
```

**How to wait for and verify a section is active with content:**
```javascript
async function waitForSection(page, name) {
  await page.waitForFunction(
    n => {
      const el = document.getElementById('sec-' + n);
      return el && el.classList.contains('kb-section--active');
    },
    { timeout: 15000 },
    name
  );
  // Verify it has rendered content
  const hasContent = await page.evaluate(n => {
    const el = document.getElementById('sec-' + n);
    if (!el) return false;
    const content = el.querySelector('.kb-section__content');
    return content && content.offsetHeight > 20 && content.innerHTML.trim().length > 50;
  }, name);
  return hasContent;
}
```

**Programming section special behavior:**
- Has 3 radio-button options (Standard, Multi-Location, Self-Program), rendered as `.opt-card` divs
- Standard is default. Clicking a card selects it (radio-button style, not checkbox)
- Standard includes a location sub-question ("Where will you primarily use this radio?") with a zip code input or "Use shipping address" checkbox
- DMR radios (DMR 6X2 PRO, DA-7X2) show an additional Brandmeister ID field

**Review section:**
- Shows all selected items with remove buttons (`.ri-remove`)
- Has Edit buttons that re-open previous sections
- Removing an item re-renders the review list

**Quantity section:**
- Shows a +/- picker for kit quantity
- Volume discount tiers at qty 2+ (5%, 10%, 15%, 20%) applied to full kit total
- "Add to Cart" button (`.kb-btn--cart`) sends AJAX to WooCommerce

### Test Matrix

**A. End-to-end flow tests (one per radio, both viewports):**

| Category | Radio | Key Variations |
|----------|-------|----------------|
| Handheld | UV-5R | Cheapest, baseline flow |
| Handheld | UV-5R Mini | Smallest/cheapest |
| Handheld | UV-PRO | Color picker (Tan/Black swatches) |
| Handheld | DMR 6X2 PRO | DMR programming fields |
| Handheld | DA-7X2 | DMR programming fields, most expensive |
| Vehicle | UV-50PRO | Mounting step visible |
| Vehicle | D578 | Mounting step visible, different antenna options |
| Base | D578 | Mounting visible, base-specific antenna products |
| HF | G90 | No mounting, HF-specific antennas |
| HF | FT-891 | No mounting, different HF antenna options |
| Scanner | SDS200 | No mounting, no battery (skip), base station form factor |
| Scanner | SDS100 | No mounting, no battery (skip), handheld form factor |
| Scanner | SDR | No mounting, no battery (skip), requires computer |
| Scanner | SDS150 | No mounting, no battery (skip) |

Each flow test should:
1. Fresh load, dismiss popup, skip email
2. Select Direct path, choose category, continue
3. Select the specific radio
4. Walk through each section: verify it becomes active, has content, click Continue
5. Verify skipped sections are not visible/active (mounting for handheld/HF/scanner, battery for scanner)
6. On review: verify radio name appears, price is non-zero
7. On quantity: verify Add to Cart button is enabled
8. Verify price bar shows correct radio name and a dollar amount throughout
9. Check for zero JavaScript console errors
10. Screenshot every section transition

**B. Guided path tests (both viewports):**

| Budget | Reach | Expected Outcome |
|--------|-------|------------------|
| Budget | Nearby | Handheld recommendations |
| Mid | Local | Handheld recommendations (waterproof + GPS match) |
| High | Far | HF redirect |
| Mid | Multi-reach | Bluetooth-capable recommendations |
| Budget | Listen | Scanner redirect |

Each guided test should:
1. Fresh load, dismiss popup, skip email
2. Click "Help Me Choose"
3. Answer each question by clicking the option card, then clicking Next
4. Verify recommendation cards appear
5. Click the primary recommendation's "Select This Radio" button
6. Verify the flow advances to the correct post-radio section
7. Screenshot each interview question and the recommendation result

**C. Edge case tests (both viewports):**

| Test | Description |
|------|-------------|
| Skip all optional | UV-5R Mini, don't select any upgrades, self-program. Verify $39 total. |
| Re-edit section | Complete through accessories, click the completed antennas summary to re-edit. Verify downstream sections re-lock. |
| Back navigation | From battery, click Back. Verify antennas section re-activates. |
| Multi-category | Select Handheld + Vehicle in Direct. Complete handheld kit, verify prompted for next category. |
| UV-PRO color picker | Select UV-PRO, verify color picker appears with swatches, select Tan, verify label changes, click Continue, verify flow advances. |
| Remove from review | Complete to review, remove an antenna. Verify price updates and item disappears. |
| URL state persistence | Complete to antennas, copy URL hash, reload page, verify resume prompt appears. |

**D. Selection combination tests (desktop only, unless noted):**

These test that every interactive selection within each section works correctly. For each, verify the price bar updates and the review section reflects the selection.

| Section | Test | Verify |
|---------|------|--------|
| Antennas (handheld) | Select Foul Weather Whip only | Price adds $40, BNC adapter auto-included ($5), review shows both |
| Antennas (handheld) | Select all 3 upgrades (Stubby + Foul Weather + Signal Stick) | All 3 in review, single adapter ($5), prices sum correctly |
| Antennas (handheld) | Select Foul Weather + Mag Mount additional | Both in review, adapter included, mag mount price correct |
| Antennas (handheld) | Select Foul Weather + MOLLE Mount additional | MOLLE shows $69 (not $19), both in review |
| Antennas (handheld) | Select Slim Jim additional antenna only | Slim Jim in review at $49, adapter auto-added |
| Antennas (handheld) | No upgrades (factory only) | Review shows just base kit, no adapter charge |
| Battery (handheld) | Select 1 spare battery | Price adds correctly, review shows battery |
| Battery (handheld) | Select 2 spare batteries via qty stepper | Price = 2x battery price, review shows x2 |
| Battery (UV-PRO) | Select battery, change color to Tan | Color swatch shows Tan active, "Differs from radio" note if radio is Black |
| Accessories (handheld) | Select Cheat Sheets only | Price adds $19, review shows cheat sheets |
| Accessories (handheld) | Select all available accessories | All in review, total correct |
| Accessories (UV-PRO) | Select K-Plug Adapter | Price adds $25 |
| Accessories (UV-PRO) | Select BS-22 Wireless Speakermic | Price adds $59 |
| Programming | Standard (default) | $0 added, shipping address checkbox visible |
| Programming | Multi-Location | $10 added, multiple zip fields visible |
| Programming | Self-Program | $0 added, description mentions CHIRP |
| Programming (DMR) | Standard on DMR 6X2 PRO | Brandmeister ID field visible |
| Quantity | Qty 1 | No discount shown |
| Quantity | Qty 2 | 5% discount on full kit total shown |
| Quantity | Qty 5 | 10% discount on full kit total shown |
| Quantity | Qty 10 | 15% discount on full kit total shown |
| Mounting (vehicle) | Factory bracket selected (default) | Correct mount in review |
| Mounting (vehicle) | RAM Tough Wedge selected | Different mount in review, price reflects |
| Antennas (vehicle) | Select vehicle antenna | Category-specific antenna in review |
| Antennas (HF) | Select HF antenna | HF-specific antenna in review |
| Antennas (scanner) | Select scanner antenna | Scanner-specific antenna in review |

**E. Price verification tests (desktop only):**

| Test | Expected Total |
|------|----------------|
| UV-5R Mini, no upgrades, self-program, qty 1 | $39 |
| UV-5R, factory antenna, standard programming, qty 1 | $59 |
| UV-PRO, Foul Weather + adapter, 1 spare battery, cheat sheets, standard, qty 1 | $159 + $40 + $5 + $25 + $19 = $248 |
| UV-PRO, same as above, qty 2 | $248 * 2 - 5% discount = $471.20 (verify discount = ~$25) |
| DA-7X2, no upgrades, standard, qty 1 | $299 |
| SDS200, no upgrades, standard, qty 1 | $799 |

**F. UI/layout assertions (both viewports):**

For every section in every flow, additionally check:
1. All `.kb-btn` buttons within the same `.kb-section__actions` have the same `offsetHeight`
2. No `.opt-card` has text overlapping its `.oc-check` (check that `.oc-check` bounding box does not overlap `.oc-body` bounding box)
3. Price bar is visible and positioned at viewport bottom (`position: fixed`)
4. All `.kb-btn` elements have `offsetHeight >= 44` (touch target minimum)
5. No horizontal scroll overflow on the page body

### Output Format

Generate a single `test-comms-compass.js` file that:
- Uses `const puppeteer = require('puppeteer')` (CommonJS, not ESM)
- Defines a clear `assert(condition, message)` function that tracks pass/fail counts
- Groups tests into labeled suites with console output showing progress
- Runs all tests sequentially (not parallel) to avoid race conditions
- Prints a summary at the end: total pass, total fail, list of failures
- Saves ALL screenshots (pass and fail) to `_screenshots/{suite}/{step}.png`
- Generates a JSON results file `_screenshots/results.json` with structure:
```json
{
  "timestamp": "ISO date",
  "viewport": "desktop|mobile",
  "suites": [
    {
      "name": "Handheld - UV-5R",
      "status": "pass|fail",
      "steps": [
        { "name": "Skip email", "status": "pass", "screenshot": "path.png" },
        { "name": "Select category", "status": "fail", "screenshot": "path.png", "error": "reason" }
      ],
      "jsErrors": []
    }
  ],
  "summary": { "total": 44, "passed": 42, "failed": 2 }
}
```
- Exits with code 1 if any tests failed, code 0 if all passed
- Has a `--desktop-only` or `--mobile-only` CLI flag to run a subset
- Has a `--category=handheld` CLI flag to test only one category
- Has a `--suite=A` flag to run only section A, B, C, D, E, or F of the test matrix

### Results Documentation

After the test run completes, results should be reviewed and documented in the **Deployment Tracker** dashboard at `C:\Claude\rme-command-center\deployments\index.html`. The dashboard has a Test Coverage tab with a flow matrix and test resources section.

**Update process:**
1. Review `_screenshots/results.json` for any failures
2. For each failure: examine the screenshot, identify the root cause, file a fix
3. Update the `TESTS` array in the deployment tracker to reflect current pass/fail status
4. Add new timeline entries for significant test runs or regressions discovered
5. Update checklist items if a test revealed a previously unknown bug
6. Copy key screenshots (failures, regressions, before/after fixes) to `_screenshots/documented/` for permanent reference

**What to report:**
- Total pass/fail counts by viewport
- Any new JS console errors discovered
- Any UI layout regressions (button heights, card overlap, price bar position)
- Flow-breaking bugs vs cosmetic issues
- Comparison to previous test run if available

### What to Test

Run the full test matrix (A through F) for all radios, both viewports where noted. This is a comprehensive regression test after today's fixes: scanner battery skip, MOLLE mount price correction, discount calculation overhaul, UV-PRO color picker redesign, factory antenna mobile fix, and button height normalization.
