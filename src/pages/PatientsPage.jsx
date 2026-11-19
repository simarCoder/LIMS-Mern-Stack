import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  UserPlus,
  Pencil,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import {
  fetchPatients,
  fetchTestCatalog,
  createPatient,
  updatePatient,
  deletePatient as deletePatientApi,
  registerPatientWithOrder,
  fetchPatientReceipt,
  updateOrderSpecimens,
} from "../services/api";
import RegistrationForm from "../components/patients/RegistrationForm";
import PatientList from "../components/patients/PatientList";
import PrintReceipt from "../components/patients/PrintReceipt";
import SampleCollectionModal from "../components/specimens/SampleCollectionModal";
import { mapTestsToSpecimens } from "../components/specimens/tubeTypes";

export default function PatientsPage({
  patients = [],
  setPatients,
  route = { sub: "list", id: null },
  navigateTo,
}) {
  const activeTab = route.sub === "new" || route.sub === "edit" ? "new" : "list";
  const [tests, setTests] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [specimenModalState, setSpecimenModalState] = useState({
    isOpen: false,
    patient: null,
    order: null,
    initialSpecimens: [],
  });
  const searchDebounceRef = useRef(null);

  // Derive editing patient from route and patient list
  const editingPatient =
    route.sub === "edit" && route.id
      ? patients.find((p) => p.id === route.id) || null
      : null;

  // Unified patient data fetching
  const loadPatients = useCallback(
    async (searchQuery = "") => {
      setIsLoading(true);
      try {
        const data = await fetchPatients(searchQuery);
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        setFeedback({
          type: "error",
          message: err.message || "Failed to load patient records from backend.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [setPatients]
  );

  // Initial load on mount for patients and active test catalog
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([fetchPatients(""), fetchTestCatalog(false)])
      .then(([patientData, testData]) => {
        if (active) {
          setPatients(Array.isArray(patientData) ? patientData : []);
          setTests(Array.isArray(testData) ? testData : []);
        }
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: "error",
            message: err.message || "Failed to load initial records.",
          });
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [setPatients]);

  // Synchronize receipt fetching for direct URL linking (e.g. /patients/:id/receipt)
  useEffect(() => {
    if (route.sub !== "receipt" || !route.id) return;
    let active = true;

    fetchPatientReceipt(route.id)
      .then((res) => {
        if (active && res?.receipt) {
          setReceipt(res.receipt);
        }
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: "error",
            message: err.message || "Could not retrieve patient receipt.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [route.sub, route.id]);

  // Fetch existing order when entering edit mode so tests & payment options are populated
  useEffect(() => {
    if (route.sub !== "edit" || !route.id) {
      setEditingOrder(null);
      return;
    }
    let active = true;
    fetchPatientReceipt(route.id)
      .then((res) => {
        if (active && res?.receipt) {
          setEditingOrder(res.receipt);
        }
      })
      .catch((err) => {
        console.error("Could not fetch order for edit:", err);
      });

    return () => {
      active = false;
    };
  }, [route.sub, route.id]);

  // Handle Search Input Change with Debounce (no page reloads, smooth typing)
  function handleSearchChange(val) {
    setSearch(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      void loadPatients(val);
    }, 250);
  }

  // Handle New Registration or Update Submit
  async function handlePatientSubmit(payload) {
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (editingPatient) {
        // HTTP PUT Update
        const response = await updatePatient(editingPatient.id, payload);
        const updated = response.patient || response;
        setPatients((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        if (response.order) {
          setReceipt(response.order);
          const items = response.order.items || [];
          const currentSpecimens =
            response.order.specimens && response.order.specimens.length > 0
              ? response.order.specimens
              : mapTestsToSpecimens(items);
          setSpecimenModalState({
            isOpen: true,
            patient: updated,
            order: response.order,
            initialSpecimens: currentSpecimens,
          });
        } else {
          navigateTo?.("/patients");
        }
        setFeedback({
          type: "success",
          message: `Patient ${updated.patient_name} updated successfully.`,
        });
      } else if (payload.head_test_ids && payload.head_test_ids.length > 0) {
        // HTTP POST Registration + Order Creation (Atomic)
        const response = await registerPatientWithOrder({
          patient: {
            honorific_title: payload.honorific_title,
            patient_name: payload.patient_name,
            patient_age: payload.patient_age,
            patient_age_type: payload.patient_age_type,
            patient_gender: payload.patient_gender,
            patient_phone: payload.patient_phone,
            patient_email: payload.patient_email,
            patient_address: payload.patient_address,
            patient_relation: payload.patient_relation,
            patient_relation_name: payload.patient_relation_name,
            machine_id: payload.machine_id,
            sample_collected: payload.sample_collected,
          },
          head_test_ids: payload.head_test_ids,
          discount: payload.discount,
          sample_collected: payload.sample_collected,
          payment_mode: payload.payment_mode,
          payment_status: payload.payment_status || "Paid",
          paid_amount: payload.paid_amount,
          test_rates: payload.test_rates,
        });

        const newPatient = response.patient;
        const newOrder = response.order;
        setPatients((prev) => [
          newPatient,
          ...prev.filter((p) => p.id !== newPatient.id),
        ]);
        setReceipt(newOrder);

        // Pre-compute tube specimens from prescribed tests
        const orderedItems =
          newOrder?.items ||
          tests.filter((t) => payload.head_test_ids?.includes(t.head_test_id));
        const initialTubes = mapTestsToSpecimens(orderedItems);

        // Open Sample Collection Edit Modal before proceeding to receipt
        setSpecimenModalState({
          isOpen: true,
          patient: newPatient,
          order: newOrder,
          initialSpecimens: initialTubes,
        });

        setFeedback({
          type: "success",
          message: `Patient ${newPatient.patient_name} (${newPatient.patientId}) registered! Verify sample collection tubes below.`,
        });
      } else {
        // HTTP POST Demographic-Only Registration
        const response = await createPatient(payload);
        const newPatient = response.patient || response;
        setPatients((prev) => [newPatient, ...prev]);
        const demoSlip = {
          patient: newPatient,
          order_no: newPatient.patientId,
          created_at: newPatient.patient_created_at || new Date().toISOString(),
          items: [],
          total: 0,
          subtotal: 0,
          discount: 0,
          sample_collected: payload.sample_collected,
        };
        setReceipt(demoSlip);

        const initialTubes = mapTestsToSpecimens([]);
        setSpecimenModalState({
          isOpen: true,
          patient: newPatient,
          order: demoSlip,
          initialSpecimens: initialTubes,
        });

        setFeedback({
          type: "success",
          message: `Patient ${newPatient.patient_name} (${newPatient.patientId}) registered. Verify specimen collection below.`,
        });
      }
    } catch (err) {
      throw new Error(
        err.message || "Could not save patient. Please check inputs.",
        { cause: err }
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Handle saving specimens from SampleCollectionModal
  async function handleSaveSpecimens(savedSpecimens) {
    const currentOrder = specimenModalState.order;
    const currentPatient = specimenModalState.patient;

    if (currentOrder && currentOrder.id && typeof currentOrder.id === "number") {
      try {
        const res = await updateOrderSpecimens(currentOrder.id, {
          specimens: savedSpecimens,
          sample_collected: true,
        });
        if (res?.order) {
          setReceipt(res.order);
        }
      } catch (err) {
        console.error("Failed to update specimen collection:", err);
      }
    }

    if (currentPatient) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === currentPatient.id ? { ...p, sample_collected: true } : p
        )
      );
    }

    setSpecimenModalState({
      isOpen: false,
      patient: null,
      order: null,
      initialSpecimens: [],
    });

    if (currentPatient?.id) {
      navigateTo?.(`/patients/${currentPatient.id}/receipt`);
    }
  }

  // Handle closing SampleCollectionModal
  function handleCloseSpecimenModal() {
    const currentPatient = specimenModalState.patient;
    setSpecimenModalState({
      isOpen: false,
      patient: null,
      order: null,
      initialSpecimens: [],
    });
    if (currentPatient?.id) {
      navigateTo?.(`/patients/${currentPatient.id}/receipt`);
    }
  }

  // Handle Soft-Delete
  async function handleDelete(patient) {
    try {
      await deletePatientApi(patient.id);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setFeedback({
        type: "success",
        message: `Patient ${patient.patient_name} archived.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to remove patient record.",
      });
    }
  }

  // Trigger Edit Mode (Switches to form tab with populated patient)
  function startEdit(patient) {
    navigateTo?.(`/patients/${patient.id}/edit`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cancel / Close Form
  function cancelForm() {
    navigateTo?.("/patients");
  }

  // View / Restore receipt for an existing patient
  async function handleViewReceipt(patient) {
    try {
      setIsLoading(true);
      navigateTo?.(`/patients/${patient.id}/receipt`);
      const res = await fetchPatientReceipt(patient.id);
      if (res && res.receipt) {
        setReceipt(res.receipt);
      } else {
        setReceipt({
          patient,
          order_no: patient.patientId || `P${patient.id}`,
          created_at: patient.patient_created_at,
          items: [],
          total: 0,
          subtotal: 0,
          discount: 0,
          sample_collected: Boolean(patient.sample_collected),
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to load receipt for this patient.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // If receipt is active, display Printable Receipt View
  if (receipt || (route.sub === "receipt" && route.id)) {
    return (
      <div className="space-y-4">
        <div className="print:hidden flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              navigateTo?.("/patients");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={16} />
            <span>Back to Patient Directory</span>
          </button>
        </div>

        {receipt ? (
          <PrintReceipt
            receipt={receipt}
            onOpenSpecimenModal={() => {
              const currentPatient =
                receipt.patient || patients.find((p) => p.id === route.id);
              const items = receipt.items || [];
              const currentSpecimens =
                receipt.specimens && receipt.specimens.length > 0
                  ? receipt.specimens
                  : mapTestsToSpecimens(items);
              setSpecimenModalState({
                isOpen: true,
                patient: currentPatient,
                order: receipt,
                initialSpecimens: currentSpecimens,
              });
            }}
            onReset={() => {
              setReceipt(null);
              navigateTo?.("/patients/new");
            }}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading receipt...
          </div>
        )}

        {/* Sample Collection Modal also accessible when viewing receipt */}
        <SampleCollectionModal
          isOpen={specimenModalState.isOpen}
          initialSpecimens={specimenModalState.initialSpecimens}
          patient={specimenModalState.patient}
          order={specimenModalState.order}
          onSave={handleSaveSpecimens}
          onClose={handleCloseSpecimenModal}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patients
          </h1>
        </div>
      </div>

      {/* Sub Navigation Bar System: Directory vs New Registration Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 flex items-center gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            navigateTo?.("/patients");
          }}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-sm sm:text-base font-bold transition cursor-pointer ${
            activeTab === "list"
              ? "border-teal-600 text-teal-700 bg-teal-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Users size={18} />
          <span>Patient Directory</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 font-mono font-bold">
            {patients.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            navigateTo?.("/patients/new");
          }}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-sm sm:text-base font-bold transition cursor-pointer ${
            activeTab === "new"
              ? "border-teal-600 text-teal-700 bg-teal-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          {editingPatient ? <Pencil size={18} /> : <UserPlus size={18} />}
          <span>
            {editingPatient
              ? `Edit: ${editingPatient.patient_name} (${editingPatient.patientId})`
              : "New Registration"}
          </span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "error" ? (
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
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

      {/* Content depending on Active Sub Tab */}
      {activeTab === "new" ? (
        <RegistrationForm
          key={editingPatient?.id || "new"}
          initialData={editingPatient}
          initialOrder={editingOrder}
          tests={tests}
          onSubmit={handlePatientSubmit}
          onCancel={cancelForm}
          isSaving={isSaving}
        />
      ) : (
        <PatientList
          patients={patients}
          search={search}
          onSearchChange={handleSearchChange}
          onRefresh={() => void loadPatients(search)}
          isLoading={isLoading}
          onEdit={startEdit}
          onDelete={handleDelete}
          onViewReceipt={handleViewReceipt}
          onDiagnosis={(p) => {
            navigateTo?.(`/diagnosis?search=${encodeURIComponent(p.patientId || p.id)}`);
          }}
          onAddNew={() => {
            navigateTo?.("/patients/new");
          }}
        />
      )}

      {/* Sample Collection Edit Modal (Vacutainer Tubes) */}
      <SampleCollectionModal
        isOpen={specimenModalState.isOpen}
        initialSpecimens={specimenModalState.initialSpecimens}
        patient={specimenModalState.patient}
        order={specimenModalState.order}
        onSave={handleSaveSpecimens}
        onClose={handleCloseSpecimenModal}
      />
    </div>
  );
}
