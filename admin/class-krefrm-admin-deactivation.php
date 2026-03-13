<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Deactivation Handler — Displays deactivation survey modal
 */
class Krefrm_Admin_Deactivation
{
    public function __construct()
    {
        add_action('admin_enqueue_scripts', array($this, 'enqueue_deactivation_assets'));
        add_action('admin_footer-plugins.php', array($this, 'show_deactivation_modal'));
        add_action('wp_ajax_krefrm_submit_deactivation_survey', array($this, 'handle_survey_ajax'));
    }

    /**
     * Check if plugin is being deactivated
     */
    private function is_deactivating_kreebi()
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if (! isset($_GET['action']) || $_GET['action'] !== 'deactivate') {
            return false;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if (! isset($_GET['plugin']) || strpos($_GET['plugin'], 'kreebi-forms') === false) {
            return false;
        }

        return current_user_can('manage_plugins');
    }

    /**
     * Show deactivation modal if needed
     */
    public function show_deactivation_modal_if_needed()
    {
        if (! $this->is_deactivating_kreebi()) {
            return;
        }

        $this->show_deactivation_modal();
    }

    /**
     * Show deactivation modal
     */
    public function show_deactivation_modal()
    {
?>
        <div id="krefrm-deactivation-modal" class="krefrm-modal">
            <div class="krefrm-modal-content">
                <div class="krefrm-modal-header">
                    <div>
                        <h2><?php esc_html_e('Hold On!', 'kreebi-forms'); ?></h2>
                        <p class="krefrm-modal-subtitle"><?php esc_html_e('We\'d love to hear your feedback', 'kreebi-forms'); ?></p>
                    </div>
                    <button type="button" class="krefrm-modal-close" data-action="continue">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <form id="krefrm-deactivation-form">
                    <div class="krefrm-modal-body">
                        <p><?php esc_html_e('We would love to know why you are deactivating Kreebi Forms. Your feedback helps us improve the plugin!', 'kreebi-forms'); ?></p>

                        <div class="krefrm-form-group">
                            <label for="krefrm-reason"><?php esc_html_e('Why are you deactivating?', 'kreebi-forms'); ?> <span class="required">*</span></label>
                            <select id="krefrm-reason" name="reason" required>
                                <option value=""><?php esc_html_e('-- Select a reason --', 'kreebi-forms'); ?></option>
                                <option value="found-alternative"><?php esc_html_e('I found a better plugin alternative', 'kreebi-forms'); ?></option>
                                <option value="not-needed"><?php esc_html_e('I no longer need this plugin', 'kreebi-forms'); ?></option>
                                <option value="features-lacking"><?php esc_html_e('Missing required features', 'kreebi-forms'); ?></option>
                                <option value="performance-issues"><?php esc_html_e('Performance issues', 'kreebi-forms'); ?></option>
                                <option value="technical-issues"><?php esc_html_e('Technical issues / bugs', 'kreebi-forms'); ?></option>
                                <option value="conflict"><?php esc_html_e('Conflicts with other plugins', 'kreebi-forms'); ?></option>
                                <option value="other"><?php esc_html_e('Other reason', 'kreebi-forms'); ?></option>
                            </select>
                        </div>

                        <div class="krefrm-form-group">
                            <label for="krefrm-feedback"><?php esc_html_e('Please share additional feedback (optional)', 'kreebi-forms'); ?></label>
                            <textarea id="krefrm-feedback" name="feedback" rows="4" placeholder="<?php esc_attr_e('Your feedback helps us improve...', 'kreebi-forms'); ?>"></textarea>
                        </div>

                        <div class="krefrm-form-group">
                            <label for="krefrm-email"><?php esc_html_e('Your email (so we can follow up)', 'kreebi-forms'); ?></label>
                            <input type="email" id="krefrm-email" name="email" placeholder="<?php esc_attr_e('your@email.com', 'kreebi-forms'); ?>" value="<?php echo esc_attr(get_option('admin_email')); ?>">
                            <p class="krefrm-input-help"><?php esc_html_e('We will only follow up if you provide an email and we need clarification or troubleshooting information.', 'kreebi-forms'); ?></p>
                        </div>

                        <div class="krefrm-form-group krefrm-checkbox-group">
                            <label class="krefrm-checkbox-label">
                                <input type="checkbox" id="krefrm-delete-data" name="delete_data" value="true">
                                <span><?php esc_html_e('Delete all my data form this site.', 'kreebi-forms'); ?></span>
                            </label>
                            <p><?php esc_html_e('This will delete all of you forms, submissions, integrations, etc.', 'kreebi-forms'); ?></p>
                            <p class="krefrm-checkbox-help"><?php esc_html_e('Warning: This action cannot be undone!', 'kreebi-forms'); ?></p>
                        </div>
                    </div>

                    <div class="krefrm-modal-footer">
                        <button type="button" class="button" data-action="continue">
                            <?php esc_html_e('Cancel', 'kreebi-forms'); ?>
                        </button>
                        <button type="submit" class="button button-primary">
                            <?php esc_html_e('Submit and Deactivate', 'kreebi-forms'); ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>
<?php
    }

    /**
     * Enqueue deactivation assets
     */
    public function enqueue_deactivation_assets($hook)
    {
        // Always load on plugins.php page
        if ($hook !== 'plugins.php') {
            return;
        }

        wp_enqueue_style(
            'krefrm-admin-deactivation',
            KREFRM_PLUGIN_URL . 'assets/css/admin-deactivation.css',
            array(),
            '1.1.0'
        );

        wp_enqueue_script(
            'krefrm-admin-deactivation',
            KREFRM_PLUGIN_URL . 'assets/js/admin-deactivation.js',
            array('jquery'),
            '1.1.0',
            true
        );

        wp_localize_script(
            'krefrm-admin-deactivation',
            'krefrmDeactivation',
            array(
                'nonce'           => wp_create_nonce('krefrm_deactivation_nonce'),
                'ajaxUrl'         => admin_url('admin-ajax.php'),
                'pluginsPageUrl'  => admin_url('plugins.php'),
            )
        );

        // Add inline script to intercept deactivation link even before jQuery loads
        wp_add_inline_script(
            'krefrm-admin-deactivation',
            "
            (function(){
                'use strict';
                // Add event listener directly to intercept clicks before anything else
                document.addEventListener('click', function(e) {
                    var href = e.target.href || (e.target.closest('a') && e.target.closest('a').href);
                    if (href && href.indexOf('action=deactivate') !== -1 && href.indexOf('kreebi-forms') !== -1) {
                        if (!e.target.closest('a').getAttribute('data-krefrm-approved')) {
                            e.preventDefault();
                            e.stopPropagation();
                            var modal = document.getElementById('krefrm-deactivation-modal');
                            if (modal) {
                                modal.classList.add('show');
                            }
                        }
                    }
                }, true);
            })();
            ",
            'before'
        );
    }

    /**
     * Handle survey submission via AJAX
     */
    public function handle_survey_ajax()
    {
        Krefrm_Deactivation::handle_survey_submission();
    }
}
