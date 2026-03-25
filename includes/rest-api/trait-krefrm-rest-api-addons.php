<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Addons catalog and plugin installation endpoints.
 */
trait Krefrm_Rest_Api_Addons
{
    public function get_plugin_addons()
    {
        if (! function_exists('plugins_api')) {
            require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        }

        $addons = array();
        $config_items = Krefrm_Plugin_Config::get_other_plugins();

        foreach ($config_items as $item) {
            if (! is_array($item) || empty($item['slug'])) {
                continue;
            }

            $slug = sanitize_key($item['slug']);
            if ('' === $slug) {
                continue;
            }

            $prefix_var = isset($item['prefix-var']) ? (string) $item['prefix-var'] : '';
            $prefix_var = preg_match('/^[A-Z0-9_]+$/', $prefix_var) ? $prefix_var : '';
            $setting_url = isset($item['setting-url']) ? (string) $item['setting-url'] : '';
            $is_active = '' !== $prefix_var ? defined($prefix_var) : false;

            if ('' !== $setting_url && 0 !== strpos($setting_url, 'http://') && 0 !== strpos($setting_url, 'https://')) {
                $setting_url = admin_url(ltrim($setting_url, '/'));
            }

            $download_url = isset($item['download-url']) ? esc_url_raw((string) $item['download-url']) : '';
            $external_url = isset($item['external-url']) ? esc_url_raw((string) $item['external-url']) : '';
            $is_external_only = ! empty($external_url) && empty($download_url);

            $plugin_info = null;
            if (! $is_external_only) {
                $plugin_info = plugins_api('plugin_information', array(
                    'slug' => $slug,
                    'fields' => array(
                        'short_description' => true,
                        'icons' => true,
                        'author' => true,
                    ),
                ));
            }

            $name = isset($item['name']) ? sanitize_text_field($item['name']) : ucfirst(str_replace('-', ' ', $slug));
            $description = isset($item['description']) ? wp_strip_all_tags((string) $item['description']) : '';
            $author = isset($item['author']) ? wp_strip_all_tags((string) $item['author']) : '';
            $version = isset($item['latest-version']) ? sanitize_text_field((string) $item['latest-version']) : '';
            $icon = isset($item['icon']) ? esc_url_raw((string) $item['icon']) : '';

            if (! $is_external_only && ! is_wp_error($plugin_info) && is_object($plugin_info)) {
                $name = isset($plugin_info->name) ? sanitize_text_field($plugin_info->name) : $name;
                $description = isset($plugin_info->short_description) ? wp_strip_all_tags((string) $plugin_info->short_description) : $description;
                $author = isset($plugin_info->author) ? wp_strip_all_tags((string) $plugin_info->author) : $author;
                $version = isset($plugin_info->version) ? sanitize_text_field((string) $plugin_info->version) : $version;

                if (! empty($plugin_info->icons)) {
                    $icons = (array) $plugin_info->icons;
                    if (! empty($icons['2x'])) {
                        $icon = esc_url_raw((string) $icons['2x']);
                    } elseif (! empty($icons['1x'])) {
                        $icon = esc_url_raw((string) $icons['1x']);
                    } elseif (! empty($icons['default'])) {
                        $icon = esc_url_raw((string) $icons['default']);
                    }
                }

                if (empty($download_url) && isset($plugin_info->download_link)) {
                    $download_url = esc_url_raw((string) $plugin_info->download_link);
                }
            }

            $addons[] = array(
                'slug' => $slug,
                'prefixVar' => $prefix_var,
                'settingUrl' => $setting_url,
                'isActiveByPrefixVar' => $is_active,
                'name' => $name,
                'description' => $description,
                'author' => $author,
                'latestVersion' => $version,
                'icon' => $icon,
                'downloadUrl' => $download_url,
                'externalUrl' => $external_url,
            );
        }

        return rest_ensure_response(array(
            'items' => $addons,
        ));
    }

