import { __ } from "@wordpress/i18n";

export default function ActiveIntegration({
  loading,
  featuredIntegrations,
  navigate,
}) {
  return (
    <section className="krefrm-dashboard-integrations">
      <div className="krefrm-dashboard-integrations__head">
        <h3>{__("Active Integrations", "kreebi-forms")}</h3>
        <button
          type="button"
          className="krefrm-dashboard-link"
          onClick={() => navigate("integrations")}
        >
          {__("View More Integrations Options", "kreebi-forms")}
        </button>
      </div>

      <div
        className="krefrm-dashboard-integrations__grid"
        aria-label="Integrations"
      >
        {loading ? (
          <div className="krefrm-loading">
            <span>{__("Loading…", "kreebi-forms")}</span>
          </div>
        ) : featuredIntegrations.length === 0 ? (
          <div className="krefrm-dashboard-no-integrations">
            {__(
              "No active integrations yet. Enable one from the Integrations page to start configuring.",
              "kreebi-forms",
            )}
          </div>
        ) : (
          featuredIntegrations.map((integration) => (
            <article
              key={integration.id}
              className="krefrm-dashboard-integration-card"
            >
              <div className="krefrm-dashboard-integration-card__top">
                <span className="krefrm-dashboard-integration-card__icon">
                  {integration.icon}
                </span>
                <button
                  type="button"
                  className="krefrm-dashboard-integration-card__settings"
                  onClick={() => navigate(`integrations/${integration.id}`)}
                  aria-label={__("Open settings", "kreebi-forms")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-settings-icon lucide-settings"
                  >
                    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              <div className="krefrm-dashboard-integration-card__bottom">
                <span className="krefrm-dashboard-integration-card__name">
                  {integration.name}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
