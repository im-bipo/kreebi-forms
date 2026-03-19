/**
 * Integration Registry
 *
 * Central map of integration ID → module.
 * Each module exports: { config, GlobalSettingsPage, FormTab }
 *
 * Only import integrations that are loaded here – components in FormBuilder
 * and IntegrationsPage use this registry so that all integration logic lives
 * in its own folder under src/integrations/.
 */

import EmailNotification from "./email-notification";
import JsonView from "./json-view";
import Webhook from "./webhook";
import Captcha from "./captcha";

/** @type {Record<string, { config: object, GlobalSettingsPage: Function, FormTab: Function|null }>} */
export const INTEGRATION_REGISTRY = {
  "email-notification": EmailNotification,
  "json-view": JsonView,
  webhook: Webhook,
  captcha: Captcha,
};

/**
 * Returns the integration module for a given ID, or null if unknown.
 *
 * @param {string} id
 */
export function getIntegration(id) {
  return INTEGRATION_REGISTRY[id] || null;
}

/**
 * Returns a flat list of all registered integration configs.
 */
export function getAllIntegrationConfigs() {
  return Object.values(INTEGRATION_REGISTRY).map((m) => m.config);
}
