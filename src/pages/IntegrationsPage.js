/**
 * IntegrationsPage – lists available integrations as toggle-able cards.
 *
 * Each card shows:
 *  - Name + toggle (on / off)
 *  - Description
 *  - "Settings" link (visible when enabled) → routes to integration/:id
 */

import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { ToggleControl, Button } from "@wordpress/components";
import ProTag from "../components/ProTag";

const { restUrl, nonce } = window.krefrmAdmin || {};

/* ── Integration definitions ─────────────────────────────── */

const INTEGRATIONS = [
  {
    id: "email-notification",
    name: __("Email Notification", "kreebi-forms"),
    description: __(
      "Send an email notification to one or more recipients every time a form is submitted. Configure the sender, subject line, and message body to match your workflow.",
      "kreebi-forms",
    ),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: "google-sheet",
    name: __("Google Sheets", "kreebi-forms"),
    description: __(
      "Automatically save form submissions directly to a Google Sheet. Perfect for tracking, analysis, and sharing responses with your team.",
      "kreebi-forms",
    ),
    isPremium: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    ),
  },
  {
    id: "captcha",
    name: __("Captcha Protection", "kreebi-forms"),
    description: __(
      "Add Google reCAPTCHA v3 to your forms to prevent spam and bot submissions. Requires minimal configuration.",
      "kreebi-forms",
    ),
    isPremium: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "payment",
    name: __("Payment Processing", "kreebi-forms"),
    description: __(
      "Accept payments directly through your forms with Stripe or PayPal integration. Secure, reliable, and PCI compliant.",
      "kreebi-forms",
    ),
    isPremium: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: "webhook",
    name: __("Webhook & Zapier", "kreebi-forms"),
    description: __(
      "Send form data to external services via webhooks or integrate with Zapier for thousands of app integrations.",
      "kreebi-forms",
    ),
    isPremium: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="5" r="1" />
        <circle cx="5" cy="19" r="1" />
        <line x1="12" y1="12" x2="19" y2="5" />
        <line x1="12" y1="12" x2="5" y2="19" />
      </svg>
    ),
  },
];

/* ── Main component ──────────────────────────────────────── */

export default function IntegrationsPage({ route, navigate }) {
  const [enabled, setEnabled] = useState({});
  const [loading, setLoading] = useState(true);

  /* Load saved integration states on mount */
  useEffect(() => {
    fetch(`${restUrl}/settings`, {
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        const integrations = data?.integrations || {};
        // Email notification is enabled by default
        setEnabled({
          "email-notification": true,
          ...integrations,
        });
      })
      .catch(() => {
        // Fallback: at least enable email-notification
        setEnabled({ "email-notification": true });
      })
      .finally(() => setLoading(false));
  }, []);

  /* Persist toggle change */
  const handleToggle = (integrationId, value) => {
    const next = { ...enabled, [integrationId]: value };
    setEnabled(next);

    fetch(`${restUrl}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({ integrations: next }),
    }).catch(() => {
      // Revert on failure
      setEnabled((prev) => ({ ...prev, [integrationId]: !value }));
    });
  };

  /* If route points to a sub-page, render it instead */
  if (route.startsWith("integrations/")) {
    const subId = route.replace("integrations/", "");
    // Lazy-load sub-pages here
    const SubPage = getIntegrationSubPage(subId);
    if (SubPage) {
      return <SubPage navigate={navigate} />;
    }
    // Unknown sub-page → fall back to list
  }

  return (
    <div className="krefrm-integrations-page">
      {/* Header */}
      <div className="krefrm-integrations-page__header">
        <div>
          <h2 className="krefrm-integrations-page__title">
            {__("Add Integrations", "kreebi-forms")}
          </h2>
          <p className="krefrm-integrations-page__subtitle">
            {__(
              "Connect your forms to external services. Toggle an integration on and configure its settings.",
              "kreebi-forms",
            )}
          </p>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="krefrm-loading">
          <span>{__("Loading…", "kreebi-forms")}</span>
        </div>
      ) : (
        <div className="krefrm-integrations-cards">
          {INTEGRATIONS.map((integration) => {
            const isEnabled = Boolean(enabled[integration.id]);
            const isPremium = Boolean(integration.isPremium);

            return (
              <div
                key={integration.id}
                className={`krefrm-integration-card ${
                  isEnabled ? "is-enabled" : ""
                } ${isPremium ? "is-premium" : ""}`}
                {...(isPremium && {
                  onClick: () => {
                    window.location.href =
                      "admin.php?page=krefrm_forms#upgrade-to-pro";
                  },
                  style: { cursor: "pointer" },
                })}
              >
                {/* Card header: icon + name + toggle/pro-tag */}
                <div className="krefrm-integration-card__header">
                  <div className="krefrm-integration-card__icon">
                    {integration.icon}
                  </div>
                  <div className="krefrm-integration-card__name">
                    {integration.name}
                  </div>
                  <div className="krefrm-integration-card__toggle">
                    {isPremium ? (
                      <button
                        className="krefrm-integration-card__pro-button"
                        onClick={() => {
                          window.location.href =
                            "admin.php?page=krefrm_forms#upgrade-to-pro";
                        }}
                      >
                        <ProTag variant="primary" />
                      </button>
                    ) : (
                      <ToggleControl
                        checked={isEnabled}
                        onChange={(val) => handleToggle(integration.id, val)}
                        __nextHasNoMarginBottom
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="krefrm-integration-card__desc">
                  {integration.description}
                </p>

                {/* Settings link — only when enabled (non-premium) */}
                {!isPremium && isEnabled && (
                  <div className="krefrm-integration-card__footer">
                    <Button
                      variant="secondary"
                      className="krefrm-integration-card__settings-btn"
                      onClick={() => navigate(`integrations/${integration.id}`)}
                    >
                      {__("Settings", "kreebi-forms")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sub-page resolver ───────────────────────────────────── */

import EmailNotificationPage from "./integrationPages/EmailNotificationPage";

function getIntegrationSubPage(id) {
  const map = {
    "email-notification": EmailNotificationPage,
  };
  return map[id] || null;
}
