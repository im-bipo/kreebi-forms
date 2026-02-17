<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Submissions List Page
 */
class Krefrm_Admin_Submissions_Page
{
    public function render()
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        $submissions = get_posts(array(
            'post_type'      => 'krefrm_submission',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ));

?>
        <div class="wrap">
            <h1><?php esc_html_e('Submissions', 'kreebi-forms'); ?></h1>
            <hr class="wp-header-end">

            <?php if (empty($submissions)) : ?>
                <p><?php esc_html_e('No submissions yet.', 'kreebi-forms'); ?></p>
            <?php else : ?>
                <?php foreach ($submissions as $sub) : ?>
                    <div class="krefrm-submission-item">
                        <h2><?php echo esc_html($sub->post_title); ?></h2>

                        <?php
                        $form_id   = get_post_meta($sub->ID, '_krefrm_form_id', true);
                        $form_post = $form_id ? get_post($form_id) : null;
                        $form_name = $form_post ? $form_post->post_title : __('—', 'kreebi-forms');
                        ?>
                        <p><strong><?php esc_html_e('Form:', 'kreebi-forms'); ?></strong> <?php echo esc_html($form_name); ?></p>
                        <p><strong><?php esc_html_e('Submitted:', 'kreebi-forms'); ?></strong> <?php echo esc_html(get_the_date('F j, Y g:i a', $sub)); ?></p>

                        <h3><?php esc_html_e('Submitted Data:', 'kreebi-forms'); ?></h3>
                        <?php
                        $data = get_post_meta($sub->ID, '_krefrm_data', true);
                        if (is_array($data) && ! empty($data)) :
                        ?>
                            <table class="krefrm-submission-table">
                                <tr>
                                    <th><?php esc_html_e('Field', 'kreebi-forms'); ?></th>
                                    <th><?php esc_html_e('Value', 'kreebi-forms'); ?></th>
                                </tr>
                                <?php foreach ($data as $key => $value) : ?>
                                    <tr>
                                        <td><?php echo esc_html(ucwords(str_replace('_', ' ', $key))); ?></td>
                                        <td><?php echo esc_html($value); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </table>
                        <?php else : ?>
                            <p><?php esc_html_e('No data submitted.', 'kreebi-forms'); ?></p>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
<?php
    }
}
