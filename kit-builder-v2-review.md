# Kit Builder V2 - Full Review Report

**Date:** 2026-04-05  
**URL:** https://staging12.radiomadeeasy.com/kit-builder-v2/  
**Tested:** Desktop (1280x800) and Mobile (375x812)  
**Approach:** First-time user curious about radios, no technical background  

---

## Critical / Bugs

### 1. Page title says "KIT BUILDER V2" - not production-ready
- **Where:** Page heading, visible on both desktop and mobile
- **Type:** Bug
- **Detail:** The H1 says "KIT BUILDER V2" which is an internal development label. This should say something customer-facing like "BUILD YOUR RADIO KIT" or "KIT BUILDER" before going to production.

### 2. "Setup type" answer displays blank in guided flow summary
- **Where:** Interview results screen, desktop screenshot 15
- **Type:** Bug
- **Detail:** After answering all guided interview questions, the answered-question summary shows `What type of setup do you need?` with NO answer text beside it (the yellow span is empty). The other questions correctly show their answers ("Mid-range", "Local", "Waterproof / water resistant, GPS location sharing"). This is because the `setup` question uses `multi: true` and the answer is stored, but when rendering the summary the answer text is not being populated. Looking at the code, the setup question options have `tags: []` (empty tags), so tag collection works, but the issue is likely that `kbsAnswers['setup']` is populated from `preSelectSetup()` (which sets values like `['handheld']`) but the summary renderer can't match these to option labels because the question object isn't consistently referenced.
- **Impact:** User sees their other answers confirmed but "setup type" looks like it was skipped, which is confusing.
- **Screenshot:** `desktop/15-interview-results-top.png`

### 3. Price bar "ADD TO CART" text is cut off / barely visible on desktop
- **Where:** Sticky bottom price bar, right side
- **Type:** Design issue / Bug
- **Detail:** The "ADD TO CART" text in the sticky price bar at the bottom of the screen appears extremely faded/ghosted (nearly invisible against the dark background). It looks like the button is in a disabled state even when the user is mid-flow. The cart icon is visible but the text beside it is barely readable. This is confusing because the user might think they can add to cart from the bar at any time, but the button appearance doesn't communicate its state clearly.
- **Screenshots:** `desktop/19-antennas-section.png`, `desktop/22-battery-section.png`

### 4. Mobile price bar missing "Add to Cart" entirely
- **Where:** Sticky bottom bar on mobile (375px)
- **Type:** Bug
- **Detail:** On mobile, the sticky bottom bar shows "UV-5R / SUBTOTAL / $59" on the left and a pink phone icon on the right, but there is no "Add to Cart" button or text visible at all. The bar is also quite cramped. Compare with desktop where at least the ghosted text is present.
- **Screenshot:** `mobile/18-antenna-section.png`, `mobile/23-battery-section.png`

---

## High Priority / UX Concerns

### 5. No explanation of what "GMRS" or radio licensing means
- **Where:** Throughout the flow, but especially at the interview/category selection
- **Type:** UX concern
- **Detail:** As a newcomer curious about radios, I'm immediately confronted with category choices like "HF (Long-Distance) - amateur license required" and "Scanner / SDR" without any explanation of what these licenses cost, how to get them, or what GMRS even is. The programming section mentions "GMRS, FRS, NOAA weather" without explaining these acronyms. A first-time user would likely wonder: "Do I need a license for a handheld? What's FRS vs GMRS?" A brief tooltip, expandable FAQ, or one-liner per category would help enormously.

### 6. "Book a consultation" link placement feels like abandonment
- **Where:** Price bar on desktop, interview question navigation, results page
- **Type:** UX concern
- **Detail:** The "Book a consultation" link appears in the sticky price bar between the price and the cart button, and also next to every Back/Next button pair. Its prominent placement in the price bar especially feels like it's encouraging users to leave the flow. This could be moved to a less prominent position (e.g., the review section or a help icon) so it's available but not competing with the primary conversion path.

