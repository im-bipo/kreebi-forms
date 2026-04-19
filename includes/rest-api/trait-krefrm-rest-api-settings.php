<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Global settings and integration definitions endpoints.
 */
trait Krefrm_Rest_Api_Settings
{
    private function normalize_default_editor($value)
    {
        $editor = sanitize_key((string) $value);
        $allowed = array('drag_drop');

        if (! in_array($editor, $allowed, true)) {
            return 'drag_drop';
        }

        return $editor;
    }

    public function get_settings()
    {
        $settings = get_option('krefrm_settings', array());
        if (! is_array($settings)) {
            $settings = array();
        }

        $default_editor = isset($settings['defaultEditor'])
            ? $this->normalize_default_editor($settings['defaultEditor'])
            : 'drag_drop';

        $captcha = isset($settings['captcha']) && is_array($settings['captcha'])
            ? $settings['captcha']
            : array();

        $threshold = isset($captcha['v3Threshold']) ? floatval($captcha['v3Threshold']) : 0.5;
        if ($threshold < 0) {
            $threshold = 0;
        }
        if ($threshold > 1) {
            $threshold = 1;
        }

        $response = rest_ensure_response(array(
            'styleTemplate' => get_option('krefrm_style_template', 'kreebi_style_1'),
            'defaultEditor' => $default_editor,
            'integrations' => isset($settings['integrations']) ? $settings['integrations'] : array(),
            'emailNotification' => isset($settings['emailNotification']) ? $settings['emailNotification'] : array(),
            'captcha' => array(
                'enabled' => ! empty($captcha['enabled']),
                'mode' => 'v3',
                'siteKey' => isset($captcha['siteKey']) ? sanitize_text_field($captcha['siteKey']) : '',
                'hasSecretKey' => ! empty($captcha['secretKey']),
                'v3Threshold' => $threshold,
            ),
            'customCss' => isset($settings['customCss']) ? $settings['customCss'] : '',
        ));

        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');

        return $response;
    }

