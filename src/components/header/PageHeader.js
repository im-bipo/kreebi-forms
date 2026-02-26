import { __ } from "@wordpress/i18n";

/**
 * Page header — title + optional "Create New Form" action button.
 *
 * Props:
 *  route    {string}   current hash route
 *  navigate {Function} hash navigation helper
 */
export default function PageHeader({ route, navigate }) {
  return (
    <div className="krefrm-header">
      <h1 className="wp-heading-inline">
        {__("Kreebi Forms", "kreebi-forms")}
      </h1>

      <hr className="wp-header-end" />
    </div>
  );
}
