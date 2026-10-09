
import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function PatientDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [patients, setPatients] = useState([]);
  const [message, setMessage] = useState("");

  async function signIn(event) {
    event.preventDefault();
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setMessage(error ? error.message : "Signed in successfully.");
  }

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPatients(data);
    setMessage(`${data.length} patients loaded.`);
  }

  async function addPatient(event) {
    event.preventDefault();
    setMessage("Saving patient...");

    const { error } = await supabase.from("patients").insert({
      patient_code: patientCode.trim(),
      full_name: fullName.trim(),
      age: Number(age),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPatientCode("");
    setFullName("");
    setAge("");
    setMessage("Patient saved successfully.");

    await loadPatients();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPatients([]);
    setMessage("Signed out.");
  }

  return (
    <main style={{ maxWidth: 650, margin: "40px auto", padding: 20 }}>
      <h1>LIMS Patient Demo</h1>
      <p>Use fictional test data only.</p>

      <form onSubmit={signIn}>
        <h2>Sign in</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign in</button>
      </form>

      <hr />

      <form onSubmit={addPatient}>
        <h2>Register patient</h2>
        <input
          placeholder="Patient code"
          value={patientCode}
          onChange={(e) => setPatientCode(e.target.value)}
          required
        />
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Age"
          min="0"
          max="130"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <button type="submit">Save patient</button>
      </form>

      <button type="button" onClick={loadPatients}>
        Load patients
      </button>
      <button type="button" onClick={signOut}>
        Sign out
      </button>

      <p role="status">{message}</p>

      <h2>Patient records</h2>
      {patients.map((patient) => (
        <div key={patient.id}>
          {patient.patient_code} | {patient.full_name} | Age: {patient.age}
        </div>
      ))}
    </main>
  );
}
