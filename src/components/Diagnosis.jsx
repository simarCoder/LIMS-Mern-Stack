import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Save, Search, FlaskConical } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function Diagnosis() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchOrders = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/diagnosis/orders`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Could not load orders for diagnosis.");
    return Array.isArray(data) ? data : [];
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      setError(e.message || "Unable to load diagnosis orders.");
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    let cancelled = false;

    fetchOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e.message || "Unable to load diagnosis orders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchOrders]);

  function updateLocal(orderItemId, rowId, key, value) {
    setOrders((current) =>
      current.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.id !== orderItemId
            ? item
            : {
                ...item,
                sub_tests: item.sub_tests.map((st) =>
                  st.id === rowId ? { ...st, [key]: value } : st,
                ),
              },
        ),
      })),
    );
  }

  async function saveResult(st) {
    setError("");
    setNotice("");
    setSavingId(st.id);
    try {
      const response = await fetch(
        `${API_URL}/api/order-subtests/${st.id}/result`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            result_value: st.result_value || "",
            result_notes: st.result_notes || "",
            result_status: st.result_status || "Pending",
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save result.");
      setNotice(`Saved ${st.st_name}.`);
      await load();
    } catch (e) {
      setError(e.message || "Unable to save result.");
    } finally {
      setSavingId(null);
    }
  }

  const visibleOrders = orders.filter((order) => {
    const haystack =
      `${order.order_no} ${order.patient?.patient_name} ${order.patient?.patientId} ${order.items?.map((item) => item.ht_name).join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  });

  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Workspace / Diagnosis
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Diagnosis & result entry
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Each ordered head test contains its own sub-test result fields.
            Sub-tests are not billed separately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <RefreshCw size={15} /> Refresh
        </button>
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
      <label className="relative block max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          className={`${inputClass} pl-9`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patient, order or test…"
        />
      </label>
      {loading ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">
          Loading orders…
        </p>
      ) : visibleOrders.length ? (
        visibleOrders.map((order) => (
          <section
            key={order.id}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {order.patient?.patient_name || "Patient"}
                </h2>
                <p className="text-xs text-slate-500">
                  {order.patient?.patientId || "—"} · {order.order_no} ·{" "}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString("en-IN")
                    : ""}
                </p>
              </div>
              <div className="text-sm font-semibold">
                Total: ₹{Number(order.total || 0).toFixed(2)}
              </div>
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="mb-3 flex items-center gap-2">
                  <FlaskConical size={17} className="text-teal-700" />
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.ht_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {item.ht_code} · billed once · ₹
                      {Number(item.unit_price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                {item.sub_tests?.length ? (
                  <div className="space-y-3">
                    {item.sub_tests.map((st) => (
                      <div
                        key={st.id}
                        className="grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-[minmax(130px,0.8fr)_minmax(160px,1fr)_minmax(150px,1fr)_130px_auto] md:items-end"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {st.st_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {st.st_unit || "No unit configured"}
                          </p>
                          {st.st_ref_ranges && (
                            <p className="mt-1 text-xs text-slate-500">
                              Reference: {st.st_ref_ranges}
                            </p>
                          )}
                        </div>
                        <label className="text-xs font-semibold text-slate-600">
                          Result
                          <input
                            className={`${inputClass} mt-1`}
                            value={st.result_value || ""}
                            onChange={(e) =>
                              updateLocal(
                                item.id,
                                st.id,
                                "result_value",
                                e.target.value,
                              )
                            }
                            placeholder={st.st_default_value || "Enter result"}
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Notes
                          <input
                            className={`${inputClass} mt-1`}
                            value={st.result_notes || ""}
                            onChange={(e) =>
                              updateLocal(
                                item.id,
                                st.id,
                                "result_notes",
                                e.target.value,
                              )
                            }
                            placeholder="Optional notes"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Status
                          <select
                            className={`${inputClass} mt-1`}
                            value={st.result_status || "Pending"}
                            onChange={(e) =>
                              updateLocal(
                                item.id,
                                st.id,
                                "result_status",
                                e.target.value,
                              )
                            }
                          >
                            <option>Pending</option>
                            <option>Entered</option>
                            <option>Verified</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={savingId === st.id}
                          onClick={() => void saveResult(st)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          <Save size={14} />
                          {savingId === st.id ? "Saving" : "Save"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    No sub-tests were configured when this order was created.
                    Add them in Test Master for future orders.
                  </p>
                )}
              </div>
            ))}
          </section>
        ))
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No matching orders. Orders created after the migration will include
          snapshots of their configured sub-tests.
        </div>
      )}
    </main>
  );
}
