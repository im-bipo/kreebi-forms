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
  shadowCss: `
  .krefrm-ui-style-2-form {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif ;
  }

  .krefrm-ui-style-2-field {
    margin-bottom: 14px ;
    padding: 10px 12px ;
    border: 1px solid #e0e0e0 ;
    border-radius: 3px ;
    background: #fafafa ;
  }

  .krefrm-ui-style-2-label {
    display: block ;
    font-size: 13px ;
    font-weight: 700 ;
    text-transform: uppercase ;
    letter-spacing: 0.5px ;
    color: #444 ;
    margin-bottom: 6px ;
  }

  .krefrm-ui-style-2-input {
    width: 100% ;
    padding: 8px 10px ;
    border: 1px solid #bbb ;
    border-radius: 3px ;
    font-size: 14px ;
    background: #fff ;
    box-sizing: border-box ;
    color: #1d2327 ;
    appearance: none ;
    -webkit-appearance: none ;
  }

  .krefrm-ui-style-2-input:focus {
    border-color: #333 ;
    outline: none ;
  }

  .krefrm-ui-style-2-btn {
    display: inline-flex ;
    align-items: center ;
    justify-content: center ;
    padding: 10px 24px ;
    font-size: 13px ;
    font-weight: 700 ;
    text-transform: uppercase ;
    letter-spacing: 0.5px ;
    color: #fff ;
    background: #333 ;
    border: none ;
    border-radius: 3px ;
    cursor: pointer ;
    transition: background 0.2s ;
    line-height: 1.3 ;
    text-decoration: none ;
  }

  .krefrm-ui-style-2-btn:hover {
    background: #555 ;
  }
  `,
};

export default style2;
