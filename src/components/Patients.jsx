// === IMPORTS ====

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Trash2,
  Printer,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";

// OTHER THINGS

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
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
};
const field =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-1 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10";
const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
// const fields = [
//   {
//     name: "honorific_title",
//     label: "Title",
//     type: "select",
//     options: ["Mr.", "Ms.", "Mrs.", "Master", "Dr."],
//     required: true,
//   },
//   {
//     name: "patient_name",
//     label: "Full name",
//     type: "text",
//     placeholder: "e.g. Gurpreet Singh",
//     required: true,
//     wide: true,
//   },
//   {
//     name: "patient_age",
//     label: "Age",
//     type: "number",
//     min: 0,
//     required: true,
//   },
//   {
//     name: "patient_age_type",
//     label: "Age unit",
//     type: "select",
//     options: ["Years", "Months", "Days"],
//     required: true,
//   },
//   {
//     name: "patient_gender",
//     label: "Gender",
//     type: "select",
//     options: ["Male", "Female", "Other", "Prefer not to say"],
//     required: true,
//   },
//   {
//     name: "patient_phone",
//     label: "Phone number",
//     type: "tel",
//     placeholder: "Phone number",
//   },
//   {
//     name: "patient_email",
//     label: "Email",
//     type: "email",
//     placeholder: "patient@example.com",
//     wide: true,
//   },
//   {
//     name: "patient_address",
//     label: "Address",
//     type: "text",
//     placeholder: "Street, area, city",
//     wide: true,
//   },
//   {
//     name: "machine_id",
//     label: "Machine ID",
//     type: "text",
//     placeholder: "Optional ID",
//   },
// ];

