<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Core Plugin - Singleton coordinator
 */
final class Krefrm_Plugin
{
    private static $instance = null;

    public static function instance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        // Register post types
        new Krefrm_Post_Types();

        // Register shortcode
        new Krefrm_Shortcode();

        // Handle frontend submissions
        new Krefrm_Submission_Handler();

        // Initialize admin if in admin area
        if (is_admin()) {
            new Krefrm_Admin();
        }
    }
}
