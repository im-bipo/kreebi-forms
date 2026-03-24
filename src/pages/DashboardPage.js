import { useEffect, useState } from "@wordpress/element";
import apiFetch from "@wordpress/api-fetch";
import { INTEGRATIONS, DEFAULT_ENABLED } from "../integrations/definitions";
import Welcome from "./DashboardPage/welcome";
import ActiveIntegration from "./DashboardPage/active-integration";

export default function DashboardPage({ navigate = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [formsCount, setFormsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState(0);
  const [activeIntegrationList, setActiveIntegrationList] = useState([]);

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

  return (
    <div className="krefrm-dashboard-page">
      <Welcome
        loading={loading}
        formsCount={formsCount}
        submissionsCount={submissionsCount}
        activeIntegrations={activeIntegrations}
        navigate={navigate}
      />

      <ActiveIntegration
        loading={loading}
        featuredIntegrations={featuredIntegrations}
        navigate={navigate}
      />
    </div>
  );
}
