import { __ } from "@wordpress/i18n";

export const TEMPLATES = [
  {
    key: "contact",
    label: __("Contact Form", "kreebi-forms"),
    data: {
      name: "",
      fields: [
        {
          name: "Name",
          type: "text",
          placeholder: "Your name",
          required: true,
        },
        {
          name: "Email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "Message",
          type: "text",
          placeholder: "Write your message...",
          required: false,
        },
      ],
    },
  },
  {
    key: "rsvp",
    label: __("RSVP Form", "kreebi-forms"),
    data: {
      name: "",
      fields: [
        {
          name: "Full Name",
          type: "text",
          placeholder: "Your full name",
          required: true,
        },
        {
          name: "Email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "Will you attend?",
          type: "select",
          options: ["Yes", "No", "Maybe"],
          required: true,
        },
      ],
    },
  },
  {
    key: "event",
    label: __("Event Registration", "kreebi-forms"),
    data: {
      name: "",
      fields: [
        {
          name: "Name",
          type: "text",
          placeholder: "Full name",
          required: true,
        },
        {
          name: "Email",
          type: "email",
          placeholder: "you@example.com",
          required: true,
        },
        {
          name: "Number of Guests",
          type: "number",
          placeholder: "1",
          required: false,
        },
      ],
    },
  },
  {
    key: "blank",
    label: __("Blank Form", "kreebi-forms"),
    data: { name: "", fields: [] },
  },
];

export const TEMPLATE_ICONS = {
  contact: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 6L12 13L21 6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  rsvp: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 17L8 3L12 17H4Z" fill="currentColor" />
      <path d="M15 7L20 11L16 16L12 12L15 7Z" fill="currentColor" />
      <path
        d="M8 21L18 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  event: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M4 9H20" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 3V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 3V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  blank: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 12H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};
