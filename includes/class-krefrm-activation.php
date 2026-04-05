<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Plugin Activation Handler
 */
class Krefrm_Activation
{
    const DEFAULT_EMAIL_TEMPLATE = "Hello,\n\nYou have received a new form submission.\n\nSubmitted Data:\n{fields}\n\n---\nThis is an automated email. Please do not reply.";

    /**
     * Activation hook callback
     */
    public static function activate()
    {
        self::ensure_default_global_settings();
        self::mark_welcome_screen_for_redirect();
    }

    /**
     * Mark the post-activation onboarding redirect.
     */
    private static function mark_welcome_screen_for_redirect()
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Activation context check only.
        if (isset($_GET['activate-multi'])) {
            return;
        }

        if (is_multisite() && is_network_admin()) {
            return;
        }

        set_transient('krefrm_activation_redirect', '1', 30 * MINUTE_IN_SECONDS);
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
        if (empty($settings['emailNotification']['buttonText'])) {
            $settings['emailNotification']['buttonText'] = 'View Submission';
        }
        if (empty($settings['emailNotification']['buttonUrl'])) {
            $settings['emailNotification']['buttonUrl'] = '';
        }
        if (empty($settings['emailNotification']['themeColor'])) {
            $settings['emailNotification']['themeColor'] = '#1875E5';
        }
        if (empty($settings['emailNotification']['footerContactDetails'])) {
            $settings['emailNotification']['footerContactDetails'] = 'Contact us for support anytime.';
        }
        if (empty($settings['emailNotification']['bodyTemplate'])) {
            $settings['emailNotification']['bodyTemplate'] = self::DEFAULT_EMAIL_TEMPLATE;
        }

        if (
            ! isset($settings['defaultEditor'])
            || ! in_array($settings['defaultEditor'], array('quick', 'drag_drop'), true)
        ) {
            $settings['defaultEditor'] = 'quick';
        }

        // Set default custom CSS if not already set
        if (! isset($settings['customCss']) || '' === trim($settings['customCss'])) {
            $default_css_file = KREFRM_PLUGIN_DIR . 'includes/custom-css.css';
            if (file_exists($default_css_file)) {
                $settings['customCss'] = file_get_contents($default_css_file);
            } else {
                // Minimal built-in fallback in case file is missing
                $settings['customCss'] = ".krefrm-frontend-form button,\n.krefrm-frontend-form button:hover {\n  /* background-color: #1875e5;  */\n  /* color: #ffff; */\n}\n";
            }
        }

        update_option('krefrm_settings', $settings);
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
