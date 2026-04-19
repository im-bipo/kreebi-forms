<?php

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Admin Welcome Popup Handler
 */
class Krefrm_Admin_Welcome
{
    const REDIRECT_TRANSIENT_KEY = 'krefrm_activation_redirect';
    const REDIRECT_OPTION_KEY = 'krefrm_activation_redirect_flag';

    public function __construct()
    {
        add_action('admin_footer', array($this, 'maybe_render_welcome_popup'));
    }

    public function maybe_redirect_to_welcome()
    {
        // Legacy no-op retained for backward compatibility.
    }

    public function maybe_render_welcome_popup()
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        if (wp_doing_ajax()) {
            return;
        }

        if (is_network_admin()) {
            return;
        }

        if (! $this->has_pending_activation_redirect()) {
            return;
        }

        $this->clear_pending_activation_redirect();
        $forms_url = admin_url('admin.php?page=krefrm_forms');
        ?>
        <div id="krefrm-global-welcome-modal" class="krefrm-global-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="krefrm-global-welcome-title">
            <div class="krefrm-global-welcome-modal__card">
                <button type="button" class="krefrm-global-welcome-modal__close" aria-label="<?php esc_attr_e('Close', 'kreebi-forms'); ?>">&times;</button>
                <h2 id="krefrm-global-welcome-title"><?php esc_html_e('Welcome to Kreebi Forms', 'kreebi-forms'); ?></h2>
                <p class="krefrm-global-welcome-modal__text"><?php esc_html_e('Would you like to continue to Kreebi Forms?', 'kreebi-forms'); ?></p>
                <div class="krefrm-global-welcome-modal__actions">
                    <button type="button" class="button" data-krefrm-welcome-action="dismiss"><?php esc_html_e('Not now', 'kreebi-forms'); ?></button>
                    <button type="button" class="button button-primary" data-krefrm-welcome-action="continue"><?php esc_html_e('Continue', 'kreebi-forms'); ?></button>
                </div>
            </div>
        </div>
        <style>
            .krefrm-global-welcome-modal {
                position: fixed;
                inset: 0;
                z-index: 1000000;
                background: rgba(0, 0, 0, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
            }

            .krefrm-global-welcome-modal__card {
                background: #fff;
                width: min(560px, calc(100vw - 32px));
                border-radius: 10px;
                box-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
                padding: 24px;
                position: relative;
            }

            .krefrm-global-welcome-modal__close {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 32px;
                height: 32px;
                border: 0;
                border-radius: 4px;
                background: transparent;
                font-size: 24px;
                line-height: 1;
                color: #666;
                cursor: pointer;
            }

            .krefrm-global-welcome-modal__close:hover {
                background: #f3f4f6;
            }

            .krefrm-global-welcome-modal h2 {
                margin: 0 0 10px;
                font-size: 30px;
                line-height: 1.2;
            }

            .krefrm-global-welcome-modal__text {
                margin: 0 0 20px;
                color: #4b5563;
                font-size: 15px;
            }

            .krefrm-global-welcome-modal__actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
        </style>
        <script>
            (function() {
                var modal = document.getElementById('krefrm-global-welcome-modal');
                if (!modal) {
                    return;
                }

                function dismiss() {
                    modal.remove();
                }

                modal.addEventListener('click', function(event) {
                    var continueBtn = event.target.closest('[data-krefrm-welcome-action="continue"]');
                    var dismissBtn = event.target.closest('[data-krefrm-welcome-action="dismiss"]');
                    var closeBtn = event.target.closest('.krefrm-global-welcome-modal__close');

                    if (continueBtn) {
                        window.location.href = <?php echo wp_json_encode($forms_url); ?>;
                        return;
                    }

                    if (dismissBtn || closeBtn || event.target === modal) {
                        dismiss();
                    }
                });

                document.addEventListener('keydown', function(event) {
                    if (event.key === 'Escape') {
                        dismiss();
                    }
                });
            })();
        </script>
        <?php
    }

    private function has_pending_activation_redirect()
    {
        if (get_transient(self::REDIRECT_TRANSIENT_KEY)) {
            return true;
        }

        return '1' === get_option(self::REDIRECT_OPTION_KEY, '');
    }

    private function clear_pending_activation_redirect()
    {
        delete_transient(self::REDIRECT_TRANSIENT_KEY);
        delete_option(self::REDIRECT_OPTION_KEY);
    }
}
