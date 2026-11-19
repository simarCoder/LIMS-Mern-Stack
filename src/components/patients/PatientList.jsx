import { useState, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  X,
  Stethoscope,
} from "lucide-react";
import DateFilterBar, { isDateWithinRange } from "../common/DateFilterBar";

export default function PatientList({
  patients = [],
  search = "",
  onSearchChange,
  onRefresh,
  isLoading = false,
  onEdit,
  onDelete,
  onAddNew,
  onViewReceipt,
  onDiagnosis,
}) {
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [dateRange, setDateRange] = useState({ type: "all", fromDate: null, toDate: null });

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const dateVal = patient.patient_created_at || patient.created_at;
      if (!isDateWithinRange(dateVal, dateRange)) return false;
      return true;
    });
  }, [patients, dateRange]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100/80 text-teal-800">
              <Users size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Patient Directory ({filteredPatients.length})
              </h2>
            </div>
          </div>

          {/* Search & Refresh Actions */}
          <div className="flex items-center gap-3">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full sm:w-80"
            >
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name, PT ID, phone..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              ) : isLoading ? (
                <RefreshCw
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600"
                />
              ) : null}
            </form>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh patient list"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Date, Month & Custom Range Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3">
          <DateFilterBar
            range={dateRange}
            onRangeChange={setDateRange}
            totalCount={filteredPatients.length}
          />
        </div>
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-300 bg-slate-200/70 text-xs font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="px-2 py-2 whitespace-nowrap">Patient ID</th>
                <th className="px-3 py-2">Patient Name & Address</th>
                <th className="px-2 py-2">Age / Gender</th>
                <th className="px-2 py-2">Relation</th>
                <th className="px-3 py-2">Tests</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2 whitespace-nowrap">Sample Status</th>
                <th className="px-4 py-2">Registered</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-2 py-3.5">
                    <div className="h-4 w-12 rounded bg-slate-200" />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="h-4 w-36 rounded bg-slate-200 mb-1.5" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </td>
                  <td className="px-2 py-3.5">
                    <div className="h-4 w-16 rounded bg-slate-200" />
                  </td>
                  <td className="px-2 py-3.5">
                    <div className="h-3.5 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex gap-1">
                      <div className="h-4 w-10 rounded bg-teal-100/70" />
                      <div className="h-4 w-12 rounded bg-teal-100/70" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-24 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-16 rounded-full bg-slate-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <div className="h-8 w-8 rounded-lg bg-slate-100" />
                      <div className="h-8 w-8 rounded-lg bg-slate-100" />
                      <div className="h-8 w-8 rounded-lg bg-slate-100" />
                      <div className="h-8 w-8 rounded-lg bg-slate-100" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/60 py-3 text-xs font-semibold text-teal-700">
            <RefreshCw size={13} className="animate-spin text-teal-600" />
            <span>Fetching patient records from database...</span>
          </div>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-300 bg-slate-200/70 text-xs font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="px-2 py-2 whitespace-nowrap">Patient ID</th>
                <th className="px-3 py-2">Patient Name & Address</th>
                <th className="px-2 py-2">Age / Gender</th>
                <th className="px-2 py-2">Relation</th>
                <th className="px-3 py-2">Tests</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2 whitespace-nowrap">Sample Status</th>
                <th className="px-4 py-2">Registered</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPatients.map((p) => {
                const relationLabel = p.patient_relation || p.patient_Relation;
                const relationName =
                  p.patient_relation_name || p.patient_Relation_Name;

                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    {/* Patient ID Code */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-sm font-bold text-teal-800 font-mono">
                        {p.patientId || `P${p.id}`}
                      </span>
                    </td>
                    {/* Patient Name */}
                    <td className="px-5 py-4">
                      <div className="text-base font-bold text-slate-900">
                        {p.honorific_title ? `${p.honorific_title} ` : ""}
                        {p.patient_name}
                      </div>
                      {p.patient_address && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin
                            size={13}
                            className="shrink-0 text-slate-400"
                          />
                          <span className="truncate max-w-60">
                            {p.patient_address}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Age / Gender */}
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-800">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {p.patient_age} {p.patient_age_type}/
                        </span>
                        <span>{p.patient_gender}</span>
                      </div>
                    </td>

                    {/* Relation */}
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {relationLabel && relationName ? (
                        <span>
                          <strong className="text-slate-900 font-semibold">
                            {relationLabel}:
                          </strong>{" "}
                          {relationName}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Prescribed Tests (Codes Only) */}
                    <td className="px-3 py-3">
                      {p.test_codes && p.test_codes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {p.test_codes.map((code) => (
                            <span
                              key={code}
                              className="inline-block rounded-md bg-teal-50 border border-teal-200/80 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-teal-800 uppercase shadow-2xs"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">
                      {p.patient_phone ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <Phone size={12} className="text-slate-400" />
                          {p.patient_phone}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No phone</span>
                      )}
                      {p.patient_email && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail size={11} className="text-slate-400" />
                          <span className="truncate max-w-36">
                            {p.patient_email}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Sample Verification Status */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {p.sample_collected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 font-mono">
                      {p.patient_created_at
                        ? new Date(p.patient_created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>

                    {/* Actions: Icon-Only for Maximum Breathability */}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Receipt Icon */}
                        <button
                          type="button"
                          onClick={() => onViewReceipt?.(p)}
                          title="View / Print Receipt"
                          aria-label="View Receipt"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 transition-all hover:bg-teal-600 hover:text-white hover:shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <FileText size={14} />
                        </button>

                        {/* Diagnosis Icon */}
                        <button
                          type="button"
                          onClick={() => onDiagnosis?.(p)}
                          title="Open Diagnostic Workspace"
                          aria-label="Diagnosis"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Stethoscope size={14} />
                        </button>

                        {/* Edit Icon */}
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          title="Edit Patient Details"
                          aria-label="Edit Patient"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete Icon */}
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(p)}
                          title="Delete Patient Record"
                          aria-label="Delete Patient"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-white text-rose-600 transition-all hover:bg-rose-600 hover:text-white hover:shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Users size={28} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            {search ? "No matching patients" : "No registered patients"}
          </h3>
          {onAddNew && !search && (
            <button
              type="button"
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 shadow-sm cursor-pointer"
            >
              Register First Patient
            </button>
          )}
        </div>
      )}

      {/* Accessible In-App Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-100 text-rose-700">
                <Trash2 size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Archive Patient Record
                </h3>
              </div>
            </div>

            <p className="mt-4 text-base text-slate-700">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900">
                {deleteCandidate.patient_name}
              </strong>{" "}
              ({deleteCandidate.patientId})?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deleteCandidate;
                  setDeleteCandidate(null);
                  onDelete(target);
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
