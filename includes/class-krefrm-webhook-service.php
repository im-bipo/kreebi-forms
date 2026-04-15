<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Webhook integration utilities.
 */
class Krefrm_Webhook_Service
{
    const LOG_OPTION = 'krefrm_webhook_logs';
    const MAX_LOG_ITEMS = 100;

    /**
     * Default webhook settings.
     */
    public static function get_default_settings()
    {
        return array(
            'urls' => array(),
            'headers' => "",
            'bodyTemplate' => '[[allForm]]',
        );
    }

    /**
     * Sanitize webhook settings payload.
     */
    public static function sanitize_settings($settings)
    {
        $defaults = self::get_default_settings();
        if (! is_array($settings)) {
            return $defaults;
        }

        $sanitized = $defaults;

        if (isset($settings['urls'])) {
            $sanitized['urls'] = self::sanitize_urls($settings['urls']);
        }

        if (isset($settings['headers'])) {
            $sanitized['headers'] = sanitize_textarea_field($settings['headers']);
        }

        if (isset($settings['bodyTemplate'])) {
            $body = sanitize_textarea_field($settings['bodyTemplate']);
            $sanitized['bodyTemplate'] = '' === trim($body) ? '[[allForm]]' : $body;
        }

        return $sanitized;
    }

    /**
     * Resolve global + form overrides.
     */
    public static function resolve_settings($global_settings, $form_settings)
    {
        $global = self::sanitize_settings($global_settings);

        if (! is_array($form_settings) || empty($form_settings)) {
            return $global;
        }

        $use_global = ! isset($form_settings['_useGlobal']) || (bool) $form_settings['_useGlobal'];
        if ($use_global) {
            return $global;
        }

        $resolved = $global;
        if (array_key_exists('urls', $form_settings)) {
            $resolved['urls'] = self::sanitize_urls($form_settings['urls']);
        }
        if (array_key_exists('headers', $form_settings)) {
            $resolved['headers'] = sanitize_textarea_field($form_settings['headers']);
        }
        if (array_key_exists('bodyTemplate', $form_settings)) {
            $body = sanitize_textarea_field($form_settings['bodyTemplate']);
            $resolved['bodyTemplate'] = '' === trim($body) ? '[[allForm]]' : $body;
        }

        return $resolved;
    }

    /**
     * Dispatch webhook requests for one payload across all configured URLs.
     */
    public static function dispatch($settings, $form_id, $form_description, $fields, $source = 'submission', $form_name = '')
    {
        $sanitized = self::sanitize_settings($settings);
        if (empty($sanitized['urls'])) {
            return array();
        }

        $all_form = array(
            'form_id' => (string) $form_id,
            'form_description' => (string) $form_description,
            'fields' => self::sanitize_fields($fields),
        );

        $body = self::render_body_template($sanitized['bodyTemplate'], $all_form);
        $headers = self::build_headers($sanitized['headers']);

        $results = array();

        foreach ($sanitized['urls'] as $url) {
            $response = wp_remote_request($url, array(
                'method'  => 'POST',
                'timeout' => 15,
                'headers' => $headers,
                'body'    => $body,
            ));

            $code = 0;
            $response_body = '';
            $error_message = '';

            if (is_wp_error($response)) {
                $error_message = $response->get_error_message();
            } else {
                $code = (int) wp_remote_retrieve_response_code($response);
                $response_body = (string) wp_remote_retrieve_body($response);
            }

            $passed = ($code >= 200 && $code < 300);

            $item = array(
                'timestamp' => current_time('mysql'),
                'source' => sanitize_key($source),
                'url' => esc_url_raw($url),
                'request_body' => $body,
                'request_headers' => $headers,
                'response_code' => $code,
                'response_body' => $response_body,
                'error' => $error_message,
                'passed' => $passed,
                'form_id' => (string) $form_id,
                'form_name' => (string) $form_name,
            );

            self::append_log($item);

            $results[] = array(
                'url' => $item['url'],
                'passed' => $passed,
                'responseCode' => $code,
                'responseBody' => $response_body,
                'error' => $error_message,
            );
        }

        return $results;
    }

