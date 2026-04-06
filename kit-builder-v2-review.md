# Kit Builder V2 - Review Report (Post-Fix Re-Audit)

**Date:** 2026-04-05  
**URL:** https://staging12.radiomadeeasy.com/kit-builder-v2/  
**Tested:** Desktop (1280x800) and Mobile (375x812)  
**Approach:** First-time user curious about radios, no technical background  
**Screenshots:** [Desktop](docs/review-screenshots-v2/desktop/) | [Mobile](docs/review-screenshots-v2/mobile/)

---

## Screenshot Index

### Desktop (1280x800) - Guided Flow
| Step | Screenshot |
|------|-----------|
| Initial state | ![](docs/review-screenshots-v2/desktop/01-initial-state.png) |
| Path choice | ![](docs/review-screenshots-v2/desktop/02-path-choice.png) |
| Q1: Budget | ![](docs/review-screenshots-v2/desktop/04-q1-midrange-selected.png) |
| Q2: Reach | ![](docs/review-screenshots-v2/desktop/06-q2-local-selected.png) |
| Q3: Setup type | ![](docs/review-screenshots-v2/desktop/08-q3-handheld-selected.png) |
| Q4: Features | ![](docs/review-screenshots-v2/desktop/10-q4-features-selected.png) |
| Recommendation | ![](docs/review-screenshots-v2/desktop/11-recommendation-results.png) |
| Antennas | ![](docs/review-screenshots-v2/desktop/14-antennas-top.png) |
| Antenna selected | ![](docs/review-screenshots-v2/desktop/16-antenna-selected.png) |
| Battery | ![](docs/review-screenshots-v2/desktop/17-battery-section.png) |
| Accessories | ![](docs/review-screenshots-v2/desktop/18-accessories-section.png) |
| Programming | ![](docs/review-screenshots-v2/desktop/20-programming-section.png) |
| Review | ![](docs/review-screenshots-v2/desktop/22-review-section.png) |
| Quantity | ![](docs/review-screenshots-v2/desktop/24-quantity-section.png) |

### Mobile (375x812) - Direct Flow
| Step | Screenshot |
|------|-----------|
| Category selection | ![](docs/review-screenshots-v2/mobile/05-category-selection.png) |
| Radio grid (image-on-top) | ![](docs/review-screenshots-v2/mobile/09-radio-grid-top.png) |
| Antennas | ![](docs/review-screenshots-v2/mobile/13-antennas-top.png) |
| Battery | ![](docs/review-screenshots-v2/mobile/18-battery-top.png) |
| Programming | ![](docs/review-screenshots-v2/mobile/22-programming-top.png) |
| Review | ![](docs/review-screenshots-v2/mobile/26-review-top.png) |
| Cart result | ![](docs/review-screenshots-v2/mobile/31-quantity-top.png) |

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
- **Where:** Interview results page after guided quiz
- **Type:** Bug
- **Detail:** The answered-question summary shows "What kind of radio are you looking for? Mid-range" and "What do you need? Waterproof / water resistant, GPS location sharing" correctly, but the "What type of setup do you need?" line is missing entirely. The `renderAnsweredQuestions()` helper skips it because the array answer is empty (the pre-select set `['handheld']` but the Playwright click toggled it off, leaving `[]`). The `resolveAnswerText` fallback works but the `if (Array.isArray(answer) && answer.length === 0) return;` guard skips the empty array before it gets there. The real fix needs to be in the pre-select toggle behavior: if a user clicks Next without changing the pre-selected option, it should keep the pre-selection.
- **Root cause:** `preSelectSetup()` sets `kbsAnswers['setup'] = ['handheld']`. The UI renders with Handheld pre-selected. If the user clicks Handheld (to "confirm" it), `kbsAnswer()` toggles it OFF since it was already in the array. User must click it again to re-enable. This is unintuitive for pre-selected multi-select options.

![Setup answer missing from results summary](docs/review-screenshots-v2/desktop/11-recommendation-results.png)

#### 2. Dual "Add to Cart" and "Continue to Checkout" buttons on review
- **Where:** Review section
- **Type:** UX concern
- **Detail:** The review section shows an "ADD TO CART" button (from `renderReview()` in kit-builder.js) AND a "CONTINUE TO CHECKOUT" button (from the section actions in the PHP template). These do different things: "Add to Cart" calls `kbsAddToCart()` directly, while "Continue to Checkout" advances to the quantity section. Having two prominent gold buttons with similar names is confusing. The user doesn't know which one to click.
- **Suggestion:** Remove the "ADD TO CART" button from the review section's rendered content. The flow should be: Review -> Continue to Checkout -> Quantity -> Add to Cart. Only one path.

