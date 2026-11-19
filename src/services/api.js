/**
 * Centralized HTTP API Client for Labora+ LIMS
 * Handles requests, response parsing, session credentials, and error handling.
 */
const API_URL = import.meta.env.VITE_API_URL || "";

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: "include", // Transmit HttpOnly session cookies across origins
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let defaultMsg = `Request failed (HTTP ${response.status})`;
      if (response.status === 404) {
        defaultMsg = "Backend server not connected or endpoint not found (HTTP 404). Please check backend connection.";
      } else if (response.status === 502 || response.status === 504) {
        defaultMsg = "Backend server is offline or unreachable (Bad Gateway). Please check if backend is running.";
      }
      const err = new Error(data.error || defaultMsg);
      err.status = response.status;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to backend service. Please check if Flask is running.",
        { cause: err },
      );
    }
    throw err;
  }
}

// ==========================================
// Authentication & Laboratory Session API
// ==========================================

export const authLogin = (lab_code, username, password) =>
  request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ lab_code, username, password }),
  });

export const authLogout = () =>
  request("/api/auth/logout", {
    method: "POST",
  });

export const authMe = () => request("/api/auth/me");

export const fetchLabByCode = (lab_code) =>
  request(`/api/auth/lab/${encodeURIComponent(lab_code)}`);

// ==========================================
// Patients API
// ==========================================

export const fetchPatients = () => request("/api/patients");

export const fetchPatient = (id) => request(`/api/patients/${id}`);

export const createPatient = (data) =>
  request("/api/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (id, data) =>
  request(`/api/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (id) =>
  request(`/api/patients/${id}`, {
    method: "DELETE",
  });

// ==========================================
// Registrations & Orders API
// ==========================================

export const registerPatientWithOrder = (payload) =>
  request("/api/registrations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createOrder = (orderData) =>
  request("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

export const fetchOrder = (orderId) => request(`/api/orders/${orderId}`);

export const fetchOrders = () => request("/api/orders");

export const fetchPatientReceipt = (patientId) =>
  request(`/api/patients/${patientId}/receipt`);

export const updateOrderSpecimens = (orderId, specimensData) =>
  request(`/api/orders/${orderId}/specimens`, {
    method: "PUT",
    body: JSON.stringify(specimensData),
  });

// ==========================================
// Catalog & Statuses API
// ==========================================

export const fetchTestCatalog = (all = true) =>
  request(`/api/tests${all ? "?all=1" : ""}`);

export const fetchStatuses = () => request("/api/statuses");

export const fetchTest = (testId) => request(`/api/tests/${testId}`);

export const createTest = (data) =>
  request("/api/tests", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateTest = (testId, data) =>
  request(`/api/tests/${testId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteTest = (testId) =>
  request(`/api/tests/${testId}`, {
    method: "DELETE",
  });

// ==========================================
// Diagnosis & Reporting API
// ==========================================

export const fetchDiagnosisOrders = () => request("/api/diagnosis/orders");

export const fetchDiagnosisOrder = (orderId) =>
  request(`/api/diagnosis/orders/${orderId}`);

export const updateDiagnosisOrderResults = (orderId, resultsData) =>
  request(`/api/diagnosis/orders/${orderId}/results`, {
    method: "PUT",
    body: JSON.stringify(resultsData),
  });

export const syncDiagnosisOrderCatalogue = (orderId) =>
  request(`/api/diagnosis/orders/${orderId}/sync-catalogue`, {
    method: "POST",
  });

export const verifyDiagnosisOrder = (orderId) =>
  request(`/api/diagnosis/orders/${orderId}/verify`, {
    method: "POST",
  });

export const saveSubtestResult = (subtestId, resultData) =>
  request(`/api/order-subtests/${subtestId}/result`, {
    method: "PUT",
    body: JSON.stringify(resultData),
  });
