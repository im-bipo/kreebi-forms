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

        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'name'           => $form_id,
            'post_status'    => 'publish',
            'posts_per_page' => 1,
        ));

        if (empty($posts)) {
            wp_die(esc_html__('Form not found.', 'kreebi-forms'));
        }

        $form_post = $posts[0];
        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);

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
}
