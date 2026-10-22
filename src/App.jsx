import { useState } from "react";
import NavBar from "./pages/NavBar.jsx";
import DashboardUI from "./pages/DashboardUI.jsx";
import PatientsPage from "./pages/PatientsPage.jsx";
import Tests from "./components/Tests.jsx";
import Diagnosis from "./components/Diagnosis.jsx";

export default function App() {
  const [navItem, setNavItem] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [patients, setPatients] = useState([]);

  function renderPage() {
    switch (navItem) {
      case "Dashboard":
        return <DashboardUI patients={patients} onNavigate={setNavItem} />;
      case "Patients":
        return <PatientsPage patients={patients} setPatients={setPatients} />;
      case "Tests":
        return <Tests />;
      case "Diagnosis":
        return <Diagnosis />;
      default:
        return (
          <div className="p-8 text-slate-500 font-semibold">
            Module {navItem} in development.
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <NavBar
        activeItem={navItem}
        setNavItem={setNavItem}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="ml-18 flex-1 p-6">{renderPage()}</main>
    </div>
  );
}
