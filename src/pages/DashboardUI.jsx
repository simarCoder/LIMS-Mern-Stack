import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Clock3,
  FileCheck2,
  FlaskConical,
  Search,
  Users,
  AlertCircle,
} from "lucide-react";

const stats = [
  {
    label: "Patients today",
    value: "128",
    note: "Illustrative demo metric",
    icon: Users,
    iconClass: "bg-teal-50 text-teal-700",
  },
  {
    label: "Samples collected",
    value: "96",
    note: "Illustrative demo metric",
    icon: FlaskConical,
    iconClass: "bg-blue-50 text-blue-700",
  },
  {
    label: "Tests in progress",
    value: "24",
    note: "Illustrative demo metric",
    icon: Activity,
    iconClass: "bg-amber-50 text-amber-700",
  },
  {
    label: "Reports completed",
    value: "72",
    note: "Illustrative demo metric",
    icon: FileCheck2,
    iconClass: "bg-emerald-50 text-emerald-700",
  },
];

function Status({ status }) {
  const style =
    status === "Report ready"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Processing"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";
  const Icon =
    status === "Report ready"
      ? CheckCircle2
      : status === "Processing"
        ? CircleDashed
        : Clock3;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${style}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

export default function DashboardUI({ patients = [], onNavigate }) {
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
  const recentPatients = [...patients].reverse().slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Overview
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Laboratory activity and patient workflow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <CalendarDays size={16} />
            {today}
          </span>
          <button
            type="button"
            onClick={() => onNavigate?.("Patients")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Users size={16} />
            Register patient
          </button>
        </div>
      </section>

      <section
        aria-label="Laboratory overview metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-600">
                  {stat.label}
                </div>
                <span
                  className={`grid h-10 w-10 place-items-center rounded-lg ${stat.iconClass}`}
                >
                  <Icon size={19} />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-slate-900">Recent patients</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest registrations from the patient register
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("Patients")}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              View all <ChevronRight size={16} />
            </button>
          </div>
          {recentPatients.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Patient ID</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPatients.map((patient, index) => (
                    <tr
                      key={patient.id ?? patient.patientId}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${["bg-teal-50 text-teal-700", "bg-blue-50 text-blue-700", "bg-amber-50 text-amber-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700"][index % 5]}`}
                          >
                            <Users size={16} />
                          </span>
                          <span className="font-medium text-slate-800">
                            {patient.honorific_title
                              ? `${patient.honorific_title} `
                              : ""}
                            {patient.patient_name || "Unnamed patient"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {patient.patientId || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {patient.patient_created_at
                          ? new Date(
                              patient.patient_created_at,
                            ).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Status status="Awaiting sample" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
                <Users size={21} />
              </span>
              <p className="mt-3 font-medium text-slate-800">
                No recent registrations
              </p>
              <p className="mt-1 text-sm text-slate-500">
                New patients will appear here after registration.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.("Patients")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Register patient
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
            <span>
              {patients.length} patient records loaded in this session
            </span>
            <button
              type="button"
              onClick={() => onNavigate?.("Patients")}
              className="font-semibold text-teal-700 hover:text-teal-800"
            >
              Open patient register{" "}
              <ArrowUpRight size={14} className="ml-1 inline" />
            </button>
          </div>
        </article>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                Workflow snapshot
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Illustrative demo metrics
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Demo
            </span>
          </div>
          <div className="mt-5 flex items-end gap-2">
            <strong className="text-4xl font-bold tracking-tight text-slate-900">
              96
            </strong>
            <span className="pb-1 text-sm text-slate-500">
              samples collected
            </span>
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="w-[58%] bg-emerald-500" />
            <span className="w-1/4 bg-amber-400" />
            <span className="flex-1 bg-slate-300" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Completed", value: "56", dot: "bg-emerald-500" },
              { label: "Processing", value: "24", dot: "bg-amber-400" },
              { label: "Pending", value: "16", dot: "bg-slate-300" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                <span className="text-slate-600">{item.label}</span>
                <strong className="ml-auto font-semibold text-slate-900">
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Demo data only
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Sample and test figures are placeholders until those modules
                  are connected.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("Tests")}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList size={16} />
            Open test queue
          </button>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            title: "Register patient",
            description: "Add a patient to the register.",
            icon: Users,
            page: "Patients",
            iconClass: "bg-teal-50 text-teal-700",
          },
          {
            title: "Collect sample",
            description: "Open the sample workflow.",
            icon: FlaskConical,
            page: "Samples",
            iconClass: "bg-blue-50 text-blue-700",
          },
          {
            title: "Find a test",
            description: "Open the test catalog.",
            icon: Search,
            page: "Tests",
            iconClass: "bg-violet-50 text-violet-700",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => onNavigate?.(action.page)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/30"
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${action.iconClass}`}
              >
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold text-slate-900">
                  {action.title}
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {action.description}
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-slate-400" />
            </button>
          );
        })}
      </section>
    </div>
  );
}
