"""Patient validation and persistence; SQL lives outside route handlers."""
from .common import parse_int, utc_now
def patient_to_dict(row):
    return {
        "id": row["id"],
        "patientId": row["patient_id"],
        "honorific_title": row["honorific_title"],
        "patient_name": row["patient_name"],
        "patient_age": row["patient_age"],
        "patient_age_type": row["patient_age_type"],
        "patient_gender": row["patient_gender"],
        "patient_phone": row["patient_phone"] or "",
        "patient_email": row["patient_email"] or "",
        "patient_address": row["patient_address"] or "",
        "machine_id": row["machine_id"] or "",
        "patient_Relation": row["patient_relation"] or "",
        "patient_created_at": row["patient_created_at"],
    }

def get_patient(connection, patient_id):
    return connection.execute(
        "SELECT * FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()

def validate_patient_payload(data, existing=None):
    if not isinstance(data, dict):
        raise ValueError("A valid patient JSON object is required.")

    def value(key, fallback=None):
        return data.get(key, fallback)

    title = value("honorific_title", existing["honorific_title"] if existing else None)
    name = value("patient_name", existing["patient_name"] if existing else None)
    age_raw = value("patient_age", existing["patient_age"] if existing else None)
    age_type = value("patient_age_type", existing["patient_age_type"] if existing else None)
    gender = value("patient_gender", existing["patient_gender"] if existing else None)

    if title not in {"Mr.", "Ms.", "Mrs.", "Master", "Dr."}:
        raise ValueError("Select a valid title.")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 150:
        raise ValueError("Patient name is required (maximum 150 characters).")
    age = parse_int(age_raw, "Age", 0, 130)
    if age_type not in {"Years", "Months", "Days"}:
        raise ValueError("Select a valid age unit.")
    if gender not in {"Male", "Female", "Other", "Prefer not to say"}:
        raise ValueError("Select a valid gender.")

    optional_limits = {
        "patient_phone": 20,
        "patient_email": 254,
        "patient_address": 500,
        "machine_id": 100,
    }
    cleaned = {}
    for key, limit in optional_limits.items():
        old_value = existing[key] if existing else None
        raw = value(key, old_value)
        if raw is not None and not isinstance(raw, str):
            raise ValueError(f"{key} must be text.")
        raw = raw.strip() if raw else ""
        if len(raw) > limit:
            raise ValueError(f"{key} is too long (maximum {limit} characters).")
        cleaned[key] = raw or None

    relation = value(
        "patient_Relation",
        value(
            "patient_relation",
            existing["patient_relation"] if existing and "patient_relation" in existing.keys() else None,
        ),
    )
    if relation is not None and not isinstance(relation, str):
        raise ValueError("Relation must be text.")
    relation = (relation or "").strip()
    if relation and relation not in {"Select", "S/o", "D/o", "W/o"}:
        raise ValueError("Choose a valid relation.")
    if relation == "Select":
        relation = ""

    return {
        "honorific_title": title,
        "patient_name": name.strip(),
        "patient_age": age,
        "patient_age_type": age_type,
        "patient_gender": gender,
        "patient_relation": relation or None,
        **cleaned,
    }

def insert_patient(connection, values):
    created_at = utc_now()
    cursor = connection.execute(
        """
        INSERT INTO patients (
            patient_id, honorific_title, patient_name, patient_age,
            patient_age_type, patient_gender, patient_phone, patient_email,
            patient_address, machine_id, patient_relation, patient_created_at
        ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            values["honorific_title"], values["patient_name"], values["patient_age"],
            values["patient_age_type"], values["patient_gender"], values["patient_phone"],
            values["patient_email"], values["patient_address"], values["machine_id"],
            values["patient_relation"], created_at,
        ),
    )
    patient_id = cursor.lastrowid
    patient_code = f"PT-{patient_id:06d}"
    connection.execute(
        "UPDATE patients SET patient_id = ? WHERE id = ?", (patient_code, patient_id)
    )
    return patient_to_dict(get_patient(connection, patient_id))
