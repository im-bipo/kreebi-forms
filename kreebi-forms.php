<?php

/**
 * Plugin Name: Kreebi Forms
 * Description: Simple form builder storing form definitions and submissions as custom post types.
 * Version:     1.0.1
 * Author:      Bipin Khatri
 * Author URI:  https://bipo.tech
 * Text Domain: kreebi-forms
 * License:     GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (! defined('ABSPATH')) {
    exit;
}

define('KREFRM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('KREFRM_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load dependencies
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-post-types.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-shortcode.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-submission-handler.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-form-sanitizer.php';
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-rest-api.php';

// Load admin classes
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-menu.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-assets.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-forms-page.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin-submissions-page.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-form-handler.php';

require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-form-editor.php';
require_once KREFRM_PLUGIN_DIR . 'admin/class-krefrm-admin.php';

// Load core
require_once KREFRM_PLUGIN_DIR . 'includes/class-krefrm-core.php';

// Initialize plugin
Krefrm_Plugin::instance();
