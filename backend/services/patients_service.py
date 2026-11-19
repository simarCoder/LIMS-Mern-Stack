"""Patient domain service: validation, normalization, and persistence.
Keeps raw SQL encapsulated and guarantees data integrity for clinical registrations.
"""
from .common import parse_int, utc_now


def patient_to_dict(row):
    """Serialize a SQLite patient row to a clean JSON-friendly dictionary."""
    if row is None:
        return None

    # Handle dict-like or sqlite3.Row object
    keys = row.keys() if hasattr(row, "keys") else []
    
    relation = row["patient_relation"] if "patient_relation" in keys else None
    relation_name = row["patient_relation_name"] if "patient_relation_name" in keys else None
    sample_collected = bool(row["sample_collected"]) if "sample_collected" in keys else False
    is_active = row["is_active"] if "is_active" in keys else 1

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
        "patient_relation": relation or "",
        "patient_relation_name": relation_name or "",
        "sample_collected": sample_collected,
        # Retain backward-compatible alias for any legacy UI binding:
        "patient_Relation": relation or "",
        "patient_Relation_Name": relation_name or "",
        "is_active": bool(is_active),
        "patient_created_at": row["patient_created_at"],
    }


def get_patient(connection, patient_id):
    """Fetch an active patient record by primary key."""
    return connection.execute(
        "SELECT * FROM patients WHERE id = ? AND is_active = 1", (patient_id,)
    ).fetchone()


def list_patients(connection, search_query=None, limit=200):
    """Fetch active patients ordered newest first, with optional search filtering."""
    if search_query and search_query.strip():
        q = f"%{search_query.strip()}%"
        sql = """
            SELECT * FROM patients
            WHERE is_active = 1 AND (
                patient_id LIKE ? OR
                patient_name LIKE ? OR
                patient_phone LIKE ?
            )
            ORDER BY id DESC
            LIMIT ?
        """
        rows = connection.execute(sql, (q, q, q, limit)).fetchall()
    else:
        sql = """
            SELECT * FROM patients
            WHERE is_active = 1
            ORDER BY id DESC
            LIMIT ?
        """
        rows = connection.execute(sql, (limit,)).fetchall()

    patients = [patient_to_dict(r) for r in rows]
    if not patients:
        return []

    # Efficiently attach prescribed test codes for each patient
    try:
        patient_ids = [p["id"] for p in patients]
        placeholders = ",".join("?" for _ in patient_ids)
        items_rows = connection.execute(
            f"""
            SELECT o.patient_record_id, i.test_code_snapshot
            FROM lab_orders o
            JOIN lab_order_items i ON i.order_id = o.id
            WHERE o.patient_record_id IN ({placeholders})
            ORDER BY i.id
            """,
            patient_ids,
        ).fetchall()

        tests_by_patient = {}
        for r in items_rows:
            pid = r["patient_record_id"]
            if pid not in tests_by_patient:
                tests_by_patient[pid] = []
            if r["test_code_snapshot"] not in tests_by_patient[pid]:
                tests_by_patient[pid].append(r["test_code_snapshot"])

        for p in patients:
            p["test_codes"] = tests_by_patient.get(p["id"], [])
    except Exception:
        for p in patients:
            p["test_codes"] = []

    return patients


