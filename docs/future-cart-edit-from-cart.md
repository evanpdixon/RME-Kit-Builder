# Future: Edit Kit from Cart Page

## Concept
Allow users to click "Edit Kit" from the WooCommerce cart page to reopen the kit builder with all their selections pre-loaded. This lets them modify their kit without starting over.

## How It Would Work

### Saving Kit State
When items are added to cart via `rmeKbAddToCart()`, save the full kit configuration to the WooCommerce session:
- Selected radio key
- Selected antennas (upgrade + additional)
- Selected batteries with quantities and colors
- Selected accessories
- Programming choice and location data
- UV-PRO color if applicable

Store as a serialized JSON blob in `WC()->session->set('rme_kit_config', $config)`.

### Cart Page UI
Add an "Edit Kit" link next to the kit name label on each cart item (or once per kit group). Clicking it:
1. Navigates to the kit builder page with a query param: `/kit-builder/?edit_kit=1`
2. Kit builder JS detects the param, loads saved config from session via AJAX
3. Pre-selects the radio, populates all selections, and jumps to the review step
4. User modifies selections and clicks "Update Cart" (replaces "Add to Cart")

### Updating the Cart
"Update Cart" removes all items tagged with the current kit's `_rme_kit_name` from the cart, then adds the updated items. This avoids duplicates.

### Edge Cases
- User adds non-kit items to cart: those are untouched by edit/update
- User has multiple kits: each kit has a unique `_rme_kit_id` (timestamp) to distinguish them
- User clears cart: session config is also cleared
- Session expiry: graceful fallback to fresh kit builder

### Files to Modify
- `includes/cart.php`: Save/load kit config via WC session, add "Edit Kit" link
- `assets/js/kit-builder.js`: Accept `?edit_kit=1` param, load config via AJAX, pre-populate state
- `includes/shortcode-output.php`: No changes needed (JS handles pre-population)

### Estimated Effort
Medium. ~200 lines of PHP + ~150 lines of JS. Main complexity is in the state restoration (ensuring all render functions fire correctly with pre-loaded data) and the cart item replacement logic.

### Dependencies
- Kit name tagging (implemented)
- Cart item session persistence (implemented via `_rme_kit_name`)
- WooCommerce session API (`WC()->session`)
