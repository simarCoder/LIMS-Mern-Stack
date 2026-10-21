from flask import Blueprint, current_app, jsonify, request
import sqlite3
from database import get_db
from services.common import api_error, parse_int
from services.patients_service import get_patient
from services.orders_service import create_order_for_patient, order_to_dict

bp = Blueprint("orders", __name__)


@bp.post("/api/orders")
def create_order():
    connection = get_db()
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return api_error("A valid JSON object is required.")
    try:
        patient_id = parse_int(data.get("patient_record_id"), "Patient ID", 1)
        patient = get_patient(connection, patient_id)
        if patient is None:
            return api_error("Patient not found.", 404)
        order = create_order_for_patient(
            connection, patient, data.get("head_test_ids"), data.get("discount", 0)
        )
        connection.commit()
        return jsonify({"message": "Order created.", "order": order}), 201
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Order creation failed")
        return api_error("Could not save the order.", 500)


@bp.get("/api/orders/<int:order_id>")
def get_order_by_id(order_id):
    connection = get_db()
    row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return api_error("Order not found.", 404)
    return jsonify({"order": order_to_dict(connection, row)})
