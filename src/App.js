import { useState, useEffect } from "@wordpress/element";
import DashboardPage from "./pages/DashboardPage";
import FormsPage from "./pages/FormsPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import StyleTemplatePage from "./pages/StyleTemplatePage";
import IntegrationsPage from "./pages/IntegrationsPage";
import UpgradePage from "./pages/UpgradePage";
import PageHeader from "./components/header/PageHeader";
import "./style.css";

function getHashRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash || hash === "dashboard") return "dashboard";
  if (hash === "upgrade-to-pro") return "upgrade-to-pro";
  if (hash === "style-templates") return "style-templates";
  if (hash.startsWith("integrations")) return hash;
  if (hash.startsWith("forms")) return hash.replace(/^forms\b/, "form");
  if (hash.startsWith("form")) return hash;
  if (hash.startsWith("submission")) return hash;
  return "dashboard";
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

  return (
    <div className="wrap krefrm-app">
      <PageHeader route={route} navigate={navigate} />

      <div className="krefrm-page-content">
        {route === "dashboard" && <DashboardPage navigate={navigate} />}
        {route.startsWith("form") && (
          <FormsPage route={route} navigate={navigate} />
        )}
        {route.startsWith("submission") && <SubmissionsPage />}
        {route === "style-templates" && <StyleTemplatePage />}
        {route.startsWith("integrations") && (
          <IntegrationsPage route={route} navigate={navigate} />
        )}
        {route === "upgrade-to-pro" && <UpgradePage />}
      </div>
    </div>
  );
}
