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
            connection, patient, data.get("head_test_ids"), data.get("discount", 0),
            sample_collected=data.get("sample_collected", False)
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


@bp.get("/api/orders")
def list_orders():
    """List lab orders, optionally filtered by patient_id."""
    connection = get_db()
    patient_id_raw = request.args.get("patient_id")
    if patient_id_raw:
        try:
            patient_id = int(patient_id_raw)
            rows = connection.execute(
                "SELECT * FROM lab_orders WHERE patient_record_id = ? ORDER BY id DESC",
                (patient_id,),
            ).fetchall()
        except ValueError:
            return api_error("Invalid patient_id parameter.")
    else:
        rows = connection.execute(
            "SELECT * FROM lab_orders ORDER BY id DESC LIMIT 100"
        ).fetchall()
    return jsonify([order_to_dict(connection, row) for row in rows])


@bp.get("/api/patients/<int:patient_id>/receipt")
def get_patient_receipt(patient_id):
    """Retrieve the receipt for a patient: their latest lab order if exists,

    otherwise their demographic admission slip.
    """
    connection = get_db()
    patient = get_patient(connection, patient_id)
    if patient is None:
        return api_error("Patient not found.", 404)

    # Check for the latest order first
    row = connection.execute(
        "SELECT * FROM lab_orders WHERE patient_record_id = ? ORDER BY id DESC LIMIT 1",
        (patient_id,),
    ).fetchone()

    if row:
        return jsonify({"receipt": order_to_dict(connection, row), "has_order": True})

    # No test order placed yet: return demographic admission slip
    from services.patients_service import patient_to_dict
    patient_dict = patient_to_dict(patient)
    receipt_data = {
        "id": f"REC-{patient_dict['patientId']}",
        "order_no": patient_dict["patientId"],
        "created_at": patient_dict["patient_created_at"],
        "patient": patient_dict,
        "subtotal": 0.0,
        "discount": 0.0,
        "total": 0.0,
        "sample_collected": bool(patient_dict.get("sample_collected", False)),
        "items": [],
    }
    return jsonify({"receipt": receipt_data, "has_order": False})


@bp.put("/api/orders/<int:order_id>/specimens")
def update_order_specimens(order_id):
    """Save or update sample collection verification & tube specimens for an order."""
    import json
    connection = get_db()
    row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return api_error("Order not found.", 404)

    data = request.get_json(silent=True) or {}
    specimens = data.get("specimens", [])
    sample_collected = data.get("sample_collected", True)
    sample_val = 1 if sample_collected in {True, 1, "1", "true", "True"} else 0
    specimens_json = json.dumps(specimens) if specimens else None

    try:
        connection.execute(
            """
            UPDATE lab_orders
            SET specimens_data = ?, sample_collected = ?
            WHERE id = ?
            """,
            (specimens_json, sample_val, order_id),
        )
        # Synchronize patient record's sample_collected flag
        connection.execute(
            "UPDATE patients SET sample_collected = ? WHERE id = ?",
            (sample_val, row["patient_record_id"]),
        )
        connection.commit()
        updated_row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
        return jsonify({
            "message": "Specimens and sample collection updated.",
            "order": order_to_dict(connection, updated_row),
        })
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Specimens update failed")
        return api_error("Could not update specimen data.", 500)


