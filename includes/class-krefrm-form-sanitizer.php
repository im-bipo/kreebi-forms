<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Form Data Sanitizer
 *
 * Supports both legacy single-step (fields) and new multi-step (steps) formats.
 * Always normalises output to the steps format.
 */
class Krefrm_Form_Sanitizer
{
    private $allowed_types = array('text', 'email', 'password', 'number');

    private $allowed_style_templates = array('kreebi_style_1', 'kreebi_style_2', 'blank_dev');

    public function sanitize($data)
    {
        // Sanitize styleTemplate (form-level setting)
        $style_template = 'kreebi_style_1'; // default
        if (! empty($data['styleTemplate']) && in_array($data['styleTemplate'], $this->allowed_style_templates, true)) {
            $style_template = $data['styleTemplate'];
        }

        $sanitized = array(
            'name'          => isset($data['name']) ? sanitize_text_field($data['name']) : '',
            'description'   => isset($data['description']) ? sanitize_textarea_field($data['description']) : '',
            'id'            => isset($data['id']) ? sanitize_text_field($data['id']) : '',
            'styleTemplate' => $style_template,
            'steps'         => array(),
        );

        // New multi-step format
        if (! empty($data['steps']) && is_array($data['steps'])) {
            foreach ($data['steps'] as $step) {
                if (! is_array($step)) {
                    continue;
                }

                $sanitized_step = array(
                    'name'   => isset($step['name']) ? sanitize_text_field($step['name']) : '',
                    'fields' => array(),
                );

                if (! empty($step['fields']) && is_array($step['fields'])) {
                    foreach ($step['fields'] as $field) {
                        if (! is_array($field)) {
                            continue;
                        }
                        $sanitized_step['fields'][] = $this->sanitize_field($field);
                    }
                }

                $sanitized['steps'][] = $sanitized_step;
            }
        }
        // Legacy flat fields format — wrap in a single step
        elseif (! empty($data['fields']) && is_array($data['fields'])) {
            $step = array(
                'name'   => '',
                'fields' => array(),
            );

            foreach ($data['fields'] as $field) {
                if (! is_array($field)) {
                    continue;
                }
                $step['fields'][] = $this->sanitize_field($field);
            }

            $sanitized['steps'][] = $step;
        }

        return $sanitized;
    }

    /**
     * Sanitize a single field definition.
     */
    private function sanitize_field($field)
    {
        $type = isset($field['type']) ? sanitize_key($field['type']) : 'text';
        if (! in_array($type, $this->allowed_types, true)) {
            $type = 'text';
        }

        $sanitized_field = array(
            'name'        => isset($field['name']) ? sanitize_text_field($field['name']) : '',
            'type'        => $type,
            'placeholder' => isset($field['placeholder']) ? sanitize_text_field($field['placeholder']) : '',
            'required'    => ! empty($field['required']),
        );

        // Sanitize optional wrapper attributes (class / id)
        $wrapper = array('class' => '', 'id' => '');

        if (! empty($field['wrapper']) && is_array($field['wrapper'])) {
            if (! empty($field['wrapper']['class'])) {
                $classes           = explode(' ', $field['wrapper']['class']);
                $sanitized_classes = array_map('sanitize_html_class', $classes);
                $wrapper['class']  = implode(' ', array_filter($sanitized_classes));
            }
            if (! empty($field['wrapper']['id'])) {
                $wrapper['id'] = sanitize_html_class($field['wrapper']['id']);
            }
        }

        $sanitized_field['wrapper'] = $wrapper;

        // Layout (colSpan for grid width)
        $col_span = 12; // default full width
        if (! empty($field['layout']) && is_array($field['layout'])) {
            if (isset($field['layout']['colSpan'])) {
                $span = absint($field['layout']['colSpan']);
                if (in_array($span, array(4, 6, 8, 12), true)) {
                    $col_span = $span;
                }
            }
        }
        $sanitized_field['layout'] = array('colSpan' => $col_span);

        return $sanitized_field;
    }
}
