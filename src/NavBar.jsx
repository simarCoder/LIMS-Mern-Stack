import {
  LayoutDashboard,
  Users,
  FlaskConical,
  ClipboardList,
  Stethoscope,
  Package,
  Settings,
} from "lucide-react";

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
    <nav className="min-h-screen w-50 bg-(--bg-sidebar) p-3 align-center shadow-2xs m-3 rounded-2xl flex flex-col ">
      <div className="text-(--text-primary) text-3xl items-center text-center m-1">
        LIMS
      </div>
      <hr className="text-white m-1" />
      <ul>
        {navItems.map((item) => (
          <li
            key={item.name}
            onClick={() => setNavItem(item.name)}
            className=" m- p-2 shadow-black rounded-xl cursor-pointer text-(--text-primary) hover:bg-(--bg-card-hover)"
          >
            {item.icon} {item.name}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavBar;
