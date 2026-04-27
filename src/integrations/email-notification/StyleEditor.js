import { __ } from "@wordpress/i18n";
import {
  Button,
  TextControl,
  TextareaControl,
  BaseControl,
} from "@wordpress/components";
import { MediaUpload } from "@wordpress/block-editor";
import { STYLE_OPTIONS } from "./templateSettings";

export default function EmailTemplateStyleEditor({
  settings,
  onUpdate,
  onBack,
  onSave,
  saveLabel,
  showSave = true,
  isSaving = false,
}) {
  const hasFormData = (settings.styleVariant || "style1") !== "style2";

  return (
    <div className="krefrm-integration-settings">
      <div className="krefrm-integration-settings__header">
        <div className="krefrm-integration-settings__title-row">
          <h2 className="krefrm-integration-settings__title">
            {__("Edit Email Style", "kreebi-forms")}
          </h2>
          <div className="krefrm-integration-settings__actions">
            <Button variant="tertiary" onClick={onBack}>
              {__("Back", "kreebi-forms")}
            </Button>
            {showSave && (
              <Button
                variant="primary"
                onClick={onSave}
                isBusy={isSaving}
                disabled={isSaving}
              >
                {saveLabel || __("Save Settings", "kreebi-forms")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="krefrm-integration-settings__content">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div
          className="krefrm-integration-settings__body"
          style={{ marginTop: 0 }}
        >
          <div className="krefrm-integration-settings__field">
            <BaseControl label={__("Layout", "kreebi-forms")}>
              <div style={{ display: "grid", gap: "8px" }}>
                {STYLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="radio"
                      checked={(settings.styleVariant || "style1") === opt.id}
                      onChange={() => onUpdate("styleVariant", opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </BaseControl>
          </div>

          <div className="krefrm-integration-settings__field">
            <BaseControl
              label={__("Logo", "kreebi-forms")}
              help={__(
                "Select logo from WordPress Media Library.",
                "kreebi-forms",
              )}
            >
              <div style={{ display: "grid", gap: "8px" }}>
                {!!settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={__("Selected logo", "kreebi-forms")}
                    style={{
                      maxHeight: "48px",
                      width: "auto",
                      border: "1px solid #ddd",
                    }}
                  />
                )}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <MediaUpload
                    onSelect={(media) => {
                      if (media?.url) {
                        onUpdate("logoUrl", media.url);
                      }
                    }}
                    allowedTypes={["image"]}
                    value={settings.logoUrl}
                    render={({ open }) => (
                      <Button variant="primary" onClick={open}>
                        {__("Select Image", "kreebi-forms")}
                      </Button>
                    )}
                  />
                  <Button
                    variant="tertiary"
                    onClick={() => onUpdate("logoUrl", "")}
                    disabled={!settings.logoUrl}
                  >
                    {__("Remove Logo", "kreebi-forms")}
                  </Button>
                </div>
              </div>
            </BaseControl>
          </div>

          <div className="krefrm-integration-settings__field">
            <TextControl
              label={__("Business Name (Header)", "kreebi-forms")}
              value={settings.businessName || ""}
              onChange={(v) => onUpdate("businessName", v)}
            />
          </div>

          <div className="krefrm-integration-settings__field">
            <TextControl
              label={__("Button Label", "kreebi-forms")}
              value={settings.buttonText || ""}
              onChange={(v) => onUpdate("buttonText", v)}
            />
          </div>

          <div className="krefrm-integration-settings__field">
            <TextControl
              label={__("Button URL", "kreebi-forms")}
              type="url"
              value={settings.buttonUrl || ""}
              onChange={(v) => onUpdate("buttonUrl", v)}
              placeholder={__("https://example.com", "kreebi-forms")}
            />
          </div>

          <div className="krefrm-integration-settings__field">
            <TextareaControl
              label={__("Message", "kreebi-forms")}
              value={settings.message || ""}
              onChange={(v) => onUpdate("message", v)}
              rows={4}
            />
          </div>

          <div className="krefrm-integration-settings__field">
            <BaseControl label={__("Color Theme", "kreebi-forms")}>
              <input
                type="color"
                value={settings.themeColor || "#1875E5"}
                onChange={(e) => onUpdate("themeColor", e.target.value)}
                style={{ width: "56px", height: "36px", padding: "2px" }}
              />
            </BaseControl>
          </div>

          <div className="krefrm-integration-settings__field">
            <TextareaControl
              label={__("Footer Contact Details", "kreebi-forms")}
              value={settings.footerContactDetails || ""}
              onChange={(v) => onUpdate("footerContactDetails", v)}
              rows={3}
            />
          </div>
        </div>

        <div>
          <BaseControl label={__("Preview", "kreebi-forms")}>
            <div
              style={{
                border: "1px solid #d0d0d0",
                background: "#ededed",
                padding: "14px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "12px",
                }}
              >
                {!!settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={__("Logo", "kreebi-forms")}
                    style={{
                      maxHeight: "38px",
                      width: "auto",
                      marginBottom: "8px",
                    }}
                  />
                )}
                <div
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontSize: "12px",
                    display: "inline-block",
                    borderBottom: `3px solid ${
                      settings.themeColor || "#1875E5"
                    }`,
                    paddingBottom: "4px",
                  }}
                >
                  {settings.businessName || "Business Name"}
                </div>
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e4e4e4",
                  padding: "22px 16px",
                  textAlign: "center",
                  marginBottom: "12px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px",
                    whiteSpace: "pre-wrap",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1c1c1c",
                  }}
                >
                  {settings.message || "Message"}
                </p>
                {!!(settings.buttonText || "").trim() && (
                  <a
                    href={settings.buttonUrl || "#"}
                    style={{
                      display: "inline-block",
                      background: settings.themeColor || "#1875E5",
                      color: "#fff",
                      textDecoration: "none",
                      fontWeight: 600,
                      padding: "10px 18px",
                      borderRadius: "2px",
                      marginBottom: hasFormData ? "12px" : "0",
                    }}
                  >
                    {settings.buttonText}
                  </a>
                )}
                {hasFormData && (
                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      padding: "10px 12px",
                      marginTop: "12px",
                      textAlign: "left",
                    }}
                  >
                    <strong style={{ color: settings.themeColor || "#1875E5" }}>
                      {__("Form Data", "kreebi-forms")}
                    </strong>
                    <p style={{ margin: "8px 0 0", color: "#656565" }}>
                      {__(
                        "Auto-generated from submitted fields.",
                        "kreebi-forms",
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "#666",
                  color: "#fff",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,.2)",
                    paddingTop: "10px",
                  }}
                >
                  <p style={{ margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
                    {settings.footerContactDetails || "Contact details"}
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  textAlign: "center",
                  fontSize: "12px",
                }}
              >
                <a
                  href="https://kreebiforms.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#1875E5",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Kreebi Forms
                </a>
              </div>
            </div>
          </BaseControl>
        </div>
      </div>
      </div>
    </div>
  );
}
