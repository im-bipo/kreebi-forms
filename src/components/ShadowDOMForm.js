/**
 * ShadowDOMForm – Wraps form in Shadow DOM for CSS isolation
 *
 * This component prevents ANY theme or parent CSS from affecting the form.
 * Shadow DOM provides complete CSS scope isolation while keeping the form in the normal DOM.
 */

import { useRef, useEffect } from "@wordpress/element";

export function ShadowDOMForm({ content, styles, title = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous shadow if any
    if (containerRef.current.shadowRoot) {
      containerRef.current.shadowRoot.innerHTML = "";
    }

    // Attach and populate Shadow DOM
    const shadow =
      containerRef.current.shadowRoot ||
      containerRef.current.attachShadow({ mode: "open" });

    // Create style element
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      :host {
        display: block;
      }
      
      * {
        all: revert;
        box-sizing: border-box;
      }
      
      :host > div {
        padding: 20px;
        box-sizing: border-box;
        background: transparent;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      }

      /* Template styles */
      ${styles}
    `;
    shadow.appendChild(styleEl);

    // Create wrapper for form content
    const wrapper = document.createElement("div");
    wrapper.innerHTML = content;
    shadow.appendChild(wrapper);
  }, [content, styles]);

  return (
    <div
      ref={containerRef}
      className="krefrm-shadow-container"
      style={{
        display: "block",
        width: "100%",
      }}
    />
  );
}
