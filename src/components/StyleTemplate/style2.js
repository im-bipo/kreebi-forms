const style2 = {
  id: "kreebi_style_2",
  label: "Flat",
  description:
    "Bold uppercase labels, flat borders, and a compact grid layout for a structured feel.",
  previewClass: "krefrm-stl-preview--style-2",
  styleClass: {
    form: "krefrm-ui-style-2-form",
    field: "krefrm-ui-style-2-field",
    label: "krefrm-ui-style-2-label",
    input: "krefrm-ui-style-2-input",
    btn: "krefrm-ui-style-2-btn",
  },
  iframeCss: `
  .krefrm-ui-style-2-form {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
    max-width: 720px !important;
  }

  .krefrm-ui-style-2-field {
    margin-bottom: 14px !important;
    padding: 10px 12px !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 3px !important;
    background: #fafafa !important;
  }

  .krefrm-ui-style-2-label {
    display: block !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    color: #444 !important;
    margin-bottom: 6px !important;
  }

  .krefrm-ui-style-2-input {
    width: 100% !important;
    padding: 8px 10px !important;
    border: 1px solid #bbb !important;
    border-radius: 3px !important;
    font-size: 14px !important;
    background: #fff !important;
    box-sizing: border-box !important;
    color: #1d2327 !important;
    appearance: none !important;
    -webkit-appearance: none !important;
  }

  .krefrm-ui-style-2-input:focus {
    border-color: #333 !important;
    outline: none !important;
  }

  .krefrm-ui-style-2-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 10px 24px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    color: #fff !important;
    background: #333 !important;
    border: none !important;
    border-radius: 3px !important;
    cursor: pointer !important;
    transition: background 0.2s !important;
    line-height: 1.3 !important;
    text-decoration: none !important;
  }

  .krefrm-ui-style-2-btn:hover {
    background: #555 !important;
  }
  `,
};

export default style2;
