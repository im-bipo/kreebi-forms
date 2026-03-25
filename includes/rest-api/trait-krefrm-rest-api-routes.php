<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Routes and permissions for REST API.
 */
trait Krefrm_Rest_Api_Routes
{
    public function register_routes()
    {
        $namespace = 'kreebi-forms/v1';

        // Forms endpoints
        register_rest_route($namespace, '/forms', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_forms'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_form'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        register_rest_route($namespace, '/forms/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_form'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_form'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_form'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Submissions endpoints
        register_rest_route($namespace, '/submissions', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_submissions'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Global settings endpoint
        register_rest_route($namespace, '/settings', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_settings'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'update_settings'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Addons catalog endpoint
        register_rest_route($namespace, '/plugin-addons', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_plugin_addons'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Plugin install endpoint
        register_rest_route($namespace, '/plugin-addons/install', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'install_plugin'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Custom CSS endpoint
        register_rest_route($namespace, '/custom-css', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_custom_css'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'save_custom_css'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Webhook testing endpoint
        register_rest_route($namespace, '/webhook/test', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'test_webhook'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Webhook logs endpoint
        register_rest_route($namespace, '/webhook/logs', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_webhook_logs'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'clear_webhook_logs'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Integrations definitions endpoint
        register_rest_route($namespace, '/integrations', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_integrations'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        register_rest_route($namespace, '/submissions/(?P<id>\d+)', array(
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_submission'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));
    }

    /**
     * Permission check — manage_options required
     */
    public function check_admin_permission()
    {
        return current_user_can('manage_options');
    }
}
