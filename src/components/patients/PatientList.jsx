import { Users, Search, RefreshCw, Pencil, Trash2 } from "lucide-react";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none";

export default function PatientList({
  patients,
  search,
  onSearchChange,
  onRefresh,
  isLoading,
  onEdit,
  onDelete,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
            <Users size={19} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">
              Patient Records ({patients.length})
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              placeholder="Search name, ID, phone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`${fieldClass} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-sm text-slate-500">
          Loading patients...
        </p>
      ) : patients.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                {[
                  "Patient",
                  "ID",
                  "Age/Gender",
                  "Phone",
                  "Registered",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="border-b px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-teal-50/40">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {p.honorific_title} {p.patient_name}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.patientId || "—"}</td>
                  <td className="px-4 py-3">
                    {p.patient_age} {p.patient_age_type} / {p.patient_gender}
                  </td>
                  <td className="px-4 py-3">{p.patient_phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {p.patient_created_at
                      ? new Date(p.patient_created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(p)}
                        className="rounded border px-2 py-1 text-xs hover:bg-white"
                      >
                        <Pencil size={13} className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 size={13} className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-slate-500">
          No patient records found.
        </p>
      )}
    </section>
  );
}
