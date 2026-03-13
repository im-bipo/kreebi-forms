import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, Notice } from "@wordpress/components";

const { restUrl, nonce } = window.krefrmAdmin || {};

export default function WebhookGlobalSettings({ navigate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLogsLoading(true);
    fetch(`${restUrl}/webhook/logs`, {
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
      })
      .finally(() => {
        setLogsLoading(false);
        if (loading) setLoading(false);
      });
  };

  const handleClearLogs = () => {
    setClearingLogs(true);
    fetch(`${restUrl}/webhook/logs`, {
      method: "DELETE",
      headers: { "X-WP-Nonce": nonce },
    })
      .then(() => setLogs([]))
      .finally(() => setClearingLogs(false));
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
            {__("Webhook", "kreebi-forms")}
          </h2>
        </div>

        <p className="krefrm-integration-settings__subtitle">
          {__(
            "Webhooks allow you to send form data to external services in real-time. Configure webhook settings on individual forms.",
            "kreebi-forms",
          )}
        </p>
      </div>

      <div className="krefrm-integration-settings__body">
        <div className="krefrm-webhook-info">
          <h3>{__("What is a Webhook?", "kreebi-forms")}</h3>
          <p>
            {__(
              "A webhook is an HTTP callback that sends form submission data to a URL of your choice. This enables integration with external services like Zapier, Make.com, or custom applications.",
              "kreebi-forms",
            )}
          </p>
          <h4>{__("How it works:", "kreebi-forms")}</h4>
          <ol>
            <li>
              {__("Enable the webhook for a specific form.", "kreebi-forms")}
            </li>
            <li>
              {__(
                "Set one or more webhook URLs that will receive the form data.",
                "kreebi-forms",
              )}
            </li>
            <li>
              {__(
                "Test the webhook to ensure it works correctly.",
                "kreebi-forms",
              )}
            </li>
            <li>
              {__(
                "When the form is submitted, data is automatically sent to your webhook URLs.",
                "kreebi-forms",
              )}
            </li>
          </ol>
        </div>
      </div>

      <div className="krefrm-webhook-logs">
        <div className="krefrm-webhook-logs__header">
          <h3>{__("All Webhook Logs", "kreebi-forms")}</h3>
          <div className="krefrm-webhook-logs__actions">
            <Button variant="secondary" onClick={loadLogs} isBusy={logsLoading}>
              {__("Refresh", "kreebi-forms")}
            </Button>
            <Button
              variant="tertiary"
              onClick={handleClearLogs}
              isBusy={clearingLogs}
              disabled={clearingLogs || logs.length === 0}
            >
              {__("Clear Logs", "kreebi-forms")}
            </Button>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="krefrm-webhook-logs__empty">
            {__("No webhook logs yet.", "kreebi-forms")}
          </p>
        ) : (
          <div className="krefrm-webhook-logs__list">
            {logs.map((log, idx) => (
              <details
                key={`${log.timestamp}-${idx}`}
                className="krefrm-webhook-log-item"
              >
                <summary>
                  <span
                    className={`krefrm-webhook-log-item__status ${
                      log.passed ? "is-pass" : "is-fail"
                    }`}
                  >
                    {log.passed ? "PASS" : "FAIL"}
                  </span>
                  <span>{log.source || "submission"}</span>
                  <span>{log.url}</span>
                  <span>{log.response_code || 0}</span>
                  <span>{log.timestamp}</span>
                </summary>
                <div className="krefrm-webhook-log-item__grid">
                  <div>
                    <p>{__("Request Headers", "kreebi-forms")}</p>
                    <pre>
                      {JSON.stringify(log.request_headers || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p>{__("Request Body", "kreebi-forms")}</p>
                    <pre>{log.request_body || ""}</pre>
                  </div>
                  <div>
                    <p>{__("Response Body", "kreebi-forms")}</p>
                    <pre>{log.response_body || log.error || ""}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
