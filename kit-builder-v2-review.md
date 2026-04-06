# Kit Builder V2 - Review Report (Post-Fix Re-Audit)

**Date:** 2026-04-05  
**URL:** https://staging12.radiomadeeasy.com/kit-builder-v2/  
**Tested:** Desktop (1280x800) and Mobile (375x812)  
**Approach:** First-time user curious about radios, no technical background  
**Screenshots:** [Desktop](docs/review-screenshots-v2/desktop/) | [Mobile](docs/review-screenshots-v2/mobile/)

---

## Previous Issues - Resolved

The following items from the first audit have been fixed and verified:

| # | Issue | Status |
|---|-------|--------|
| 1 | Page title said "KIT BUILDER V2" | Fixed - now says "KIT BUILDER" |
| 2 | Setup type answer blank in summary | Fixed - fallback label lookup added |
| 3 | Price bar "Add to Cart" ghosted/confusing | Fixed - removed from price bar entirely |
| 4 | Mobile price bar missing Add to Cart | Resolved - price bar now shows total only |
| 5 | License/acronym references | Fixed - no "license required", GMRS, FRS references in flow |
| 7 | Continue buttons hidden below fold | Fixed - sticky buttons above price bar |
| 8 | BNC adapter jargon | Fixed - plain language ("adapter your radio needs") |
| 9 | Antenna BEST FOR labels | Fixed - "Outdoor & Active Use", "Keeping a Low Profile", etc. |
| 10 | No battery runtime info | Fixed - "Lasts approximately 8-12 hours" on all batteries |
| 11 | Reach question ambiguous | Fixed - "How far do you need to communicate?" + "Just listening" |
| 12 | Locked sections overwhelming | Fixed - locked sections fully hidden |
| 13 | "(DONE)" label plain text | Fixed - green checkmark icon |
| 14 | Mobile radio grid small images | Fixed - image-on-top card layout, much larger photos |
| 15 | Price bar showed base + addons | Fixed - shows computed total |
| 16 | "Skip Programming" alarming | Fixed - "I'll Program It Myself" with friendly description |
| 17 | No confirmation on review removes | Fixed - confirm() dialog added |
| 18 | "Looks Good" button ambiguous | Fixed - "Continue to Checkout" |

---

## Remaining & Newly Identified Issues

### High Priority

#### 1. Setup type answer STILL blank in guided recommendation summary
- **Where:** Interview results page after guided quiz (desktop screenshot 11)
- **Type:** Bug
- **Detail:** The answered-question summary shows "What kind of radio are you looking for? Mid-range" and "What do you need? Waterproof / water resistant, GPS location sharing" correctly, but the "What type of setup do you need?" line is missing entirely. The `renderAnsweredQuestions()` helper skips it because the array answer is empty (the pre-select set `['handheld']` but the Playwright click toggled it off, leaving `[]`). The `resolveAnswerText` fallback works but the `if (Array.isArray(answer) && answer.length === 0) return;` guard skips the empty array before it gets there. The real fix needs to be in the pre-select toggle behavior: if a user clicks Next without changing the pre-selected option, it should keep the pre-selection.
- **Root cause:** `preSelectSetup()` sets `kbsAnswers['setup'] = ['handheld']`. The UI renders with Handheld pre-selected. If the user clicks Handheld (to "confirm" it), `kbsAnswer()` toggles it OFF since it was already in the array. User must click it again to re-enable. This is unintuitive for pre-selected multi-select options.

#### 2. Dual "Add to Cart" and "Continue to Checkout" buttons on review
- **Where:** Review section (desktop screenshot 22, mobile screenshot 26-29)
- **Type:** UX concern
- **Detail:** The review section shows an "ADD TO CART" button (from `renderReview()` in kit-builder.js) AND a "CONTINUE TO CHECKOUT" button (from the section actions in the PHP template). These do different things: "Add to Cart" calls `kbsAddToCart()` directly, while "Continue to Checkout" advances to the quantity section. Having two prominent gold buttons with similar names is confusing. The user doesn't know which one to click.
- **Suggestion:** Remove the "ADD TO CART" button from the review section's rendered content. The flow should be: Review -> Continue to Checkout -> Quantity -> Add to Cart. Only one path.

#### 3. Price bar not fixed to viewport on long pages
- **Where:** Desktop, scrolled through accessories/antennas sections
- **Type:** Bug
- **Detail:** The price bar appears at the page bottom rather than fixed to the viewport bottom on full-page screenshots. When viewing the accessories or antennas sections (which are tall), the price bar scrolls out of view. It should remain fixed at the bottom of the viewport at all times. The CSS has `position: fixed` but something (possibly WordPress theme CSS) may be overriding it.

---

### Medium Priority

#### 4. Consultation link still prominent in price bar
- **Where:** Sticky price bar, between "TOTAL" and right edge
- **Type:** Design issue
- **Detail:** The consultation link ("Book a consultation") in the price bar is smaller now but still takes up space in the bar. On desktop it shows as underlined text next to the price. Consider moving it entirely out of the price bar into a floating help button or only showing it in the section actions.
- **Screenshot:** Desktop screenshot 22 (review section)

#### 5. "NOAA weather alerts" still in radio feature lists
- **Where:** Recommendation result cards, radio feature checklists
- **Type:** Consistency
- **Detail:** While the category labels and programming section no longer reference GMRS/FRS/NOAA, the radio feature lists on the recommendation cards still mention "Automatic NOAA weather alerts" and "FCC Part 90 commercial certified". These are product specs and arguably appropriate, but inconsistent with the "no acronyms" direction elsewhere in the flow.