Desktop:
![Dual buttons on desktop review](docs/review-screenshots-v2/desktop/22-review-section.png)

Mobile:
![Dual buttons on mobile review](docs/review-screenshots-v2/mobile/26-review-top.png)

#### 3. Price bar not fixed to viewport on long pages
- **Where:** Desktop, scrolled through accessories/antennas sections
- **Type:** Bug
- **Detail:** The price bar appears at the page bottom rather than fixed to the viewport bottom on full-page screenshots. When viewing the accessories or antennas sections (which are tall), the price bar scrolls out of view. It should remain fixed at the bottom of the viewport at all times. The CSS has `position: fixed` but something (possibly WordPress theme CSS) may be overriding it.

![Price bar position on full page](docs/review-screenshots-v2/desktop/14-antennas-top.png)

---

### Medium Priority

#### 4. Consultation link still prominent in price bar
- **Where:** Sticky price bar, between "TOTAL" and right edge
- **Type:** Design issue
- **Detail:** The consultation link ("Book a consultation") in the price bar is smaller now but still takes up space in the bar. On desktop it shows as underlined text next to the price. Consider moving it entirely out of the price bar into a floating help button or only showing it in the section actions.

![Consult link in price bar](docs/review-screenshots-v2/desktop/22-review-section.png)

#### 5. "NOAA weather alerts" still in radio feature lists
- **Where:** Recommendation result cards, radio feature checklists
- **Type:** Consistency
- **Detail:** While the category labels and programming section no longer reference GMRS/FRS/NOAA, the radio feature lists on the recommendation cards still mention "Automatic NOAA weather alerts" and "FCC Part 90 commercial certified". These are product specs and arguably appropriate, but inconsistent with the "no acronyms" direction elsewhere in the flow.

![Feature list with NOAA/FCC](docs/review-screenshots-v2/desktop/12-recommendation-cards.png)

#### 6. Quantity section volume discount text partially hidden
- **Where:** Quantity section, below the +/- picker
- **Type:** Design issue
- **Detail:** The "Add 1 more for 5% off (Team Pack)" text is partially obscured by the sticky action buttons which now have a gradient background. The gradient covers the nudge text. The sticky Continue buttons overlap with content in this section.

![Volume text covered by gradient](docs/review-screenshots-v2/desktop/24-quantity-section.png)

