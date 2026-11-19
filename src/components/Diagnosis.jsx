import { useCallback, useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Save,
  Search,
  FlaskConical,
  CheckCircle2,
  Clock,
  Printer,
  ArrowLeft,
  Check,
  AlertCircle,
  FileText,
  User,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import {
  fetchDiagnosisOrders,
  fetchDiagnosisOrder,
  updateDiagnosisOrderResults,
  verifyDiagnosisOrder,
  syncDiagnosisOrderCatalogue,
} from "../services/api";
import PrintDiagnosticReport from "./diagnosis/PrintDiagnosticReport";
import DateFilterBar, { isDateWithinRange } from "./common/DateFilterBar";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono";

// Clinical abnormality evaluation helper
function evaluateAbnormal(val, refRange) {
  if (!val || !refRange) return null;
  const clean = String(val).trim().replace(/,/g, "");
  const num = parseFloat(clean);
  if (Number.isNaN(num)) return null;

  const rangeMatch = refRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!Number.isNaN(min) && num < min) return { flag: "LOW", label: "Low ↓", color: "bg-blue-50 text-blue-700 border-blue-200" };
    if (!Number.isNaN(max) && num > max) return { flag: "HIGH", label: "High ↑", color: "bg-rose-50 text-rose-700 border-rose-200" };
    return { flag: "NORMAL", label: "Normal", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  const lessMatch = refRange.match(/(?:<|<=|up to)\s*([\d.]+)/i);
  if (lessMatch) {
    const max = parseFloat(lessMatch[1]);
    if (!Number.isNaN(max) && num > max) return { flag: "HIGH", label: "High ↑", color: "bg-rose-50 text-rose-700 border-rose-200" };
    return { flag: "NORMAL", label: "Normal", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  const greaterMatch = refRange.match(/(?:>|>=)\s*([\d.]+)/i);
  if (greaterMatch) {
    const min = parseFloat(greaterMatch[1]);
    if (!Number.isNaN(min) && num < min) return { flag: "LOW", label: "Low ↓", color: "bg-blue-50 text-blue-700 border-blue-200" };
    return { flag: "NORMAL", label: "Normal", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  return null;
}

export default function Diagnosis({ route, navigateTo, user }) {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'pending', 'in_progress', 'verified'
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState({ type: "all", fromDate: null, toDate: null });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [viewMode, setViewMode] = useState("entry"); // 'entry' or 'report'

  // Load orders list
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const data = await fetchDiagnosisOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to load diagnostic orders." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Synchronize route with active order (e.g. /diagnosis/:id or /diagnosis/:id/report)
  useEffect(() => {
    if (route?.page === "Diagnosis" && route.id) {
      setLoading(true);
      fetchDiagnosisOrder(route.id)
        .then((orderData) => {
          setActiveOrder(orderData);
          setViewMode(route.sub === "report" ? "report" : "entry");
        })
        .catch((err) => {
          setFeedback({ type: "error", message: err.message || "Failed to load selected diagnostic order." });
        })
        .finally(() => setLoading(false));
    } else if (route?.page === "Diagnosis" && !route.id) {
      setActiveOrder(null);
      setViewMode("entry");
    }
  }, [route?.page, route?.id, route?.sub]);

  // Select an order to work on
  function selectOrder(order, mode = "entry") {
    setActiveOrder(order);
    setViewMode(mode);
    if (mode === "report") {
      navigateTo?.(`/diagnosis/${order.id}/report`);
    } else {
      navigateTo?.(`/diagnosis/${order.id}`);
    }
  }

  // Close active order and return to queue
  function closeActiveOrder() {
    setActiveOrder(null);
    navigateTo?.("/diagnosis");
  }

  // Handle local parameter result changes
  function handleParameterChange(orderItemId, subtestId, field, value) {
    if (!activeOrder) return;
    setActiveOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== orderItemId) return item;
          return {
            ...item,
            sub_tests: item.sub_tests.map((st) => {
              if (st.id !== subtestId) return st;
              const updated = { ...st, [field]: value };
              if (field === "result_value") {
                updated.result_status = value.trim() ? "Entered" : "Pending";
              }
              return updated;
            }),
          };
        }),
      };
    });
  }

  // Handle doctor remarks change
  function handleRemarksChange(text) {
    if (!activeOrder) return;
    setActiveOrder((prev) => (prev ? { ...prev, doctor_remarks: text } : prev));
  }

  // Batch Save all sub-tests, custom reference ranges/units, and remarks in one go
  async function handleSaveResults() {
    if (!activeOrder) return;
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    const allSubtests = activeOrder.items.flatMap((item) =>
      item.sub_tests.map((st) => ({
        id: st.id,
        result_value: st.result_value || "",
        result_notes: st.result_notes || "",
        st_ref_ranges: st.st_ref_ranges ?? "",
        st_unit: st.st_unit ?? "",
        result_status: st.result_status || (st.result_value ? "Entered" : "Pending"),
      }))
    );

    try {
      const res = await updateDiagnosisOrderResults(activeOrder.id, {
        sub_tests: allSubtests,
        doctor_remarks: activeOrder.doctor_remarks || "",
      });
      const updatedOrder = res.order || activeOrder;
      setActiveOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setFeedback({ type: "success", message: "Diagnostic results and reference ranges saved." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to save results." });
    } finally {
      setIsSaving(false);
    }
  }

  // Synchronize order reference ranges and test parameters with the latest master catalogue
  async function handleSyncCatalogue() {
    if (!activeOrder) return;
    setIsSyncing(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await syncDiagnosisOrderCatalogue(activeOrder.id);
      const updatedOrder = res.order || activeOrder;
      setActiveOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setFeedback({
        type: "success",
        message: "Reference ranges and parameter definitions synchronized with latest catalogue.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to sync with catalogue.",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  // Verify and approve the diagnostic report
  async function handleVerifyReport() {
    if (!activeOrder) return;
    setIsVerifying(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await verifyDiagnosisOrder(activeOrder.id);
      const updatedOrder = res.order || activeOrder;
      setActiveOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setFeedback({ type: "success", message: "Report verified and signed." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to verify report." });
    } finally {
      setIsVerifying(false);
    }
  }

  // Filtered orders list for the queue
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (activeTab === "pending" && order.order_status !== "Pending") return false;
      if (activeTab === "in_progress" && order.order_status !== "In Progress") return false;
      if (activeTab === "verified" && order.order_status !== "Verified") return false;

      // 2. Date Range Filter
      if (!isDateWithinRange(order.created_at, dateRange)) return false;

      // 3. Search Query
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const patientName = (order.patient?.patient_name || "").toLowerCase();
        const patientId = (order.patient?.patientId || "").toLowerCase();
        const orderNo = (order.order_no || "").toLowerCase();
        const testNames = (order.items || []).map((it) => it.ht_name.toLowerCase()).join(" ");
        if (!patientName.includes(q) && !patientId.includes(q) && !orderNo.includes(q) && !testNames.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, activeTab, query, dateRange]);

  // Status counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.order_status === "Pending").length,
      in_progress: orders.filter((o) => o.order_status === "In Progress").length,
      verified: orders.filter((o) => o.order_status === "Verified").length,
    };
  }, [orders]);

  // Render Printable Report View
  if (activeOrder && viewMode === "report") {
    return (
      <PrintDiagnosticReport
        order={activeOrder}
        onBack={() => setViewMode("entry")}
        onOpenDesigner={() => navigateTo?.("/settings")}
      />
    );
  }

  // Render Active Diagnostic Results Entry View
  if (activeOrder) {
    const patient = activeOrder.patient || {};
    const items = activeOrder.items || [];
    const isVerified = activeOrder.order_status === "Verified";

    return (
      <div className="w-full max-w-[1600px] space-y-4">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeActiveOrder}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Orders Queue</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  {patient.honorific_title ? `${patient.honorific_title} ` : ""}
                  {patient.patient_name}
                </h1>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {patient.patientId || `P${patient.id}`}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="font-mono text-xs text-slate-600 font-bold">
                  {activeOrder.order_no}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncCatalogue}
              disabled={isSyncing}
              title="Refresh reference ranges, units, and parameters from master catalogue"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin text-teal-600" : "text-slate-600"} />
              <span>{isSyncing ? "Syncing..." : "Sync Catalogue"}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveResults}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 transition cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? "Saving..." : "Save Results"}</span>
            </button>

            <button
              type="button"
              onClick={handleVerifyReport}
              disabled={isVerifying}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
                isVerified
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <CheckCircle2 size={14} />
              <span>{isVerified ? "Verified" : isVerifying ? "Verifying..." : "Verify & Sign"}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("report")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs font-semibold ${
              feedback.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "error" ? (
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback({ type: "", message: "" })}
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Investigation Test Panels */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              {/* Test Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FlaskConical size={16} className="text-teal-700" />
                  <span className="font-bold text-sm text-slate-900">{item.ht_name}</span>
                  <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                    {item.ht_code}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {item.sub_tests?.length || 0} Parameters
                </span>
              </div>

              {/* Sub-tests Parameters Grid */}
              {item.sub_tests && item.sub_tests.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  <div className="hidden md:grid grid-cols-12 gap-3 bg-slate-50/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <span className="col-span-3">Parameter Name</span>
                    <span className="col-span-2">Result Value</span>
                    <span className="col-span-2">Ref. Range</span>
                    <span className="col-span-1 text-center">Unit</span>
                    <span className="col-span-1 text-center">Flag</span>
                    <span className="col-span-2">Notes</span>
                    <span className="col-span-1 text-right">Status</span>
                  </div>

                  {item.sub_tests.map((st) => {
                    const abnormal = evaluateAbnormal(st.result_value, st.st_ref_ranges);

                    return (
                      <div
                        key={st.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center px-4 py-2.5 hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Parameter Name */}
                        <div className="col-span-3">
                          <span className="font-bold text-xs text-slate-800 block">{st.st_name}</span>
                          {st.st_method && (
                            <span className="text-[10px] text-slate-400 block">Method: {st.st_method}</span>
                          )}
                        </div>

                        {/* Result Value Input */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={st.result_value || ""}
                            onChange={(e) =>
                              handleParameterChange(item.id, st.id, "result_value", e.target.value)
                            }
                            placeholder={st.st_default_value || "Enter value"}
                            className={inputClass}
                          />
                        </div>

                        {/* Reference Range (Editable) */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={st.st_ref_ranges || ""}
                            onChange={(e) =>
                              handleParameterChange(item.id, st.id, "st_ref_ranges", e.target.value)
                            }
                            placeholder="Ref. range"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600 hover:border-slate-300"
                            title="Reference range (editable for this patient)"
                          />
                        </div>

                        {/* Unit (Editable) */}
                        <div className="col-span-1 text-center">
                          <input
                            type="text"
                            value={st.st_unit || ""}
                            onChange={(e) =>
                              handleParameterChange(item.id, st.id, "st_unit", e.target.value)
                            }
                            placeholder="Unit"
                            className="w-full text-center rounded-lg border border-slate-200 bg-white px-1 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600 hover:border-slate-300"
                            title="Unit (editable for this patient)"
                          />
                        </div>

                        {/* Flag Badge */}
                        <div className="col-span-1 text-center">
                          {abnormal ? (
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${abnormal.color}`}>
                              {abnormal.label}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">—</span>
                          )}
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={st.result_notes || ""}
                            onChange={(e) =>
                              handleParameterChange(item.id, st.id, "result_notes", e.target.value)
                            }
                            placeholder="Notes"
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-teal-600"
                          />
                        </div>

                        {/* Status */}
                        <div className="col-span-1 text-right">
                          <select
                            value={st.result_status || "Pending"}
                            onChange={(e) =>
                              handleParameterChange(item.id, st.id, "result_status", e.target.value)
                            }
                            className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-bold text-slate-800 outline-none focus:border-teal-600 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Entered">Entered</option>
                            <option value="Verified">Verified</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No sub-test parameters configured for this investigation.
                </div>
              )}
            </div>
          ))}

          {/* Pathologist Doctor Remarks */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Pathologist Interpretation & Remarks
            </label>
            <textarea
              rows={3}
              value={activeOrder.doctor_remarks || ""}
              onChange={(e) => handleRemarksChange(e.target.value)}
              placeholder="Enter clinical notes, morphology description, or diagnostic impression..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render Diagnostic Queue List View
  return (
    <div className="w-full max-w-[1600px] space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white shrink-0">
            <Stethoscope size={18} />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Diagnosis</h1>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-teal-600" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs font-semibold ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "error" ? (
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls & Filter Tabs */}
      <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Row 1: Filter Tabs + Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Orders", count: counts.all },
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "in_progress", label: "In Progress", count: counts.in_progress },
              { id: "verified", label: "Verified", count: counts.verified },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                    activeTab === tab.id ? "bg-teal-800 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, ID, or order..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Row 2: Date & Month Filter System with Interactive Calendar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <DateFilterBar
            range={dateRange}
            onRangeChange={setDateRange}
            totalCount={filteredOrders.length}
          />

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Active Filter: <strong className="text-teal-800 font-bold">{activeTab.toUpperCase()}</strong> · {dateRange.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Orders Queue Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Prescribed Tests</th>
                <th className="px-4 py-3">Sample</th>
                <th className="px-4 py-3">Diagnostic Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3.5">
                    <div className="h-4 w-36 rounded bg-slate-200 mb-1.5" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-14 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1">
                      <div className="h-4 w-12 rounded bg-teal-100/70" />
                      <div className="h-4 w-12 rounded bg-teal-100/70" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-16 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-16 rounded bg-slate-200" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex gap-1.5">
                      <div className="h-7 w-16 rounded-lg bg-slate-100" />
                      <div className="h-7 w-8 rounded-lg bg-slate-100" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/60 py-3 text-xs font-semibold text-teal-700">
            <RefreshCw size={13} className="animate-spin text-teal-600" />
            <span>Fetching diagnostic queue...</span>
          </div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Prescribed Tests</th>
                <th className="px-4 py-3">Sample</th>
                <th className="px-4 py-3">Diagnostic Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((order) => {
                const patient = order.patient || {};
                const testsCount = (order.items || []).length;
                const status = order.order_status || "Pending";

                return (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">
                        {patient.honorific_title ? `${patient.honorific_title} ` : ""}
                        {patient.patient_name || "—"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {patient.patientId || `P${patient.id || ""}`} · {patient.patient_gender || "—"}
                      </div>
                    </td>

                    {/* Order No */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                      {order.order_no}
                    </td>

                    {/* Prescribed Tests */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(order.items || []).map((it) => (
                          <span
                            key={it.id}
                            className="inline-block rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[10.5px] font-bold text-teal-800"
                          >
                            {it.ht_code}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Sample */}
                    <td className="px-4 py-3.5">
                      {order.sample_collected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <Check size={13} strokeWidth={3} />
                          <span>Collected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <Clock size={13} />
                          <span>Awaiting</span>
                        </span>
                      )}
                    </td>

                    {/* Diagnostic Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10.5px] font-bold border ${
                          status === "Verified"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : status === "In Progress"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => selectOrder(order, "entry")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                        >
                          <Stethoscope size={13} />
                          <span>Results</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => selectOrder(order, "report")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          title="Print or preview report"
                        >
                          <Printer size={13} />
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
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs font-semibold text-slate-400">
          No diagnostic orders found.
        </div>
      )}
    </div>
  );
}
