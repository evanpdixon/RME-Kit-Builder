<?php
/**
 * Kit Builder Lead Capture, Follow-Up Emails & Mailchimp Sync
 *
 * - Leads database table with unsubscribe support
 * - AJAX endpoints: email capture, session tracking, completion, unsubscribe
 * - 3-email follow-up sequence (1h confirmation, 24h reminder, 72h consultation)
 * - Dynamic social proof from WooCommerce order count
 * - CAN-SPAM compliant footer with unsubscribe link
 * - 30-day duplicate suppression
 * - Mailchimp list sync with category tags
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'RME_KB_FROM_EMAIL', 'hello@radiomadeeasy.com' );
define( 'RME_KB_FROM_NAME', 'Evan Dixon' );

// Mailchimp config loaded from wp_options (set via Kit Builder admin or WP-CLI)
function rme_kb_mailchimp_key() { return get_option( 'rme_kb_mailchimp_key', '' ); }
function rme_kb_mailchimp_list() { return get_option( 'rme_kb_mailchimp_list', '' ); }

/* =========================================================================
 * Database Table
 * ====================================================================== */

function rme_kb_create_leads_table() {
    global $wpdb;
    $table = $wpdb->prefix . 'rme_kb_leads';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed TINYINT DEFAULT 0,
        completed_at DATETIME NULL,
        session_data TEXT,
        last_step VARCHAR(100) DEFAULT '',
        confirmation_sent TINYINT DEFAULT 0,
        reminder_1_sent TINYINT DEFAULT 0,
        reminder_2_sent TINYINT DEFAULT 0,
        unsubscribed TINYINT DEFAULT 0
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

/* =========================================================================
 * Helpers
 * ====================================================================== */

function rme_kb_get_social_proof() {
    $count = get_transient( 'rme_kb_order_count' );
    if ( false === $count ) {
        global $wpdb;
        $count = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT ID) FROM {$wpdb->prefix}posts WHERE post_type = 'shop_order' AND post_status IN ('wc-completed','wc-processing')"
        );
        set_transient( 'rme_kb_order_count', $count, DAY_IN_SECONDS );
    }
    $rounded = floor( $count / 500 ) * 500;
    if ( $rounded < 500 ) $rounded = $count;
    return "Join " . number_format( $rounded ) . "+ operators who've built their kits with us.";
}

function rme_kb_unsubscribe_url( $email ) {
    $token = hash_hmac( 'sha256', $email, wp_salt( 'nonce' ) );
    return add_query_arg( array(
        'rme_kb_unsub' => '1',
        'email'        => rawurlencode( $email ),
        'token'        => $token,
    ), home_url( '/' ) );
}

function rme_kb_email_footer( $email ) {
    $unsub = rme_kb_unsubscribe_url( $email );
    return "\n\n---\nRadio Made Easy · PO Box 112, Stony Point, NC 28678\nDon't want to hear from us? Unsubscribe: $unsub";
}

function rme_kb_get_category_label( $lead ) {
    $session = json_decode( $lead->session_data, true );
    if ( $session && ! empty( $session['categories'] ) ) {
        $types = array_map( function( $c ) { return $c['type'] ?? ''; }, $session['categories'] );
        $types = array_filter( $types );
        if ( $types ) return implode( ' + ', $types );
    }
    return '';
}

/**
 * Build a resume URL with flow state encoded in the hash fragment.
 * PII fields (zips, notes) are base64-encoded. Email is excluded.
 */
