import { useState, useEffect } from "@wordpress/element";
import FormsPage from "./pages/FormsPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import StyleTemplatePage from "./pages/StyleTemplatePage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AddonsPage from "./pages/AddonsPage";
import UpgradePage from "./pages/UpgradePage";
import WelcomeEditorPage from "./pages/WelcomeEditorPage";
import PageHeader from "./components/header/PageHeader";
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
  if (hash === "welcome-editor") return "welcome-editor";
  if (hash.startsWith("integrations")) return hash;
  if (hash.startsWith("forms")) return hash.replace(/^forms\b/, "form");
  if (hash.startsWith("form")) return hash;
  if (hash.startsWith("submission")) return hash;
  return "form";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute);
  const showHeader = route !== "welcome-editor";

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (newHash) => {
    window.location.hash = newHash;
  };

  return (
    <div className="wrap krefrm-app">
      {showHeader && <PageHeader route={route} navigate={navigate} />}

      <div className="krefrm-page-content">
        {route === "welcome-editor" && (
          <WelcomeEditorPage navigate={navigate} />
        )}
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
  );
}
