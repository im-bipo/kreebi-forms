import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import {
  Button,
  Notice,
  Modal,
  TextareaControl,
  Spinner,
} from "@wordpress/components";

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
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
      setShowModal(false);
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
        <Button variant="primary" onClick={() => setShowModal(true)}>
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

      {/* Create Modal */}
      {showModal && (
        <Modal
          title={__("Create New Form", "kreebi-forms")}
          onRequestClose={() => setShowModal(false)}
          className="krefrm-create-modal"
        >
          <TextareaControl
            label={__("Paste your form JSON below:", "kreebi-forms")}
            value={jsonInput}
            onChange={setJsonInput}
            rows={16}
            className="krefrm-json-textarea"
          />
          <details className="krefrm-sample-json">
            <summary>{__("View sample JSON", "kreebi-forms")}</summary>
            <pre>{sampleJson}</pre>
          </details>
          <div className="krefrm-modal-actions">
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
            <Button variant="tertiary" onClick={() => setShowModal(false)}>
              {__("Cancel", "kreebi-forms")}
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editForm && (
        <Modal
          title={__("Edit Form", "kreebi-forms") + ": " + editForm.title}
          onRequestClose={() => setEditForm(null)}
          className="krefrm-create-modal"
        >
          <TextareaControl
            label={__("Edit form JSON:", "kreebi-forms")}
            value={editJson}
            onChange={setEditJson}
            rows={16}
            className="krefrm-json-textarea"
          />
          <div className="krefrm-modal-actions">
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
            <Button variant="tertiary" onClick={() => setEditForm(null)}>
              {__("Cancel", "kreebi-forms")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
