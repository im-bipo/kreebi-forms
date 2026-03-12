<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Plugin Activation Handler
 *
 * Creates default contact form on plugin activation
 */
class Krefrm_Activation
{
    /**
     * Activation hook callback
     */
    public static function activate()
    {
        // Check if contact form already exists to prevent duplicates
        if (self::contact_form_exists()) {
            return;
        }

        // Create the default contact form
        self::create_contact_form();
    }

    /**
     * Check if contact form already exists
     */
    private static function contact_form_exists()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            's'              => 'Contact Form',
        ));

        foreach ($posts as $post) {
            if ($post->post_title === 'Contact Form') {
                return true;
            }
        }

        return false;
    }

    /**
     * Create the default contact form
     */
    private static function create_contact_form()
    {
        // Form data structure
        $form_data = array(
            'name'          => 'Contact Form',
            'description'   => '',
            'styleTemplate' => 'kreebi_style_1',
            'fields'        => array(
                array(
                    'name'        => 'Name',
                    'type'        => 'text',
                    'placeholder' => 'Your name',
                    'required'    => true,
                    'options'     => array(),
                ),
                array(
                    'name'        => 'Email',
                    'type'        => 'email',
                    'placeholder' => 'you@example.com',
                    'required'    => true,
                    'options'     => array(),
                ),
                array(
                    'name'        => 'Message',
                    'type'        => 'text',
                    'placeholder' => 'Write your message…',
                    'required'    => false,
                    'options'     => array(),
                ),
            ),
        );

        // Get next form ID
        $form_id = self::get_next_form_id();
        $form_data['id'] = $form_id;

        // Insert the post
        $post_id = wp_insert_post(array(
            'post_type'    => 'krefrm_form',
            'post_status'  => 'publish',
            'post_title'   => $form_data['name'],
            'post_content' => $form_data['description'],
            'post_name'    => $form_id,
        ), true);

        // If post creation succeeded, save the form data as meta
        if (! is_wp_error($post_id)) {
            update_post_meta($post_id, '_krefrm_form_data', $form_data);
        }
    }

    /**
     * Get the next sequential form ID (001, 002, 003, etc.)
     */
    private static function get_next_form_id()
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
