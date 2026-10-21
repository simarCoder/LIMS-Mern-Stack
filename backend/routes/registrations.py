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
        patient_values = validate_patient_payload(data.get("patient"))
        patient_dict = insert_patient(connection, patient_values)
        patient_row = get_patient(connection, patient_dict["id"])
        order_dict = create_order_for_patient(
            connection, patient_row, data.get("head_test_ids"), data.get("discount", 0)
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
