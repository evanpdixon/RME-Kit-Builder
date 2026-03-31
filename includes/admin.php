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

    // ── Analytics Data ──
    global $wpdb;
    $leads_table = $wpdb->prefix . 'rme_kb_leads';
    $table_exists = $wpdb->get_var( "SHOW TABLES LIKE '$leads_table'" ) === $leads_table;
    $analytics = array();
    if ( $table_exists ) {
        $analytics['total_leads']    = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $leads_table" );
        $analytics['completed']      = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $leads_table WHERE completed = 1" );
        $analytics['abandoned']      = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $leads_table WHERE completed = 0" );
        $analytics['reminder_1']     = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $leads_table WHERE reminder_1_sent = 1" );
        $analytics['reminder_2']     = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $leads_table WHERE reminder_2_sent = 1" );
        $analytics['conv_rate']      = $analytics['total_leads'] > 0 ? round( $analytics['completed'] / $analytics['total_leads'] * 100, 1 ) : 0;
        $analytics['today']          = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $leads_table WHERE DATE(created_at) = %s", current_time( 'Y-m-d' ) ) );
        $analytics['this_week']      = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $leads_table WHERE created_at >= %s", date( 'Y-m-d', strtotime( '-7 days' ) ) ) );

        // Step drop-off funnel
        $analytics['funnel'] = $wpdb->get_results(
            "SELECT last_step, COUNT(*) as count, SUM(completed) as completed FROM $leads_table GROUP BY last_step ORDER BY count DESC",
            ARRAY_A
        );

        // Recent leads
        $analytics['recent'] = $wpdb->get_results(
            "SELECT email, name, created_at, completed, last_step, reminder_1_sent, reminder_2_sent FROM $leads_table ORDER BY created_at DESC LIMIT 20",
            ARRAY_A
        );
    }

    $active_tab = isset( $_GET['tab'] ) ? sanitize_text_field( $_GET['tab'] ) : 'analytics';
    ?>
    <div class="wrap">
        <h1>Kit Builder</h1>

        <nav class="nav-tab-wrapper" style="margin-bottom:20px">
            <a href="?page=rme-kit-builder&tab=analytics" class="nav-tab <?php echo $active_tab === 'analytics' ? 'nav-tab-active' : ''; ?>">Analytics</a>
            <a href="?page=rme-kit-builder&tab=config" class="nav-tab <?php echo $active_tab === 'config' ? 'nav-tab-active' : ''; ?>">Configuration</a>
        </nav>

    <?php if ( $active_tab === 'analytics' ) : ?>
        <!-- ── ANALYTICS TAB ── -->
        <?php if ( ! $table_exists ) : ?>
            <div class="notice notice-warning"><p>Leads table not created yet. Deactivate and reactivate the plugin, or visit the kit builder page once.</p></div>
        <?php else : ?>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px">
                <?php
                $stats = array(
                    array( 'label' => 'Total Leads', 'value' => $analytics['total_leads'], 'color' => '#2271b1' ),
                    array( 'label' => 'Completed', 'value' => $analytics['completed'], 'color' => '#00a32a' ),
                    array( 'label' => 'Abandoned', 'value' => $analytics['abandoned'], 'color' => '#d63638' ),
                    array( 'label' => 'Conversion Rate', 'value' => $analytics['conv_rate'] . '%', 'color' => '#dba617' ),
                    array( 'label' => 'Today', 'value' => $analytics['today'], 'color' => '#2271b1' ),
                    array( 'label' => 'This Week', 'value' => $analytics['this_week'], 'color' => '#2271b1' ),
                );
                foreach ( $stats as $s ) :
                ?>
                    <div class="card" style="padding:20px;min-width:140px;text-align:center;margin:0">
                        <div style="font-size:32px;font-weight:700;color:<?php echo $s['color']; ?>"><?php echo esc_html( $s['value'] ); ?></div>
                        <div style="font-size:13px;color:#666;margin-top:4px"><?php echo esc_html( $s['label'] ); ?></div>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ( ! empty( $analytics['funnel'] ) ) : ?>
            <div class="card" style="padding:20px;margin-bottom:24px;max-width:600px">
                <h2 style="margin-top:0">Drop-Off Funnel</h2>
                <p style="color:#666;font-size:13px;margin-bottom:16px">Where users stopped in the wizard. Lower numbers = more drop-off at that step.</p>
                <table class="widefat striped" style="max-width:100%">
                    <thead><tr><th>Last Step</th><th>Count</th><th>Completed</th><th>Drop-off</th></tr></thead>
                    <tbody>
                    <?php foreach ( $analytics['funnel'] as $row ) :
                        $dropoff = $row['count'] - $row['completed'];
                        $pct = $row['count'] > 0 ? round( $dropoff / $row['count'] * 100 ) : 0;
                    ?>
                        <tr>
                            <td><code><?php echo esc_html( $row['last_step'] ?: '(unknown)' ); ?></code></td>
                            <td><?php echo (int) $row['count']; ?></td>
                            <td><?php echo (int) $row['completed']; ?></td>
                            <td>
                                <div style="display:flex;align-items:center;gap:8px">
                                    <div style="width:100px;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden">
                                        <div style="width:<?php echo $pct; ?>%;height:100%;background:<?php echo $pct > 50 ? '#d63638' : '#dba617'; ?>;border-radius:4px"></div>
                                    </div>
                                    <span style="font-size:12px;color:#666"><?php echo $pct; ?>%</span>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <div class="card" style="padding:20px;max-width:900px">
                <h2 style="margin-top:0">Recent Leads</h2>
                <table class="widefat striped">
                    <thead><tr><th>Email</th><th>Name</th><th>Started</th><th>Last Step</th><th>Status</th><th>Emails Sent</th></tr></thead>
                    <tbody>
                    <?php if ( empty( $analytics['recent'] ) ) : ?>
                        <tr><td colspan="6" style="text-align:center;color:#666">No leads yet. Leads are captured when users enter their email on the kit builder page.</td></tr>
                    <?php else : ?>
                        <?php foreach ( $analytics['recent'] as $lead ) : ?>
                        <tr>
                            <td><?php echo esc_html( $lead['email'] ); ?></td>
                            <td><?php echo esc_html( $lead['name'] ?: '—' ); ?></td>
                            <td><?php echo esc_html( $lead['created_at'] ); ?></td>
                            <td><code><?php echo esc_html( $lead['last_step'] ?: '—' ); ?></code></td>
                            <td>
                                <?php if ( $lead['completed'] ) : ?>
                                    <span style="color:#00a32a;font-weight:600">Completed</span>
                                <?php else : ?>
                                    <span style="color:#d63638">Abandoned</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php
                                    $sent = array();
                                    if ( $lead['reminder_1_sent'] ) $sent[] = '24h';
                                    if ( $lead['reminder_2_sent'] ) $sent[] = '72h';
                                    echo $sent ? implode( ', ', $sent ) : '—';
                                ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>

    <?php else : ?>
        <!-- ── CONFIG TAB ── -->
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
    <?php endif; ?>
    </div>
    <?php
}
