function NavBar({ setNavItem }) {
  const navItems = [
    "Dashboard",
    "Patients",
    "Samples",
    "Tests",
    "Diagnosis",
    "Collection",
    "Settings",
  ];
  return (
    <nav className="min-h-screen w-40 bg-emerald-300 p justify-center ">
      <div>LIMS</div>
      <ul>
        {navItems.map((items) => (
          <li
            key={items}
            onClick={() => setNavItem(items)}
            className="bg-fuchsia-300 m-2 p-2 shadow-2xl shadow-black border-2 border-fuchsia-950 rounded-xl cursor-pointer"
          >
            {items}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavBar;