function rme_kb_build_resume_url( $lead ) {
    $base = home_url( '/kit-builder-v2/' );
    $session = json_decode( $lead->session_data, true );
    if ( ! $session ) return $base;

    $params = array();

    // Interview answers
    if ( ! empty( $session['path'] ) )   $params['path']   = $session['path'];
    if ( ! empty( $session['budget'] ) ) $params['budget'] = $session['budget'];
    if ( ! empty( $session['reach'] ) )  $params['reach']  = implode( ',', (array) $session['reach'] );
    if ( ! empty( $session['setup'] ) )  $params['setup']  = implode( ',', (array) $session['setup'] );
    if ( ! empty( $session['usage'] ) )  $params['usage']  = implode( ',', (array) $session['usage'] );
    if ( ! empty( $session['needs'] ) )  $params['needs']  = implode( ',', (array) $session['needs'] );

    // Radio & category
    if ( ! empty( $session['radio'] ) ) $params['radio'] = $session['radio'];
    if ( ! empty( $session['category'] ) && $session['category'] !== 'handheld' ) $params['cat'] = $session['category'];

    // Product selections
    if ( ! empty( $session['antennas'] ) )    $params['ant']  = implode( ',', (array) $session['antennas'] );
    if ( ! empty( $session['addlAntennas'] ) ) $params['ant2'] = implode( ',', (array) $session['addlAntennas'] );
    if ( ! empty( $session['batteries'] ) ) {
        $bat_parts = array();
        foreach ( (array) $session['batteries'] as $key => $qty ) {
            $bat_parts[] = $key . ':' . intval( $qty );
        }
        $params['bat'] = implode( ',', $bat_parts );
    }
    if ( ! empty( $session['accessories'] ) ) $params['acc'] = implode( ',', (array) $session['accessories'] );
    if ( ! empty( $session['mount'] ) && $session['mount'] !== 'factory' ) $params['mount'] = $session['mount'];

    // Programming
    if ( ! empty( $session['programming'] ) && $session['programming'] !== 'standard' ) {
        $params['prog'] = $session['programming'];
    }
    // PII: base64 encode
    if ( ! empty( $session['zipPrimary'] ) )     $params['z1']  = base64_encode( $session['zipPrimary'] );
    if ( ! empty( $session['zipsExtra'] ) )       $params['zx']  = base64_encode( implode( ',', (array) $session['zipsExtra'] ) );
    if ( ! empty( $session['progNotes'] ) )       $params['pn']  = base64_encode( $session['progNotes'] );
    if ( ! empty( $session['brandmeisterId'] ) )  $params['dmr'] = base64_encode( $session['brandmeisterId'] );

    // Last active section
    if ( ! empty( $session['lastSection'] ) ) $params['sec'] = $session['lastSection'];

    if ( empty( $params ) ) return $base;

    $hash_parts = array();
    foreach ( $params as $k => $v ) {
        $hash_parts[] = rawurlencode( $k ) . '=' . rawurlencode( $v );
    }
    return $base . '#' . implode( '&', $hash_parts );
}

function rme_kb_send_email( $to, $subject, $body ) {
    $headers = array(
        'From: ' . RME_KB_FROM_NAME . ' <' . RME_KB_FROM_EMAIL . '>',
        'Reply-To: ' . RME_KB_FROM_NAME . ' <' . RME_KB_FROM_EMAIL . '>',
        'Content-Type: text/plain; charset=UTF-8',
    );
    return wp_mail( $to, $subject, $body, $headers );
}

/* =========================================================================
 * Mailchimp Sync
 * ====================================================================== */

function rme_kb_sync_to_mailchimp( $email, $name, $categories = array() ) {
    if ( ! rme_kb_mailchimp_key() || ! rme_kb_mailchimp_list() ) return;

    $name_parts = explode( ' ', $name, 2 );
    $data = array(
        'email_address' => $email,
        'status_if_new' => 'subscribed',
        'merge_fields'  => array(
            'FNAME' => $name_parts[0] ?? '',
            'LNAME' => $name_parts[1] ?? '',
        ),
        'tags' => array( 'kit-builder-lead' ),
    );

    // Add category interest tags
    foreach ( $categories as $cat ) {
        $type = $cat['type'] ?? '';
        if ( $type ) {
            $data['tags'][] = 'interest-' . $type;
        }
    }

    $subscriber_hash = md5( strtolower( $email ) );
    $url = 'https://us9.api.mailchimp.com/3.0/lists/' . rme_kb_mailchimp_list() . '/members/' . $subscriber_hash;

    wp_remote_request( $url, array(
        'method'  => 'PUT',
        'timeout' => 10,
        'headers' => array(
            'Authorization' => 'Basic ' . base64_encode( 'anystring:' . rme_kb_mailchimp_key() ),
            'Content-Type'  => 'application/json',
        ),
        'body' => wp_json_encode( $data ),
    ) );

    // Tags need a separate call (PUT /members doesn't set tags)
    if ( ! empty( $data['tags'] ) ) {
        $tag_body = array(
            'tags' => array_map( function( $t ) {
                return array( 'name' => $t, 'status' => 'active' );
            }, $data['tags'] ),
        );
        wp_remote_post( $url . '/tags', array(
            'timeout' => 10,
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode( 'anystring:' . rme_kb_mailchimp_key() ),
                'Content-Type'  => 'application/json',
            ),
            'body' => wp_json_encode( $tag_body ),
        ) );
    }
}

