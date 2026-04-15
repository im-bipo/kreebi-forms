<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Plugin Deactivation Handler
 *
 * Handles deactivation survey and data cleanup
 */
class Krefrm_Deactivation
{
    const NOTIFICATION_ENDPOINT = 'https://api.kreebiforms.com/notification';

    /**
     * Deactivation hook callback
     */
    public static function deactivate()
    {
        // Just register the hook - the survey will be shown via admin notice
    }

    /**
     * Handle survey submission and data deletion
     */
    public static function handle_survey_submission()
    {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';

        // Verify nonce
        if ('' === $nonce || ! wp_verify_nonce($nonce, 'krefrm_deactivation_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }

        // Check if user has permission to manage plugins
        if (! current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Permission denied'));
        }

        // Collect survey data
        $survey_data = array(
            'reason'         => isset($_POST['reason']) ? sanitize_text_field(wp_unslash($_POST['reason'])) : '',
            'feedback'       => isset($_POST['feedback']) ? sanitize_textarea_field(wp_unslash($_POST['feedback'])) : '',
            'email'          => isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : get_option('admin_email'),
            'timestamp'      => current_time('mysql'),
            'site_url'       => site_url(),
            'plugin_version' => '1.1.1',
        );

        $delete_data = isset($_POST['delete_data']) ? sanitize_text_field(wp_unslash($_POST['delete_data'])) : '';

        self::send_deactivation_notification($survey_data, $delete_data);

        // Send survey data to email
        self::send_survey_email($survey_data);

        // Delete all data if checkbox is checked
        if ('true' === $delete_data) {
            self::delete_all_data();
        }

        wp_send_json_success(array('message' => 'Survey submitted successfully'));
    }

    /**
     * Send survey email to feedback address
     */
    private static function send_survey_email($data)
    {
        $to = 'feedback@kreebiforms.com';
        $subject = 'Kreebi Forms Deactivation Survey - ' . site_url();

        $message = "
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
                    .header { background: #2271b1; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
                    .field { margin: 15px 0; }
                    .label { font-weight: bold; color: #2271b1; }
                    .value { margin-top: 5px; padding: 10px; background: #f5f5f5; border-left: 3px solid #2271b1; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Kreebi Forms - Deactivation Feedback</h2>
                    </div>
                    <div class='content'>
                        <div class='field'>
                            <div class='label'>Site URL:</div>
                            <div class='value'>" . esc_html($data['site_url']) . "</div>
                        </div>
                        <div class='field'>
                            <div class='label'>Reason for Deactivation:</div>
                            <div class='value'>" . esc_html($data['reason']) . "</div>
                        </div>
                        <div class='field'>
                            <div class='label'>Feedback:</div>
                            <div class='value'>" . nl2br(esc_html($data['feedback'])) . "</div>
                        </div>
                        <div class='field'>
                            <div class='label'>Contact Email:</div>
                            <div class='value'>" . esc_html($data['email']) . "</div>
                        </div>
                        <div class='field'>
                            <div class='label'>Plugin Version:</div>
                            <div class='value'>" . esc_html($data['plugin_version']) . "</div>
                        </div>
                        <div class='field'>
                            <div class='label'>Submitted:</div>
                            <div class='value'>" . esc_html($data['timestamp']) . "</div>
                        </div>
                        <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>
                        <p style='font-size: 12px; color: #666;'>This is an automated message from the Kreebi Forms plugin.</p>
                    </div>
                </div>
            </body>
        </html>
        ";

        $headers = array('Content-Type: text/html; charset=UTF-8');

        wp_mail($to, $subject, $message, $headers);
    }

    private static function send_deactivation_notification($survey_data, $delete_data)
    {
        $payload = array(
            'event'               => 'deactivate',
            'timestamp'           => current_time('mysql'),
            'site_url'            => site_url(),
            'deactivation_form_data' => array(
                'reason'      => $survey_data['reason'],
                'feedback'    => $survey_data['feedback'],
                'email'       => $survey_data['email'],
                'delete_data' => 'true' === $delete_data,
            ),
        );

        $args = array(
            'headers'  => array(
                'Content-Type' => 'application/json; charset=utf-8',
            ),
            'body'     => wp_json_encode($payload),
            'timeout'  => 5,
            'blocking' => false,
        );

        wp_remote_post(self::NOTIFICATION_ENDPOINT, $args);
    }

    /**
     * Delete all plugin data
     */
    private static function delete_all_data()
    {
        global $wpdb;

        // Delete all forms (krefrm_form post type)
        $form_posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ));

        foreach ($form_posts as $post_id) {
            wp_delete_post($post_id, true);
        }

        // Delete all submissions (krefrm_submission post type)
        $submission_posts = get_posts(array(
            'post_type'      => 'krefrm_submission',
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ));

        foreach ($submission_posts as $post_id) {
            wp_delete_post($post_id, true);
        }

        // Delete options (integrations, settings, etc)
        delete_option('kreebi_forms_settings');
        delete_option('kreebi_forms_integrations');
        delete_option('kreebi_forms_webhooks');

        // Delete all postmeta for krefrm post types
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Cleanup query for plugin-owned postmeta at deactivation.
        $wpdb->query(
            "DELETE pm FROM {$wpdb->postmeta} pm
            INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
            WHERE p.post_type IN ('krefrm_form', 'krefrm_submission')"
        );

        // Clear any transients
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Cleanup query for plugin-owned options/transients at deactivation.
        $wpdb->query(
            "DELETE FROM {$wpdb->options}
            WHERE option_name LIKE '%kreebi_forms%' OR option_name LIKE '%krefrm_%'"
        );
    }
}
