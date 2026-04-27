import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import WebhookLogs from "./WebhookLogs";

const { restUrl, nonce } = window.krefrmAdmin || {};

export default function WebhookGlobalSettings({ navigate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLogsLoading(true);
    fetch(`${restUrl}/webhook/logs`, {
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json().then((data) => ({ response: r, data })))
      .then(({ response, data }) => {
        // DEBUG: inspect logs response from server (global view)
        console.log("[Webhook GlobalSettings] logs response", {
          response,
          data,
        });
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
      })
      .finally(() => {
        setLogsLoading(false);
        if (loading) setLoading(false);
      });
  };

  const handleClearLogs = () => {
    setLogsLoading(true);
    fetch(`${restUrl}/webhook/logs`, {
      method: "DELETE",
      headers: { "X-WP-Nonce": nonce },
    })
      .then(() => setLogs([]))
      .finally(() => setLogsLoading(false));
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

      <div className="krefrm-integration-settings__content">
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
        <WebhookLogs
          logs={logs}
          loading={logsLoading}
          onRefetch={loadLogs}
          onClear={handleClearLogs}
          title={__("All Webhook Logs", "kreebi-forms")}
        />
      </div>
      </div>
    </div>
  );
}
