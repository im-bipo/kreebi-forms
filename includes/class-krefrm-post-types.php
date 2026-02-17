<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Post Type Registration
 */
class Krefrm_Post_Types
{
    public function __construct()
    {
        add_action('init', array($this, 'register'));
    }

    public function register()
    {
        // Forms CPT
        register_post_type('krefrm_form', array(
            'labels'          => array(
                'name'               => __('Forms', 'kreebi-forms'),
                'singular_name'      => __('Form', 'kreebi-forms'),
                'add_new'            => __('Add New', 'kreebi-forms'),
                'add_new_item'       => __('Add New Form', 'kreebi-forms'),
                'edit_item'          => __('Edit Form', 'kreebi-forms'),
                'new_item'           => __('New Form', 'kreebi-forms'),
                'view_item'          => __('View Form', 'kreebi-forms'),
                'search_items'       => __('Search Forms', 'kreebi-forms'),
                'not_found'          => __('No forms found', 'kreebi-forms'),
                'not_found_in_trash' => __('No forms found in Trash', 'kreebi-forms'),
            ),
            'public'          => false,
            'show_ui'         => true,
            'show_in_menu'    => false,
            'supports'        => array('title'),
            'capability_type' => 'post',
        ));

        // Submissions CPT
        register_post_type('krefrm_submission', array(
            'labels'          => array(
                'name'               => __('Submissions', 'kreebi-forms'),
                'singular_name'      => __('Submission', 'kreebi-forms'),
                'edit_item'          => __('View Submission', 'kreebi-forms'),
                'search_items'       => __('Search Submissions', 'kreebi-forms'),
                'not_found'          => __('No submissions found', 'kreebi-forms'),
                'not_found_in_trash' => __('No submissions found in Trash', 'kreebi-forms'),
            ),
            'public'          => false,
            'show_ui'         => true,
            'show_in_menu'    => false,
            'supports'        => array('title'),
            'capability_type' => 'post',
        ));
    }
}
