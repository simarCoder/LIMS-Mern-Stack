import { useState, useMemo, useRef, useEffect } from "react";
import {
  UserPlus,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Search,
  Check,
  CreditCard,
  FlaskConical,
  Clock,
  Plus,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";

/**
 * Default empty form state for a new patient registration.
 */
const initialPatientState = {
  honorific_title: "Mr.",
  patient_name: "",
  patient_age: "",
  patient_age_type: "Years",
  patient_gender: "Male",
  patient_phone: "",
  patient_email: "",
  patient_address: "",
  patient_relation: "",
  patient_relation_name: "",
  machine_id: "",
};

function getInitialFormData(data) {
  if (!data) return initialPatientState;
  return {
    honorific_title: data.honorific_title || "Mr.",
    patient_name: data.patient_name || "",
    patient_age: data.patient_age !== undefined ? String(data.patient_age) : "",
    patient_age_type: data.patient_age_type || "Years",
    patient_gender: data.patient_gender || "Male",
    patient_phone: data.patient_phone || "",
    patient_email: data.patient_email || "",
    patient_address: data.patient_address || "",
    patient_relation: data.patient_relation || data.patient_Relation || "",
    patient_relation_name:
      data.patient_relation_name || data.patient_Relation_Name || "",
    machine_id: data.machine_id || "",
  };
}

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(amount) || 0,
  );