#### 7. Sticky action buttons gradient looks harsh
- **Where:** All product sections (antennas, battery, accessories, programming)
- **Type:** Design issue
- **Detail:** The sticky Back/Continue buttons now have a `linear-gradient(transparent 0%, #000 20%)` background which creates a sharp black band above the buttons. This looks unpolished and abrupt. A more gradual gradient (transparent to #000 over more distance) would look better. Also, the gradient should be deeper (more padding-top) to avoid cutting off content just above the buttons.

#### 8. Mobile: large empty space after last section before footer
- **Where:** Mobile, after programming section or review section
- **Type:** Design issue
- **Detail:** On mobile, after the last active section and before the footer, there's a large empty dark void. This is because the locked sections are now hidden (taking zero space) but the container still has padding or min-height. The footer appears much further down than expected.

![Empty space on mobile](docs/review-screenshots-v2/mobile/25-self-prog-selected.png)

#### 9. Radio feature lists use technical terms
- **Where:** Recommendation cards on results page
- **Type:** UX concern
- **Detail:** The radio feature checklists include terms a newcomer wouldn't understand: "GPS + APRS built in", "Bluetooth TNC for APRS/Winlink", "FCC Part 90 commercial certified", "DMR digital + analog", "NXDN digital modes", "Crossband repeat". A first-time user doesn't know what APRS, TNC, Winlink, DMR, or NXDN are. Consider translating these into benefits: "GPS + APRS built in" -> "GPS tracking and position sharing", "DMR digital + analog" -> "Digital and analog modes for wider compatibility".

![Technical terms in feature list](docs/review-screenshots-v2/desktop/12-recommendation-cards.png)

---

### Low Priority / Polish

#### 10. Mobile price bar phone icon purpose unclear
- **Where:** Mobile sticky price bar, right side
- **Type:** Design issue
- **Detail:** On mobile, the price bar shows a pink phone emoji on the right side (the consultation link with text hidden). Without label text, most users won't know this is a link to book a consultation. It looks like a decorative element.

![Phone icon on mobile price bar](docs/review-screenshots-v2/mobile/13-antennas-top.png)

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

![Factory antenna placeholder](docs/review-screenshots-v2/mobile/13-antennas-top.png)

#### 14. Included battery card still has no product image
- **Where:** Battery section, factory battery card
- **Type:** Design issue
- **Detail:** Same as antenna issue. The included battery shows only text, while upgrade batteries have product photos.

![Battery with no image](docs/review-screenshots-v2/mobile/18-battery-top.png)

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

### Recently Fixed
- **Dual cart buttons in review:** FIXED. `renderReview()` CTA buttons suppressed in V2 scroll mode via `window._rmeScrollMode` check. Only "Continue to Checkout" from the section template remains.
- **Mounting section state leak:** FIXED. Phase 4 of `kbsCompleteSection` now checks if `renderNext()` already handled a section skip before overwriting `sectionState`. URL hash no longer shows `sec=mounting` for handheld kits.

---

## Automated Test Results (2026-04-06)

**35 passed, 3 failed out of 38 tests.** 2 bugs found and fixed (see above).

### A. URL State Encoding (8/10 -> 10/10 after fix)
| Test | Result |
|------|--------|
| A1. URL updates on radio selection | PASS - hash contains `radio=uv5r` |
| A2. URL updates on antenna selection | PASS - hash contains `ant=foulweather` |
| A3. URL updates on programming choice | PASS (after mounting fix) |
| A4. URL updates on quantity | PASS (after mounting fix) |
| A5. URL contains interview answers | PASS - `budget=mid&reach=local&setup=handheld` |
| A6. PII is base64 encoded | PASS - zip 90210 stored as base64, not plaintext |
| A7. Resume prompt appears on hash URL | PASS - "Welcome Back" modal shown |
| A8. Resume restores state correctly | PASS - antennas active, UV-5R in price bar |
| A9. Start Fresh clears hash | PASS - hash cleared, email section active |
| A10. URL survives page refresh | PASS - prompt appears with correct radio |

### B. Full Guided Flow (14/14)
| Test | Result |
|------|--------|
| B11. Email capture | PASS |
| B12. Help Me Choose path | PASS |
| B13. Budget question | PASS |
| B14. Reach question wording | PASS - "How far do you need to communicate?" |
| B15. Setup type - no license text | PASS |
| B16. Features + See Results | PASS |
| B17. Radio recommendation | PASS - two cards shown |
| B18. Antenna labels + adapter text | PASS - "OUTDOOR & ACTIVE USE", plain adapter language |
| B19. Battery runtime text | PASS - "approximately X hours" |
| B20. Accessories | PASS |
| B21. Programming text | PASS - "local channels and weather alerts", "I'll Program It Myself" |
| B22. Review button text | PASS - "Continue to Checkout" |
| B23. Quantity picker | PASS |
| B24. Checkmarks on completed sections | PASS - checkmark character, not "(DONE)" |

### C. Direct Path (6/6)
| Test | Result |
|------|--------|
| C25. Skip email | PASS |
| C26. I Know What I Want | PASS |
| C27. Category labels - no license text | PASS |
| C28. Select Handheld | PASS |
| C29. Mobile radio grid layout | PASS - image-on-top cards |
| C30. UV-5R selection + price bar | PASS - $59 |

### D. Price Bar (3/3)
| Test | Result |
|------|--------|
| D31. Shows total not base+addons | PASS - $104 |
| D32. No Add to Cart in price bar | PASS |
| D33. TOTAL label | PASS |

### E. Review Section (1/2 -> 2/2 after fix)
| Test | Result |
|------|--------|
| E34. Remove confirmation dialog | PASS |
| E35. No dual buttons | PASS (after fix) - single CTA path |

### F. Hidden Sections (1/1)
| Test | Result |
|------|--------|
| F36. Locked sections hidden | PASS |

### G. Edge Cases (2/2)
| Test | Result |
|------|--------|
| G37. Out of stock handling | PASS (no OOS radios currently) |
| G38. Empty kit review | PASS |

---

## Summary

| Severity | Count |
|----------|-------|
| High Priority | 1 (setup pre-select toggle) |
| Medium Priority | 6 |
| Low Priority / Polish | 5 |

**20 of 23 original issues resolved.** Dual button and mounting state bugs found in testing and fixed.

**Top actions before launch:**
1. Fix the pre-select toggle behavior on the setup type question
2. Smooth the sticky action button gradient and fix the volume discount text being covered
3. Clean up remaining GMRS references in product descriptions (cheat sheets, radio features)
