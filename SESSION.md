# Session: Replace WOOSPPO with Kit Builder for Product Pages
Started: 2026-04-18
Status: in-progress

## Goal
Make the Comms Compass kit builder the exclusive purchase path on 12 radio product pages, eliminating the WOOSPPO product options plugin and all its theme glue code.

## Source
User request: product options plugin is holding back progress; kit builder already has 80% of the needed functionality.

## Plan
- [ ] Step 1: Kit builder product-page.php enhancement (hide add-to-cart, update CTA, remove sec=) <-- CURRENT
- [ ] Step 2: Theme WOOSPPO cleanup (functions.php, cart.php, style.css)
- [ ] Step 3: Store tester updates (health_check.py, test-store.sh, delete woosppo-fix/)
- [ ] Step 4: Deploy to staging, deactivate WOOSPPO, verify

## Progress Notes

## Key Decisions
- Kit builder only purchase path (no bare radio purchases from product pages)
- Same-tab navigation (current behavior preserved)
- Email capture kept for lead gen

## Resume Instructions
Follow the approved plan at C:\Users\rmeadmin\.claude\plans\sequential-leaping-book.md
