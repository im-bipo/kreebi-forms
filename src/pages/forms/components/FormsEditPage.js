import { Notice, Spinner } from "@wordpress/components";
import CreateFormView from "../../../components/CreateFormView";

export default function FormsEditPage({
  loading,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  initialData,
  onSubmit,
  onCancel,
  formId,
  initialTab,
  onTabChange,
  defaultEditor,
  onSetDefaultEditor,
  isSavingDefaultEditor,
}) {
  if (loading || !initialData) {
    return (
      <div className="krefrm-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Notice status="error" isDismissible onDismiss={onDismissError}>
          {error}
        </Notice>
      )}
      {success && (
        <Notice status="success" isDismissible onDismiss={onDismissSuccess}>
          {success}
        </Notice>
      )}
      <CreateFormView
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEditing={true}
        formId={formId}
        initialTab={initialTab}
        onTabChange={onTabChange}
        defaultEditor={defaultEditor}
        onSetDefaultEditor={onSetDefaultEditor}
        isSavingDefaultEditor={isSavingDefaultEditor}
      />
    </div>
  );
}
