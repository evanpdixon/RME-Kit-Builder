# Session: Replace WOOSPPO with Kit Builder for Product Pages
Started: 2026-04-18
Status: in-progress

## Goal
Make the Comms Compass kit builder the exclusive purchase path on 12 radio product pages, eliminating the WOOSPPO product options plugin and all its theme glue code.

## Source
User request: product options plugin is holding back progress; kit builder already has 80% of the needed functionality.

## Plan
- [x] Step 1: Kit builder product-page.php enhancement (hide add-to-cart, update CTA, remove sec=)
- [x] Step 2: Theme WOOSPPO cleanup (functions.php, cart.php, style.css)
- [x] Step 3: Store tester updates (health_check.py, test-store.sh, delete woosppo-fix/)
- [x] Step 4: Deploy to staging, deactivate WOOSPPO, verify
Status: completed

## Progress Notes
- Steps 1-3 complete. All code changes committed and pushed.
- rme-kit-builder: 1 file changed (product-page.php)
- rme-theme: 3 files changed, 509 lines removed
- rme-store-tester: 3 files changed, 980 lines removed, woosppo-fix/ deleted
- Found and fixed: radio map was empty because default-config.json lacked lineup data and stored option prevented fallback. Added 13 radios to default-config.json and fixed merge logic.
- WOOSPPO deactivated on staging12 (extra-custom-product-options-for-woocommerce)
- Verified on staging12: CTA shows on UV-5R, D578, G90, SDS100 product pages. No WOOSPPO markup. URLs correct (#radio=key, #radio=key&cat=category). Comms Compass page loads.

## Key Decisions
- Kit builder only purchase path (no bare radio purchases from product pages)
- Same-tab navigation (current behavior preserved)
- Email capture kept for lead gen
- Product add-ons feature built into rme-theme (replaces WOOSPPO for non-kit products)
- Three Radio Kit: reduce to carrying case only, move to accessories (manual, separate task)

## Production Deployment Checklist
All changes are on staging12 only. Production requires:

### Pre-deploy: Create missing products in production WP admin
- [ ] Create "Lightning to 3.5mm Adapter" product ($9, category: Individual Accessories)
- [ ] Create "USB-C to 3.5mm Adapter" product ($9, category: Individual Accessories)
- [ ] Note their product IDs for APRS cable (1177) add-on mapping

### Deploy code (follows standard production deploy procedure)
- [ ] Backup production database
- [ ] Deploy rme-kit-builder plugin (git pull on production)
- [ ] Deploy rme-theme (upload functions.php, style.css, inc/product-addons.php)
- [ ] Flush cache

### Post-deploy: Configure products
- [ ] Run add-on population script with production product IDs
  - All 23 product mappings from staging
  - APRS cable (1177) mapped to the new Lightning/USB-C adapter product IDs
- [ ] Deactivate WOOSPPO plugin: `wp plugin deactivate extra-custom-product-options-for-woocommerce`
- [ ] Run store tester to verify
- [ ] Manual spot-check: product page checkboxes, kit builder flow, cart items

### Excluded products (handle manually)
- SUT Comms Wizard (8227): hidden, complex selects, not simple checkboxes
- Three Radio Kit (824): reduce to carrying case only per separate decision
- VX6R Kit (577): out of stock, hidden
- UV-5R Minus Radio Kit (573): hidden

## Resume Instructions
Follow the approved plan at C:\Users\rmeadmin\.claude\plans\sequential-leaping-book.md
