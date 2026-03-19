import { __ } from "@wordpress/i18n";

const { siteTitle, adminEmail } = window.krefrmAdmin || {};

export const DEFAULT_EMAIL_TEMPLATE_SETTINGS = {
  styleVariant: "style1",
  logoUrl: "",
  businessName: siteTitle || "",
  message:
    "Hello,\n\nYou have received a new form submission. Please review the details below.",
  buttonText: "View Submission",
  buttonUrl: "",
  themeColor: "#1875E5",
  footerContactDetails: "Contact us for support anytime.",
};

export const STYLE_OPTIONS = [
  {
    id: "style1",
    label: __("Style 1 (With Form Data)", "kreebi-forms"),
  },
  {
    id: "style2",
    label: __("Style 2 (Without Form Data)", "kreebi-forms"),
  },
];