/* =========================================================================
 * AJAX: Capture Email (public)
 * ====================================================================== */

function rme_kb_capture_email() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );

    $data = json_decode( file_get_contents( 'php://input' ), true );
    $email = sanitize_email( $data['email'] ?? '' );
    $name  = sanitize_text_field( $data['name'] ?? '' );

    if ( ! is_email( $email ) ) {
        wp_send_json_error( array( 'message' => 'Invalid email' ), 400 );
    }

    global $wpdb;
    $table = $wpdb->prefix . 'rme_kb_leads';

    // 30-day duplicate suppression
    $existing = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, completed, unsubscribed FROM $table WHERE email = %s AND created_at >= DATE_SUB(%s, INTERVAL 30 DAY) ORDER BY created_at DESC LIMIT 1",
        $email, current_time( 'mysql' )
    ) );

    if ( $existing && $existing->completed ) {
        // Completed within 30 days — don't create new lead
        wp_send_json_success( array( 'lead_id' => $existing->id, 'returning' => true ) );
        return;
    }

    if ( $existing && ! $existing->completed ) {
        // Existing incomplete lead — update it
        $wpdb->update( $table, array(
            'name'              => $name,
            'last_step'         => 'email-captured',
            'created_at'        => current_time( 'mysql' ),
            'confirmation_sent' => 0,
            'reminder_1_sent'   => 0,
            'reminder_2_sent'   => 0,
        ), array( 'id' => $existing->id ) );
        $lead_id = $existing->id;
    } else {
        // New lead
        $wpdb->insert( $table, array(
            'email'      => $email,
            'name'       => $name,
            'created_at' => current_time( 'mysql' ),
            'last_step'  => 'email-captured',
        ) );
        $lead_id = $wpdb->insert_id;
    }

    // Sync to Mailchimp (fire-and-forget)
    rme_kb_sync_to_mailchimp( $email, $name );

    wp_send_json_success( array( 'lead_id' => $lead_id ) );
}
add_action( 'wp_ajax_rme_kb_capture_email', 'rme_kb_capture_email' );
add_action( 'wp_ajax_nopriv_rme_kb_capture_email', 'rme_kb_capture_email' );

/* =========================================================================
 * AJAX: Update Session Progress
 * ====================================================================== */

function rme_kb_update_session() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );

    $data = json_decode( file_get_contents( 'php://input' ), true );
    $email       = sanitize_email( $data['email'] ?? '' );
    $last_step   = sanitize_text_field( $data['lastStep'] ?? '' );
    $session_json = wp_json_encode( $data['session'] ?? array() );

    if ( ! $email ) {
        wp_send_json_error( array( 'message' => 'No email' ), 400 );
    }

    global $wpdb;
    $table = $wpdb->prefix . 'rme_kb_leads';

    $wpdb->query( $wpdb->prepare(
        "UPDATE $table SET last_step = %s, session_data = %s WHERE email = %s AND completed = 0 ORDER BY created_at DESC LIMIT 1",
        $last_step, $session_json, $email
    ) );

    // Update Mailchimp tags with categories if available
    $categories = $data['session']['categories'] ?? array();
    if ( ! empty( $categories ) ) {
        rme_kb_sync_to_mailchimp( $email, '', $categories );
    }

    wp_send_json_success();
}
add_action( 'wp_ajax_rme_kb_update_session', 'rme_kb_update_session' );
add_action( 'wp_ajax_nopriv_rme_kb_update_session', 'rme_kb_update_session' );

