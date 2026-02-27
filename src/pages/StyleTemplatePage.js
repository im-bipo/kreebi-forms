/**
 * StyleTemplatePage – global style template selector.
 *
 * Users pick a style template here; it applies to every form site-wide.
 */

import { useState, useEffect, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import { Button } from "@wordpress/components";
import ProTag from "../components/ProTag";
import {
  STYLE_TEMPLATES,
  STYLE_CLASS_MAP,
  IFRAME_STYLES,
} from "../components/StyleTemplate";

const { restUrl, nonce } = window.krefrmAdmin || {};

/* ── Template definitions ─────────────────────────────────── */

const TEMPLATES = STYLE_TEMPLATES.map((template) => ({
  ...template,
  label: __(template.label, "kreebi-forms"),
  description: __(template.description, "kreebi-forms"),
}));

/* ── Sample form used in the live preview (iframe-isolated) ────────────────── */

function LivePreview({ templateId }) {
  const iframeRef = useRef(null);
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const styleClass =
    STYLE_CLASS_MAP[templateId] || STYLE_CLASS_MAP.kreebi_style_1;

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframeDoc =
      iframeRef.current.contentDocument ||
      iframeRef.current.contentWindow.document;

    // Build form HTML
    const formHTML = `
      <form class="krefrm-stl-preview krefrm-frontend-form ${tpl.previewClass} ${styleClass.form}">
        <div class="krefrm-fields-flex">
          <div class="krefrm-field ${styleClass.field}">
            <label class="${styleClass.label}">
              Full Name <span class="krefrm-required-star">*</span>
            </label>
            <input type="text" class="${styleClass.input}" placeholder="John Smith" readonly>
          </div>
          
          <div class="krefrm-field ${styleClass.field}">
            <label class="${styleClass.label}">
              Email Address <span class="krefrm-required-star">*</span>
            </label>
            <input type="email" class="${styleClass.input}" placeholder="john@example.com" readonly>
          </div>
          
          <div class="krefrm-field ${styleClass.field}">
            <label class="${styleClass.label}">
              Phone Number
            </label>
            <input type="text" class="${styleClass.input}" placeholder="+1 555 123 456" readonly>
          </div>
        </div>
        
        <button type="submit" class="${styleClass.btn}">Submit</button>
      </form>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Form Preview</title>
          <style>${IFRAME_STYLES}</style>
        </head>
        <body>${formHTML}</body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Auto-resize iframe
    const resizeIframe = () => {
      try {
        const height =
          iframeDoc.documentElement.scrollHeight || iframeDoc.body.scrollHeight;
        iframeRef.current.style.height = height + 40 + "px";
      } catch {
        // Cross-origin or access issue
      }
    };

    setTimeout(resizeIframe, 100);
  }, [templateId, styleClass, tpl]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        border: "1px solid #e0e0e2",
        borderRadius: "8px",
        width: "100%",
        minHeight: "400px",
        background: "#fff",
      }}
      title="Form Preview"
      sandbox="allow-same-origin"
    />
  );
}

/* ── Main page component ─────────────────────────────────── */

export default function StyleTemplatePage() {
  const [activeTemplate, setActiveTemplate] = useState("kreebi_style_1");
  const [loading, setLoading] = useState(true);
  const upgradeUrl = "admin.php?page=krefrm_forms#upgrade-to-pro";

  /* Load current setting on mount */
  useEffect(() => {
    fetch(`${restUrl}/settings`, {
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        const tpl = data?.styleTemplate || "kreebi_style_1";
        setActiveTemplate(tpl);
      })
      .catch(() => setActiveTemplate("kreebi_style_1"))
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (tpl) => {
    if (tpl.isPremium) {
      window.location.href = upgradeUrl;
      return;
    }
    // Auto-save on click
    setActiveTemplate(tpl.id);
    fetch(`${restUrl}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify({ styleTemplate: tpl.id }),
    });
  };

  if (loading) {
    return (
      <div className="krefrm-loading">
        <span>{__("Loading…", "kreebi-forms")}</span>
      </div>
    );
  }

  return (
    <div className="krefrm-stl-page">
      {/* Header */}
      <div className="krefrm-stl-page__header">
        <div>
          <h2 className="krefrm-stl-page__title">
            {__("Style Templates", "kreebi-forms")}
          </h2>
          <p className="krefrm-stl-page__subtitle">
            {__(
              "Choose a template to apply globally to all forms.",
              "kreebi-forms",
            )}
          </p>
        </div>
      </div>

      {/* Template Cards */}
      <div className="krefrm-stl-cards">
        {TEMPLATES.map((tpl) => {
          const isSelected = activeTemplate === tpl.id;
          const isPremiumCard = Boolean(tpl.isPremium);
          return (
            <button
              key={tpl.id}
              type="button"
              className={`krefrm-stl-card ${isSelected ? "is-selected" : ""} ${
                isPremiumCard ? "is-premium" : ""
              }`}
              onClick={() => handleCardClick(tpl)}
            >
              {isPremiumCard && (
                <span className="krefrm-stl-card__pro-badge">
                  <ProTag variant="secondary">Pro</ProTag>
                </span>
              )}

              {/* Mini thumbnail */}
              <div className={`krefrm-stl-card__thumb ${tpl.previewClass}`}>
                {isPremiumCard ? (
                  <div
                    className="krefrm-stl-thumb__premium-lock"
                    role="img"
                    aria-label="Premium"
                  >
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <rect
                        x="16"
                        y="28"
                        width="32"
                        height="24"
                        rx="3"
                        ry="3"
                      />
                      <path d="M22 28v-6a10 10 0 0 1 20 0v6" />
                      <circle cx="32" cy="34" r="4" />
                    </svg>
                  </div>
                ) : (
                  <>
                    <div className="krefrm-stl-thumb__field">
                      <div className="krefrm-stl-thumb__label" />
                      <div className="krefrm-stl-thumb__input" />
                    </div>
                    <div className="krefrm-stl-thumb__field">
                      <div className="krefrm-stl-thumb__label" />
                      <div className="krefrm-stl-thumb__input" />
                    </div>
                    <div className="krefrm-stl-thumb__btn" />
                  </>
                )}
              </div>

              <div className="krefrm-stl-card__body">
                <span className="krefrm-stl-card__name">{tpl.label}</span>
                <span className="krefrm-stl-card__desc">{tpl.description}</span>
              </div>

              {isSelected && !isPremiumCard && (
                <span className="krefrm-stl-card__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live Preview */}
      <div className="krefrm-stl-preview-section">
        <h3 className="krefrm-stl-preview-section__title">
          {__("Live Preview", "kreebi-forms")}
        </h3>
        <p className="krefrm-stl-preview-section__subtitle">
          {__(
            "See how your forms will look with the selected template.",
            "kreebi-forms",
          )}
        </p>

        <div className="krefrm-stl-preview-wrap">
          <LivePreview templateId={activeTemplate} />
        </div>
      </div>
    </div>
  );
}
