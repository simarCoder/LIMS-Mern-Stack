import { useRef, useMemo } from "react";
import { Printer, ArrowLeft, CheckCircle2, Sliders } from "lucide-react";
import { getReportConfig } from "../settings/reportConfig";

export default function PrintDiagnosticReport({
  order,
  facility: facilityProp,
  onBack,
  onOpenDesigner,
}) {
  const reportRef = useRef(null);
  const config = useMemo(() => getReportConfig(), []);

  if (!order) return null;

  const facility = facilityProp || config.facility;
  const patient = order.patient || {};
  const items = order.items || [];
  const doctorRemarks = order.doctor_remarks || "";
  const verifiedBy = order.verified_by || facility.pathologistTitle || "Dr. S. K. Mukherjee (MD Path)";
  const verifiedAt = order.verified_at
    ? new Date(order.verified_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const sampleDate = order.created_at
    ? new Date(order.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  function handlePrint() {
    window.print();
  }

  // Parse reference range and check if a numeric value is abnormal
  function getAbnormalFlag(value, refRange) {
    if (!value || !refRange) return null;
    const cleanVal = String(value).trim().replace(/,/g, "");
    const num = parseFloat(cleanVal);
    if (Number.isNaN(num)) return null;

    const rangeMatch = refRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (!Number.isNaN(min) && num < min) return { flag: "LOW", label: "LOW", color: "text-blue-700 font-bold" };
      if (!Number.isNaN(max) && num > max) return { flag: "HIGH", label: "HIGH", color: "text-rose-700 font-bold" };
      return { flag: "NORMAL", label: "NORMAL", color: "text-slate-500 font-medium" };
    }

    const lessMatch = refRange.match(/(?:<|<=|up to)\s*([\d.]+)/i);
    if (lessMatch) {
      const max = parseFloat(lessMatch[1]);
      if (!Number.isNaN(max) && num > max) return { flag: "HIGH", label: "HIGH", color: "text-rose-700 font-bold" };
      return { flag: "NORMAL", label: "NORMAL", color: "text-slate-500 font-medium" };
    }

    const greaterMatch = refRange.match(/(?:>|>=)\s*([\d.]+)/i);
    if (greaterMatch) {
      const min = parseFloat(greaterMatch[1]);
      if (!Number.isNaN(min) && num < min) return { flag: "LOW", label: "LOW", color: "text-blue-700 font-bold" };
      return { flag: "NORMAL", label: "NORMAL", color: "text-slate-500 font-medium" };
    }

    return null;
  }

  const receiptNumber = order.order_no || (order.id ? `R${order.id}` : "R1");
  const patientId = patient.patientId || (patient.id ? `P${patient.id}` : "P1");

  // Section Renderers based on user's saved sectionOrder
  function renderSection(sectionKey) {
    switch (sectionKey) {
      case "letterhead":
        return (
          <header
            key="letterhead"
            style={{ paddingBottom: `${config.layout.headerPaddingBottomPx}px` }}
            className={`w-full ${config.toggles.showLetterheadBorder ? "border-b-2 border-slate-900 pb-2.5" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1
                  style={{ fontSize: `${config.layout.headerFontSizePt}pt` }}
                  className="font-black uppercase tracking-tight text-slate-900 leading-tight"
                >
                  {facility.name}
                </h1>
                <p className="text-[10px] font-bold tracking-widest uppercase text-teal-800">
                  {facility.tagline}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {facility.address} · Phone: {facility.phone}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-900">
                  {facility.reportTitle || "DIAGNOSTIC REPORT"}
                </span>
              </div>
            </div>
          </header>
        );

      case "demographics":
        return (
          <section
            key="demographics"
            style={{ padding: `${config.layout.demographicsPaddingPx}px` }}
            className="my-2 rounded border border-slate-300 bg-slate-50/70 text-xs print:bg-white print:border-slate-400"
          >
            <div className="grid grid-cols-4 gap-y-1.5 gap-x-4">
              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Patient Name:</span>
                <strong className="text-slate-900 text-xs font-bold truncate block">
                  {patient.honorific_title ? `${patient.honorific_title} ` : ""}
                  {patient.patient_name || "—"}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Patient ID:</span>
                <strong className="text-slate-900 font-mono text-xs font-bold block">
                  {patientId}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Age / Gender:</span>
                <strong className="text-slate-900 text-xs block">
                  {patient.patient_age ? `${patient.patient_age} ${patient.patient_age_type || "Y"}` : "—"} / {patient.patient_gender || "—"}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Receipt No:</span>
                <strong className="text-slate-900 font-mono text-xs font-bold block">
                  {receiptNumber}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Referred By:</span>
                <span className="text-slate-800 text-xs block truncate">Self / Dr. On Call</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Sample Collected:</span>
                <span className="text-slate-800 text-xs block">{sampleDate}</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Report Date:</span>
                <span className="text-slate-800 text-xs block">{verifiedAt}</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[9.5px] uppercase">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-xs">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </section>
        );

      case "investigations":
        return (
          <main key="investigations" className="mt-1 space-y-1">
            <table
              style={{ fontSize: `${config.layout.baseFontSizePt}pt` }}
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 print:bg-white text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-1 px-2 w-[42%]">Investigation / Parameter</th>
                  <th className="py-1 px-2 text-right w-[18%]">Observed Value</th>
                  {config.toggles.showFlag && <th className="py-1 px-2 text-center w-[10%]">Flag</th>}
                  {config.toggles.showUnit && <th className="py-1 px-2 text-center w-[12%]">Units</th>}
                  {config.toggles.showRefInterval && <th className="py-1 px-2 text-left w-[18%]">Reference Interval</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="contents">
                    {/* Test Panel Heading Row */}
                    <td
                      colSpan={5}
                      className="bg-slate-100/90 print:bg-slate-100 py-1 px-2 font-bold uppercase tracking-wider text-[9.5px] text-teal-950 border-t border-b border-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.ht_name}</span>
                        {config.toggles.showDepartmentBadge && (
                          <span className="font-mono text-[9px] text-slate-600">{item.ht_code}</span>
                        )}
                      </div>
                    </td>

                    {/* Sub-test Parameters Rows */}
                    {item.sub_tests && item.sub_tests.length > 0 ? (
                      item.sub_tests.map((st, idx) => {
                        const flagObj = getAbnormalFlag(st.result_value, st.st_ref_ranges);
                        const isHigh = flagObj?.flag === "HIGH";
                        const isLow = flagObj?.flag === "LOW";

                        return (
                          <tr
                            key={st.id || idx}
                            style={{
                              paddingTop: `${config.layout.tableRowPaddingPx}px`,
                              paddingBottom: `${config.layout.tableRowPaddingPx}px`,
                            }}
                            className="border-b border-slate-200/80 hover:bg-slate-50/50"
                          >
                            {/* Parameter Name (METHODS REMOVED FOR CLEAN SINGLE-PAGE FIT) */}
                            <td className="py-1 px-2 text-slate-800 font-medium pl-3">
                              <span>{st.st_name}</span>
                              {config.toggles.showMethod && st.st_method && (
                                <span className="text-[9px] text-slate-400 font-normal ml-1.5">
                                  ({st.st_method})
                                </span>
                              )}
                            </td>

                            {/* Observed Value (Clean Bold, Zero Underline!) */}
                            <td className={`py-1 px-2 text-right font-mono text-xs ${
                              isHigh ? "text-rose-700 font-bold" : isLow ? "text-blue-700 font-bold" : "text-slate-900 font-semibold"
                            }`}>
                              {st.result_value || "—"}
                            </td>

                            {/* Flag Column */}
                            {config.toggles.showFlag && (
                              <td className="py-1 px-2 text-center font-bold text-[9.5px]">
                                {isHigh ? (
                                  <span className="text-rose-700 font-black">HIGH</span>
                                ) : isLow ? (
                                  <span className="text-blue-700 font-black">LOW</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">Normal</span>
                                )}
                              </td>
                            )}

                            {/* Units */}
                            {config.toggles.showUnit && (
                              <td className="py-1 px-2 text-center text-slate-700 font-mono text-[10px]">
                                {st.st_unit || "—"}
                              </td>
                            )}

                            {/* Reference Interval */}
                            {config.toggles.showRefInterval && (
                              <td className="py-1 px-2 text-slate-700 font-mono text-[9.5px] whitespace-normal">
                                {st.st_ref_ranges || "—"}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-1.5 px-2 text-slate-500 italic pl-3">
                          Routine investigation completed.
                        </td>
                      </tr>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
        );

      case "remarks":
        if (!config.toggles.showDoctorRemarks || !doctorRemarks) return null;
        return (
          <section
            key="remarks"
            style={{ marginTop: `${config.layout.remarksMarginTopPx}px` }}
            className="rounded border border-slate-300 p-2 text-xs bg-slate-50/40 print:bg-white"
          >
            <span className="font-bold uppercase tracking-wider text-[9px] text-slate-700 block mb-0.5">
              Pathologist Interpretation & Remarks:
            </span>
            <p className="text-slate-800 leading-snug font-sans text-xs">{doctorRemarks}</p>
          </section>
        );

      case "signatures":
        return (
          <footer
            key="signatures"
            style={{ marginTop: `${config.layout.signaturesMarginTopPx}px` }}
            className="pt-2 border-t border-slate-300 flex items-end justify-between text-xs text-slate-600"
          >
            <div>
              <p className="font-bold text-slate-800 text-[9.5px] uppercase tracking-wider">
                *** End of Diagnostic Examination Report ***
              </p>
              <p className="text-[8.5px] text-slate-500 mt-0.5">
                Standardized single-page examination document. Verified electronically.
              </p>
            </div>

            <div className="flex items-end gap-6 text-center">
              {config.toggles.showDualSignatures && (
                <div className="w-40 space-y-0.5">
                  <div className="border-b border-slate-400 h-5" />
                  <p className="font-bold text-slate-800 text-[9.5px] uppercase">
                    {facility.technologistTitle || "Medical Lab Technologist"}
                  </p>
                  <p className="text-[8px] text-slate-400">Lab Technician</p>
                </div>
              )}

              <div className="w-48 text-center space-y-0.5">
                <div className="border-b border-slate-600 h-5" />
                <p className="font-bold text-slate-900 uppercase text-[9.5px] tracking-wider">
                  {verifiedBy}
                </p>
                <p className="text-[8px] text-slate-500">
                  {facility.pathologistSubtitle || "Consultant Pathologist & Lab Director"}
                </p>
              </div>
            </div>
          </footer>
        );

      default:
        return null;
    }
  }

  return (
    <div className="mx-auto flex flex-col items-center space-y-3 pb-8 w-full max-w-4xl">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="w-full flex items-center justify-between print:hidden bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Diagnosis</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenDesigner && (
            <button
              type="button"
              onClick={onOpenDesigner}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Sliders size={14} className="text-teal-600" />
              <span>Canvas Settings</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet — Exact 1-Page Clinical A4 Format */}
      <div
        ref={reportRef}
        id="diagnostic-report-sheet"
        style={{
          boxSizing: "border-box",
        }}
        className="w-full bg-white text-slate-900 border border-slate-300 p-6 sm:p-8 shadow-sm print:border-none print:shadow-none print:p-0"
      >
        <div className="space-y-1">
          {config.sectionOrder.map((key) => renderSection(key))}
        </div>
      </div>

      {/* Dynamic Print CSS derived from User's Settings */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: ${config.page.marginTopMm}mm ${config.page.marginRightMm}mm ${config.page.marginBottomMm}mm ${config.page.marginLeftMm}mm;
        }

        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          aside, nav, header:not(#diagnostic-report-sheet header), button {
            display: none !important;
          }

          #diagnostic-report-sheet {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