    public function update_settings($request)
    {
        $body = $request->get_json_params();


        // Handle style template
        if (isset($body['styleTemplate'])) {
            $allowed = array('kreebi_style_1', 'kreebi_style_2', 'blank_dev');
            $template = sanitize_text_field($body['styleTemplate']);

            if (! in_array($template, $allowed, true)) {
                return new WP_Error('invalid_template', __('Invalid style template.', 'kreebi-forms'), array('status' => 400));
            }

            update_option('krefrm_style_template', $template);
        }

        // Handle integrations and other settings
        $settings = get_option('krefrm_settings', array());
        if (!is_array($settings)) {
            $settings = array();
        }


        if (isset($body['integrations'])) {
            $integrations = $body['integrations'];
            if (is_array($integrations)) {
                // Keep booleans as-is, don't sanitize
                $settings['integrations'] = $integrations;
            }
        }

        if (isset($body['defaultEditor'])) {
            $settings['defaultEditor'] = $this->normalize_default_editor($body['defaultEditor']);
        }

        if (isset($body['emailNotification'])) {
            $email_settings = $body['emailNotification'];
            if (is_array($email_settings)) {
                $sanitized = array();
                $text_fields = array(
                    'recipientEmail',
                    'senderName',
                    'subject',
                    'styleVariant',
                    'businessName',
                    'buttonText',
                );
                foreach ($text_fields as $key) {
                    if (isset($email_settings[$key])) {
                        $sanitized[$key] = sanitize_text_field($email_settings[$key]);
                    }
                }
                if (isset($email_settings['logoUrl'])) {
                    $sanitized['logoUrl'] = esc_url_raw($email_settings['logoUrl']);
                }
                if (isset($email_settings['buttonUrl'])) {
                    $sanitized['buttonUrl'] = esc_url_raw($email_settings['buttonUrl']);
                }
                if (isset($email_settings['themeColor'])) {
                    $color = sanitize_text_field($email_settings['themeColor']);
                    $sanitized['themeColor'] = preg_match('/^#[0-9A-Fa-f]{6}$/', $color) ? strtoupper($color) : '#1875E5';
                }
                if (isset($email_settings['message'])) {
                    $sanitized['message'] = sanitize_textarea_field($email_settings['message']);
                }
                if (isset($email_settings['footerContactDetails'])) {
                    $sanitized['footerContactDetails'] = sanitize_textarea_field($email_settings['footerContactDetails']);
                }
                // Body template can contain newlines – use textarea sanitizer
                if (isset($email_settings['bodyTemplate'])) {
                    $sanitized['bodyTemplate'] = sanitize_textarea_field($email_settings['bodyTemplate']);
                }
                $settings['emailNotification'] = $sanitized;
            }
        }

        if (isset($body['captcha'])) {
            $incoming_captcha = $body['captcha'];
            if (is_array($incoming_captcha)) {
                $existing_captcha = isset($settings['captcha']) && is_array($settings['captcha'])
                    ? $settings['captcha']
                    : array();

                $sanitized_captcha = array(
                    'enabled' => ! empty($incoming_captcha['enabled']),
                    'mode' => 'v3',
                    'siteKey' => isset($incoming_captcha['siteKey'])
                        ? sanitize_text_field($incoming_captcha['siteKey'])
                        : (isset($existing_captcha['siteKey']) ? sanitize_text_field($existing_captcha['siteKey']) : ''),
                    'secretKey' => isset($existing_captcha['secretKey']) ? sanitize_text_field($existing_captcha['secretKey']) : '',
                    'v3Threshold' => 0.5,
                );

                if (isset($incoming_captcha['secretKey']) && '' !== trim((string) $incoming_captcha['secretKey'])) {
                    $sanitized_captcha['secretKey'] = sanitize_text_field($incoming_captcha['secretKey']);
                }

                if (isset($incoming_captcha['v3Threshold'])) {
                    $threshold = floatval($incoming_captcha['v3Threshold']);
                    if ($threshold < 0) {
                        $threshold = 0;
                    }
                    if ($threshold > 1) {
                        $threshold = 1;
                    }
                    $sanitized_captcha['v3Threshold'] = $threshold;
                } elseif (isset($existing_captcha['v3Threshold'])) {
                    $threshold = floatval($existing_captcha['v3Threshold']);
                    if ($threshold < 0) {
                        $threshold = 0;
                    }
                    if ($threshold > 1) {
                        $threshold = 1;
                    }
                    $sanitized_captcha['v3Threshold'] = $threshold;
                }

                $captcha_validation = $this->validate_captcha_settings_before_save($sanitized_captcha, $incoming_captcha);
                if (is_wp_error($captcha_validation)) {
                    return $captcha_validation;
                }

                $settings['captcha'] = $sanitized_captcha;
            }
        }

        update_option('krefrm_settings', $settings);

        $captcha = isset($settings['captcha']) && is_array($settings['captcha'])
            ? $settings['captcha']
            : array();
        $threshold = isset($captcha['v3Threshold']) ? floatval($captcha['v3Threshold']) : 0.5;
        if ($threshold < 0) {
            $threshold = 0;
        }
        if ($threshold > 1) {
            $threshold = 1;
        }

        $default_editor = isset($settings['defaultEditor'])
            ? $this->normalize_default_editor($settings['defaultEditor'])
            : 'drag_drop';

        $response = rest_ensure_response(array(
            'styleTemplate' => get_option('krefrm_style_template', 'kreebi_style_1'),
            'defaultEditor' => $default_editor,
            'integrations' => isset($settings['integrations']) ? $settings['integrations'] : array(),
            'emailNotification' => isset($settings['emailNotification']) ? $settings['emailNotification'] : array(),
            'captcha' => array(
                'enabled' => ! empty($captcha['enabled']),
                'mode' => 'v3',
                'siteKey' => isset($captcha['siteKey']) ? sanitize_text_field($captcha['siteKey']) : '',
                'hasSecretKey' => ! empty($captcha['secretKey']),
                'v3Threshold' => $threshold,
            ),
        ));

        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');

        return $response;
    }

    private function validate_captcha_settings_before_save($captcha_settings, $incoming_captcha)
    {
        $site_key = isset($captcha_settings['siteKey']) ? sanitize_text_field($captcha_settings['siteKey']) : '';
        $secret_key = isset($captcha_settings['secretKey']) ? sanitize_text_field($captcha_settings['secretKey']) : '';
        $has_keys = ('' !== $site_key) || ('' !== $secret_key);
        $is_enabled = ! empty($captcha_settings['enabled']);

        if (! $is_enabled && ! $has_keys) {
            return true;
        }

        if ('' === $site_key || '' === $secret_key) {
            return new WP_Error(
                'captcha_keys_required',
                __('Please provide both reCAPTCHA site and secret keys before saving.', 'kreebi-forms'),
                array('status' => 400)
            );
        }

        $token = isset($incoming_captcha['validationToken'])
            ? sanitize_text_field($incoming_captcha['validationToken'])
            : '';

        if ('' === $token) {
            return new WP_Error(
                'captcha_validation_token_missing',
                __('Validation failed: No captcha token received. Please try saving again.', 'kreebi-forms'),
                array('status' => 400)
            );
        }

        $remote_ip = '';
        if (! empty($_SERVER['REMOTE_ADDR'])) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized immediately below.
            $remote_ip = sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']));
        }

