import style1 from "./style1";
import style2 from "./style2";
import blankDev from "./blankDev";
import premiumTemplates from "./premiumTemplates";

export const STYLE_TEMPLATES = [style1, style2, blankDev, premiumTemplates];

const IFRAME_BASE_STYLES = `
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

  .krefrm-fields-flex {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .krefrm-required-star {
    color: #d63638;
  }
`;

export const IFRAME_STYLES = `${IFRAME_BASE_STYLES}\n${STYLE_TEMPLATES.map(
  (tpl) => tpl.iframeCss || "",
).join("\n")}`;

export const STYLE_CLASS_MAP = STYLE_TEMPLATES.reduce((acc, tpl) => {
  acc[tpl.id] = tpl.styleClass;
  return acc;
}, {});
