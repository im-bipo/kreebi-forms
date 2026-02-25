import { __ } from "@wordpress/i18n";

/**
 * Page header — title + optional "Create New Form" action button.
 *
 * Props:
 *  route    {string}   current hash route
 *  navigate {Function} hash navigation helper
 */
export default function PageHeader({ route, navigate }) {
  const isFormsActive = route.startsWith("forms");
  const showCreateAction = isFormsActive && !route.includes("create");

  return (
    <div className="krefrm-header">
      <h1 className="wp-heading-inline">
        {__("Kreebi Forms", "kreebi-forms")}
      </h1>

      {showCreateAction && (
        <a
          href="#forms/create"
          className="page-title-action"
          onClick={(e) => {
            e.preventDefault();
            navigate("forms/create");
          }}
        >
          {__("Create New Form", "kreebi-forms")}
        </a>
      )}

      <hr className="wp-header-end" />
    </div>
  );
}
