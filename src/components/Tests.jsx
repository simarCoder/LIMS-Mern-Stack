import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  Save,
  RotateCcw,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
} from "lucide-react";
import {
  fetchTestCatalog,
  fetchStatuses,
  createTest,
  updateTest,
  deleteTest as deleteTestApi,
} from "../services/api";

function createBlankSubTest(sequenceNumber = 1) {
  return {
    st_name: "",
    st_type: "Numeric",
    st_unit: "",
    st_method: "",
    st_default_value: "",
    st_ref_ranges: "",
    st_interpretation: "",
    st_print_seq: sequenceNumber,
  };
}

function createBlankHeadTest(defaultStatusId = 1) {
  return {
    head_test_id: null,
    ht_code: "",
    ht_name: "",
    ht_heading: "Haematology",
    ht_type: "Profile",
    ht_amount: "",
    ht_status_id: defaultStatusId,
    ht_ref_ranges: "",
    ht_interpretation: "",
    sub_tests: [createBlankSubTest(1)],
  };
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";
const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1";

export default function Tests({ user }) {
  const [tests, setTests] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [form, setForm] = useState(() => createBlankHeadTest(1));
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Notifications & modals
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Role permissions: Admin and Developer can freely update test codes
  const canEditCode = useMemo(() => {
    if (!form.head_test_id) return true; // New test creation is always editable
    const role = (user?.role || "").toLowerCase();
    return role === "developer" || role === "admin";
  }, [form.head_test_id, user?.role]);

  // Load catalog and statuses from API
  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const [testData, statusData] = await Promise.all([
        fetchTestCatalog(true),
        fetchStatuses(),
      ]);
      setTests(Array.isArray(testData) ? testData : []);
      setStatuses(Array.isArray(statusData) ? statusData : []);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to load laboratory test catalog.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchTestCatalog(true), fetchStatuses()])
      .then(([testData, statusData]) => {
        if (active) {
          setTests(Array.isArray(testData) ? testData : []);
          setStatuses(Array.isArray(statusData) ? statusData : []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: "error",
            message: err.message || "Failed to load test catalog.",
          });
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Department categories
  const categories = useMemo(() => {
    const set = new Set();
    tests.forEach((t) => {
      if (t.ht_heading) set.add(t.ht_heading);
    });
    return ["All", ...Array.from(set)];
  }, [tests]);

  // Filtered test catalog
  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tests.filter((t) => {
      const matchesSearch =
        !q ||
        t.ht_name.toLowerCase().includes(q) ||
        t.ht_code.toLowerCase().includes(q) ||
        (t.ht_heading || "").toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "All" || t.ht_heading === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tests, searchQuery, selectedCategory]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addSubTest() {
    setForm((prev) => ({
      ...prev,
      sub_tests: [
        ...prev.sub_tests,
        createBlankSubTest(prev.sub_tests.length + 1),
      ],
    }));
  }

  function removeSubTest(index) {
    setForm((prev) => ({
      ...prev,
      sub_tests: prev.sub_tests.filter((_, i) => i !== index),
    }));
  }

  function handleSubTestChange(index, field, value) {
    setForm((prev) => {
      const updated = [...prev.sub_tests];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sub_tests: updated };
    });
  }

  function startEdit(test) {
    setForm({
      head_test_id: test.head_test_id,
      ht_code: test.ht_code,
      ht_name: test.ht_name,
      ht_heading: test.ht_heading || "Haematology",
      ht_type: test.ht_type || "Profile",
      ht_amount: String(test.ht_amount || 0),
      ht_status_id: test.ht_status_id || 1,
      ht_ref_ranges: test.ht_ref_ranges || "",
      ht_interpretation: test.ht_interpretation || "",
      sub_tests: Array.isArray(test.sub_tests) && test.sub_tests.length > 0
        ? test.sub_tests.map((st, i) => ({
            sub_test_id: st.sub_test_id,
            st_name: st.st_name || "",
            st_type: st.st_type || "Numeric",
            st_unit: st.st_unit || "",
            st_method: st.st_method || "",
            st_default_value: st.st_default_value || "",
            st_ref_ranges: st.st_ref_ranges || "",
            st_interpretation: st.st_interpretation || "",
            st_print_seq: st.st_print_seq || i + 1,
          }))
        : [createBlankSubTest(1)],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(createBlankHeadTest(statuses[0]?.status_id || 1));
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (!form.ht_code.trim()) {
        throw new Error("Test code is required (e.g. CBC).");
      }
      if (!form.ht_name.trim()) {
        throw new Error("Test name is required.");
      }
      const parsedAmount = parseInt(form.ht_amount, 10);
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error("Billing price must be a valid whole number.");
      }

      for (let i = 0; i < form.sub_tests.length; i++) {
        if (!form.sub_tests[i].st_name.trim()) {
          throw new Error(`Parameter #${i + 1} must have a name.`);
        }
      }

      const payload = {
        ht_code: form.ht_code.trim().toUpperCase(),
        ht_name: form.ht_name.trim(),
        ht_heading: form.ht_heading,
        ht_type: form.ht_type,
        ht_amount: parsedAmount,
        ht_status_id: form.ht_status_id,
        ht_ref_ranges: form.ht_ref_ranges.trim(),
        ht_interpretation: form.ht_interpretation.trim(),
        sub_tests: form.sub_tests.map((st, i) => ({
          ...st,
          st_name: st.st_name.trim(),
          st_print_seq: i + 1,
        })),
      };

      if (form.head_test_id) {
        await updateTest(form.head_test_id, payload);
        setFeedback({
          type: "success",
          message: `Test "${payload.ht_name}" updated successfully.`,
        });
      } else {
        await createTest(payload);
        setFeedback({
          type: "success",
          message: `New test panel "${payload.ht_name}" added to catalog.`,
        });
      }

      resetForm();
      await loadCatalog();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save test. Please check inputs.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(test) {
    try {
      await deleteTestApi(test.head_test_id);
      setFeedback({
        type: "success",
        message: `Test "${test.ht_name}" removed.`,
      });
      await loadCatalog();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Cannot delete test. It may be linked to previous orders.",
      });
    } finally {
      setDeleteCandidate(null);
    }
  }

  return (
    <div className="w-full max-w-[1600px] space-y-3.5">
      {/* Compact Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white shrink-0">
            <FlaskConical size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Test Catalog</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
                {tests.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-7 text-xs text-slate-900 outline-none focus:border-teal-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadCatalog}
            disabled={isLoading}
            title="Refresh catalog"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-teal-600" : ""} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setForm(createBlankHeadTest(statuses[0]?.status_id || 1));
                setShowForm(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
              showForm
                ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            {showForm ? <RotateCcw size={14} /> : <Plus size={14} />}
            <span>{showForm ? "Close Form" : "Add Test Panel"}</span>
          </button>
        </div>
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

      {/* High-Density Compact Test Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              {form.head_test_id ? `Edit Test: ${form.ht_name}` : "New Test Panel"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
              >
                <Save size={13} />
                <span>{isSaving ? "Saving..." : "Save Test"}</span>
              </button>
            </div>
          </div>

          {/* Master Details Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 text-xs">
            {/* Code */}
            <div className="col-span-2 sm:col-span-2">
              <label className={labelClass}>
                <span>Code *</span>
                {!canEditCode && (
                  <span className="text-[10px] text-amber-600 font-normal ml-1 inline-flex items-center gap-0.5">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </label>
              <input
                type="text"
                name="ht_code"
                disabled={!canEditCode}
                value={form.ht_code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ht_code: e.target.value.toUpperCase() }))
                }
                placeholder="e.g. CBC"
                className={`${inputClass} font-mono font-bold uppercase ${
                  !canEditCode ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                }`}
                required
              />
            </div>

            {/* Test Name */}
            <div className="col-span-2 sm:col-span-4">
              <label className={labelClass}>Test Name *</label>
              <input
                type="text"
                name="ht_name"
                value={form.ht_name}
                onChange={handleFormChange}
                placeholder="e.g. Complete Blood Count (CBC)"
                className={inputClass}
                required
              />
            </div>

            {/* Department */}
            <div className="col-span-1 sm:col-span-2">
              <label className={labelClass}>Department</label>
              <select
                name="ht_heading"
                value={form.ht_heading}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="Haematology">Haematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Clinical Pathology">Clinical Pathology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Serology">Serology</option>
                <option value="Immunology">Immunology</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Price */}
            <div className="col-span-1 sm:col-span-2">
              <label className={labelClass}>Price (₹) *</label>
              <input
                type="number"
                name="ht_amount"
                min="0"
                step="1"
                value={form.ht_amount}
                onChange={handleFormChange}
                placeholder="350"
                className={inputClass}
                required
              />
            </div>

            {/* Status */}
            <div className="col-span-1 sm:col-span-1">
              <label className={labelClass}>Status</label>
              <select
                name="ht_status_id"
                value={form.ht_status_id}
                onChange={handleFormChange}
                className={inputClass}
              >
                {statuses.map((s) => (
                  <option key={s.status_id} value={s.status_id}>
                    {s.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="col-span-1 sm:col-span-1">
              <label className={labelClass}>Type</label>
              <select
                name="ht_type"
                value={form.ht_type}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="Profile">Profile</option>
                <option value="Single">Single</option>
                <option value="Panel">Panel</option>
              </select>
            </div>
          </div>

          {/* Master Details Row 2: Clinical Interpretation */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-12">
              <label className={labelClass}>Clinical Interpretation / Report Notes</label>
              <input
                type="text"
                name="ht_interpretation"
                value={form.ht_interpretation}
                onChange={handleFormChange}
                placeholder="Optional report footnotes or clinical notes..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Sub-Test Parameters (High Density Table to Eliminate Scrolling) */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Reportable Sub-Test Parameters ({form.sub_tests.length})
              </span>
              <button
                type="button"
                onClick={addSubTest}
                className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Parameter</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-2.5 py-1.5 w-8 text-center">#</th>
                    <th className="px-2.5 py-1.5 w-44">Parameter Name *</th>
                    <th className="px-2.5 py-1.5 w-24">Unit</th>
                    <th className="px-2.5 py-1.5 w-44">Reference Range</th>
                    <th className="px-2.5 py-1.5 w-32">Method</th>
                    <th className="px-2.5 py-1.5 w-24">Type</th>
                    <th className="px-2 py-1.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.sub_tests.map((st, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-2.5 py-1 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={st.st_name}
                          onChange={(e) =>
                            handleSubTestChange(index, "st_name", e.target.value)
                          }
                          placeholder="e.g. Haemoglobin"
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                          required
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={st.st_unit}
                          onChange={(e) =>
                            handleSubTestChange(index, "st_unit", e.target.value)
                          }
                          placeholder="g/dL"
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={st.st_ref_ranges}
                          onChange={(e) =>
                            handleSubTestChange(index, "st_ref_ranges", e.target.value)
                          }
                          placeholder="13.0 - 17.0"
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={st.st_method}
                          onChange={(e) =>
                            handleSubTestChange(index, "st_method", e.target.value)
                          }
                          placeholder="Cyanmethemoglobin"
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={st.st_type}
                          onChange={(e) =>
                            handleSubTestChange(index, "st_type", e.target.value)
                          }
                          className="w-full rounded border border-slate-200 px-1 py-1 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                        >
                          <option value="Numeric">Numeric</option>
                          <option value="Text">Text</option>
                        </select>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeSubTest(index)}
                          title="Remove parameter"
                          className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      )}

      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-teal-600 text-white shadow-2xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* High-Density Catalog Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 w-24">Code</th>
                  <th className="px-4 py-2.5">Test Name & Department</th>
                  <th className="px-3 py-2.5 w-24">Type</th>
                  <th className="px-3 py-2.5 w-28">Parameters</th>
                  <th className="px-4 py-2.5 w-28 text-right">Price</th>
                  <th className="px-3 py-2.5 w-20 text-center">Status</th>
                  <th className="px-4 py-2.5 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-2.5">
                      <div className="h-4 w-12 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="h-4 w-36 rounded bg-slate-200 mb-1" />
                      <div className="h-3 w-20 rounded bg-slate-100" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-4 w-14 rounded bg-slate-200" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="h-4 w-12 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="h-4 w-14 rounded bg-slate-200 ml-auto" />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="h-4 w-12 rounded bg-emerald-100/70 mx-auto" />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="h-6 w-12 rounded bg-slate-100 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/60 py-3 text-xs font-semibold text-teal-700">
              <RefreshCw size={13} className="animate-spin text-teal-600" />
              <span>Fetching laboratory test catalog...</span>
            </div>
          </div>
        ) : filteredTests.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-2.5 w-24">Code</th>
                <th className="px-4 py-2.5">Test Name & Department</th>
                <th className="px-3 py-2.5 w-24">Type</th>
                <th className="px-3 py-2.5 w-28">Parameters</th>
                <th className="px-4 py-2.5 w-28 text-right">Price</th>
                <th className="px-3 py-2.5 w-20 text-center">Status</th>
                <th className="px-4 py-2.5 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test) => {
                const isExpanded = expandedRowId === test.head_test_id;
                const paramCount = test.sub_tests?.length || 0;

                return (
                  <tr key={test.head_test_id} className="hover:bg-slate-50/60 transition">
                    {/* Code */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {test.ht_code}
                      </span>
                    </td>

                    {/* Test Name & Department */}
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-900 text-sm">
                        {test.ht_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {test.ht_heading || "General"}
                        {test.ht_interpretation && ` · ${test.ht_interpretation}`}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5 text-slate-600">
                      {test.ht_type || "Profile"}
                    </td>

                    {/* Parameter Count & Expand */}
                    <td className="px-3 py-2.5">
                      {paramCount > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRowId(isExpanded ? null : test.head_test_id)
                          }
                          className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                        >
                          <span>{paramCount} parameters</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}

                      {isExpanded && test.sub_tests && (
                        <div className="mt-1.5 rounded bg-slate-50 p-2 border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                          {test.sub_tests.map((st, i) => (
                            <div key={st.sub_test_id || i} className="flex justify-between">
                              <span>
                                {i + 1}. {st.st_name}
                              </span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {st.st_ref_ranges || st.st_unit || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 font-mono text-sm">
                      ₹{Number(test.ht_amount || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          (test.ht_status || "").toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {test.ht_status || "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(test)}
                          title="Edit test"
                          className="rounded p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(test)}
                          title="Delete test"
                          className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
          <div className="p-12 text-center text-xs font-semibold text-slate-400">
            No laboratory tests found matching your criteria.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-xs text-slate-600">
              Are you sure you want to delete test{" "}
              <strong className="text-slate-900">{deleteCandidate.ht_name}</strong> (
              {deleteCandidate.ht_code})?
            </p>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteCandidate)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
