import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  Save,
  X,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
const blankSubTest = () => ({
  st_name: "",
  st_method: "",
  st_type: "",
  st_unit: "",
  st_default_value: "",
  st_ref_ranges: "",
  st_interpretation: "",
  st_print_seq: 1,
});
const blankTest = () => ({
  head_test_id: null,
  ht_code: "",
  ht_name: "",
  ht_heading: "",
  ht_type: "",
  ht_amount: "",
  ht_status_id: "",
  ht_ref_ranges: "",
  ht_interpretation: "",
  sub_tests: [],
});
const field =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [form, setForm] = useState(blankTest());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchCatalog = useCallback(async () => {
    const [testRes, statusRes] = await Promise.all([
      fetch(`${API_URL}/api/tests?all=1`),
      fetch(`${API_URL}/api/statuses`),
    ]);
    const testData = await testRes.json();
    const statusData = await statusRes.json();
    if (!testRes.ok)
      throw new Error(testData.error || "Could not load tests.");
    if (!statusRes.ok)
      throw new Error(statusData.error || "Could not load statuses.");
    if (!Array.isArray(testData) || !Array.isArray(statusData))
      throw new Error("Unexpected test catalog response.");
    return { testData, statusData };
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const { testData, statusData } = await fetchCatalog();
      setTests(testData);
      setStatuses(statusData);
      setForm((current) =>
        current.ht_status_id || !statusData.length
          ? current
          : {
              ...current,
              ht_status_id:
                statusData.find((s) => s.status.toLowerCase() === "active")
                  ?.status_id ?? statusData[0].status_id,
            },
      );
    } catch (e) {
      setError(
        `${e.message} Ensure the backend is running and the database migration has completed.`,
      );
    } finally {
      setLoading(false);
    }
  }, [fetchCatalog]);

  useEffect(() => {
    let cancelled = false;

    fetchCatalog()
      .then(({ testData, statusData }) => {
        if (cancelled) return;
        setTests(testData);
        setStatuses(statusData);
        setForm((current) =>
          current.ht_status_id || !statusData.length
            ? current
            : {
                ...current,
                ht_status_id:
                  statusData.find((s) => s.status.toLowerCase() === "active")
                    ?.status_id ?? statusData[0].status_id,
              },
        );
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            `${e.message} Ensure the backend is running and the database migration has completed.`,
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchCatalog]);

  const visibleTests = useMemo(
    () =>
      tests.filter((t) =>
        `${t.ht_name} ${t.ht_code} ${t.ht_heading || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [tests, query],
  );
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function edit(test) {
    setNotice("");
    setError("");
    setForm({
      ...test,
      ht_amount: String(test.ht_amount ?? 0),
      ht_status_id: String(test.ht_status_id ?? ""),
      sub_tests: (test.sub_tests || []).map((st) => ({ ...st })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() {
    const active = statuses.find((s) => s.status.toLowerCase() === "active");
    setForm({
      ...blankTest(),
      ht_status_id: active ? String(active.status_id) : "",
    });
    setError("");
    setNotice("");
  }
  function updateSub(index, key, value) {
    setForm((current) => ({
      ...current,
      sub_tests: current.sub_tests.map((st, i) =>
        i === index ? { ...st, [key]: value } : st,
      ),
    }));
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        ht_amount: Number(form.ht_amount),
        ht_status_id: Number(form.ht_status_id),
        sub_tests: form.sub_tests.map((st, index) => ({
          ...st,
          st_print_seq: Number(st.st_print_seq) || index + 1,
        })),
      };
      const url = form.head_test_id
        ? `${API_URL}/api/tests/${form.head_test_id}`
        : `${API_URL}/api/tests`;
      const response = await fetch(url, {
        method: form.head_test_id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save test.");
      setNotice(data.message || "Test saved.");
      await load();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTest(test) {
    if (
      !window.confirm(
        `Delete test "${test.ht_name}"? Tests already used in orders cannot be permanently deleted.`,
      )
    )
      return;
    setError("");
    setNotice("");
    setDeletingId(test.head_test_id);
    try {
      const response = await fetch(
        `${API_URL}/api/tests/${test.head_test_id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete test.");
      setNotice(data.message || "Test deleted.");
      if (form.head_test_id === test.head_test_id) reset();
      await load();
    } catch (e) {
      setError(e.message || "Unable to delete test.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Workspace / Test master
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Test configuration
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage head tests, prices, reference information, interpretations and
          sub-test definitions.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}
      <form
        onSubmit={submit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <FlaskConical size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">
                {form.head_test_id ? "Edit head test" : "Add head test"}
              </h2>
              <p className="text-xs text-slate-500">
                Code is kept stable when editing to protect linked sub-tests.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <X size={15} /> Clear
          </button>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <section className="space-y-4 rounded-lg border border-slate-200 p-3 sm:p-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                Head test details
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                This is the billable test selected during patient registration.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Test code *
                <input
                  required
                  disabled={Boolean(form.head_test_id)}
                  value={form.ht_code}
                  onChange={(e) => update("ht_code", e.target.value)}
                  placeholder="e.g. cbc"
                  className={field}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Head test name *
                <input
                  required
                  value={form.ht_name}
                  onChange={(e) => update("ht_name", e.target.value)}
                  placeholder="Complete Blood Count"
                  className={field}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Heading / category
                <input
                  value={form.ht_heading}
                  onChange={(e) => update("ht_heading", e.target.value)}
                  placeholder="Haematology"
                  className={field}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Test type
                <input
                  value={form.ht_type}
                  onChange={(e) => update("ht_type", e.target.value)}
                  placeholder="Profile / Single / Panel"
                  className={field}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Price (₹) *
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={form.ht_amount}
                  onChange={(e) => update("ht_amount", e.target.value)}
                  className={field}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status *
                <select
                  required
                  value={form.ht_status_id}
                  onChange={(e) => update("ht_status_id", e.target.value)}
                  className={field}
                >
                  <option value="">Choose status</option>
                  {statuses.map((s) => (
                    <option key={s.status_id} value={s.status_id}>
                      {s.status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Test-level reference ranges
                <textarea
                  rows={2}
                  value={form.ht_ref_ranges}
                  onChange={(e) => update("ht_ref_ranges", e.target.value)}
                  placeholder="Optional general reference notes"
                  className={field}
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Test interpretation
                <textarea
                  rows={3}
                  value={form.ht_interpretation}
                  onChange={(e) => update("ht_interpretation", e.target.value)}
                  placeholder="Optional clinical interpretation guidance"
                  className={field}
                />
              </label>
            </div>
          </section>
          <section className="space-y-3 rounded-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">Sub-tests</h3>
                <p className="text-xs text-slate-500">
                  Each sub-test can have its own type, unit, reference range and
                  interpretation.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    sub_tests: [
                      ...current.sub_tests,
                      {
                        ...blankSubTest(),
                        st_print_seq: current.sub_tests.length + 1,
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
              >
                <Plus size={15} /> Add sub-test
              </button>
            </div>
            {!form.sub_tests.length && (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No sub-tests added. Add one if this test contains reportable
                components.
              </p>
            )}
            {form.sub_tests.map((st, i) => (
              <div
                key={i}
                className="space-y-3 rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Sub-test {i + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        sub_tests: current.sub_tests.filter(
                          (_, index) => index !== i,
                        ),
                      }))
                    }
                    aria-label={`Remove sub-test ${i + 1}`}
                    className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Sub-test name *
                    <input
                      required
                      value={st.st_name}
                      onChange={(e) => updateSub(i, "st_name", e.target.value)}
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Sub-test type
                    <input
                      value={st.st_type || ""}
                      onChange={(e) => updateSub(i, "st_type", e.target.value)}
                      placeholder="Numeric / Text"
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Unit
                    <input
                      value={st.st_unit || ""}
                      onChange={(e) => updateSub(i, "st_unit", e.target.value)}
                      placeholder="g/dL, %, cells/µL"
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Method
                    <input
                      value={st.st_method || ""}
                      onChange={(e) =>
                        updateSub(i, "st_method", e.target.value)
                      }
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Default value
                    <input
                      value={st.st_default_value || ""}
                      onChange={(e) =>
                        updateSub(i, "st_default_value", e.target.value)
                      }
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Print sequence
                    <input
                      type="number"
                      min="1"
                      value={st.st_print_seq ?? i + 1}
                      onChange={(e) =>
                        updateSub(i, "st_print_seq", e.target.value)
                      }
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
                    Sub-test reference ranges
                    <textarea
                      rows={2}
                      value={st.st_ref_ranges || ""}
                      onChange={(e) =>
                        updateSub(i, "st_ref_ranges", e.target.value)
                      }
                      placeholder="e.g. Adult male: ...; adult female: ..."
                      className={field}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
                    Sub-test interpretation
                    <textarea
                      rows={2}
                      value={st.st_interpretation || ""}
                      onChange={(e) =>
                        updateSub(i, "st_interpretation", e.target.value)
                      }
                      className={field}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            disabled={saving || !statuses.length}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <Save size={16} />
            {saving
              ? "Saving…"
              : form.head_test_id
                ? "Save changes"
                : "Create test"}
          </button>
        </div>
      </form>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Test catalog</h2>
            <p className="text-xs text-slate-500">
              Includes inactive tests for administration.
            </p>
          </div>
          <div className="flex gap-2">
            <label className="relative flex-1 sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tests…"
                className={`${field} mt-0 pl-9`}
              />
            </label>
            <button
              type="button"
              onClick={load}
              aria-label="Refresh catalog"
              className="rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading catalog…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {[
                    "Test",
                    "Code",
                    "Type / Category",
                    "Price",
                    "Status",
                    "Sub-tests",
                    "Action",
                  ].map((x) => (
                    <th key={x} className="border-b border-slate-200 px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTests.map((t) => (
                  <tr key={t.head_test_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {t.ht_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.ht_code}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {[t.ht_type, t.ht_heading].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      ₹{Number(t.ht_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${t.ht_status?.toLowerCase() === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {t.ht_status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.sub_tests?.length || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => edit(t)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-white"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === t.head_test_id}
                        onClick={() => deleteTest(t)}
                        className="ml-1 inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 size={13} />{" "}
                        {deletingId === t.head_test_id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleTests.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No tests match this search.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
