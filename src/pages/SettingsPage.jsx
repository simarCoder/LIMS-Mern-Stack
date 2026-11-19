import { useState } from "react";
import {
  FileText,
  Receipt,
  Building2,
  Sliders,
  Sparkles,
} from "lucide-react";
import ReportCanvasDesigner from "../components/settings/ReportCanvasDesigner";
import { defaultReceiptConfig } from "../components/patients/receiptConfig";

export default function SettingsPage({ user, onNavigate }) {
  // Subnav tab state: 1st element is "report" (Report Settings)
  const [activeTab, setActiveTab] = useState("report");

  return (
    <div className="w-full max-w-[1600px] space-y-4">
      {/* Settings Top Subnav Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* 1st Element: Report Settings (as requested by user) */}
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "report"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText size={15} />
            <span>Report Settings (A4 Canvas)</span>
          </button>

          {/* 2nd Element: Receipt & Billing Settings */}
          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "receipt"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Receipt size={15} />
            <span>Receipt & Billing</span>
          </button>

          {/* 3rd Element: Lab Profile & Facility */}
          <button
            type="button"
            onClick={() => setActiveTab("facility")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "facility"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Building2 size={15} />
            <span>Lab Facility Profile</span>
          </button>
        </div>

        <div className="text-right text-[11px] text-slate-400 font-medium hidden sm:block">
          System Role: <strong className="text-teal-800 uppercase">{user?.role || "Developer"}</strong>
        </div>
      </div>

      {/* Render Active Subnav View */}
      {activeTab === "report" && <ReportCanvasDesigner />}

      {activeTab === "receipt" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Receipt size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Receipt & Cash Memo Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Configure half-sheet receipt dimensions, fonts, terms, and auto-generated receipt numbering (R1, R2, R3...).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-900 block">Receipt Layout Mode</span>
              <p className="text-slate-600 text-[11px]">
                Configured to print onto compact half-A4 sheets without zoom distortion.
              </p>
              <div className="mt-2 text-teal-800 font-mono font-bold bg-teal-50 p-2 rounded-lg border border-teal-200">
                Current Numbering: R1, R2, R3... R1203 (Active)
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-900 block">Payment Modes Supported</span>
              <p className="text-slate-600 text-[11px]">
                Cash, Credit (Online / UPI), and Card (Debit / Credit) with instant dynamic receipt labeling.
              </p>
              <div className="mt-2 text-slate-700 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                ✓ Cash · ✓ Online / UPI · ✓ Card
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "facility" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Building2 size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Laboratory Profile & Registration
              </h3>
              <p className="text-xs text-slate-500">
                Clinical accreditation, facility address, and official contact credentials printed across receipts and reports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 font-semibold block text-[11px] mb-1">
                Facility Name
              </label>
              <input
                type="text"
                readOnly
                value="Labora+ Pathology & Diagnostics"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-slate-500 font-semibold block text-[11px] mb-1">
                Lab Code / Identifier
              </label>
              <input
                type="text"
                readOnly
                value={user?.lab_code || "LAB01"}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono font-bold text-teal-800"
              />
            </div>

            <div>
              <label className="text-slate-500 font-semibold block text-[11px] mb-1">
                Official Phone Numbers
              </label>
              <input
                type="text"
                readOnly
                value="+91 98765 43210 / 080-2345678"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="text-slate-500 font-semibold block text-[11px] mb-1">
                Consultant Pathologist
              </label>
              <input
                type="text"
                readOnly
                value="Dr. S. K. Mukherjee (MD Path)"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
