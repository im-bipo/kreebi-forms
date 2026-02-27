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

  const isFormsActive = route.startsWith("forms");
  const isSubmissionsActive = route === "submission";

  return (
    <nav className="krefrm-tabs">
      <a
        href="#forms"
        className={`krefrm-tab ${isFormsActive ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          navigate("forms");
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
    </nav>
  );
}
