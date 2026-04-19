import { Spinner } from "@wordpress/components";
import CreateFormView from "../../../components/CreateFormView";

export default function FormsEditPage({
  loading,
  initialData,
  onSubmit,
  onCancel,
  formId,
  initialTab,
  onTabChange,
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
      <CreateFormView
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEditing={true}
        formId={formId}
        initialTab={initialTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
