<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Assets Handler — enqueues the React build
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

        $asset_file = KREFRM_PLUGIN_DIR . 'build/index.asset.php';

        // If build exists, enqueue the React bundle
        if (file_exists($asset_file)) {
            $asset = include $asset_file;

            wp_enqueue_script(
                'krefrm-admin',
                KREFRM_PLUGIN_URL . 'build/index.js',
                $asset['dependencies'],
                $asset['version'],
                true
            );

            wp_enqueue_style(
                'krefrm-admin',
                KREFRM_PLUGIN_URL . 'build/style-index.css',
                array('wp-components'),
                $asset['version']
            );

            // Determine which page we're on
            $page = 'forms';
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only reading page slug, no data mutation.
            if (isset($_GET['page']) && 'krefrm_submissions' === $_GET['page']) {
                $page = 'submissions';
            }

            wp_add_inline_script(
                'krefrm-admin',
                'window.krefrmAdmin = ' . wp_json_encode(array(
                    'page'    => $page,
                    'restUrl' => esc_url_raw(rest_url('kreebi-forms/v1')),
                    'nonce'   => wp_create_nonce('wp_rest'),
                )) . ';',
                'before'
            );
        } else {
            // Fallback to old admin CSS/JS if build doesn't exist
            wp_enqueue_style(
                'krefrm-admin',
                KREFRM_PLUGIN_URL . 'assets/css/admin.css',
                array(),
                '1.0.0'
            );

            wp_enqueue_script(
                'krefrm-admin',
                KREFRM_PLUGIN_URL . 'assets/js/admin.js',
                array(),
                '1.0.0',
                true
            );
        }
    }
}
