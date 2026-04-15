import { useState, useMemo } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import FormBuilder from "./FormBuilder";

/**
 * Full-screen overlay for editing a form using the visual builder.
 *
 * Props:
 *  form      {Object}   the form object being edited (has title, steps, etc.)
 *  onSave    {Function} called with the form JSON when Save is clicked
 *  onClose   {Function} called when the modal should close
 */
export default function EditFormModal({ form, onSave, onClose }) {
  const [error, setError] = useState("");

  // Build initial data for the builder from the REST API response
  const initialData = useMemo(
    () => ({
      name: form.title,
      description: form.description,
      steps: form.steps,
      styleTemplate: form.styleTemplate,
    }),
    [form],
  );

  const handleSave = async (formJson) => {
    setError("");
    try {
      await onSave(formJson);
    } catch (err) {
      setError(err.message || __("Failed to update form.", "kreebi-forms"));
    }
  };

  return (
    <div className="krefrm-edit-overlay">
      <div className="krefrm-edit-overlay__inner">
        <h2 style={{ margin: "0 0 12px" }}>
          {__("Edit Form", "kreebi-forms") + ": " + form.title}
        </h2>

        {error && (
          <p style={{ color: "#d63638", marginBottom: "12px" }}>{error}</p>
        )}

        <FormBuilder
          initialData={initialData}
          onSave={handleSave}
          onCancel={onClose}
          saveLabel={__("Save Changes", "kreebi-forms")}
        />
      </div>
    </div>
  );
}
