<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Menu Registration
 */
class Krefrm_Admin_Menu
{
    public function __construct()
    {
        add_action('admin_menu', array($this, 'register_menu'));
    }

    public function register_menu()
    {
        // Top-level: Kreebi Forms
        // build URL relative to the plugin root (not the admin subdirectory)
        $icon_url = plugin_dir_url(dirname(__FILE__, 2)) . '/kreebi-forms/assets/photos/kreebi-forms.svg';

        add_menu_page(
            __('Kreebi Forms', 'kreebi-forms'),
            __('Kreebi Forms', 'kreebi-forms'),
            'manage_options',
            'krefrm_forms',
            array($this, 'render_page'),
            $icon_url,
            90
        );

        // Submenu: Dashboard
        add_submenu_page(
            'krefrm_forms',
            __('Dashboard', 'kreebi-forms'),
            __('Dashboard', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#/'
        );

        // Adjust the auto-created first submenu ("Kreebi Forms") to point to forms.
        global $submenu;
        if (isset($submenu['krefrm_forms'][0])) {
            $submenu['krefrm_forms'][0][2] = admin_url('admin.php?page=krefrm_forms') . '#forms';
        }

        // Submenu: All Forms
        add_submenu_page(
            'krefrm_forms',
            __('All Forms', 'kreebi-forms'),
            __('All Forms', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#form'
        );


        // Submenu: All Submissions
        add_submenu_page(
            'krefrm_forms',
            __('All Submissions', 'kreebi-forms'),
            __('All Submissions', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#submission'
        );

        // Submenu: Style Templates
        add_submenu_page(
            'krefrm_forms',
            __('Style Templates', 'kreebi-forms'),
            __('Style Templates', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#style-templates'
        );

        // Submenu: Integrations
        add_submenu_page(
            'krefrm_forms',
            __('Integrations', 'kreebi-forms'),
            __('Integrations', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#integrations'
        );

        // Submenu: Upgrade to Pro (calls attention)
        add_submenu_page(
            'krefrm_forms',
            __('Upgrade to Pro', 'kreebi-forms'),
            __('Upgrade to Pro', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#upgrade-to-pro'
        );
    }

    public function render_page()
    {
        echo '<div id="krefrm-admin-root"></div>';
    }
}