export default function Patients({ patients = [], setPatients }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [discount, setDiscount] = useState("0");
  const [search, setSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);
  const [actionError, setActionError] = useState("");

  async function loadPatients() {
    setIsLoading(true);
    setApiError("");

    try {
      const response = await fetch(`${API_URL}/api/patients`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not load patient records.");
      if (!Array.isArray(data))
        throw new Error("Unexpected patient-list response.");
      setPatients(data);
    } catch (e) {
      setApiError(e.message || "Unable to connect to patient service.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const response = await fetch(`${API_URL}/api/patients`);
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load patient records.");
        if (!Array.isArray(data))
          throw new Error("Unexpected patient-list response.");
        if (!cancelled) setPatients(data);
      } catch (e) {
        if (!cancelled)
          setApiError(e.message || "Unable to connect to patient service.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      try {
        const response = await fetch(`${API_URL}/api/tests?all=1`);
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load the head-test catalog.");
        if (!Array.isArray(data))
          throw new Error("Unexpected head-test catalog response.");
        if (!cancelled) setTests(data);
      } catch (e) {
        if (!cancelled)
          setError(e.message || "Unable to load test catalog.");
      }
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [setPatients]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [
        p.patientId,
        p.patient_name,
        p.patient_gender,
        p.patient_phone,
        p.patient_email,
      ].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [patients, search]);
  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => {
      const searchableValues = [
        t.ht_name,
        t.ht_code,
        t.ht_heading,
        t.ht_type,
        t.ht_status,
        ...(Array.isArray(t.sub_tests)
          ? t.sub_tests.flatMap((subTest) => [
              subTest.st_name,
              subTest.st_method,
              subTest.st_default_value,
            ])
          : []),
      ];
      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(q),
      );
    });
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

  function changeField(event) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }
  function toggleTest(id) {
    setSelectedTests((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }
  function resetRegistration() {
    setFormData(initialForm);
    setSelectedTests([]);
    setDiscount("0");
    setTestSearch("");
    setError("");
    setReceipt(null);
    setShowForm(true);
  }
  async function saveRegistration(event) {
    event.preventDefault();
    setError("");
    const name = formData.patient_name.trim();
    const age = Number(formData.patient_age);
    if (!name) return setError("Enter the patient's full name.");
    if (
      formData.patient_age === "" ||
      !Number.isInteger(age) ||
      age < 0 ||
      age > 130
    )
      return setError("Enter a valid age between 0 and 130.");
    if (!selectedTests.length)
      return setError("Select at least one active test.");
    if (!validDiscount)
      return setError("Discount must be between ₹0 and the subtotal.");
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: {
            ...formData,
            patient_name: name,
            patient_age: age,
          },
          head_test_ids: selectedTests,
          discount: discountValue,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save registration.");
      if (!data.patient || !data.order)
        throw new Error(
          "The server did not return the saved patient and receipt details.",
        );
      setPatients((current) => [
        data.patient,
        ...current.filter((p) => p.id !== data.patient.id),
      ]);
      setReceipt(data.order);
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Unable to save registration.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePatientEdit(event) {
    event.preventDefault();
    if (!editingPatient) return;
    setActionError("");
    setIsUpdatingPatient(true);
    try {
      const response = await fetch(
        `${API_URL}/api/patients/${editingPatient.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editingPatient,
            patient_name: editingPatient.patient_name.trim(),
            patient_age: Number(editingPatient.patient_age),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not update patient.");
      setPatients((current) =>
        current.map((p) => (p.id === data.patient.id ? data.patient : p)),
      );
      setEditingPatient(null);
    } catch (e) {
      setActionError(e.message || "Unable to update patient.");
    } finally {
      setIsUpdatingPatient(false);
    }
  }

  async function deletePatient(patient) {
    const confirmed = window.confirm(
      `Delete ${patient.honorific_title || ""} ${patient.patient_name}? Patients with order history cannot be permanently deleted.`,
    );
    if (!confirmed) return;
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/api/patients/${patient.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not delete patient.");
      setPatients((current) => current.filter((p) => p.id !== patient.id));
    } catch (e) {
      setActionError(e.message || "Unable to delete patient.");
    }
  }

  if (receipt)
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
              <CheckCircle2 size={15} className="mr-1 inline" />
              Patient and order saved successfully.
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
              onClick={resetRegistration}
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
            <p className="mt-1 text-sm text-slate-500">
              Laboratory test booking
            </p>
          </div>
          <div className="grid gap-4 border-b border-slate-100 py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Receipt / Order no.</p>
              <p className="mt-1 font-bold text-slate-900">
                {receipt.order_no}
              </p>
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
            <table className="w-full min-w-105 text-left text-sm">
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
                      <span className="block text-xs font-normal text-slate-500">
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
          <div className="ml-auto mt-5 max-w-xs space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{currency(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discount / concession</span>
              <span>{currency(receipt.discount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
              <span>Total payable</span>
              <span>{currency(receipt.total)}</span>
            </div>
          </div>
          <p className="mt-8 border-t border-dashed border-slate-300 pt-4 text-center text-xs text-slate-500">
            This receipt confirms test registration. It does not confirm payment
            or include laboratory results.
          </p>
        </article>
        <style>{`@media print { body * { visibility: hidden !important; } #patient-receipt, #patient-receipt * { visibility: visible !important; } #patient-receipt { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; } @page { margin: 12mm; } }`}</style>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Workspace / Patients
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Patient register
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Register a patient, add tests, review charges and print their
            receipt in one workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setError("");
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 sm:self-auto"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}{" "}
          {showForm ? "Close registration" : "New registration"}
        </button>
      </section>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      {showForm && (
        <form
          onSubmit={saveRegistration}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-800">
                <UserRoundPlus size={20} />
              </span>
              <div>
                <h2 className="text-x font-bold text-slate-900">
                  New patient registration
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Enter patient details, select tests and generate the slip from
                  one screen.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-0 xl:grid-cols-[minmax(320px,1.6fr)_minmax(0,1.5fr)]">
            <section className="min-w-0 border-b border-slate-200 p-5 sm:p-6 xl:border-b-0 xl:border-r">
              <div className=" flex items-start gap-3">
                {/* <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700">
                  <UserRound size={18} />
                </span> */}
                {/* <div>
                  <h3 className="font-bold text-slate-900">Patient details</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Fields marked <span className="text-rose-600">*</span> are
                    required.
                  </p>
                </div> */}
              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-14">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="honorific_title"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Title <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="honorific_title"
                    name="honorific_title"
                    required
                    value={formData.honorific_title}
                    onChange={changeField}
                    className={field}
                  >
                    {["Mr.", "Ms.", "Mrs.", "Master", "Dr."].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Full name */}
                <div className="sm:col-span-6">
                  <label
                    htmlFor="patient_name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Full name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="patient_name"
                    name="patient_name"
                    type="text"
                    placeholder="e.g. Gurpreet Singh"
                    required
                    value={formData.patient_name}
                    onChange={changeField}
                    className={field}
                  />
                </div>

                {/* Age */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="patient_age"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Age <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="patient_age"
                    name="patient_age"
                    type="number"
                    min={0}
                    max={130}
                    required
                    value={formData.patient_age}
                    onChange={changeField}
                    className={field}
                  />
                </div>

                {/* Age unit */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="patient_age_type"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Age unit <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="patient_age_type"
                    name="patient_age_type"
                    required
                    value={formData.patient_age_type}
                    onChange={changeField}
                    className={field}
                  >
                    {["Years", "Months", "Days"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Relation with */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="patient_Relation"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Relation <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="patient_Relation"
                    name="patient_Relation"
                    required
                    value={formData.patient_age_type}
                    onChange={changeField}
                    className={field}
                  >
                    {["Select", "S/o", "D/o", "W/o"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="patient_gender"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Gender <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="patient_gender"
                    name="patient_gender"
                    required
                    value={formData.patient_gender}
                    onChange={changeField}
                    className={field}
                  >
                    {["Male", "Female", "Other", "Prefer not to say"].map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Phone number */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="patient_phone"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Phone number
                  </label>
                  <input
                    id="patient_phone"
                    name="patient_phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.patient_phone}
                    onChange={changeField}
                    className={field}
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="patient_email"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email
                  </label>
                  <input
                    id="patient_email"
                    name="patient_email"
                    type="email"
                    value={formData.patient_email}
                    onChange={changeField}
                    className={field}
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-4">
                  <label
                    htmlFor="patient_address"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Address
                  </label>
                  <input
                    id="patient_address"
                    name="patient_address"
                    type="text"
                    placeholder="Street, area, city"
                    value={formData.patient_address}
                    onChange={changeField}
                    className={field}
                  />
                </div>

                {/* Machine ID */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="machine_id"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Machine ID
                  </label>
                  <input
                    id="machine_id"
                    name="machine_id"
                    type="text"
                    value={formData.machine_id}
                    onChange={changeField}
                    className={field}
                  />
                </div>
              </div>

              {/* <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-sm text-sky-900">
                <p className="font-semibold">Registration preview</p>
                <p className="mt-1 leading-5 text-sky-800">
                  {formData.patient_name.trim() ||
                    "Patient name will appear here"}
                </p>
                <p className="mt-0.5 text-xs text-sky-700">
                  {formData.patient_age
                    ? `${formData.patient_age} ${formData.patient_age_type}`
                    : "Age not entered"}{" "}
                  · {formData.patient_gender || "Gender not selected"}
                </p>
              </div> */}
            </section>

            <section className="min-w-0 p-5 sm:p-6">
              <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <ClipboardList size={18} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Test selection & slip
                    </h3>
                  </div>
                </div>
                <label className="relative block w-full sm:max-w-64">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search name, code…"
                    className={`${field} mt-0 pl-9`}
                  />
                </label>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">
                  Find a head test
                </p>
                <p className="text-xs text-slate-500">
                  {tests.length} tests loaded · {selectedTests.length} selected
                </p>
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/10">
                  <Search size={17} className="shrink-0 text-slate-400" />
                  <input
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search by test name, code, type, category, or parameter…"
                    className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
                    aria-label="Search head tests"
                    aria-expanded={Boolean(testSearch.trim())}
                    aria-controls="head-test-search-results"
                    autoComplete="off"
                  />
                  {testSearch && (
                    <button
                      type="button"
                      onClick={() => setTestSearch("")}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear test search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {testSearch.trim() && (
                  <div
                    id="head-test-search-results"
                    className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    {!tests.length ? (
                      <p className="p-4 text-sm text-slate-500">
                        No head tests were returned by the server.
                      </p>
                    ) : filteredTests.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">
                        No head tests match “{testSearch}”. Try another keyword.
                      </p>
                    ) : (
                      filteredTests.slice(0, 50).map((test) => {
                        const checked = selectedTests.includes(
                          test.head_test_id,
                        );
                        const statusLabel =
                          test.ht_status ||
                          (test.ht_status_id != null
                            ? `Status ${test.ht_status_id}`
                            : "Status not set");
                        return (
                          <button
                            type="button"
                            key={test.head_test_id}
                            onClick={() => toggleTest(test.head_test_id)}
                            className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${checked ? "bg-teal-50" : "hover:bg-slate-50"}`}
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${checked ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-transparent"}`}
                            >
                              <CheckCircle2 size={14} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900">
                                {test.ht_name || "Unnamed head test"}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-slate-500">
                                {[
                                  test.ht_code,
                                  test.ht_heading,
                                  test.ht_type,
                                  statusLabel,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-bold text-slate-800">
                              {currency(test.ht_amount)}
                            </span>
                            <span className="shrink-0 text-xs font-medium text-teal-700">
                              {checked ? "Selected" : "Add"}
                            </span>
                          </button>
                        );
                      })
                    )}
                    {filteredTests.length > 50 && (
                      <p className="px-3 py-2 text-xs text-slate-500">
                        Showing the first 50 matches. Refine your search for
                        more specific results.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {!tests.length && !error && (
                <p className="mt-2 text-xs text-slate-500">
                  The head-test catalog is empty. Check the Test Settings data
                  and API response.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-2 text-sm text-rose-600">
                  {error}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Start typing to search the complete head-test catalog.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)]">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-slate-900">Slip summary</h4>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {chosenTests.length} test(s)
                    </span>
                  </div>
                  <div className="mt-3 max-h-32 space-y-2 overflow-y-auto">
                    {chosenTests.map((t) => (
                      <div
                        key={t.head_test_id}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 text-slate-600">
                          {t.ht_name}
                        </span>
                        <span className="shrink-0 font-medium text-slate-800">
                          {currency(t.ht_amount)}
                        </span>
                      </div>
                    ))}
                    {!chosenTests.length && (
                      <p className="py-2 text-sm text-slate-400">
                        Selected tests will appear here.
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-800">
                      {currency(subtotal)}
                    </span>
                  </div>
                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Discount / concession (₹)
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className={field}
                    />
                  </label>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-slate-900 p-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      Total payable
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      {currency(total)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      The slip is generated after the patient and selected tests
                      are saved successfully.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isSaving || !selectedTests.length || !validDiscount
                    }
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Saving
                        registration…
                      </>
                    ) : (
                      <>
                        <Printer size={17} /> Register & generate slip
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Patient and test order are saved together. A receipt preview
                with print option appears after successful registration.
              </p>
            </section>
          </div>
        </form>
      )}
      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {actionError}
        </div>
      )}
      {editingPatient && (
        <section className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">
              Edit patient ·{" "}
              {editingPatient.patientId || `#${editingPatient.id}`}
            </h2>
            <button
              type="button"
              onClick={() => setEditingPatient(null)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
          <form
            onSubmit={savePatientEdit}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                name: "honorific_title",
                label: "Title",
                type: "select",
                options: ["Mr.", "Ms.", "Mrs.", "Master", "Dr."],
              },
              { name: "patient_name", label: "Full name", type: "text" },
              { name: "patient_age", label: "Age", type: "number" },
              {
                name: "patient_age_type",
                label: "Age unit",
                type: "select",
                options: ["Years", "Months", "Days"],
              },
              {
                name: "patient_gender",
                label: "Gender",
                type: "select",
                options: ["Male", "Female", "Other", "Prefer not to say"],
              },
              { name: "patient_phone", label: "Phone", type: "tel" },
              { name: "patient_email", label: "Email", type: "email" },
              { name: "patient_address", label: "Address", type: "text" },
              { name: "machine_id", label: "Machine ID", type: "text" },
            ].map((f) => (
              <label
                key={f.name}
                className="text-sm font-medium text-slate-700"
              >
                {f.label}
                {f.type === "select" ? (
                  <select
                    className={field}
                    value={editingPatient[f.name] || f.options[0]}
                    onChange={(e) =>
                      setEditingPatient((p) => ({
                        ...p,
                        [f.name]: e.target.value,
                      }))
                    }
                  >
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={field}
                    type={f.type}
                    min={f.name === "patient_age" ? 0 : undefined}
                    max={f.name === "patient_age" ? 130 : undefined}
                    required={
                      f.name === "patient_name" || f.name === "patient_age"
                    }
                    value={editingPatient[f.name] ?? ""}
                    onChange={(e) =>
                      setEditingPatient((p) => ({
                        ...p,
                        [f.name]: e.target.value,
                      }))
                    }
                  />
                )}
              </label>
            ))}
            <div className="flex items-end justify-end sm:col-span-2 lg:col-span-3">
              <button
                disabled={isUpdatingPatient}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUpdatingPatient ? "Saving…" : "Save patient changes"}
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <Users size={19} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">
                  Patient records
                </h2>
                <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                  {patients.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Registered patients
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative block w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search patients"
                placeholder="Search name, ID, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${field} mt-0 pl-9`}
              />
            </label>
            <button
              type="button"
              onClick={loadPatients}
              title="Refresh records"
              aria-label="Refresh records"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
        {apiError && (
          <div
            role="alert"
            className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {apiError}
          </div>
        )}
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading patient records…
          </p>
        ) : filteredPatients.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  {[
                    "Patient",
                    "Patient ID",
                    "Age",
                    "Gender",
                    "Phone",
                    "Registered",
                    "Actions",
                  ].map((x) => (
                    <th key={x} className="border-b border-slate-200 px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-teal-50/40">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700">
                          <UserRound size={17} />
                        </span>
                        <span className="font-semibold text-slate-800">
                          {p.honorific_title} {p.patient_name}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                        {p.patientId || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.patient_age ?? "—"} {p.patient_age_type || ""}
                    </td>
                    <td className="px-4 py-3">{p.patient_gender || "—"}</td>
                    <td className="px-4 py-3">{p.patient_phone || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      <CalendarDays size={14} className="mr-1 inline" />
                      {p.patient_created_at
                        ? new Date(p.patient_created_at).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActionError("");
                            setEditingPatient({
                              ...p,
                              patient_age: String(p.patient_age ?? ""),
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-white"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePatient(p)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Users size={25} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900">
              {search ? "No matching patients" : "No patient records yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search."
                : "Start a new registration to add the first patient."}
            </p>
          </div>
        )}
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      </section>
    </div>
  );
}
