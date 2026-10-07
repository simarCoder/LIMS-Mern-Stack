function Patients(props) {
  function handleSubmit(event) {
    event.preventDefault();
    const patientObj = {
      patientName: props.pName,
      patientAge: props.pAge,
      patientGender: props.pGender,
    };
    props.setPatients([...props.patients, patientObj]);
    props.setPName("");
    props.setPAge("");
    props.setPGender("");
  }
  return (
    <div id="patient">
      <form
        onSubmit={(event) => {
          handleSubmit(event);
        }}
      >
        <label htmlFor="patientName">Patient Name</label>
        <input
          type="text"
          name="patientName"
          value={props.pName}
          onChange={(e) => {
            props.setPName(e.target.value);
          }}
        />
        <label htmlFor="patientAge">Age</label>
        <input
          type="text"
          name="patientAge"
          value={props.pAge}
          onChange={(e) => {
            props.setPAge(e.target.value);
          }}
        />
        <label htmlFor="patientGender">Gender</label>
        <select
          name="patientGender"
          id="patientGender"
          value={props.pGender}
          onChange={(e) => {
            props.setPGender(e.target.value);
          }}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <button type="Submit">Submit</button>
      </form>
      <br />
    </div>
  );
}

export default Patients;
