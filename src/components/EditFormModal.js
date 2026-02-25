import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, TextareaControl } from "@wordpress/components";

/**
 * Full-screen overlay modal for editing a form's JSON.
 *
 * Props:
 *  form      {Object}   the form object being edited (has title, fields, etc.)
 *  onSave    {Function} called with the parsed JSON object when Save is clicked
 *  onClose   {Function} called when the modal should close
 */
export default function EditFormModal({ form, onSave, onClose }) {
  const initialJson = JSON.stringify(
    { name: form.title, description: form.description, fields: form.fields },
    null,
    2,
  );

  const [editJson, setEditJson] = useState(initialJson);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const parsed = JSON.parse(editJson);
      await onSave(parsed);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(__("Invalid JSON. Please check the syntax.", "kreebi-forms"));
      } else {
        setError(err.message || __("Failed to update form.", "kreebi-forms"));
      }
    }
    setSaving(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "8px",
          maxWidth: "700px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2>{__("Edit Form", "kreebi-forms") + ": " + form.title}</h2>

        {error && (
          <p style={{ color: "#d63638", marginBottom: "12px" }}>{error}</p>
        )}

        <TextareaControl
          label={__("Edit form JSON:", "kreebi-forms")}
          value={editJson}
          onChange={setEditJson}
          rows={16}
          className="krefrm-json-textarea"
        />

        <div style={{ marginTop: "20px" }}>
          <Button
            variant="primary"
            onClick={handleSave}
            isBusy={saving}
            disabled={saving}
          >
            {saving
              ? __("Saving…", "kreebi-forms")
              : __("Save Changes", "kreebi-forms")}
          </Button>
          <Button
            variant="tertiary"
            onClick={onClose}
            style={{ marginLeft: "10px" }}
          >
            {__("Cancel", "kreebi-forms")}
          </Button>
        </div>
      </div>
    </div>
  );
}
