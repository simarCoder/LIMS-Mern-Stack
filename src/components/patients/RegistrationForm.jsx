import { useState, useMemo } from "react";
import {
  UserRoundPlus,
  ClipboardList,
  Search,
  RefreshCw,
  Printer,
  CheckCircle2,
} from "lucide-react";

const initialForm = {
  honorific_title: "Mr.",
  patient_name: "",
  patient_age: "",
  patient_age_type: "Years",
  patient_gender: "Male",
  patient_phone: "",
  patient_email: "",
  patient_address: "",
  machine_id: "",
  patient_Relation: "",
  patient_Relation_Name: "",
};

const fieldClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10";
const currency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(amount) || 0,
  );

export default function RegistrationForm({ tests = [], onSubmit, isSaving }) {
  const [formData, setFormData] = useState(initialForm);
  const [selectedTests, setSelectedTests] = useState([]);
  const [discount, setDiscount] = useState("0");
  const [testSearch, setTestSearch] = useState("");
  const [error, setError] = useState("");

  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) =>
      [t.ht_name, t.ht_code, t.ht_heading, t.ht_type].some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [tests, testSearch]);

  const chosenTests = tests.filter((t) =>
    selectedTests.includes(t.head_test_id),
  );
  const subtotal = chosenTests.reduce(
    (sum, t) => sum + Number(t.ht_amount || 0),
    0,
  );
  const discountValue = Number(discount);
  const validDiscount =
    discount.trim() !== "" &&
    Number.isFinite(discountValue) &&
    discountValue >= 0 &&
    discountValue <= subtotal;
  const total = validDiscount ? subtotal - discountValue : subtotal;

  function changeField(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleTest(id) {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const name = formData.patient_name.trim();
    const age = Number(formData.patient_age);

    if (!name) return setError("Enter patient full name.");
    if (
      formData.patient_age === "" ||
      !Number.isInteger(age) ||
      age < 0 ||
      age > 130
    ) {
      return setError("Enter a valid age between 0 and 130.");
    }
    if (!selectedTests.length)
      return setError("Select at least one head test.");
    if (!validDiscount)
      return setError("Discount must be between ₹0 and subtotal.");

    onSubmit({
      patient: {
        ...formData,
        patient_name: name,
        patient_age: age,
        patient_relation:
          formData.patient_Relation === "Select"
            ? ""
            : formData.patient_Relation,
      },
      head_test_ids: selectedTests,
      discount: discountValue,
    }).catch((err) => setError(err.message || "Could not save registration."));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-800">
          <UserRoundPlus size={20} />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">New patient registration</h2>
          <p className="text-l text-slate-500">
            Enter patient details, pick tests & generate receipt
          </p>
        </div>
      </div>

      {error && (
        <div className="m-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,1.6fr)_minmax(0,1.5fr)]"> */}
      <div className="flex flex-col">
        {/* Left: Patient Metadata */}
        <div className="border-b xl:border-b-0 xl:border-r border-slate-200 p-5 grid grid-cols-1 gap-4 sm:grid-cols-25">
          <div className="sm:col-span-2">
            <label className="text-l font-semibold text-slate-700">
              Title *
            </label>
            <select
              name="honorific_title"
              value={formData.honorific_title}
              onChange={changeField}
              className={fieldClass}
            >
              {["Mr.", "Ms.", "Mrs.", "Master", "Dr."].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-l font-semibold text-slate-700">
              Full Name *
            </label>
            <input
              name="patient_name"
              value={formData.patient_name}
              onChange={changeField}
              className={fieldClass}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="no-spinners text-l font-semibold text-slate-700">
              Age *
            </label>
            <input
              name="patient_age"
              type="number"
              min="0"
              max="130"
              value={formData.patient_age}
              onChange={changeField}
              className={fieldClass}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-l font-semibold text-slate-700">
              Unit *
            </label>
            <select
              name="patient_age_type"
              value={formData.patient_age_type}
              onChange={changeField}
              className={fieldClass}
            >
              {["Years", "Months", "Days"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-l font-semibold text-slate-700">
              Relation
            </label>
            <select
              name="patient_Relation"
              value={formData.patient_Relation}
              onChange={changeField}
              className={fieldClass}
            >
              {["Select", "S/o", "D/o", "W/o"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-l font-semibold text-slate-700">
              Relation Name *
            </label>
            <input
              name="patient_Relation_Name"
              type="text"
              min="0"
              max="130"
              value={formData.patient_Relation_Name}
              onChange={changeField}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-l font-semibold text-slate-700">
              Gender *
            </label>
            <select
              name="patient_gender"
              value={formData.patient_gender}
              onChange={changeField}
              className={fieldClass}
            >
              {["Male", "Female", "Other", "Prefer not to say"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-l font-semibold text-slate-700">Phone</label>
            <input
              name="patient_phone"
              value={formData.patient_phone}
              onChange={changeField}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-l font-semibold text-slate-700">Email</label>
            <input
              name="patient_email"
              type="email"
              value={formData.patient_email}
              onChange={changeField}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-l font-semibold text-slate-700">
              Address
            </label>
            <input
              name="patient_address"
              value={formData.patient_address}
              onChange={changeField}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Right: Catalog Test Selector & Order Summary */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="text-teal-700" size={18} />
              <h3 className="font-bold text-slate-900">
                Select Head Tests ({selectedTests.length} chosen)
              </h3>
            </div>

            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder="Search tests catalog..."
                className={`${fieldClass} pl-9`}
              />
            </div>

            {/* Always visible test options box */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2 bg-slate-50 space-y-1">
              {!filteredTests.length ? (
                <p className="text-l text-slate-500 p-2">No tests available.</p>
              ) : (
                filteredTests.map((t) => {
                  const checked = selectedTests.includes(t.head_test_id);
                  return (
                    <button
                      type="button"
                      key={t.head_test_id}
                      onClick={() => toggleTest(t.head_test_id)}
                      className={`flex w-full items-center justify-between p-2 rounded-md text-left text-sm transition ${
                        checked
                          ? "bg-teal-100 text-teal-900 font-semibold"
                          : "hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2
                          size={16}
                          className={
                            checked ? "text-teal-700" : "text-slate-300"
                          }
                        />
                        {t.ht_name}
                      </span>
                      <span className="font-bold">{currency(t.ht_amount)}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-xl border p-3 bg-white space-y-2 mt-3">
              <div className="flex justify-between font-bold text-sm">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              <label className="block text-l font-medium">
                Discount (₹)
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-l text-slate-300">Total Payable</p>
              <p className="text-2xl font-bold">{currency(total)}</p>
            </div>
            <button
              type="submit"
              disabled={isSaving || !selectedTests.length || !validDiscount}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Printer size={16} />
              )}{" "}
              Save & Generate Slip
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
