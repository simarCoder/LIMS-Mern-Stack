from flask import Blueprint, current_app, jsonify, request
import sqlite3
from database import get_db
from services.common import api_error
from services.patients_service import patient_to_dict, get_patient, validate_patient_payload, insert_patient

bp = Blueprint("patients", __name__)


@bp.get("/api/patients")
def list_patients():
    rows = get_db().execute("SELECT * FROM patients ORDER BY id DESC").fetchall()
    return jsonify([patient_to_dict(row) for row in rows])


@bp.post("/api/patients")
def create_patient():
    connection = get_db()
    try:
        values = validate_patient_payload(request.get_json(silent=True))
        patient = insert_patient(connection, values)
        connection.commit()
        return jsonify({"message": "Patient registered successfully.", "patient": patient}), 201
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient registration failed")
        return api_error("Could not register patient. Please try again.", 500)


@bp.put("/api/patients/<int:patient_id>")
def update_patient(patient_id):
    connection = get_db()
    existing = get_patient(connection, patient_id)
    if existing is None:
        return api_error("Patient not found.", 404)
    try:
        values = validate_patient_payload(request.get_json(silent=True), existing)
        connection.execute(
            """
            UPDATE patients SET
                honorific_title = ?, patient_name = ?, patient_age = ?,
                patient_age_type = ?, patient_gender = ?, patient_phone = ?,
                patient_email = ?, patient_address = ?, machine_id = ?, patient_relation = ?
            WHERE id = ?
            """,
            (
                values["honorific_title"], values["patient_name"], values["patient_age"],
                values["patient_age_type"], values["patient_gender"], values["patient_phone"],
                values["patient_email"], values["patient_address"], values["machine_id"],
                values["patient_relation"], patient_id,
            ),
        )
        connection.commit()
        return jsonify({"message": "Patient updated.", "patient": patient_to_dict(get_patient(connection, patient_id))})
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient update failed")
        return api_error("Could not update patient.", 500)


@bp.delete("/api/patients/<int:patient_id>")
def delete_patient(patient_id):
    connection = get_db()
    if get_patient(connection, patient_id) is None:
        return api_error("Patient not found.", 404)
    has_orders = connection.execute(
        "SELECT 1 FROM lab_orders WHERE patient_record_id = ? LIMIT 1", (patient_id,)
    ).fetchone()
    if has_orders:
        return api_error(
            "This patient has order history and cannot be permanently deleted. Keep the record to preserve medical and billing history.",
            409,
        )
    try:
        connection.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        connection.commit()
        return jsonify({"message": "Patient deleted."})
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient deletion failed")
        return api_error("Could not delete patient.", 500)
