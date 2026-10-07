import { useState } from "react";
import NavBar from "./NavBar.jsx";
import Patients from "./components/Patients.jsx";

function App() {
  let subDash;
  const [navItem, setNavItem] = useState("Dashboard");

  //Patients details in useState
  const [pAge, setPAge] = useState("");
  const [pName, setPName] = useState("");
  const [pGender, setPGender] = useState("Male");

  const [patients, setPatients] = useState([]);

  if (navItem == "Patients") {
    subDash = (
      <Patients
        setPName={setPName}
        setPAge={setPAge}
        setPGender={setPGender}
        pName={pName}
        pAge={pAge}
        pGender={pGender}
        patients={patients}
        setPatients={setPatients}
      />
    );
  }

  return (
    <div>
      <div id="mainBody" className="flex flex-row min-h-screen">
        <NavBar setNavItem={setNavItem} />
        <div id="rightSection" className="flex flex-col">
          {subDash}
          <div id="patientList">
            {patients.map((patient, index) => (
              <div>
                <h3>patient No.{index + 1}</h3>
                <li key={patient.patientName}>{patient.patientName}</li>
                <li key={patient.patientAge}>{patient.patientAge}</li>
                <li key={patient.patientGender}>{patient.patientGender}</li>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
