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
        add_menu_page(
            __('Kreebi Forms', 'kreebi-forms'),
            __('Kreebi Forms', 'kreebi-forms'),
            'manage_options',
            'krefrm_forms',
            array($this, 'render_page'),
            'dashicons-feedback',
            90
        );

        // Submenu: All Forms
        add_submenu_page(
            'krefrm_forms',
            __('All Forms', 'kreebi-forms'),
            __('All Forms', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#forms'
        );


        // Submenu: All Submissions
        add_submenu_page(
            'krefrm_forms',
            __('All Submissions', 'kreebi-forms'),
            __('All Submissions', 'kreebi-forms'),
            'manage_options',
            admin_url('admin.php?page=krefrm_forms') . '#submission'
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