    /**
     * Install a plugin addon
     */
    public function install_plugin($request)
    {
        try {
            $body = $request->get_json_params();
            $slug = isset($body['slug']) ? sanitize_key($body['slug']) : '';

            if ('' === $slug) {
                return new WP_Error('invalid_slug', __('Invalid plugin slug.', 'kreebi-forms'), array('status' => 400));
            }

            // Verify the plugin is in the configured list
            $allowed_plugins = Krefrm_Plugin_Config::get_other_plugins();
            $plugin_config = null;

            foreach ($allowed_plugins as $plugin) {
                if (isset($plugin['slug']) && $slug === sanitize_key($plugin['slug'])) {
                    $plugin_config = $plugin;
                    break;
                }
            }

            if (null === $plugin_config) {
                return new WP_Error('plugin_not_allowed', __('This plugin is not in the allowed addons list.', 'kreebi-forms'), array('status' => 403));
            }

            // Include necessary WordPress files (plugin install/upgrader requires FS functions too)
            if (! function_exists('plugins_api')) {
                require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
            }
            if (! class_exists('Plugin_Upgrader')) {
                require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
            }
            if (! function_exists('request_filesystem_credentials')) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
            }

            $download_url = '';
            $external_url = '';

            if (! empty($plugin_config['download-url'])) {
                $download_url = esc_url_raw($plugin_config['download-url']);
            }

            if (! empty($plugin_config['external-url'])) {
                $external_url = esc_url_raw($plugin_config['external-url']);
            }

            if (empty($download_url) && ! empty($external_url)) {
                return new WP_Error(
                    'external_redirect_only',
                    sprintf(
                        __('This plugin is only available via external URL: %s', 'kreebi-forms'),
                        $external_url
                    ),
                    array(
                        'status' => 302,
                        'external_url' => $external_url,
                    )
                );
            }

            if (empty($download_url)) {
                // Get plugin data from WordPress.org
                $plugin_info = plugins_api('plugin_information', array(
                    'slug' => $slug,
                ));

                if (is_wp_error($plugin_info)) {
                    return new WP_Error(
                        'plugin_info_error',
                        sprintf(__('Could not retrieve plugin information: %s', 'kreebi-forms'), $plugin_info->get_error_message()),
                        array('status' => 400)
                    );
                }

                if (isset($plugin_info->download_link)) {
                    $download_url = esc_url_raw((string) $plugin_info->download_link);
                }
            }

            if (empty($download_url)) {
                return new WP_Error('no_download_link', __('Plugin download link not found.', 'kreebi-forms'), array('status' => 400));
            }

            // Create a silent upgrader to install the plugin
            $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());

            // Install the plugin
            $install_result = $upgrader->install($download_url);

            if (is_wp_error($install_result)) {
                return new WP_Error(
                    'installation_failed',
                    sprintf(__('Plugin installation failed: %s', 'kreebi-forms'), $install_result->get_error_message()),
                    array('status' => 400)
                );
            }

            if (! $install_result) {
                return new WP_Error(
                    'installation_failed',
                    __('Plugin installation failed. Please check directory permissions.', 'kreebi-forms'),
                    array('status' => 400)
                );
            }

            // Get the installed plugin path
            $plugin_file = $upgrader->plugin_info();

            if ($plugin_file instanceof WP_Error) {
                return new WP_Error(
                    'installation_failed',
                    sprintf(__('Plugin installed but plugin file could not be determined: %s', 'kreebi-forms'), $plugin_file->get_error_message()),
                    array('status' => 500)
                );
            }

            if (! $plugin_file || ! is_string($plugin_file)) {
                return new WP_Error(
                    'installation_failed',
                    __('Plugin installed but plugin path could not be resolved.', 'kreebi-forms'),
                    array('status' => 500)
                );
            }

            // Activate the plugin (if the installation provided a plugin path)
            $activate_result = activate_plugin($plugin_file);
            if (is_wp_error($activate_result)) {
                return new WP_Error(
                    'activation_failed',
                    sprintf(__('Plugin installed but activation failed: %s', 'kreebi-forms'), $activate_result->get_error_message()),
                    array('status' => 500)
                );
            }

            return rest_ensure_response(array(
                'success' => true,
                'message' => sprintf(__('Plugin %s installed and activated successfully.', 'kreebi-forms'), $slug),
                'pluginFile' => $plugin_file,
            ));

            // Should not reach here, fall through safety.
        } catch (Throwable $e) {
            return new WP_Error(
                'plugin_install_error',
                sprintf(__('Plugin installation error: %s', 'kreebi-forms'), $e->getMessage()),
                array('status' => 500)
            );
        }
    }
}
