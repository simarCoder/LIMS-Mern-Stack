from flask import Blueprint, current_app, jsonify, request, session
import sqlite3
from database import get_db
from services.common import api_error, utc_now
from services.orders_service import order_to_dict

bp = Blueprint("diagnosis", __name__)


@bp.get("/api/diagnosis/orders")
def list_diagnosis_orders():
    """List orders for clinical diagnosis with optional search and status filter."""
    connection = get_db()
    search = request.args.get("search", "").strip().lower()
    status_filter = request.args.get("status", "all").strip().lower()

    rows = connection.execute(
        "SELECT * FROM lab_orders ORDER BY created_at DESC, id DESC LIMIT 200"
    ).fetchall()

    orders = [order_to_dict(connection, row) for row in rows]

    if search:
        orders = [
            o for o in orders
            if (
                search in (o.get("order_no") or "").lower()
                or search in (o.get("patient", {}).get("patient_name") or "").lower()
                or search in (o.get("patient", {}).get("patientId") or "").lower()
                or any(search in (item.get("ht_name") or "").lower() for item in o.get("items", []))
            )
        ]

    if status_filter in {"pending", "in_progress", "in progress", "verified"}:
        target = "In Progress" if status_filter in {"in_progress", "in progress"} else status_filter.capitalize()
        orders = [o for o in orders if (o.get("order_status") or "Pending") == target]

    return jsonify(orders)


@bp.get("/api/diagnosis/orders/<int:order_id>")
def get_diagnosis_order(order_id):
    """Retrieve full diagnostic details for a specific order."""
    connection = get_db()
    row = connection.execute(
        "SELECT * FROM lab_orders WHERE id = ?", (order_id,)
    ).fetchone()
    if row is None:
        return api_error("Diagnostic order not found.", 404)
    return jsonify(order_to_dict(connection, row))


@bp.put("/api/diagnosis/orders/<int:order_id>/results")
def update_diagnosis_order_results(order_id):
    """Batch-save sub-test results, doctor remarks, and diagnostic progress."""
    connection = get_db()
    row = connection.execute(
        "SELECT * FROM lab_orders WHERE id = ?", (order_id,)
    ).fetchone()
    if row is None:
        return api_error("Order not found.", 404)

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return api_error("A valid JSON object is required.")

    sub_tests = data.get("sub_tests", [])
    doctor_remarks = data.get("doctor_remarks")

    try:
        now = utc_now()
        # 1. Update individual sub-tests
        if isinstance(sub_tests, list):
            for st in sub_tests:
                st_id = st.get("id")
                if not st_id:
                    continue
                val = str(st.get("result_value", "") or "").strip()
                notes = str(st.get("result_notes", "") or "").strip() or None
                ref_ranges = st.get("st_ref_ranges")
                unit = st.get("st_unit")
                st_status = st.get("result_status", "Entered" if val else "Pending")
                if st_status not in {"Pending", "Entered", "Verified"}:
                    st_status = "Entered" if val else "Pending"

                updates = ["result_value = ?", "result_notes = ?", "result_status = ?", "updated_at = ?"]
                params = [val, notes, st_status, now]
                if ref_ranges is not None:
                    updates.append("ref_ranges_snapshot = ?")
                    params.append(str(ref_ranges).strip())
                if unit is not None:
                    updates.append("unit_snapshot = ?")
                    params.append(str(unit).strip())
                params.append(st_id)

                connection.execute(
                    f"UPDATE lab_order_subtests SET {', '.join(updates)} WHERE id = ?",
                    params,
                )

        # 2. Update order-level doctor remarks and order status
        if doctor_remarks is not None:
            connection.execute(
                "UPDATE lab_orders SET doctor_remarks = ? WHERE id = ?",
                (str(doctor_remarks).strip(), order_id),
            )

        connection.commit()
        updated_row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
        return jsonify({
            "message": "Diagnostic results saved successfully.",
            "order": order_to_dict(connection, updated_row),
        }), 200
    except (sqlite3.Error, Exception) as exc:
        connection.rollback()
        current_app.logger.exception("Diagnostic results batch update failed")
        return api_error("Could not save diagnostic results.", 500)


@bp.post("/api/diagnosis/orders/<int:order_id>/sync-catalogue")
def sync_diagnosis_order_catalogue(order_id):
    """Synchronize an order's tests, parameters, and reference ranges with current catalogue."""
    from services.tests_service import propagate_catalogue_changes_to_orders
    connection = get_db()
    row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return api_error("Order not found.", 404)

    items = connection.execute(
        "SELECT head_test_id, test_code_snapshot FROM lab_order_items WHERE order_id = ?",
        (order_id,),
    ).fetchall()
    for it in items:
        propagate_catalogue_changes_to_orders(connection, it["head_test_id"], it["test_code_snapshot"])
    connection.commit()

    updated_row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
    return jsonify({
        "message": "Reference ranges and test parameters synchronized with catalogue.",
        "order": order_to_dict(connection, updated_row),
    }), 200


@bp.post("/api/diagnosis/orders/<int:order_id>/verify")
def verify_diagnosis_order(order_id):
    """Sign-off and verify all sub-tests for an order, marking it ready for printing."""
    connection = get_db()
    row = connection.execute(
        "SELECT * FROM lab_orders WHERE id = ?", (order_id,)
    ).fetchone()
    if row is None:
        return api_error("Order not found.", 404)

    try:
        now = utc_now()
        verifier = session.get("username", "Staff Pathologist")

        # Mark all sub-tests under this order's items as Verified
        connection.execute(
            """
            UPDATE lab_order_subtests
            SET result_status = 'Verified', updated_at = ?
            WHERE order_item_id IN (SELECT id FROM lab_order_items WHERE order_id = ?)
            """,
            (now, order_id),
        )

        # Update order status
        connection.execute(
            """
            UPDATE lab_orders
            SET order_status = 'Verified', verified_by = ?, verified_at = ?
            WHERE id = ?
            """,
            (verifier, now, order_id),
        )

        connection.commit()
        updated_row = connection.execute("SELECT * FROM lab_orders WHERE id = ?", (order_id,)).fetchone()
        return jsonify({
            "message": "Diagnostic report verified and signed off.",
            "order": order_to_dict(connection, updated_row),
        }), 200
    except (sqlite3.Error, Exception) as exc:
        connection.rollback()
        current_app.logger.exception("Order verification failed")
        return api_error("Could not verify diagnostic order.", 500)


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
