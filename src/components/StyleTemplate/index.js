import stylePolished from "./style-polished";
import styleFlat from "./style-flat";
import styleBlank from "./style-blank";
import premiumTemplates from "./premiumTemplates";

export const STYLE_TEMPLATES = [
  stylePolished,
  styleFlat,
  styleBlank,
  premiumTemplates,
];
export const DEFAULT_STYLE_TEMPLATE_ID = "style-polished";

const STYLE_TEMPLATE_ALIAS_MAP = STYLE_TEMPLATES.reduce((acc, tpl) => {
  if (!tpl?.id) {
    return acc;
  }

  acc[tpl.id] = tpl.id;

  (tpl.legacyIds || []).forEach((legacyId) => {
    acc[legacyId] = tpl.id;
  });

  return acc;
}, {});

export const normalizeStyleTemplateId = (templateId) =>
  STYLE_TEMPLATE_ALIAS_MAP[templateId] || DEFAULT_STYLE_TEMPLATE_ID;

const SHADOW_BASE_STYLES = `
  html, body {
    margin: 0;
    padding: 20px;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  }

  * {
    all: revert;
    box-sizing: border-box;
  }

  form { display: block; }
  input, button, label, textarea, select { all: revert; box-sizing: border-box; }
  button { cursor: pointer; }

  .krefrm-ui-input {
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4;
    color: #1d2327;
  }

  .krefrm-ui-input::placeholder,
  .krefrm-ui-input::-webkit-input-placeholder,
  .krefrm-ui-input:-ms-input-placeholder,
  .krefrm-ui-input::-ms-input-placeholder {
    color: #6b7280;
    opacity: 1;
  }

  textarea.krefrm-ui-input {
    resize: vertical;
    min-height: 96px;
  }

  .krefrm-fields-flex {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .krefrm-required-star {
    color: #d63638;
  }
`;

export const SHADOW_STYLES = `${SHADOW_BASE_STYLES}\n${STYLE_TEMPLATES.map(
  (tpl) => tpl.shadowCss || "",
).join("\n")}`;

export const STYLE_CLASS_MAP = STYLE_TEMPLATES.reduce((acc, tpl) => {
  acc[tpl.id] = tpl.styleClass;
  (tpl.legacyIds || []).forEach((legacyId) => {
    acc[legacyId] = tpl.styleClass;
  });
  return acc;
}, {});
