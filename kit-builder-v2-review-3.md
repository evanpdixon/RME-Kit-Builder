# Kit Builder V2 - Review Report #3

**Date:** 2026-04-06
**URL:** https://staging12.radiomadeeasy.com/kit-builder-v2/
**Tested:** Desktop (1280x800) and Mobile (375x812)
**Approach:** First-time user curious about radios, no technical background
**Test method:** Puppeteer automation + manual screenshot review
**Screenshots:** [Desktop](docs/review3-screenshots/desktop/) | [Mobile](docs/review3-screenshots/mobile/)

---

## Test Coverage

| Path | Category | Radios Tested | Desktop | Mobile |
|------|----------|---------------|---------|--------|
| Direct | Handheld | UV-5R, UV-5R Mini, UV-PRO, DMR 6X2 PRO, DA-7X2 | PASS | PASS |
| Direct | Vehicle | UV-50PRO, D578 | PASS | PASS |
| Direct | Base Station | D578 | PASS | PASS |
| Direct | HF | G90, FT-891 | PASS | PASS |
| Direct | Scanner | SDR, SDS200 | **FAIL** | **FAIL** |
| Guided | Budget/Nearby | Auto-recommend | PASS | PASS |
| Guided | Mid/Local | Auto-recommend (waterproof + GPS) | PASS | PASS |
| Guided | High/Far | Auto-recommend (HF redirect) | PASS* | PASS* |
| Guided | Mid/Multi-reach | Auto-recommend (bluetooth) | PASS | PASS |
| Guided | Budget/Listen | Auto-recommend (Scanner redirect) | PASS* | PASS* |
| Edge | Skip all optional | UV-5R Mini, no upgrades, self-program | PASS | PASS |
| Edge | Re-edit section | Change radio mid-flow | PASS | PASS |
| Edge | Multi-category | Handheld + Vehicle | PASS | PASS |
| Edge | Back navigation | Battery -> Antennas | PASS | PASS |
| Edge | Sticky elements | Price bar, action buttons | PASS | PASS |

\* Guided HF/Scanner paths correctly redirect to category-specific radio selection, but use a different card layout than handheld guided. The flow works, but the page structure differs.

**44 test runs total (22 desktop + 22 mobile). 42 passed, 2 failed (scanner flow).**

---

## Issues by Severity

### HIGH - Bugs

