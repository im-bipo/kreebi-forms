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
        $logo_url = KREFRM_PLUGIN_URL . 'assets/photos/kreebi-forms-light.png';
?>
        <div id="krefrm-global-welcome-modal" class="krefrm-global-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="krefrm-global-welcome-title">
            <div class="krefrm-global-welcome-modal__card">
                <a href="#" class="krefrm-global-welcome-modal__skip-link" data-krefrm-welcome-action="dismiss"><?php esc_html_e('Skip for now', 'kreebi-forms'); ?></a>
                <div class="krefrm-global-welcome-modal__left">
                    <h2 id="krefrm-global-welcome-title"><?php esc_html_e('Welcome to Kreebi Forms', 'kreebi-forms'); ?></h2>
                    <p class="krefrm-global-welcome-modal__text"><?php esc_html_e('Thanks for installing Kreebi Forms. Set things up in one click and start using it right away.', 'kreebi-forms'); ?></p>
                    <div class="krefrm-global-welcome-modal__actions">
                        <button type="button" class="button button-primary" data-krefrm-welcome-action="continue"><?php esc_html_e('Start Kreebi Forms', 'kreebi-forms'); ?></button>
                    </div>
                </div>
                <div class="krefrm-global-welcome-modal__right" aria-hidden="true">
                    <img src="<?php echo esc_url($logo_url); ?>" alt="" class="krefrm-global-welcome-modal__logo" />
                    <p class="krefrm-global-welcome-modal__brand"><?php esc_html_e('Kreebi Forms', 'kreebi-forms'); ?></p>
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
                width: min(900px, calc(100vw - 32px));
                border-radius: 14px;
                box-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
                overflow: hidden;
                display: grid;
                grid-template-columns: minmax(320px, 1fr) minmax(220px, 0.72fr);
            }

            .krefrm-global-welcome-modal__skip-link {
                position: fixed;
                bottom: 16px;
                right: 16px;
                color: #fff;
                font-size: 13px;
                text-decoration: underline;
                font-weight: 600;
                z-index: 1000001;
                padding: 8px 10px;
                border-radius: 999px;
            }


            .krefrm-global-welcome-modal__left {
                padding: 28px 30px 24px;
            }

            .krefrm-global-welcome-modal h2 {
                margin: 0 0 12px;
                font-size: 48px;
                line-height: 1.02;
                letter-spacing: -1px;
                color: #141b2f;
            }

            .krefrm-global-welcome-modal__text {
                margin: 0 0 18px;
                color: #4f5d75;
                font-size: 15px;
                line-height: 1.45;
            }

            .krefrm-global-welcome-modal__actions {
                display: flex;
                gap: 10px;
                justify-content: flex-start;
                align-items: center;
            }

            .krefrm-global-welcome-modal__actions .button {
                min-height: 32px;
                border-radius: 3px;
                font-size: 12px;
                padding: 4px 12px;
                margin: 0;
            }

            .krefrm-global-welcome-modal__actions .button.button-primary {
                background: #2271b1;
                border-color: #2271b1;
                text-shadow: none;
                box-shadow: none;
            }

            .krefrm-global-welcome-modal__actions .button.button-primary:hover {
                background: #1a5d96;
                border-color: #1a5d96;
            }

            .krefrm-global-welcome-modal__right {
                background: #1875E5;
                border-left: 1px solid rgba(34, 113, 177, 0.18);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 14px;
                padding: 20px;
            }

            .krefrm-global-welcome-modal__logo {
                width: 170px;
                max-width: 100%;
                height: auto;
            }

            .krefrm-global-welcome-modal__brand {
                margin: 0;
                color: #fff;
                font-size: 42px;
                font-weight: 700;
                line-height: 1;
                letter-spacing: -0.8px;
            }

            @media (max-width: 782px) {
                .krefrm-global-welcome-modal__card {
                    grid-template-columns: 1fr;
                    width: calc(100vw - 24px);
                }

                .krefrm-global-welcome-modal__left {
                    padding: 20px 18px 16px;
                }

                .krefrm-global-welcome-modal h2 {
                    font-size: 36px;
                }

                .krefrm-global-welcome-modal__actions {
                    flex-wrap: wrap;
                }

                .krefrm-global-welcome-modal__actions .button {
                    width: 100%;
                }

                .krefrm-global-welcome-modal__right {
                    border-left: 0;
                    border-top: 1px solid rgba(15, 23, 42, 0.08);
                    padding: 18px;
                }

                .krefrm-global-welcome-modal__brand {
                    font-size: 32px;
                }
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

                    if (continueBtn) {
                        window.location.href = <?php echo wp_json_encode($forms_url); ?>;
                        return;
                    }

                    if (dismissBtn) {
                        event.preventDefault();
                        dismiss();
                        return;
                    }

                    if (event.target === modal) {
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
