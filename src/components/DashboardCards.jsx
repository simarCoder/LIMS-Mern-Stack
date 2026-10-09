function DashboardCard({ icon: Icon, title, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-(--bg-card) p-1 transition-colors hover:bg-(--bg-card-hover)">
      <div className="rounded-lg bg-(--blue-primary) p-3 text-primary-light">
        <Icon size={22} strokeWidth={1.8} />
      </div>

      <div>
        <p className="text-sm text-text-secondary">{title}</p>

        <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      </div>
    </div>
  );
}

export default DashboardCard;
