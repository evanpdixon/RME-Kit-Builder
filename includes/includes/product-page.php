<?php
/**
 * WooCommerce Product Page Integration
 *
 * Replaces the default add-to-cart button on supported radio/scanner product
 * pages with a "Build Your Kit" button linking to the kit builder.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Product ID → radio key + category mapping.
 * Covers all lineups: handheld, mobile, base, HF, scanner.
 */
function rme_kb_get_product_info( $product_id ) {
    $map = array(
        // Handhelds
        106  => array( 'key' => 'uv5r',     'cat' => 'handheld' ),
        8438 => array( 'key' => 'uv5r-mini','cat' => 'handheld' ),
        7862 => array( 'key' => 'uv-pro',   'cat' => 'handheld' ),
        2931 => array( 'key' => 'dmr-6x2',  'cat' => 'handheld' ),
        9050 => array( 'key' => 'da-7x2',   'cat' => 'handheld' ),
        // Mobile (also used for base)
        8487 => array( 'key' => 'uv50pro',  'cat' => 'mobile' ),
        4157 => array( 'key' => 'd578',     'cat' => 'mobile' ),
        // HF
        3654 => array( 'key' => 'g90',      'cat' => 'hf' ),
        720  => array( 'key' => 'ft891',    'cat' => 'hf' ),
        // Scanners
        7512 => array( 'key' => 'sds200',   'cat' => 'scanner' ),
        6721 => array( 'key' => 'sds100',   'cat' => 'scanner' ),
        3723 => array( 'key' => 'sdr-kit',  'cat' => 'scanner' ),
    );

    $pid = (int) $product_id;
    return isset( $map[ $pid ] ) ? $map[ $pid ] : false;
}

/**
 * Hook into WC single product page.
 */
function rme_kb_product_page_hook() {
    if ( ! is_product() ) return;

    global $product;
    if ( ! $product ) return;

    $info = rme_kb_get_product_info( $product->get_id() );
    if ( ! $info ) return;

    // Remove default add-to-cart and product options plugin UI
    remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );

    // Try to remove common product options plugins
    // PPOM
    if ( function_exists( 'ppom_add_meta_to_product' ) ) {
        remove_action( 'woocommerce_before_add_to_cart_button', 'ppom_add_meta_to_product', 10 );
    }

    // Add "Build Your Kit" button
    add_action( 'woocommerce_single_product_summary', function() use ( $info ) {
        $kit_url = home_url( '/kit-builder/?radio=' . urlencode( $info['key'] ) . '&cat=' . urlencode( $info['cat'] ) );
        $label = $info['cat'] === 'scanner' ? 'Build Your Scanner Kit' : 'Build Your Kit';
        ?>
        <div class="rme-kb-product-cta" style="margin: 20px 0 30px;">
            <a href="<?php echo esc_url( $kit_url ); ?>"
               style="display:inline-block;background:#fdd351;color:#000;font-family:'Barlow Semi Condensed',sans-serif;font-size:17px;font-weight:700;padding:16px 40px;border:none;border-radius:8px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;text-decoration:none;text-align:center;transition:background 0.15s">
                <?php echo esc_html( $label ); ?> →
            </a>
            <p style="font-size:13px;color:#999;margin-top:10px;">
                Customize with antennas, batteries, accessories, and free programming.
            </p>
        </div>
        <?php
    }, 30 );
}
add_action( 'woocommerce_before_single_product', 'rme_kb_product_page_hook' );
