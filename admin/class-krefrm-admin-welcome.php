<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Welcome Redirect Handler
 */
class Krefrm_Admin_Welcome
{
    public function __construct()
    {
        add_action('admin_init', array($this, 'maybe_redirect_to_welcome'));
    }

    public function maybe_redirect_to_welcome()
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        if (wp_doing_ajax()) {
            return;
        }

        if (! get_transient('krefrm_activation_redirect')) {
            return;
        }

        delete_transient('krefrm_activation_redirect');

        if (is_network_admin()) {
            return;
        }

        wp_safe_redirect(admin_url('admin.php?page=krefrm_forms#welcome-editor'));
        exit;
    }
}
