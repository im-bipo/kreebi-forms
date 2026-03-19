/**
 * IntegrationsPage – lists available integrations as toggle-able cards.
 */

import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { ToggleControl, Button } from "@wordpress/components";
import ProTag from "../components/ProTag";
import { getIntegration } from "../integrations/registry";
import { INTEGRATIONS, DEFAULT_ENABLED } from "../integrations/definitions";

const { restUrl, nonce } = window.krefrmAdmin || {};

/* the array contents have been relocated */

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
        // Build defaults: all DEFAULT_ENABLED integrations start as true
        const defaults = Object.fromEntries(
          DEFAULT_ENABLED.map((id) => [id, true]),
        );
        setEnabled({ ...defaults, ...integrations });
      })
      .catch(() => {
        const defaults = Object.fromEntries(
          DEFAULT_ENABLED.map((id) => [id, true]),
        );
        setEnabled(defaults);
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
    const subRoute = parseIntegrationSubRoute(route);
    const subId = subRoute.integrationId;
    // Only render sub-page if this integration is enabled
    if (subId && enabled[subId]) {
      const SubPage = getIntegrationSubPage(subId);
      if (SubPage) {
        return (
          <SubPage
            navigate={navigate}
            route={route}
            subPath={subRoute.subPath}
            query={subRoute.query}
          />
        );
      }
    }
    // Unknown or disabled sub-page → fall back to list
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

function getIntegrationSubPage(id) {
  const integration = getIntegration(id);
  return integration?.GlobalSettingsPage || null;
}

function parseIntegrationSubRoute(route) {
  const raw = route.replace(/^integrations\//, "");
  const [pathPart, queryString = ""] = raw.split("?");
  const segments = pathPart.split("/").filter(Boolean);

  return {
    integrationId: segments[0] || "",
    subPath: segments.slice(1).join("/"),
    query: new URLSearchParams(queryString),
  };
}
