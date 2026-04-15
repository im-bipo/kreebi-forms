<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Form endpoints and form data helpers.
 */
trait Krefrm_Rest_Api_Forms
{
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

        // Validate webhook: if enabled, test must have passed
        if (! empty($form_data['formIntegrations']['webhook']['enabled'])) {
            if (empty($form_data['formIntegrations']['webhook']['tested'])) {
                return new WP_Error('webhook_not_tested', __('Webhook must be tested before saving. Please test the webhook configuration in the Webhook tab.', 'kreebi-forms'), array('status' => 400));
            }
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

        $form_data['id'] = $this->normalize_form_id($form_id);
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

        // Validate webhook: if enabled, test must have passed
        if (! empty($form_data['formIntegrations']['webhook']['enabled'])) {
            if (empty($form_data['formIntegrations']['webhook']['tested'])) {
                return new WP_Error('webhook_not_tested', __('Webhook must be tested before saving. Please test the webhook configuration in the Webhook tab.', 'kreebi-forms'), array('status' => 400));
            }
        }

        // Preserve canonical public form ID.
        $existing = get_post_meta($post->ID, '_krefrm_form_data', true);
        $form_id = $this->resolve_form_public_id($post, $existing);
        $form_data['id'] = $form_id;

        wp_update_post(array(
            'ID'           => $post->ID,
            'post_title'   => $form_data['name'],
            'post_content' => $form_data['description'],
            'post_name'    => $form_id,
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
            $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
            $form_id_value = $this->resolve_form_public_id($post, $form_data);
            $legacy_form_id_value = (string) $post->post_name;
            $meta_query = array(
                'relation' => 'OR',
                array(
                    'key'   => '_krefrm_form_id',
                    'value' => $post->ID,
                ),
                array(
                    'key'   => '_krefrm_form_id_value',
                    'value' => $form_id_value,
                ),
            );

            if ($legacy_form_id_value !== $form_id_value) {
                $meta_query[] = array(
                    'key'   => '_krefrm_form_id_value',
                    'value' => $legacy_form_id_value,
                );
            }

            $submissions = get_posts(array(
                'post_type'      => 'krefrm_submission',
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Required for matching canonical and legacy form identifiers.
                'meta_query'     => $meta_query,
            ));
            foreach ($submissions as $submission) {
                wp_delete_post($submission->ID, true);
            }
        }

        wp_delete_post($post->ID, true);

        return rest_ensure_response(array('deleted' => true));
    }

}
