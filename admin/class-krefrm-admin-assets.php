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

            // Add optional CSS to highlight upgrade link as a button
            $upgrade_css = "
                #toplevel_page_krefrm_forms .wp-submenu li a[href*='#upgrade-to-pro'] {
                    display: inline-block;
                    width: 80%;

                    background: #2271b1;
                    color: #fff !important;
                    padding: 6px 12px;
                    border-radius: 4px;
                    margin: 4px;
                    font-weight: 600;
                }
                #toplevel_page_krefrm_forms .wp-submenu li a[href*='#upgrade-to-pro']:hover {
                    background: #1a5d96;
                }
            ";
            wp_add_inline_style('krefrm-admin', $upgrade_css);

            wp_add_inline_script(
                'krefrm-admin',
                'window.krefrmAdmin = ' . wp_json_encode(array(
                    'page'      => $page,
                    'restUrl'   => esc_url_raw(rest_url('kreebi-forms/v1')),
                    'nonce'     => wp_create_nonce('wp_rest'),
                    'pluginUrl' => KREFRM_PLUGIN_URL,
                )) . ';',
                'before'
            );

            wp_add_inline_script(
                'krefrm-admin',
                '(function() {
                    function syncKrefrmMenu() {
                        var hash = window.location.hash.replace(/^#\/?/, "");
                        var items = document.querySelectorAll("#adminmenu a[href*=\"krefrm_forms\"]");
                        items.forEach(function(a) {
                            var li = a.parentElement;
                            var itemHash = (a.href.split("#")[1] || "").replace(/^\//, "");
                            var isActive = false;
                            if (itemHash === "forms/create") {
                                isActive = (hash === "forms/create");
                            } else if (itemHash === "submission") {
                                isActive = (hash === "submission");
                            } else if (itemHash === "upgrade-to-pro") {
                                isActive = (hash === "upgrade-to-pro");
                            } else if (itemHash === "forms") {
                                // default to forms if nothing else matches
                                isActive = (hash !== "forms/create" && hash !== "submission" && hash !== "upgrade-to-pro");
                            }
                            if (isActive) {
                                li.classList.add("current");
                                a.classList.add("current");
                            } else {
                                li.classList.remove("current");
                                a.classList.remove("current");
                            }
                        });
                    }
                    document.addEventListener("DOMContentLoaded", syncKrefrmMenu);
                    window.addEventListener("hashchange", syncKrefrmMenu);
                })();'
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
