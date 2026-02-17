<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Assets Handler
 */
class Krefrm_Admin_Assets
{
    public function __construct()
    {
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
    }

    public function enqueue_assets($hook)
    {
        // Only load on our plugin pages
        if (strpos($hook, 'krefrm_') === false) {
            return;
        }

        // Enqueue CSS
        wp_enqueue_style(
            'krefrm-admin',
            KREFRM_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            '1.0.0'
        );

        // Enqueue JS
        wp_enqueue_script(
            'krefrm-admin',
            KREFRM_PLUGIN_URL . 'assets/js/admin.js',
            array(),
            '1.0.0',
            true
        );
    }
}
