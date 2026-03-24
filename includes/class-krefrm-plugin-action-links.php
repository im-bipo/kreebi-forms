<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 *
 * @param array $links Existing action links.
 * @return array
 */
function krefrm_plugin_action_links($links)
{
    $settings_link = '<a href="' . esc_url(admin_url('admin.php?page=krefrm_forms')) . '">' . esc_html__('Setting', 'kreebi-forms') . '</a>';
    array_unshift($links, $settings_link);

    return $links;
}
$krefrm_plugin_file = plugin_basename(dirname(__DIR__) . '/kreebi-forms.php');
add_filter('plugin_action_links_' . $krefrm_plugin_file, 'krefrm_plugin_action_links');
