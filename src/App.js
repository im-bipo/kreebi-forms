import { useState, useEffect } from "@wordpress/element";
import { __ } from "@wordpress/i18n";
import FormsPage from "./pages/FormsPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import "./style.css";

function getHashRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash.startsWith("forms")) return hash;
  if (hash === "submission") return "submission";
  return "forms";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (newHash) => {
    window.location.hash = newHash;
  };

  const isFormsActive = route.startsWith("forms");
  const isSubmissionsActive = route === "submission";

  return (
    <div className="wrap krefrm-app">
      <div className="krefrm-header">
        <h1 className="wp-heading-inline">
          {__("Kreebi Forms", "kreebi-forms")}
        </h1>
        {isFormsActive && !route.includes("create") && (
          <a
            href="#forms/create"
            className="page-title-action"
            onClick={(e) => {
              e.preventDefault();
              navigate("forms/create");
            }}
          >
            {__("Create New Form", "kreebi-forms")}
          </a>
        )}
      </div>

      <hr className="wp-header-end" />

      <nav className="krefrm-tabs">
        <a
          href="#forms"
          className={`krefrm-tab ${isFormsActive ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("forms");
          }}
        >
          {__("Forms", "kreebi-forms")}
        </a>
        <a
          href="#submission"
          className={`krefrm-tab ${isSubmissionsActive ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            navigate("submission");
          }}
        >
          {__("Submissions", "kreebi-forms")}
        </a>
      </nav>

      <div className="krefrm-page-content">
        {isFormsActive && <FormsPage route={route} navigate={navigate} />}
        {isSubmissionsActive && <SubmissionsPage />}
      </div>
    </div>
  );
}
