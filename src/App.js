import { useState, useEffect } from "@wordpress/element";
import FormsPage from "./pages/forms/FormsPage";
import SubmissionsPage from "./pages/submissions/SubmissionsPage";
import StyleTemplatePage from "./pages/styles/StyleTemplatePage";
import IntegrationsPage from "./pages/integrations/IntegrationsPage";
import AddonsPage from "./pages/addons/AddonsPage";
import UpgradePage from "./pages/upgrade/UpgradePage";
import PageHeader from "./components/header/PageHeader";
import { ToastProvider } from "./components/Toast";
import "./style.css";

function getHashRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return "form";
  if (hash === "dashboard") {
    return window.krefrmDashEnabled ? "dashboard" : "form";
  }
  if (hash === "addons") return "addons";
  if (hash === "upgrade-to-pro") return "upgrade-to-pro";
  if (hash === "style-templates") return "style-templates";
  if (hash.startsWith("integrations")) return hash;
  if (hash.startsWith("forms")) return hash.replace(/^forms\b/, "form");
  if (hash.startsWith("form")) return hash;
  if (hash.startsWith("submission")) return hash;
  return "form";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);
  const showHeader = true;

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (newHash) => {
    window.location.hash = newHash;
  };

  const pageId = route.startsWith("form")
    ? "kreebi-form-form"
    : route.startsWith("submission")
    ? "kreebi-form-submission"
    : route === "addons"
    ? "kreebi-form-addons"
    : route === "style-templates"
    ? "kreebi-form-style-templates"
    : route.startsWith("integrations")
    ? "kreebi-form-integrations"
    : route === "upgrade-to-pro"
    ? "kreebi-form-upgrade-to-pro"
    : route === "dashboard"
    ? "kreebi-form-dashboard"
    : "kreebi-form-form";

  return (
    <ToastProvider>
      <div className="krefrm-app">
        {showHeader && <PageHeader route={route} navigate={navigate} />}

        <div id={pageId} className="krefrm-page-shell krefrm-page-content">
          {route === "dashboard" && <div id="krefrm-dashboard-root" />}
          {route.startsWith("form") && (
            <FormsPage route={route} navigate={navigate} />
          )}
          {route.startsWith("submission") && <SubmissionsPage />}
          {route === "addons" && <AddonsPage navigate={navigate} />}
          {route === "style-templates" && <StyleTemplatePage />}
          {route.startsWith("integrations") && (
            <IntegrationsPage route={route} navigate={navigate} />
          )}
          {route === "upgrade-to-pro" && <UpgradePage />}
        </div>
      </div>
    </ToastProvider>
  );
}
