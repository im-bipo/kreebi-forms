/**
 * IsolatedForm – Wraps form in iframe for complete CSS isolation
 *
 * This component prevents ANY theme or parent CSS from affecting the form.
 * The form renders in a completely separate document with only our styles.
 */

import { useRef, useEffect } from "@wordpress/element";

export function IsolatedForm({ content, styles, title = "" }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframeDoc =
      iframeRef.current.contentDocument ||
      iframeRef.current.contentWindow.document;

    // Write complete HTML to iframe
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          /* Complete browser reset */
          html, body {
            margin: 0;
            padding: 20px;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          }
          
          * {
            all: revert;
          }

          /* Template styles */
          ${styles}
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Auto-resize iframe to fit content
    const resizeIframe = () => {
      try {
        const height =
          iframeDoc.documentElement.scrollHeight || iframeDoc.body.scrollHeight;
        iframeRef.current.style.height = height + 20 + "px";
      } catch {
        // Cross-origin or other access issues
      }
    };

    // Resize after content loads
    setTimeout(resizeIframe, 100);
    iframeRef.current.onload = resizeIframe;

    return () => {
      // Cleanup
    };
  }, [content, styles]);

  return (
    <iframe
      ref={iframeRef}
      id="krefrm-forms-container"
      style={{
        border: "none",
        width: "100%",
        minHeight: "400px",
        background: "transparent",
      }}
      title="Kreebi Form Preview"
      sandbox="allow-same-origin"
    />
  );
}
