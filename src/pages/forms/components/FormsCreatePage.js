import CreateFormView from "../../../components/CreateFormView";

export default function FormsCreatePage({
  initialData,
  onSubmit,
  onCancel,
  onCreateTabChange,
}) {
  return (
    <CreateFormView
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      formId=""
      onTabChange={onCreateTabChange}
    />
  );
}
