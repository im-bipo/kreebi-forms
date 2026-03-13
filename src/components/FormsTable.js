import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import { useState } from "react";

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-copy-icon lucide-copy"
    >
      <rect
        width="14"
        height="14"
        x="8"
        y="8"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
      />
      <path
        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}

function CopyPlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-copy-plus-icon lucide-copy-plus"
    >
      <line x1="15" x2="15" y1="12" y2="18" stroke="currentColor" />
      <line x1="12" x2="18" y1="15" y2="15" stroke="currentColor" />
      <rect
        width="14"
        height="14"
        x="8"
        y="8"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
      />
      <path
        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}

/**
 * Renders the forms list table.
 *
 * Props:
 *  forms        {Array}    array of form objects from the REST API
 *  navigate     {Function} navigation function for routing
 *  onDelete     {Function} called with post_id when Delete is clicked
 *  onCreateNew  {Function} called when the user wants to create a new form
 */
export default function FormsTable({ forms, navigate, onDelete, onCreateNew }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        },
        () => {
          // ignore write failures silently
        },
      );
      return;
    }

    // Fallback for older browsers
    try {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      // no-op
    }
  };
  if (forms.length === 0) {
    return (
      <div className="krefrm-forms-section krefrm-forms-section--empty">
        <div className="krefrm-section-head">
          <div className="krefrm-section-head__title">
            <h2>{__("Your forms", "kreebi-forms")}</h2>
            <p>{__("No forms yet. Create your first form.", "kreebi-forms")}</p>
          </div>

          <Button
            variant="primary"
            onClick={onCreateNew}
            className="krefrm-create-btn"
          >
            {__("Create new form", "kreebi-forms")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="krefrm-forms-section">
      <div className="krefrm-section-head">
        <div className="krefrm-section-head__title">
          <h2>{__("Your forms", "kreebi-forms")}</h2>
          <p>
            {__("Manage, edit, and reuse your forms quickly.", "kreebi-forms")}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onCreateNew}
          className="krefrm-create-btn"
        >
          {__("Create new form", "kreebi-forms")}
        </Button>
      </div>

      <div className="krefrm-forms-grid">
        {forms.map((form) => (
          <article key={form.post_id} className="krefrm-form-card">
            <div className="krefrm-form-card__head">
              <h3>{form.title}</h3>
              <span className="krefrm-form-card__date">{form.date}</span>
            </div>

            <div className="krefrm-form-card__meta">
              <span className="krefrm-form-card__chip">
                {form.field_count} {__("fields", "kreebi-forms")}
              </span>
            </div>

            <div className="krefrm-form-card__shortcode">
              <label>{__("Shortcode", "kreebi-forms")}</label>

              <div className="krefrm-shortcode-row">
                <code aria-label={__("Form shortcode", "kreebi-forms")}>
                  {form.shortcode}
                </code>

                <Button
                  variant="secondary"
                  isSmall
                  className={`krefrm-copy-btn ${
                    copiedId === form.post_id ? "is-copied" : ""
                  }`}
                  onClick={() => handleCopy(form.shortcode, form.post_id)}
                  aria-label={__("Copy form shortcode", "kreebi-forms")}
                  aria-pressed={copiedId === form.post_id}
                >
                  <span className="krefrm-copy-btn__icon" aria-hidden="true">
                    {copiedId === form.post_id ? (
                      <CopyPlusIcon />
                    ) : (
                      <CopyIcon />
                    )}
                  </span>
                </Button>
              </div>
            </div>

            <div className="krefrm-form-card__actions">
              <Button
                variant="secondary"
                isSmall
                className="krefrm-form-card__btn krefrm-form-card__btn--quick-edit"
                onClick={() =>
                  navigate(
                    `forms/edit?form_id=${encodeURIComponent(
                      form.form_id || "",
                    )}&tab=quick-edit`,
                  )
                }
              >
                {__("Quick Edit", "kreebi-forms")}
              </Button>
              <Button
                variant="tertiary"
                isSmall
                isDestructive
                className="krefrm-form-card__btn krefrm-form-card__btn--delete"
                onClick={() => onDelete(form.post_id)}
              >
                {__("Delete", "kreebi-forms")}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
