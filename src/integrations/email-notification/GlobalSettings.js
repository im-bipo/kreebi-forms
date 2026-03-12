/**
 * Email Notification – global settings page.
 *
 * Accessible via: #integrations/email-notification
 * These settings apply to every form unless a form overrides them.
 */

import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, TextControl, TextareaControl } from "@wordpress/components";

const { restUrl, nonce, siteTitle, adminEmail } = window.krefrmAdmin || {};

const DEFAULT_TEMPLATE = `Hello,

You have received a new form submission.

Submitted Data:
{fields}

---
This is an automated email. Please do not reply.`;

export default function EmailNotificationGlobalSettings({ navigate }) {
  const [settings, setSettings] = useState({
    recipientEmail: adminEmail || "",
    senderName: siteTitle || "",
    subject: siteTitle
      ? `Notification | ${siteTitle}`
      : "Notification from your website",
    bodyTemplate: DEFAULT_TEMPLATE,
  });
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
        setSettings((prev) => ({ ...prev, ...email }));
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
            "These are the default settings used for all forms. Individual forms can override these settings.",
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
          <TextareaControl
            label={__("Email Body Template", "kreebi-forms")}
            help={__(
              "The body of the email. Use {fields} to include all submitted field values.",
              "kreebi-forms",
            )}
            value={settings.bodyTemplate}
            onChange={update("bodyTemplate")}
            rows={6}
            placeholder={DEFAULT_TEMPLATE}
          />
        </div>
      </div>
    </div>
  );
}
