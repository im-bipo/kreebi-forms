<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Coordinator - Initializes all admin components
 */
class Krefrm_Admin
{
    public function __construct()
    {
        new Krefrm_Admin_Menu();
        new Krefrm_Admin_Assets();
        new Krefrm_Form_Handler();
        new Krefrm_Form_Editor();
    }
}
