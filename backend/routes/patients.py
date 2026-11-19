"""HTTP routes for patient registration, lookup, updating, and soft deletion."""
from flask import Blueprint, current_app, jsonify, request
import sqlite3
from database import get_db
from services.common import api_error
from services.patients_service import (
    patient_to_dict,
    get_patient,
    list_patients as service_list_patients,
    validate_patient_payload,
    insert_patient,
    update_patient_record,
    soft_delete_patient,
)

bp = Blueprint("patients", __name__)


@bp.get("/api/patients")
def list_patients():
    """Retrieve active registered patients, supporting search by name, ID, or phone."""
    connection = get_db()
    query = request.args.get("q", "").strip()
    patients = service_list_patients(connection, search_query=query)
    return jsonify(patients), 200


@bp.get("/api/patients/<int:patient_id>")
def get_patient_by_id(patient_id):
    """Retrieve a single active patient by their internal ID."""
    connection = get_db()
    patient = get_patient(connection, patient_id)
    if patient is None:
        return api_error("Patient not found.", 404)
    return jsonify(patient_to_dict(patient)), 200


@bp.post("/api/patients")
def create_patient():
    """Register a new patient record with full demographic validation."""
    connection = get_db()
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return api_error("A valid JSON object is required.")

    try:
        values = validate_patient_payload(data)
        patient = insert_patient(connection, values)
        connection.commit()
        return jsonify({
            "message": "Patient registered successfully.",
            "patient": patient,
        }), 201
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc), 400)
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient registration failed")
        return api_error("Could not register patient. Please check database logs.", 500)


@bp.put("/api/patients/<int:patient_id>")
def update_patient(patient_id):
    """Update demographic information, prescribed tests, and payment for an existing patient."""
    from services.orders_service import sync_order_for_patient
    connection = get_db()
    existing = get_patient(connection, patient_id)
    if existing is None:
        return api_error("Patient not found.", 404)

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return api_error("A valid JSON object is required.")

    try:
        values = validate_patient_payload(data, existing=existing)
        updated_patient = update_patient_record(connection, patient_id, values)

        # Update prescribed tests, discount, and payment mode if provided
        order = None
        if "head_test_ids" in data or "payment_mode" in data:
            head_test_ids = data.get("head_test_ids", [])
            discount = data.get("discount", 0)
            payment_mode = data.get("payment_mode", "Cash")
            payment_status = data.get("payment_status", "Paid")
            paid_amount = data.get("paid_amount")
            test_rates = data.get("test_rates")
            sample_collected = data.get("sample_collected", updated_patient.get("sample_collected", False))

            patient_row = get_patient(connection, patient_id)
            order = sync_order_for_patient(
                connection,
                patient_row,
                head_test_ids,
                discount,
                sample_collected=sample_collected,
                payment_mode=payment_mode,
                payment_status=payment_status,
                paid_amount=paid_amount,
                test_rates=test_rates,
            )

        connection.commit()
        response_payload = {
            "message": "Patient updated successfully.",
            "patient": updated_patient,
        }
        if order is not None:
            response_payload["order"] = order

        return jsonify(response_payload), 200
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc), 400)
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient update failed")
        return api_error("Could not update patient details.", 500)


@bp.delete("/api/patients/<int:patient_id>")
def delete_patient(patient_id):
    """Safely soft-delete a patient while preserving medical records."""
    connection = get_db()
    existing = get_patient(connection, patient_id)
    if existing is None:
        return api_error("Patient not found.", 404)

    # Check if patient has historical orders
    has_orders = connection.execute(
        "SELECT 1 FROM lab_orders WHERE patient_record_id = ? LIMIT 1", (patient_id,)
    ).fetchone()

    try:
        if has_orders:
            # Soft delete to preserve medical history and billing records
            soft_delete_patient(connection, patient_id)
            connection.commit()
            return jsonify({
                "message": "Patient archived. Historical medical and billing records are preserved.",
                "soft_deleted": True,
            }), 200
        else:
            # Safe to soft-delete or remove record completely
            soft_delete_patient(connection, patient_id)
            connection.commit()
            return jsonify({
                "message": "Patient removed successfully.",
                "soft_deleted": True,
            }), 200
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient deletion failed")
        return api_error("Could not delete patient.", 500)
