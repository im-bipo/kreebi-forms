import { __ } from "@wordpress/i18n";
import GlobalSettingsPage from "./GlobalSettings";

export const config = {
  id: "captcha",
  name: __("Captcha Protection", "kreebi-forms"),
  tabLabel: __("Captcha", "kreebi-forms"),
  settingsKey: "captcha",
};

export { GlobalSettingsPage };

export const FormTab = null;

export default { config, GlobalSettingsPage, FormTab };
