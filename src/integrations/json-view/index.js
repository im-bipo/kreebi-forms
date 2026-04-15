import { __ } from "@wordpress/i18n";
import GlobalSettingsPage from "./GlobalSettings";

export const config = {
  id: "json-view",
  name: __("JSON View", "kreebi-forms"),
  /**
   * JSON View does not add an integration settings panel inside the form
   * editor. Instead, enabling it makes the "JSON View" tab visible in the
   * editor toolbar (which opens the existing raw JSON editor).
   */
  tabLabel: __("JSON View", "kreebi-forms"),
  /** No form-level settings key – JSON View has nothing to override. */
  settingsKey: null,
  /**
   * Marks this integration as using the built-in JSON editor tab rather
   * than an integration settings panel.
   */
  usesJsonEditorTab: true,
};

export { GlobalSettingsPage };

/** JSON View has no separate FormTab – the editor tab IS the JSON editor. */
export const FormTab = null;

export default { config, GlobalSettingsPage, FormTab };