/* =========================================================================
 * AJAX: Mark Lead Completed
 * ====================================================================== */

function rme_kb_mark_completed() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );

    $data  = json_decode( file_get_contents( 'php://input' ), true );
    $email = sanitize_email( $data['email'] ?? '' );

    if ( ! $email ) {
        wp_send_json_success();
        return;
    }

    global $wpdb;
    $table = $wpdb->prefix . 'rme_kb_leads';

    $wpdb->query( $wpdb->prepare(
        "UPDATE $table SET completed = 1, completed_at = %s WHERE email = %s AND completed = 0",
        current_time( 'mysql' ), $email
    ) );

    wp_send_json_success();
}
add_action( 'wp_ajax_rme_kb_mark_completed', 'rme_kb_mark_completed' );
add_action( 'wp_ajax_nopriv_rme_kb_mark_completed', 'rme_kb_mark_completed' );

/* =========================================================================
 * Unsubscribe Handler
 * ====================================================================== */

function rme_kb_handle_unsubscribe() {
    if ( ! isset( $_GET['rme_kb_unsub'] ) ) return;

    $email = sanitize_email( rawurldecode( $_GET['email'] ?? '' ) );
    $token = sanitize_text_field( $_GET['token'] ?? '' );

    if ( ! $email || ! $token ) {
        wp_die( 'Invalid unsubscribe link.', 'Invalid Link', array( 'response' => 400 ) );
    }

    $expected = hash_hmac( 'sha256', $email, wp_salt( 'nonce' ) );
    if ( ! hash_equals( $expected, $token ) ) {
        wp_die( 'Invalid unsubscribe link.', 'Invalid Link', array( 'response' => 400 ) );
    }

    global $wpdb;
    $table = $wpdb->prefix . 'rme_kb_leads';
    $wpdb->query( $wpdb->prepare(
        "UPDATE $table SET unsubscribed = 1 WHERE email = %s",
        $email
    ) );

    wp_die(
        '<div style="font-family:system-ui;max-width:480px;margin:80px auto;text-align:center;">'
        . '<h2 style="color:#333;">You\'ve been unsubscribed</h2>'
        . '<p style="color:#666;">You won\'t receive any more kit builder emails from us.</p>'
        . '<p><a href="' . esc_url( home_url() ) . '" style="color:#d4a843;">Back to Radio Made Easy</a></p>'
        . '</div>',
        'Unsubscribed — Radio Made Easy',
        array( 'response' => 200 )
    );
}
add_action( 'template_redirect', 'rme_kb_handle_unsubscribe' );

/* =========================================================================
 * WP-Cron: Follow-Up Email Scheduler
 * ====================================================================== */

function rme_kb_register_cron() {
    rme_kb_create_leads_table();
    if ( ! wp_next_scheduled( 'rme_kb_send_followups' ) ) {
        wp_schedule_event( time(), 'hourly', 'rme_kb_send_followups' );
    }
}
add_action( 'init', 'rme_kb_register_cron' );

