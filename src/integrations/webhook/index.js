import { __ } from "@wordpress/i18n";
import GlobalSettingsPage from "./GlobalSettings";
import FormTab from "./FormTab";

export const config = {
  id: "webhook",
  name: __("Webhook & Zapier", "kreebi-forms"),
  tabLabel: __("Webhook", "kreebi-forms"),
  settingsKey: "webhook",
};

export { GlobalSettingsPage, FormTab };

export default { config, GlobalSettingsPage, FormTab };
