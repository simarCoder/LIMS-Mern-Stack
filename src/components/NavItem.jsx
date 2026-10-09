function NavItem({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[1.1em] transition-colors ${
        active
          ? "bg-blue-950 text-blue-300"
          : "text-slate-400 hover:bg-stone-600 hover:text-slate-100"
      }`}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{item.name}</span>
    </button>
  );
}

export default NavItem;
