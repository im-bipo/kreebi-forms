<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Submission endpoints.
 */
trait Krefrm_Rest_Api_Submissions
{
    public function get_submissions()
    {
        $posts = get_posts(array(
            'post_type'      => 'krefrm_submission',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ));

        $submissions = array();
        foreach ($posts as $post) {
            $submissions[] = $this->prepare_submission($post);
        }

        return rest_ensure_response($submissions);
    }

    public function delete_submission($request)
    {
        $post = get_post(absint($request['id']));
        if (! $post || 'krefrm_submission' !== $post->post_type) {
            return new WP_Error('not_found', __('Submission not found.', 'kreebi-forms'), array('status' => 404));
        }

        wp_delete_post($post->ID, true);

        return rest_ensure_response(array('deleted' => true));
    }
}
