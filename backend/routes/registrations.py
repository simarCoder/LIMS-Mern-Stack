from flask import Blueprint, current_app, jsonify, request
import sqlite3
from database import get_db
from services.common import api_error
from services.patients_service import validate_patient_payload, insert_patient, get_patient
from services.orders_service import create_order_for_patient

bp = Blueprint("registrations", __name__)


@bp.post("/api/registrations")
def create_registration():
    connection = get_db()
    data = request.get_json(silent=True)
    try:
        if not isinstance(data, dict):
            raise ValueError("A valid JSON object is required.")
        patient_payload = data.get("patient") or {}
        sample_collected = data.get("sample_collected", patient_payload.get("sample_collected", False))
        patient_payload["sample_collected"] = sample_collected

        patient_values = validate_patient_payload(patient_payload)
        patient_dict = insert_patient(connection, patient_values)
        patient_row = get_patient(connection, patient_dict["id"])
        payment_mode = data.get("payment_mode", "Cash")
        payment_status = data.get("payment_status", "Paid")
        paid_amount = data.get("paid_amount")
        test_rates = data.get("test_rates")
        order_dict = create_order_for_patient(
            connection, patient_row, data.get("head_test_ids"), data.get("discount", 0),
            sample_collected=sample_collected,
            payment_mode=payment_mode,
            payment_status=payment_status,
            paid_amount=paid_amount,
            test_rates=test_rates,
        )
        connection.commit()
        return jsonify({
            "message": "Registration saved.",
            "patient": patient_dict,
            "order": order_dict,
        }), 201
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Patient registration and order failed")
        return api_error("Registration could not be saved. No partial patient/order was committed.", 500)
