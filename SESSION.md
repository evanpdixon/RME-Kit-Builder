# Session: Kit Builder V2 Pre-Release Code & Visual Audit
Started: 2026-04-05
Status: in-progress

## Goal
Complete code review, logic audit, label review, missing products check, and full visual audit of all selection combinations on both desktop and mobile before public release.

## Source
User request: full brand new code review on V2 workflow, logic audit, label check, missing photos/products, visual audit of all combinations on desktop and mobile.

## Plan
- [x] Read all V2 source files (scroll JS, scroll CSS, shortcode PHP, shared data JS)
- [x] Code review: logic audit, label review, product data check
- [ ] Visual audit: Puppeteer screenshots of all flows on desktop and mobile <-- CURRENT
- [ ] Compile findings and report
- [ ] Fix any issues found

## Progress Notes
- Read all V2 files completely: kit-builder-scroll.js (2247 lines), kit-builder-scroll.css (876 lines), shortcode-scroll-output.php (238 lines)
- Read shared data in kit-builder.js: all 5 radio lineups, all product arrays, interview questions
- Identified 6 products with `id: null` (can't add to cart)

## Key Decisions
- N/A yet

## Resume Instructions
- All V2 code is in: kit-builder-scroll.js, kit-builder-scroll.css, shortcode-scroll-output.php
- Shared data lives in kit-builder.js (radio lineups, product arrays, interview questions)
- Branch: single-page-flow
- Deploy: git pull on staging12 + cache flush
