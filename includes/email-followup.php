<?php
/**
 * Kit Builder Lead Capture & Follow-Up Emails
 *
 * - Creates leads database table
 * - AJAX endpoints for email capture + session tracking
 * - WP-Cron handler for follow-up email sequences
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

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
        reminder_1_sent TINYINT DEFAULT 0,
        reminder_2_sent TINYINT DEFAULT 0
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

/* =========================================================================
 * AJAX: Capture Email (public — no login required)
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

    // Upsert: if email exists and not completed, update; otherwise insert
    $existing = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, completed FROM $table WHERE email = %s ORDER BY created_at DESC LIMIT 1",
        $email
    ) );

    if ( $existing && ! $existing->completed ) {
        // Update existing incomplete lead
        $wpdb->update( $table, array(
            'name'       => $name,
            'last_step'  => 'email-captured',
            'created_at' => current_time( 'mysql' ),
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

    wp_send_json_success();
}
add_action( 'wp_ajax_rme_kb_update_session', 'rme_kb_update_session' );
add_action( 'wp_ajax_nopriv_rme_kb_update_session', 'rme_kb_update_session' );

/* =========================================================================
 * AJAX: Mark Lead Completed (called after cart add)
 * ====================================================================== */

function rme_kb_mark_completed() {
    check_ajax_referer( 'rme_kb_cart', 'nonce' );

    $data  = json_decode( file_get_contents( 'php://input' ), true );
    $email = sanitize_email( $data['email'] ?? '' );

    if ( ! $email ) {
        wp_send_json_success(); // Silent — no email captured for this session
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
 * WP-Cron: Follow-Up Email Scheduler
 * ====================================================================== */

function rme_kb_register_cron() {
    // Ensure leads table exists (handles upgrades without reactivation)
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

    $config      = get_option( 'rme_kb_config', array() );
    $calendly    = $config['calendlyUrl'] ?? 'https://calendly.com/radiomadeeasy/radio-consultation';
    $builder_url = home_url( '/kit-builder/' );
    $from_name   = 'Evan Dixon';
    $from_email  = get_option( 'admin_email' );

    // Email 1: 24 hours after start, not completed, not yet sent
    $leads_24h = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM $table WHERE completed = 0 AND reminder_1_sent = 0 AND created_at <= DATE_SUB(%s, INTERVAL 24 HOUR)",
        $now
    ) );

    foreach ( $leads_24h as $lead ) {
        $name      = $lead->name ? $lead->name : 'there';
        $session   = json_decode( $lead->session_data, true );
        $category  = '';
        if ( $session && ! empty( $session['categories'] ) ) {
            $types = array_map( function( $c ) { return $c['type'] ?? ''; }, $session['categories'] );
            $category = implode( ', ', array_filter( $types ) );
        }

        $subject = 'Your radio kit is waiting for you';
        $body = "Hey $name,\n\n"
            . "I noticed you started building a radio kit"
            . ( $category ? " ($category)" : "" )
            . " on our site but didn't get a chance to finish.\n\n"
            . "No worries — your selections might still be available. You can pick up where you left off here:\n\n"
            . "$builder_url\n\n"
            . "If you have any questions about which radio or accessories are right for you, just reply to this email. I'm happy to help.\n\n"
            . "73,\nEvan Dixon\nRadio Made Easy";

        $headers = array(
            "From: $from_name <$from_email>",
            'Content-Type: text/plain; charset=UTF-8',
        );

        $sent = wp_mail( $lead->email, $subject, $body, $headers );
        if ( $sent ) {
            $wpdb->update( $table, array( 'reminder_1_sent' => 1 ), array( 'id' => $lead->id ) );
        }
    }

    // Email 2: 72 hours after start, not completed, first sent but not second
    $leads_72h = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM $table WHERE completed = 0 AND reminder_1_sent = 1 AND reminder_2_sent = 0 AND created_at <= DATE_SUB(%s, INTERVAL 72 HOUR)",
        $now
    ) );

    foreach ( $leads_72h as $lead ) {
        $name = $lead->name ? $lead->name : 'there';

        $subject = 'Let us help you pick the perfect radio setup';
        $body = "Hey $name,\n\n"
            . "I know picking the right radio setup can feel overwhelming — there are a lot of options out there. That's exactly why we built Radio Made Easy.\n\n"
            . "If you'd like some guidance, I'd love to hop on a quick call and help you figure out exactly what you need. No pressure, no sales pitch — just honest advice.\n\n"
            . "Book a consultation: $calendly\n\n"
            . "Or if you'd rather keep exploring on your own, your kit builder is always here:\n$builder_url\n\n"
            . "Either way, I'm here to help.\n\n"
            . "73,\nEvan Dixon\nRadio Made Easy";

        $headers = array(
            "From: $from_name <$from_email>",
            'Content-Type: text/plain; charset=UTF-8',
        );

        $sent = wp_mail( $lead->email, $subject, $body, $headers );
        if ( $sent ) {
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
