import QuickBuilder from "../../../components/QuickBuilder";

export default function FormsQuickCreatePage({
  initialData,
  isDefaultEditor,
  onSetDefaultEditor,
  isSettingDefaultEditor,
  onViewForm,
  canViewForm,
  onSave,
  onAdvanced,
  onCancel,
}) {
  return (
    <QuickBuilder
      initialData={initialData}
      isDefaultEditor={isDefaultEditor}
      onSetDefaultEditor={onSetDefaultEditor}
      isSettingDefaultEditor={isSettingDefaultEditor}
      onViewForm={onViewForm}
      canViewForm={canViewForm}
      onSave={onSave}
      onAdvanced={onAdvanced}
      onCancel={onCancel}
    />
  );
}
