# Kit Builder: Single-Page Flow Variant

## Branch
`single-page-flow` (branched from `master` at `f41fe5c`)

## Concept
Replace the step-by-step show/hide wizard with a single scrolling page. All kit-building sections are visible as a vertical flow. Completing a section unlocks and auto-scrolls to the next one. Previous selections remain visible above.

## What lives on the single scrolling page
1. Interview questions (stack vertically, each unlocks after answering)
2. Recommendation result (inline, not a separate screen)
3. Radio selection (grid or recommendation cards)
4. Wizard sections (all visible, locked until reached):
   - Antennas (merged: upgrades + additional)
   - Battery
   - Accessories (with help panel)
   - Programming
   - Review / Add to Cart

## What stays as separate transitions
- Email capture (initial gate, separate phase)
- Needs assessment category picker (different layout context)
- Cart redirect (WooCommerce page)
- Multi-solution kit plan (only when mixing categories)

## UI Behavior
- Each section starts "locked" (dimmed, collapsed) until the previous section is complete
- Completing a section: gold checkmark appears, section collapses to a summary, next section unlocks and page scrolls to it
- Clicking a completed section re-expands it for editing
- Bottom bar stays as floating price/cart element
- Progress bar becomes optional (vertical progress visible by scroll position)
- Back button replaced by scrolling up / clicking a completed section
- "Best use" labels, help panel, consult button all carry over from current design

## Benefits
- Eliminates header/nav scroll conflicts entirely
- Users see all previous choices (builds confidence)
- Apple-style configure experience (Dan's reference)
- No jarring page transitions
- Natural mobile scrolling

## Architecture Notes
- Current `goStep()` / `getSteps()` system replaced by section-unlock logic
- Each section renders once and re-renders on selection changes (no show/hide cycling)
- `currentStep` replaced by `furthestUnlockedSection` tracker
- Bottom bar simplified (no step-dependent button text changes, always shows total + cart)
- Interview answers flow directly into recommendation without screen swap

## Files to create/modify
- `assets/js/kit-builder-scroll.js` - new JS for scroll-based flow (or modify kit-builder.js)
- `assets/css/kit-builder-scroll.css` - locked/unlocked section styles, collapse animations
- `includes/shortcode-output-scroll.php` - all sections in DOM at once (not hidden)
- Shortcode toggle: `[rme_kit_builder flow="scroll"]` vs default step-based

## Testing
- Compare both flows on staging12 before production decision
- Step flow: current master
- Scroll flow: this branch, activated via shortcode param or URL param ?flow=scroll
