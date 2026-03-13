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
    const SLACK_WEBHOOK_URL = 'REDACTED_SLACK_WEBHOOK';

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
        // Verify nonce
        if (! isset($_POST['nonce']) || ! wp_verify_nonce($_POST['nonce'], 'krefrm_deactivation_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }

        // Check if user has permission to manage plugins
        if (! current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Permission denied'));
        }

        // Collect survey data
        $survey_data = array(
            'reason'        => isset($_POST['reason']) ? sanitize_text_field($_POST['reason']) : '',
            'feedback'      => isset($_POST['feedback']) ? sanitize_textarea_field($_POST['feedback']) : '',
            'email'         => isset($_POST['email']) ? sanitize_email($_POST['email']) : get_option('admin_email'),
            'timestamp'     => current_time('mysql'),
            'site_url'      => site_url(),
            'plugin_version' => '1.1.0',
        );

        // Send survey data to email
        self::send_survey_email($survey_data);

        // Send log to Slack
        self::send_slack_log(array(
            'reason'      => $survey_data['reason'],
            'feedback'    => $survey_data['feedback'],
            'email'       => $survey_data['email'],
            'delete_data' => (isset($_POST['delete_data']) && $_POST['delete_data'] === 'true') ? 'Yes' : 'No',
            'site'        => $survey_data['site_url'],
            'datetime'    => $survey_data['timestamp'],
        ));

        // Delete all data if checkbox is checked
        if (isset($_POST['delete_data']) && $_POST['delete_data'] === 'true') {
            self::delete_all_data();
        }

        wp_send_json_success(array('message' => 'Survey submitted successfully'));
    }

    /**
     * Send log to Slack
     */
    private static function send_slack_log($data)
    {
        $payload = array(
            'text' => sprintf(
                "*Kreebi Forms Deactivation*\n• Site: %s\n• Date: %s\n• Reason: %s\n• Email: %s\n• Delete data: %s\n• Feedback: %s",
                $data['site'],
                $data['datetime'],
                $data['reason'] ?: '(none)',
                $data['email'] ?: '(none)',
                $data['delete_data'],
                $data['feedback'] ?: '(none)'
            ),
        );

        wp_remote_post(self::SLACK_WEBHOOK_URL, array(
            'method'      => 'POST',
            'body'        => wp_json_encode($payload),
            'headers'     => array('Content-Type' => 'application/json'),
            'timeout'     => 5,
            'data_format' => 'body',
        ));
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
        $wpdb->query(
            "DELETE pm FROM {$wpdb->postmeta} pm
            INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
            WHERE p.post_type IN ('krefrm_form', 'krefrm_submission')"
        );

        // Clear any transients
        $wpdb->query(
            "DELETE FROM {$wpdb->options}
            WHERE option_name LIKE '%kreebi_forms%' OR option_name LIKE '%krefrm_%'"
        );
    }
}