    /**
     * Build submission payload from form post.
     */
    public static function dispatch_from_form_post($settings, $form_post, $fields, $source = 'submission')
    {
        if (! $form_post instanceof WP_Post) {
            return array();
        }

        $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);
        $form_id = isset($form_data['id']) && '' !== (string) $form_data['id']
            ? (string) $form_data['id']
            : (string) $form_post->post_name;
        $form_name = (string) $form_post->post_title;

        return self::dispatch(
            $settings,
            $form_id,
            (string) $form_post->post_content,
            $fields,
            $source,
            $form_name
        );
    }

    /**
     * List all webhook logs.
     */
    public static function get_logs()
    {
        $posts = get_posts(array(
            'post_type' => 'krefrm_webhook_log',
            'posts_per_page' => -1,
            'orderby' => 'ID',
            'order' => 'DESC',
        ));

        $logs = array();
        foreach ($posts as $post) {
            $logs[] = self::post_to_log($post);
        }
        return $logs;
    }

    /**
     * Get webhook logs for a specific form.
     */
    public static function get_logs_by_form($form_id)
    {
        $posts = get_posts(array(
            'post_type' => 'krefrm_webhook_log',
            'posts_per_page' => -1,
            'orderby' => 'ID',
            'order' => 'DESC',
            // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Filtering logs by stored form ID requires meta query.
            'meta_query' => array(
                array(
                    'key' => '_krefrm_webhook_form_id',
                    'value' => (string) $form_id,
                    'compare' => '=',
                ),
            ),
        ));

        $logs = array();
        foreach ($posts as $post) {
            $logs[] = self::post_to_log($post);
        }
        return $logs;
    }

    /**
     * Remove all webhook logs.
     */
    public static function clear_logs()
    {
        $posts = get_posts(array(
            'post_type' => 'krefrm_webhook_log',
            'posts_per_page' => -1,
        ));
        foreach ($posts as $post) {
            wp_delete_post($post->ID, true);
        }
    }

    /**
     * Convert a webhook log post to array.
     */
    private static function post_to_log($post)
    {
        $status = get_post_meta($post->ID, '_krefrm_webhook_status', true);

        return array(
            'form_id' => get_post_meta($post->ID, '_krefrm_webhook_form_id', true),
            'form_name' => get_post_meta($post->ID, '_krefrm_webhook_form_name', true),
            'url' => get_post_meta($post->ID, '_krefrm_webhook_url', true),
            'request_headers' => get_post_meta($post->ID, '_krefrm_webhook_req_headers', true),
            'request_body' => get_post_meta($post->ID, '_krefrm_webhook_req_body', true),
            'response_code' => (int) get_post_meta($post->ID, '_krefrm_webhook_res_code', true),
            'response_body' => get_post_meta($post->ID, '_krefrm_webhook_res_body', true),
            'error' => get_post_meta($post->ID, '_krefrm_webhook_error', true),
            'status' => $status,
            'passed' => $status === 'success',
            'timestamp' => $post->post_date,
        );
    }

    private static function sanitize_urls($urls)
    {
        $items = array();

        if (is_array($urls)) {
            $items = $urls;
        } elseif (is_string($urls)) {
            $items = preg_split('/\r\n|\r|\n/', $urls);
        }

        $clean = array();

        foreach ($items as $item) {
            $url = esc_url_raw(trim((string) $item));
            if ('' === $url || ! wp_http_validate_url($url)) {
                continue;
            }
            $clean[] = $url;
        }

        return array_values(array_unique($clean));
    }

    private static function sanitize_fields($fields)
    {
        $clean = array();
        if (! is_array($fields)) {
            return $clean;
        }

        foreach ($fields as $k => $v) {
            $key = sanitize_key($k);
            if ('' === $key) {
                continue;
            }
            if (is_array($v)) {
                $clean[$key] = implode(', ', array_map('sanitize_text_field', $v));
            } else {
                $clean[$key] = sanitize_text_field((string) $v);
            }
        }

        return $clean;
    }

    private static function render_body_template($template, $all_form)
    {
        $template = (string) $template;
        if ('' === trim($template)) {
            $template = '[[allForm]]';
        }

        $replace = array(
            '[[allForm]]' => wp_json_encode($all_form),
            '[[formId]]' => (string) $all_form['form_id'],
            '[[formDescription]]' => (string) $all_form['form_description'],
        );

        foreach ($all_form['fields'] as $key => $value) {
            $replace['[[' . $key . ']]'] = (string) $value;
        }

        return str_replace(array_keys($replace), array_values($replace), $template);
    }

    private static function build_headers($headers_text)
    {
        $headers = array(
            'Content-Type' => 'application/json',
        );

        $raw = trim((string) $headers_text);
        if ('' === $raw) {
            return $headers;
        }

        if ('{' === substr($raw, 0, 1)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                foreach ($decoded as $key => $value) {
                    $header_key = sanitize_text_field((string) $key);
                    if ('' === $header_key) {
                        continue;
                    }
                    $headers[$header_key] = sanitize_text_field((string) $value);
                }
                return $headers;
            }
        }

        $lines = preg_split('/\r\n|\r|\n/', $raw);
        foreach ($lines as $line) {
            $line = trim((string) $line);
            if ('' === $line || false === strpos($line, ':')) {
                continue;
            }
            list($key, $value) = explode(':', $line, 2);
            $header_key = sanitize_text_field(trim($key));
            if ('' === $header_key) {
                continue;
            }
            $headers[$header_key] = sanitize_text_field(trim($value));
        }

        return $headers;
    }

    private static function append_log($item)
    {
        $post_id = wp_insert_post(array(
            'post_type' => 'krefrm_webhook_log',
            'post_status' => 'publish',
            'post_title' => sprintf(
                '%s - %s',
                isset($item['form_name']) ? $item['form_name'] : 'Webhook',
                isset($item['url']) ? $item['url'] : 'Unknown'
            ),
            'post_date' => $item['timestamp'],
        ));

        if ($post_id && ! is_wp_error($post_id)) {
            update_post_meta($post_id, '_krefrm_webhook_form_id', isset($item['form_id']) ? $item['form_id'] : '');
            update_post_meta($post_id, '_krefrm_webhook_form_name', isset($item['form_name']) ? $item['form_name'] : '');
            update_post_meta($post_id, '_krefrm_webhook_url', isset($item['url']) ? $item['url'] : '');
            update_post_meta($post_id, '_krefrm_webhook_req_headers', isset($item['request_headers']) ? serialize($item['request_headers']) : '');
            update_post_meta($post_id, '_krefrm_webhook_req_body', isset($item['request_body']) ? $item['request_body'] : '');
            update_post_meta($post_id, '_krefrm_webhook_res_code', isset($item['response_code']) ? $item['response_code'] : '');
            update_post_meta($post_id, '_krefrm_webhook_res_body', isset($item['response_body']) ? $item['response_body'] : '');
            update_post_meta($post_id, '_krefrm_webhook_error', isset($item['error']) ? $item['error'] : '');
            update_post_meta($post_id, '_krefrm_webhook_status', isset($item['passed']) && $item['passed'] ? 'success' : 'error');
        }

        // Cleanup old logs (keep max items)
        $posts = get_posts(array(
            'post_type' => 'krefrm_webhook_log',
            'posts_per_page' => -1,
            'orderby' => 'ID',
            'order' => 'DESC',
            'fields' => 'ids',
        ));
        if (count($posts) > self::MAX_LOG_ITEMS) {
            $to_delete = array_slice($posts, self::MAX_LOG_ITEMS);
            foreach ($to_delete as $delete_id) {
                wp_delete_post($delete_id, true);
            }
        }
    }
}
