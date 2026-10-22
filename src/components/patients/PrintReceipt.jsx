import { CheckCircle2, Printer, Plus } from "lucide-react";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(amount) || 0,
  );

export default function PrintReceipt({ receipt, onReset }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Workspace / Patients / Receipt
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Registration complete
          </h1>
          <p className="mt-1 text-sm text-emerald-700">
            <CheckCircle2 size={15} className="mr-1 inline" /> Patient and order
            saved successfully.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Printer size={16} /> Print receipt
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            <Plus size={16} /> New registration
          </button>
        </div>
      </div>

      <article
        id="patient-receipt"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"
      >
        <div className="border-b border-dashed border-slate-300 pb-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            Labora+ LIMS
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Patient Registration Receipt
          </h2>
          <p className="mt-1 text-sm text-slate-500">Laboratory test booking</p>
        </div>

        <div className="grid gap-4 border-b border-slate-100 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Receipt / Order no.</p>
            <p className="mt-1 font-bold text-slate-900">{receipt.order_no}</p>
          </div>
          <div>
            <p className="text-slate-500">Registration date</p>
            <p className="mt-1 font-medium text-slate-900">
              {receipt.created_at
                ? new Date(receipt.created_at).toLocaleString("en-IN")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Patient name</p>
            <p className="mt-1 font-semibold text-slate-900">
              {receipt.patient?.patient_name}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Patient ID</p>
            <p className="mt-1 font-medium text-slate-900">
              {receipt.patient?.patientId || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Age / Gender</p>
            <p className="mt-1 font-medium text-slate-900">
              {receipt.patient?.patient_age || "—"} ·{" "}
              {receipt.patient?.patient_gender || "—"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm mt-4">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-3 font-semibold">Test</th>
                <th className="px-3 py-3 font-semibold">Code</th>
                <th className="px-3 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items?.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {item.ht_name}
                    <span className="block text-xs text-slate-500">
                      {item.ht_heading || "Laboratory test"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{item.ht_code}</td>
                  <td className="px-3 py-3 text-right">
                    {currency(item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{currency(receipt.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Discount</span>
            <span>{currency(receipt.discount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>Total payable</span>
            <span>{currency(receipt.total)}</span>
          </div>
        </div>
      </article>

      <style>{`@media print { body * { visibility: hidden !important; } #patient-receipt, #patient-receipt * { visibility: visible !important; } #patient-receipt { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; } @page { margin: 12mm; } }`}</style>
    </div>
  );
}
