<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Custom CSS endpoints and sanitization.
 */
trait Krefrm_Rest_Api_Custom_Css
{
    public function get_custom_css()
    {
        $settings = get_option('krefrm_settings', array());
        $css_content = '';

        if (is_array($settings) && isset($settings['customCss'])) {
            $css_content = $settings['customCss'];
        }

        return rest_ensure_response(array(
            'css' => $css_content,
        ));
    }

    public function save_custom_css($request)
    {
        $body = $request->get_json_params();
        $css = isset($body['css']) ? $body['css'] : '';

        // Sanitize CSS by removing any script tags or other potentially dangerous content
        $css = $this->sanitize_custom_css($css);

        // Validate CSS syntax
        $validation = $this->validate_css_syntax($css);
        if (! $validation['valid']) {
            return new WP_Error(
                'invalid_css',
                __('Invalid CSS syntax: ', 'kreebi-forms') . $validation['error'],
                array('status' => 400)
            );
        }

        $settings = get_option('krefrm_settings', array());
        if (! is_array($settings)) {
            $settings = array();
        }

        $settings['customCss'] = $css;
        update_option('krefrm_settings', $settings);

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Custom CSS saved successfully.', 'kreebi-forms'),
            'css' => $css,
        ));
    }

    /**
     * Sanitize custom CSS input
     * - Remove script tags and other potentially dangerous content
     * - Strip HTML tags
     * - Remove JavaScript event handlers
     */
    private function sanitize_custom_css($css)
    {
        // Remove any script tags
        $css = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $css);

        // Remove any HTML tags
        $css = wp_strip_all_tags($css);

        // Remove JavaScript event handlers (onclick, onerror, etc.)
        $css = preg_replace('/javascript:/is', '', $css);
        $css = preg_replace('/on\w+\s*=/is', '', $css);

        // Remove import statements (could load external CSS)
        $css = preg_replace('/@import[^;]*;/is', '', $css);

        // Trim whitespace
        $css = trim($css);

        return $css;
    }

    /**
     * Validate CSS syntax
     * Basic validation to check for balanced braces and proper structure
     */
    private function validate_css_syntax($css)
    {
        $css = trim($css);

        // Empty CSS is valid
        if (empty($css)) {
            return array('valid' => true);
        }

        // Count opening and closing braces
        $open_braces = substr_count($css, '{');
        $close_braces = substr_count($css, '}');

        if ($open_braces !== $close_braces) {
            return array(
                'valid' => false,
                'error' => sprintf(
                    /* translators: 1: Number of opening braces, 2: Number of closing braces. */
                    __('Mismatched braces: %1$d opening, %2$d closing', 'kreebi-forms'),
                    $open_braces,
                    $close_braces
                ),
            );
        }

        // Check for unmatched parentheses (common in CSS functions like rgb(), calc(), etc.)
        $open_parens = substr_count($css, '(');
        $close_parens = substr_count($css, ')');

        if ($open_parens !== $close_parens) {
            return array(
                'valid' => false,
                'error' => sprintf(
                    /* translators: 1: Number of opening parentheses, 2: Number of closing parentheses. */
                    __('Mismatched parentheses: %1$d opening, %2$d closing', 'kreebi-forms'),
                    $open_parens,
                    $close_parens
                ),
            );
        }

        // Basic regex to check for proper CSS structure (selector { property: value; })
        // This is a simplified check and won't catch all CSS syntax errors
        if (! preg_match('/^[^{}]*\{[^{}]*\}/', $css)) {
            // Only validate if CSS appears to have selectors and rules
            if (strpos($css, '{') !== false || strpos($css, '}') !== false) {
                return array(
                    'valid' => false,
                    'error' => __('CSS appears to have invalid structure', 'kreebi-forms'),
                );
            }
        }

        return array('valid' => true);
    }
}
