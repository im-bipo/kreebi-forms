import { __ } from "@wordpress/i18n";

/**
 * Page header — logo, title, tagline, and nav tabs unified.
 *
 * Props:
 *  route    {string}   current hash route
 *  navigate {Function} hash navigation helper
 */
export default function PageHeader({ route, navigate }) {
  const pluginUrl = (window.krefrmAdmin && window.krefrmAdmin.pluginUrl) || "";

  // Don't show tabs on upgrade page
  const showTabs = route !== "upgrade-to-pro";
  const isFormsActive = route.startsWith("forms");
  const isSubmissionsActive = route.startsWith("submission");
  const isStyleTemplatesActive = route === "style-templates";
  const isIntegrationsActive = route.startsWith("integrations");

  return (
    <div className="krefrm-header">
      <div className="krefrm-header__inner">
        <div className="krefrm-header__left">
          <img
            src={`${pluginUrl}assets/photos/kreebi-forms.png`}
            alt={__("Kreebi Forms", "kreebi-forms")}
            className="krefrm-header__logo"
          />

          <div className="krefrm-header__titles">
            <h1 className="krefrm-header__title">
              {__("Kreebi Forms", "kreebi-forms")}
            </h1>
            <p className="krefrm-header__subtitle">
              {__("Powerful forms, made simple.", "kreebi-forms")}
            </p>
          </div>
        </div>

        {showTabs && (
          <nav className="krefrm-header__nav">
            <a
              href="#forms"
              className={`krefrm-header__nav-link ${
                isFormsActive ? "is-active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("forms");
              }}
            >
              {__("Forms", "kreebi-forms")}
            </a>
            <a
              href="#submission"
              className={`krefrm-header__nav-link ${
                isSubmissionsActive ? "is-active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("submission");
              }}
            >
              {__("Submissions", "kreebi-forms")}
            </a>
            <a
              href="#style-templates"
              className={`krefrm-header__nav-link ${
                isStyleTemplatesActive ? "is-active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("style-templates");
              }}
            >
              {__("Style Templates", "kreebi-forms")}
            </a>
            <a
              href="#integrations"
              className={`krefrm-header__nav-link ${
                isIntegrationsActive ? "is-active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("integrations");
              }}
            >
              {__("Integrations", "kreebi-forms")}
            </a>
          </nav>
        )}
      </div>

      <hr className="wp-header-end" />
    </div>
  );
}
