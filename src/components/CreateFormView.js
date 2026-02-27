import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Notice } from "@wordpress/components";
import FormBuilder from "./FormBuilder";

/**
 * Full-page create-form view – now powered by the visual form builder.
 *
 * Props:
 *  onSubmit    {Function} called with the form JSON object when the user saves
 *  onCancel    {Function} called when the user wants to go back
 *  initialData {Object}   form data (for editing)
 *  isEditing   {Boolean}  whether we're editing an existing form
 */
export default function CreateFormView({
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false,
}) {
  const [error, setError] = useState("");

  const handleSave = async (formJson) => {
    setError("");
    try {
      await onSubmit(formJson);
    } catch (err) {
      setError(
        err.message ||
          __(
            isEditing ? "Failed to update form." : "Failed to create form.",
            "kreebi-forms",
          ),
      );
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
        initialData={initialData}
        onSave={handleSave}
        onCancel={onCancel}
        saveLabel={
          isEditing
            ? __("Update Form", "kreebi-forms")
            : __("Create Form", "kreebi-forms")
        }
      />
    </div>
  );
}
