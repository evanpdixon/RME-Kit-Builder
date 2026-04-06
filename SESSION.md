# Session: V2 Kit Builder Bug Fixes and Audit
Started: 2026-04-05
Status: completed

## Goal
Fix user-reported bugs in V2 kit builder scroll flow and update documentation.

## Completed
- [x] Price bar: cross-cat 5% discount now shown as labeled line item instead of hiding in addons total
- [x] Cart navigation: kbsKitInCart flag prevents duplicate adds; shows "Kit Already in Cart" with Go to Cart / Make Changes on back-nav
- [x] Programming carry-forward: 2nd+ category kits inherit programming choice + location data with green banner
- [x] Updated CLAUDE.md with full V2 architecture docs
- [x] Deployed all changes to staging12

## Key Decisions
- Price bar shows discount as separate "-$X multi-kit discount" text rather than adjusting radio/addon display prices
- "Kit Already in Cart" UI gives user clear Go to Cart vs Make Changes choice rather than silently blocking
- Programming carry-forward preserves all state (choice, locations, DMR ID, itinerant license) rather than just the choice type
