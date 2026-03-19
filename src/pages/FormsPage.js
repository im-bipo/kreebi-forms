import { useState, useEffect, useCallback } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import {
  Notice,
  Spinner,
  Modal,
  Button,
  ToggleControl,
} from "@wordpress/components";
import FormsTable from "../components/FormsTable";
import CreateFormView from "../components/CreateFormView";
import QuickBuilder from "../components/QuickBuilder";

// ─── Templates ───
const TEMPLATES = [
  {
    key: "contact",
    label: __("Contact Form", "kreebi-forms"),
    icon: "📧",
    data: {
      name: "Contact Form",
      fields: [
        {
          name: "Name",
          type: "text",
          placeholder: "Your name",
          required: true,
        },
        {
          name: "Email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "Message",
          type: "text",
          placeholder: "Write your message…",
          required: false,
        },
      ],
    },
  },
  {
    key: "rsvp",
    label: __("RSVP Form", "kreebi-forms"),
    icon: "🎉",
    data: {
      name: "RSVP Form",
      fields: [
        {
          name: "Full Name",
          type: "text",
          placeholder: "Your full name",
          required: true,
        },
        {
          name: "Email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "Will you attend?",
          type: "select",
          options: ["Yes", "No", "Maybe"],
          required: true,
        },
      ],
    },
  },
  {
    key: "event",
    label: __("Event Registration", "kreebi-forms"),
    icon: "📅",
    data: {
      name: "Event Registration",
      fields: [
        {
          name: "Name",
          type: "text",
          placeholder: "Full name",
          required: true,
        },
        {
          name: "Email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "Number of Guests",
          type: "number",
          placeholder: "1",
          required: false,
        },
      ],
    },
  },
  {
    key: "blank",
    label: __("Blank Form", "kreebi-forms"),
    icon: "＋",
    data: { name: "Kreebi Form", fields: [] },
  },
];

