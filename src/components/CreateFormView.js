import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Notice } from "@wordpress/components";
import FormBuilder from "./FormBuilder";

/**
 * Full-page create-form view – now powered by the visual form builder.
 *
 * Props:
 *  onSubmit  {Function} called with the form JSON object when the user saves
 *  onCancel  {Function} called when the user wants to go back
 */
export default function CreateFormView({ onSubmit, onCancel }) {
  const [error, setError] = useState("");

  const handleSave = async (formJson) => {
    setError("");
    try {
      await onSubmit(formJson);
    } catch (err) {
      setError(err.message || __("Failed to create form.", "kreebi-forms"));
    }
  };

  return (
    <div>
      {error && (
        <Notice status="error" isDismissible onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}

      <FormBuilder
        onSave={handleSave}
        onCancel={onCancel}
        saveLabel={__("Create Form", "kreebi-forms")}
      />
    </div>
  );
}
