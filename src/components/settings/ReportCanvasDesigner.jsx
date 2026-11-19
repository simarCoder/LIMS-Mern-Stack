import { useState, useRef } from "react";
import {
  Sliders,
  Save,
  RotateCcw,
  Printer,
  GripVertical,
  CheckCircle2,
  Eye,
  EyeOff,
  Maximize2,
  FileCheck,
  Sparkles,
} from "lucide-react";
import {
  getReportConfig,
  saveReportConfig,
  resetReportConfig,
} from "./reportConfig";

// Sample investigation data for live A4 canvas preview
const SAMPLE_TEST_ITEMS = [
  {
    name: "Haemoglobin (Hb)",
    value: "14.2",
    unit: "g/dL",
    flag: "NORMAL",
    range: "Male: 13.0 - 17.0, Female: 12.0 - 15.5",
  },
  {
    name: "Total RBC Count",
    value: "4.85",
    unit: "million/µL",
    flag: "NORMAL",
    range: "Male: 4.5 - 5.5, Female: 3.8 - 4.8",
  },
  {
    name: "Total Leukocyte Count (WBC)",
    value: "7,800",
    unit: "cells/µL",
    flag: "NORMAL",
    range: "4,000 - 11,000",
  },
  {
    name: "Platelet Count",
    value: "2.45",
    unit: "lakhs/µL",
    flag: "NORMAL",
    range: "1.50 - 4.50",
  },
  {
    name: "Packed Cell Volume (PCV)",
    value: "42.6",
    unit: "%",
    flag: "NORMAL",
    range: "Male: 40 - 50, Female: 36 - 46",
  },
  {
    name: "Mean Corpuscular Volume (MCV)",
    value: "87.8",
    unit: "fL",
    flag: "NORMAL",
    range: "80 - 100",
  },
  {
    name: "Mean Corpuscular Hemoglobin (MCH)",
    value: "29.3",
    unit: "pg",
    flag: "NORMAL",
    range: "27 - 32",
  },
  {
    name: "MCHC",
    value: "33.3",
    unit: "g/dL",
    flag: "NORMAL",
    range: "31.5 - 34.5",
  },
  {
    name: "Neutrophils",
    value: "64",
    unit: "%",
    flag: "NORMAL",
    range: "40 - 70",
  },
  {
    name: "Lymphocytes",
    value: "28",
    unit: "%",
    flag: "NORMAL",
    range: "20 - 40",
  },
  {
    name: "Eosinophils",
    value: "3",
    unit: "%",
    flag: "NORMAL",
    range: "1 - 6",
  },
  {
    name: "Monocytes",
    value: "5",
    unit: "%",
    flag: "NORMAL",
    range: "2 - 8",
  },
];

