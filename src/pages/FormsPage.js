import { useState, useEffect, useCallback, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import { Spinner } from "@wordpress/components";
import FormsTable from "../components/FormsTable";
import FormsCreatePage from "./forms/components/FormsCreatePage";
import FormsEditPage from "./forms/components/FormsEditPage";
import TemplatePickerModal from "./forms/components/TemplatePickerModal";
import DeleteFormModal from "./forms/components/DeleteFormModal";
import {
  getPostIdFromRoute,
  getPublicFormIdFromRoute,
  getTabFromRoute,
  buildEditRouteForCreatedForm,
} from "./forms/route-helpers";
import { useToast } from "../components/Toast";

export default function FormsPage({ route = "form", navigate = () => {} }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editFormId, setEditFormId] = useState(null);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [currentTab, setCurrentTab] = useState(null); // Track active tab in editor
  const [templateData, setTemplateData] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const createTabRef = useRef(null);
  const toast = useToast();

  const showCreatePage = route === "form/create";
  const showLegacyQuickBuilderRoute = route === "form/quick-builder";
  const showEditPage = route.startsWith("form/edit");

  useEffect(() => {
    if (!showLegacyQuickBuilderRoute) {
      return;
    }

    navigate("form/create");
    if (window.location.hash.replace(/^#\/?/, "") !== "form/create") {
      window.location.hash = "form/create";
    }
  }, [navigate, showLegacyQuickBuilderRoute]);

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

  const showFormSavedToast = useCallback(
    ({ mode = "created", message = "" } = {}) => {
      const fallbackMessage =
        mode === "updated"
          ? __("Your form is updated.", "kreebi-forms")
          : __("Your form is created.", "kreebi-forms");

      toast.success(message || fallbackMessage, {
        duration: 5000,
        actions: [
          {
            label: __("View Form", "kreebi-forms"),
            onClick: () => navigate("form"),
            variant: "primary",
          },
        ],
      });
    },
    [navigate, toast],
  );

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch({ path: "/kreebi-forms/v1/forms" });
      setForms(data);
    } catch (err) {
      toast.error(err.message || __("Failed to load forms.", "kreebi-forms"));
    }
    setLoading(false);
  }, [toast]);

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
            styleTemplate: data.styleTemplate || "style-polished",
            steps: data.steps || [],
            formIntegrations: data.formIntegrations || {},
          };
          setEditFormData(formBuilderData);
          setCurrentFormId(data.form_id || "");
          setLoading(false);
        })
        .catch((err) => {
          toast.error(
            err.message || __("Failed to load form.", "kreebi-forms"),
          );
          setLoading(false);
          window.location.hash = "form";
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

    navigateToCreatedForm(createdForm, createTabRef.current);
    showFormSavedToast({ mode: "created" });
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
      toast.success(__("Form deleted.", "kreebi-forms"));
      fetchForms();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || __("Failed to delete form.", "kreebi-forms"));
    }
    setIsDeleting(false);
  };

  const handleUpdate = async (parsed) => {
    await apiFetch({
      path: `/kreebi-forms/v1/forms/${editFormId}`,
      method: "PUT",
      data: parsed,
    });
    showFormSavedToast({ mode: "updated" });
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
        }}
        onCreateTabChange={(tabName) => {
          createTabRef.current = tabName;
        }}
      />
    );
  }

  /* ─── Advance form builder (edit) ─── */
  if (showEditPage) {
    return (
      <FormsEditPage
        loading={loading}
        initialData={editFormData}
        onSubmit={handleUpdate}
        onCancel={() => navigate("form")}
        formId={currentFormId}
        initialTab={currentTab}
        onTabChange={handleTabChange}
      />
    );
  }

  /* ─── Template picker handler ─── */
  const handlePickTemplate = (tpl) => {
    setShowPicker(false);
    const data = { ...(tpl.data || {}), name: "" };
    setTemplateData(data);
    navigate("form/create");
  };

  return (
    <div>
      <FormsTable
        forms={forms}
        navigate={navigate}
        onDelete={handleDelete}
        onCreateNew={() => setShowPicker(true)}
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
