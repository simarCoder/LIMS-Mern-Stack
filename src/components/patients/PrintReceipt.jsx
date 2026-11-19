import {
  Printer,
  Plus,
  FlaskConical,
  MapPin,
  Phone,
  Mail,
  FileText,
  TestTube2,
} from "lucide-react";
import { defaultReceiptConfig } from "./receiptConfig";

export default function PrintReceipt({
  receipt,
  onReset,
  onOpenSpecimenModal,
  config = defaultReceiptConfig,
}) {
  const { facility, titles, labels, footer, layout, styling } = config;

  // Currency formatter based on layout configuration (uses non-breaking space \u00A0 so symbol and amount never split)
  const formatMoney = (val) =>
    `${layout.currencySymbol}\u00A0${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Patient object normalization
  const patient = receipt.patient || {};
  const items = receipt.items || [];
  const hasItems = items.length > 0;

  // Normalized Receipt Number (e.g. R1, R2, R1203)
  const receiptNumber =
    receipt.order_no ||
    (receipt.id ? `R${receipt.id}` : "R1");

  return (
    <div className="mx-auto flex flex-col items-center space-y-3 pb-8">
      {/* Action Bar (Hidden during print) */}
      <div
        className="w-full flex flex-wrap items-center justify-between gap-3 print:hidden px-1"
        style={{ maxWidth: styling.receiptWidth }}
      >
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Receipt Generated
          </h1>
          <p className="text-xs text-slate-500">
            Receipt #{receiptNumber} · Fits Half-A4 sheet (100% scale)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSpecimenModal && (
            <button
              type="button"
              onClick={onOpenSpecimenModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
            >
              <TestTube2 size={14} />
              <span>Sample Tubes</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Registration</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* PRINTABLE RECEIPT CARD — 1:1 WYSIWYG for Screen & Print          */}
      {/* ================================================================ */}
      <article
        id="patient-receipt"
        className="w-full rounded-md border border-slate-300 bg-white shadow-xs text-slate-900 print:border-none print:shadow-none"
        style={{
          maxWidth: styling.receiptWidth,
          padding: "8px 12px",
          fontSize: styling.baseFontSize,
          boxSizing: "border-box",
        }}
      >
        {/* HEADER: Laboratory Branding & Contact Bar */}
        <div
          className="border-b border-slate-900 text-center"
          style={{ paddingBottom: styling.headerPaddingBottom }}
        >
          <div className="flex items-center justify-center gap-2">
            {layout.showFacilityLogo && (
              <span className="grid h-6 w-6 place-items-center rounded bg-teal-600 text-white shrink-0 print:bg-black">
                <FlaskConical size={14} />
              </span>
            )}
            <h2
              className="font-black uppercase tracking-tight text-slate-900"
              style={{ fontSize: styling.titleFontSize }}
            >
              {facility.name}
            </h2>
          </div>

          <div
            className="mt-0.5 flex flex-wrap items-center justify-center gap-x-3 text-slate-600 font-medium"
            style={{ fontSize: styling.subtitleFontSize }}
          >
            {layout.showAddress && facility.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} className="text-slate-400 print:hidden" />
                <span>{facility.address}</span>
              </span>
            )}
            {layout.showPhone && facility.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={11} className="text-slate-400 print:hidden" />
                <span>Ph: {facility.phone}</span>
              </span>
            )}
            {layout.showEmail && facility.email && (
              <span className="inline-flex items-center gap-1">
                <Mail size={11} className="text-slate-400 print:hidden" />
                <span>{facility.email}</span>
              </span>
            )}
          </div>

          <div className="mt-1 text-center font-bold tracking-wider text-slate-800 uppercase text-[10px]">
            {titles.receiptHeading || "RECEIPT"}
          </div>
        </div>

        {/* PATIENT DEMOGRAPHICS — 2 x 4 Grid System (Colon Aligned) */}
        <div
          className="rounded border border-slate-300 bg-white"
          style={{
            marginTop: styling.sectionMarginTop,
            padding: styling.demographicsPadding,
            fontSize: styling.demographicsFontSize,
          }}
        >
          <div
            className="grid grid-cols-2 gap-x-4"
            style={{ rowGap: styling.demographicsRowGap }}
          >
            {/* Row 1 */}
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-24 shrink-0">
                {labels.receiptNo} :
              </span>
              <span className="font-mono font-bold text-slate-900 truncate">
                {receiptNumber}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-36 shrink-0">
                {labels.bookingDate} :
              </span>
              <span className="font-medium text-slate-800 truncate">
                {receipt.created_at
                  ? new Date(receipt.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—"}
              </span>
            </div>

            {/* Row 2 */}
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-24 shrink-0">
                {labels.patientName} :
              </span>
              <span className="font-bold text-slate-900 truncate">
                {patient.honorific_title ? `${patient.honorific_title} ` : ""}
                {patient.patient_name || "—"}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-36 shrink-0">
                {labels.ageGender} :
              </span>
              <span className="font-medium text-slate-800 truncate">
                {patient.patient_age} {patient.patient_age_type} /{" "}
                {patient.patient_gender}
              </span>
            </div>

            {/* Row 3 */}
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-24 shrink-0">
                {labels.patientId} :
              </span>
              <span className="font-mono font-bold text-teal-800 print:text-black truncate">
                {patient.patientId || `P${patient.id || "—"}`}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-36 shrink-0">
                {labels.sampleDate} :
              </span>
              <span className="font-medium text-slate-800 truncate">
                {receipt.sample_collected || receipt.patient?.sample_collected
                  ? receipt.created_at
                    ? new Date(receipt.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : labels.sampleCollectedBadge
                  : labels.samplePendingBadge}
              </span>
            </div>

            {/* Row 4 */}
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-24 shrink-0">
                {labels.referringDoctor} :
              </span>
              <span className="font-medium text-slate-800 truncate">
                {labels.defaultDoctor || "Self / Dr. On Call"}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="font-semibold text-slate-600 w-36 shrink-0">
                {labels.relation} :
              </span>
              <span className="font-medium text-slate-800 truncate">
                {patient.patient_relation && patient.patient_relation_name
                  ? `${patient.patient_relation}: ${patient.patient_relation_name}`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Optional Specimen Tubes Summary */}
          {receipt.specimens && receipt.specimens.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-300 flex items-center gap-1.5 flex-wrap text-[10.5px]">
              <span className="font-semibold text-slate-700 shrink-0">Tubes / Specimens:</span>
              {receipt.specimens.map((spec, sIdx) => (
                <span
                  key={sIdx}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200 font-mono text-[9.5px] text-slate-800"
                >
                  <span
                    className="h-2 w-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: spec.tubeDef?.capColor || "#a855f7" }}
                  />
                  <span>{spec.specimenName || spec.tube_type}</span>
                  {spec.quantity > 1 && <span className="font-bold">x{spec.quantity}</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* INVESTIGATION ITEMS TABLE */}
        {hasItems ? (
          <div
            className="overflow-x-auto"
            style={{ marginTop: styling.sectionMarginTop }}
          >
            <table
              className="w-full text-left"
              style={{ fontSize: styling.tableFontSize }}
            >
              <thead className="border-b border-t border-slate-900 bg-slate-50 font-bold uppercase tracking-wider text-slate-800 print:bg-white">
                <tr>
                  <th
                    className="w-10 text-center"
                    style={{ padding: styling.tableHeaderPadding }}
                  >
                    {labels.colIndex}
                  </th>
                  <th style={{ padding: styling.tableHeaderPadding }}>
                    {labels.colTestName}
                  </th>
                  {layout.showItemCode && (
                    <th
                      className="w-20"
                      style={{ padding: styling.tableHeaderPadding }}
                    >
                      {labels.colCode}
                    </th>
                  )}
                  {layout.showDepartmentColumn && (
                    <th
                      className="w-28"
                      style={{ padding: styling.tableHeaderPadding }}
                    >
                      {labels.colDepartment}
                    </th>
                  )}
                  <th
                    className="w-24 text-right"
                    style={{ padding: styling.tableHeaderPadding }}
                  >
                    {labels.colAmount}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td
                      className="text-center text-slate-500 font-mono"
                      style={{ padding: styling.tableRowPadding }}
                    >
                      {idx + 1}
                    </td>
                    <td style={{ padding: styling.tableRowPadding }}>
                      <span className="font-semibold text-slate-900">
                        {item.ht_name || item.name}
                      </span>
                      {layout.showSubtestCount &&
                        item.sub_tests &&
                        item.sub_tests.length > 0 && (
                          <span className="block text-[9.5px] text-slate-500">
                            {item.sub_tests.length} parameters included
                          </span>
                        )}
                    </td>
                    {layout.showItemCode && (
                      <td
                        className="font-mono text-xs uppercase text-slate-700"
                        style={{ padding: styling.tableRowPadding }}
                      >
                        {item.ht_code || item.code}
                      </td>
                    )}
                    {layout.showDepartmentColumn && (
                      <td
                        className="text-slate-600"
                        style={{ padding: styling.tableRowPadding }}
                      >
                        {item.ht_heading || item.department || "General"}
                      </td>
                    )}
                    <td
                      className="text-right font-bold text-slate-900 font-mono"
                      style={{ padding: styling.tableRowPadding }}
                    >
                      {formatMoney(
                        item.unit_price ?? item.ht_amount ?? item.amount,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="rounded border border-dashed border-slate-300 p-3 text-center text-slate-500"
            style={{ marginTop: styling.sectionMarginTop }}
          >
            <FileText size={18} className="mx-auto mb-1 text-slate-400" />
            <p className="font-semibold text-slate-800">
              Registration Fee / Specimen Accession Slip
            </p>
            <p className="text-[10px] text-slate-500">
              No immediate test panel billed.
            </p>
          </div>
        )}

        {/* FINANCIAL SUMMARY */}
        {hasItems && (() => {
          const totalAmount = Number(receipt.total || 0);
          const paidAmount = receipt.paid_amount !== undefined
            ? Number(receipt.paid_amount)
            : (receipt.payment_status === "Paid" ? totalAmount : 0);
          const dueAmount = receipt.due_amount !== undefined
            ? Number(receipt.due_amount)
            : Math.max(0, totalAmount - paidAmount);

          return (
            <div
              className="flex items-start justify-between gap-4 border-t border-slate-400"
              style={{
                marginTop: styling.sectionMarginTop,
                paddingTop: "4px",
              }}
            >
              <div className="space-y-0.5 text-slate-700 text-[10.5px]">
                <p>
                  <strong>{labels.paymentMode}:</strong>{" "}
                  <span className="font-semibold text-slate-900 print:text-black">
                    {receipt.payment_mode || labels.defaultPaymentMode}
                  </span>
                </p>
                <p>
                  <strong>{labels.paymentStatus}:</strong>{" "}
                  <span
                    className={`font-bold print:text-black ${
                      dueAmount > 0 ? "text-amber-800" : "text-emerald-800"
                    }`}
                  >
                    {dueAmount > 0
                      ? paidAmount > 0
                        ? "PARTIAL / BALANCE DUE"
                        : "PENDING / DUE"
                      : (receipt.payment_status || labels.statusPaid)}
                  </span>
                </p>
              </div>

              <div className="w-64 sm:w-72 space-y-0.5 text-[10.5px]">
                <div className="flex justify-between items-center text-slate-700 gap-2">
                  <span className="whitespace-nowrap">{labels.subtotal}:</span>
                  <span className="font-bold font-mono whitespace-nowrap">
                    {formatMoney(receipt.subtotal)}
                  </span>
                </div>
                {Number(receipt.discount || 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 print:text-black font-semibold gap-2">
                    <span className="whitespace-nowrap">{labels.discount}:</span>
                    <span className="font-mono whitespace-nowrap">
                      - {formatMoney(receipt.discount)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between items-center border-t border-slate-900 pt-0.5 font-black text-slate-900 gap-2"
                  style={{ fontSize: styling.totalAmountFontSize }}
                >
                  <span className="whitespace-nowrap">{labels.totalPayable}:</span>
                  <span className="font-mono whitespace-nowrap">{formatMoney(receipt.total)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 gap-2 text-[10px]">
                  <span className="whitespace-nowrap">Amount Paid:</span>
                  <span className="font-bold font-mono whitespace-nowrap">
                    {formatMoney(paidAmount)}
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center pt-0.5 font-bold gap-2 text-[10.5px] ${
                    dueAmount > 0
                      ? "text-rose-700 print:text-black font-black"
                      : "text-emerald-800 print:text-black"
                  }`}
                >
                  <span className="whitespace-nowrap">Balance Due:</span>
                  <span className="font-mono whitespace-nowrap">
                    {dueAmount > 0 ? formatMoney(dueAmount) : "NIL (PAID)"}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* FOOTER & SIGNATORY */}
        <div
          className="flex items-end justify-between border-t border-dotted border-slate-300 pt-2 text-slate-500"
          style={{
            marginTop: styling.sectionMarginTop,
            fontSize: styling.footerFontSize,
          }}
        >
          <div className="space-y-0.5 max-w-[65%]">
            {layout.showTermsAndNotes &&
              footer.notes &&
              footer.notes.map((note, idx) => (
                <p key={idx} className="leading-tight">
                  {note}
                </p>
              ))}
          </div>

          {layout.showSignatureBlock && (
            <div className="w-40 text-center">
              <div
                className="border-b border-slate-500"
                style={{ height: styling.signatureLineHeight }}
              />
              <p className="mt-0.5 font-bold uppercase tracking-wider text-slate-800 text-[9px]">
                {footer.signatureLabel}
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Pure White Background Print Stylesheet (Fixes Zoom Discrepancy & Fits Half-A4) */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 6mm 10mm;
            background: #ffffff !important;
          }
          html, body, :root, #root, #root > div, main {
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #patient-receipt, #patient-receipt * {
            visibility: visible !important;
          }
          #patient-receipt {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: ${styling.receiptWidth} !important;
            margin: 0 auto !important;
            padding: 6px 10px !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
            zoom: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
