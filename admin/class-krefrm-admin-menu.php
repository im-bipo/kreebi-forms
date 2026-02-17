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
            array($this, 'render_forms_page'),
            'dashicons-feedback',
            25
        );

        // Submenu: Forms
        add_submenu_page(
            'krefrm_forms',
            __('Forms', 'kreebi-forms'),
            __('Forms', 'kreebi-forms'),
            'manage_options',
            'krefrm_forms',
            array($this, 'render_forms_page')
        );

        // Submenu: Submissions
        add_submenu_page(
            'krefrm_forms',
            __('Submissions', 'kreebi-forms'),
            __('Submissions', 'kreebi-forms'),
            'manage_options',
            'krefrm_submissions',
            array($this, 'render_submissions_page')
        );
    }

    public function render_forms_page()
    {
        $page = new Krefrm_Admin_Forms_Page();
        $page->render();
    }

    public function render_submissions_page()
    {
        $page = new Krefrm_Admin_Submissions_Page();
        $page->render();
    }
}
