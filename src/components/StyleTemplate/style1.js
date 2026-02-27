const style1 = {
  id: "kreebi_style_1",
  label: "Polished",
  description:
    "Rounded corners, subtle shadows, and smooth focus rings for a modern, clean look.",
  previewClass: "krefrm-stl-preview--style-1",
  styleClass: {
    form: "krefrm-ui-style-1-form",
    field: "krefrm-ui-style-1-field",
    label: "krefrm-ui-style-1-label",
    input: "krefrm-ui-style-1-input",
    btn: "krefrm-ui-style-1-btn",
  },
  iframeCss: `
  .krefrm-ui-style-1-form {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
    max-width: 720px !important;
  }

  .krefrm-ui-style-1-field {
    margin-bottom: 14px !important;
  }

  .krefrm-ui-style-1-label {
    display: block !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #1d2327 !important;
    margin-bottom: 6px !important;
  }

  .krefrm-ui-style-1-input {
    width: 100% !important;
    padding: 10px 14px !important;
    border: 1px solid #c3c4c7 !important;
    border-radius: 6px !important;
    font-size: 14px !important;
    background: #fff !important;
    box-sizing: border-box !important;
    color: #1d2327 !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
  }

  .krefrm-ui-style-1-input:focus {
    border-color: #2271b1 !important;
    box-shadow: 0 0 0 1px #2271b1 !important;
    outline: none !important;
  }

  .krefrm-ui-style-1-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 10px 24px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #fff !important;
    background: #2271b1 !important;
    border: none !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    transition: background 0.2s !important;
    text-transform: none !important;
    line-height: 1.3 !important;
    text-decoration: none !important;
  }

  .krefrm-ui-style-1-btn:hover {
    background: #135e96 !important;
  }
  `,
};

export default style1;
