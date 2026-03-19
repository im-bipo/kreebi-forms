/**
 * Email Notification – global settings page.
 *
 * Accessible via: #integrations/email-notification
 * These settings apply to every form unless a form overrides them.
 */

import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import {
  Button,
  TextControl,
  TextareaControl,
  BaseControl,
} from "@wordpress/components";
import { MediaUpload, MediaUploadCheck } from "@wordpress/block-editor";

const { restUrl, nonce, siteTitle, adminEmail } = window.krefrmAdmin || {};

const DEFAULT_SETTINGS = {
  recipientEmail: adminEmail || "",
  senderName: siteTitle || "",
  subject: siteTitle
    ? `Notification | ${siteTitle}`
    : "Notification from your website",
  styleVariant: "style1",
  logoUrl: "",
  businessName: siteTitle || "",
  message:
    "Hello,\n\nYou have received a new form submission. Please review the details below.",
  themeColor: "#1875E5",
  footerContactDetails: "Contact us for support anytime.",
  footerName: siteTitle || "",
  footerEmail: adminEmail || "",
};

const STYLE_OPTIONS = [
  {
    id: "style1",
    label: __("Style 1 (With Form Data)", "kreebi-forms"),
  },
  {
    id: "style2",
    label: __("Style 2 (Without Form Data)", "kreebi-forms"),
  },
];

