import { useState } from "react";
import { ChevronRight, Microscope } from "lucide-react";
import NavBar from "./pages/NavBar.jsx";
import DashboardUI from "./pages/DashboardUI.jsx";
import Patients from "./components/Patients.jsx";
import Tests from "./components/Tests.jsx";
import "./styles/index.css";

const modules = ["Samples", "Diagnosis", "Collection", "Settings"];

export default function App() {
  const [navItem, setNavItem] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [patients, setPatients] = useState([]);

  function renderPage() {
    if (navItem === "Dashboard")
      return <DashboardUI patients={patients} onNavigate={setNavItem} />;
    if (navItem === "Patients")
      return <Patients patients={patients} setPatients={setPatients} />;
    if (navItem === "Tests") return <Tests />;

    if (modules.includes(navItem)) {
      return (
        <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Workspace / {navItem}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {navItem}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            This module has not been implemented yet.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Module
            placeholder
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <NavBar
        activeItem={navItem}
        setNavItem={setNavItem}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="ml-18 flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-400 sm:inline">Workspace</span>
            <ChevronRight
              className="hidden text-slate-300 sm:block"
              size={15}
            />
            <strong className="truncate font-semibold text-slate-800">
              {navItem}
            </strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />{" "}
              Development
            </span>
            <button
              type="button"
              aria-label="Administrator profile"
              title="Administrator"
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-slate-900 text-xs font-bold text-white"
            >
              A
            </button>
          </div>
        </header>
        <div className="w-full flex-1 p-4 sm:p-6 lg:p-7" key={navItem}>
          {renderPage()}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2">
            <Microscope size={14} className="text-teal-700" /> Labora+ LIMS
          </span>
          <span>Development environment · Use fictional patient data</span>
        </footer>
      </main>
    </div>
  );
}
