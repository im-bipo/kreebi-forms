import QuickBuilder from "../../../components/QuickBuilder";

export default function FormsQuickCreatePage({
  initialData,
  isDefaultEditor,
  onSetDefaultEditor,
  isSettingDefaultEditor,
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
      onSave={onSave}
      onAdvanced={onAdvanced}
      onCancel={onCancel}
    />
  );
}