def validate_patient_payload(data, existing=None):
    """Strictly validate and normalize incoming patient registration payload."""
    if not isinstance(data, dict):
        raise ValueError("A valid patient JSON object is required.")

    def get_val(key, fallback=None):
        v = data.get(key)
        return v if v is not None else fallback

    existing_keys = existing.keys() if existing and hasattr(existing, "keys") else []
    
    title = get_val("honorific_title", existing["honorific_title"] if existing else None)
    name = get_val("patient_name", existing["patient_name"] if existing else None)
    age_raw = get_val("patient_age", existing["patient_age"] if existing else None)
    age_type = get_val("patient_age_type", existing["patient_age_type"] if existing else "Years")
    gender = get_val("patient_gender", existing["patient_gender"] if existing else None)

    # 1. Title validation
    valid_titles = {"Mr.", "Ms.", "Mrs.", "Master", "Dr."}
    if title not in valid_titles:
        raise ValueError("Please select a valid honorific title (Mr., Ms., Mrs., Master, Dr.).")

    # 2. Name validation
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Patient full name is required.")
    name = name.strip()
    if len(name) > 150:
        raise ValueError("Patient name cannot exceed 150 characters.")

    # 3. Age & Unit validation
    age = parse_int(age_raw, "Age", 0, 130)
    if age_type not in {"Years", "Months", "Days"}:
        raise ValueError("Select a valid age unit (Years, Months, Days).")

    # 4. Gender validation
    valid_genders = {"Male", "Female", "Other", "Prefer not to say"}
    if gender not in valid_genders:
        raise ValueError("Please select a valid gender.")

    # 5. Optional text field limits
    phone = (get_val("patient_phone", existing["patient_phone"] if existing and "patient_phone" in existing_keys else "") or "").strip()
    email = (get_val("patient_email", existing["patient_email"] if existing and "patient_email" in existing_keys else "") or "").strip()
    address = (get_val("patient_address", existing["patient_address"] if existing and "patient_address" in existing_keys else "") or "").strip()
    machine_id = (get_val("machine_id", existing["machine_id"] if existing and "machine_id" in existing_keys else "") or "").strip()

    if phone and len(phone) > 20:
        raise ValueError("Phone number cannot exceed 20 characters.")
    if email and len(email) > 254:
        raise ValueError("Email address is too long.")
    if address and len(address) > 500:
        raise ValueError("Address cannot exceed 500 characters.")
    if machine_id and len(machine_id) > 100:
        raise ValueError("Machine ID cannot exceed 100 characters.")

    # 6. Relationship fields (S/o, D/o, W/o + Relation Name)
    relation = get_val(
        "patient_relation",
        get_val("patient_Relation", existing["patient_relation"] if existing and "patient_relation" in existing_keys else None)
    )
    relation = (relation or "").strip()
    if relation == "Select":
        relation = ""
    if relation and relation not in {"S/o", "D/o", "W/o"}:
        raise ValueError("Relation must be S/o, D/o, or W/o.")

    relation_name = get_val(
        "patient_relation_name",
        get_val("patient_Relation_Name", existing["patient_relation_name"] if existing and "patient_relation_name" in existing_keys else None)
    )
    relation_name = (relation_name or "").strip()
    if relation_name and len(relation_name) > 150:
        raise ValueError("Relation name cannot exceed 150 characters.")

    sample_collected_raw = get_val(
        "sample_collected",
        existing["sample_collected"] if existing and "sample_collected" in existing_keys else False,
    )
    sample_collected = 1 if sample_collected_raw in {True, 1, "1", "true", "True"} else 0

    return {
        "honorific_title": title,
        "patient_name": name,
        "patient_age": age,
        "patient_age_type": age_type,
        "patient_gender": gender,
        "patient_phone": phone or None,
        "patient_email": email or None,
        "patient_address": address or None,
        "machine_id": machine_id or None,
        "patient_relation": relation or None,
        "patient_relation_name": relation_name or None,
        "sample_collected": sample_collected,
    }


def insert_patient(connection, values):
    """Insert a newly registered patient and generate a concise P1, P2... accession code."""
    created_at = utc_now()
    cursor = connection.execute(
        """
        INSERT INTO patients (
            patient_id, honorific_title, patient_name, patient_age,
            patient_age_type, patient_gender, patient_phone, patient_email,
            patient_address, machine_id, patient_relation, patient_relation_name,
            sample_collected, is_active, patient_created_at
        ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """,
        (
            values["honorific_title"], values["patient_name"], values["patient_age"],
            values["patient_age_type"], values["patient_gender"], values["patient_phone"],
            values["patient_email"], values["patient_address"], values["machine_id"],
            values["patient_relation"], values["patient_relation_name"],
            values.get("sample_collected", 0), created_at,
        ),
    )
    patient_id = cursor.lastrowid
    patient_code = f"P{patient_id}"
    connection.execute(
        "UPDATE patients SET patient_id = ? WHERE id = ?", (patient_code, patient_id)
    )
    return patient_to_dict(get_patient(connection, patient_id))


def update_patient_record(connection, patient_id, values):
    """Update an existing patient record."""
    connection.execute(
        """
        UPDATE patients SET
            honorific_title = ?, patient_name = ?, patient_age = ?,
            patient_age_type = ?, patient_gender = ?, patient_phone = ?,
            patient_email = ?, patient_address = ?, machine_id = ?,
            patient_relation = ?, patient_relation_name = ?, sample_collected = ?
        WHERE id = ? AND is_active = 1
        """,
        (
            values["honorific_title"], values["patient_name"], values["patient_age"],
            values["patient_age_type"], values["patient_gender"], values["patient_phone"],
            values["patient_email"], values["patient_address"], values["machine_id"],
            values["patient_relation"], values["patient_relation_name"],
            values.get("sample_collected", 0), patient_id,
        ),
    )
    return patient_to_dict(get_patient(connection, patient_id))


def soft_delete_patient(connection, patient_id):
    """Soft delete patient to maintain clinical audit trail."""
    connection.execute(
        "UPDATE patients SET is_active = 0 WHERE id = ?", (patient_id,)
    )
