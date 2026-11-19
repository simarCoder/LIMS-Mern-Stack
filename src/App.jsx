import { useState, useEffect, useCallback } from "react";
import NavBar from "./pages/NavBar.jsx";
import DashboardUI from "./pages/DashboardUI.jsx";
import PatientsPage from "./pages/PatientsPage.jsx";
import Tests from "./components/Tests.jsx";
import Diagnosis from "./components/Diagnosis.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { fetchPatients } from "./services/api.js";
import { useRouting } from "./hooks/useRouting.js";
import { useAuth } from "./hooks/useAuth.js";
import { Microscope } from "lucide-react";

export default function App() {
  const { route, navigateTo, page } = useRouting();
  const { user, isAuthenticated, loading: authLoading, login, logout, authError } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [patients, setPatients] = useState([]);

  // Ensure unauthenticated users are directed to /login in the browser URL bar
  useEffect(() => {
    if (!authLoading && !isAuthenticated && window.location.pathname !== "/login") {
      navigateTo("/login", true);
    }
  }, [authLoading, isAuthenticated, navigateTo]);

  // Fetch live patient records once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    fetchPatients()
      .then((data) => {
        if (active && Array.isArray(data)) {
          setPatients(data);
        }
      })
      .catch((err) => {
        console.warn("Patient load deferred:", err.message);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Clean logout action that clears session and immediately redirects URL to /login
  const handleLogout = useCallback(async () => {
    await logout();
    navigateTo("/login", true);
  }, [logout, navigateTo]);

  // Handle Dashboard navigation bridging paths or (page, sub)
  function handleDashboardNavigate(target, sub = "list") {
    if (typeof target === "string" && target.startsWith("/")) {
      navigateTo(target);
    } else if (target === "Patients") {
      if (sub === "new") {
        navigateTo("/patients/new");
      } else {
        navigateTo("/patients");
      }
    } else {
      navigateTo("/");
    }
  }

  // 1. Initial Authentication Check Loader
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#07080a] text-zinc-200">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/20 animate-pulse border border-teal-400/30">
          <Microscope size={36} />
        </div>
        <p className="mt-4 text-xs font-bold tracking-widest uppercase text-zinc-500">
          Loading Laboratory Workspace...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Login Screen
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={async (labCode, username, password) => {
          await login(labCode, username, password);
          navigateTo(window.location.pathname === "/login" ? "/" : window.location.pathname);
        }}
        authError={authError}
      />
    );
  }

  // 3. Authenticated -> Render Full Application with Routing & Navigation
  function renderRoutedPage() {
    switch (page) {
      case "Dashboard":
        return <DashboardUI patients={patients} onNavigate={handleDashboardNavigate} />;
      case "Patients":
        return (
          <PatientsPage
            patients={patients}
            setPatients={setPatients}
            route={route}
            navigateTo={navigateTo}
          />
        );
      case "Tests":
        return <Tests user={user} />;
      case "Diagnosis":
        return <Diagnosis route={route} navigateTo={navigateTo} user={user} />;
      case "Settings":
        return <SettingsPage user={user} onNavigate={navigateTo} />;
      case "Samples":
      case "Collection":
      default:
        return (
          <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
            <h2 className="text-lg font-bold text-slate-800">
              Module: {page}
            </h2>
            <button
              type="button"
              onClick={() => navigateTo("/")}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition"
            >
              Dashboard
            </button>
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 font-sans">
      <NavBar
        activePage={page}
        navigateTo={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        user={user}
        onLogout={handleLogout}
      />
      <main className="ml-18 flex-1 p-3 md:p-4 overflow-x-hidden transition-all">
        {renderRoutedPage()}
      </main>
    </div>
  );
}
