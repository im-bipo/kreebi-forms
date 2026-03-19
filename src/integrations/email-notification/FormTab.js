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
  BaseControl,
  Button,
} from "@wordpress/components";

const STYLE_OPTIONS = [
  { id: "style1", label: __("Style 1 (With Form Data)", "kreebi-forms") },
  {
    id: "style2",
    label: __("Style 2 (Without Form Data)", "kreebi-forms"),
  },
];

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
        styleVariant: globalSettings.styleVariant || "style1",
        logoUrl: globalSettings.logoUrl || "",
        businessName:
          globalSettings.businessName || globalSettings.senderName || "",
        message: globalSettings.message || "",
        themeColor: globalSettings.themeColor || "#1875E5",
        footerContactDetails: globalSettings.footerContactDetails || "",
        footerName: globalSettings.footerName || "",
        footerEmail: globalSettings.footerEmail || "",
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
            <div className="krefrm-intg-form-tab__preview-row">
              <span className="krefrm-intg-form-tab__preview-label">
                {__("Template:", "kreebi-forms")}
              </span>
              <span className="krefrm-intg-form-tab__preview-value">
                {globalSettings.styleVariant === "style2"
                  ? __("Style 2 (Without Form Data)", "kreebi-forms")
                  : __("Style 1 (With Form Data)", "kreebi-forms")}
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
          <BaseControl label={__("Template Style", "kreebi-forms")}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {STYLE_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  variant={
                    (formSettings.styleVariant || "style1") === opt.id
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() => update("styleVariant")(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </BaseControl>
          <TextControl
            label={__("Logo URL", "kreebi-forms")}
            value={formSettings.logoUrl ?? ""}
            onChange={update("logoUrl")}
            placeholder={
              globalSettings.logoUrl || "https://example.com/logo.png"
            }
          />
          <TextControl
            label={__("Business Name (Header)", "kreebi-forms")}
            value={formSettings.businessName ?? ""}
            onChange={update("businessName")}
            placeholder={
              globalSettings.businessName ||
              globalSettings.senderName ||
              "My Business"
            }
          />
          <TextareaControl
            label={__("Message", "kreebi-forms")}
            value={formSettings.message ?? ""}
            onChange={update("message")}
            rows={4}
            placeholder={globalSettings.message || ""}
          />
          <TextControl
            label={__("Theme Color (Hex)", "kreebi-forms")}
            value={formSettings.themeColor ?? ""}
            onChange={update("themeColor")}
            placeholder={globalSettings.themeColor || "#1875E5"}
          />
          <TextareaControl
            label={__("Footer Contact Details", "kreebi-forms")}
            value={formSettings.footerContactDetails ?? ""}
            onChange={update("footerContactDetails")}
            rows={3}
            placeholder={globalSettings.footerContactDetails || ""}
          />
          <TextControl
            label={__("Footer Name", "kreebi-forms")}
            value={formSettings.footerName ?? ""}
            onChange={update("footerName")}
            placeholder={globalSettings.footerName || ""}
          />
          <TextControl
            label={__("Footer Email", "kreebi-forms")}
            value={formSettings.footerEmail ?? ""}
            onChange={update("footerEmail")}
            placeholder={globalSettings.footerEmail || ""}
          />
        </div>
      )}
    </div>
  );
}
