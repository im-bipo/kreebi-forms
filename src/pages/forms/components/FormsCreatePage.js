import CreateFormView from "../../../components/CreateFormView";

export default function FormsCreatePage({
  initialData,
  onSubmit,
  onCancel,
  onViewForm,
  canViewForm,
  onCreateTabChange,
  defaultEditor,
  onSetDefaultEditor,
  isSavingDefaultEditor,
}) {
  return (
    <CreateFormView
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      onViewForm={onViewForm}
      canViewForm={canViewForm}
      formId=""
      onTabChange={onCreateTabChange}
      defaultEditor={defaultEditor}
      onSetDefaultEditor={onSetDefaultEditor}
      isSavingDefaultEditor={isSavingDefaultEditor}
    />
  );
}
