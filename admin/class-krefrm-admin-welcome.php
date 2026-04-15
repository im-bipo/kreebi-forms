<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Welcome Redirect Handler
 */
class Krefrm_Admin_Welcome
{
    const REDIRECT_TRANSIENT_KEY = 'krefrm_activation_redirect';
    const REDIRECT_OPTION_KEY = 'krefrm_activation_redirect_flag';

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

        if (is_network_admin()) {
            return;
        }

        if (! $this->has_pending_activation_redirect()) {
            return;
        }

        $this->clear_pending_activation_redirect();

        wp_safe_redirect(admin_url('admin.php?page=krefrm_forms#welcome-editor'));
        exit;
    }

    private function has_pending_activation_redirect()
    {
        if (get_transient(self::REDIRECT_TRANSIENT_KEY)) {
            return true;
        }

        return '1' === get_option(self::REDIRECT_OPTION_KEY, '');
    }

    private function clear_pending_activation_redirect()
    {
        delete_transient(self::REDIRECT_TRANSIENT_KEY);
        delete_option(self::REDIRECT_OPTION_KEY);
    }
}
