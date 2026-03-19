<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Submission Handler
 */
class Krefrm_Submission_Handler
{
    public function __construct()
    {
        add_action('admin_post_krefrm_submit', array($this, 'handle_submission'));
        add_action('admin_post_nopriv_krefrm_submit', array($this, 'handle_submission'));
    }

    public function handle_submission()
    {
        // Verify nonce first
        if (! isset($_POST['krefrm_frontend_submit'])) {
            wp_safe_redirect(wp_get_referer() ?: home_url());
            exit;
        }

        $nonce = sanitize_text_field(wp_unslash($_POST['krefrm_frontend_submit']));
        if (! wp_verify_nonce($nonce, 'krefrm_frontend_submit')) {
            wp_die(esc_html__('Invalid submission (bad nonce).', 'kreebi-forms'));
        }

        // Validate and sanitize form ID
        if (! isset($_POST['krefrm_form_id'])) {
            wp_safe_redirect(wp_get_referer() ?: home_url());
            exit;
        }

        $form_id = sanitize_text_field(wp_unslash($_POST['krefrm_form_id']));
        if (empty($form_id)) {
            wp_safe_redirect(wp_get_referer() ?: home_url());
            exit;
        }

        $form_post = $this->find_form_post_by_public_id($form_id);

        if (! $form_post) {
            wp_die(esc_html__('Form not found.', 'kreebi-forms'));
        }
        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);

        if (! $this->verify_recaptcha_v3_submission()) {
            $error_message = __('Captcha verification failed. Please try again.', 'kreebi-forms');
            wp_safe_redirect(add_query_arg('krefrm_error', rawurlencode($error_message), wp_get_referer() ?: home_url()));
            exit;
        }

        // Sanitize submitted form fields array.
        $submitted = array();
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Input is unslashed and each field value is sanitized in the loop below.
        $form_fields_raw = isset($_POST['krefrm_fields']) ? wp_unslash($_POST['krefrm_fields']) : null;
        if (is_array($form_fields_raw)) {
            $form_fields = $form_fields_raw;
            foreach ($form_fields as $k => $v) {
                // Validate field key
                $sanitized_key = sanitize_key($k);
                if (empty($sanitized_key)) {
                    continue;
                }

                // Handle both string and array values (for checkbox multi-select)
                if (is_string($v)) {
                    $sanitized_value = sanitize_text_field($v);
                } elseif (is_array($v)) {
                    // For checkbox fields with multiple selections, join with comma
                    $sanitized_values = array_map('sanitize_text_field', $v);
                    $sanitized_value = implode(', ', $sanitized_values);
                } else {
                    $sanitized_value = '';
                }

                $submitted[$sanitized_key] = $sanitized_value;
            }
        }

        $title   = $form_post->post_title . ' — ' . current_time('mysql');
        $post_id = wp_insert_post(array(
            'post_type'    => 'krefrm_submission',
            'post_status'  => 'publish',
            'post_title'   => $title,
            'post_content' => wp_json_encode($submitted),
        ));

        if (is_wp_error($post_id)) {
            wp_safe_redirect(add_query_arg('krefrm_error', rawurlencode($post_id->get_error_message()), wp_get_referer() ?: home_url()));
            exit;
        }

        update_post_meta($post_id, '_krefrm_form_id', $form_post->ID);
        update_post_meta($post_id, '_krefrm_form_id_value', $form_id);
        update_post_meta($post_id, '_krefrm_data', $submitted);

        // Trigger all active integrations
        $this->trigger_integrations($form_post, $submitted);

