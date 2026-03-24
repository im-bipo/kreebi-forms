import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Button } from "@wordpress/components";
import { INTEGRATIONS, DEFAULT_ENABLED } from "../integrations/definitions";

export default function DashboardPage({ navigate = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [formsCount, setFormsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState(0);

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
          const activeCount = Object.values(allSettings).filter(Boolean).length;
          setActiveIntegrations(activeCount);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredIntegrations = INTEGRATIONS.slice(0, 4);

  return (
    <div className="krefrm-dashboard-page">
      <section className="krefrm-dashboard-welcome">
        <div className="krefrm-dashboard-welcome__content">
          <h2>{__("Welcome to Kreebi Forms", "kreebi-forms")}</h2>
          <p>
            {__(
              "Quickly create forms, review submissions, and connect powerful integrations. Customize confirmations and share embeds in seconds to keep every interaction on brand.",
              "kreebi-forms",
            )}
          </p>
          <p>
            {__(
              "Your active integrations are shown below. Activate or disable integrations from the integrations panel to keep your workflow lean and fast.",
              "kreebi-forms",
            )}
          </p>

          <div className="krefrm-dashboard-quickcards">
            <article className="krefrm-dashboard-quickcard">
              <p>{__("Forms", "kreebi-forms")}</p>
              <strong>{loading ? "..." : formsCount}</strong>
            </article>
            <article className="krefrm-dashboard-quickcard">
              <p>{__("Submissions", "kreebi-forms")}</p>
              <strong>{loading ? "..." : submissionsCount}</strong>
            </article>
            <article className="krefrm-dashboard-quickcard">
              <p>{__("Active Integrations", "kreebi-forms")}</p>
              <strong>{loading ? "..." : activeIntegrations}</strong>
            </article>
          </div>

          <div className="krefrm-dashboard-welcome__actions">
            <Button variant="primary" onClick={() => navigate("form")}>
              {__("All Form", "kreebi-forms")}
            </Button>

            <Button variant="secondary" onClick={() => navigate("submission")}>
              {__("View Submissions", "kreebi-forms")}
            </Button>
          </div>
        </div>

        <div className="krefrm-dashboard-welcome__video-wrap">
          <iframe
            className="krefrm-dashboard-welcome__video"
            src="https://www.youtube.com/embed/aqz-KE-bpKQ"
            title={__("Kreebi Forms video", "kreebi-forms")}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>

      <section className="krefrm-dashboard-integrations">
        <div className="krefrm-dashboard-integrations__head">
          <h3>{__("Active Integrations", "kreebi-forms")}</h3>
          <button
            type="button"
            className="krefrm-dashboard-link"
            onClick={() => navigate("integrations")}
          >
            {__("View More Integrations", "kreebi-forms")}
          </button>
        </div>

        <div
          className="krefrm-dashboard-integrations__grid"
          aria-label="Integrations"
        >
          {featuredIntegrations.map((integration) => (
            <article
              key={integration.id}
              className="krefrm-dashboard-integration-card"
            >
              <span className="krefrm-dashboard-integration-card__icon">
                {integration.icon}
              </span>
              <div className="krefrm-dashboard-integration-card__content">
                <h4>{integration.name}</h4>
                <p>{integration.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="krefrm-dashboard-integrations__footer">
          <button
            type="button"
            className="krefrm-dashboard-link"
            onClick={() => navigate("integrations")}
          >
            {__("View More Integrations", "kreebi-forms")}
          </button>
        </div>
      </section>
    </div>
  );
}