export default function RegistrationForm({
  initialData = null,
  initialOrder = null,
  tests = [],
  onSubmit,
  onCancel,
  isSaving = false,
}) {
  // Form fields state initialized cleanly from props
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData),
  );

  // Sample collection verification status (true/false)
  const [sampleCollected, setSampleCollected] = useState(() =>
    Boolean(initialData?.sample_collected),
  );

  // Selected tests & billing state
  const [selectedTests, setSelectedTests] = useState(() => {
    if (initialOrder?.items && initialOrder.items.length > 0) {
      return initialOrder.items.map((it) => it.head_test_id);
    }
    return [];
  });
  const [customRates, setCustomRates] = useState(() => {
    const rates = {};
    if (initialOrder?.items) {
      initialOrder.items.forEach((it) => {
        rates[it.head_test_id] = it.unit_price;
      });
    }
    return rates;
  });
  const [discount, setDiscount] = useState(() =>
    initialOrder?.discount !== undefined ? String(initialOrder.discount) : "0"
  );
  const [paidAmount, setPaidAmount] = useState(() =>
    initialOrder?.paid_amount !== undefined ? String(initialOrder.paid_amount) : ""
  );
  const [paymentMode, setPaymentMode] = useState(() =>
    initialOrder?.payment_mode || "Cash"
  );
  const [testSearch, setTestSearch] = useState("");
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Synchronize if initialOrder is loaded asynchronously
  useEffect(() => {
    if (initialOrder?.items && initialOrder.items.length > 0) {
      setSelectedTests(initialOrder.items.map((it) => it.head_test_id));
      const rates = {};
      initialOrder.items.forEach((it) => {
        rates[it.head_test_id] = it.unit_price;
      });
      setCustomRates(rates);
      if (initialOrder.discount !== undefined) {
        setDiscount(String(initialOrder.discount));
      }
      if (initialOrder.paid_amount !== undefined) {
        setPaidAmount(String(initialOrder.paid_amount));
      }
      if (initialOrder.payment_mode) {
        setPaymentMode(initialOrder.payment_mode);
      }
    }
  }, [initialOrder]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTestDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validation and error feedback state
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Quick Action common tests (top 8 routine panels)
  const quickActionTests = useMemo(() => {
    return tests.slice(0, 8);
  }, [tests]);

  // Autocomplete search results for test selection
  const searchResults = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return [];
    return tests.filter((t) => {
      return (
        t.ht_name.toLowerCase().includes(q) ||
        t.ht_code.toLowerCase().includes(q) ||
        (t.ht_heading || "").toLowerCase().includes(q)
      );
    });
  }, [tests, testSearch]);

  // Billing calculations
  const chosenTests = useMemo(() => {
    return tests.filter((t) => selectedTests.includes(t.head_test_id));
  }, [tests, selectedTests]);

  const subtotal = useMemo(() => {
    return chosenTests.reduce((sum, t) => {
      const rate = customRates[t.head_test_id] !== undefined
        ? Number(customRates[t.head_test_id])
        : Number(t.ht_amount || 0);
      return sum + (Number.isNaN(rate) ? 0 : rate);
    }, 0);
  }, [chosenTests, customRates]);

  const discountValue = Number(discount) || 0;
  const isValidDiscount = discountValue >= 0 && discountValue <= subtotal;
  const totalPayable = isValidDiscount ? subtotal - discountValue : subtotal;

  const actualPaid = paidAmount === "" ? totalPayable : (Number(paidAmount) || 0);
  const balanceDue = Math.max(0, totalPayable - actualPaid);
  const paymentStatus = balanceDue === 0 ? "Paid" : actualPaid > 0 ? "Partial" : "Pending";

  // Generic input change handler
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  }

  // Toggle selection of a head test
  function toggleTestSelection(id) {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Reset form to blank
  function handleReset() {
    setFormData(initialPatientState);
    setSelectedTests([]);
    setCustomRates({});
    setDiscount("0");
    setPaidAmount("");
    setPaymentMode("Cash");
    setSampleCollected(false);
    setErrorMessage("");
    setSuccessNotice("");
  }

  // Client-side validation & submit dispatch
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessNotice("");

    // 1. Validate full name
    const trimmedName = formData.patient_name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter the patient's full name.");
      return;
    }
    if (trimmedName.length > 150) {
      setErrorMessage("Patient name cannot exceed 150 characters.");
      return;
    }

    // 2. Validate age
    const parsedAge = Number(formData.patient_age);
    if (
      formData.patient_age === "" ||
      Number.isNaN(parsedAge) ||
      !Number.isInteger(parsedAge) ||
      parsedAge < 0 ||
      parsedAge > 130
    ) {
      setErrorMessage("Please enter a valid age between 0 and 130.");
      return;
    }

    // 3. Validate relation name if relation is selected
    if (formData.patient_relation && !formData.patient_relation_name.trim()) {
      setErrorMessage(
        `Please enter the relation name for (${formData.patient_relation}).`,
      );
      return;
    }

    // 4. Validate discount
    if (discountValue < 0 || discountValue > subtotal) {
      setErrorMessage(
        "Discount cannot be negative or exceed the tests subtotal.",
      );
      return;
    }

    // Prepare payload
    const payload = {
      ...formData,
      patient_name: trimmedName,
      patient_age: parsedAge,
      patient_phone: formData.patient_phone.trim(),
      patient_email: formData.patient_email.trim(),
      patient_address: formData.patient_address.trim(),
      patient_relation:
        formData.patient_relation === "Select" ? "" : formData.patient_relation,
      patient_relation_name: formData.patient_relation_name.trim(),
      machine_id: formData.machine_id.trim(),
      // Sample collection status for verification
      sample_collected: sampleCollected,
      // Test selection fields (optional, for atomic order generation)
      head_test_ids: selectedTests,
      discount: discountValue,
      payment_mode: paymentMode,
      payment_status: paymentStatus,
      paid_amount: actualPaid,
      test_rates: customRates,
    };

    try {
      await onSubmit(payload);
      setSuccessNotice("Registration saved successfully!");
      if (!initialData) {
        handleReset();
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to save registration. Please verify details.",
      );
    }
  }

  // Tailwind reusable classes for inputs (scaled for maximum readability)
  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15";
  const labelClass = "block text-s font-bold text-slate-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all"
    >
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white shadow-sm">
            <UserPlus size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialData ? "Edit Patient Details" : "New Registration"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          title="Reset form"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Error Callout Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Callout Banner */}
      {successNotice && (
        <div
          role="status"
          className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Form Body */}
      <div className="p-4.5 space-y-5 grid grid-cols-2 gap-4">
        <div>
          {/* Section 1: Primary Identity & Demographics */}
          <div className="space-y-3">
            {/* <h3 className="text-s font-bold uppercase tracking-wider text-teal-800 mb-2 border-b border-slate-100 pb-1">
            1. Patient Demographics
          </h3> */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-15 ">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className={labelClass}>Title *</label>
                <select
                  name="honorific_title"
                  value={formData.honorific_title}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  {["Mr.", "Ms.", "Mrs.", "Master", "Dr."].map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div className="sm:col-span-5">
                <label className={labelClass}>Patient Full Name *</label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className={inputClass}
                  autoFocus
                  required
                />
              </div>

              {/* Age */}
              <div className="sm:col-span-2">
                <label className={labelClass}>Age *</label>
                <input
                  type="number"
                  name="patient_age"
                  min="0"
                  max="130"
                  value={formData.patient_age}
                  onChange={handleChange}
                  placeholder="Age"
                  className={inputClass}
                  required
                />
              </div>

              {/* Age Unit */}
              <div className="sm:col-span-3">
                <label className={labelClass}>Age Unit *</label>
                <select
                  name="patient_age_type"
                  value={formData.patient_age_type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Years">Years</option>
                  <option value="Months">Months</option>
                  <option value="Days">Days</option>
                </select>
              </div>
              {/* Gender */}
              <div className="sm:col-span-3">
                <label className={labelClass}>Gender *</label>
                <select
                  name="patient_gender"
                  value={formData.patient_gender}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Gender & Relationship */}
          <div>
            {/* <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 border-b border-slate-100 pb-1.5">
            2. Gender & Family Relations
          </h3> */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              {/* Relation Prefix */}
              <div className="sm:col-span-3">
                <label className={labelClass}>Relation (Optional)</label>
                <select
                  name="patient_relation"
                  value={formData.patient_relation}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">None / Select</option>
                  <option value="S/o">S/o (Son of)</option>
                  <option value="D/o">D/o (Daughter of)</option>
                  <option value="W/o">W/o (Wife of)</option>
                </select>
              </div>

              {/* Relation Name */}
              <div className="sm:col-span-5">
                <label className={labelClass}>Relation Name</label>
                <input
                  type="text"
                  name="patient_relation_name"
                  value={formData.patient_relation_name}
                  onChange={handleChange}
                  placeholder={
                    formData.patient_relation
                      ? `Enter ${formData.patient_relation} name`
                      : "Guardian / Relative name"
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Meta */}
          <div>
            {/* <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 border-b border-slate-100 pb-1.5">
            3. Contact & Laboratory Meta
          </h3> */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              {/* Phone */}
              <div className="sm:col-span-4">
                <label className={labelClass}>Mobile Phone</label>
                <input
                  type="tel"
                  name="patient_phone"
                  value={formData.patient_phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-4">
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="patient_email"
                  value={formData.patient_email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className={inputClass}
                />
              </div>

              {/* Machine / Analyzer Identifier */}
              <div className="sm:col-span-4">
                <label className={labelClass}>Machine number</label>
                <input
                  type="text"
                  name="machine_id"
                  value={formData.machine_id}
                  onChange={handleChange}
                  placeholder="Analyzer Ref (optional)"
                  className={inputClass}
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-12">
                <label className={labelClass}>Residential Address</label>
                <input
                  type="text"
                  name="patient_address"
                  value={formData.patient_address}
                  onChange={handleChange}
                  placeholder="Door No, Street, Landmark, City, PIN"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-l-2 pl-3 border-slate-300">
          {/* Section 4: Laboratory Test Selection (Editable for New & Existing Patients) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900 flex items-center gap-2">
                    <ClipboardList size={18} />
                    <span>
                      4. Prescribe Laboratory Tests ({selectedTests.length}{" "}
                      selected)
                    </span>
                  </h3>
                  {/* <p className="text-xs text-slate-500">
                    Quick-add or search to prescribe tests.
                  </p> */}
                </div>

                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTests([])}
                    className="text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline self-start sm:self-auto"
                  >
                    Clear all selected tests
                  </button>
                )}
              </div>

              {/* Quick Action Shortcuts (Compact, smaller styling) */}
              {quickActionTests.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Quick Add Popular Tests:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActionTests.map((test) => {
                      const isSelected = selectedTests.includes(
                        test.head_test_id,
                      );
                      return (
                        <button
                          key={test.head_test_id}
                          type="button"
                          onClick={() => toggleTestSelection(test.head_test_id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer ${
                            isSelected
                              ? "border-teal-600 bg-teal-600 text-white shadow-2xs"
                              : "border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:bg-teal-50"
                          }`}
                        >
                          <span className="uppercase">{test.ht_code}</span>
                          {isSelected ? (
                            <Check size={12} strokeWidth={3} />
                          ) : (
                            <Plus size={12} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Test Search Autocomplete with Popover Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className={labelClass}>Search & Add Other Tests</label>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Type to search tests (e.g. CBC, Lipid, Sugar, Thyroid)..."
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setIsTestDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (testSearch.trim()) setIsTestDropdownOpen(true);
                    }}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
                  />
                  {testSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestSearch("");
                        setIsTestDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isTestDropdownOpen && testSearch.trim() && (
                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No laboratory tests found matching &quot;{testSearch}&quot;.
                      </div>
                    ) : (
                      searchResults.map((test) => {
                        const isSelected = selectedTests.includes(
                          test.head_test_id,
                        );
                        return (
                          <div
                            key={test.head_test_id}
                            onClick={() => {
                              toggleTestSelection(test.head_test_id);
                              setTestSearch("");
                              setIsTestDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition ${
                              isSelected ? "bg-teal-50/90" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 truncate">
                                  {test.ht_name}
                                </span>
                                <span className="font-mono text-[10px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                  {test.ht_code}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {test.ht_heading || "General"} · {test.sub_tests?.length || 0} params
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-xs text-slate-900 font-mono">
                                ₹{Number(test.ht_amount).toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold transition ${
                                  isSelected
                                    ? "bg-teal-600 text-white"
                                    : "border border-slate-300 bg-white text-slate-700 hover:border-teal-600"
                                }`}
                              >
                                {isSelected ? (
                                  <Check size={11} strokeWidth={3} />
                                ) : (
                                  <Plus size={11} />
                                )}
                                {isSelected ? "Added" : "Add"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Prescribed Tests Dedicated Table & Editable Rates */}
              {chosenTests.length > 0 ? (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                    <span>
                      Prescribed Tests ({chosenTests.length}):
                    </span>
                    <span className="text-[10px] text-teal-700 font-semibold lowercase">
                      Rates editable on the fly
                    </span>
                  </div>

                  {/* Dedicated Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 sticky top-0 z-10 text-[10.5px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-2 w-8 text-center">#</th>
                          <th className="py-1.5 px-2">Investigation Panel</th>
                          <th className="py-1.5 px-2 text-center w-20">Code</th>
                          <th className="py-1.5 px-2 text-right w-28">Amount (₹)</th>
                          <th className="py-1.5 px-2 text-center w-10">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {chosenTests.map((t, idx) => {
                          const currentRate =
                            customRates[t.head_test_id] !== undefined
                              ? customRates[t.head_test_id]
                              : (t.ht_amount || 0);

                          return (
                            <tr
                              key={t.head_test_id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-2">
                                <span className="font-bold text-slate-800 block text-xs truncate max-w-[220px]">
                                  {t.ht_name}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {t.ht_heading || "General Pathology"}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                                  {t.ht_code}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <span className="text-slate-400 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={currentRate}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCustomRates((prev) => ({
                                        ...prev,
                                        [t.head_test_id]:
                                          val === "" ? "" : Number(val),
                                      }));
                                    }}
                                    className="h-6 w-20 rounded border border-slate-300 bg-white px-1.5 text-right font-mono text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                                    title="Edit test amount"
                                  />
                                </div>
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleTestSelection(t.head_test_id)}
                                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                  title={`Remove ${t.ht_code}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Order & Billing Financial Summary (Compact 5-Box Grid) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {/* 1. Subtotal */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Subtotal
                        </span>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* 2. Discount */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Discount (₹)
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="h-6 w-full rounded border border-slate-300 bg-white px-1.5 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                        />
                      </div>

                      {/* 3. Total Net */}
                      <div className="bg-teal-50/70 p-2 rounded-lg border border-teal-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                          Net Amount
                        </span>
                        <span className="text-xs font-black text-teal-950 font-mono">
                          ₹{totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* 4. Paid Amount */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Paid (₹)
                          </span>
                          <button
                            type="button"
                            onClick={() => setPaidAmount(String(totalPayable))}
                            className="text-[9.5px] font-bold text-teal-700 hover:underline cursor-pointer"
                          >
                            Full
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={paidAmount === "" ? totalPayable : paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="h-6 w-full rounded border border-slate-300 bg-white px-1.5 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                        />
                      </div>

                      {/* 5. Balance Due */}
                      <div
                        className={`p-2 rounded-lg border ${
                          balanceDue > 0
                            ? "bg-amber-50 border-amber-300 text-amber-900"
                            : "bg-emerald-50 border-emerald-300 text-emerald-900"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider block">
                          {balanceDue > 0 ? "Balance Due" : "Balance"}
                        </span>
                        <span className="text-xs font-black font-mono">
                          ₹{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[8.5px] font-bold uppercase block mt-0.5">
                          {balanceDue > 0 ? "⏳ Pending" : "✓ Paid in Full"}
                        </span>
                      </div>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-semibold">Payment Mode:</span>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="h-7 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-teal-600 focus:outline-none cursor-pointer"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Credit (Online / UPI)">Credit (Online / UPI)</option>
                          <option value="Card (Debit / Credit)">Card (Debit / Credit)</option>
                          <option value="Credit / Due (Pay Later)">Credit / Due (Pay Later)</option>
                        </select>
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        Status:{" "}
                        <strong
                          className={
                            balanceDue > 0 ? "text-amber-700" : "text-emerald-700"
                          }
                        >
                          {paymentStatus}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs font-semibold text-slate-400">
                  No laboratory tests selected. Pick from quick buttons above or use search.
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Sample Collection Verification Section */}
      <div className="border-t border-slate-200 bg-slate-50/60 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical
                size={20}
                className={
                  sampleCollected ? "text-emerald-600" : "text-amber-600"
                }
              />
              <h3 className="text-base font-bold text-slate-800">
                Sample Collection Status
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSampleCollected((prev) => !prev)}
            aria-pressed={sampleCollected}
            className={`inline-flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-bold transition-all shadow-xs focus:outline-none focus:ring-2 cursor-pointer ${
              sampleCollected
                ? "border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-500/20"
                : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-500/20"
            }`}
          >
            {sampleCollected ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>✓ Sample Collected for Verification</span>
              </>
            ) : (
              <>
                <Clock size={18} className="text-amber-600 shrink-0" />
                <span>⏳ Sample Awaiting Collection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="text-sm text-slate-600">
          {selectedTests.length > 0 && (
            <span>
              Booking{" "}
              <strong className="text-slate-900">
                {selectedTests.length} tests
              </strong>{" "}
              for a total of{" "}
              <strong className="text-teal-900 text-base">
                {currency(totalPayable)}
              </strong>
              .
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm sm:text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/30 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            {isSaving
              ? "Saving..."
              : initialData
                ? "Save Changes"
                : selectedTests.length > 0
                  ? "Register Patient & Generate Receipt"
                  : "Register Patient Only"}
          </button>
        </div>
      </div>
    </form>
  );
}
