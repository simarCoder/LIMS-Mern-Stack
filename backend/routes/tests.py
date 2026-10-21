from flask import Blueprint, current_app, jsonify, request
import sqlite3
from database import get_db
from services.common import api_error
from services.tests_service import status_exists, test_to_dict, validate_test_payload, replace_catalogue_subtests

bp = Blueprint("tests", __name__)


@bp.get("/api/statuses")
def list_statuses():
    rows = get_db().execute("SELECT status_id, status FROM status ORDER BY status_id").fetchall()
    return jsonify([{"status_id": row["status_id"], "status": row["status"]} for row in rows])


@bp.get("/api/tests")
def list_tests():
    connection = get_db()
    query = """
        SELECT ht.* FROM head_tests ht
        JOIN status s ON s.status_id = ht.ht_status
    """
    if request.args.get("all", "0") != "1":
        query += " WHERE lower(s.status) = 'active'"
    query += " ORDER BY lower(ht.ht_name), ht.head_test_id"
    rows = connection.execute(query).fetchall()
    return jsonify([test_to_dict(connection, row) for row in rows])


@bp.post("/api/tests")
def create_test():
    connection = get_db()
    try:
        values, sub_tests = validate_test_payload(connection, request.get_json(silent=True))
        duplicate = connection.execute(
            "SELECT 1 FROM head_tests WHERE lower(ht_code) = lower(?)",
            (values["ht_code"],),
        ).fetchone()
        if duplicate:
            return api_error("That test code already exists.", 409)
        cursor = connection.execute(
            """
            INSERT INTO head_tests (
                ht_code, ht_name, ht_heading, ht_status, ht_amount,
                ht_type, ht_ref_ranges, ht_interpretation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                values["ht_code"], values["ht_name"], values["ht_heading"],
                values["ht_status"], values["ht_amount"], values["ht_type"],
                values["ht_ref_ranges"], values["ht_interpretation"],
            ),
        )
        test_id = cursor.lastrowid
        replace_catalogue_subtests(connection, values["ht_code"], sub_tests)
        connection.commit()
        test = connection.execute("SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)).fetchone()
        return jsonify({"message": "Test created.", "test": test_to_dict(connection, test)}), 201
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.IntegrityError:
        connection.rollback()
        return api_error("That test code already exists or the selected status is invalid.", 409)
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Test creation failed")
        return api_error("Could not create test. Check the database schema.", 500)


@bp.put("/api/tests/<int:test_id>")
def update_test(test_id):
    connection = get_db()
    existing = connection.execute(
        "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
    ).fetchone()
    if existing is None:
        return api_error("Test not found.", 404)
    try:
        values, sub_tests = validate_test_payload(connection, request.get_json(silent=True), existing)
        connection.execute(
            """
            UPDATE head_tests SET ht_name = ?, ht_heading = ?, ht_status = ?,
                ht_amount = ?, ht_type = ?, ht_ref_ranges = ?, ht_interpretation = ?
            WHERE head_test_id = ?
            """,
            (
                values["ht_name"], values["ht_heading"], values["ht_status"],
                values["ht_amount"], values["ht_type"], values["ht_ref_ranges"],
                values["ht_interpretation"], test_id,
            ),
        )
        replace_catalogue_subtests(connection, existing["ht_code"], sub_tests)
        connection.commit()
        updated = connection.execute("SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)).fetchone()
        return jsonify({"message": "Test updated. Existing order snapshots are unchanged.", "test": test_to_dict(connection, updated)})
    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Test update failed")
        return api_error("Could not update test. Please try again.", 500)


@bp.delete("/api/tests/<int:test_id>")
def delete_test(test_id):
    connection = get_db()
    test = connection.execute(
        "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
    ).fetchone()
    if test is None:
        return api_error("Test not found.", 404)
    used = connection.execute(
        "SELECT 1 FROM lab_order_items WHERE head_test_id = ? LIMIT 1", (test_id,)
    ).fetchone()
    if used:
        return api_error(
            "This test is present in order history and cannot be permanently deleted. Change its status to inactive instead.",
            409,
        )
    try:
        connection.execute("DELETE FROM head_tests WHERE head_test_id = ?", (test_id,))
        connection.commit()
        return jsonify({"message": "Test and its catalogue sub-tests deleted."})
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Test deletion failed")
        return api_error("Could not delete test.", 500)
