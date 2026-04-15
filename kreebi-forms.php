<?php

/**
 * Plugin Name: Kreebi Forms - Drag & Drop Form Builder. Contact Forms, Survey Form, Registration Form and More
 * Description: Lightweight and Powerful WordPress form builder plugin with drag-and-drop form creation, conditional logic, multi-page forms, spam protection, email notifications, webhooks, and submission management.
 * Version:     1.1.8
 * Author:      Bipin Khatri
 * Author URI:  https://bipo.tech
 * Text Domain: kreebi-forms
 * License:     GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (! defined('ABSPATH')) {
    exit;
}
if (defined('KREFRMPRO_VERSION') || class_exists('KreebiFormsPro\\Plugin')) {
    return;
}

define('KREFRM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('KREFRM_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load dependencies
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-post-types.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-shortcode.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-submission-handler.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-form-sanitizer.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-webhook-service.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-plugin-config.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-cache-control.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-rest-api.php';

// Load admin classes
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-menu.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-assets.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-forms-page.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-submissions-page.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-form-handler.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-deactivation.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-welcome.php';

require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-form-editor.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin.php';

// Load core
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-core.php';

// Load activation/deactivation handlers
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-activation.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-deactivation.php';

// Register activation hook
register_activation_hook(__FILE__, array('Krefrm_Activation', 'activate'));

// Register deactivation hook
register_deactivation_hook(__FILE__, array('Krefrm_Deactivation', 'deactivate'));

// Load plugin action links helper
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-plugin-action-links.php';

// Initialize plugin
Krefrm_Plugin::instance();
