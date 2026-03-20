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
        // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only ajax response hint; value is unslashed and compared strictly.
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
        if (defined('WP_DEBUG') && WP_DEBUG && function_exists('error_log')) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug-only logging for submission failures.
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
                        /* translators: %s: Field label. */
                        return new WP_Error('krefrm_required', sprintf(__('%s is required.', 'kreebi-forms'), $label));
                    }
                    if (! is_array($value) && '' === trim((string) $value)) {
                        /* translators: %s: Field label. */
                        return new WP_Error('krefrm_required', sprintf(__('%s is required.', 'kreebi-forms'), $label));
                    }
                }

                if ('email' === $type && ! empty($value)) {
                    if (! is_email((string) $value)) {
                        /* translators: %s: Field label. */
                        return new WP_Error('krefrm_invalid_email', sprintf(__('%s must be a valid email address.', 'kreebi-forms'), $label));
                    }
                }

                if ('number' === $type && ! empty($value)) {
                    if (! is_numeric((string) $value)) {
                        /* translators: %s: Field label. */
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
        $global_email_settings = isset($settings['emailNotification']) && is_array($settings['emailNotification'])
            ? $settings['emailNotification']
            : array();

        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);
        $form_integrations = isset($form_data['formIntegrations']) && is_array($form_data['formIntegrations'])
            ? $form_data['formIntegrations']
            : array();
        $form_email_settings = isset($form_integrations['email-notification']) && is_array($form_integrations['email-notification'])
            ? $form_integrations['email-notification']
            : array();

        $email_settings = $this->resolve_email_notification_settings($global_email_settings, $form_email_settings);

        $recipient_email = $email_settings['recipientEmail'];
        if ('' === $recipient_email) {
            $recipient_email = sanitize_email(get_option('admin_email', ''));
        }
        if ('' === $recipient_email) {
            return;
        }

        $sender_name = $email_settings['senderName'];
        if ('' === $sender_name) {
            $sender_name = sanitize_text_field(get_bloginfo('name'));
        }

        $subject = $email_settings['subject'];
        if ('' === $subject) {
            $subject = sprintf('Notification | %s', get_bloginfo('name'));
        }
        $subject = str_replace('{form_name}', sanitize_text_field($form_post->post_title), $subject);

        $fields_html = $this->build_submission_fields_table_html($submitted);
        $body = $this->build_email_notification_html($email_settings, $form_post, $fields_html);

        $headers = array(
            'From: ' . $sender_name . ' <' . sanitize_email(get_option('admin_email', '')) . '>',
            'Content-Type: text/html; charset=UTF-8',
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
     * Resolve global + form-level email settings.
     */
    private function resolve_email_notification_settings($global_settings, $form_settings)
    {
        $global = $this->sanitize_email_notification_settings($global_settings);

        if (! is_array($form_settings) || empty($form_settings)) {
            return $global;
        }

        $use_global = ! isset($form_settings['_useGlobal']) || (bool) $form_settings['_useGlobal'];
        if ($use_global) {
            return $global;
        }

        $resolved = $global;
        $overrides = $this->sanitize_email_notification_settings($form_settings, $global);

        foreach ($overrides as $key => $value) {
            if ($key === '_useGlobal') {
                continue;
            }
            if (is_string($value) && '' === trim($value)) {
                continue;
            }
            $resolved[$key] = $value;
        }

        return $resolved;
    }

    /**
     * Sanitize email notification settings with defaults.
     */
    private function sanitize_email_notification_settings($settings, $defaults = null)
    {
        if (! is_array($defaults)) {
            $defaults = array(
                'recipientEmail' => sanitize_email(get_option('admin_email', '')),
                'senderName' => sanitize_text_field(get_bloginfo('name')),
                'subject' => sprintf('Notification | %s', sanitize_text_field(get_bloginfo('name'))),
                'styleVariant' => 'style1',
                'logoUrl' => '',
                'businessName' => sanitize_text_field(get_bloginfo('name')),
                'message' => "Hello,\n\nYou have received a new form submission. Please review the details below.",
                'buttonText' => 'View Submission',
                'buttonUrl' => '',
                'themeColor' => '#1875E5',
                'footerContactDetails' => 'Contact us for support anytime.',
                'bodyTemplate' => "You have received a new form submission.\n\nSubmitted Data:\n{fields}",
            );
        }

        $settings = is_array($settings) ? $settings : array();

        $sanitized = $defaults;

        if (isset($settings['_useGlobal'])) {
            $sanitized['_useGlobal'] = (bool) $settings['_useGlobal'];
        }

        if (isset($settings['recipientEmail'])) {
            $sanitized['recipientEmail'] = sanitize_text_field($settings['recipientEmail']);
        }
        if (isset($settings['senderName'])) {
            $sanitized['senderName'] = sanitize_text_field($settings['senderName']);
        }
        if (isset($settings['subject'])) {
            $sanitized['subject'] = sanitize_text_field($settings['subject']);
        }
        if (isset($settings['styleVariant'])) {
            $variant = sanitize_key($settings['styleVariant']);
            $sanitized['styleVariant'] = in_array($variant, array('style1', 'style2'), true) ? $variant : 'style1';
        }
        if (isset($settings['logoUrl'])) {
            $sanitized['logoUrl'] = esc_url_raw($settings['logoUrl']);
        }
        if (isset($settings['businessName'])) {
            $sanitized['businessName'] = sanitize_text_field($settings['businessName']);
        }
        if (isset($settings['message'])) {
            $sanitized['message'] = sanitize_textarea_field($settings['message']);
        }
        if (isset($settings['buttonText'])) {
            $sanitized['buttonText'] = sanitize_text_field($settings['buttonText']);
        }
        if (isset($settings['buttonUrl'])) {
            $sanitized['buttonUrl'] = esc_url_raw($settings['buttonUrl']);
        }
        if (isset($settings['themeColor'])) {
            $color = sanitize_text_field($settings['themeColor']);
            $sanitized['themeColor'] = preg_match('/^#[0-9A-Fa-f]{6}$/', $color) ? strtoupper($color) : '#1875E5';
        }
        if (isset($settings['footerContactDetails'])) {
            $sanitized['footerContactDetails'] = sanitize_textarea_field($settings['footerContactDetails']);
        }
        if (isset($settings['footerName'])) {
            $sanitized['footerName'] = sanitize_text_field($settings['footerName']);
        }
        if (isset($settings['footerEmail'])) {
            $sanitized['footerEmail'] = sanitize_email($settings['footerEmail']);
        }
        if (isset($settings['bodyTemplate'])) {
            $sanitized['bodyTemplate'] = sanitize_textarea_field($settings['bodyTemplate']);
        }

        return $sanitized;
    }

    /**
     * Build submission fields block HTML.
     */
    private function build_submission_fields_table_html($submitted)
    {
        $rows = '';
        foreach ($submitted as $field_name => $field_value) {
            $rows .= '<tr>'
                . '<td style="padding:8px 10px;border-bottom:1px solid #e8ecf2;font-weight:600;color:#243447;width:35%;">' . esc_html($field_name) . '</td>'
                . '<td style="padding:8px 10px;border-bottom:1px solid #e8ecf2;color:#334155;">' . esc_html($field_value) . '</td>'
                . '</tr>';
        }

        if ('' === $rows) {
            $rows = '<tr><td colspan="2" style="padding:10px;color:#64748b;">No form data submitted.</td></tr>';
        }

        return '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e8ecf2;border-radius:8px;overflow:hidden;">'
            . '<tbody>' . $rows . '</tbody>'
            . '</table>';
    }

    /**
     * Build branded HTML body for email notifications.
     */
    private function build_email_notification_html($email_settings, $form_post, $fields_html)
    {
        $theme_color = isset($email_settings['themeColor']) ? $email_settings['themeColor'] : '#1875E5';
        if (! preg_match('/^#[0-9A-Fa-f]{6}$/', $theme_color)) {
            $theme_color = '#1875E5';
        }

        $style_variant = isset($email_settings['styleVariant']) ? $email_settings['styleVariant'] : 'style1';
        $include_form_data = ('style2' !== $style_variant);

        $business_name = ! empty($email_settings['businessName'])
            ? $email_settings['businessName']
            : (! empty($email_settings['senderName']) ? $email_settings['senderName'] : get_bloginfo('name'));

        $logo_html = '';
        if (! empty($email_settings['logoUrl'])) {
            $logo_html = '<div style="margin-bottom:12px;"><img src="' . esc_url($email_settings['logoUrl']) . '" alt="Logo" style="max-height:58px;width:auto;display:block;margin:0 auto;" /></div>';
        }

        $message_text = isset($email_settings['message']) ? $email_settings['message'] : '';
        $message_html = '<p style="margin:0 0 14px;line-height:1.55;color:#111827;white-space:pre-line;font-size:16px;font-weight:600;">' . nl2br(esc_html($message_text)) . '</p>';

        $button_text = isset($email_settings['buttonText']) ? sanitize_text_field($email_settings['buttonText']) : '';
        $button_url = isset($email_settings['buttonUrl']) ? esc_url($email_settings['buttonUrl']) : '';
        if ('' === $button_url) {
            $button_url = esc_url(admin_url('admin.php?page=krefrm_forms#forms'));
        }
        $button_html = '';
        if ('' !== trim($button_text)) {
            $button_html = '<p style="margin:14px 0 0;text-align:center;">'
                . '<a href="' . $button_url . '" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:' . esc_attr($theme_color) . ';color:#ffffff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:2px;">' . esc_html($button_text) . '</a>'
                . '</p>';
        }

        $footer_contact = isset($email_settings['footerContactDetails']) ? $email_settings['footerContactDetails'] : '';

        $form_data_html = '';
        if ($include_form_data) {
            $form_data_html = '<div style="margin:14px 0 0;padding:12px;border:1px solid #dce8fb;background:#f8fbff;text-align:left;">'
                . '<p style="margin:0 0 10px;font-weight:700;color:' . esc_attr($theme_color) . ';">Form Data</p>'
                . $fields_html
                . '</div>';
        }

        $html = '<div style="background:#ededed;padding:20px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
            . '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;width:100%;background:#ededed;">'
            . '<tbody>'
            . '<tr><td style="text-align:center;padding:8px 0 14px;">'
            . $logo_html
            . '<p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:#1f2937;display:inline-block;border-bottom:3px solid ' . esc_attr($theme_color) . ';padding-bottom:4px;">' . esc_html($business_name) . '</p>'
            . '</td></tr>'
            . '<tr><td style="background:#ffffff;border:1px solid #e2e2e2;padding:22px 16px;text-align:center;">'
            . $message_html
            . $button_html
            . $form_data_html
            . '</td></tr>'
            . '<tr><td style="background:#666666;color:#ffffff;padding:18px 16px;text-align:center;line-height:1.55;">'
            . '<p style="margin:0 0 6px;white-space:pre-line;">' . nl2br(esc_html($footer_contact)) . '</p>'
            . '</td></tr>'
            . '<tr><td style="text-align:center;padding:12px 0 0;font-size:12px;">'
            . '<a href="https://kreebiforms.com/" target="_blank" rel="noopener noreferrer" style="color:#1875E5;text-decoration:none;font-weight:600;">Kreebi Forms</a>'
            . '</td></tr>'
            . '</tbody></table>'
            . '</div>';

        return $html;
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
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce is verified in handle_submission() before this method is called.
        if (isset($_POST['krefrm_recaptcha_token'])) {
            // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce is verified in handle_submission() before this method is called.
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
