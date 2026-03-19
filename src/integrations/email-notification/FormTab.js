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

import { useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import {
  ToggleControl,
  TextControl,
  BaseControl,
  Button,
} from "@wordpress/components";
import EmailTemplateStyleEditor from "./StyleEditor";
import {
  DEFAULT_EMAIL_TEMPLATE_SETTINGS,
  STYLE_OPTIONS,
} from "./templateSettings";

export default function EmailNotificationFormTab({
  globalSettings = {},
  formSettings = {},
  onChange,
  onSave,
  formId = "",
}) {
  // If _useGlobal is not explicitly false, default to using global settings
  const useGlobal = formSettings._useGlobal !== false;

  const update = (key) => (value) =>
    onChange({ ...formSettings, _useGlobal: false, [key]: value });

  const updateField = (key, value) =>
    onChange({ ...formSettings, _useGlobal: false, [key]: value });

  const isStyleEditorRoute =
    typeof window !== "undefined" &&
    window.location.hash.includes("forms/edit/email-notification/edit-style?");

  useEffect(() => {
    if (!isStyleEditorRoute || typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#\/?/, "");
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return;
    const queryString = hash.slice(queryIndex + 1);
    const layout = new URLSearchParams(queryString).get("layout");
    if (
      (layout === "style1" || layout === "style2") &&
      formSettings.styleVariant !== layout
    ) {
      onChange({ ...formSettings, _useGlobal: false, styleVariant: layout });
    }
  }, [isStyleEditorRoute, formSettings, onChange]);

  const activeSettings = {
    ...DEFAULT_EMAIL_TEMPLATE_SETTINGS,
    ...globalSettings,
    ...(useGlobal ? {} : formSettings),
  };

  const selectedStyle =
    formSettings.styleVariant || globalSettings.styleVariant || "style1";

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
        ...DEFAULT_EMAIL_TEMPLATE_SETTINGS,
        ...globalSettings,
      });
    }
  };

  const openStyleEditor = () => {
    const targetFormId = formId || "";
    window.location.hash = `forms/edit/email-notification/edit-style?form_id=${encodeURIComponent(
      targetFormId,
    )}&layout=${encodeURIComponent(selectedStyle)}`;
  };

  const closeStyleEditor = () => {
    const targetFormId = formId || "";
    window.location.hash = `forms/edit?form_id=${encodeURIComponent(
      targetFormId,
    )}&tab=email-notification`;
  };

  if (isStyleEditorRoute) {
    return (
      <EmailTemplateStyleEditor
        settings={activeSettings}
        onUpdate={updateField}
        onBack={closeStyleEditor}
        onSave={onSave}
        saveLabel={__("Save Form", "kreebi-forms")}
      />
    );
  }

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
            <div style={{ display: "grid", gap: "8px" }}>
              {STYLE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="radio"
                    checked={selectedStyle === opt.id}
                    onChange={() => update("styleVariant")(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              <div>
                <Button variant="secondary" onClick={openStyleEditor}>
                  {__("Edit", "kreebi-forms")}
                </Button>
              </div>
            </div>
          </BaseControl>
        </div>
      )}
    </div>
  );
}
