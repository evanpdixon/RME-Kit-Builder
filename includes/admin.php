<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Register admin menu page.
 */
function rme_kb_admin_menu() {
    add_menu_page(
        'Kit Builder',
        'Kit Builder',
        'manage_woocommerce',
        'rme-kit-builder',
        'rme_kb_admin_page',
        'dashicons-cart',
        56
    );
}
add_action( 'admin_menu', 'rme_kb_admin_menu' );

/**
 * Handle config save, import, and export.
 */
function rme_kb_admin_page() {
    // Handle export
    if ( isset( $_GET['rme_kb_export'] ) && wp_verify_nonce( $_GET['_wpnonce'], 'rme_kb_export' ) ) {
        $config = get_option( 'rme_kb_config', rme_kb_default_config() );
        header( 'Content-Type: application/json' );
        header( 'Content-Disposition: attachment; filename="rme-kit-builder-config.json"' );
        echo wp_json_encode( $config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
        exit;
    }

    $message = '';
    $error = '';

    // Handle JSON import
    if ( isset( $_POST['rme_kb_import'] ) && check_admin_referer( 'rme_kb_admin' ) ) {
        if ( ! empty( $_FILES['config_file']['tmp_name'] ) ) {
            $json = file_get_contents( $_FILES['config_file']['tmp_name'] );
            $config = json_decode( $json, true );
            if ( $config && is_array( $config ) ) {
                update_option( 'rme_kb_config', $config, false );
                $message = 'Configuration imported successfully.';
            } else {
                $error = 'Invalid JSON file. Please check the format and try again.';
            }
        } else {
            $error = 'No file selected.';
        }
    }

    // Handle direct JSON editor save
    if ( isset( $_POST['rme_kb_save'] ) && check_admin_referer( 'rme_kb_admin' ) ) {
        $json = wp_unslash( $_POST['config_json'] );
        $config = json_decode( $json, true );
        if ( $config && is_array( $config ) ) {
            update_option( 'rme_kb_config', $config, false );
            $message = 'Configuration saved.';
        } else {
            $error = 'Invalid JSON. Please fix syntax errors and try again.';
        }
    }

    // Handle reset to defaults
    if ( isset( $_POST['rme_kb_reset'] ) && check_admin_referer( 'rme_kb_admin' ) ) {
        update_option( 'rme_kb_config', rme_kb_default_config(), false );
        $message = 'Configuration reset to defaults.';
    }

    $config = get_option( 'rme_kb_config', rme_kb_default_config() );
    $config_json = wp_json_encode( $config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
    $export_url = wp_nonce_url( admin_url( 'admin.php?page=rme-kit-builder&rme_kb_export=1' ), 'rme_kb_export' );
    ?>
    <div class="wrap">
        <h1>Kit Builder Configuration</h1>
        <p>Manage your kit builder product catalog, radio lineup, and flow settings. Use <code>[rme_kit_builder]</code> on any page.</p>

        <?php if ( $message ) : ?>
            <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $message ); ?></p></div>
        <?php endif; ?>
        <?php if ( $error ) : ?>
            <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
        <?php endif; ?>

        <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
            <!-- Import / Export -->
            <div class="card" style="flex:0 0 320px;padding:20px">
                <h2>Import / Export</h2>
                <p style="color:#666;font-size:13px;margin-bottom:16px">Move configuration between staging and production without any migration.</p>

                <h3 style="font-size:14px;margin-bottom:8px">Export</h3>
                <p style="font-size:13px;color:#666;margin-bottom:8px">Download current config as JSON file.</p>
                <a href="<?php echo esc_url( $export_url ); ?>" class="button button-secondary">Download Config JSON</a>

                <hr style="margin:20px 0">

                <h3 style="font-size:14px;margin-bottom:8px">Import</h3>
                <p style="font-size:13px;color:#666;margin-bottom:8px">Upload a previously exported JSON config file.</p>
                <form method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field( 'rme_kb_admin' ); ?>
                    <input type="file" name="config_file" accept=".json" style="margin-bottom:8px"><br>
                    <button type="submit" name="rme_kb_import" class="button button-primary">Import Config</button>
                </form>

                <hr style="margin:20px 0">

                <h3 style="font-size:14px;margin-bottom:8px">Reset</h3>
                <form method="post">
                    <?php wp_nonce_field( 'rme_kb_admin' ); ?>
                    <button type="submit" name="rme_kb_reset" class="button" onclick="return confirm('Reset to default config? This cannot be undone.')">Reset to Defaults</button>
                </form>
            </div>

            <!-- JSON Editor -->
            <div class="card" style="flex:1;min-width:500px;padding:20px">
                <h2>Configuration Editor</h2>
                <p style="color:#666;font-size:13px;margin-bottom:16px">Edit the raw JSON config. Changes take effect immediately on save.</p>
                <form method="post">
                    <?php wp_nonce_field( 'rme_kb_admin' ); ?>
                    <textarea name="config_json" rows="30" style="width:100%;font-family:monospace;font-size:13px;tab-size:2"><?php echo esc_textarea( $config_json ); ?></textarea>
                    <p style="margin-top:12px">
                        <button type="submit" name="rme_kb_save" class="button button-primary">Save Configuration</button>
                    </p>
                </form>
            </div>
        </div>
    </div>
    <?php
}
