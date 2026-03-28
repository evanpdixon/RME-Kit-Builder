<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * AJAX handler: add multiple items to WooCommerce cart.
 * Expects POST with JSON body: { items: [{ id: 123, qty: 1 }, ...] }
 */
function rme_kb_add_to_cart() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );

    if ( ! function_exists( 'WC' ) ) {
        wp_send_json_error( array( 'message' => 'WooCommerce is not active.' ), 400 );
    }

    $raw = file_get_contents( 'php://input' );
    $data = json_decode( $raw, true );

    if ( empty( $data['items'] ) || ! is_array( $data['items'] ) ) {
        wp_send_json_error( array( 'message' => 'No items provided.' ), 400 );
    }

    $added = array();
    $errors = array();

    foreach ( $data['items'] as $item ) {
        $product_id = absint( $item['id'] ?? 0 );
        $quantity   = max( 1, absint( $item['qty'] ?? 1 ) );

        if ( ! $product_id ) {
            continue;
        }

        $product = wc_get_product( $product_id );
        if ( ! $product || ! $product->is_purchasable() ) {
            $errors[] = "Product #{$product_id} not found or not purchasable.";
            continue;
        }

        // Handle variations: if product is a variation, pass parent + variation IDs
        if ( $product->is_type( 'variation' ) ) {
            $parent_id    = $product->get_parent_id();
            $variation_id = $product_id;
            $attributes   = $product->get_variation_attributes();
            $cart_item_key = WC()->cart->add_to_cart( $parent_id, $quantity, $variation_id, $attributes );
        } else {
            $cart_item_key = WC()->cart->add_to_cart( $product_id, $quantity );
        }
        if ( $cart_item_key ) {
            $added[] = array(
                'id'   => $product_id,
                'name' => $product->get_name(),
                'qty'  => $quantity,
            );
        } else {
            $errors[] = "Could not add product #{$product_id} to cart.";
        }
    }

    wp_send_json_success( array(
        'added'    => $added,
        'errors'   => $errors,
        'cartUrl'  => wc_get_cart_url(),
        'cartCount' => WC()->cart->get_cart_contents_count(),
        'cartTotal' => WC()->cart->get_cart_total(),
    ) );
}
add_action( 'wp_ajax_rme_kb_add_to_cart', 'rme_kb_add_to_cart' );
add_action( 'wp_ajax_nopriv_rme_kb_add_to_cart', 'rme_kb_add_to_cart' );

/**
 * AJAX handler: log an unlisted vehicle for review.
 * Stored in wp_options as rme_kb_unlisted_vehicles (array).
 */
function rme_kb_log_vehicle() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );

    $vehicle = sanitize_text_field( $_POST['vehicle'] ?? '' );
    if ( empty( $vehicle ) ) {
        wp_send_json_error( 'No vehicle provided.' );
    }

    $log = get_option( 'rme_kb_unlisted_vehicles', array() );
    $log[] = array(
        'vehicle' => $vehicle,
        'date'    => current_time( 'mysql' ),
        'ip'      => sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' ),
    );
    // Keep only the last 200 entries
    if ( count( $log ) > 200 ) {
        $log = array_slice( $log, -200 );
    }
    update_option( 'rme_kb_unlisted_vehicles', $log, false );

    wp_send_json_success( 'Logged.' );
}
add_action( 'wp_ajax_rme_kb_log_vehicle', 'rme_kb_log_vehicle' );
add_action( 'wp_ajax_nopriv_rme_kb_log_vehicle', 'rme_kb_log_vehicle' );
