from flask import Blueprint, current_app, jsonify, request
import sqlite3
from database import get_db
from services.common import api_error, utc_now
from services.orders_service import order_to_dict

bp = Blueprint("diagnosis", __name__)


@bp.get("/api/diagnosis/orders")
def list_diagnosis_orders():
    connection = get_db()
    rows = connection.execute(
        "SELECT * FROM lab_orders ORDER BY created_at DESC, id DESC LIMIT 200"
    ).fetchall()
    return jsonify([order_to_dict(connection, row) for row in rows])


@bp.put("/api/order-subtests/<int:row_id>/result")
def save_subtest_result(row_id):
    connection = get_db()
    row = connection.execute(
        "SELECT id FROM lab_order_subtests WHERE id = ?", (row_id,)
    ).fetchone()
    if row is None:
        return api_error("Ordered sub-test not found.", 404)
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return api_error("A valid JSON object is required.")
    value = data.get("result_value", "")
    notes = data.get("result_notes", "")
    status_value = data.get("result_status", "Pending")
    if value is None:
        value = ""
    if notes is None:
        notes = ""
    if not isinstance(value, str) or len(value) > 5000:
        return api_error("Result value must be text (maximum 5000 characters).")
    if not isinstance(notes, str) or len(notes) > 10000:
        return api_error("Result notes must be text (maximum 10000 characters).")
    if status_value not in {"Pending", "Entered", "Verified"}:
        return api_error("Result status must be Pending, Entered, or Verified.")
    try:
        connection.execute(
            """
            UPDATE lab_order_subtests
            SET result_value = ?, result_notes = ?, result_status = ?, updated_at = ?
            WHERE id = ?
            """,
            (value.strip(), notes.strip() or None, status_value, utc_now(), row_id),
        )
        connection.commit()
        return jsonify({"message": "Result saved."})
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Result save failed")
        return api_error("Could not save the result.", 500)
