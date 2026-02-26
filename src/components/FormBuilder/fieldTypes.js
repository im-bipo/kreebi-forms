/**
 * Registry of available field types for the form builder.
 */

import { __ } from "@wordpress/i18n";

const FIELD_TYPES = [
  {
    type: "text",
    label: __("Text", "kreebi-forms"),
    icon: "Aa",
    defaults: {
      name: "Text Field",
      type: "text",
      placeholder: "",
      required: false,
      wrapper: { class: "", id: "" },
    },
  },
  {
    type: "email",
    label: __("Email", "kreebi-forms"),
    icon: "@",
    defaults: {
      name: "Email Field",
      type: "email",
      placeholder: "",
      required: false,
      wrapper: { class: "", id: "" },
    },
  },
  {
    type: "number",
    label: __("Number", "kreebi-forms"),
    icon: "#",
    defaults: {
      name: "Number Field",
      type: "number",
      placeholder: "",
      required: false,
      wrapper: { class: "", id: "" },
    },
  },
  {
    type: "password",
    label: __("Password", "kreebi-forms"),
    icon: "••",
    defaults: {
      name: "Password Field",
      type: "password",
      placeholder: "",
      required: false,
      wrapper: { class: "", id: "" },
    },
  },
];

export default FIELD_TYPES;
