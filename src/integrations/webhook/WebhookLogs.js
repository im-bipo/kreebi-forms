import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

/**
 * Reusable webhook logs display component.
 *
 * Props:
 *  logs       {Array}    array of log objects
 *  loading    {boolean}  whether logs are loading
 *  onRefetch  {Function} callback to refetch logs
 *  onClear    {Function} callback to clear all logs
 *  title      {string}   optional title (default: "Webhook Logs")
 */
export default function WebhookLogs({
  logs = [],
  loading = false,
  onRefetch,
  onClear,
  title,
}) {
  const displayTitle = title || __("Webhook Logs", "kreebi-forms");

  if (!logs || logs.length === 0) {
    return (
      <div className="krefrm-webhook-logs-container">
        <div className="krefrm-webhook-logs__header">
          <h3>{displayTitle}</h3>
          <div className="krefrm-webhook-logs__actions">
            {onRefetch && (
              <Button variant="secondary" onClick={onRefetch} isBusy={loading}>
                {__("Refresh", "kreebi-forms")}
              </Button>
            )}
            {onClear && (
              <Button
                variant="tertiary"
                onClick={onClear}
                disabled={loading || logs.length === 0}
              >
                {__("Clear Logs", "kreebi-forms")}
              </Button>
            )}
          </div>
        </div>
        <p className="krefrm-webhook-logs__empty">
          {__("No webhook logs yet.", "kreebi-forms")}
        </p>
      </div>
    );
  }

  return (
    <div className="krefrm-webhook-logs-container">
      <div className="krefrm-webhook-logs__header">
        <h3>{displayTitle}</h3>
        <div className="krefrm-webhook-logs__actions">
          {onRefetch && (
            <Button variant="secondary" onClick={onRefetch} isBusy={loading}>
              {__("Refresh", "kreebi-forms")}
            </Button>
          )}
          {onClear && (
            <Button
              variant="tertiary"
              onClick={onClear}
              disabled={loading || logs.length === 0}
            >
              {__("Clear Logs", "kreebi-forms")}
            </Button>
          )}
        </div>
      </div>

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
                <pre>{JSON.stringify(log.request_headers || {}, null, 2)}</pre>
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
    </div>
  );
}
