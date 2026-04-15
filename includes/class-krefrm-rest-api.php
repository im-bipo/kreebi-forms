<?php

if (! defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-routes.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-forms.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-submissions.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-settings.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-webhooks.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-addons.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-custom-css.php';
require_once __DIR__ . '/rest-api/trait-krefrm-rest-api-helpers.php';

/**
 * REST API endpoints for Kreebi Forms
 */
class Krefrm_Rest_Api
{
    use Krefrm_Rest_Api_Routes;
    use Krefrm_Rest_Api_Forms;
    use Krefrm_Rest_Api_Submissions;
    use Krefrm_Rest_Api_Settings;
    use Krefrm_Rest_Api_Webhooks;
    use Krefrm_Rest_Api_Addons;
    use Krefrm_Rest_Api_Custom_Css;
    use Krefrm_Rest_Api_Helpers;

    const NAMESPACE = 'kreebi-forms/v1';

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
}
