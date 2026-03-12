import { __ } from "@wordpress/i18n";
import GlobalSettingsPage from "./GlobalSettings";
import FormTab from "./FormTab";

export const config = {
  id: "email-notification",
  name: __("Email Notification", "kreebi-forms"),
  /** Tab label shown inside the form editor */
  tabLabel: __("Email Notification", "kreebi-forms"),
  /** Settings key inside formIntegrations JSON */
  settingsKey: "emailNotification",
};

export { GlobalSettingsPage, FormTab };

export default { config, GlobalSettingsPage, FormTab };
