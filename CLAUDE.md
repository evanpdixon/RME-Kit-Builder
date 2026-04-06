# RME Kit Builder

WordPress plugin providing an interactive radio kit builder wizard. Users answer preference questions (handheld/vehicle/base/HF/scanner, budget, use case) to get personalized radio equipment recommendations added to WooCommerce cart.

## Tech Stack
- PHP 7.4+, WordPress, WooCommerce
- JavaScript (ES6+), jQuery/AJAX
- Puppeteer (testing/visual audits)

## Structure

### V2 Scroll Variant (production path)
- `includes/shortcode-scroll-output.php` — Single-page scroll UI template
- `assets/js/kit-builder-scroll.js` — V2 scroll controller (section state machine, progressive unlock)
- `assets/css/kit-builder-scroll.css` — V2 styles
- `assets/js/kit-builder.js` — Shared data + base functions (radio lineups, product arrays, renderProgramming, cart AJAX)

### V1 Step Wizard (frozen, reference only)
- `includes/shortcode-output.php` — Step-based wizard UI template

### Shared
- `includes/cart.php` — WooCommerce AJAX cart handler
- `includes/admin.php` — WordPress admin config page
- `includes/email-followup.php` — Lead capture & email automation
- `assets/data/ymm.json` — Year/Make/Model vehicle database
- `assets/data/vehicle-mounts.json` — Hardware compatibility data
- `docs/missing-images.md` — Products using SVG placeholders (need real photos)

## V2 Architecture

### Section Flow
email → interview → radio → mounting → antennas → battery → accessories → programming → review → quantity

### Section State Machine
`locked → loading → active → fading → complete`

Completed sections show a summary and can be clicked to re-edit (which locks all downstream sections).

### Category Flows (5 types)
- **Handheld**: 5 radios, uses base JS render functions (renderAllAntennas, renderBatteryUpgrades, etc.)
- **Vehicle/Mobile**: 2 radios, mounting step visible, category-specific product arrays from `mobileProducts`
- **Base Station**: Same radios as vehicle, mounting step visible, uses `baseProducts` for antennas
- **HF**: 2 radios, no mounting, uses `hfProducts`
- **Scanner**: 4 scanners, no mounting, battery section hidden, uses `scannerProducts`

### Multi-Category Flow
Users can select multiple categories. After adding a kit to cart, they're prompted to build the next category with a 5% cross-category discount on base price. Programming settings carry forward between categories.

### Key State Variables
- `kbsCurrentCategory` — active category ('handheld', 'mobile', 'base', 'hf', 'scanner')
- `selectedRadioKey` — chosen radio key
- `kbsSelectedMount` — 'factory' or 'ramwedge'
- `selectedAntennas`, `selectedBatteries`, `selectedAccessories` — product selections
- `programmingChoice` — 'standard', 'multi', or 'none'
- `kbsKitInCart` — prevents duplicate cart adds on back-navigation
- `kbsCompletedCategories` / `kbsCompletedKits` — multi-category tracking

### Price Bar
Sticky bottom bar shows radio price + addons breakdown. Cross-category discount shown as separate labeled line item. Volume discount tiers for qty 2+.

### Out-of-Stock Pattern
Set `outOfStock: true` on any radio in a lineup array. Radio appears greyed out with "Out of Stock" badge, non-clickable.

## Data Location
All product data lives in `assets/js/kit-builder.js`:
- `radioLineup` — 5 handheld radios
- `mobileRadioLineup` — 2 vehicle/mobile radios
- `hfRadioLineup` — 2 HF radios
- `scannerRadioLineup` — 4 scanners
- `mobileProducts`, `baseProducts`, `hfProducts`, `scannerProducts` — category product arrays
- `sharedAntennaUpgrades`, `sharedAdditionalAntennas` — handheld antenna options
- Product format: `{ key, name, desc, price, id, img?, compatRadios?, outOfStock? }`

## Deployment
```bash
# staging12
ssh rme-staging "cd /home/u36-2gkvf0xatmnh/www/staging12.radiomadeeasy.com/public_html/wp-content/plugins/rme-kit-builder && git pull && ~/bin/wp --path=/home/u36-2gkvf0xatmnh/www/staging12.radiomadeeasy.com/public_html cache flush"
```

## Testing
```bash
node tests/kit-builder.test.js  # Puppeteer test suite
node audit-v2-verify-fixes.js   # Visual verification audit
```
