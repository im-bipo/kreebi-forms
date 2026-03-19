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
    private $allowed_types = array('text', 'email', 'password', 'number', 'checkbox', 'radio', 'dropdown');

    private $allowed_style_templates = array('kreebi_style_1', 'kreebi_style_2', 'blank_dev');

    public function sanitize($data)
    {
        // Sanitize styleTemplate (form-level setting)
        $style_template = 'kreebi_style_1'; // default
        if (! empty($data['styleTemplate']) && in_array($data['styleTemplate'], $this->allowed_style_templates, true)) {
            $style_template = $data['styleTemplate'];
        }

        $sanitized = array(
            'name'             => isset($data['name']) ? sanitize_text_field($data['name']) : '',
            'description'      => isset($data['description']) ? sanitize_textarea_field($data['description']) : '',
            'id'               => isset($data['id']) ? sanitize_text_field($data['id']) : '',
            'styleTemplate'    => $style_template,
            'steps'            => array(),
            'formIntegrations' => array(),
        );

        // Form-level integration overrides
        if (! empty($data['formIntegrations']) && is_array($data['formIntegrations'])) {
            $sanitized['formIntegrations'] = $this->sanitize_form_integrations($data['formIntegrations']);
        }

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
        if ('select' === $type) {
            $type = 'dropdown';
        }
        if (! in_array($type, $this->allowed_types, true)) {
            $type = 'text';
        }

        $sanitized_field = array(
            'name'        => isset($field['name']) ? sanitize_text_field($field['name']) : '',
            'type'        => $type,
            'required'    => ! empty($field['required']),
        );

        // Add placeholder only for non-choice-based fields
        if (! in_array($type, array('checkbox', 'radio', 'dropdown'), true)) {
            $sanitized_field['placeholder'] = isset($field['placeholder']) ? sanitize_text_field($field['placeholder']) : '';
        }

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

        // Handle choice-based fields (checkbox, radio, dropdown)
        if (in_array($type, array('checkbox', 'radio', 'dropdown'), true)) {
            $sanitized_field['options'] = array();

            if (! empty($field['options']) && is_array($field['options'])) {
                foreach ($field['options'] as $option) {
                    if (is_array($option)) {
                        $label = isset($option['label']) ? sanitize_text_field($option['label']) : '';
                        $value = isset($option['value']) ? sanitize_text_field($option['value']) : '';
                    } else {
                        $label = sanitize_text_field((string) $option);
                        $value = $label;
                    }

                    if ('' === $label && '' === $value) {
                        continue;
                    }

                    $sanitized_field['options'][] = array(
                        'label' => $label,
                        'value' => $value,
                    );
                }
            }
        }

        return $sanitized_field;
    }

    /**
     * Sanitize per-form integration settings.
     *
     * Structure: { integrationId: { _useGlobal: bool, ...overrides } }
     */
    public function sanitize_form_integrations($data)
    {
        if (! is_array($data)) {
            return array();
        }

        $sanitized = array();

        foreach ($data as $integration_id => $settings) {
            $integration_id = sanitize_key($integration_id);
            if (! is_array($settings)) {
                continue;
            }

            $clean = array();

            if (isset($settings['_useGlobal'])) {
                $clean['_useGlobal'] = (bool) $settings['_useGlobal'];
            }

            // Email notification overrides
            if ($integration_id === 'email-notification') {
                $text_fields = array(
                    'recipientEmail',
                    'senderName',
                    'subject',
                    'styleVariant',
                    'businessName',
                    'buttonText',
                );
                foreach ($text_fields as $key) {
                    if (isset($settings[$key])) {
                        $clean[$key] = sanitize_text_field($settings[$key]);
                    }
                }
                if (isset($settings['logoUrl'])) {
                    $clean['logoUrl'] = esc_url_raw($settings['logoUrl']);
                }
                if (isset($settings['buttonUrl'])) {
                    $clean['buttonUrl'] = esc_url_raw($settings['buttonUrl']);
                }
                if (isset($settings['themeColor'])) {
                    $color = sanitize_text_field($settings['themeColor']);
                    $clean['themeColor'] = preg_match('/^#[0-9A-Fa-f]{6}$/', $color) ? strtoupper($color) : '#1875E5';
                }
                if (isset($settings['message'])) {
                    $clean['message'] = sanitize_textarea_field($settings['message']);
                }
                if (isset($settings['footerContactDetails'])) {
                    $clean['footerContactDetails'] = sanitize_textarea_field($settings['footerContactDetails']);
                }
                if (isset($settings['bodyTemplate'])) {
                    $clean['bodyTemplate'] = sanitize_textarea_field($settings['bodyTemplate']);
                }
            }

            // Webhook overrides
            if ($integration_id === 'webhook') {
                if (isset($settings['enabled'])) {
                    $clean['enabled'] = (bool) $settings['enabled'];
                }
                if (isset($settings['urls'])) {
                    $webhook_partial = Krefrm_Webhook_Service::sanitize_settings(array(
                        'urls' => $settings['urls'],
                    ));
                    $clean['urls'] = $webhook_partial['urls'];
                }
                if (isset($settings['headers'])) {
                    $clean['headers'] = sanitize_textarea_field($settings['headers']);
                }
                if (isset($settings['bodyTemplate'])) {
                    $clean['bodyTemplate'] = sanitize_textarea_field($settings['bodyTemplate']);
                }
                if (isset($settings['tested'])) {
                    $clean['tested'] = (bool) $settings['tested'];
                }
            }

            $sanitized[$integration_id] = $clean;
        }

        return $sanitized;
    }
}