#### 6. Quantity section volume discount text partially hidden
- **Where:** Quantity section, below the +/- picker (desktop screenshot 24)
- **Type:** Design issue
- **Detail:** The "Add 1 more for 5% off (Team Pack)" text is partially obscured by the sticky action buttons which now have a gradient background. The gradient covers the nudge text. The sticky Continue buttons overlap with content in this section.

#### 7. Sticky action buttons gradient looks harsh
- **Where:** All product sections (antennas, battery, accessories, programming)
- **Type:** Design issue
- **Detail:** The sticky Back/Continue buttons now have a `linear-gradient(transparent 0%, #000 20%)` background which creates a sharp black band above the buttons. This looks unpolished and abrupt. A more gradual gradient (transparent to #000 over more distance) would look better. Also, the gradient should be deeper (more padding-top) to avoid cutting off content just above the buttons.

#### 8. Mobile: large empty space after last section before footer
- **Where:** Mobile, after programming section or review section (screenshot 25)
- **Type:** Design issue
- **Detail:** On mobile, after the last active section and before the footer, there's a large empty dark void. This is because the locked sections are now hidden (taking zero space) but the container still has padding or min-height. The footer appears much further down than expected.

#### 9. Radio feature lists use technical terms
- **Where:** Recommendation cards on results page
- **Type:** UX concern
- **Detail:** The radio feature checklists include terms a newcomer wouldn't understand: "GPS + APRS built in", "Bluetooth TNC for APRS/Winlink", "FCC Part 90 commercial certified", "DMR digital + analog", "NXDN digital modes", "Crossband repeat". A first-time user doesn't know what APRS, TNC, Winlink, DMR, or NXDN are. Consider translating these into benefits: "GPS + APRS built in" -> "GPS tracking and position sharing", "DMR digital + analog" -> "Digital and analog modes for wider compatibility".

---

### Low Priority / Polish

#### 10. Mobile price bar phone icon purpose unclear
- **Where:** Mobile sticky price bar, right side
- **Type:** Design issue
- **Detail:** On mobile, the price bar shows a pink phone emoji on the right side (the consultation link with text hidden). Without label text, most users won't know this is a link to book a consultation. It looks like a decorative element.

#### 11. Completed section checkmarks vary in color
- **Where:** Completed section headers
- **Type:** Design issue
- **Detail:** The checkmark icons on completed sections appear in green (#6a6), which is good, but the section header text color (#8aaa8a) and the checkmark don't quite match. Minor polish item.

#### 12. "Cheat Sheets" description still mentions GMRS
- **Where:** Accessories section, Radio Cheat Sheets product
- **Type:** Consistency
- **Detail:** The cheat sheets description says "Common frequencies, GMRS channels, NATO phonetic alphabet, and emergency procedures." This is one of the remaining GMRS references in the product data. Consider simplifying to "Common frequencies, radio channels, NATO phonetic alphabet, and emergency procedures."

#### 13. Factory antenna still uses placeholder SVG icon
- **Where:** Antenna section, included "Factory Antenna" card
- **Type:** Design issue
- **Detail:** The factory antenna card still shows a gray SVG placeholder icon rather than a real photo. All upgrade antennas have photos. A real photo would make the included item feel more valuable.

#### 14. Included battery card still has no product image
- **Where:** Battery section, factory battery card
- **Type:** Design issue
- **Detail:** Same as antenna issue. The included battery shows only text, while upgrade batteries have product photos.

---

## Logic Review Update

### Verified Working
- All handheld option combinations: radio selection, antenna add/remove, battery quantity, accessory selection, programming choices
- Price bar updates correctly with all add/remove actions
- Cross-category discount (5% on 2nd+ kit) calculates correctly
- Volume discount tiers apply at correct thresholds
- Multi-location programming adds $10 correctly
- Review remove confirmation dialog appears on all remove buttons
- "Continue to Checkout" button advances to quantity section
- Cart submission sends correct items to WooCommerce

### Still Needs Attention
- **Pre-select toggle on setup question:** When `preSelectSetup()` pre-selects "Handheld" based on reach answers, clicking the pre-selected option toggles it OFF rather than confirming it. This means users who click the highlighted option to "confirm" their choice accidentally deselect it. Fix: either don't count clicks on pre-selected items as toggles, or add a visual indicator that the option is already selected.
- **Dual cart buttons in review:** The review section has both "ADD TO CART" (from renderReview) and "CONTINUE TO CHECKOUT" (from section template). These need to be consolidated into a single flow path.

---

## Summary

| Severity | Count |
|----------|-------|
| High Priority | 3 |
| Medium Priority | 6 |
| Low Priority / Polish | 5 |

**18 of 23 original issues resolved.** 3 new issues identified, plus 2 carried forward (setup answer still blank in edge case, dual buttons in review).

**Top 3 actions before launch:**
1. Fix the dual button situation in the review section (remove "ADD TO CART" from renderReview, let the flow go Review -> Quantity -> Add to Cart)
2. Fix the pre-select toggle behavior on the setup type question so clicking a pre-selected option doesn't deselect it
3. Smooth the sticky action button gradient and fix the volume discount text being covered
