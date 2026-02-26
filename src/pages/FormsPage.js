import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Notice, Spinner } from "@wordpress/components";
import FormsTable from "../components/FormsTable";
import CreateFormView from "../components/CreateFormView";
import EditFormModal from "../components/EditFormModal";

export default function FormsPage({ route = "forms", navigate = () => {} }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editForm, setEditForm] = useState(null);

  const showCreatePage = route === "forms/create";

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

  const handleCreate = async (parsed) => {
    await apiFetch({
      path: "/kreebi-forms/v1/forms",
      method: "POST",
      data: parsed,
    });
    setSuccess(__("Form created successfully!", "kreebi-forms"));
    navigate("forms");
    fetchForms();
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

  const handleUpdate = async (parsed) => {
    await apiFetch({
      path: `/kreebi-forms/v1/forms/${editForm.post_id}`,
      method: "PUT",
      data: parsed,
    });
    setSuccess(__("Form updated successfully!", "kreebi-forms"));
    setEditForm(null);
    fetchForms();
  };

  if (loading) {
    return (
      <div className="krefrm-loading">
        <Spinner />
      </div>
    );
  }

  if (showCreatePage) {
    return (
      <CreateFormView
        onSubmit={handleCreate}
        onCancel={() => navigate("forms")}
      />
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

      <FormsTable
        forms={forms}
        onEdit={setEditForm}
        onDelete={handleDelete}
        onCreateNew={() => navigate("forms/create")}
      />

      {editForm && (
        <EditFormModal
          form={editForm}
          onSave={handleUpdate}
          onClose={() => setEditForm(null)}
        />
      )}
    </div>
  );
}
