import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button, Notice, TextareaControl } from "@wordpress/components";

const SAMPLE_JSON = JSON.stringify(
  {
    name: "Contact Form",
    description: "A simple contact form",
    steps: [
      {
        name: "Step 1",
        fields: [
          {
            name: "Full Name",
            type: "text",
            placeholder: "Enter your name",
            required: true,
            wrapper: { class: "custom-class", id: "name-wrapper" },
          },
          {
            name: "Email Address",
            type: "email",
            placeholder: "you@example.com",
          },
        ],
      },
      {
        name: "Step 2",
        fields: [
          {
            name: "Phone Number",
            type: "number",
            placeholder: "Enter your number",
          },
        ],
      },
    ],
  },
  null,
  2,
);

/**
 * Full-page create-form view.
 *
 * Props:
 *  onSubmit  {Function} called with the parsed JSON object when form is submitted
 *  onCancel  {Function} called when the user wants to go back
 */
export default function CreateFormView({ onSubmit, onCancel }) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const parsed = JSON.parse(jsonInput);
      await onSubmit(parsed);
      setJsonInput("");
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(__("Invalid JSON. Please check the syntax.", "kreebi-forms"));
      } else {
        setError(err.message || __("Failed to create form.", "kreebi-forms"));
      }
    }
    setCreating(false);
  };

  return (
    <div>
      {error && (
        <Notice status="error" isDismissible onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>{__("Create New Form", "kreebi-forms")}</h2>
        <Button variant="secondary" onClick={onCancel}>
          {__("← Back to Forms", "kreebi-forms")}
        </Button>
      </div>

      <div
        style={{
          maxWidth: "800px",
          background: "#fff",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      >
        <TextareaControl
          label={__("Paste your form JSON below:", "kreebi-forms")}
          value={jsonInput}
          onChange={setJsonInput}
          rows={16}
          className="krefrm-json-textarea"
        />
        <details className="krefrm-sample-json" style={{ marginTop: "15px" }}>
          <summary>{__("View sample JSON", "kreebi-forms")}</summary>
          <pre>{SAMPLE_JSON}</pre>
        </details>
        <div style={{ marginTop: "20px" }}>
          <Button
            variant="primary"
            onClick={handleCreate}
            isBusy={creating}
            disabled={creating}
          >
            {creating
              ? __("Creating…", "kreebi-forms")
              : __("Create Form", "kreebi-forms")}
          </Button>
          <Button
            variant="tertiary"
            onClick={onCancel}
            style={{ marginLeft: "10px" }}
          >
            {__("Cancel", "kreebi-forms")}
          </Button>
        </div>
      </div>
    </div>
  );
}
