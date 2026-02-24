import { useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import FormsPage from "./pages/FormsPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import "./style.css";

export default function App() {
  const initialPage = window.krefrmAdmin?.page || "forms";
  const [page, setPage] = useState(initialPage);

  return (
    <div className="wrap krefrm-app">
      <h1>{__("Kreebi Forms", "kreebi-forms")}</h1>

      <nav className="krefrm-tabs">
        <button
          className={`krefrm-tab ${page === "forms" ? "active" : ""}`}
          onClick={() => setPage("forms")}
        >
          {__("Forms", "kreebi-forms")}
        </button>
        <button
          className={`krefrm-tab ${page === "submissions" ? "active" : ""}`}
          onClick={() => setPage("submissions")}
        >
          {__("Submissions", "kreebi-forms")}
        </button>
      </nav>

      <div className="krefrm-page-content">
        {page === "forms" && <FormsPage />}
        {page === "submissions" && <SubmissionsPage />}
      </div>
    </div>
  );
}
