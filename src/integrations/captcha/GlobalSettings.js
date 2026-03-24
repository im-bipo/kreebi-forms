import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import {
  Button,
  TextControl,
  ToggleControl,
  RangeControl,
} from "@wordpress/components";

const { restUrl, nonce } = window.krefrmAdmin || {};

const DEFAULTS = {
  enabled: false,
  mode: "v3",
  siteKey: "",
  secretKey: "",
  hasSecretKey: false,
  v3Threshold: 0.5,
};

export default function CaptchaGlobalSettings({ navigate }) {
  const [settings, setSettings] = useState(DEFAULTS);
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
        const captcha = data?.captcha || {};
        setSettings((prev) => ({
          ...prev,
          ...captcha,
          secretKey: "",
          hasSecretKey: Boolean(captcha?.hasSecretKey),
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key) => (value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    setSaving(true);

    const parsedThreshold = Number(settings.v3Threshold);
    const threshold = Number.isFinite(parsedThreshold)
      ? Math.min(1, Math.max(0.1, parsedThreshold))
      : 0.5;

    const payload = {
      enabled: Boolean(settings.enabled),
      mode: "v3",
      siteKey: settings.siteKey || "",
      v3Threshold: threshold,
    };

    if (settings.secretKey && settings.secretKey.trim()) {
      payload.secretKey = settings.secretKey.trim();
    }

    fetch(`${restUrl}/settings`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({ captcha: payload }),
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to save captcha settings");
        }
        return r.json();
      })
      .then((data) => {
        const captcha = data?.captcha || {};
        setSettings((prev) => ({
          ...prev,
          ...captcha,
          secretKey: "",
          hasSecretKey: Boolean(captcha?.hasSecretKey),
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch(() => {
        // leave settings unchanged on failure
      })
      .finally(() => setSaving(false));
  };

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
            {__("Captcha Protection", "kreebi-forms")}
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
            "Enable reCAPTCHA v3 globally. Once configured, every Kreebi form will request a captcha token before submission.",
            "kreebi-forms",
          )}
        </p>
      </div>

      <div className="krefrm-integration-settings__body">
        <div className="krefrm-integration-settings__field">
          <ToggleControl
            label={__("Enable Captcha Protection", "kreebi-forms")}
            help={__(
              "When enabled, all forms are protected by Google reCAPTCHA v3.",
              "kreebi-forms",
            )}
            checked={Boolean(settings.enabled)}
            onChange={update("enabled")}
            __nextHasNoMarginBottom
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Version", "kreebi-forms")}
            value={__("reCAPTCHA v3", "kreebi-forms")}
            disabled
            help={__(
              "This release supports reCAPTCHA v3 only.",
              "kreebi-forms",
            )}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Site Key", "kreebi-forms")}
            help={__(
              "Public key from your Google reCAPTCHA admin console.",
              "kreebi-forms",
            )}
            value={settings.siteKey}
            onChange={update("siteKey")}
            placeholder="6Lc..."
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <TextControl
            label={__("Secret Key", "kreebi-forms")}
            type="password"
            help={
              settings.hasSecretKey
                ? __(
                    "A secret key is already stored. Enter a new value only if you want to replace it.",
                    "kreebi-forms",
                  )
                : __(
                    "Private key from your Google reCAPTCHA admin console.",
                    "kreebi-forms",
                  )
            }
            value={settings.secretKey}
            onChange={update("secretKey")}
            placeholder={settings.hasSecretKey ? "••••••••••••" : "6Lc..."}
          />
        </div>

        <div className="krefrm-integration-settings__field">
          <RangeControl
            label={__("Minimum Score Threshold", "kreebi-forms")}
            help={__(
              "Submissions with scores lower than this value are rejected. Recommended: 0.5.",
              "kreebi-forms",
            )}
            value={
              Number.isFinite(Number(settings.v3Threshold))
                ? Number(settings.v3Threshold)
                : 0.5
            }
            onChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                v3Threshold: Number.isFinite(Number(value))
                  ? Number(value)
                  : 0.5,
              }))
            }
            min={0.1}
            max={1}
            step={0.1}
            withInputField
          />
        </div>
      </div>
    </div>
  );
}