export default function ReportCanvasDesigner() {
  const [config, setConfig] = useState(() => getReportConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const canvasRef = useRef(null);

  // Update specific configuration key
  function updateConfig(section, key, value) {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setSaveSuccess(false);
  }

  // Handle Save
  function handleSave() {
    saveReportConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  // Handle Reset
  function handleReset() {
    const fresh = resetReportConfig();
    setConfig(fresh);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }

  // Drag and drop section reordering
  function handleDragStart(index) {
    setDraggedIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...config.sectionOrder];
    const item = newOrder.splice(draggedIndex, 1)[0];
    newOrder.splice(index, 0, item);

    setDraggedIndex(index);
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function handlePrintSample() {
    window.print();
  }

  // Render individual reorderable section inside canvas
  function renderCanvasSection(sectionKey) {
    switch (sectionKey) {
      case "letterhead":
        return (
          <div
            key="letterhead"
            draggable
            onDragStart={() => handleDragStart(config.sectionOrder.indexOf("letterhead"))}
            onDragOver={(e) => handleDragOver(e, config.sectionOrder.indexOf("letterhead"))}
            onDragEnd={handleDragEnd}
            style={{
              paddingBottom: `${config.layout.headerPaddingBottomPx}px`,
            }}
            className="group relative cursor-grab rounded border border-transparent hover:border-teal-400/60 hover:bg-teal-50/20 transition p-1"
          >
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-teal-600 cursor-grab">
              <GripVertical size={16} />
            </div>

            <div className={`flex items-start justify-between ${config.toggles.showLetterheadBorder ? "border-b-2 border-slate-900 pb-2" : ""}`}>
              <div>
                <h1
                  style={{ fontSize: `${config.layout.headerFontSizePt}pt` }}
                  className="font-black uppercase tracking-tight text-slate-900 leading-tight"
                >
                  {config.facility.name}
                </h1>
                <p className="text-[9.5px] font-bold tracking-widest uppercase text-teal-800">
                  {config.facility.tagline}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {config.facility.address} · Tel: {config.facility.phone}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded border-2 border-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
                  {config.facility.reportTitle}
                </span>
              </div>
            </div>
          </div>
        );

      case "demographics":
        return (
          <div
            key="demographics"
            draggable
            onDragStart={() => handleDragStart(config.sectionOrder.indexOf("demographics"))}
            onDragOver={(e) => handleDragOver(e, config.sectionOrder.indexOf("demographics"))}
            onDragEnd={handleDragEnd}
            style={{
              padding: `${config.layout.demographicsPaddingPx}px`,
            }}
            className="group relative cursor-grab my-1.5 rounded border border-slate-300 bg-slate-50/70 hover:border-teal-400 hover:bg-teal-50/20 transition"
          >
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-teal-600 cursor-grab">
              <GripVertical size={16} />
            </div>

            <div className="grid grid-cols-4 gap-y-1 gap-x-3 text-[11px]">
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Patient Name:</span>
                <strong className="text-slate-900 font-bold block truncate">Mr. Rajesh Sharma</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Patient ID:</span>
                <strong className="text-slate-900 font-mono font-bold block">P1</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Age / Gender:</span>
                <strong className="text-slate-900 font-bold block">45 Y / Male</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Receipt No:</span>
                <strong className="text-slate-900 font-mono font-bold block">R1</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Referred By:</span>
                <span className="text-slate-800 block truncate">Dr. A. K. Verma, MD</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Sample Collected:</span>
                <span className="text-slate-800 block">18 Nov 2026, 09:30 am</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Report Generated:</span>
                <span className="text-slate-800 block">18 Nov 2026, 11:45 am</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[10.5px]">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>
        );

      case "investigations":
        return (
          <div
            key="investigations"
            draggable
            onDragStart={() => handleDragStart(config.sectionOrder.indexOf("investigations"))}
            onDragOver={(e) => handleDragOver(e, config.sectionOrder.indexOf("investigations"))}
            onDragEnd={handleDragEnd}
            className="group relative cursor-grab my-1 rounded border border-transparent hover:border-teal-400 hover:bg-teal-50/10 transition p-1"
          >
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-teal-600 cursor-grab">
              <GripVertical size={16} />
            </div>

            <table
              style={{ fontSize: `${config.layout.baseFontSizePt}pt` }}
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[9.5px]">
                  <th className="py-1 px-1.5 w-[42%]">Investigation / Parameter</th>
                  <th className="py-1 px-1.5 text-right w-[18%]">Observed Value</th>
                  {config.toggles.showFlag && <th className="py-1 px-1.5 text-center w-[10%]">Flag</th>}
                  {config.toggles.showUnit && <th className="py-1 px-1.5 text-center w-[12%]">Units</th>}
                  {config.toggles.showRefInterval && <th className="py-1 px-1.5 text-left w-[18%]">Reference Interval</th>}
                </tr>
              </thead>
              <tbody>
                {/* Header row */}
                <tr className="bg-slate-100/90 border-t border-b border-slate-300">
                  <td colSpan={5} className="py-0.5 px-1.5 font-bold uppercase tracking-wider text-[9px] text-teal-950">
                    <div className="flex items-center justify-between">
                      <span>COMPLETE BLOOD COUNT (CBC)</span>
                      <span className="font-mono text-slate-500">HAEMATOLOGY</span>
                    </div>
                  </td>
                </tr>

                {SAMPLE_TEST_ITEMS.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      paddingTop: `${config.layout.tableRowPaddingPx}px`,
                      paddingBottom: `${config.layout.tableRowPaddingPx}px`,
                    }}
                    className="border-b border-slate-200/80"
                  >
                    <td className="py-0.5 px-1.5 text-slate-900 font-medium pl-2">
                      <span>{item.name}</span>
                      {config.toggles.showMethod && (
                        <span className="text-[8.5px] text-slate-400 italic ml-1">
                          (Automated Impedance)
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-slate-900">
                      {item.value}
                    </td>
                    {config.toggles.showFlag && (
                      <td className="py-0.5 px-1.5 text-center font-bold text-[9px] text-slate-400">
                        {item.flag}
                      </td>
                    )}
                    {config.toggles.showUnit && (
                      <td className="py-0.5 px-1.5 text-center font-mono text-[9px] text-slate-700">
                        {item.unit}
                      </td>
                    )}
                    {config.toggles.showRefInterval && (
                      <td className="py-0.5 px-1.5 font-mono text-[9px] text-slate-700">
                        {item.range}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "remarks":
        if (!config.toggles.showDoctorRemarks) return null;
        return (
          <div
            key="remarks"
            draggable
            onDragStart={() => handleDragStart(config.sectionOrder.indexOf("remarks"))}
            onDragOver={(e) => handleDragOver(e, config.sectionOrder.indexOf("remarks"))}
            onDragEnd={handleDragEnd}
            style={{
              marginTop: `${config.layout.remarksMarginTopPx}px`,
            }}
            className="group relative cursor-grab rounded border border-slate-300 p-2 text-xs bg-slate-50/50 hover:border-teal-400 hover:bg-teal-50/20 transition"
          >
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-teal-600 cursor-grab">
              <GripVertical size={16} />
            </div>
            <span className="font-bold uppercase tracking-wider text-[9px] text-slate-700 block mb-0.5">
              Pathologist Interpretation & Remarks:
            </span>
            <p className="text-slate-800 text-[10.5px] leading-snug">
              All hematological parameters are within biological reference intervals. No acute pathological findings.
            </p>
          </div>
        );

      case "signatures":
        return (
          <div
            key="signatures"
            draggable
            onDragStart={() => handleDragStart(config.sectionOrder.indexOf("signatures"))}
            onDragOver={(e) => handleDragOver(e, config.sectionOrder.indexOf("signatures"))}
            onDragEnd={handleDragEnd}
            style={{
              marginTop: `${config.layout.signaturesMarginTopPx}px`,
            }}
            className="group relative cursor-grab pt-2 border-t border-slate-300 hover:border-teal-400 hover:bg-teal-50/10 transition rounded p-1"
          >
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-teal-600 cursor-grab">
              <GripVertical size={16} />
            </div>

            <div className="flex items-end justify-between text-slate-600">
              <div>
                <p className="font-bold text-slate-900 text-[9.5px] uppercase tracking-wider">
                  *** End of Clinical Diagnostic Report ***
                </p>
                <p className="text-[8.5px] text-slate-500 mt-0.5">
                  Standardized 1-page report layout verified electronically.
                </p>
              </div>

              <div className="flex items-end gap-6 text-center">
                {config.toggles.showDualSignatures && (
                  <div className="w-40 space-y-0.5">
                    <div className="border-b border-slate-400 h-5" />
                    <p className="font-bold text-slate-800 text-[9.5px] uppercase">
                      {config.facility.technologistTitle}
                    </p>
                    <p className="text-[8px] text-slate-400">Lab Technician</p>
                  </div>
                )}

                <div className="w-48 space-y-0.5">
                  <div className="border-b border-slate-600 h-5" />
                  <p className="font-bold text-slate-900 text-[9.5px] uppercase">
                    {config.facility.pathologistTitle}
                  </p>
                  <p className="text-[8px] text-slate-500">
                    {config.facility.pathologistSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders size={18} className="text-teal-600" />
            <span>Interactive A4 Report Layout Designer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag canvas blocks, adjust margins, and configure exact spacing to ensure 100% single-page A4 printing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle2 size={14} />
              <span>Layout Saved!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </button>

          <button
            type="button"
            onClick={handlePrintSample}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-black transition cursor-pointer"
          >
            <Printer size={14} />
            <span>Test Print</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Controls Sidebar + Right A4 Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Controls Configuration Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Margins & Dimensions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Physical Page Margins (A4)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Top Margin:</span>
                  <span className="font-mono text-teal-700">{config.page.marginTopMm} mm</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="1"
                  value={config.page.marginTopMm}
                  onChange={(e) => updateConfig("page", "marginTopMm", parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Bottom Margin:</span>
                  <span className="font-mono text-teal-700">{config.page.marginBottomMm} mm</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="1"
                  value={config.page.marginBottomMm}
                  onChange={(e) => updateConfig("page", "marginBottomMm", parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Side Margins (L / R):</span>
                  <span className="font-mono text-teal-700">{config.page.marginLeftMm} mm</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="22"
                  step="1"
                  value={config.page.marginLeftMm}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateConfig("page", "marginLeftMm", val);
                    updateConfig("page", "marginRightMm", val);
                  }}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Typography & Spacing */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Typography & Row Density
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Base Font Size:</span>
                  <span className="font-mono text-teal-700">{config.layout.baseFontSizePt} pt</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="11"
                  step="0.5"
                  value={config.layout.baseFontSizePt}
                  onChange={(e) => updateConfig("layout", "baseFontSizePt", parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Table Row Padding:</span>
                  <span className="font-mono text-teal-700">{config.layout.tableRowPaddingPx} px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={config.layout.tableRowPaddingPx}
                  onChange={(e) => updateConfig("layout", "tableRowPaddingPx", parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Remarks Top Spacing:</span>
                  <span className="font-mono text-teal-700">{config.layout.remarksMarginTopPx} px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="2"
                  value={config.layout.remarksMarginTopPx}
                  onChange={(e) => updateConfig("layout", "remarksMarginTopPx", parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Element Visibility Toggles */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Report Content Toggles
            </h3>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Show Test Methods</span>
                  <span className="text-[10.5px] text-slate-500">
                    {config.toggles.showMethod ? "Enabled" : "Disabled (Keeps report clean & 1-page)"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toggles.showMethod}
                  onChange={(e) => updateConfig("toggles", "showMethod", e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-2">
                <div>
                  <span className="font-bold text-slate-800 block">Doctor Remarks Box</span>
                  <span className="text-[10.5px] text-slate-500">Pathologist findings and commentary</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toggles.showDoctorRemarks}
                  onChange={(e) => updateConfig("toggles", "showDoctorRemarks", e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-2">
                <div>
                  <span className="font-bold text-slate-800 block">Dual Signatures</span>
                  <span className="text-[10.5px] text-slate-500">Technologist & Consultant Pathologist</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toggles.showDualSignatures}
                  onChange={(e) => updateConfig("toggles", "showDualSignatures", e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-100 pt-2">
                <div>
                  <span className="font-bold text-slate-800 block">Letterhead Solid Divider</span>
                  <span className="text-[10.5px] text-slate-500">Crisp dark line below lab details</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toggles.showLetterheadBorder}
                  onChange={(e) => updateConfig("toggles", "showLetterheadBorder", e.target.checked)}
                  className="h-4 w-4 rounded accent-teal-600 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Visual A4 Canvas Preview */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 px-2 pb-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Maximize2 size={13} className="text-teal-600" />
              <span>A4 Canvas Preview (Drag blocks to rearrange)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Margins: {config.page.marginTopMm}mm top · {config.page.marginLeftMm}mm sides
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div className="w-full overflow-x-auto p-4 bg-slate-200/60 rounded-2xl border border-slate-300 flex justify-center shadow-inner">
            <div
              ref={canvasRef}
              id="diagnostic-report-sheet"
              style={{
                width: "210mm",
                minHeight: "297mm",
                maxHeight: "297mm",
                boxSizing: "border-box",
                paddingTop: `${config.page.marginTopMm}mm`,
                paddingBottom: `${config.page.marginBottomMm}mm`,
                paddingLeft: `${config.page.marginLeftMm}mm`,
                paddingRight: `${config.page.marginRightMm}mm`,
              }}
              className="bg-white text-slate-900 shadow-2xl relative select-none flex flex-col justify-between overflow-hidden print:shadow-none print:border-none"
            >
              <div className="space-y-0.5">
                {config.sectionOrder.map((key) => renderCanvasSection(key))}
              </div>

              {/* Watermark/A4 Footer tag */}
              <div className="text-center text-[7.5px] text-slate-400 tracking-widest uppercase border-t border-slate-100 pt-1 print:hidden">
                A4 Standard Single-Page Clinical Blueprint · Labora+ LIMS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
