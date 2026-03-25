<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Webhook-related endpoints.
 */
trait Krefrm_Rest_Api_Webhooks
{
    public function test_webhook($request)
    {
        $body = $request->get_json_params();
        $webhook = isset($body['webhook']) && is_array($body['webhook'])
            ? Krefrm_Webhook_Service::sanitize_settings($body['webhook'])
            : Krefrm_Webhook_Service::get_default_settings();

        if (empty($webhook['urls'])) {
            return new WP_Error(
                'missing_webhook_urls',
                __('Add at least one valid webhook URL to run a test.', 'kreebi-forms'),
                array('status' => 400)
            );
        }

        $sample = isset($body['samplePayload']) && is_array($body['samplePayload'])
            ? $body['samplePayload']
            : array();

        $form_id = isset($sample['formId']) ? sanitize_text_field($sample['formId']) : '102';
        $form_description = isset($sample['formDescription']) ? sanitize_text_field($sample['formDescription']) : '';

        $fields = array();
        if (! empty($sample['fields']) && is_array($sample['fields'])) {
            foreach ($sample['fields'] as $key => $value) {
                $safe_key = sanitize_key($key);
                if ('' === $safe_key) {
                    continue;
                }
                $fields[$safe_key] = is_array($value)
                    ? implode(', ', array_map('sanitize_text_field', $value))
                    : sanitize_text_field((string) $value);
            }
        }

        $results = Krefrm_Webhook_Service::dispatch(
            $webhook,
            $form_id,
            $form_description,
            $fields,
            'test'
        );

        $passed = ! empty($results);
        foreach ($results as $result) {
            if (empty($result['passed'])) {
                $passed = false;
                break;
            }
        }

        return rest_ensure_response(array(
            'passed' => $passed,
            'results' => $results,
        ));
    }

    public function get_webhook_logs($request)
    {
        $form_id = $request->get_param('form_id');

        if ($form_id) {
            $logs = Krefrm_Webhook_Service::get_logs_by_form($form_id);
        } else {
            $logs = Krefrm_Webhook_Service::get_logs();
        }

        return rest_ensure_response(array(
            'logs' => $logs,
        ));
    }

    public function clear_webhook_logs($request)
    {
        $form_id = $request->get_param('form_id');

        if ($form_id) {
            // Clear logs for a specific form
            $posts = get_posts(array(
                'post_type' => 'krefrm_webhook_log',
                'posts_per_page' => -1,
                'fields' => 'ids',
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Filtering webhook logs by form ID requires post meta lookup.
                'meta_query' => array(
                    array(
                        'key' => '_krefrm_webhook_form_id',
                        'value' => (string) $form_id,
                        'compare' => '=',
                    ),
                ),
            ));
            foreach ($posts as $post_id) {
                wp_delete_post($post_id, true);
            }
        } else {
            // Clear all logs
            Krefrm_Webhook_Service::clear_logs();
        }

        return rest_ensure_response(array(
            'cleared' => true,
            'logs' => array(),
        ));
    }

}
