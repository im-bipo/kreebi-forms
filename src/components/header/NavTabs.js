import { __ } from "@wordpress/i18n";

/**
 * Tab navigation bar — Forms / Submissions.
 *
 * Props:
 *  route    {string}   current hash route
 *  navigate {Function} hash navigation helper
 */
export default function NavTabs({ route, navigate }) {
  // Don't show tabs on upgrade page
  if (route === "upgrade-to-pro") {
    return null;
  }

  const isFormsActive = route.startsWith("form");
  const isSubmissionsActive = route === "submission";
  const isStyleTemplatesActive = route.startsWith("style-templates");
  const isIntegrationsActive = route.startsWith("integrations");

  return (
    <nav className="krefrm-tabs">
      <a
        href="#form"
        className={`krefrm-tab ${isFormsActive ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          navigate("form");
        }}
      >
        {__("Forms", "kreebi-forms")}
      </a>
      <a
        href="#submission"
        className={`krefrm-tab ${isSubmissionsActive ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          navigate("submission");
        }}
      >
        {__("Submissions", "kreebi-forms")}
      </a>
      <a
        href="#style-templates"
        className={`krefrm-tab ${isStyleTemplatesActive ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          navigate("style-templates");
        }}
      >
        {__("Style Templates", "kreebi-forms")}
      </a>
      <a
        href="#integrations"
        className={`krefrm-tab ${isIntegrationsActive ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          navigate("integrations");
        }}
      >
        {__("Integrations", "kreebi-forms")}
      </a>
    </nav>
  );
}
