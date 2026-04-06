# Session: Fix cart navigation and price bar bugs
Started: 2026-04-05
Status: in-progress

## Goal
Fix user-reported bugs in V2 kit builder scroll flow:
1. After adding to cart, going back leaves user stuck with no way to proceed without re-adding
2. RAM Tough Wedge shows $139 on card but price bar only adds $123 (cross-cat discount hidden in addons)

## Plan
- [x] Investigate "go back after cart" bug
- [x] Investigate price bar discrepancy
- [ ] Fix price bar cross-cat discount display <-- CURRENT
- [ ] Fix cart navigation with kit-in-cart tracking
- [ ] Deploy to staging12
- [ ] Verify fixes

## Key Decisions
- Price bar: cross-cat 5% discount ($16 on $329) subtracted from total before computing addonsPrice, making mount appear +$123 not +$139. Fix: apply discount to radio price display.
- Cart nav: add kbsKitInCart flag, show "already in cart" UI on re-visit to quantity section.

## Resume Instructions
- Working in kit-builder-scroll.js
- Two bugs: updateScrollPriceBar() lines 440-461 and quantity section flow
- Branch: single-page-flow
- Deploy: git pull on staging12 + cache flush
