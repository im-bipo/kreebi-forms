<?php

if (! defined('ABSPATH')) {
    exit;
}

class Krefrm_Plugin_Config
{
    /**
     * Addons catalog config.
     *
     * Keys:
     * - slug: WordPress.org plugin slug.
     * - prefix-var: Plugin bootstrap constant used to detect active plugin.
     * - setting-url: Admin path to settings page (relative to wp-admin) or full URL.
     *
     * @return array<int, array<string, string>>
     */
    public static function get_other_plugins()
    {
        return array(
            array(
                'slug' => 'kreebi-forms-dashboard',
                'prefix-var' => 'KREEBI_FORMS_DASHBOARD_VERSION',
                'setting-url' => 'admin.php?page=kreebi-forms-dashboard',
                'external-url' => 'https://kreebiforms.com',
                'icon' => 'https://demo.kreebiforms.com/wp-content/plugins/kreebi-forms/assets/photos/kreebi-forms.png',
                'name' => 'Kreebi Forms Dashboard',
                'description' => 'Premium extension for Kreebi Forms to unlock advanced fields and integrations.',
                'author' => 'Kreebi Forms',
                'latest-version' => '1.0.0',
            ),
            array(
                'slug' => 'kreebi-forms-pro',
                'prefix-var' => 'KREEBI_FORMS_PRO_VERSION',
                'setting-url' => 'admin.php?page=kreebi-forms',
                'external-url' => 'https://kreebiforms.com',
                'icon' => 'https://demo.kreebiforms.com/wp-content/plugins/kreebi-forms/assets/photos/kreebi-forms-light.png',
                'name' => 'Kreebi Forms Pro',
                'description' => 'Premium extension for Kreebi Forms to unlock advanced fields and integrations.',
                'author' => 'Kreebi Forms',
                'latest-version' => '1.0.0',
            ),
            array(
                'slug' => 'bipo-project-manager',
                'prefix-var' => 'DEARPRMA_VERSION',
                'setting-url' => '/edit.php?post_type=project',
                'icon' => 'https://kreebiforms.com/assets/icons/bipo-project-manager.png',
                'name' => 'Bipo Project Manager',
                'description' => 'Comprehensive project management tools for team collaboration.',
                'author' => 'Bipo',
                'latest-version' => '1.0.15',
            ),
        );
    }

    /**
     * Returns plugin config for admin UI bridge.
     *
     * @return array
     */
    public static function get_admin_config()
    {
        return array();
    }
}