### 7. No "Continue" / "Next" button visible on antenna, battery, and accessories sections
- **Where:** Antenna, battery, and accessories steps on desktop (viewport-level screenshots)
- **Type:** UX concern
- **Detail:** When viewing these sections at viewport level (not scrolled to the bottom), there's no visible "Continue" or "Skip" button. The Back/Continue buttons are below the fold if there are many product options. A user who doesn't want any antenna upgrades might not realize they need to scroll down past all the options to find the "Continue" button. Consider making the Continue button sticky or more visually prominent. The full-page antenna screenshot shows the buttons are at the very bottom after 10+ products.
- **Screenshots:** `desktop/19-antennas-section.png` (no buttons visible), `desktop/20-antennas-fullpage.png` (buttons at very bottom)

### 8. BNC adapter auto-add may confuse beginners
- **Where:** Antenna section, after selecting any BNC antenna
- **Type:** UX concern
- **Detail:** When selecting a BNC antenna, a green banner appears: "SMA-F to BNC-F Adapter ($5) will be added once to your order, shared by all BNC antennas below." This is technically correct but a radio newbie has no idea what SMA-F, BNC-F, or adapters are. They might worry they're being upsold something unnecessary. A friendlier message like "Your radio needs a small adapter to use this antenna. We'll include one ($5) automatically." would be clearer.
- **Screenshot:** `desktop/21-antennas-after-selection.png`

### 9. Antenna "BEST FOR" labels assume knowledge
- **Where:** Antenna selection cards
- **Type:** UX concern  
- **Detail:** Labels like "BEST FOR: CHEST RIGS & FIELD USE", "BEST FOR: COVERT CARRY", and "BEST FOR: BODY-WORN SETUPS" assume the user knows what chest rigs are and why they'd want covert carry. As a curious newcomer, I don't know what a "chest rig" is in a radio context. More approachable labels like "BEST FOR: OUTDOOR ACTIVITIES" or "BEST FOR: KEEPING A LOW PROFILE" would help.

### 10. Battery section doesn't explain why you'd want a spare
- **Where:** Battery upgrade section
- **Type:** UX concern
- **Detail:** The battery section says "Add spares for extended runtime in the field" and "Grab a spare battery to swap in the field without waiting to recharge." But it doesn't answer the key question a newbie would have: "How long does the factory battery last?" Without knowing the baseline runtime, the user can't judge whether they need a spare. Adding "Factory battery lasts approximately X hours of typical use" would help.

### 11. Interview question "Who are you trying to reach?" is ambiguous
- **Where:** Interview Q2 (reach question)
- **Type:** UX concern
- **Detail:** The question "Who are you trying to reach?" with options like "Nearby", "Local", "Long distance", "Listen only" mixes distance concepts with use cases. "Listen only" isn't about reaching anyone. The question would be clearer as "How far do you need to communicate?" with "Listen only" as a separate path option. Also, "Nearby - Same property, group, or event" vs "Local - Across town, neighboring cities, through repeaters" might not be clear to someone who doesn't know what repeaters do.

---

## Medium Priority / Design Issues

### 12. Section number badges are inconsistently visible
- **Where:** Locked sections below active section
- **Type:** Design issue
- **Detail:** The numbered circle badges (1, 2, 3...) on locked sections have very low contrast. The gold circle with gold text on a near-black background at 35% opacity is hard to read. Users who scan ahead to see what steps are coming can barely read the section titles.

### 13. "(DONE)" label on completed sections is plain and unpolished
- **Where:** Right side of every completed section header
- **Type:** Design issue
- **Detail:** Completed sections show "(DONE)" in plain parenthesized text aligned to the right. This looks like debug output, not a polished status indicator. A checkmark icon or a small green "Complete" badge would look more intentional.

### 14. Mobile radio grid cards are text-heavy with small images
- **Where:** Radio selection grid on mobile
- **Type:** Design issue
- **Detail:** On mobile (375px), the radio cards show a small image on the left and text on the right (name, price, tagline). The images are quite small and hard to evaluate. For a product where visual appearance matters (carrying a radio), larger images or a card layout with the image on top would help users choose.
- **Screenshot:** `mobile/13-radio-section.png`

