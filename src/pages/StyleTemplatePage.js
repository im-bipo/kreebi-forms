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
  SHADOW_STYLES,
} from "../components/StyleTemplate";

const { restUrl, nonce } = window.krefrmAdmin || {};

/* ── Template definitions ─────────────────────────────────── */

const TEMPLATES = STYLE_TEMPLATES.map((template) => ({
  ...template,
  label: __(template.label, "kreebi-forms"),
  description: __(template.description, "kreebi-forms"),
}));

/* ── Sample form used in the live preview (shadow-DOM isolated) ────────────────── */

function LivePreview({ templateId, customCss }) {
  const containerRef = useRef(null);
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const styleClass =
    STYLE_CLASS_MAP[templateId] || STYLE_CLASS_MAP.kreebi_style_1;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing shadow DOM
    if (containerRef.current.shadowRoot) {
      containerRef.current.shadowRoot.innerHTML = "";
    }

    // Attach Shadow DOM
    const shadow =
      containerRef.current.shadowRoot ||
      containerRef.current.attachShadow({ mode: "open" });

    // Create styles
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      :host {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      * {
        all: revert;
        box-sizing: border-box;
      }

      :host > div {
        padding: 20px;
        background: transparent;
      }

      form { display: block; }
      input, button, label, textarea, select { all: revert; box-sizing: border-box; }
      button { cursor: pointer; }

      ${SHADOW_STYLES}
      ${customCss}
    `;
    shadow.appendChild(styleEl);

    // Create form HTML
    const formDiv = document.createElement("div");
    formDiv.innerHTML = `
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
    shadow.appendChild(formDiv);
  }, [templateId, styleClass, tpl, customCss]);

  return (
    <div
      ref={containerRef}
      style={{
        border: "1px solid #e0e0e2",
        borderRadius: "8px",
        width: "100%",
        minHeight: "400px",
        background: "#fff",
        display: "block",
        boxSizing: "border-box",
      }}
    />
  );
}

/* ── Main page component ─────────────────────────────────── */

export default function StyleTemplatePage() {
  const [activeTemplate, setActiveTemplate] = useState("kreebi_style_1");
  const [loading, setLoading] = useState(true);
  const [customCSS, setCustomCSS] = useState("");
  const [cssError, setCssError] = useState("");
  const [cssSaving, setCssSaving] = useState(false);
  const [cssSaveMessage, setCssSaveMessage] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const upgradeUrl = "admin.php?page=krefrm_forms#upgrade-to-pro";

  /* Load current settings on mount */
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

    // Load custom CSS
    fetch(`${restUrl}/custom-css`, {
      headers: { "X-WP-Nonce": nonce },
    })
      .then((r) => r.json())
      .then((data) => {
        setCustomCSS(data?.css || "");
      })
      .catch(() => setCustomCSS(""));
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

  const validateCSS = (css) => {
    const trimmed = css.trim();

    // Empty CSS is valid
    if (!trimmed) {
      return { valid: true };
    }

    // Check for balanced braces
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      return {
        valid: false,
        error: `Mismatched braces: ${openBraces} opening, ${closeBraces} closing`,
      };
    }

    // Check for balanced parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      return {
        valid: false,
        error: `Mismatched parentheses: ${openParens} opening, ${closeParens} closing`,
      };
    }

    // Check for script tags or suspicious content
    if (/<script/i.test(trimmed) || /javascript:/i.test(trimmed)) {
      return {
        valid: false,
        error: "JavaScript or script tags are not allowed",
      };
    }

    return { valid: true };
  };

  const handleSaveCustomCSS = async () => {
    setCssError("");
    setCssSaveMessage("");

    const validation = validateCSS(customCSS);
    if (!validation.valid) {
      setCssError(validation.error);
      return;
    }

    setCssSaving(true);

    try {
      const response = await fetch(`${restUrl}/custom-css`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": nonce,
        },
        body: JSON.stringify({ css: customCSS }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCssError(data?.message || "Failed to save CSS");
        return;
      }

      setCssSaveMessage(__("Custom CSS saved successfully!", "kreebi-forms"));
      setCustomCSS(data?.css ?? customCSS);
      setPreviewKey((key) => key + 1);
      setTimeout(() => setCssSaveMessage(""), 3000);
    } catch (error) {
      setCssError("Network error while saving CSS");
    } finally {
      setCssSaving(false);
    }
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
          <LivePreview
            key={previewKey}
            templateId={activeTemplate}
            customCss={customCSS}
          />
        </div>
      </div>

      {/* Custom CSS Section */}
      <div className="krefrm-custom-css-section">
        <h3 className="krefrm-custom-css-section__title">
          {__("Custom CSS", "kreebi-forms")}
        </h3>
        <p className="krefrm-custom-css-section__subtitle">
          {__(
            "Add additional CSS to customize your forms. Your CSS will be isolated within the Shadow DOM.",
            "kreebi-forms",
          )}
        </p>

        <div className="krefrm-custom-css-editor">
          <textarea
            className="krefrm-custom-css-textarea"
            value={customCSS}
            onChange={(e) => {
              setCustomCSS(e.target.value);
              setCssError("");
            }}
            placeholder={__(
              "/* Example:\n.krefrm-frontend-form {\n  max-width: 600px;\n  margin: 0 auto;\n}\n*/",
              "kreebi-forms",
            )}
            rows="12"
          />

          {cssError && (
            <div className="krefrm-custom-css-error">
              <strong>{__("CSS Error:", "kreebi-forms")}</strong> {cssError}
            </div>
          )}

          {cssSaveMessage && (
            <div className="krefrm-custom-css-success">{cssSaveMessage}</div>
          )}

          <div className="krefrm-custom-css-actions">
            <Button
              variant="primary"
              onClick={handleSaveCustomCSS}
              disabled={cssSaving}
            >
              {cssSaving
                ? __("Saving…", "kreebi-forms")
                : __("Save Custom CSS", "kreebi-forms")}
            </Button>
            <p className="krefrm-custom-css-help">
              {__(
                "Tip: CSS will be validated before saving. Only valid CSS and comments are allowed.",
                "kreebi-forms",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
