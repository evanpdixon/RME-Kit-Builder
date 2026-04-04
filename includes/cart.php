<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * AJAX handler: add multiple items to WooCommerce cart.
 * Expects POST with JSON body: { items: [{ id: 123, qty: 1 }, ...], kitName: "UV-PRO Essentials Kit" }
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

    $kit_name = sanitize_text_field( $data['kitName'] ?? '' );
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

        // Pass kit name as cart item data so it displays in the cart
        $cart_item_data = array();
        if ( $kit_name ) {
            $cart_item_data['_rme_kit_name'] = $kit_name;
        }

        $cart_item_key = WC()->cart->add_to_cart( $product_id, $quantity, 0, array(), $cart_item_data );
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
 * Display kit name under each cart item that came from the kit builder.
 */
function rme_kb_cart_item_name( $name, $cart_item, $cart_item_key ) {
    if ( ! empty( $cart_item['_rme_kit_name'] ) ) {
        $kit = esc_html( $cart_item['_rme_kit_name'] );
        $name .= '<br><small style="color:#d4af37;font-size:12px;font-weight:normal">Part of: ' . $kit . '</small>';
    }
    return $name;
}
add_filter( 'woocommerce_cart_item_name', 'rme_kb_cart_item_name', 10, 3 );

/**
 * Preserve kit name in cart session data.
 */
function rme_kb_get_cart_item_from_session( $cart_item, $values ) {
    if ( ! empty( $values['_rme_kit_name'] ) ) {
        $cart_item['_rme_kit_name'] = $values['_rme_kit_name'];
    }
    return $cart_item;
}
add_filter( 'woocommerce_get_cart_item_from_session', 'rme_kb_get_cart_item_from_session', 10, 2 );

/**
 * Clear cart AJAX handler.
 */
function rme_kb_clear_cart() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );
    if ( function_exists( 'WC' ) ) {
        WC()->cart->empty_cart();
    }
    wp_send_json_success( array( 'message' => 'Cart cleared.' ) );
}
add_action( 'wp_ajax_rme_kb_clear_cart', 'rme_kb_clear_cart' );
add_action( 'wp_ajax_nopriv_rme_kb_clear_cart', 'rme_kb_clear_cart' );

/**
 * Add "Clear Cart" button to the cart page.
 */
function rme_kb_clear_cart_button() {
    $nonce = wp_create_nonce( 'rme_kb_cart' );
    $ajax_url = admin_url( 'admin-ajax.php' );
    ?>
    <div style="margin-bottom:16px;text-align:right">
        <button type="button" id="rme-clear-cart-btn"
            style="background:none;border:1px solid #e55;color:#e55;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;transition:all 0.2s"
            onmouseover="this.style.background='#e55';this.style.color='#fff'"
            onmouseout="this.style.background='none';this.style.color='#e55'"
            onclick="if(confirm('Clear all items from your cart? This cannot be undone.')){
                this.disabled=true;this.textContent='Clearing...';
                fetch('<?php echo esc_url( $ajax_url ); ?>?action=rme_kb_clear_cart&nonce=<?php echo esc_attr( $nonce ); ?>',{method:'POST'})
                .then(function(){location.reload()})
                .catch(function(){location.reload()});
            }">
            Clear Cart
        </button>
    </div>
    <?php
}
add_action( 'woocommerce_before_cart_table', 'rme_kb_clear_cart_button' );
