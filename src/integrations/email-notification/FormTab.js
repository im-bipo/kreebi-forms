/**
 * Email Notification – form-level settings tab.
 *
 * Shown inside the form editor when the Email Notification integration is enabled.
 * Users can either inherit global settings or override them per-form.
 *
 * Props:
 *  globalSettings  {Object}   global email notification settings
 *  formSettings    {Object}   form-level overrides (empty = use global)
 *  onChange        {Function} called with updated formSettings
 */

import { __ } from "@wordpress/i18n";
import {
  ToggleControl,
  TextControl,
  TextareaControl,
} from "@wordpress/components";

export default function EmailNotificationFormTab({
  globalSettings = {},
  formSettings = {},
  onChange,
}) {
  // If _useGlobal is not explicitly false, default to using global settings
  const useGlobal = formSettings._useGlobal !== false;

  const update = (key) => (value) =>
    onChange({ ...formSettings, _useGlobal: false, [key]: value });

  const handleUseGlobalToggle = (val) => {
    if (val) {
      // Reset to global – clear all overrides
      onChange({ _useGlobal: true });
    } else {
      // Seed the overrides with current global values so fields are pre-filled
      onChange({
        _useGlobal: false,
        recipientEmail: globalSettings.recipientEmail || "",
        senderName: globalSettings.senderName || "",
        subject: globalSettings.subject || "",
        bodyTemplate: globalSettings.bodyTemplate || "",
      });
    }
  };

  return (
    <div className="krefrm-intg-form-tab">
      <div className="krefrm-intg-form-tab__header">
        <h3 className="krefrm-intg-form-tab__title">
          {__("Email Notification", "kreebi-forms")}
        </h3>
        <p className="krefrm-intg-form-tab__desc">
          {__(
            "Customize email notification settings for this form. Toggle off to override the global defaults.",
            "kreebi-forms",
          )}
        </p>
        <ToggleControl
          label={__("Use global settings", "kreebi-forms")}
          checked={useGlobal}
          onChange={handleUseGlobalToggle}
          __nextHasNoMarginBottom
        />
      </div>

      {useGlobal ? (
        <div className="krefrm-intg-form-tab__preview">
          <p className="krefrm-intg-form-tab__preview-note">
            {__(
              "This form will use the global settings. Enable override above to customize.",
              "kreebi-forms",
            )}
          </p>
          <div className="krefrm-intg-form-tab__preview-rows">
            <div className="krefrm-intg-form-tab__preview-row">
              <span className="krefrm-intg-form-tab__preview-label">
                {__("Recipient:", "kreebi-forms")}
              </span>
              <span className="krefrm-intg-form-tab__preview-value">
                {globalSettings.recipientEmail || "—"}
              </span>
            </div>
            <div className="krefrm-intg-form-tab__preview-row">
              <span className="krefrm-intg-form-tab__preview-label">
                {__("Subject:", "kreebi-forms")}
              </span>
              <span className="krefrm-intg-form-tab__preview-value">
                {globalSettings.subject || "—"}
              </span>
            </div>
            <div className="krefrm-intg-form-tab__preview-row">
              <span className="krefrm-intg-form-tab__preview-label">
                {__("Sender:", "kreebi-forms")}
              </span>
              <span className="krefrm-intg-form-tab__preview-value">
                {globalSettings.senderName || "—"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="krefrm-intg-form-tab__fields">
          <TextControl
            label={__("Recipient Email", "kreebi-forms")}
            help={__(
              "The email address that receives notifications for this form.",
              "kreebi-forms",
            )}
            type="email"
            value={formSettings.recipientEmail ?? ""}
            onChange={update("recipientEmail")}
            placeholder={globalSettings.recipientEmail || "admin@example.com"}
          />
          <TextControl
            label={__("Sender Name", "kreebi-forms")}
            value={formSettings.senderName ?? ""}
            onChange={update("senderName")}
            placeholder={globalSettings.senderName || "My Website"}
          />
          <TextControl
            label={__("Subject Line", "kreebi-forms")}
            value={formSettings.subject ?? ""}
            onChange={update("subject")}
            placeholder={
              globalSettings.subject || "Notification from your website"
            }
          />
          <TextareaControl
            label={__("Email Body Template", "kreebi-forms")}
            help={__(
              "Use {fields} to include all submitted values.",
              "kreebi-forms",
            )}
            value={formSettings.bodyTemplate ?? ""}
            onChange={update("bodyTemplate")}
            rows={5}
            placeholder={globalSettings.bodyTemplate || ""}
          />
        </div>
      )}
    </div>
  );
}
