import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

export default function Welcome({
  loading,
  formsCount,
  submissionsCount,
  activeIntegrations,
  navigate,
}) {
  return (
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
  );
}
