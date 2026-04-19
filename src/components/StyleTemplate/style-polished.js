const stylePolished = {
  id: "style-polished",
  legacyIds: ["kreebi_style_1"],
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
  shadowCss: `
  .krefrm-ui-style-1-form {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif ;
  }

  .krefrm-ui-style-1-field {
    margin-bottom: 14px ;
  }

  .krefrm-ui-style-1-label {
    display: block ;
    font-size: 14px ;
    font-weight: 600 ;
    color: #1d2327 ;
    margin-bottom: 6px ;
  }

  .krefrm-ui-style-1-input {
    width: 100% ;
    padding: 10px 14px ;
    border: 1px solid #c3c4c7 ;
    border-radius: 6px ;
    font-size: 14px ;
    background: #fff ;
    box-sizing: border-box ;
    color: #1d2327 ;
    appearance: none ;
    -webkit-appearance: none ;
    transition: border-color 0.2s, box-shadow 0.2s ;
  }

  .krefrm-ui-style-1-input::placeholder,
  .krefrm-ui-style-1-input::-webkit-input-placeholder,
  .krefrm-ui-style-1-input:-ms-input-placeholder,
  .krefrm-ui-style-1-input::-ms-input-placeholder {
    color: #6b7280 ;
    opacity: 1 ;
  }

  .krefrm-ui-style-1-input:focus {
    border-color: #2271b1 ;
    box-shadow: 0 0 0 1px #2271b1 ;
    outline: none ;
  }

  .krefrm-ui-style-1-input[type="checkbox"],
  .krefrm-ui-style-1-input[type="radio"] {
    width: 18px ;
    height: 18px ;
    padding: 0 ;
    border: initial ;
    background: initial ;
    appearance: auto ;
    -webkit-appearance: auto ;
  }

  .krefrm-ui-style-1-btn {
    display: inline-flex ;
    align-items: center ;
    justify-content: center ;
    padding: 10px 24px ;
    font-size: 14px ;
    font-weight: 600 ;
    color: #fff ;
    background: #2271b1 ;
    border: none ;
    border-radius: 6px ;
    cursor: pointer ;
    transition: background 0.2s ;
    text-transform: none ;
    line-height: 1.3 ;
    text-decoration: none ;
  }

  .krefrm-ui-style-1-btn:hover {
    background: #135e96 ;
  }
  `,
};

export default stylePolished;