#### 1. Scanner flow breaks after antenna section
- **Where:** Scanner category (both SDR and SDS200), after completing antennas
- **Type:** Bug
- **Affects:** Desktop and Mobile
- **Detail:** After completing the antenna section in the scanner flow, the state machine transitions to the battery section. But battery has `display: none` for scanners (correctly hidden since scanners don't have batteries). The section enters `loading` state but never reaches `active` because the hidden element can't complete its transition. All downstream sections (accessories, programming, review, quantity) remain locked. The user is stuck.
- **Root cause:** `kbsCompleteSection()` in `kit-builder-scroll.js` skips mounting for non-vehicle/base categories (lines 69-86) but has no equivalent skip logic for battery when `sec-battery` is hidden. The mounting skip checks `kbsCurrentCategory`, but the battery section has no similar guard.
- **Fix:** Add a battery skip check analogous to the mounting skip. When `kbsCurrentCategory === 'scanner'` (and potentially other categories that hide battery), skip from antennas directly to accessories, the same way mounting skips to antennas for handheld.

Desktop:
![Scanner stuck after antennas](docs/review3-screenshots/desktop/100-d-scanner-antennas.png)

---

### MEDIUM - UX Concerns

#### 2. Technical jargon in radio feature lists
- **Where:** Recommendation cards and radio grid (all categories)
- **Type:** UX concern
- **Affects:** Desktop and Mobile
- **Detail:** Radio feature checklists contain terms a first-time user won't understand:
  - "GPS + APRS built in" - APRS is unexplained
  - "Bluetooth TNC for APRS/Winlink" - TNC and Winlink are undefined
  - "FCC Part 90 commercial certified" - Part 90 is regulatory jargon
  - "DMR digital + analog" - DMR is undefined
  - "NXDN digital modes" - NXDN is undefined
  - "Crossband repeat" - not explained
  - "P25 Phase I & II, DMR, EDACS, NXDN" (scanner cards) - alphabet soup
- **Suggestion:** Translate technical features into benefits. "GPS + APRS built in" becomes "GPS tracking and position sharing". "DMR digital + analog" becomes "Digital and analog modes for wider compatibility". "Crossband repeat" becomes "Built-in range extender". Scanner terms could be simplified to "Decodes all major digital radio systems".

Desktop (mid/local guided):
![Jargon in recommendations](docs/review3-screenshots/desktop/048-g-mid-local-recommendation.png)

#### 3. Technical jargon in vehicle/base/HF antenna sections
- **Where:** Antenna section for vehicle, base station, and HF categories
- **Type:** UX concern
- **Affects:** Desktop and Mobile
- **Detail:** Non-handheld antenna sections reference:
  - "FRS/GMRS, MURS" (vehicle antenna descriptions)
  - "NMO" mount type and "SO-239" / "PL-259" connector types
  - "SMA" and "BNC" connector types (handheld/scanner antennas)
  - Frequency specs like "VHF 140-160MHz, UHF 435-465MHz"
- **Note:** Some of these are product-identifying specs that distinguish options. Consider adding a plain-language subtitle: "NMO Antenna" becomes "NMO Antenna (permanent mount style)". Frequency ranges could be removed from the kit builder card and left on the product page.

Desktop (vehicle antennas):
![Vehicle antenna jargon](docs/review3-screenshots/desktop/066-d-vehicle-antennas.png)

#### 4. Programming section mentions "license" for DMR radios
- **Where:** Programming section when DMR 6X2 PRO or DA-7X2 is selected
- **Type:** UX concern
- **Affects:** Desktop and Mobile
- **Detail:** The Brandmeister DMR ID section says "amateur radio license holders only". While technically accurate, a curious beginner who doesn't have a license may feel the product isn't for them, or that they're doing something wrong by being in this section. The text is conditional (only appears for DMR radios) and is marked "optional", so the impact is limited.
- **Suggestion:** Reword to "Have a ham radio license? Enter your Brandmeister ID and we'll set up DMR digital voice." The word "optional" is already present, but leading with the positive ("Have a license?") rather than the restriction ("license holders only") feels less gatekeeping.

Desktop (DMR 6X2 PRO):
![License text in programming](docs/review3-screenshots/desktop/030-d-hh-dmr-6x2-programming.png)

#### 5. Volume discount nudge text partially obscured
- **Where:** Quantity section, below the +/- picker
- **Type:** UX concern
- **Affects:** Desktop and Mobile
- **Detail:** The "Add 1 more for 5% off (Team Pack)" text sits directly behind the sticky Back/Add to Cart buttons. The text is partially covered by the button area. A user would need to scroll to see it, but the section is short enough that it looks "complete" with the buttons visible.
- **Previously reported:** Review #2 issue #6. Still present.

Desktop (quantity):
![Volume text obscured](docs/review3-screenshots/desktop/117-e-multicat-after-cart.png)

---

### LOW - Polish

#### 6. Technical jargon in accessory descriptions
- **Where:** Accessories section across all categories
- **Type:** Consistency
- **Affects:** Desktop and Mobile
- **Detail:** Accessory product descriptions contain:
  - "GMRS channels" in Radio Cheat Sheets description
  - "APRS/Winlink" in speakermic descriptions
  - "SO-239", "PL-259" connector references in pigtail adapters
  - "DMR" in DMR ID-specific accessories
- **Note:** These are less impactful than the radio feature jargon because accessories are shown after the user has already chosen a radio. The user is deeper in the flow and more committed. Still, consistency with the "no jargon" direction elsewhere would improve the experience.

Desktop (handheld accessories):
![Accessory jargon](docs/review3-screenshots/desktop/005-d-hh-uv5r-accessories.png)

#### 7. Factory antenna uses placeholder SVG icon
- **Where:** Antenna section, "Factory Antenna" card (handheld category)
- **Type:** Design
- **Affects:** Desktop and Mobile
- **Detail:** The factory/included antenna card shows a gray SVG placeholder icon while all upgrade antennas have real product photos. This makes the included item look less legitimate.
- **Previously reported:** Review #2 issue #13. Still present.

Mobile (UV-5R antennas):
![Factory antenna placeholder](docs/review3-screenshots/mobile/122-d-hh-uv5r-antennas.png)

#### 8. Large empty space below content on mobile
- **Where:** Below the last active section, before the footer (mobile only)
- **Type:** Layout
- **Affects:** Mobile only
- **Detail:** Approximately 1000px of empty dark space between the last visible section and the footer. The hidden locked sections take zero height but the page container still has excess space. Footer is visible only after significant scrolling past nothing.
- **Previously reported:** Review #2 issue #8. Still present. Gap measured at 1004px.

Mobile (scrolled to bottom):
![Empty space on mobile](docs/review3-screenshots/mobile/239-e-sticky-bottom.png)

#### 9. Scanner antenna section shows discone antenna placeholder
- **Where:** Antenna section, scanner category
- **Type:** Design
- **Affects:** Desktop and Mobile
- **Detail:** Both scanner antenna cards (Wideband Discone and Telescoping Wideband) use the same gray SVG placeholder instead of product photos.

Desktop (scanner antennas):
![Scanner antenna placeholders](docs/review3-screenshots/desktop/100-d-scanner-antennas.png)

---

## What's Working Well

These items from previous reviews are confirmed fixed and working:

| Area | Status |
|------|--------|
| Page title says "KIT BUILDER" (not V2) | Confirmed |
| Price bar shows computed total (not base + addons) | Confirmed |
| Price bar position: fixed, visible at all steps | Confirmed on all desktop/mobile tests |
| "Continue to Checkout" is sole CTA in review (no dual buttons) | Confirmed |
| Locked sections fully hidden | Confirmed |
| Green checkmark on completed sections | Confirmed |
| Mobile radio grid uses image-on-top card layout | Confirmed |
| "I'll Program It Myself" friendly wording | Confirmed |
| Antenna "BEST FOR" labels present | Confirmed |
| Battery runtime text present | Confirmed |
| Remove confirmation dialog in review | Confirmed |
| Back navigation works correctly | Confirmed (battery -> antennas) |
| Re-edit section locks downstream sections | Confirmed |
| Re-edit section re-renders correct products | Confirmed |
| Volume discount tiers calculate correctly | Confirmed |
| Cross-category discount mentioned | Confirmed |
| Programming carry-forward between categories | Confirmed |
| Mounting section correctly skipped for handheld/HF | Confirmed |
| Vehicle/base mounting section renders correctly | Confirmed |
| All 5 handheld radios selectable and flow through | Confirmed |
| Both vehicle radios selectable and flow through | Confirmed |
| Both HF radios selectable and flow through | Confirmed |
| All 4 scanner radios visible in grid | Confirmed |
| Guided path correctly detects HF for "far" reach | Confirmed |
| Guided path correctly detects Scanner for "listen" | Confirmed |
| Guided mid/local recommends UV-PRO + DMR 6X2 PRO (waterproof + GPS match) | Confirmed |
| Minimal kit (UV-5R Mini, no upgrades, self-program) prices correctly at $39 | Confirmed |

---

## Summary

| Severity | Count | New vs. Previous |
|----------|-------|------------------|
| High (Bug) | 1 | NEW: Scanner flow stuck after antennas |
| Medium (UX) | 4 | 3 carried from review #2, 1 new (scanner-related jargon) |
| Low (Polish) | 4 | All carried from review #2 |

**Top priorities before launch:**
1. **Fix scanner battery skip** - This is a blocker. Scanner users cannot complete a kit. Add battery skip logic in `kbsCompleteSection()` analogous to the mounting skip.
2. **Simplify radio feature jargon** - Translate technical terms to benefits in the recommendation card feature lists. This is the primary "first-time user" friction point.
3. **Replace placeholder images** - Factory antenna, factory battery, and scanner antennas still use SVG placeholders.

---

## Test Artifacts

- **Audit script:** `audit-v2-review3.js`
- **Raw issues JSON:** `review3-issues.json`
- **Screenshots:** `docs/review3-screenshots/desktop/` (119 images) and `docs/review3-screenshots/mobile/` (120 images)
