<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Form Data Sanitizer
 */
class Krefrm_Form_Sanitizer
{
    private $allowed_types = array('text', 'email', 'password', 'number');

    public function sanitize($data)
    {
        $sanitized = array(
            'name'        => isset($data['name']) ? sanitize_text_field($data['name']) : '',
            'description' => isset($data['description']) ? sanitize_textarea_field($data['description']) : '',
            'id'          => isset($data['id']) ? sanitize_text_field($data['id']) : '',
            'fields'      => array(),
        );

        if (! empty($data['fields']) && is_array($data['fields'])) {
            foreach ($data['fields'] as $field) {
                if (! is_array($field)) {
                    continue;
                }

                $type = isset($field['type']) ? sanitize_key($field['type']) : 'text';
                if (! in_array($type, $this->allowed_types, true)) {
                    $type = 'text';
                }

                $sanitized['fields'][] = array(
                    'name'        => isset($field['name']) ? sanitize_text_field($field['name']) : '',
                    'type'        => $type,
                    'placeholder' => isset($field['placeholder']) ? sanitize_text_field($field['placeholder']) : '',
                );
            }
        }

        return $sanitized;
    }
}
