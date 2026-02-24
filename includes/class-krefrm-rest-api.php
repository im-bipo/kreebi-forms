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
        $count     = wp_count_posts('krefrm_form');
        $published = isset($count->publish) ? $count->publish : 0;
        $form_id   = str_pad($published + 1, 3, '0', STR_PAD_LEFT);

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

    /* ─── Helpers ─── */

    private function prepare_form($post)
    {
        $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
        $fields    = isset($form_data['fields']) ? $form_data['fields'] : array();
        $form_id   = isset($form_data['id']) ? $form_data['id'] : $post->post_name;

        return array(
            'post_id'     => $post->ID,
            'form_id'     => $form_id,
            'title'       => $post->post_title,
            'description' => $post->post_content,
            'shortcode'   => sprintf('[kreebi_form id="%s"]', esc_attr($form_id)),
            'fields'      => $fields,
            'field_count' => count($fields),
            'date'        => get_the_date('Y-m-d', $post),
            'edit_url'    => get_edit_post_link($post->ID, 'raw'),
        );
    }

    private function prepare_submission($post)
    {
        $form_id   = get_post_meta($post->ID, '_krefrm_form_id', true);
        $form_post = $form_id ? get_post($form_id) : null;
        $data      = get_post_meta($post->ID, '_krefrm_data', true);

        return array(
            'id'        => $post->ID,
            'title'     => $post->post_title,
            'form_name' => $form_post ? $form_post->post_title : '—',
            'date'      => get_the_date('F j, Y g:i a', $post),
            'data'      => is_array($data) ? $data : array(),
        );
    }
}
