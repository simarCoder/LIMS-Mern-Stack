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
  LogOut,
  User as UserIcon,
  Shield,
  Code2,
} from "lucide-react";
import NavItem from "../components/NavItem.jsx";

const primaryItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Patients", path: "/patients", icon: Users },
  { name: "Samples", path: "/samples", icon: FlaskConical },
  { name: "Tests", path: "/tests", icon: ClipboardList },
  { name: "Diagnosis", path: "/diagnosis", icon: Stethoscope },
  { name: "Collection", path: "/collection", icon: Wallet },
];

export default function NavBar({
  activePage,
  navigateTo,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
}) {
  const [hovered, setHovered] = useState(false);
  const isCollapsed = collapsed && !hovered;

  const role = (user?.role || "user").toLowerCase();

  // Role badges configuration
  const roleBadges = {
    developer: {
      label: "DEVELOPER",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      icon: Code2,
    },
    admin: {
      label: "ADMIN",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: Shield,
    },
    user: {
      label: "USER",
      color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      icon: UserIcon,
    },
  };

  const currentBadge = roleBadges[role] || roleBadges.user;
  const RoleIcon = currentBadge.icon;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHovered(false);
        }
      }}
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-y-auto border-r border-white/10 bg-[#122b49] text-slate-200 transition-[width] duration-200 ease-out ${
        isCollapsed ? "w-18" : "w-64 shadow-2xl"
      }`}
    >
      {/* Top Header Branding */}
      <div
        className={`flex h-16 shrink-0 items-center ${
          isCollapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
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
              {user?.lab_code ? `${user.lab_code} · LIMS` : "LAB MANAGEMENT"}
            </span>
          </span>
        )}
      </div>

      {/* Navigation Group Header */}
      {!isCollapsed && (
        <p className="px-5 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
      )}

      {/* Primary Navigation List */}
      <nav aria-label="Main navigation" className="px-2">
        <ul className="space-y-1">
          {primaryItems.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={activePage === item.name}
              collapsed={isCollapsed}
              onClick={() => navigateTo(item.path)}
            />
          ))}
        </ul>
      </nav>

      <div className="flex-1" />

      {/* User Role Card in Navigation */}
      {user && (
        <div className="mx-2 mb-2">
          {!isCollapsed ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-white">
                      {user.display_name || user.username}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">
                    @{user.username}
                  </div>
                </div>

                {/* Role Badge (Developer / Admin / User) */}
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${currentBadge.color}`}
                >
                  <RoleIcon size={11} strokeWidth={2.5} />
                  <span>{currentBadge.label}</span>
                </span>
              </div>

              {/* Lab Affiliation */}
              {user.lab_name && (
                <div className="mt-2 truncate text-[10px] font-medium text-slate-400 border-t border-white/10 pt-1.5">
                  {user.lab_name}
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex justify-center p-2"
              title={`${user.display_name} (${currentBadge.label})`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl border ${currentBadge.color}`}
              >
                <RoleIcon size={16} />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Settings, Collapse and Logout Bar */}
      <div className="space-y-1 border-t border-white/10 p-2">
        <NavItem
          item={{ name: "Settings", icon: Settings }}
          active={activePage === "Settings"}
          collapsed={isCollapsed}
          onClick={() => navigateTo("/settings")}
        />

        {/* Logout Button */}
        {user && (
          <li>
            <button
              type="button"
              onClick={onLogout}
              title={isCollapsed ? "Sign Out" : undefined}
              className={`group flex min-h-10 w-full items-center rounded-lg px-3 text-left transition-colors hover:bg-rose-500/15 hover:text-rose-300 text-slate-400 cursor-pointer ${
                isCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <LogOut size={17} className="shrink-0 text-slate-400 group-hover:text-rose-400" />
              {!isCollapsed && (
                <span className="text-[13px] font-medium text-slate-300 group-hover:text-rose-300">
                  Sign Out
                </span>
              )}
            </button>
          </li>
        )}

        {/* Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Pin sidebar open" : "Collapse sidebar"}
          aria-label={collapsed ? "Pin sidebar open" : "Collapse sidebar"}
          className={`flex min-h-10 w-full items-center rounded-lg px-3 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
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
      </div>
    </aside>
  );
}
