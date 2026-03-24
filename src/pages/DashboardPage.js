import { useEffect, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Button, Spinner } from "@wordpress/components";

export default function DashboardPage({ navigate = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [formsCount, setFormsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      apiFetch({ path: "/kreebi-forms/v1/forms" }),
      apiFetch({ path: "/kreebi-forms/v1/submissions" }),
    ])
      .then(([formsResult, submissionsResult]) => {
        if (!isMounted) return;

        if (formsResult.status === "fulfilled") {
          const forms = Array.isArray(formsResult.value) ? formsResult.value : [];
          setFormsCount(forms.length);
        }

        if (submissionsResult.status === "fulfilled") {
          const submissions = Array.isArray(submissionsResult.value)
            ? submissionsResult.value
            : [];
          setSubmissionsCount(submissions.length);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="krefrm-dashboard-page">
      <section className="krefrm-dashboard-hero">
        <div>
          <h2>{__("Dashboard", "kreebi-forms")}</h2>
          <p>
            {__(
              "See your form activity at a glance and jump into key actions.",
              "kreebi-forms",
            )}
          </p>
        </div>

        <Button variant="primary" onClick={() => navigate("form/create")}>
          {__("Create New Form", "kreebi-forms")}
        </Button>
      </section>

      {loading ? (
        <div className="krefrm-loading">
          <Spinner />
        </div>
      ) : (
        <section className="krefrm-dashboard-stats" aria-label="Dashboard stats">
          <article className="krefrm-dashboard-stat-card">
            <h3>{__("Forms", "kreebi-forms")}</h3>
            <strong>{formsCount}</strong>
            <Button variant="secondary" onClick={() => navigate("form")}>
              {__("Manage Forms", "kreebi-forms")}
            </Button>
          </article>

          <article className="krefrm-dashboard-stat-card">
            <h3>{__("Submissions", "kreebi-forms")}</h3>
            <strong>{submissionsCount}</strong>
            <Button variant="secondary" onClick={() => navigate("submission")}>
              {__("View Submissions", "kreebi-forms")}
            </Button>
          </article>

          <article className="krefrm-dashboard-stat-card">
            <h3>{__("Integrations", "kreebi-forms")}</h3>
            <strong>{__("Settings", "kreebi-forms")}</strong>
            <Button
              variant="secondary"
              onClick={() => navigate("integrations")}
            >
              {__("Configure", "kreebi-forms")}
            </Button>
          </article>
        </section>
      )}
    </div>
  );
}
