<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Forms List Page
 */
class Krefrm_Admin_Forms_Page
{
    public function render()
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        $notice_nonce = isset($_GET['krefrm_notice_nonce']) ? sanitize_text_field(wp_unslash($_GET['krefrm_notice_nonce'])) : '';
        $has_valid_notice = $notice_nonce && wp_verify_nonce($notice_nonce, 'krefrm_admin_notice');

        $created = '';
        if ($has_valid_notice && isset($_GET['krefrm_created'])) {
            $created = sanitize_text_field(wp_unslash($_GET['krefrm_created']));
        }

        $error = '';
        if ($has_valid_notice && isset($_GET['krefrm_error'])) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- Sanitized immediately after unslash.
            $raw_error = wp_unslash($_GET['krefrm_error']);
            $raw_error = is_string($raw_error) ? sanitize_text_field($raw_error) : '';
            $error = rawurldecode($raw_error);
        }

        $forms = get_posts(array(
            'post_type'      => 'krefrm_form',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ));

?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e('Forms', 'kreebi-forms'); ?></h1>
            <button type="button" class="page-title-action" id="krefrm-open-modal">
                <?php esc_html_e('Create New Form', 'kreebi-forms'); ?>
            </button>
            <hr class="wp-header-end">

            <?php if ($created === '1') : ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php esc_html_e('Form created successfully.', 'kreebi-forms'); ?></p>
                </div>
            <?php endif; ?>

            <?php if ($error !== '') : ?>
                <div class="notice notice-error is-dismissible">
                    <p><?php echo esc_html($error); ?></p>
                </div>
            <?php endif; ?>

            <?php if (empty($forms)) : ?>
                <p><?php esc_html_e('No forms yet. Click "Create New Form" to get started.', 'kreebi-forms'); ?></p>
            <?php else : ?>
                <table class="widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width:40px;"><?php esc_html_e('#', 'kreebi-forms'); ?></th>
                            <th><?php esc_html_e('Name', 'kreebi-forms'); ?></th>
                            <th><?php esc_html_e('Shortcode', 'kreebi-forms'); ?></th>
                            <th><?php esc_html_e('Fields', 'kreebi-forms'); ?></th>
                            <th><?php esc_html_e('Date', 'kreebi-forms'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $i = 0;
                        foreach ($forms as $form) :
                            $i++;
                            $meta    = get_post_meta($form->ID, '_krefrm_form_data', true);
                            $fields  = isset($meta['fields']) ? $meta['fields'] : array();
                            $form_id = $form->post_name;
                        ?>
                            <tr>
                                <td><?php echo esc_html($i); ?></td>
                                <td>
                                    <strong>
                                        <a href="<?php echo esc_url(get_edit_post_link($form->ID)); ?>">
                                            <?php echo esc_html($form->post_title); ?>
                                        </a>
                                    </strong>
                                </td>
                                <?php $shortcode = sprintf('[kreebi_form id="%s"]', esc_attr($form_id)); ?>
                                <td><code><?php echo esc_html($shortcode); ?></code></td>
                                <td><?php echo esc_html(count($fields)); ?></td>
                                <td><?php echo esc_html(get_the_date('', $form)); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <?php $this->render_create_modal(); ?>
    <?php
    }

    private function render_create_modal()
    {
    ?>
        <div id="krefrm-modal-overlay" class="krefrm-modal-overlay">
            <div class="krefrm-modal">
                <div class="krefrm-modal-header">
                    <h2><?php esc_html_e('Create New Form', 'kreebi-forms'); ?></h2>
                    <button type="button" class="krefrm-modal-close" id="krefrm-close-modal">&times;</button>
                </div>
                <div class="krefrm-modal-body">
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                        <input type="hidden" name="action" value="krefrm_create_form" />
                        <?php wp_nonce_field('krefrm_create_form'); ?>

                        <p>
                            <label for="krefrm_form_json">
                                <strong><?php esc_html_e('Paste your form JSON below:', 'kreebi-forms'); ?></strong>
                            </label>
                        </p>
                        <textarea
                            id="krefrm_form_json"
                            name="krefrm_form_json"
                            rows="16"
                            class="large-text code"
                            placeholder='<?php echo esc_attr("{\n  \"name\": \"\",\n  \"description\": \"\",\n  \"fields\": []\n}"); ?>'></textarea>

                        <details class="krefrm-json-example-details">
                            <summary class="krefrm-json-example-summary">
                                <?php esc_html_e('View sample JSON', 'kreebi-forms'); ?>
                            </summary>
                            <pre class="krefrm-json-example-pre">{
  "name": "Contact Form",
  "description": "A simple contact form",
  "fields": [
    {
      "name": "Full Name",
      "type": "text",
      "placeholder": "Enter your name"
    },
    {
      "name": "Email Address",
      "type": "email",
      "placeholder": "you@example.com"
    },
    {
      "name": "Password",
      "type": "password",
      "placeholder": "Enter a password"
    },
    {
      "name": "Age",
      "type": "number",
      "placeholder": "25"
    }
  ]
}</pre>
                        </details>

                        <?php submit_button(__('Create Form', 'kreebi-forms')); ?>
                    </form>
                </div>
            </div>
        </div>
<?php
    }
}
