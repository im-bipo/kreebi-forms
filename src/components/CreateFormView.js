import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Notice } from "@wordpress/components";
import FormBuilder from "./FormBuilder";
import { DEFAULT_ENABLED } from "../integrations/definitions";

const { restUrl, nonce } = window.krefrmAdmin || {};

/**
 * Integrations enabled by default if no saved settings exist yet (map form).
 */
const DEFAULT_ENABLED_INTEGRATIONS = Object.fromEntries(
  DEFAULT_ENABLED.map((id) => [id, true]),
);

/**
 * Full-page create-form view – now powered by the visual form builder.
 *
 * Props:
 *  onSubmit     {Function} called with the form JSON object when the user saves
 *  onCancel     {Function} called when the user wants to go back
 *  initialData  {Object}   form data (for editing)
 *  isEditing    {Boolean}  whether we're editing an existing form
 *  formId       {string}   the form's internal ID (for log fetching)
 *  initialTab   {string}   initial tab/view to show (e.g., "quick-edit", "email-notification")
 *  onTabChange  {Function} called when user switches tabs; receives (tabName)
 *  defaultEditor {string}  "quick" or "drag_drop"
 *  onSetDefaultEditor {Function} updates global default editor preference
 *  isSavingDefaultEditor {Boolean} true while preference is being saved
 */
export default function CreateFormView({
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false,
  formId = "",
  initialTab = null,
  onTabChange = () => {},
  defaultEditor = "quick",
  onSetDefaultEditor = null,
  isSavingDefaultEditor = false,
}) {
  const [error, setError] = useState("");
  const [enabledIntegrations, setEnabledIntegrations] = useState(
    DEFAULT_ENABLED_INTEGRATIONS,
  );
  const [globalIntegrationSettings, setGlobalIntegrationSettings] = useState(
    {},
  );

  /* Load integration settings so the editor knows which tabs to show */
  useEffect(() => {
    fetch(`${restUrl}/settings`, {
      cache: "no-store",
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        const integrations = data?.integrations || {};
        setEnabledIntegrations({
          ...DEFAULT_ENABLED_INTEGRATIONS,
          ...integrations,
        });
        setGlobalIntegrationSettings({
          emailNotification: data?.emailNotification || {},
        });
      })
      .catch(() => {
        // Keep defaults on failure
      });
  }, []);

  const handleSave = async (formJson) => {
    setError("");
    try {
      await onSubmit(formJson);
    } catch (err) {
      setError(
        err.message ||
          __(
            isEditing ? "Failed to update form." : "Failed to create form.",
            "kreebi-forms",
          ),
      );
      throw err;
    }
  };

  return (
    <div>
      {error && (
        <Notice status="error" isDismissible onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}

      <FormBuilder
        initialData={initialData}
        onSave={handleSave}
        onCancel={onCancel}
        isEditing={isEditing}
        formId={formId}
        saveLabel={
          isEditing
            ? __("Update Form", "kreebi-forms")
            : __("Create Form", "kreebi-forms")
        }
        enabledIntegrations={enabledIntegrations}
        globalIntegrationSettings={globalIntegrationSettings}
        initialTab={initialTab}
        onTabChange={onTabChange}
        defaultEditor={defaultEditor}
        onSetDefaultEditor={onSetDefaultEditor}
        isSavingDefaultEditor={isSavingDefaultEditor}
      />
    </div>
  );
}
