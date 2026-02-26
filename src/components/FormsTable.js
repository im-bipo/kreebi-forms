import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";

/**
 * Renders the forms list table.
 *
 * Props:
 *  forms        {Array}    array of form objects from the REST API
 *  onEdit       {Function} called with a form object when Edit is clicked
 *  onDelete     {Function} called with post_id when Delete is clicked
 *  onCreateNew  {Function} called when the user wants to create a new form
 */
export default function FormsTable({ forms, onEdit, onDelete, onCreateNew }) {
  if (forms.length === 0) {
    return (
      <div>
        <p>{__("No forms yet. Create your first form!", "kreebi-forms")}</p>
        <Button variant="primary" onClick={onCreateNew}>
          {__("Create now", "kreebi-forms")}
        </Button>
      </div>
    );
  }

  return (
    <table className="widefat fixed striped krefrm-forms-table">
      <thead>
        <tr>
          <th>{__("#", "kreebi-forms")}</th>
          <th>{__("Name", "kreebi-forms")}</th>
          <th>{__("Shortcode", "kreebi-forms")}</th>
          <th>{__("Fields", "kreebi-forms")}</th>
          <th>{__("Date", "kreebi-forms")}</th>
          <th>{__("Actions", "kreebi-forms")}</th>
        </tr>
      </thead>
      <tbody>
        {forms.map((form, index) => (
          <tr key={form.post_id}>
            <td>{index + 1}</td>
            <td>
              <strong>{form.title}</strong>
            </td>
            <td>
              <code>{form.shortcode}</code>
            </td>
            <td>{form.field_count}</td>
            <td>{form.date}</td>
            <td>
              <Button
                variant="secondary"
                isSmall
                onClick={() => onEdit(form)}
                style={{ marginRight: 8 }}
              >
                {__("Edit", "kreebi-forms")}
              </Button>
              <Button
                variant="tertiary"
                isSmall
                isDestructive
                onClick={() => onDelete(form.post_id)}
              >
                {__("Delete", "kreebi-forms")}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
