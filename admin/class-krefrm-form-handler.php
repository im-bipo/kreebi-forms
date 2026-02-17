<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Form Creation Handler
 */
class Krefrm_Form_Handler
{
    public function __construct()
    {
        add_action('admin_post_krefrm_create_form', array($this, 'handle_create_form'));
    }

    public function handle_create_form()
    {
        if (! current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized', 'kreebi-forms'));
        }

        check_admin_referer('krefrm_create_form');

        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised below after decode.
        $raw_json = isset($_POST['krefrm_form_json']) ? wp_unslash($_POST['krefrm_form_json']) : '';

        if ($raw_json === '') {
            $this->redirect_with_error(__('JSON input is required.', 'kreebi-forms'));
        }

        $decoded = json_decode($raw_json, true);

        if (! is_array($decoded)) {
            $this->redirect_with_error(__('Invalid JSON. Please check the syntax.', 'kreebi-forms'));
        }

        $sanitizer = new Krefrm_Form_Sanitizer();
        $form_data = $sanitizer->sanitize($decoded);

        if (empty($form_data['name'])) {
            $this->redirect_with_error(__('Form name is required.', 'kreebi-forms'));
        }

        // Generate sequential numeric ID (001, 002, 003, etc.)
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
            $this->redirect_with_error($post_id->get_error_message());
        }

        $form_data['id'] = $form_id;

        update_post_meta($post_id, '_krefrm_form_data', $form_data);

        wp_safe_redirect(add_query_arg(array(
            'page'              => 'krefrm_forms',
            'krefrm_created'    => '1',
            'krefrm_notice_nonce' => wp_create_nonce('krefrm_admin_notice'),
        ), admin_url('admin.php')));
        exit;
    }

    private function redirect_with_error($message)
    {
        wp_safe_redirect(add_query_arg(array(
            'page'               => 'krefrm_forms',
            'krefrm_error'       => rawurlencode($message),
            'krefrm_notice_nonce' => wp_create_nonce('krefrm_admin_notice'),
        ), admin_url('admin.php')));
        exit;
    }
}
