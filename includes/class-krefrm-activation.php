<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Plugin Activation Handler
 *
 * Creates default contact form on plugin activation
 */
class Krefrm_Activation
{
    const SLACK_WEBHOOK_URL = 'REDACTED_SLACK_WEBHOOK';
    const DEFAULT_EMAIL_TEMPLATE = "Hello,\n\nYou have received a new form submission.\n\nSubmitted Data:\n{fields}\n\n---\nThis is an automated email. Please do not reply.";

    /**
     * Activation hook callback
     */
    public static function activate()
    {
        self::ensure_default_global_settings();

        // Check if contact form already exists to prevent duplicates
        if (self::contact_form_exists()) {
            self::send_slack_activation_log();
            return;
        }

        // Create the default contact form
        self::create_contact_form();

        self::send_slack_activation_log();
    }

    /**
     * Ensure global settings are persisted so form-level "use global"
     * previews are populated immediately after activation.
     */
    private static function ensure_default_global_settings()
    {
        $settings = get_option('krefrm_settings', array());
        if (! is_array($settings)) {
            $settings = array();
        }

        $admin_email = sanitize_email(get_option('admin_email', ''));
        $site_title = sanitize_text_field(get_option('blogname', ''));

        if (! isset($settings['emailNotification']) || ! is_array($settings['emailNotification'])) {
            $settings['emailNotification'] = array();
        }

        if (empty($settings['emailNotification']['recipientEmail'])) {
            $settings['emailNotification']['recipientEmail'] = $admin_email;
        }
        if (empty($settings['emailNotification']['senderName'])) {
            $settings['emailNotification']['senderName'] = $site_title;
        }
        if (empty($settings['emailNotification']['subject'])) {
            $settings['emailNotification']['subject'] = $site_title
                ? sprintf('Notification | %s', $site_title)
                : 'Notification from your website';
        }
        if (empty($settings['emailNotification']['styleVariant'])) {
            $settings['emailNotification']['styleVariant'] = 'style1';
        }
        if (empty($settings['emailNotification']['logoUrl'])) {
            $settings['emailNotification']['logoUrl'] = '';
        }
        if (empty($settings['emailNotification']['businessName'])) {
            $settings['emailNotification']['businessName'] = $site_title;
        }
        if (empty($settings['emailNotification']['message'])) {
            $settings['emailNotification']['message'] = "Hello,\n\nYou have received a new form submission. Please review the details below.";
        }
        if (empty($settings['emailNotification']['themeColor'])) {
            $settings['emailNotification']['themeColor'] = '#1875E5';
        }
        if (empty($settings['emailNotification']['footerContactDetails'])) {
            $settings['emailNotification']['footerContactDetails'] = 'Contact us for support anytime.';
        }
        if (empty($settings['emailNotification']['footerName'])) {
            $settings['emailNotification']['footerName'] = $site_title;
        }
        if (empty($settings['emailNotification']['footerEmail'])) {
            $settings['emailNotification']['footerEmail'] = $admin_email;
        }
        if (empty($settings['emailNotification']['bodyTemplate'])) {
            $settings['emailNotification']['bodyTemplate'] = self::DEFAULT_EMAIL_TEMPLATE;
        }

        update_option('krefrm_settings', $settings);
    }

    /**
     * Send activation log to Slack
     */
    private static function send_slack_activation_log()
    {
        $payload = array(
            'text' => sprintf(
                "*Kreebi Forms Activated*\n• Site: %s\n• Date: %s",
                site_url(),
                date_i18n('Y-m-d H:i:s')
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
     * Check if contact form already exists
     */
    private static function contact_form_exists()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            's'              => 'Contact Form',
        ));

        foreach ($posts as $post) {
            if ($post->post_title === 'Contact Form') {
                return true;
            }
        }

        return false;
    }

    /**
     * Create the default contact form
     */
    private static function create_contact_form()
    {
        // Form data structure
        $form_data = array(
            'name'          => 'Contact Form',
            'description'   => '',
            'styleTemplate' => 'kreebi_style_1',
            'fields'        => array(
                array(
                    'name'        => 'Name',
                    'type'        => 'text',
                    'placeholder' => 'Your name',
                    'required'    => true,
                    'options'     => array(),
                ),
                array(
                    'name'        => 'Email',
                    'type'        => 'email',
                    'placeholder' => 'you@example.com',
                    'required'    => true,
                    'options'     => array(),
                ),
                array(
                    'name'        => 'Message',
                    'type'        => 'text',
                    'placeholder' => 'Write your message…',
                    'required'    => false,
                    'options'     => array(),
                ),
            ),
        );

        // Get next form ID
        $form_id = self::get_next_form_id();
        $form_data['id'] = $form_id;

        // Insert the post
        $post_id = wp_insert_post(array(
            'post_type'    => 'krefrm_form',
            'post_status'  => 'publish',
            'post_title'   => $form_data['name'],
            'post_content' => $form_data['description'],
            'post_name'    => $form_id,
        ), true);

        // If post creation succeeded, save the form data as meta
        if (! is_wp_error($post_id)) {
            update_post_meta($post_id, '_krefrm_form_data', $form_data);
        }
    }

    /**
     * Get the next sequential form ID (001, 002, 003, etc.)
     */
    private static function get_next_form_id()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ));

        $max = 0;
        foreach ($posts as $post_id) {
            $form_data = get_post_meta($post_id, '_krefrm_form_data', true);
            $candidate = '';

            if (is_array($form_data) && ! empty($form_data['id'])) {
                $candidate = $form_data['id'];
            } else {
                $post = get_post($post_id);
                if ($post) {
                    $candidate = $post->post_name;
                }
            }

            if (is_string($candidate) && preg_match('/^\d+$/', $candidate)) {
                $max = max($max, intval($candidate));
            }
        }

        return str_pad($max + 1, 3, '0', STR_PAD_LEFT);
    }
}