// Legacy helper: extract post ID from route params (e.g., "forms/edit?id=123")
function getPostIdFromRoute(route) {
  const match = route.match(/[?&]id=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Preferred helper: extract public form ID (e.g., "forms/edit?form_id=001")
function getPublicFormIdFromRoute(route) {
  const match = route.match(/[?&]form_id=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Extract tab from path segment (e.g., "forms/edit/email-notification?form_id=001").
// Backward-compatible with legacy "tab" query parameter.
function getTabFromRoute(route) {
  const pathMatch = route.match(/^forms\/edit\/([^?]+)/);
  if (pathMatch) {
    return decodeURIComponent(pathMatch[1]);
  }

  const queryMatch = route.match(/[?&]tab=([^&]+)/);
  return queryMatch ? decodeURIComponent(queryMatch[1]) : null;
}

export default function FormsPage({ route = "forms", navigate = () => {} }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editFormId, setEditFormId] = useState(null);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [currentTab, setCurrentTab] = useState(null); // Track active tab in editor
  const [templateData, setTemplateData] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [useAdvanceEditor, setUseAdvanceEditor] = useState(false);

  const showCreatePage = route === "forms/create";
  const showQuickBuilder = route === "forms/quick-builder";
  const showEditPage = route.startsWith("forms/edit");

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

  // Load form data when in edit mode
  useEffect(() => {
    const postIdFromRoute = getPostIdFromRoute(route);
    const publicFormId = getPublicFormIdFromRoute(route);
    const tabName = getTabFromRoute(route);

    let targetPostId = postIdFromRoute;
    if (!targetPostId && publicFormId) {
      const matchedForm = forms.find(
        (item) => String(item.form_id || "") === String(publicFormId),
      );
      targetPostId = matchedForm ? matchedForm.post_id : null;
    }

    if (showEditPage && targetPostId) {
      setEditFormId(targetPostId);
      if (publicFormId) {
        setCurrentFormId(publicFormId);
      }
      setCurrentTab(tabName); // Set the tab from URL (or null for default visual editor)
      setLoading(true);
      apiFetch({ path: `/kreebi-forms/v1/forms/${targetPostId}` })
        .then((data) => {
          // Use FormBuilder format with steps for all edit modes
          // The FormBuilder/CreateFormView will handle different views based on the tab
          const formBuilderData = {
            name: data.title || "",
            description: data.description || "",
            styleTemplate: data.styleTemplate || "kreebi_style_1",
            steps: data.steps || [],
            formIntegrations: data.formIntegrations || {},
          };
          setEditFormData(formBuilderData);
          setCurrentFormId(data.form_id || "");
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || __("Failed to load form.", "kreebi-forms"));
          setLoading(false);
        });
    } else {
      setEditFormData(null);
      setEditFormId(null);
      setCurrentFormId(null);
      setCurrentTab(null);
    }
  }, [route, showEditPage, forms]);

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

  const handleDelete = (postId) => {
    const form = forms.find((f) => f.post_id === postId);
    setDeleteTarget({
      id: postId,
      title: form ? form.title : "",
    });
  };

  const handleForceDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await apiFetch({
        path: `/kreebi-forms/v1/forms/${deleteTarget.id}?force=1`,
        method: "DELETE",
      });
      setSuccess(__("Form deleted.", "kreebi-forms"));
      fetchForms();
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || __("Failed to delete form.", "kreebi-forms"));
    }
    setIsDeleting(false);
  };

  const handleUpdate = async (parsed) => {
    await apiFetch({
      path: `/kreebi-forms/v1/forms/${editFormId}`,
      method: "PUT",
      data: parsed,
    });
    setSuccess(__("Form updated successfully!", "kreebi-forms"));
    // Keep the editor open after saving; do not navigate back to the list.
    fetchForms();
  };

  // Handle tab changes in the editor
  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    const routeId = currentFormId
      ? `form_id=${encodeURIComponent(currentFormId)}`
      : `id=${editFormId}`;

    if (newTab) {
      navigate(`forms/edit/${encodeURIComponent(newTab)}?${routeId}`);
    } else {
      navigate(`forms/edit?${routeId}`);
    }
  };

  if (loading) {
    return (
      <div className="krefrm-loading">
        <Spinner />
      </div>
    );
  }

  /* ─── Advance form builder (create) ─── */
  if (showCreatePage) {
    return (
      <CreateFormView
        initialData={templateData || {}}
        onSubmit={handleCreate}
        onCancel={() => {
          navigate("forms");
          setTemplateData(null);
        }}
        formId=""
      />
    );
  }

  /* ─── Advance form builder (edit) ─── */
  if (showEditPage) {
    if (loading || !editFormData) {
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
          <Notice
            status="success"
            isDismissible
            onDismiss={() => setSuccess("")}
          >
            {success}
          </Notice>
        )}
        <CreateFormView
          initialData={editFormData}
          onSubmit={handleUpdate}
          onCancel={() => navigate("forms")}
          isEditing={true}
          formId={currentFormId}
          initialTab={currentTab}
          onTabChange={handleTabChange}
        />
      </div>
    );
  }

  /* ─── Quick builder (create) ─── */
  if (showQuickBuilder) {
    return (
      <QuickBuilder
        initialData={templateData || {}}
        onSave={async (parsed) => {
          const res = await apiFetch({
            path: "/kreebi-forms/v1/forms",
            method: "POST",
            data: parsed,
          });
          // Auto-copy shortcode
          const sc =
            res && res.shortcode
              ? res.shortcode
              : `[kreebi_form id="${res && res.post_id ? res.post_id : ""}"]`;
          try {
            await navigator.clipboard.writeText(sc);
          } catch (_) {
            /* no-op */
          }
          setSuccess(
            __("Form created! Shortcode copied to clipboard.", "kreebi-forms"),
          );
          setTemplateData(null);
          navigate("forms");
          fetchForms();
        }}
        onAdvanced={(jsonData) => {
          setTemplateData(jsonData);
          navigate("forms/create");
        }}
        onCancel={() => {
          setTemplateData(null);
          navigate("forms");
        }}
      />
    );
  }

  /* ─── Template picker handler ─── */
  const handlePickTemplate = (tpl) => {
    setShowPicker(false);
    // Respect the user's preference: if Use Advance Editor is enabled,
    // open the advance builder directly; otherwise open the quick builder.
    const data = tpl.data || {};
    setTemplateData(Object.keys(data).length ? data : {});
    if (useAdvanceEditor) {
      navigate("forms/create");
    } else {
      navigate("forms/quick-builder");
    }
  };

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
        navigate={navigate}
        onDelete={handleDelete}
        onCreateNew={() => setShowPicker(true)}
      />

      {showPicker && (
        <Modal
          title={__("Choose a template", "kreebi-forms")}
          onRequestClose={() => setShowPicker(false)}
          className="krefrm-picker-modal"
        >
          <p className="krefrm-picker-subtitle">
            {__(
              "Pick a template to start quickly, or create a blank form.",
              "kreebi-forms",
            )}
          </p>
          <div className="krefrm-picker-grid">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                className="krefrm-picker-card"
                onClick={() => handlePickTemplate(tpl)}
              >
                <span className="krefrm-picker-card__icon">{tpl.icon}</span>
                <span className="krefrm-picker-card__label">{tpl.label}</span>
              </button>
            ))}
          </div>
          <div className="krefrm-picker-divider" aria-hidden="true" />
          <div style={{ margin: "12px 0 6px" }}>
            <ToggleControl
              label={__("Use Advance Editor", "kreebi-forms")}
              checked={useAdvanceEditor}
              onChange={(v) => setUseAdvanceEditor(!!v)}
            />
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title={__("Delete form", "kreebi-forms")}
          onRequestClose={() => setDeleteTarget(null)}
        >
          <p>
            {__(
              "Deleting this form will permanently remove the form and all of its submissions. This cannot be undone.",
              "kreebi-forms",
            )}
          </p>
          <div className="krefrm-modal-actions">
            <Button onClick={() => setDeleteTarget(null)}>
              {__("Cancel", "kreebi-forms")}
            </Button>
            <Button
              variant="primary"
              isDestructive
              isBusy={isDeleting}
              onClick={handleForceDelete}
            >
              {__("Force Delete", "kreebi-forms")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
