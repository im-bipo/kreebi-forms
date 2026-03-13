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

        // Custom CSS endpoint
        register_rest_route(self::NAMESPACE, '/custom-css', array(
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

        $force = filter_var($request->get_param('force'), FILTER_VALIDATE_BOOLEAN);
        if ($force) {
            // If the user explicitly requested a force delete, remove the form's submissions too.
            $form_id_value = $post->post_name;
            $submissions = get_posts(array(
                'post_type'      => 'krefrm_submission',
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'meta_query'     => array(
                    'relation' => 'OR',
                    array(
                        'key'   => '_krefrm_form_id',
                        'value' => $post->ID,
                    ),
                    array(
                        'key'   => '_krefrm_form_id_value',
                        'value' => $form_id_value,
                    ),
                ),
            ));
            foreach ($submissions as $submission) {
                wp_delete_post($submission->ID, true);
            }
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
                $text_fields = array('recipientEmail', 'senderName', 'subject');
                foreach ($text_fields as $key) {
                    if (isset($email_settings[$key])) {
                        $sanitized[$key] = sanitize_text_field($email_settings[$key]);
                    }
                }
                // Body template can contain newlines – use textarea sanitizer
                if (isset($email_settings['bodyTemplate'])) {
                    $sanitized['bodyTemplate'] = sanitize_textarea_field($email_settings['bodyTemplate']);
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

    /* ─── Custom CSS ─── */

    public function get_custom_css()
    {
        $css_file = KREFRM_PLUGIN_DIR . 'includes/custom-css.css';
        $css_content = '';

        if (file_exists($css_file)) {
            $css_content = file_get_contents($css_file);
        }

        return rest_ensure_response(array(
            'css' => $css_content,
        ));
    }

    public function save_custom_css($request)
    {
        $body = $request->get_json_params();
        $css = isset($body['css']) ? $body['css'] : '';

        // Sanitize CSS by removing any script tags or other potentially dangerous content
        $css = $this->sanitize_custom_css($css);

        // Validate CSS syntax
        $validation = $this->validate_css_syntax($css);
        if (!$validation['valid']) {
            return new WP_Error(
                'invalid_css',
                __('Invalid CSS syntax: ', 'kreebi-forms') . $validation['error'],
                array('status' => 400)
            );
        }

        // Save to file
        $css_file = KREFRM_PLUGIN_DIR . 'includes/custom-css.css';

        // Ensure the includes directory exists
        if (!is_dir(KREFRM_PLUGIN_DIR . 'includes')) {
            mkdir(KREFRM_PLUGIN_DIR . 'includes', 0755, true);
        }

        // Write file with proper file permissions
        $result = file_put_contents($css_file, $css, LOCK_EX);

        if ($result === false) {
            return new WP_Error(
                'file_write_error',
                __('Could not save custom CSS file.', 'kreebi-forms'),
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Custom CSS saved successfully.', 'kreebi-forms'),
            'css' => $css,
        ));
    }

    /**
     * Sanitize custom CSS input
     * - Remove script tags and other potentially dangerous content
     * - Strip HTML tags
     * - Remove JavaScript event handlers
     */
    private function sanitize_custom_css($css)
    {
        // Remove any script tags
        $css = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $css);

        // Remove any HTML tags
        $css = strip_tags($css);

        // Remove JavaScript event handlers (onclick, onerror, etc.)
        $css = preg_replace('/javascript:/is', '', $css);
        $css = preg_replace('/on\w+\s*=/is', '', $css);

        // Remove import statements (could load external CSS)
        $css = preg_replace('/@import[^;]*;/is', '', $css);

        // Trim whitespace
        $css = trim($css);

        return $css;
    }

    /**
     * Validate CSS syntax
     * Basic validation to check for balanced braces and proper structure
     */
    private function validate_css_syntax($css)
    {
        $css = trim($css);

        // Empty CSS is valid
        if (empty($css)) {
            return array('valid' => true);
        }

        // Count opening and closing braces
        $open_braces = substr_count($css, '{');
        $close_braces = substr_count($css, '}');

        if ($open_braces !== $close_braces) {
            return array(
                'valid' => false,
                'error' => sprintf(
                    __('Mismatched braces: %d opening, %d closing', 'kreebi-forms'),
                    $open_braces,
                    $close_braces
                ),
            );
        }

        // Check for unmatched parentheses (common in CSS functions like rgb(), calc(), etc.)
        $open_parens = substr_count($css, '(');
        $close_parens = substr_count($css, ')');

        if ($open_parens !== $close_parens) {
            return array(
                'valid' => false,
                'error' => sprintf(
                    __('Mismatched parentheses: %d opening, %d closing', 'kreebi-forms'),
                    $open_parens,
                    $close_parens
                ),
            );
        }

        // Basic regex to check for proper CSS structure (selector { property: value; })
        // This is a simplified check and won't catch all CSS syntax errors
        if (!preg_match('/^[^{}]*\{[^{}]*\}/', $css)) {
            // Only validate if CSS appears to have selectors and rules
            if (strpos($css, '{') !== false || strpos($css, '}') !== false) {
                return array(
                    'valid' => false,
                    'error' => __('CSS appears to have invalid structure', 'kreebi-forms'),
                );
            }
        }

        return array('valid' => true);
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
            'post_id'          => $post->ID,
            'form_id'          => $form_id,
            'title'            => $post->post_title,
            'description'      => $post->post_content,
            'shortcode'        => sprintf('[kreebi_form id="%s"]', esc_attr($form_id)),
            'styleTemplate'    => isset($form_data['styleTemplate']) ? $form_data['styleTemplate'] : 'kreebi_style_1',
            'steps'            => $steps,
            'fields'           => $all_fields,
            'field_count'      => count($all_fields),
            'date'             => get_the_date('Y-m-d', $post),
            'edit_url'         => get_edit_post_link($post->ID, 'raw'),
            'formIntegrations' => isset($form_data['formIntegrations']) && is_array($form_data['formIntegrations'])
                ? $form_data['formIntegrations']
                : (object) array(),
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
