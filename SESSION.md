# Session: Kit Builder V2 Full Audit & Feature Build
Started: 2026-04-05
Status: in-progress

## Goal
Complete audit and fix of V2 scroll variant, then add missing features to bring it to production parity and beyond V1.

## Source
User request: full logic + UI audit on desktop and mobile for all category flows.

## Plan
- [x] Full code audit of V2 logic and UI
- [x] Fix 5 critical bugs (non-handheld cart/review/edit, HF routing, scanner duplicates)
- [x] Fix high-priority bugs (email validation, retake quiz, toggle functions)
- [x] Add accessibility (ARIA, keyboard nav, focus management, modal scroll lock)
- [x] Fix vehicle antenna toggle overwriting with handheld products
- [x] Add volume discount / quantity picker (step 10)
- [x] Split vehicle antennas: antenna first, then mount selection
- [x] Simplify vehicle power: show included items, drop advanced options
- [x] Multi-category flow: build all selected types in sequence
- [x] Fix multi-category cart redirect and ordering
- [x] Add product images from WooCommerce for ~20 items
- [x] SVG line-art placeholders for imageless products
- [x] Programming skip option reformatted, license toggle, notes reordered
- [x] Scanner taglines rewritten for use-case guidance
- [x] Card layout fixes (rounded corners, checkbox/price positioning, selected states)
- [x] Mobile price bar simplified (price + phone icon only)
- [x] Radio name + split pricing in bottom bar
- [x] Matching radio badge for base kit after vehicle kit
- [x] Radio mounting step (factory bracket + RAM Wedge upgrade)
- [x] Magnetic Mic Upgrade accessory ($59 placeholder)
- [x] Auto-suggest NMO coax for fender mount / ditch light
- [x] 5% cross-category discount with nudge text
- [x] Product page flow (email -> pre-selected radio -> accessories)
- [ ] Real-device testing and final polish

## Progress Notes
- All 5 category flows (handheld, vehicle, base, HF, scanner) working end-to-end
- Multi-category flow: builds in list order, prompts for next, last kit redirects to cart
- Volume discount tiers: 2-3 (5%), 4-6 (10%), 7-9 (12%), 10+ (15%) per-category
- Cross-category: 5% off base price on 2nd+ category with nudge
- Product page mode: skips interview, detects category from all lineups
- Version at 2.2.0

## Key Decisions
- Volume discounts per-category (identical radios save programming time)
- Cross-category 5% discount (not a full volume tier, just a nudge incentive)
- Vehicle power simplified: cigarette lighter + wire harness included, LiFePO4 removed
- Mounting is its own step (factory included, RAM Wedge upgrade)
- Coax auto-suggested only for fender mount + ditch light (not all mounts)
- Scanner has no interview questions, taglines guide selection instead

## Resume Instructions
- All changes on branch `single-page-flow`
- Deploy path: `git pull` on staging12 + cache flush
- Product page integration needs WC product page testing (enable via config `productPageEnabled: true`)
- Magnetic mic has `id: null` (placeholder, needs WC product created)
- Several fender mounts have `id: null` (need WC products)
- Real-device mobile testing recommended before production deploy
