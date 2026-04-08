<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Prevents caching for dynamic Kreebi Forms admin and REST requests.
 */
class Krefrm_Cache_Control
{
    const REST_NAMESPACE_PREFIX = '/kreebi-forms/v1';

    public function __construct()
    {
        $this->maybe_disable_cache_for_current_request();

        add_action('admin_init', array($this, 'maybe_disable_cache_for_admin_page'), 0);
        add_action('send_headers', array($this, 'maybe_send_no_cache_headers_for_admin_page'), 0);

        add_filter('rest_send_nocache_headers', array($this, 'maybe_force_rest_nocache_headers'));
        add_filter('rest_pre_dispatch', array($this, 'maybe_disable_cache_for_rest_request'), 10, 3);
        add_filter('rest_post_dispatch', array($this, 'maybe_add_no_cache_headers_to_rest_response'), 10, 3);
    }

    private function maybe_disable_cache_for_current_request()
    {
        if ($this->is_kreebi_admin_page()) {
            $this->mark_request_uncacheable('Kreebi Forms admin page');
            return;
        }

        if ($this->is_kreebi_rest_uri_request()) {
            $this->mark_request_uncacheable('Kreebi Forms REST request');
        }
    }

    /**
     * Mark Kreebi admin screens as non-cacheable as early as possible.
     */
    public function maybe_disable_cache_for_admin_page()
    {
        if (! $this->is_kreebi_admin_page()) {
            return;
        }

        $this->mark_request_uncacheable('Kreebi Forms admin page');
        nocache_headers();
    }

    /**
     * Add explicit anti-cache headers for Kreebi admin pages.
     */
    public function maybe_send_no_cache_headers_for_admin_page()
    {
        if (! $this->is_kreebi_admin_page()) {
            return;
        }

        $this->send_no_cache_headers();
    }

    /**
     * Mark Kreebi REST requests as non-cacheable before callbacks run.
     */
    public function maybe_disable_cache_for_rest_request($result, $server, $request)
    {
        if (! $this->is_kreebi_rest_request($request)) {
            return $result;
        }

        $this->mark_request_uncacheable('Kreebi Forms REST request');
        $this->send_no_cache_headers();

        return $result;
    }

    /**
     * Ensure WordPress sends nocache headers for plugin REST namespace.
     */
    public function maybe_force_rest_nocache_headers($send_no_cache_headers)
    {
        if ($this->is_kreebi_rest_uri_request()) {
            return true;
        }

        return $send_no_cache_headers;
    }

    /**
     * Ensure all Kreebi REST responses carry strict no-cache headers.
     */
    public function maybe_add_no_cache_headers_to_rest_response($response, $server, $request)
    {
        if (! $this->is_kreebi_rest_request($request)) {
            return $response;
        }

        $response = rest_ensure_response($response);

        if (! $response instanceof WP_HTTP_Response) {
            return $response;
        }

        foreach ($this->get_no_cache_headers() as $name => $value) {
            $response->header($name, $value);
        }

        return $response;
    }

    private function is_kreebi_rest_request($request)
    {
        if (! $request instanceof WP_REST_Request) {
            return false;
        }

        $route = (string) $request->get_route();

        return 0 === strpos($route, self::REST_NAMESPACE_PREFIX)
            || self::REST_NAMESPACE_PREFIX === $route;
    }

    private function is_kreebi_rest_uri_request()
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only route check for cache control.
        if (isset($_GET['rest_route'])) {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only route check for cache control.
            $rest_route = sanitize_text_field(wp_unslash($_GET['rest_route']));
            if ('' !== $rest_route && 0 === strpos($rest_route, self::REST_NAMESPACE_PREFIX)) {
                return true;
            }
        }

        if (empty($_SERVER['REQUEST_URI'])) {
            return false;
        }

        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Used for request path matching only.
        $request_uri = wp_unslash($_SERVER['REQUEST_URI']);

        return false !== strpos($request_uri, '/wp-json' . self::REST_NAMESPACE_PREFIX)
            || false !== strpos($request_uri, 'rest_route=' . rawurlencode(self::REST_NAMESPACE_PREFIX))
            || false !== strpos($request_uri, 'rest_route=' . self::REST_NAMESPACE_PREFIX);
    }

    private function is_kreebi_admin_page()
    {
        if (! is_admin()) {
            return false;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page check for cache control.
        if (! isset($_GET['page'])) {
            return false;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page check for cache control.
        $page = sanitize_key(wp_unslash($_GET['page']));

        return '' !== $page && 0 === strpos($page, 'krefrm_');
    }

    private function mark_request_uncacheable($reason)
    {
        $this->define_true_constant('DONOTCACHEPAGE');
        $this->define_true_constant('DONOTCACHEOBJECT');
        $this->define_true_constant('DONOTCACHEDB');
        $this->define_true_constant('DONOTMINIFY');
        $this->define_true_constant('DONOTCDN');

        // LiteSpeed Cache API: explicitly disable caching for this request when available.
        do_action('litespeed_control_set_nocache', $reason);
    }

    private function send_no_cache_headers()
    {
        if (headers_sent()) {
            return;
        }

        header_remove('ETag');
        header_remove('Last-Modified');

        foreach ($this->get_no_cache_headers() as $name => $value) {
            header($name . ': ' . $value, true);
        }
    }

    private function get_no_cache_headers()
    {
        return array(
            'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Wed, 11 Jan 1984 05:00:00 GMT',
            'Surrogate-Control' => 'no-store',
            'Vary' => 'Origin, X-WP-Nonce, Cookie, Authorization',
            'X-LiteSpeed-Cache-Control' => 'no-cache',
            'X-Kreebi-Cache' => 'bypass',
        );
    }

    private function define_true_constant($name)
    {
        if (! defined($name)) {
            define($name, true);
        }
    }
}
