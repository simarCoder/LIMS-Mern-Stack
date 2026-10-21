export default function NavItem({ item, active, onClick, collapsed = false }) {
  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.name : undefined}
        className={`group relative flex min-h-11 w-full items-center rounded-lg px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${collapsed ? "justify-center" : "gap-3"} ${active ? "bg-teal-500/20 text-white" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}
      >
        {active && (
          <span className="absolute -left-2 top-2.5 h-6 w-1 rounded-r-full bg-teal-400" />
        )}
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center ${active ? "text-teal-300" : "text-slate-400 group-hover:text-slate-100"}`}
        >
          <Icon size={19} strokeWidth={1.9} />
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
            {item.name}
          </span>
        )}
      </button>
    </li>
  );
}
