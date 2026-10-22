const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }
  return data;
}

// Patients API

export const fetchPatients = () => request("/api/patients");
export const createPatient = (data) =>
  request("/api/patients", { method: "POST", body: JSON.stringify(data) });
export const updatePatient = (id, data) =>
  request(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePatient = (id) =>
  request(`/api/patients/${id}`, { method: "DELETE" });

// Registrations API (Atomic Patient + Order Creation)
export const registerPatientWithOrder = (payload) =>
  request("/api/registrations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Catalog & Statuses API
export const fetchTestCatalog = (all = true) =>
  request(`/api/tests${all ? "?all=1" : ""}`);
export const fetchStatuses = () => request("/api/statuses");

// Diagnosis API
export const fetchDiagnosisOrders = () => request("/api/diagnosis/orders");
export const saveSubtestResult = (subtestId, resultData) =>
  request(`/api/order-subtests/${subtestId}/result`, {
    method: "PUT",
    body: JSON.stringify(resultData),
  });
