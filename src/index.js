import { createRoot, render } from "@wordpress/element";
import App from "./App";

const container = document.getElementById("krefrm-admin-root");

if (container) {
  // WP 6.2+ uses createRoot, older uses render
  if (createRoot) {
    createRoot(container).render(<App />);
  } else {
    render(<App />, container);
  }
}