        wp_safe_redirect(add_query_arg('krefrm_submitted', '1', wp_get_referer() ?: home_url()));
        exit;
    }

    /**
     * Resolve a form post from the public form id.
     *
     * Tries slug first and then checks stored form meta for legacy records.
     */
    private function find_form_post_by_public_id($form_id)
    {
        $form_id = trim((string) $form_id);
        if ('' === $form_id) {
            return null;
        }

        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'name'           => sanitize_title($form_id),
            'post_status'    => 'publish',
            'posts_per_page' => 1,
        ));
        if (! empty($posts)) {
            return $posts[0];
        }

        $all_posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
        ));

        foreach ($all_posts as $post) {
            $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
            if (is_array($form_data) && isset($form_data['id']) && (string) $form_data['id'] === $form_id) {
                return $post;
            }
        }

        return null;
    }

    /**
     * Trigger all active integrations for a form submission.
     *
     * @param WP_Post $form_post The form post object.
     * @param array   $submitted The submitted field data.
     */
    private function trigger_integrations($form_post, $submitted)
    {
        // Get integration settings
        $settings = get_option('krefrm_settings', array());
        $integrations = isset($settings['integrations']) && is_array($settings['integrations'])
            ? $settings['integrations']
            : array();

        // Email notification is enabled by default unless explicitly turned off.
        if (! array_key_exists('email-notification', $integrations)) {
            $integrations['email-notification'] = true;
        }

        // Email Notification
        if (! empty($integrations['email-notification'])) {
            $this->trigger_email_notification($form_post, $submitted, $settings);
        }

        // Webhook integration
        if (! empty($integrations['webhook'])) {
            $this->trigger_webhook($form_post, $submitted, $settings);
        }

        // Hook for other integrations
        do_action('krefrm_trigger_integrations', $form_post, $submitted, $integrations, $settings);
    }

    /**
     * Send email notification for form submission.
     *
     * @param WP_Post $form_post The form post object.
     * @param array   $submitted The submitted field data.
     * @param array   $settings  The plugin settings.
     */
    private function trigger_email_notification($form_post, $submitted, $settings)
    {
        $email_settings = isset($settings['emailNotification']) ? $settings['emailNotification'] : array();

        // Get defaults
        $recipient_email = ! empty($email_settings['recipientEmail']) ? $email_settings['recipientEmail'] : get_option('admin_email');
        $sender_name = ! empty($email_settings['senderName']) ? $email_settings['senderName'] : get_bloginfo('name');
        $subject = ! empty($email_settings['subject']) ? $email_settings['subject'] : sprintf('Notification | %s', get_bloginfo('name'));
        $body_template = ! empty($email_settings['bodyTemplate']) ? $email_settings['bodyTemplate'] : "You have received a new form submission.\n\nSubmitted Data:\n{fields}";


        // Replace placeholders
        $form_name = esc_html($form_post->post_title);
        $subject = str_replace('{form_name}', $form_name, $subject);

        // Format fields for email
        $fields_html = '';
        foreach ($submitted as $field_name => $field_value) {
            $fields_html .= sprintf("%s: %s\n", esc_html($field_name), esc_html($field_value));
        }
        $body = str_replace('{fields}', trim($fields_html), $body_template);

        // Send email
        $headers = array(
            'From: ' . $sender_name . ' <' . get_option('admin_email') . '>',
            'Content-Type: text/plain; charset=UTF-8',
        );

        wp_mail($recipient_email, $subject, $body, $headers);
    }

    /**
     * Send webhook requests for the submission.
     */
    private function trigger_webhook($form_post, $submitted, $settings)
    {
        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);
        $form_integrations = isset($form_data['formIntegrations']) && is_array($form_data['formIntegrations'])
            ? $form_data['formIntegrations']
            : array();
        $form_webhook = isset($form_integrations['webhook']) && is_array($form_integrations['webhook'])
            ? $form_integrations['webhook']
            : array();

        // Only dispatch if webhook is explicitly enabled for this form
        if (empty($form_webhook['enabled'])) {
            return;
        }

        $resolved = Krefrm_Webhook_Service::sanitize_settings($form_webhook);
        if (empty($resolved['urls'])) {
            return;
        }

        Krefrm_Webhook_Service::dispatch_from_form_post($resolved, $form_post, $submitted, 'submission');
    }

    /**
     * Verify reCAPTCHA v3 token for frontend submission.
     */
    private function verify_recaptcha_v3_submission()
    {
        $settings = get_option('krefrm_settings', array());
        if (! is_array($settings)) {
            return true;
        }

        $captcha = isset($settings['captcha']) && is_array($settings['captcha'])
            ? $settings['captcha']
            : array();

        $integrations = isset($settings['integrations']) && is_array($settings['integrations'])
            ? $settings['integrations']
            : array();
        if (empty($integrations['captcha'])) {
            return true;
        }

        if (empty($captcha['enabled'])) {
            return true;
        }

        $site_key = isset($captcha['siteKey']) ? sanitize_text_field($captcha['siteKey']) : '';
        $secret_key = isset($captcha['secretKey']) ? sanitize_text_field($captcha['secretKey']) : '';
        if ('' === $site_key || '' === $secret_key) {
            return false;
        }

        $token = '';
        if (isset($_POST['krefrm_recaptcha_token'])) {
            $token = sanitize_text_field(wp_unslash($_POST['krefrm_recaptcha_token']));
        }
        if ('' === $token) {
            return false;
        }

        $threshold = isset($captcha['v3Threshold']) ? floatval($captcha['v3Threshold']) : 0.5;
        if ($threshold < 0) {
            $threshold = 0;
        }
        if ($threshold > 1) {
            $threshold = 1;
        }

        $remote_ip = '';
        if (! empty($_SERVER['REMOTE_ADDR'])) {
            $remote_ip = sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']));
        }

        $body = array(
            'secret' => $secret_key,
            'response' => $token,
        );
        if ('' !== $remote_ip) {
            $body['remoteip'] = $remote_ip;
        }

        $response = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', array(
            'timeout' => 10,
            'body' => $body,
        ));

        if (is_wp_error($response)) {
            return false;
        }

        $payload = json_decode(wp_remote_retrieve_body($response), true);
        if (! is_array($payload) || empty($payload['success'])) {
            return false;
        }

        if (! isset($payload['action']) || 'krefrm_submit' !== (string) $payload['action']) {
            return false;
        }

        $score = isset($payload['score']) ? floatval($payload['score']) : 0;

        return $score >= $threshold;
    }
}
