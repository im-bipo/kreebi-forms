import { useState, useEffect, useCallback, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Notice, Spinner } from "@wordpress/components";
import FormsTable from "../components/FormsTable";
import FormsCreatePage from "./forms/components/FormsCreatePage";
import FormsEditPage from "./forms/components/FormsEditPage";
import FormsQuickCreatePage from "./forms/components/FormsQuickCreatePage";
import TemplatePickerModal from "./forms/components/TemplatePickerModal";
import DeleteFormModal from "./forms/components/DeleteFormModal";
import {
  getPostIdFromRoute,
  getPublicFormIdFromRoute,
  getTabFromRoute,
  buildEditRouteForCreatedForm,
} from "./forms/route-helpers";

export default function FormsPage({ route = "form", navigate = () => {} }) {
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
  const [savingEditorPreference, setSavingEditorPreference] = useState(false);
  const [lastSavedCreateForm, setLastSavedCreateForm] = useState(null);
  const createTabRef = useRef(null);

  const showCreatePage = route === "form/create";
  const showQuickBuilder = route === "form/quick-builder";
  const showEditPage = route.startsWith("form/edit");

  useEffect(() => {
    if (showCreatePage) {
      createTabRef.current = null;
    }
  }, [showCreatePage]);

  const navigateToCreatedForm = useCallback(
    (createdForm, tabName = null) => {
      const nextRoute = buildEditRouteForCreatedForm(createdForm, tabName);
      navigate(nextRoute);
      // Fallback for rare hash-update race conditions.
      if (window.location.hash.replace(/^#\/?/, "") !== nextRoute) {
        window.location.hash = nextRoute;
      }
      return nextRoute;
    },
    [navigate],
  );

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

  // Load global default editor preference from settings.
  useEffect(() => {
    let isMounted = true;

    apiFetch({ path: "/kreebi-forms/v1/settings" })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setUseAdvanceEditor(data?.defaultEditor === "drag_drop");
      })
      .catch(() => {
        // Keep local fallback value when request fails.
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    const createdForm = await apiFetch({
      path: "/kreebi-forms/v1/forms",
      method: "POST",
      data: parsed,
    });
    setSuccess(__("Form created successfully!", "kreebi-forms"));
    setLastSavedCreateForm({
      formId: createdForm?.form_id || "",
      postId: createdForm?.post_id || null,
    });

    navigateToCreatedForm(createdForm, createTabRef.current);
    fetchForms();
    return createdForm;
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

  const setDefaultEditorPreference = async (editorId) => {
    const nextValue = editorId === "drag_drop";
    const previousValue = useAdvanceEditor;

    if (nextValue === previousValue) {
      return;
    }

    setUseAdvanceEditor(nextValue);
    setSavingEditorPreference(true);

    try {
      await apiFetch({
        path: "/kreebi-forms/v1/settings",
        method: "POST",
        data: {
          defaultEditor: nextValue ? "drag_drop" : "quick",
        },
      });
    } catch (err) {
      setUseAdvanceEditor(previousValue);
      setError(
        err.message ||
          __("Failed to save default editor preference.", "kreebi-forms"),
      );
    } finally {
      setSavingEditorPreference(false);
    }
  };

  // Handle tab changes in the editor
  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    const routeId = currentFormId
      ? `form_id=${encodeURIComponent(currentFormId)}`
      : `id=${editFormId}`;

    if (newTab) {
      navigate(`form/edit/${encodeURIComponent(newTab)}?${routeId}`);
    } else {
      navigate(`form/edit?${routeId}`);
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
      <FormsCreatePage
        initialData={templateData || {}}
        onSubmit={handleCreate}
        onCancel={() => {
          navigate("form");
          setTemplateData(null);
          setLastSavedCreateForm(null);
        }}
        onViewForm={() => navigate("form")}
        canViewForm={Boolean(
          lastSavedCreateForm?.formId || lastSavedCreateForm?.postId,
        )}
        onCreateTabChange={(tabName) => {
          createTabRef.current = tabName;
        }}
        defaultEditor={useAdvanceEditor ? "drag_drop" : "quick"}
        onSetDefaultEditor={setDefaultEditorPreference}
        isSavingDefaultEditor={savingEditorPreference}
      />
    );
  }

  /* ─── Advance form builder (edit) ─── */
  if (showEditPage) {
    return (
      <FormsEditPage
        loading={loading}
        error={error}
        success={success}
        onDismissError={() => setError("")}
        onDismissSuccess={() => setSuccess("")}
        initialData={editFormData}
        onSubmit={handleUpdate}
        onCancel={() => navigate("form")}
        onViewForm={() => navigate("form")}
        canViewForm={Boolean(currentFormId || editFormId)}
        formId={currentFormId}
        initialTab={currentTab}
        onTabChange={handleTabChange}
        defaultEditor={useAdvanceEditor ? "drag_drop" : "quick"}
        onSetDefaultEditor={setDefaultEditorPreference}
        isSavingDefaultEditor={savingEditorPreference}
      />
    );
  }

  /* ─── Quick builder (create) ─── */
  if (showQuickBuilder) {
    return (
      <FormsQuickCreatePage
        initialData={templateData || {}}
        isDefaultEditor={!useAdvanceEditor}
        onSetDefaultEditor={() => setDefaultEditorPreference("quick")}
        isSettingDefaultEditor={savingEditorPreference}
        onViewForm={() => navigate("form")}
        canViewForm={Boolean(
          lastSavedCreateForm?.formId || lastSavedCreateForm?.postId,
        )}
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
          setLastSavedCreateForm({
            formId: res?.form_id || "",
            postId: res?.post_id || null,
          });
          fetchForms();
          navigateToCreatedForm(res, "quick-edit");
          return res;
        }}
        onAdvanced={(jsonData) => {
          setTemplateData(jsonData);
          navigate("form/create");
        }}
        onCancel={() => {
          setTemplateData(null);
          setLastSavedCreateForm(null);
          navigate("form");
        }}
      />
    );
  }

  /* ─── Template picker handler ─── */
  const handlePickTemplate = (tpl) => {
    setShowPicker(false);
    // Respect the user's preference: if Use Advance Editor is enabled,
    // open the advance builder directly; otherwise open the quick builder.
    const data = { ...(tpl.data || {}), name: "" };
    setTemplateData(data);
    setLastSavedCreateForm(null);
    if (useAdvanceEditor) {
      navigate("form/create");
    } else {
      navigate("form/quick-builder");
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
        defaultEditor={useAdvanceEditor ? "drag_drop" : "quick"}
      />

      <TemplatePickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onPickTemplate={handlePickTemplate}
      />

      <DeleteFormModal
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onForceDelete={handleForceDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
