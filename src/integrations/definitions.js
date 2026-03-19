/**
 * Definitions used by the integrations administration page.
 */

import { __ } from "@wordpress/i18n";

/* ── Default integrations which are enabled before the user has made a choice ── */
export const DEFAULT_ENABLED = ["email-notification"];

/* ── The card definitions shown on the main integrations page ── */
export const INTEGRATIONS = [
  {
    id: "email-notification",
    name: __("Email Notification", "kreebi-forms"),
    description: __(
      "Send an email notification to one or more recipients every time a form is submitted. Configure the sender, subject line, and message body to match your workflow.",
      "kreebi-forms",
    ),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: "json-view",
    name: __("JSON View", "kreebi-forms"),
    description: __(
      "Add a JSON View tab inside the advanced form editor. Inspect or directly edit the raw JSON structure of any form — useful for bulk changes, debugging, or copying form structures.",
      "kreebi-forms",
    ),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "webhook",
    name: __("Webhook & Zapier", "kreebi-forms"),
    description: __(
      "Send form data to external services via webhooks or integrate with Zapier for thousands of app integrations.",
      "kreebi-forms",
    ),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="5" r="1" />
        <circle cx="5" cy="19" r="1" />
        <line x1="12" y1="12" x2="19" y2="5" />
        <line x1="12" y1="12" x2="5" y2="19" />
      </svg>
    ),
  },
  /* premium integrations remain here for the time being */
  {
    id: "google-sheet",
    name: __("Google Sheets", "kreebi-forms"),
    description: __(
      "Automatically save form submissions directly to a Google Sheet. Perfect for tracking, analysis, and sharing responses with your team.",
      "kreebi-forms",
    ),
    isPremium: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    ),
  },
  {
    id: "captcha",
    name: __("Captcha Protection", "kreebi-forms"),
    description: __(
      "Add Google reCAPTCHA v3 to protect every form submission from spam and automated bots.",
      "kreebi-forms",
    ),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "payment",
    name: __("Payment Processing", "kreebi-forms"),
    description: __(
      "Accept payments directly through your forms with Stripe or PayPal integration. Secure, reliable, and PCI compliant.",
      "kreebi-forms",
    ),
    isPremium: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];
