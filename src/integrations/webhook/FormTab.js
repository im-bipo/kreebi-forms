import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import {
  ToggleControl,
  TextareaControl,
  Button,
  Notice,
} from "@wordpress/components";
import VariableHelp, { buildFieldVars } from "./VariableHelp";

const { restUrl, nonce } = window.krefrmAdmin || {};

const SAMPLE_PAYLOAD = {
  formId: "102",
  formDescription: "",
  fields: {
    name: "John Doe",
    email: "john@example.com",
    subject: "Testing webhook",
    message: "This is a webhook test",
    "new-field": "custom value",
  },
};

function toTextareaList(items = []) {
  return (items || []).join("\n");
}

function parseUrls(input) {
  return String(input || "")
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function WebhookFormTab({
  formSettings = {},
  availableFields = [],
  onChange,
  onSave,
  isEditing,
  formId = "",
}) {
  const [testing, setTesting] = useState(false);
  const [testNotice, setTestNotice] = useState(null);
  const [testPassed, setTestPassed] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const webhookEnabled = formSettings.enabled === true;
  const fieldVars = buildFieldVars(availableFields);

  // Fetch logs on mount and when webhook is enabled
  useEffect(() => {
    if (webhookEnabled) {
      loadLogs();
    }
  }, [webhookEnabled]);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      let url = `${restUrl}/webhook/logs`;
      if (formId) {
        url += `?form_id=${encodeURIComponent(formId)}`;
      }
      const response = await fetch(url, {
        headers: { "X-WP-Nonce": nonce },
      });
      const data = await response.json();
      const logsArray = data?.logs || [];
      if (Array.isArray(logsArray)) {
        setLogs(logsArray);
      }
    } catch (err) {
      // Silently fail on log fetch
      console.error("Failed to load webhook logs", err);
    }
    setLogsLoading(false);
  };

  const handleToggleEnable = (val) => {
    onChange({
      enabled: val,
      urls: formSettings.urls || [],
      headers: formSettings.headers || "",
      bodyTemplate: formSettings.bodyTemplate || "[[allForm]]",
      tested: val ? false : formSettings.tested,
    });
    setTestPassed(false);
    setTestNotice(null);
    if (val) {
      loadLogs();
    }
  };

  const updateField = (key) => (value) => {
    const nextValue = key === "urls" ? parseUrls(value) : value;
    onChange({
      ...formSettings,
      [key]: nextValue,
      tested: false,
    });
    setTestPassed(false);
  };

  const handleTest = () => {
    setTesting(true);
    setTestNotice(null);

    const urls = formSettings.urls || [];
    if (!urls.length) {
      setTestNotice({
        status: "error",
        message: __("Add at least one webhook URL.", "kreebi-forms"),
      });
      setTesting(false);
      return;
    }

    fetch(`${restUrl}/webhook/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({
        webhook: {
          urls,
          headers: formSettings.headers || "",
          bodyTemplate: formSettings.bodyTemplate || "[[allForm]]",
        },
        samplePayload: SAMPLE_PAYLOAD,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.code) {
          throw new Error(data.message || "Test failed");
        }

        const passed = Boolean(data?.passed);
        setTestPassed(passed);

        const updatedSettings = {
          ...formSettings,
          tested: true,
        };
        onChange(updatedSettings);

        setTestNotice({
          status: passed ? "success" : "warning",
          message: passed
            ? __("✓ Webhook test passed! Saving form...", "kreebi-forms")
            : __(
                "✗ Webhook test failed. Check URLs and try again.",
                "kreebi-forms",
              ),
        });

        // Auto-save form on test pass
        if (passed && isEditing && onSave) {
          // Wait for state updates to complete before saving
          setTimeout(() => {
            onSave();
          }, 100);
        }

        // Refresh logs after test
        loadLogs();
      })
      .catch((err) => {
        setTestNotice({
          status: "error",
          message: err.message || __("Webhook test failed.", "kreebi-forms"),
        });
        setTestPassed(false);
      })
      .finally(() => setTesting(false));
  };

  return (
    <div className="krefrm-intg-form-tab">
      <div className="krefrm-intg-form-tab__header">
        <h3 className="krefrm-intg-form-tab__title">
          {__("Webhook", "kreebi-forms")}
        </h3>
        <p className="krefrm-intg-form-tab__desc">
          {__(
            "Send this form submissions to external services via webhook.",
            "kreebi-forms",
          )}
        </p>
        <ToggleControl
          label={__("Enable webhook for this form", "kreebi-forms")}
          checked={webhookEnabled}
          onChange={handleToggleEnable}
          __nextHasNoMarginBottom
        />
      </div>

      {webhookEnabled && (
        <>
          {testNotice && (
            <Notice
              status={testNotice.status}
              isDismissible
              onDismiss={() => setTestNotice(null)}
            >
              {testNotice.message}
            </Notice>
          )}

          <div className="krefrm-webhook-layout">
            {/* Left Column: Settings */}
            <div className="krefrm-webhook-layout__left">
              <div className="krefrm-intg-form-tab__fields">
                <TextareaControl
                  label={__("Webhook URLs", "kreebi-forms")}
                  help={__("One URL per line.", "kreebi-forms")}
                  value={toTextareaList(formSettings.urls || [])}
                  onChange={updateField("urls")}
                  rows={4}
                  placeholder="https://example.com/webhook"
                />

                <TextareaControl
                  label={__("Custom Headers", "kreebi-forms")}
                  help={__(
                    "JSON object or one header per line, e.g. Authorization: Bearer token",
                    "kreebi-forms",
                  )}
                  value={formSettings.headers ?? ""}
                  onChange={updateField("headers")}
                  rows={4}
                  placeholder={'{"Authorization":"Bearer token"}'}
                />

                <TextareaControl
                  label={__("Request Body Template", "kreebi-forms")}
                  help={__(
                    "Default is [[allForm]]. Use variables to customize.",
                    "kreebi-forms",
                  )}
                  value={formSettings.bodyTemplate ?? "[[allForm]]"}
                  onChange={updateField("bodyTemplate")}
                  rows={6}
                  placeholder="[[allForm]]"
                />

                <VariableHelp fieldVariables={fieldVars} />

                <div className="krefrm-webhook-test-section">
                  <Button
                    variant={testPassed ? "primary" : "secondary"}
                    onClick={handleTest}
                    isBusy={testing}
                    disabled={testing}
                  >
                    {testing
                      ? __("Testing…", "kreebi-forms")
                      : testPassed
                      ? __("✓ Test Passed", "kreebi-forms")
                      : __("Test Webhook", "kreebi-forms")}
                  </Button>
                  {!testPassed && (
                    <p className="krefrm-webhook-test-required">
                      {__("Test required before saving", "kreebi-forms")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Logs */}
            <div className="krefrm-webhook-layout__right">
              {logs.length > 0 ? (
                <div className="krefrm-webhook-logs-section">
                  <h4>{__("Recent Webhook Activity", "kreebi-forms")}</h4>
                  <div className="krefrm-webhook-logs">
                    {logs.map((log, idx) => (
                      <div key={idx} className="krefrm-webhook-log-entry">
                        <div className="krefrm-webhook-log-status">
                          <span
                            className={`krefrm-webhook-log-badge ${
                              log.status === "success"
                                ? "krefrm-webhook-log-badge--success"
                                : "krefrm-webhook-log-badge--error"
                            }`}
                          >
                            {log.status === "success" ? "✓" : "✗"}
                          </span>
                        </div>
                        <div className="krefrm-webhook-log-details">
                          <div className="krefrm-webhook-log-url">
                            {log.url}
                          </div>
                          <div className="krefrm-webhook-log-timestamp">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          {log.status_code && (
                            <div className="krefrm-webhook-log-code">
                              {__("Status:", "kreebi-forms")} {log.status_code}
                            </div>
                          )}
                          {log.error && (
                            <div className="krefrm-webhook-log-error">
                              {log.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="krefrm-webhook-logs-empty">
                  <p>{__("No webhook activity yet", "kreebi-forms")}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!webhookEnabled && (
        <p className="krefrm-intg-form-tab__disabled-note">
          {__(
            "Webhook is disabled for this form. Toggle above to enable.",
            "kreebi-forms",
          )}
        </p>
      )}
    </div>
  );
}
