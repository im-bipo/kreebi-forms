import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import {
  Button,
  Notice,
  TextareaControl,
  Spinner,
} from "@wordpress/components";

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editForm, setEditForm] = useState(null);
  const [editJson, setEditJson] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch({ path: "/kreebi-forms/v1/forms" });
      setForms(data);
    } catch (err) {
      setError(err.message || __("Failed to load forms.", "kreebi-forms"));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const parsed = JSON.parse(jsonInput);
      await apiFetch({
        path: "/kreebi-forms/v1/forms",
        method: "POST",
        data: parsed,
      });
      setSuccess(__("Form created successfully!", "kreebi-forms"));
      setShowCreatePage(false);
      setJsonInput("");
      fetchForms();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(__("Invalid JSON. Please check the syntax.", "kreebi-forms"));
      } else {
        setError(err.message || __("Failed to create form.", "kreebi-forms"));
      }
    }
    setCreating(false);
  };

  const handleDelete = async (postId) => {
    if (
      !window.confirm(
        __("Are you sure you want to delete this form?", "kreebi-forms"),
      )
    ) {
      return;
    }
    try {
      await apiFetch({
        path: `/kreebi-forms/v1/forms/${postId}`,
        method: "DELETE",
      });
      setSuccess(__("Form deleted.", "kreebi-forms"));
      fetchForms();
    } catch (err) {
      setError(err.message || __("Failed to delete form.", "kreebi-forms"));
    }
  };

  const openEdit = (form) => {
    setEditForm(form);
    const data = {
      name: form.title,
      description: form.description,
      fields: form.fields,
    };
    setEditJson(JSON.stringify(data, null, 2));
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    try {
      const parsed = JSON.parse(editJson);
      await apiFetch({
        path: `/kreebi-forms/v1/forms/${editForm.post_id}`,
        method: "PUT",
        data: parsed,
      });
      setSuccess(__("Form updated successfully!", "kreebi-forms"));
      setEditForm(null);
      setEditJson("");
      fetchForms();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(__("Invalid JSON. Please check the syntax.", "kreebi-forms"));
      } else {
        setError(err.message || __("Failed to update form.", "kreebi-forms"));
      }
    }
    setSaving(false);
  };

  const sampleJson = JSON.stringify(
    {
      name: "Contact Form",
      description: "A simple contact form",
      fields: [
        { name: "Full Name", type: "text", placeholder: "Enter your name" },
        {
          name: "Email Address",
          type: "email",
          placeholder: "you@example.com",
        },
      ],
    },
    null,
    2,
  );

  if (loading) {
    return (
      <div className="krefrm-loading">
        <Spinner />
      </div>
    );
  }

  if (showCreatePage) {
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
          <Button variant="secondary" onClick={() => setShowCreatePage(false)}>
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
            <pre>{sampleJson}</pre>
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
              onClick={() => setShowCreatePage(false)}
              style={{ marginLeft: "10px" }}
            >
              {__("Cancel", "kreebi-forms")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Notice status="error" isDismissible onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}
      {success && (
        <Notice status="success" isDismissible onDismiss={() => setSuccess("")}>
          {success}
        </Notice>
      )}

      <div className="krefrm-toolbar">
        <Button variant="primary" onClick={() => setShowCreatePage(true)}>
          {__("Create New Form", "kreebi-forms")}
        </Button>
      </div>

      {forms.length === 0 ? (
        <p>{__("No forms yet. Create your first form!", "kreebi-forms")}</p>
      ) : (
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
                    onClick={() => openEdit(form)}
                    style={{ marginRight: 8 }}
                  >
                    {__("Edit", "kreebi-forms")}
                  </Button>
                  <Button
                    variant="tertiary"
                    isSmall
                    isDestructive
                    onClick={() => handleDelete(form.post_id)}
                  >
                    {__("Delete", "kreebi-forms")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit via modal */}
      {editForm && (
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
            <h2>{__("Edit Form", "kreebi-forms") + ": " + editForm.title}</h2>
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
                onClick={handleUpdate}
                isBusy={saving}
                disabled={saving}
              >
                {saving
                  ? __("Saving…", "kreebi-forms")
                  : __("Save Changes", "kreebi-forms")}
              </Button>
              <Button
                variant="tertiary"
                onClick={() => setEditForm(null)}
                style={{ marginLeft: "10px" }}
              >
                {__("Cancel", "kreebi-forms")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
