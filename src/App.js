import { useState, useEffect } from "@wordpress/element";
import FormsPage from "./pages/FormsPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import UpgradePage from "./pages/UpgradePage";
import PageHeader from "./components/header/PageHeader";
import NavTabs from "./components/header/NavTabs";
import "./style.css";

function getHashRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "upgrade-to-pro") return "upgrade-to-pro";
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

  return (
    <div className="wrap krefrm-app">
      <PageHeader route={route} navigate={navigate} />
      <NavTabs route={route} navigate={navigate} />

      <div className="krefrm-page-content">
        {route.startsWith("forms") && (
          <FormsPage route={route} navigate={navigate} />
        )}
        {route === "submission" && <SubmissionsPage />}
        {route === "upgrade-to-pro" && <UpgradePage />}
      </div>
    </div>
  );
}