        $body = array(
            'secret' => $secret_key,
            'response' => $token,
        );

        if ('' !== $remote_ip) {
            $body['remoteip'] = $remote_ip;
        }

        $response = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', array(
            'timeout' => 10,
            'body' => $body,
        ));

        if (is_wp_error($response)) {
            return new WP_Error(
                'captcha_validation_unreachable',
                __('Unable to reach Google reCAPTCHA API. Please check your connection and try again.', 'kreebi-forms'),
                array('status' => 400)
            );
        }

        $response_body = wp_remote_retrieve_body($response);
        $payload = json_decode($response_body, true);

        if (! is_array($payload)) {
            return new WP_Error(
                'captcha_validation_invalid_response',
                __('Invalid response from reCAPTCHA. Please try again.', 'kreebi-forms'),
                array('status' => 400)
            );
        }

        if (empty($payload['success'])) {
            $error_codes = isset($payload['error-codes']) && is_array($payload['error-codes'])
                ? $payload['error-codes']
                : array();

            return new WP_Error(
                'captcha_invalid_keys',
                $this->get_captcha_validation_error_message($error_codes),
                array(
                    'status' => 400,
                    'errorCodes' => $error_codes,
                )
            );
        }

        if (! isset($payload['action']) || 'krefrm_settings_validation' !== (string) $payload['action']) {
            return new WP_Error(
                'captcha_invalid_action',
                __('Captcha validation failed because the token action was invalid. Please try again.', 'kreebi-forms'),
                array('status' => 400)
            );
        }

        return true;
    }

    private function get_captcha_validation_error_message($error_codes)
    {
        if (in_array('invalid-input-secret', $error_codes, true) || in_array('missing-input-secret', $error_codes, true)) {
            return __('The reCAPTCHA secret key is invalid. Please check the key and try again.', 'kreebi-forms');
        }

        if (in_array('invalid-input-response', $error_codes, true) || in_array('missing-input-response', $error_codes, true)) {
            return __('The reCAPTCHA site key appears invalid or could not generate a valid token. Please check the site key and try again.', 'kreebi-forms');
        }

        if (in_array('bad-request', $error_codes, true)) {
            return __('The captcha validation request was rejected by Google. Please verify both keys.', 'kreebi-forms');
        }

        return __('reCAPTCHA validation failed. Please verify your site key and secret key.', 'kreebi-forms');
    }

    /* ─── Integrations ─── */

    public function get_integrations()
    {
        $integrations = array(
            array(
                'id' => 'email-notification',
                'name' => __('Email Notification', 'kreebi-forms'),
                'description' => __('Send an email notification to one or more recipients every time a form is submitted. Configure the sender, subject line, and message body to match your workflow.', 'kreebi-forms'),
            ),
            array(
                'id' => 'json-view',
                'name' => __('JSON View', 'kreebi-forms'),
                'description' => __('Add a JSON View tab inside the advanced form editor. Inspect or directly edit the raw JSON structure of any form — useful for bulk changes, debugging, or copying form structures.', 'kreebi-forms'),
            ),
            array(
                'id' => 'webhook',
                'name' => __('Webhook & Zapier', 'kreebi-forms'),
                'description' => __('Send form data to external services via webhooks or integrate with Zapier for thousands of app integrations.', 'kreebi-forms'),
            ),
            array(
                'id' => 'captcha',
                'name' => __('Captcha Protection', 'kreebi-forms'),
                'description' => __('Add Google reCAPTCHA v3 to protect every form submission from spam and automated bots.', 'kreebi-forms'),
            ),
            array(
                'id' => 'google-sheet',
                'name' => __('Google Sheets', 'kreebi-forms'),
                'description' => __('Automatically save form submissions directly to a Google Sheet. Perfect for tracking, analysis, and sharing responses with your team.', 'kreebi-forms'),
                'isPremium' => true,
            ),
            array(
                'id' => 'payment',
                'name' => __('Payment Processing', 'kreebi-forms'),
                'description' => __('Accept payments directly through your forms with Stripe or PayPal integration. Secure, reliable, and PCI compliant.', 'kreebi-forms'),
                'isPremium' => true,
            ),
        );

        return rest_ensure_response($integrations);
    }
}
