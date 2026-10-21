import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  ClipboardList,
  Stethoscope,
  Wallet,
  Settings,
  ChevronLeft,
  Microscope,
  Pin,
} from "lucide-react";
import NavItem from "../components/NavItem.jsx";

const primaryItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Patients", icon: Users },
  { name: "Samples", icon: FlaskConical },
  { name: "Tests", icon: ClipboardList },
  { name: "Diagnosis", icon: Stethoscope },
  { name: "Collection", icon: Wallet },
];

export default function NavBar({
  activeItem,
  setNavItem,
  collapsed,
  onToggleCollapse,
}) {
  const [hovered, setHovered] = useState(false);
  const isCollapsed = collapsed && !hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setHovered(false);
      }}
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-y-auto border-r border-white/10 bg-[#122b49] text-slate-200 transition-[width] duration-200 ease-out ${
        isCollapsed ? "w-18" : "w-60 shadow-2xl"
      }`}
    >
      <div
        className={`flex h-16 shrink-0 items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"}`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500 text-white shadow-sm shadow-black/20">
          <Microscope size={22} strokeWidth={2} />
        </span>
        {!isCollapsed && (
          <span className="min-w-0">
            <span className="block text-xl font-extrabold leading-none tracking-tight text-white">
              labora<span className="text-teal-300">+</span>
            </span>
            <span className="mt-1 block text-[9px] font-bold tracking-[0.2em] text-slate-400">
              LAB MANAGEMENT
            </span>
          </span>
        )}
      </div>

      {!isCollapsed && (
        <p className="px-5 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
      )}
      <nav aria-label="Main navigation" className="px-2">
        <ul className="space-y-1">
          {primaryItems.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={activeItem === item.name}
              collapsed={isCollapsed}
              onClick={() => setNavItem(item.name)}
            />
          ))}
        </ul>
      </nav>

      <div className="flex-1" />
      {!isCollapsed && (
        <div className="mx-3 mb-4 rounded-xl border border-white/10 bg-white/4 p-3">
          <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-teal-500/15 text-teal-300">
            <FlaskConical size={17} />
          </div>
          <p className="text-xs font-semibold text-white">Lab workflow</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Patients, samples and reports in one workspace.
          </p>
        </div>
      )}

      <div className="space-y-1 border-t border-white/10 p-2">
        <NavItem
          item={{ name: "Settings", icon: Settings }}
          active={activeItem === "Settings"}
          collapsed={isCollapsed}
          onClick={() => setNavItem("Settings")}
        />
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Pin sidebar open" : "Collapse sidebar"}
          aria-label={collapsed ? "Pin sidebar open" : "Collapse sidebar"}
          className={`flex min-h-10 w-full items-center rounded-lg px-3 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${isCollapsed ? "justify-center" : "gap-3"}`}
        >
          {collapsed ? (
            <Pin size={17} />
          ) : (
            <>
              <ChevronLeft size={17} />
              <span className="text-xs">Collapse sidebar</span>
            </>
          )}
        </button>
        {!isCollapsed && (
          <p className="px-3 pb-1 text-[10px] text-slate-500">
            Hover to expand when collapsed
          </p>
        )}
      </div>
    </aside>
  );
}