export default function EmailNotificationGlobalSettings({ navigate }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${restUrl}/settings`, {
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        const email = data?.emailNotification || {};
        setSettings((prev) => ({ ...prev, ...email, bodyTemplate: undefined }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    fetch(`${restUrl}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({ emailNotification: settings }),
    })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .finally(() => setSaving(false));
  };

  const update = (key) => (value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const hasFormData = settings.styleVariant !== "style2";

  if (loading) {
    return (
      <div className="krefrm-loading">
        <span>{__("Loading…", "kreebi-forms")}</span>
      </div>
    );
  }

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
            {__("Email Notification", "kreebi-forms")}
          </h2>
          <div className="krefrm-integration-settings__actions">
            {saved && (
              <span className="krefrm-integration-settings__saved">
                {__("✓ Saved", "kreebi-forms")}
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              isBusy={saving}
              disabled={saving}
            >
              {saving
                ? __("Saving…", "kreebi-forms")
                : __("Save Settings", "kreebi-forms")}
            </Button>
          </div>
        </div>

        <p className="krefrm-integration-settings__subtitle">
          {__(
            "These are the default settings used for all forms. Select a prebuilt email layout and customize its editable parts.",
            "kreebi-forms",
          )}
        </p>
      </div>

      <div className="krefrm-integration-settings__body">
        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Recipient Email", "kreebi-forms")}
            help={__(
              "The email address that receives notifications. Use commas to separate multiple addresses.",
              "kreebi-forms",
            )}
            type="email"
            value={settings.recipientEmail}
            onChange={update("recipientEmail")}
            placeholder={adminEmail || "admin@example.com"}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Sender Name", "kreebi-forms")}
            help={__(
              'The "From" name shown in the email. Defaults to the site name if left blank.',
              "kreebi-forms",
            )}
            value={settings.senderName}
            onChange={update("senderName")}
            placeholder={siteTitle || "My Website"}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Subject Line", "kreebi-forms")}
            help={__(
              "The subject of the notification email. You can use {form_name} as a placeholder.",
              "kreebi-forms",
            )}
            value={settings.subject}
            onChange={update("subject")}
            placeholder={
              siteTitle
                ? `Notification | ${siteTitle}`
                : "Notification from your website"
            }
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <BaseControl
            label={__("Email Body Template", "kreebi-forms")}
            help={__(
              "Custom freeform layout is disabled. Choose a style and edit its allowed sections.",
              "kreebi-forms",
            )}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {STYLE_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  variant={
                    settings.styleVariant === opt.id ? "primary" : "secondary"
                  }
                  onClick={() => update("styleVariant")(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </BaseControl>
        </div>

        <div className="krefrm-integration-settings__field">
          <BaseControl
            label={__("Logo", "kreebi-forms")}
            help={__(
              "Select a logo from Media Library or paste a direct image URL.",
              "kreebi-forms",
            )}
          >
            <div style={{ display: "grid", gap: "8px" }}>
              <TextControl
                value={settings.logoUrl || ""}
                onChange={update("logoUrl")}
                placeholder={__("https://example.com/logo.png", "kreebi-forms")}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <MediaUploadCheck>
                  <MediaUpload
                    onSelect={(media) => {
                      if (media?.url) {
                        update("logoUrl")(media.url);
                      }
                    }}
                    allowedTypes={["image"]}
                    value={settings.logoUrl}
                    render={({ open }) => (
                      <Button variant="secondary" onClick={open}>
                        {__("Select Logo from Media", "kreebi-forms")}
                      </Button>
                    )}
                  />
                </MediaUploadCheck>
                <Button
                  variant="tertiary"
                  onClick={() => update("logoUrl")("")}
                  disabled={!settings.logoUrl}
                >
                  {__("Remove Logo", "kreebi-forms")}
                </Button>
              </div>
            </div>
          </BaseControl>
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Business Name (Header)", "kreebi-forms")}
            value={settings.businessName || ""}
            onChange={update("businessName")}
            placeholder={siteTitle || "My Business"}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextareaControl
            label={__("Message", "kreebi-forms")}
            help={__(
              "This text appears above the form details block.",
              "kreebi-forms",
            )}
            value={settings.message || ""}
            onChange={update("message")}
            rows={4}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <BaseControl
            label={__("Color Theme", "kreebi-forms")}
            help={__(
              "Used for header accent and form data heading.",
              "kreebi-forms",
            )}
          >
            <input
              type="color"
              value={settings.themeColor || "#1875E5"}
              onChange={(e) => update("themeColor")(e.target.value)}
              style={{ width: "56px", height: "36px", padding: "2px" }}
            />
          </BaseControl>
        </div>

        <div className="krefrm-integration-settings__field">
          <TextareaControl
            label={__("Footer Contact Details", "kreebi-forms")}
            value={settings.footerContactDetails || ""}
            onChange={update("footerContactDetails")}
            rows={3}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Footer Name", "kreebi-forms")}
            value={settings.footerName || ""}
            onChange={update("footerName")}
            placeholder={siteTitle || "Support Team"}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Footer Email", "kreebi-forms")}
            type="email"
            value={settings.footerEmail || ""}
            onChange={update("footerEmail")}
            placeholder={adminEmail || "support@example.com"}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <BaseControl label={__("Template Preview", "kreebi-forms")}>
            <div
              style={{
                border: "1px solid #dcdcde",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  backgroundColor: settings.themeColor || "#1875E5",
                  color: "#fff",
                  padding: "14px 16px",
                  fontWeight: 600,
                }}
              >
                {settings.businessName || siteTitle || "Business Name"}
              </div>
              <div style={{ padding: "14px 16px", color: "#1e1e1e" }}>
                {!!settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={__("Logo", "kreebi-forms")}
                    style={{
                      maxHeight: "48px",
                      width: "auto",
                      marginBottom: "10px",
                    }}
                  />
                )}
                <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
                  {settings.message || "Message"}
                </p>
                {hasFormData && (
                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                    }}
                  >
                    <strong style={{ color: settings.themeColor || "#1875E5" }}>
                      {__("Form Data", "kreebi-forms")}
                    </strong>
                    <p style={{ margin: "8px 0 0", color: "#656565" }}>
                      {__(
                        "Auto-generated from submitted fields (not editable in template).",
                        "kreebi-forms",
                      )}
                    </p>
                  </div>
                )}
                <div
                  style={{ borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}
                >
                  <p style={{ margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
                    {settings.footerContactDetails || "Contact details"}
                  </p>
                  <p style={{ margin: "0 0 2px" }}>
                    {settings.footerName || "Name"}
                  </p>
                  <p style={{ margin: 0 }}>
                    {settings.footerEmail || "email@example.com"}
                  </p>
                </div>
                <div style={{ marginTop: "14px", fontSize: "12px" }}>
                  <a
                    href="https://kreebiforms.com/"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#1875E5",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Kreebi Forms
                  </a>
                </div>
              </div>
            </div>
          </BaseControl>
        </div>
      </div>
    </div>
  );
}
