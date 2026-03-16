<?php
/**
 * WooCommerce Product Page Integration
 *
 * When a supported radio product is viewed on its WC product page,
 * inject the kit builder wizard starting after radio selection.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Check if the current product is a kit-builder-enabled radio.
 * Returns the radio key if matched, false otherwise.
 */
function rme_kb_get_product_radio_key( $product_id ) {
    $config = get_option( 'rme_kb_config', rme_kb_default_config() );
    if ( empty( $config['radioLineup'] ) ) return false;

    foreach ( $config['radioLineup'] as $radio ) {
        if ( ! empty( $radio['id'] ) && (int) $radio['id'] === (int) $product_id ) {
            return $radio['key'];
        }
    }
    return false;
}

/**
 * Hook into WC single product page to inject kit builder.
 */
function rme_kb_product_page_hook() {
    if ( ! is_product() ) return;

    global $product;
    if ( ! $product ) return;

    $radio_key = rme_kb_get_product_radio_key( $product->get_id() );
    if ( ! $radio_key ) return;

    // Remove default add-to-cart button for this product
    remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );

    // Enqueue kit builder assets with product page mode
    rme_kb_enqueue_assets();

    // Add product-page-specific JS vars
    wp_localize_script( 'rme-kit-builder', 'rmeKitBuilderProduct', array(
        'productPageMode' => true,
        'productRadioKey' => $radio_key,
        'productId'       => $product->get_id(),
    ) );

    // Inject kit builder output after the product summary
    add_action( 'woocommerce_after_single_product_summary', 'rme_kb_render_product_page_wizard', 5 );
}
add_action( 'woocommerce_before_single_product', 'rme_kb_product_page_hook' );

/**
 * Render the kit builder wizard on product pages.
 */
function rme_kb_render_product_page_wizard() {
    echo '<div id="rme-kb-product-wizard" style="clear:both">';
    include RME_KB_PATH . 'includes/shortcode-output.php';
    echo '</div>';
    ?>
    <script>
    // Product page mode — auto-start wizard with the selected radio
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof rmeKitBuilderProduct !== 'undefined' && rmeKitBuilderProduct.productPageMode) {
            var needsPhase = document.getElementById('needs-phase');
            var selectorPhase = document.getElementById('selector-phase');
            if (needsPhase) needsPhase.style.display = 'none';
            if (selectorPhase) selectorPhase.style.display = 'none';
            if (typeof confirmRadioSelection === 'function') {
                confirmRadioSelection(rmeKitBuilderProduct.productRadioKey);
            }
        }
    });
    </script>
    <?php
}

/**
 * Admin setting: enable/disable product page integration.
 * This is controlled via the main config JSON under "productPageEnabled": true/false
 */
function rme_kb_should_enable_product_page() {
    $config = get_option( 'rme_kb_config', rme_kb_default_config() );
    return ! empty( $config['productPageEnabled'] );
}

/**
 * Only attach the product page hook if enabled in config.
 */
function rme_kb_maybe_init_product_page() {
    if ( rme_kb_should_enable_product_page() ) {
        // Hook is already added above via add_action
        return;
    }
    // If disabled, remove the hook
    remove_action( 'woocommerce_before_single_product', 'rme_kb_product_page_hook' );
}
add_action( 'wp', 'rme_kb_maybe_init_product_page' );
