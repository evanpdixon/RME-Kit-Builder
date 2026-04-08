# Comms Compass (Kit Builder V2) - Automated Test Generation Prompt

Use this prompt when generating Puppeteer test scripts for the Comms Compass flow. Copy the entire prompt below the line, including the architecture reference and test matrix. Adapt the "What to Test" section based on the specific testing need.

---

## Prompt

You are writing a Puppeteer test suite for the Comms Compass, a single-page radio kit builder wizard at `https://staging12.radiomadeeasy.com/kit-builder-v2/`. The wizard is built as a vertical scroll of sections that unlock progressively. Users select a radio category, choose a radio, then walk through product add-on sections before adding to cart.

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

3. **Dismiss the Mailchimp popup first.** On every fresh page load, check for and dismiss the Mailchimp popup overlay. It blocks clicks if not dismissed. Look for a close button or "No, thanks" text.

4. **Take a screenshot on every failure.** When an assertion fails, capture a viewport screenshot to the `_screenshots/` directory with a descriptive filename including the test name and section.

5. **Each test gets a fresh page with cleared state.** Clear localStorage, sessionStorage, and cookies before each test. The wizard persists state in localStorage and URL hash. Stale state causes false results.

6. **Test both viewports.** Run each flow test at desktop (1280x900) AND mobile (375x812). Many layout and interaction bugs only appear on one viewport. Mobile uses `isMobile: true` in Puppeteer's viewport config.

### Architecture Reference

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
- **Scanner** (key: `scanner`): SDR, SDS200, SR2, BC125AT

**Two entry paths:**
1. **Guided ("Help Me Choose"):** Multi-step interview (budget, reach, setup type, preferences) leading to recommendation cards. Recommendation auto-selects a radio.
2. **Direct ("I Know What I Want"):** User picks category checkboxes, then selects radio from a grid.

**UV-PRO special behavior:** After selecting UV-PRO radio, a color picker modal appears (Black vs Tan/Coyote). Must select a color before proceeding.

**Multi-category flow:** Users can select multiple categories in Direct mode. After adding first kit to cart, they're prompted to build the next category with a 5% cross-category discount.

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

**How to click through a section:**
1. Wait for section to be active (has `kb-section--active` class)
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
9. Wait for the next section (mounting or antennas, depending on category) to be active

**How to click a Continue button within a section:**
```javascript
await page.evaluate(secName => {
  const sec = document.getElementById('sec-' + secName);
  if (!sec) return;
  const btns = sec.querySelectorAll('.kb-section__actions .kb-btn--primary');
  for (const btn of btns) {
    if (btn.offsetParent !== null && !btn.disabled) { btn.click(); break; }
  }
}, 'antennas');
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
- Volume discount tiers at qty 2+ (5%, 10%, 15%, 20%)
- "Add to Cart" button (`.kb-btn--cart`) sends AJAX to WooCommerce

### Test Matrix

**A. End-to-end flow tests (one per radio, both viewports):**

| Category | Radio | Key Variations |
|----------|-------|----------------|
| Handheld | UV-5R | Cheapest, baseline flow |
| Handheld | UV-5R Mini | Smallest/cheapest |
| Handheld | UV-PRO | Color picker modal (Black/Tan) |
| Handheld | DMR 6X2 PRO | DMR programming fields |
| Handheld | DA-7X2 | DMR programming fields, most expensive |
| Vehicle | UV-50PRO | Mounting step visible |
| Vehicle | D578 | Mounting step visible, different antenna options |
| Base | D578 | Mounting visible, base-specific antenna products |
| HF | G90 | No mounting, HF-specific antennas |
| HF | FT-891 | No mounting, different HF antenna options |
| Scanner | SDR | No mounting, no battery (skip), scanner products |
| Scanner | SDS200 | No mounting, no battery (skip), most expensive scanner |
| Scanner | SR2 | No mounting, no battery (skip) |
| Scanner | BC125AT | No mounting, no battery (skip) |

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

**C. Edge case tests (both viewports):**

| Test | Description |
|------|-------------|
| Skip all optional | UV-5R Mini, don't select any upgrades, self-program. Verify $39 total. |
| Re-edit section | Complete through accessories, click the completed antennas summary to re-edit. Verify downstream sections re-lock. |
| Back navigation | From battery, click Back. Verify antennas section re-activates. |
| Multi-category | Select Handheld + Vehicle in Direct. Complete handheld kit, verify prompted for next category. |
| UV-PRO color picker | Select UV-PRO, verify color modal appears, select Tan, verify flow continues. |
| Remove from review | Complete to review, remove an antenna. Verify price updates and item disappears. |
| URL state persistence | Complete to antennas, copy URL hash, reload page, verify resume prompt appears. |

**D. UI/layout assertions (both viewports):**

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
- Saves failure screenshots to `_screenshots/` directory
- Exits with code 1 if any tests failed, code 0 if all passed
- Has a `--desktop-only` or `--mobile-only` CLI flag to run a subset
- Has a `--category=handheld` CLI flag to test only one category

### What to Test

[Describe the specific testing need here. Examples:]

- "Run the full test matrix above (A through D) for all radios, both viewports."
- "Test only the scanner category flows (SDR, SDS200, SR2, BC125AT) to verify the battery skip fix."
- "Test only the UI/layout assertions (section D) across all categories to verify button heights and card layouts."
- "Test the guided path flows (section B) to verify recommendation logic."
