/**
 * JSON View – global settings page (info-only).
 *
 * Accessible via: #integrations/json-view
 * JSON View has no configurable global settings – this page explains what it does.
 */

import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

export default function JsonViewGlobalSettings({ navigate }) {
  return (
    <div className="krefrm-integration-settings">
      <div className="krefrm-integration-settings__header">
        <Button
          variant="tertiary"
          className="krefrm-integration-settings__back"
          onClick={() => navigate("integrations")}
        >
          ← {__("Back to Integrations", "kreebi-forms")}
        </Button>

        <div className="krefrm-integration-settings__title-row">
          <h2 className="krefrm-integration-settings__title">
            {__("JSON View", "kreebi-forms")}
          </h2>
        </div>

        <p className="krefrm-integration-settings__subtitle">
          {__(
            "Inspect and edit the raw JSON structure of your forms directly inside the form editor.",
            "kreebi-forms",
          )}
        </p>
      </div>

      <div className="krefrm-integration-settings__body krefrm-integration-info">
        <div className="krefrm-integration-info__block">
          <h3 className="krefrm-integration-info__heading">
            {__("About JSON View", "kreebi-forms")}
          </h3>
          <p>
            {__(
              'When JSON View is enabled, a "JSON View" tab appears in the advanced form editor toolbar. Clicking it reveals the complete JSON representation of your form.',
              "kreebi-forms",
            )}
          </p>
        </div>

        <div className="krefrm-integration-info__block">
          <h3 className="krefrm-integration-info__heading">
            {__("How to use it", "kreebi-forms")}
          </h3>
          <ul className="krefrm-integration-info__list">
            <li>
              {__(
                'Open a form in the Advanced Editor and click the "JSON View" tab.',
                "kreebi-forms",
              )}
            </li>
            <li>
              {__(
                "Inspect or edit the raw JSON structure of the form.",
                "kreebi-forms",
              )}
            </li>
            <li>
              {__(
                'Click "Apply" to update the form with your edits.',
                "kreebi-forms",
              )}
            </li>
          </ul>
        </div>

        <p className="krefrm-integration-info__note">
          {__(
            "There are no global settings to configure for JSON View.",
            "kreebi-forms",
          )}
        </p>
      </div>
    </div>
  );
}
