<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Shared helper methods for forms/submissions.
 */
trait Krefrm_Rest_Api_Helpers
{
    private function normalize_style_template_id($value)
    {
        $template = sanitize_text_field((string) $value);
        $template = trim($template, " \t\n\r\0\x0B\"'");
        $legacy_map = array(
            'kreebi_style_1' => 'style-polished',
            'kreebi_style_2' => 'style-flat',
            'blank_dev' => 'style-blank',
        );

        if (isset($legacy_map[$template])) {
            return $legacy_map[$template];
        }

        return $template;
    }

    private function prepare_form($post)
    {
        $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
        $form_id   = $this->resolve_form_public_id($post, $form_data);

        if (! is_array($form_data)) {
            $form_data = array();
        }

        $needs_meta_sync = ! isset($form_data['id']) || (string) $form_data['id'] !== $form_id;
        if ($needs_meta_sync) {
            $form_data['id'] = $form_id;
            update_post_meta($post->ID, '_krefrm_form_data', $form_data);
        }

        if ((string) $post->post_name !== $form_id) {
            wp_update_post(array(
                'ID' => $post->ID,
                'post_name' => $form_id,
            ));
        }

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
            'styleTemplate'    => isset($form_data['styleTemplate'])
                ? $this->normalize_style_template_id($form_data['styleTemplate'])
                : 'style-polished',
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
        $form_uuid = $form_post ? $this->resolve_form_public_id($form_post, $form_data) : '';
        $data      = get_post_meta($post->ID, '_krefrm_data', true);

        return array(
            'id'        => $post->ID,
            'title'     => $post->post_title,
            'form_id'   => $form_uuid,
            'form_name' => $form_post ? $form_post->post_title : '—',
            'date'      => get_the_date('F j, Y g:i a', $post),
            'timestamp' => get_post_time('c', false, $post),
            'data'      => is_array($data) ? $data : array(),
        );
    }

    /**
     * Normalize user-facing form IDs to numeric strings (minimum 3 digits).
     */
    private function normalize_form_id($value)
    {
        $raw = preg_replace('/\D+/', '', (string) $value);
        if ('' === $raw) {
            return '';
        }

        return str_pad((string) intval($raw), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Resolve canonical public form ID from form meta first, then slug.
     */
    private function resolve_form_public_id($post, $form_data)
    {
        if (is_array($form_data) && isset($form_data['id'])) {
            $normalized = $this->normalize_form_id($form_data['id']);
            if ('' !== $normalized) {
                return $normalized;
            }
        }

        if ($post instanceof WP_Post) {
            $normalized = $this->normalize_form_id($post->post_name);
            if ('' !== $normalized) {
                return $normalized;
            }
        }

        return $this->get_next_form_id();
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
