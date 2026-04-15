import CreateFormView from "../../../components/CreateFormView";

export default function FormsCreatePage({
  initialData,
  onSubmit,
  onCancel,
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
      formId=""
      onTabChange={onCreateTabChange}
      defaultEditor={defaultEditor}
      onSetDefaultEditor={onSetDefaultEditor}
      isSavingDefaultEditor={isSavingDefaultEditor}
    />
  );
}
