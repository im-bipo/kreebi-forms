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

// Helper to extract ID from route params (e.g., "forms/edit?id=123")
function getFormIdFromRoute(route) {
  const match = route.match(/[?&]id=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export default function FormsPage({ route = "forms", navigate = () => {} }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editFormData, setEditFormData] = useState(null);
  const [editFormId, setEditFormId] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [useAdvanceEditor, setUseAdvanceEditor] = useState(false);

  const showCreatePage = route === "forms/create";
  const showQuickBuilder = route === "forms/quick-builder";
  const showEditPage = route.startsWith("forms/edit?");
  const showQuickEditPage = route.startsWith("forms/quick-edit?");

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
    const formId = getFormIdFromRoute(route);
    if ((showEditPage || showQuickEditPage) && formId) {
      setEditFormId(formId);
      setLoading(true);
      apiFetch({ path: `/kreebi-forms/v1/forms/${formId}` })
        .then((data) => {
          // For Quick Edit, flatten steps to fields for QuickBuilder
          if (showQuickEditPage) {
            const allFields = [];
            if (data.steps && Array.isArray(data.steps)) {
              data.steps.forEach((step) => {
                if (step.fields && Array.isArray(step.fields)) {
                  allFields.push(...step.fields);
                }
              });
            }
            const quickBuilderData = {
              name: data.title || "",
              fields: allFields,
            };
            setEditFormData(quickBuilderData);
          } else {
            // For Advance Edit, use FormBuilder format with steps
            const formBuilderData = {
              name: data.title || "",
              description: data.description || "",
              styleTemplate: data.styleTemplate || "kreebi_style_1",
              steps: data.steps || [],
            };
            setEditFormData(formBuilderData);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || __("Failed to load form.", "kreebi-forms"));
          setLoading(false);
        });
    } else {
      setEditFormData(null);
      setEditFormId(null);
    }
  }, [route, showEditPage, showQuickEditPage]);

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
      path: `/kreebi-forms/v1/forms/${editFormId}`,
      method: "PUT",
      data: parsed,
    });
    setSuccess(__("Form updated successfully!", "kreebi-forms"));
    navigate("forms");
    fetchForms();
  };

  const handleQuickEditUpdate = async (parsed) => {
    // Quick Edit sends flat format { name, fields }
    // Convert to API format if needed
    const formData = {
      name: parsed.name || "",
      fields: parsed.fields || [],
      styleTemplate: "kreebi_style_1", // Use default for quick edit
    };
    await handleUpdate(formData);
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
      <CreateFormView
        initialData={editFormData}
        onSubmit={handleUpdate}
        onCancel={() => navigate("forms")}
        isEditing={true}
      />
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

  /* ─── Quick builder (edit) ─── */
  if (showQuickEditPage) {
    if (loading || !editFormData) {
      return (
        <div className="krefrm-loading">
          <Spinner />
        </div>
      );
    }
    return (
      <QuickBuilder
        initialData={editFormData}
        onSave={handleQuickEditUpdate}
        onAdvanced={(jsonData) => {
          setTemplateData(jsonData);
          navigate(`forms/edit?id=${editFormId}`);
        }}
        onCancel={() => navigate("forms")}
        saveLabel={__("Update Form", "kreebi-forms")}
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
    </div>
  );
}
