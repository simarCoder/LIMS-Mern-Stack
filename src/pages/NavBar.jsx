import {
  LayoutDashboard,
  Users,
  FlaskConical,
  ClipboardList,
  Stethoscope,
  Package,
  Settings,
} from "lucide-react";

import NavItem from "../components/NavItem";

function NavBar({ setNavItem }) {
  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Patients",
      icon: Users,
    },
    {
      name: "Samples",
      icon: FlaskConical,
    },
    {
      name: "Tests",
      icon: ClipboardList,
    },
    {
      name: "Diagnosis",
      icon: Stethoscope,
    },
    {
      name: "Collection",
      icon: Package,
    },
    {
      name: "Settings",
      icon: Settings,
    },
  ];
  return (
    <nav
      className="min-h-screen bg-(--bg-sidebar) p-2 align-center shadow-2xs m-3 rounded-2xl flex flex-col "
      id="navBar"
    >
      <div className="text-(--text-primary) text-3xl items-center text-center m-1">
        LIMS
      </div>
      <hr className="text-white m-2" />
      <ul>
        {navItems.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            active={NavItem === item.name}
            onClick={() => setNavItem(item.name)}
          />
        ))}
      </ul>
    </nav>
  );
}

export default NavBar;
