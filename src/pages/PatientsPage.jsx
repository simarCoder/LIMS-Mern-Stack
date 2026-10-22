import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X } from "lucide-react";
import {
  fetchPatients,
  fetchTestCatalog,
  registerPatientWithOrder,
  updatePatient,
  deletePatient as deletePatientApi,
} from "../services/api";
import RegistrationForm from "../components/patients/RegistrationForm";
import PatientList from "../components/patients/PatientList";
import PrintReceipt from "../components/patients/PrintReceipt";

export default function PatientsPage({ patients, setPatients }) {
  const [showForm, setShowForm] = useState(false);
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [patientData, testData] = await Promise.all([
        fetchPatients(),
        fetchTestCatalog(true),
      ]);
      setPatients(patientData);
      setTests(testData);
    } catch (err) {
      setError(err.message || "Unable to connect to service.");
    } finally {
      setIsLoading(false);
    }
  }, [setPatients]);

  useEffect(() => {
    let active = true;

    async function init() {
      setIsLoading(true);
      setError("");
      try {
        const [patientData, testData] = await Promise.all([
          fetchPatients(),
          fetchTestCatalog(true),
        ]);
        if (active) {
          setPatients(patientData);
          setTests(testData);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to connect to service.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void init();

    return () => {
      active = false;
    };
  }, [setPatients]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.patientId, p.patient_name, p.patient_phone].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [patients, search]);

  async function handleRegister(payload) {
    setIsSaving(true);
    try {
      const data = await registerPatientWithOrder(payload);
      setPatients((prev) => [
        data.patient,
        ...prev.filter((p) => p.id !== data.patient.id),
      ]);
      setReceipt(data.order);
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdatePatient(e) {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      const updated = await updatePatient(editingPatient.id, editingPatient);
      setPatients((prev) =>
        prev.map((p) => (p.id === updated.patient.id ? updated.patient : p)),
      );
      setEditingPatient(null);
    } catch (err) {
      alert(err.message || "Could not update patient.");
    }
  }

  async function handleDelete(patient) {
    if (!window.confirm(`Delete ${patient.patient_name}?`)) return;
    try {
      await deletePatientApi(patient.id);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    } catch (err) {
      alert(err.message);
    }
  }

  if (receipt) {
    return <PrintReceipt receipt={receipt} onReset={() => setReceipt(null)} />;
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Workspace / Patients
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Patient Register
          </h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Close Form" : "New Registration"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {editingPatient && (
        <form
          onSubmit={handleUpdatePatient}
          className="rounded-xl border bg-white p-4 shadow-sm space-y-3"
        >
          <h3 className="font-bold text-sm">
            Edit Patient ({editingPatient.patient_name})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="border p-2 rounded text-sm"
              value={editingPatient.patient_name}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  patient_name: e.target.value,
                })
              }
            />
            <input
              className="border p-2 rounded text-sm"
              value={editingPatient.patient_phone || ""}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  patient_phone: e.target.value,
                })
              }
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-teal-700 text-white text-xs px-3 py-1 rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="border text-xs px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {showForm && (
        <RegistrationForm
          tests={tests}
          onSubmit={handleRegister}
          isSaving={isSaving}
        />
      )}

      <PatientList
        patients={filteredPatients}
        search={search}
        onSearchChange={setSearch}
        onRefresh={loadData}
        isLoading={isLoading}
        onEdit={(patient) => setEditingPatient(patient)}
        onDelete={handleDelete}
      />
    </div>
  );
}
