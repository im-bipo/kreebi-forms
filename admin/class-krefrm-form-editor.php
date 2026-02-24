<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Form Editor Metabox
 */
class Krefrm_Form_Editor
{
    public function __construct()
    {
        add_action('add_meta_boxes_krefrm_form', array($this, 'add_metabox'));
        add_action('save_post_krefrm_form', array($this, 'save_metabox'), 10, 1);
    }

    public function add_metabox()
    {
        add_meta_box(
            'krefrm_form_editor',
            __('Form Editor', 'kreebi-forms'),
            array($this, 'render_metabox'),
            'krefrm_form',
            'normal',
            'high'
        );
    }

    public function render_metabox($post)
    {
        $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
        $json_str  = wp_json_encode($form_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        wp_nonce_field('krefrm_form_editor_nonce', 'krefrm_form_editor_nonce');
?>
        <div>
            <p>
                <label for="krefrm_form_json_editor">
                    <strong><?php esc_html_e('Form JSON:', 'kreebi-forms'); ?></strong>
                </label>
            </p>
            <textarea
                id="krefrm_form_json_editor"
                name="krefrm_form_json_editor"
                rows="20"
                class="large-text code"
                style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px;"><?php echo esc_textarea($json_str); ?></textarea>
            <p style="color: #666; font-size: 13px; margin-top: 8px;">
                <?php esc_html_e('Edit the form structure JSON above. Include name, description (optional), and fields array.', 'kreebi-forms'); ?>
            </p>
        </div>
<?php
    }

    public function save_metabox($post_id)
    {
        // Verify nonce
        if (! isset($_POST['krefrm_form_editor_nonce'])) {
            return;
        }
        if (! wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['krefrm_form_editor_nonce'])), 'krefrm_form_editor_nonce')) {
            return;
        }

        // Check permission
        if (! current_user_can('edit_post', $post_id)) {
            return;
        }

        // Prevent autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        // Get and sanitize the JSON input
        if (! isset($_POST['krefrm_form_json_editor'])) {
            return;
        }

        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized via wp_check_invalid_utf8 and json_decode validation below.
        $json_input = wp_unslash($_POST['krefrm_form_json_editor']);
        if (! is_string($json_input)) {
            return;
        }

        // Check for valid UTF-8
        $json_input = wp_check_invalid_utf8($json_input);
        if (empty($json_input)) {
            return;
        }

        // Decode and validate JSON
        $decoded = json_decode($json_input, true);
        if (! is_array($decoded)) {
            wp_die(esc_html__('Invalid JSON. Please check the syntax.', 'kreebi-forms'));
        }

        // Sanitize the form data
        $sanitizer = new Krefrm_Form_Sanitizer();
        $form_data = $sanitizer->sanitize($decoded);

        // Update post meta
        update_post_meta($post_id, '_krefrm_form_data', $form_data);
    }
}
