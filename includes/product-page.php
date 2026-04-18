<?php
/**
 * WooCommerce Product Page Integration
 *
 * When a supported radio product is viewed on its WC product page,
 * add a "Build a Kit with This Radio" button that links to the kit builder
 * with the radio pre-selected via URL hash.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Map of WooCommerce product IDs to kit builder radio keys and categories.
 * Parsed from the JS data at build time. Falls back to config option.
 */
function rme_kb_get_radio_map() {
    $defaults = rme_kb_default_config();
    $config = get_option( 'rme_kb_config', $defaults );

    // Merge in default lineups if stored config lacks them
    $lineups = array(
        'radioLineup'        => 'handheld',
        'mobileRadioLineup'  => 'mobile',
        'hfRadioLineup'      => 'hf',
        'scannerRadioLineup' => 'scanner',
    );
    foreach ( $lineups as $lineup_key => $category ) {
        if ( empty( $config[ $lineup_key ] ) && ! empty( $defaults[ $lineup_key ] ) ) {
            $config[ $lineup_key ] = $defaults[ $lineup_key ];
        }
    }

    $map = array();
    foreach ( $lineups as $lineup_key => $category ) {
        if ( empty( $config[ $lineup_key ] ) ) continue;
        foreach ( $config[ $lineup_key ] as $radio ) {
            if ( ! empty( $radio['id'] ) && ! empty( $radio['key'] ) ) {
                $map[ (int) $radio['id'] ] = array(
                    'key'      => $radio['key'],
                    'category' => $category,
                    'name'     => $radio['name'] ?? '',
                );
            }
        }
    }
    return $map;
}

/**
 * Check if the current product is a kit-builder-enabled radio.
 */
function rme_kb_get_product_radio_key( $product_id ) {
    $map = rme_kb_get_radio_map();
    return isset( $map[ (int) $product_id ] ) ? $map[ (int) $product_id ]['key'] : false;
}

/**
 * Hide the default WooCommerce add-to-cart form on kit builder products.
 * This also prevents WOOSPPO/product-options plugins from rendering
 * since they hook into the add-to-cart area.
 */
function rme_kb_hide_add_to_cart() {
    if ( ! is_product() ) return;

    global $product;
    if ( ! $product ) return;
    if ( ! rme_kb_get_product_radio_key( $product->get_id() ) ) return;

    remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
}
add_action( 'woocommerce_before_single_product', 'rme_kb_hide_add_to_cart' );

/**
 * Add "Build Your Kit" CTA button on radio product pages.
 * This is the primary purchase path for kit-builder-enabled products.
 */
function rme_kb_product_page_cta() {
    if ( ! is_product() ) return;

    global $product;
    if ( ! $product ) return;

    $map = rme_kb_get_radio_map();
    $pid = $product->get_id();

    if ( ! isset( $map[ $pid ] ) ) return;

    $radio = $map[ $pid ];
    $kb_url = home_url( '/comms-compass/' );
    $hash_parts = array( 'radio=' . urlencode( $radio['key'] ) );
    if ( $radio['category'] !== 'handheld' ) {
        $hash_parts[] = 'cat=' . urlencode( $radio['category'] );
    }
    $url = $kb_url . '#' . implode( '&', $hash_parts );

    echo '<div class="rme-kb-product-cta" style="margin:20px 0;padding:16px 20px;background:#1a1a1a;border:1px solid #333;border-radius:8px;text-align:center">';
    echo '<p style="color:#c4a83a;font-size:14px;margin:0 0 12px">Choose your antenna, battery, accessories, and custom programming.</p>';
    echo '<a href="' . esc_url( $url ) . '" style="display:inline-block;padding:14px 36px;background:#fdd351;color:#0a0a0a;font-family:inherit;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:6px;text-decoration:none">Build Your Kit</a>';
    echo '</div>';
}
add_action( 'woocommerce_single_product_summary', 'rme_kb_product_page_cta', 25 );
