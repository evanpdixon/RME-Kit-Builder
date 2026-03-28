<?php
/**
 * Plugin Name: RME Kit Builder
 * Description: Interactive radio kit builder wizard with WooCommerce cart integration. Use [rme_kit_builder] shortcode.
 * Version: 1.0.0
 * Author: Radio Made Easy
 * Requires PHP: 7.4
 * Requires at least: 5.8
 * Text Domain: rme-kit-builder
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'RME_KB_VERSION', '1.8.2' );
define( 'RME_KB_PATH', plugin_dir_path( __FILE__ ) );
define( 'RME_KB_URL', plugin_dir_url( __FILE__ ) );

// Load admin page
require_once RME_KB_PATH . 'includes/admin.php';

// Load WooCommerce cart integration
require_once RME_KB_PATH . 'includes/cart.php';

// Load WooCommerce product page integration
require_once RME_KB_PATH . 'includes/product-page.php';

/**
 * Register the [rme_kit_builder] shortcode.
 */
function rme_kb_shortcode( $atts ) {
    // Enqueue assets only when shortcode is used
    rme_kb_enqueue_assets();

    ob_start();
    include RME_KB_PATH . 'includes/shortcode-output.php';
    return ob_get_clean();
}
add_shortcode( 'rme_kit_builder', 'rme_kb_shortcode' );

/**
 * Enqueue CSS and JS only on pages with the shortcode.
 */
function rme_kb_enqueue_assets() {
    wp_enqueue_style(
        'rme-kit-builder',
        RME_KB_URL . 'assets/css/kit-builder.css',
        array(),
        RME_KB_VERSION
    );

    wp_enqueue_script(
        'rme-kit-builder',
        RME_KB_URL . 'assets/js/kit-builder.js',
        array(),
        RME_KB_VERSION,
        true // Load in footer
    );

    // Pass config + WC ajax URL to JS
    $config = get_option( 'rme_kb_config', rme_kb_default_config() );
    $upload_dir = wp_upload_dir();
    wp_localize_script( 'rme-kit-builder', 'rmeKitBuilder', array(
        'config'     => $config,
        'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
        'nonce'      => wp_create_nonce( 'rme_kb_cart' ),
        'cartUrl'    => function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : '',
        'uploadsUrl' => trailingslashit( $upload_dir['baseurl'] ),
        'ymmUrl'     => RME_KB_URL . 'assets/data/ymm.json',
        'mountsUrl'  => RME_KB_URL . 'assets/data/vehicle-mounts.json',
        'pluginUrl'  => RME_KB_URL,
    ) );
}

/**
 * Default config - product catalog, radio lineup, etc.
 * This is what gets stored in wp_options and is editable via admin.
 */
function rme_kb_default_config() {
    $json_path = RME_KB_PATH . 'includes/default-config.json';
    if ( file_exists( $json_path ) ) {
        $json = file_get_contents( $json_path );
        $config = json_decode( $json, true );
        if ( $config ) {
            return $config;
        }
    }
    return array();
}

/**
 * On activation, seed config if not already set.
 */
function rme_kb_activate() {
    if ( ! get_option( 'rme_kb_config' ) ) {
        update_option( 'rme_kb_config', rme_kb_default_config(), false );
    }
}
register_activation_hook( __FILE__, 'rme_kb_activate' );