### 15. Price bar layout on desktop wastes horizontal space
- **Where:** Sticky bottom price bar
- **Type:** Design issue
- **Detail:** The price bar layout is: `[Radio Name / SUBTOTAL / $159 + $45] ... [Book consultation] ... [cart icon ADD TO CART]`. The "Book a consultation" button sits in the middle consuming valuable real estate. The price display uses "$159 + $45" which doesn't show the total until you do math. Showing "$204 total" (or at minimum "$159 base + $45 add-ons = $204") would be clearer.

### 16. "Skip Programming. Ship Immediately" option name is alarming
- **Where:** Programming section, third option
- **Type:** UX concern
- **Detail:** For a beginner who doesn't understand programming, seeing "Skip Programming. Ship Immediately" with "Radio ships with factory default channels only" sounds like they'll get a broken/useless radio. The current description says "Choose this if you plan to program it yourself via CHIRP or another method" which assumes familiarity with CHIRP. Most newcomers will be scared away from this option, which is probably fine, but the name could be gentler: "I'll program it myself" with a note that programming software is free.

### 17. Review section "x" remove buttons have no confirmation
- **Where:** Review step, remove (x) buttons on each item
- **Type:** UX concern
- **Detail:** Each item in the review has an (x) button that presumably removes it instantly. There's no undo or confirmation. If a user accidentally taps (x) on mobile (easy to do with the small touch target), they lose their selection and need to go back to re-add it.

### 18. "Looks Good" button on review is ambiguous
- **Where:** Review section, bottom buttons
- **Type:** UX concern
- **Detail:** The review section has "Back" and "LOOKS GOOD" buttons. "Looks Good" advances to the quantity step but doesn't add to cart. A user might think "Looks Good" means "I'm done, buy this." The button could say "CONTINUE TO CHECKOUT" or "SET QUANTITY" to be clearer about what happens next.

---

## Low Priority / Polish

### 19. "Add 1 more for 5% off (Team Pack)" nudge text style
- **Where:** Quantity section
- **Type:** Design issue
- **Detail:** The volume discount nudge "Add 1 more for 5% off (Team Pack)" is in italic gray text. It's functional but could be more attention-grabbing with a small badge or color accent since it's a conversion-driving message.

### 20. Factory antenna card uses a placeholder SVG icon
- **Where:** Antenna section, "Factory Antenna" card
- **Type:** Design issue
- **Detail:** The factory antenna that's "Included" shows a gray SVG placeholder icon rather than a photo. While the upgrade antennas have real product photos, the included factory antenna has a generic icon. This creates visual inconsistency and makes the included item look less valuable.
- **Screenshot:** `desktop/19-antennas-section.png`

### 21. Included battery card has no product image
- **Where:** Battery section, factory battery card
- **Type:** Design issue
- **Detail:** Similar to the antenna issue, the "Factory Battery (1800mAh)" card (or "USB-C Rechargeable Battery (2600mAh)" for UV-PRO) has no product image, just text. The upgrade batteries have images. Adding an image of the included battery would make the section feel more complete.

### 22. "Need your own private frequencies for secure comms?" expandable
- **Where:** Programming section, bottom (mobile)
- **Type:** UX concern
- **Detail:** On mobile, there's a collapsed/expandable "Need your own private frequencies for secure comms?" section at the bottom of programming. This is a niche feature buried in the flow. It's fine for power users but might confuse beginners who click it wondering if they need private frequencies.

### 23. Interview "Not sure? Book a consultation" has phone emoji
- **Where:** Every interview question, next to Back/Next buttons
- **Type:** Design issue
- **Detail:** The consultation link uses a telephone emoji (📞) which renders differently across platforms. Consider using an SVG icon for consistency with the rest of the dark-themed UI.

---

## Logic Review: All Option Combinations

### Handheld Flow
- **Email** (enter or skip) -> **Interview** (guided or direct) -> **Radio** (5 options: UV-5R $59, UV-5R Mini $39, UV-PRO $159, DMR 6X2 PRO $249, DA-7X2 $299) -> **Antennas** (5 upgrades + 6 additional, all optional, BNC adapter auto-adds at $5) -> **Battery** (radio-specific upgrades, optional) -> **Accessories** (radio-specific, optional) -> **Programming** (standard free / multi +$10 / skip) -> **Review** -> **Quantity** (1-20, volume discounts at 2+ and 5+)
- **Verified:** Price calculation correctly sums base + add-ons. Cross-category 5% discount applies on 2nd+ kit. Volume discount applies to base price only. Multi-location programming adds $10.
- **No logic issues found** in the handheld single-kit path.

