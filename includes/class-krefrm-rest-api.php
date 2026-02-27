<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * REST API endpoints for Kreebi Forms
 */
class Krefrm_Rest_Api
{
    const NAMESPACE = 'kreebi-forms/v1';

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public function register_routes()
    {
        // Forms endpoints
        register_rest_route(self::NAMESPACE, '/forms', array(
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

        register_rest_route(self::NAMESPACE, '/forms/(?P<id>\d+)', array(
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
        register_rest_route(self::NAMESPACE, '/submissions', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_submissions'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));

        // Global settings endpoint
        register_rest_route(self::NAMESPACE, '/settings', array(
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

        register_rest_route(self::NAMESPACE, '/submissions/(?P<id>\d+)', array(
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

    /* ─── Forms ─── */

    public function get_forms()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ));

        $forms = array();
        foreach ($posts as $post) {
            $forms[] = $this->prepare_form($post);
        }

        return rest_ensure_response($forms);
    }

    public function get_form($request)
    {
        $post = get_post(absint($request['id']));
        if (! $post || 'krefrm_form' !== $post->post_type) {
            return new WP_Error('not_found', __('Form not found.', 'kreebi-forms'), array('status' => 404));
        }

        return rest_ensure_response($this->prepare_form($post));
    }

    public function create_form($request)
    {
        $body = $request->get_json_params();

        if (empty($body)) {
            return new WP_Error('invalid_json', __('Invalid JSON body.', 'kreebi-forms'), array('status' => 400));
        }

        $sanitizer = new Krefrm_Form_Sanitizer();
        $form_data = $sanitizer->sanitize($body);

        if (empty($form_data['name'])) {
            return new WP_Error('missing_name', __('Form name is required.', 'kreebi-forms'), array('status' => 400));
        }

        // Generate sequential numeric ID
        $form_id = $this->get_next_form_id();

        $post_id = wp_insert_post(array(
            'post_type'    => 'krefrm_form',
            'post_status'  => 'publish',
            'post_title'   => $form_data['name'],
            'post_content' => $form_data['description'],
            'post_name'    => $form_id,
        ), true);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $form_data['id'] = $form_id;
        update_post_meta($post_id, '_krefrm_form_data', $form_data);

        return rest_ensure_response($this->prepare_form(get_post($post_id)));
    }

    public function update_form($request)
    {
        $post = get_post(absint($request['id']));
        if (! $post || 'krefrm_form' !== $post->post_type) {
            return new WP_Error('not_found', __('Form not found.', 'kreebi-forms'), array('status' => 404));
        }

        $body = $request->get_json_params();
        if (empty($body)) {
            return new WP_Error('invalid_json', __('Invalid JSON body.', 'kreebi-forms'), array('status' => 400));
        }

        $sanitizer = new Krefrm_Form_Sanitizer();
        $form_data = $sanitizer->sanitize($body);

        // Preserve existing form ID
        $existing = get_post_meta($post->ID, '_krefrm_form_data', true);
        if (! empty($existing['id'])) {
            $form_data['id'] = $existing['id'];
        }

        wp_update_post(array(
            'ID'           => $post->ID,
            'post_title'   => $form_data['name'],
            'post_content' => $form_data['description'],
        ));

        update_post_meta($post->ID, '_krefrm_form_data', $form_data);

        return rest_ensure_response($this->prepare_form(get_post($post->ID)));
    }

    public function delete_form($request)
    {
        $post = get_post(absint($request['id']));
        if (! $post || 'krefrm_form' !== $post->post_type) {
            return new WP_Error('not_found', __('Form not found.', 'kreebi-forms'), array('status' => 404));
        }

        wp_delete_post($post->ID, true);

        return rest_ensure_response(array('deleted' => true));
    }

    /* ─── Submissions ─── */

    public function get_submissions()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_submission',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ));

        $submissions = array();
        foreach ($posts as $post) {
            $submissions[] = $this->prepare_submission($post);
        }

        return rest_ensure_response($submissions);
    }

    public function delete_submission($request)
    {
        $post = get_post(absint($request['id']));
        if (! $post || 'krefrm_submission' !== $post->post_type) {
            return new WP_Error('not_found', __('Submission not found.', 'kreebi-forms'), array('status' => 404));
        }

        wp_delete_post($post->ID, true);

        return rest_ensure_response(array('deleted' => true));
    }

    /* ─── Global Settings ─── */

    public function get_settings()
    {
        return rest_ensure_response(array(
            'styleTemplate' => get_option('krefrm_style_template', 'kreebi_style_1'),
            'integrations' => isset(get_option('krefrm_settings', array())['integrations']) ? get_option('krefrm_settings', array())['integrations'] : array(),
            'emailNotification' => isset(get_option('krefrm_settings', array())['emailNotification']) ? get_option('krefrm_settings', array())['emailNotification'] : array(),
        ));
    }

    public function update_settings($request)
    {
        $body = $request->get_json_params();


        // Handle style template
        if (isset($body['styleTemplate'])) {
            $allowed = array('kreebi_style_1', 'kreebi_style_2', 'blank_dev');
            $template = sanitize_text_field($body['styleTemplate']);

            if (! in_array($template, $allowed, true)) {
                return new WP_Error('invalid_template', __('Invalid style template.', 'kreebi-forms'), array('status' => 400));
            }

            update_option('krefrm_style_template', $template);
        }

        // Handle integrations and other settings
        $settings = get_option('krefrm_settings', array());
        if (!is_array($settings)) {
            $settings = array();
        }


        if (isset($body['integrations'])) {
            $integrations = $body['integrations'];
            if (is_array($integrations)) {
                // Keep booleans as-is, don't sanitize
                $settings['integrations'] = $integrations;
            }
        }

        if (isset($body['emailNotification'])) {
            $email_settings = $body['emailNotification'];
            if (is_array($email_settings)) {
                $sanitized = array();
                foreach ($email_settings as $key => $value) {
                    $sanitized[sanitize_key($key)] = sanitize_text_field($value);
                }
                $settings['emailNotification'] = $sanitized;
            }
        }

        update_option('krefrm_settings', $settings);

        return rest_ensure_response(array(
            'styleTemplate' => get_option('krefrm_style_template', 'kreebi_style_1'),
            'integrations' => isset($settings['integrations']) ? $settings['integrations'] : array(),
            'emailNotification' => isset($settings['emailNotification']) ? $settings['emailNotification'] : array(),
        ));
    }

    /* ─── Helpers ─── */

    private function prepare_form($post)
    {
        $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
        $form_id   = isset($form_data['id']) ? $form_data['id'] : $post->post_name;

        // Normalise to steps; also build a flat fields list for backward compat.
        $steps      = array();
        $all_fields = array();

        if (! empty($form_data['steps']) && is_array($form_data['steps'])) {
            $steps = $form_data['steps'];
            foreach ($steps as $step) {
                if (! empty($step['fields']) && is_array($step['fields'])) {
                    $all_fields = array_merge($all_fields, $step['fields']);
                }
            }
        } elseif (! empty($form_data['fields']) && is_array($form_data['fields'])) {
            $all_fields = $form_data['fields'];
            $steps      = array(array('name' => '', 'fields' => $all_fields));
        }

        return array(
            'post_id'        => $post->ID,
            'form_id'        => $form_id,
            'title'          => $post->post_title,
            'description'    => $post->post_content,
            'shortcode'      => sprintf('[kreebi_form id="%s"]', esc_attr($form_id)),
            'styleTemplate'  => isset($form_data['styleTemplate']) ? $form_data['styleTemplate'] : 'kreebi_style_1',
            'steps'          => $steps,
            'fields'         => $all_fields,
            'field_count'    => count($all_fields),
            'date'           => get_the_date('Y-m-d', $post),
            'edit_url'       => get_edit_post_link($post->ID, 'raw'),
        );
    }

    private function prepare_submission($post)
    {
        $form_id   = get_post_meta($post->ID, '_krefrm_form_id', true);
        $form_post = $form_id ? get_post($form_id) : null;
        $form_data = $form_post ? get_post_meta($form_post->ID, '_krefrm_form_data', true) : array();
        $form_uuid = isset($form_data['id']) ? $form_data['id'] : ($form_post ? $form_post->post_name : '');
        $data      = get_post_meta($post->ID, '_krefrm_data', true);

        return array(
            'id'        => $post->ID,
            'title'     => $post->post_title,
            'form_id'   => $form_uuid,
            'form_name' => $form_post ? $form_post->post_title : '—',
            'date'      => get_the_date('F j, Y g:i a', $post),
            'data'      => is_array($data) ? $data : array(),
        );
    }

    private function get_next_form_id()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ));

        $max = 0;
        foreach ($posts as $post_id) {
            $form_data = get_post_meta($post_id, '_krefrm_form_data', true);
            $candidate = '';

            if (is_array($form_data) && ! empty($form_data['id'])) {
                $candidate = $form_data['id'];
            } else {
                $post = get_post($post_id);
                if ($post) {
                    $candidate = $post->post_name;
                }
            }

            if (is_string($candidate) && preg_match('/^\d+$/', $candidate)) {
                $max = max($max, intval($candidate));
            }
        }

        return str_pad($max + 1, 3, '0', STR_PAD_LEFT);
    }
}
