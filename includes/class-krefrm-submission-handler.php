<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Submission Handler
 */
class Krefrm_Submission_Handler
{
    public function __construct()
    {
        add_action('admin_post_krefrm_submit', array($this, 'handle_submission'));
        add_action('admin_post_nopriv_krefrm_submit', array($this, 'handle_submission'));
    }

    public function handle_submission()
    {
        if (! isset($_POST['krefrm_form_id'])) {
            wp_safe_redirect(wp_get_referer() ?: home_url());
            exit;
        }

        $nonce = isset($_POST['krefrm_frontend_submit']) ? sanitize_text_field(wp_unslash($_POST['krefrm_frontend_submit'])) : '';
        if (! wp_verify_nonce($nonce, 'krefrm_frontend_submit')) {
            wp_die(esc_html__('Invalid submission (bad nonce).', 'kreebi-forms'));
        }

        $form_id = sanitize_text_field(wp_unslash($_POST['krefrm_form_id']));

        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'name'           => $form_id,
            'post_status'    => 'publish',
            'posts_per_page' => 1,
        ));

        if (empty($posts)) {
            wp_die(esc_html__('Form not found.', 'kreebi-forms'));
        }

        $form_post = $posts[0];
        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);

        // Sanitize submitted form fields array.
        $submitted = array();
        if (isset($_POST['krefrm_fields']) && is_array($_POST['krefrm_fields'])) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Each value sanitized in loop below.
            $form_fields = wp_unslash($_POST['krefrm_fields']);
            foreach ($form_fields as $k => $v) {
                $v = is_string($v) ? sanitize_text_field($v) : '';
                $submitted[sanitize_key($k)] = $v;
            }
        }

        $title   = $form_post->post_title . ' — ' . current_time('mysql');
        $post_id = wp_insert_post(array(
            'post_type'    => 'krefrm_submission',
            'post_status'  => 'publish',
            'post_title'   => $title,
            'post_content' => wp_json_encode($submitted),
        ));

        if (is_wp_error($post_id)) {
            wp_safe_redirect(add_query_arg('krefrm_error', rawurlencode($post_id->get_error_message()), wp_get_referer() ?: home_url()));
            exit;
        }

        update_post_meta($post_id, '_krefrm_form_id', $form_post->ID);
        update_post_meta($post_id, '_krefrm_form_id_value', $form_id);
        update_post_meta($post_id, '_krefrm_data', $submitted);

        wp_safe_redirect(add_query_arg('krefrm_submitted', '1', wp_get_referer() ?: home_url()));
        exit;
    }
}
