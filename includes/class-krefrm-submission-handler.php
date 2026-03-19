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
        $is_ajax = $this->is_ajax_submission_request();

        // Verify nonce first
        if (! isset($_POST['krefrm_frontend_submit'])) {
            $this->respond_error(__('Invalid submission. Please refresh and try again.', 'kreebi-forms'), $is_ajax);
        }

        $nonce = sanitize_text_field(wp_unslash($_POST['krefrm_frontend_submit']));
        if (! wp_verify_nonce($nonce, 'krefrm_frontend_submit')) {
            $this->respond_error(__('Invalid submission (bad nonce).', 'kreebi-forms'), $is_ajax);
        }

        // Validate and sanitize form ID
        if (! isset($_POST['krefrm_form_id'])) {
            $this->respond_error(__('Form not found.', 'kreebi-forms'), $is_ajax);
        }

        $form_id = sanitize_text_field(wp_unslash($_POST['krefrm_form_id']));
        if (empty($form_id)) {
            $this->respond_error(__('Form not found.', 'kreebi-forms'), $is_ajax);
        }

        $form_post = $this->find_form_post_by_public_id($form_id);

        if (! $form_post) {
            $this->respond_error(__('Form not found.', 'kreebi-forms'), $is_ajax);
        }
        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);

        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Input is unslashed and validated/sanitized below.
        $form_fields_raw = isset($_POST['krefrm_fields']) ? wp_unslash($_POST['krefrm_fields']) : null;
        $validation_result = $this->validate_submission_fields($form_data, $form_fields_raw);
        if (is_wp_error($validation_result)) {
            $this->respond_error($validation_result->get_error_message(), $is_ajax);
        }

        if (! $this->verify_recaptcha_v3_submission()) {
            $this->respond_error(__('Captcha verification failed. Please try again.', 'kreebi-forms'), $is_ajax);
        }

        // Sanitize submitted form fields array.
        $submitted = array();
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
            $this->respond_error($post_id->get_error_message(), $is_ajax);
        }

        update_post_meta($post_id, '_krefrm_form_id', $form_post->ID);
        update_post_meta($post_id, '_krefrm_form_id_value', $form_id);
        update_post_meta($post_id, '_krefrm_data', $submitted);

        // Trigger all active integrations
        $this->trigger_integrations($form_post, $submitted);

        $this->respond_success(__('Successfully send message.', 'kreebi-forms'), $is_ajax);
    }

    /**
     * Determine whether submission expects JSON response.
     */
    private function is_ajax_submission_request()
    {
        if (! empty($_POST['krefrm_ajax']) && '1' === (string) wp_unslash($_POST['krefrm_ajax'])) {
            return true;
        }

        if (! empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
            $requested_with = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_REQUESTED_WITH']));
            if ('xmlhttprequest' === strtolower($requested_with)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Return success as JSON for ajax, otherwise keep redirect behavior.
     */
    private function respond_success($message, $is_ajax)
    {
        if ($is_ajax) {
            wp_send_json_success(array('message' => $message));
        }

        wp_safe_redirect(add_query_arg('krefrm_submitted', '1', wp_get_referer() ?: home_url()));
        exit;
    }

    /**
     * Return error as JSON for ajax, otherwise keep redirect behavior.
     */
    private function respond_error($message, $is_ajax)
    {
        // Write a server log entry for failure diagnosis.
        if (function_exists('error_log')) {
            error_log('[KREFRM] form submission error: ' . $message);
        }

        if ($is_ajax) {
            wp_send_json_error(array('message' => $message), 400);
        }

        wp_safe_redirect(add_query_arg('krefrm_error', rawurlencode($message), wp_get_referer() ?: home_url()));
        exit;
    }

    /**
     * Validate required and typed fields from configured form schema.
     */
    private function validate_submission_fields($form_data, $raw_fields)
    {
        if (! is_array($raw_fields)) {
            $raw_fields = array();
        }

        if (! is_array($form_data)) {
            return true;
        }

        $steps = array();
        if (! empty($form_data['steps']) && is_array($form_data['steps'])) {
            $steps = $form_data['steps'];
        } elseif (! empty($form_data['fields']) && is_array($form_data['fields'])) {
            $steps = array(array('fields' => $form_data['fields']));
        }

        foreach ($steps as $step) {
            $fields = isset($step['fields']) && is_array($step['fields']) ? $step['fields'] : array();
            foreach ($fields as $field) {
                if (! is_array($field)) {
                    continue;
                }

                $label = isset($field['name']) ? sanitize_text_field($field['name']) : __('This field', 'kreebi-forms');
                $type = isset($field['type']) ? sanitize_key($field['type']) : 'text';
                $required = ! empty($field['required']);

                $key_source = isset($field['name']) ? $field['name'] : '';
                $key = sanitize_key(preg_replace('/\s+/', '_', strtolower((string) $key_source)));
                if ('' === $key) {
                    continue;
                }

                $value = isset($raw_fields[$key]) ? $raw_fields[$key] : null;

                if ($required) {
                    if (is_array($value) && empty($value)) {
                        return new WP_Error('krefrm_required', sprintf(__('%s is required.', 'kreebi-forms'), $label));
                    }
                    if (! is_array($value) && '' === trim((string) $value)) {
                        return new WP_Error('krefrm_required', sprintf(__('%s is required.', 'kreebi-forms'), $label));
                    }
                }

                if ('email' === $type && ! empty($value)) {
                    if (! is_email((string) $value)) {
                        return new WP_Error('krefrm_invalid_email', sprintf(__('%s must be a valid email address.', 'kreebi-forms'), $label));
                    }
                }

                if ('number' === $type && ! empty($value)) {
                    if (! is_numeric((string) $value)) {
                        return new WP_Error('krefrm_invalid_number', sprintf(__('%s must be a valid number.', 'kreebi-forms'), $label));
                    }
                }
            }
        }

        return true;
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
