/**
 * Email Notification – global settings page.
 *
 * Accessible via: #integrations/email-notification
 * These settings apply to every form unless a form overrides them.
 */

import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, TextControl, BaseControl } from "@wordpress/components";
import EmailTemplateStyleEditor from "./StyleEditor";
import {
  DEFAULT_EMAIL_TEMPLATE_SETTINGS,
  STYLE_OPTIONS,
} from "./templateSettings";

const { restUrl, nonce, siteTitle, adminEmail } = window.krefrmAdmin || {};

const DEFAULT_SETTINGS = {
  recipientEmail: adminEmail || "",
  senderName: siteTitle || "",
  subject: siteTitle
    ? `Notification | ${siteTitle}`
    : "Notification from your website",
  ...DEFAULT_EMAIL_TEMPLATE_SETTINGS,
};

export default function EmailNotificationGlobalSettings({
  navigate,
  subPath = "",
  query,
}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${restUrl}/settings`, {
      cache: "no-store",
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
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({ emailNotification: settings }),
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to save email notification settings");
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch(() => {
        // keep existing state when save fails
      })
      .finally(() => setSaving(false));
  };

  const update = (key) => (value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const updateField = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const isStyleEditor = subPath === "edit-style";
  const layoutFromQuery = query?.get("layout") || "";

  useEffect(() => {
    if (!isStyleEditor) return;
    const layout = layoutFromQuery;
    if (layout === "style1" || layout === "style2") {
      setSettings((prev) =>
        prev.styleVariant === layout ? prev : { ...prev, styleVariant: layout },
      );
    }
  }, [isStyleEditor, layoutFromQuery]);

  if (loading) {
    return (
      <div className="krefrm-loading">
        <span>{__("Loading…", "kreebi-forms")}</span>
      </div>
    );
  }

  if (isStyleEditor) {
    return (
      <EmailTemplateStyleEditor
        settings={settings}
        onUpdate={updateField}
        onBack={() => navigate("integrations/email-notification")}
        onSave={handleSave}
        saveLabel={
          saving
            ? __("Saving…", "kreebi-forms")
            : __("Save Settings", "kreebi-forms")
        }
        showSave={true}
        isSaving={saving}
      />
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
            "These are the default settings used for all forms.",
            "kreebi-forms",
          )}
        </p>
      </div>

      <div className="krefrm-integration-settings__content">
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
              "Choose a style and click Edit to customize the layout.",
              "kreebi-forms",
            )}
          >
            <div style={{ display: "grid", gap: "8px" }}>
              {STYLE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="radio"
                    checked={(settings.styleVariant || "style1") === opt.id}
                    onChange={() => update("styleVariant")(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              <div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(
                      `integrations/email-notification/edit-style?layout=${encodeURIComponent(
                        settings.styleVariant || "style1",
                      )}`,
                    )
                  }
                >
                  {__("Edit", "kreebi-forms")}
                </Button>
              </div>
            </div>
          </BaseControl>
        </div>
      </div>
      </div>
    </div>
  );
}
