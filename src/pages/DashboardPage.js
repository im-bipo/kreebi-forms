import { useEffect, useState } from "@wordpress/element";
import apiFetch from "@wordpress/api-fetch";
import { __ } from "@wordpress/i18n";
import { INTEGRATIONS, DEFAULT_ENABLED } from "../integrations/definitions";
import Welcome from "./DashboardPage/welcome";
import ActiveIntegration from "./DashboardPage/active-integration";

const SCREEN_OPTIONS_KEY = "krefrm_dashboard_screen_options";

export default function DashboardPage({ navigate = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [formsCount, setFormsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState(0);
  const [activeIntegrationList, setActiveIntegrationList] = useState([]);
  const [isScreenOptionsOpen, setIsScreenOptionsOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    welcome: true,
    activeIntegrations: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(SCREEN_OPTIONS_KEY);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      setVisibleSections((prev) => ({
        ...prev,
        ...(typeof parsed === "object" && parsed ? parsed : {}),
      }));
    } catch {
      // Ignore malformed localStorage value.
    }
  }, []);

  useEffect(() => {
    if (!isScreenOptionsOpen || typeof window === "undefined") return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsScreenOptionsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isScreenOptionsOpen]);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      apiFetch({ path: "/kreebi-forms/v1/forms" }),
      apiFetch({ path: "/kreebi-forms/v1/submissions" }),
      apiFetch({ path: "/kreebi-forms/v1/settings" }),
    ])
      .then(([formsResult, submissionsResult, settingsResult]) => {
        if (!isMounted) return;

        if (formsResult.status === "fulfilled") {
          const forms = Array.isArray(formsResult.value)
            ? formsResult.value
            : [];
          setFormsCount(forms.length);
        }

        if (submissionsResult.status === "fulfilled") {
          const submissions = Array.isArray(submissionsResult.value)
            ? submissionsResult.value
            : [];
          setSubmissionsCount(submissions.length);
        }

        if (settingsResult.status === "fulfilled") {
          const settings = settingsResult.value || {};
          const integrations = settings.integrations || {};

          const defaults = Object.fromEntries(
            DEFAULT_ENABLED.map((id) => [id, true]),
          );

          const allSettings = { ...defaults, ...integrations };
          const activeIds = Object.entries(allSettings)
            .filter(([, enabled]) => enabled)
            .map(([id]) => id);

          const activeCards = INTEGRATIONS.filter((integration) =>
            activeIds.includes(integration.id),
          );

          setActiveIntegrations(activeCards.length);
          setActiveIntegrationList(activeCards);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredIntegrations = activeIntegrationList.slice(0, 4);

  const handleToggleSection = (sectionKey) => {
    setVisibleSections((prev) => {
      const next = {
        ...prev,
        [sectionKey]: !prev[sectionKey],
      };

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SCREEN_OPTIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore localStorage write failure.
        }
      }

      return next;
    });
  };

  return (
    <div className="krefrm-dashboard-page">
      {visibleSections.welcome && (
        <Welcome
          loading={loading}
          formsCount={formsCount}
          submissionsCount={submissionsCount}
          activeIntegrations={activeIntegrations}
          navigate={navigate}
        />
      )}

      {visibleSections.activeIntegrations && (
        <ActiveIntegration
          loading={loading}
          featuredIntegrations={featuredIntegrations}
          navigate={navigate}
        />
      )}

      {!visibleSections.welcome && !visibleSections.activeIntegrations && (
        <div className="krefrm-dashboard-empty-state">
          {__(
            "All dashboard sections are hidden. Use the bottom-right settings button to enable them.",
            "kreebi-forms",
          )}
        </div>
      )}

      <button
        type="button"
        className="krefrm-dashboard-screen-options-fab"
        aria-haspopup="dialog"
        aria-expanded={isScreenOptionsOpen}
        aria-label={__("Open dashboard settings", "kreebi-forms")}
        onClick={() => setIsScreenOptionsOpen(true)}
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
          aria-hidden="true"
        >
          <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {isScreenOptionsOpen && (
        <div
          className="krefrm-dashboard-screen-options-overlay"
          role="presentation"
          onClick={() => setIsScreenOptionsOpen(false)}
        >
          <div
            className="krefrm-dashboard-screen-options-modal"
            role="dialog"
            aria-modal="true"
            aria-label={__("Dashboard screen options", "kreebi-forms")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="krefrm-dashboard-screen-options-modal-head">
              <h3 className="krefrm-dashboard-screen-options-modal-title">
                {__("Dashboard Options", "kreebi-forms")}
              </h3>
              <button
                type="button"
                className="krefrm-dashboard-screen-options-close"
                aria-label={__("Close settings", "kreebi-forms")}
                onClick={() => setIsScreenOptionsOpen(false)}
              >
                ×
              </button>
            </div>

            <p className="krefrm-dashboard-screen-options-title">
              {__("Choose visible sections", "kreebi-forms")}
            </p>

            <div className="krefrm-dashboard-screen-options-modal-body">
              <label className="krefrm-dashboard-screen-options-item">
                <input
                  type="checkbox"
                  checked={visibleSections.welcome}
                  onChange={() => handleToggleSection("welcome")}
                />
                <span>{__("Welcome", "kreebi-forms")}</span>
              </label>

              <label className="krefrm-dashboard-screen-options-item">
                <input
                  type="checkbox"
                  checked={visibleSections.activeIntegrations}
                  onChange={() => handleToggleSection("activeIntegrations")}
                />
                <span>{__("Active Integrations", "kreebi-forms")}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