### Multi-Category Flow
- User selects multiple categories (e.g., Handheld + Vehicle) -> builds first kit -> gets "Build Next Category" prompt with 5% discount explanation -> builds second kit -> redirect to cart
- **Verified:** `kbsCompletedCategories` tracking, `kbsAllCategories` ordering, and carry-forward of programming settings all look correct in code.
- **Potential issue:** When starting the next category via `kbsStartNextCategory()`, `programmingChoice` is NOT reset (intentionally, for carry-forward), but `progZipPrimary` and `progZipsExtra` are also not reset. This means if the user entered zip codes for multi-location on their first kit, those zips carry to the second kit. This is probably intended behavior but could be surprising if the second kit is for a different location.

### Non-Handheld Flows (Vehicle, Base, HF, Scanner)
- **Vehicle/Mobile:** Adds mounting step (factory bracket vs RAM Wedge $139). Uses `mobileProducts` for antennas, power, accessories. Antenna mounts + vehicle antennas + NMO coax logic.
- **Base Station:** Same radio lineup as vehicle. Uses `baseProducts` for antennas (quick vs permanent path). Power from `mobileProducts`.
- **HF:** 2 radios from `hfRadioLineup`. No mounting. Uses `hfProducts` for antennas and accessories. Power from `mobileProducts`.
- **Scanner:** 4 scanners from `scannerRadioLineup`. No mounting. Battery section hidden. Uses `scannerProducts`.
- **Verified:** Section visibility logic correctly hides mounting for handheld/HF/scanner, hides battery for scanner. Section renumbering via `renumberSections()` adjusts visible step numbers.

### Edge Cases Checked
1. **Out-of-stock radio:** Radio appears greyed with "Out of Stock" badge, `onclick` handler is omitted. Correctly non-clickable.
2. **Back navigation after cart add:** `kbsKitInCart` flag prevents duplicate adds. Quantity section shows "Kit Already in Cart" with "Go to Cart" and "Make Changes" options.
3. **Edit completed section:** Clicking a completed section header re-opens it and locks all downstream sections. Product selections are re-rendered.
4. **Browser back button:** `history.pushState()` called on section completions. `popstate` listener handles back navigation within the flow.
5. **Skip email:** Works correctly, summary shows "Skipped".
6. **Retake quiz:** Resets interview answers but preserves category selections (`usage`/`setup`). Re-renders from question 1.
7. **"See All Radios":** Bypasses recommendation and shows full radio grid for the category.

### Price Calculation Verification
- Base: radio price (e.g., $59 for UV-5R)
- + antenna upgrades (each antenna's price)
- + BNC adapter ($5, once, if any BNC antenna selected and not suppressed)
- + additional antennas (each price)
- + batteries (price * quantity per battery type)
- + accessories (each price)
- + multi-location programming (+$10)
- - cross-category discount (5% of BASE_PRICE, if 2nd+ kit)
- Volume discount: applied to BASE_PRICE only, percentage based on tier
- Grand total: (unit price - volume discount) * quantity

**One discrepancy noted:** In `calcKitUnitPrice()` for handheld, it delegates to `calcTotal()` from kit-builder.js. But in `updateScrollPriceBar()`, the handheld price is calculated manually by iterating over `antennaUpgrades`, `additionalAntennas`, `batteryUpgrades`, and `accessories`. These two calculations could potentially diverge if the product arrays are modified in one place but not the other. This is a maintenance risk rather than a current bug.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical / Bug | 4 |
| High / UX | 7 |
| Medium / Design | 7 |
| Low / Polish | 5 |

**Top 3 actions before launch:**
1. Fix the page title (remove "V2")
2. Fix the blank setup-type answer in the interview summary
3. Fix the price bar cart button visibility on both desktop and mobile

**Top 3 UX improvements for newcomers:**
1. Add brief explanations of radio types/licensing at the category selection step
2. Add a visible "Continue" or "Skip this step" button that doesn't require scrolling past all options
3. Reword technical jargon (BNC adapter, GMRS, chest rigs) into plain language
