<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Shortcode Handler
 */
class Krefrm_Shortcode
{
    private $allowed_types = array('text', 'email', 'password', 'number');

    public function __construct()
    {
        add_action('init', array($this, 'register'));
    }

    public function register()
    {
        add_shortcode('kreebi_form', array($this, 'render'));
    }

    /**
     * Shortcode renderer: [kreebi_form id="001"]
     */
    public function render($atts = array())
    {
        $atts = shortcode_atts(array('id' => '', 'post_id' => ''), $atts, 'kreebi_form');

        // Find form post
        $form_post = null;
        if (! empty($atts['post_id']) && is_numeric($atts['post_id'])) {
            $form_post = get_post(intval($atts['post_id']));
        } elseif (! empty($atts['id'])) {
            $posts = get_posts(array(
                'post_type'      => 'krefrm_form',
                'name'           => sanitize_title($atts['id']),
                'post_status'    => 'publish',
                'posts_per_page' => 1,
            ));
            if (! empty($posts)) {
                $form_post = $posts[0];
            }
        }

        if (! $form_post) {
            return '';
        }

        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);
        $fields    = isset($form_data['fields']) ? $form_data['fields'] : array();

        $action  = esc_url(admin_url('admin-post.php'));
        $form_id = $form_post->post_name;

        $html  = '<form class="krefrm-frontend-form" method="post" action="' . $action . '">';
        $html .= '<input type="hidden" name="action" value="krefrm_submit">';
        $html .= '<input type="hidden" name="krefrm_form_id" value="' . esc_attr($form_id) . '">';
        $html .= wp_nonce_field('krefrm_frontend_submit', 'krefrm_frontend_submit', true, false);

        foreach ($fields as $i => $f) {
            $name        = isset($f['name']) ? $f['name'] : 'field_' . $i;
            $key         = sanitize_key(preg_replace('/\s+/', '_', strtolower($name)));
            $type        = isset($f['type']) ? $f['type'] : 'text';
            // Validate field type against allowed types for security
            if (! in_array($type, $this->allowed_types, true)) {
                $type = 'text';
            }
            $placeholder = isset($f['placeholder']) ? $f['placeholder'] : '';

            $html .= '<p class="krefrm-field">';
            $html .= '<label>' . esc_html($name) . '<br/>';
            $html .= '<input type="' . esc_attr($type) . '" name="krefrm_fields[' . esc_attr($key) . ']" placeholder="' . esc_attr($placeholder) . '" />';
            $html .= '</label>';
            $html .= '</p>';
        }

        $html .= '<p><button type="submit">' . esc_html__('Submit', 'kreebi-forms') . '</button></p>';
        $html .= '</form>';

        return $html;
    }
}
