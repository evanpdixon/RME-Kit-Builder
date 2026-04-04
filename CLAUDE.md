# RME Kit Builder

WordPress plugin providing an interactive radio kit builder wizard. Users answer preference questions (handheld/vehicle/base/HF, budget, use case) to get personalized radio equipment recommendations added to WooCommerce cart.

## Tech Stack
- PHP 7.4+, WordPress, WooCommerce
- JavaScript (ES6+), jQuery/AJAX
- Puppeteer (testing)

## Structure
- `includes/shortcode-output.php` — Wizard UI template
- `assets/js/kit-builder.js` — Core wizard logic (state machine with phases)
- `includes/admin.php` — WordPress admin config page
- `includes/email-followup.php` — Lead capture & email automation
- `assets/data/ymm.json` — Year/Make/Model vehicle database
- `assets/data/vehicle-mounts.json` — Hardware compatibility data
- `tests/` — Puppeteer test suite

## Key Patterns
- Multi-phase wizard: needs > selector > wizard > mobile/base/HF setup > cart
- Configuration stored in wp_options (JSON), editable via admin UI
- SVG icon library embedded in JS (24x24 line icons)
- Debug panel for state inspection (localStorage)
- Cron-based email followup for unconverted leads

## Testing
```bash
npx puppeteer test  # or node tests/kit-builder.test.js
```
