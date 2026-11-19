import { useMemo } from "react";
import {
  Users,
  CalendarDays,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Phone,
  Clock,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

/**
 * Modern, Minimalist Laboratory Dashboard
 * Displays live patient volume, daily registrations, and recent patient activity.
 */
export default function DashboardUI({ patients = [], onNavigate }) {
  // Current date formatted in a readable format
  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Today's date string in YYYY-MM-DD for comparison
  const todayIso = new Date().toISOString().slice(0, 10);

  // Compute live clinical metrics from real patient records
  const metrics = useMemo(() => {
    const totalPatients = patients.length;

    // Count patients registered today
    const registeredToday = patients.filter((p) => {
      if (!p.patient_created_at) return false;
      return p.patient_created_at.startsWith(todayIso);
    }).length;

    // Gender breakdown
    const maleCount = patients.filter(
      (p) => (p.patient_gender || "").toLowerCase() === "male"
    ).length;
    const femaleCount = patients.filter(
      (p) => (p.patient_gender || "").toLowerCase() === "female"
    ).length;
    const othersCount = totalPatients - maleCount - femaleCount;

    return {
      total: totalPatients,
      today: registeredToday,
      male: maleCount,
      female: femaleCount,
      others: othersCount,
    };
  }, [patients, todayIso]);

  // Recent patients list (ordered newest first, take top 6)
  const recentPatients = useMemo(() => {
    return [...patients].slice(0, 6);
  }, [patients]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* Top Welcome & Navigation Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Current Date Display */}
          <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-2xs">
            <CalendarDays size={14} className="text-teal-600" />
            <span>{todayFormatted}</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.("/diagnosis")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Stethoscope size={14} className="text-teal-700" />
            <span>Diagnosis</span>
          </button>

          {/* Quick Register CTA */}
          <button
            type="button"
            onClick={() => onNavigate?.("Patients", "new")}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Register Patient</span>
          </button>
        </div>
      </section>

      {/* Live Statistics Cards Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Registered Patients */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Patients
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {metrics.total}
          </div>
        </article>

        {/* Metric 2: Registered Today */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Registered Today
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {metrics.today}
          </div>
        </article>

        {/* Metric 3: Gender Distribution (Male) */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Male Patients
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {metrics.male}
          </div>
        </article>

        {/* Metric 4: Gender Distribution (Female / Other) */}
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Female Patients
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-700">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {metrics.female}
          </div>
        </article>
      </section>

      {/* Main Content Area: Recent Patients Census Table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Registrations</h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.("Patients", "list")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 transition hover:text-teal-800 cursor-pointer"
          >
            <span>View All Patients</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {recentPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-4 py-3.5">Accession ID</th>
                  <th className="px-4 py-3.5">Age / Gender</th>
                  <th className="px-4 py-3.5">Mobile Phone</th>
                  <th className="px-4 py-3.5">Registered Time</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPatients.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-slate-50/70">
                    {/* Patient Name */}
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {patient.honorific_title ? `${patient.honorific_title} ` : ""}
                        {patient.patient_name}
                      </div>
                      {patient.patient_relation && patient.patient_relation_name && (
                        <div className="text-[11px] text-slate-500">
                          {patient.patient_relation}: {patient.patient_relation_name}
                        </div>
                      )}
                    </td>

                    {/* Patient ID Code */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                        {patient.patientId || `P${patient.id}`}
                      </span>
                    </td>

                    {/* Age / Gender */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-700">
                      <span>{patient.patient_age} {patient.patient_age_type}</span>
                      <span className="text-slate-400"> · </span>
                      <span>{patient.patient_gender}</span>
                    </td>

                    {/* Phone */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">
                      {patient.patient_phone ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Phone size={11} className="text-slate-400" />
                          {patient.patient_phone}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Registered Date / Time */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                      {patient.patient_created_at
                        ? new Date(patient.patient_created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>

                    {/* Status Badge */}
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <Users size={24} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-800">No Patient Records</h3>
            <button
              type="button"
              onClick={() => onNavigate?.("Patients", "new")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Register Patient</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