function rme_kb_send_followups() {
    global $wpdb;
    $table = $wpdb->prefix . 'rme_kb_leads';
    $now   = current_time( 'mysql' );

    $config       = get_option( 'rme_kb_config', array() );
    $calendly     = $config['calendlyUrl'] ?? 'https://calendly.com/radiomadeeasy/radio-consultation';
    $builder_url  = home_url( '/kit-builder-v2/' ); // default fallback
    $social_proof = rme_kb_get_social_proof();

    // ── Email 0: 1 hour — Confirmation ──────────────────────────────────

    $leads_1h = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM $table WHERE completed = 0 AND unsubscribed = 0 AND confirmation_sent = 0 AND created_at <= DATE_SUB(%s, INTERVAL 1 HOUR)",
        $now
    ) );

    foreach ( $leads_1h as $lead ) {
        $name       = $lead->name ?: 'there';
        $category   = rme_kb_get_category_label( $lead );
        $resume_url = rme_kb_build_resume_url( $lead );

        $subject = "Hey $name, your radio kit is saved";
        $body = "Hey $name,\n\n"
            . "Just a quick note — I saved your radio kit progress on our site."
            . ( $category ? " You were building a $category setup." : "" )
            . "\n\nWhenever you're ready, you can pick up right where you left off:\n$resume_url\n\n"
            . "$social_proof\n\n"
            . "I'll check in tomorrow in case you have any questions. In the meantime, just reply here if anything comes to mind.\n\n"
            . "73,\nEvan Dixon\nRadio Made Easy"
            . rme_kb_email_footer( $lead->email );

        if ( rme_kb_send_email( $lead->email, $subject, $body ) ) {
            $wpdb->update( $table, array( 'confirmation_sent' => 1 ), array( 'id' => $lead->id ) );
        }
    }

    // ── Email 1: 24 hours — Question-based reminder ─────────────────────

    $leads_24h = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM $table WHERE completed = 0 AND unsubscribed = 0 AND confirmation_sent = 1 AND reminder_1_sent = 0 AND created_at <= DATE_SUB(%s, INTERVAL 24 HOUR)",
        $now
    ) );

    foreach ( $leads_24h as $lead ) {
        $name       = $lead->name ?: 'there';
        $category   = rme_kb_get_category_label( $lead );
        $resume_url = rme_kb_build_resume_url( $lead );

        $subject = $category
            ? "Still deciding on your $category setup, $name?"
            : "Still deciding on your radio setup, $name?";

        $body = "Hey $name,\n\n"
            . "I noticed you were working on a " . ( $category ?: "radio" ) . " kit yesterday but didn't get a chance to finish.\n\n"
            . "No pressure at all — picking the right radio setup takes some thought. Your progress is still saved:\n$resume_url\n\n"
            . "$social_proof\n\n"
            . "If you're not sure which option is the best fit, just hit reply. I read every email and I'm happy to point you in the right direction.\n\n"
            . "73,\nEvan Dixon\nRadio Made Easy"
            . rme_kb_email_footer( $lead->email );

        if ( rme_kb_send_email( $lead->email, $subject, $body ) ) {
            $wpdb->update( $table, array( 'reminder_1_sent' => 1 ), array( 'id' => $lead->id ) );
        }
    }

    // ── Email 2: 72 hours — Consultation offer ──────────────────────────

    $leads_72h = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM $table WHERE completed = 0 AND unsubscribed = 0 AND reminder_1_sent = 1 AND reminder_2_sent = 0 AND created_at <= DATE_SUB(%s, INTERVAL 72 HOUR)",
        $now
    ) );

    foreach ( $leads_72h as $lead ) {
        $name       = $lead->name ?: 'there';
        $resume_url = rme_kb_build_resume_url( $lead );

        $subject = "Need a hand picking the right radio, $name?";
        $body = "Hey $name,\n\n"
            . "I know picking the right radio setup can feel overwhelming — there are a lot of options out there. That's exactly why we built Radio Made Easy.\n\n"
            . "If you'd like some guidance, I'd love to hop on a quick call and help you figure out exactly what you need:\n$calendly\n\n"
            . "$social_proof\n\n"
            . "Or if you'd rather keep exploring on your own:\n$resume_url\n\n"
            . "Either way, I'm here to help.\n\n"
            . "73,\nEvan Dixon\nRadio Made Easy"
            . rme_kb_email_footer( $lead->email );

        if ( rme_kb_send_email( $lead->email, $subject, $body ) ) {
            $wpdb->update( $table, array( 'reminder_2_sent' => 1 ), array( 'id' => $lead->id ) );
        }
    }
}
add_action( 'rme_kb_send_followups', 'rme_kb_send_followups' );

/* =========================================================================
 * Deactivation: Clean up cron
 * ====================================================================== */

function rme_kb_deactivate_cron() {
    wp_clear_scheduled_hook( 'rme_kb_send_followups' );
}
