"""
Test Catalogue Routes — CRUD endpoints for head tests and sub-tests.

These endpoints let the lab administrator manage the master catalogue of
tests offered by the diagnostic centre.  The catalogue drives the
Registration → Order → Diagnosis workflow:

  1. Registration page fetches the catalogue to let the user pick tests.
  2. An order snapshots the selected test + sub-test definitions.
  3. Diagnosis screen uses those snapshots (not the live catalogue).

Because orders use snapshots, editing or deleting catalogue entries
never retroactively changes previously entered lab results.
"""

from flask import Blueprint, current_app, jsonify, request
import sqlite3

from database import get_db
from services.common import api_error
from services.tests_service import (
    test_to_dict,
    validate_test_payload,
    replace_catalogue_subtests,
    propagate_catalogue_changes_to_orders,
)

bp = Blueprint("tests", __name__)


# ──────────────────────────────────────────────────────────────
# Status reference list
# ──────────────────────────────────────────────────────────────

@bp.get("/api/statuses")
def list_statuses():
    """Return all status options (Active / Inactive) for dropdowns."""
    rows = get_db().execute(
        "SELECT status_id, status FROM status ORDER BY status_id"
    ).fetchall()
    return jsonify([
        {"status_id": row["status_id"], "status": row["status"]}
        for row in rows
    ])


# ──────────────────────────────────────────────────────────────
# List tests
# ──────────────────────────────────────────────────────────────

@bp.get("/api/tests")
def list_tests():
    """List all head tests with their sub-tests.

    Query params
    ------------
    all : str
        Pass ``?all=1`` to include inactive tests (admin view).
        By default only active tests are returned (registration view).
    """
    connection = get_db()

    query = """
        SELECT ht.* FROM head_tests ht
        JOIN status s ON s.status_id = ht.ht_status
    """
    # Default: only active tests (used by Registration page dropdowns).
    # Admin test-management page passes ?all=1 to see inactive tests too.
    if request.args.get("all", "0") != "1":
        query += " WHERE lower(s.status) = 'active'"
    query += " ORDER BY lower(ht.ht_name), ht.head_test_id"

    rows = connection.execute(query).fetchall()
    return jsonify([test_to_dict(connection, row) for row in rows])


# ──────────────────────────────────────────────────────────────
# Get single test by ID
# ──────────────────────────────────────────────────────────────

@bp.get("/api/tests/<int:test_id>")
def get_test_by_id(test_id):
    """Get a single test with all its sub-tests.

    Used by the frontend when editing a specific test panel —
    fetches the full head test record plus every child sub-test
    parameter in report-print order.
    """
    connection = get_db()
    test = connection.execute(
        "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
    ).fetchone()

    if test is None:
        return api_error("Test not found.", 404)

    return jsonify(test_to_dict(connection, test))


# ──────────────────────────────────────────────────────────────
# Create test
# ──────────────────────────────────────────────────────────────

@bp.post("/api/tests")
def create_test():
    """Create a new head test with optional sub-tests.

    Expects JSON body with at least ``ht_code``, ``ht_name``, and
    ``ht_status_id``.  An optional ``sub_tests`` array defines the
    individual measurable parameters for this panel.
    """
    connection = get_db()
    try:
        values, sub_tests = validate_test_payload(
            connection, request.get_json(silent=True)
        )

        # Guard against duplicate test codes
        duplicate = connection.execute(
            "SELECT 1 FROM head_tests WHERE lower(ht_code) = lower(?)",
            (values["ht_code"],),
        ).fetchone()
        if duplicate:
            return api_error("That test code already exists.", 409)

        # Insert the head test row
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

        # Insert sub-tests (parameters) for this panel
        replace_catalogue_subtests(connection, values["ht_code"], sub_tests)
        connection.commit()

        # Return the fully serialized test for immediate frontend use
        test = connection.execute(
            "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
        ).fetchone()
        return jsonify({
            "message": "Test created.",
            "test": test_to_dict(connection, test),
        }), 201

    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.IntegrityError:
        connection.rollback()
        return api_error(
            "That test code already exists or the selected status is invalid.",
            409,
        )
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Test creation failed")
        return api_error("Could not create test. Check the database schema.", 500)


# ──────────────────────────────────────────────────────────────
# Update test
# ──────────────────────────────────────────────────────────────

@bp.put("/api/tests/<int:test_id>")
def update_test(test_id):
    """Update an existing head test and replace its sub-tests.

    The test code (``ht_code``) is immutable after creation.  Only the
    name, heading, status, price, and sub-tests can be changed.
    Existing order snapshots remain unchanged.
    """
    connection = get_db()
    existing = connection.execute(
        "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
    ).fetchone()

    if existing is None:
        return api_error("Test not found.", 404)

    try:
        values, sub_tests = validate_test_payload(
            connection, request.get_json(silent=True), existing
        )
        new_code = values["ht_code"]
        old_code = existing["ht_code"]

        # If test code is being updated, verify uniqueness
        if new_code.upper() != old_code.upper():
            duplicate = connection.execute(
                "SELECT 1 FROM head_tests WHERE upper(ht_code) = upper(?) AND head_test_id != ?",
                (new_code, test_id),
            ).fetchone()
            if duplicate:
                return api_error("That test code is already in use by another test.", 409)

        # If code is changing, first wipe old sub_tests to prevent FK constraint check failure on update
        if new_code.upper() != old_code.upper():
            connection.execute("DELETE FROM sub_tests WHERE ht_code = ?", (old_code,))

        # Update head test fields (including ht_code)
        connection.execute(
            """
            UPDATE head_tests SET ht_code = ?, ht_name = ?, ht_heading = ?, ht_status = ?,
                ht_amount = ?, ht_type = ?, ht_ref_ranges = ?, ht_interpretation = ?
            WHERE head_test_id = ?
            """,
            (
                new_code, values["ht_name"], values["ht_heading"], values["ht_status"],
                values["ht_amount"], values["ht_type"], values["ht_ref_ranges"],
                values["ht_interpretation"], test_id,
            ),
        )

        # Replace all catalogue sub-tests for this panel with new_code
        replace_catalogue_subtests(connection, new_code, sub_tests)

        # Propagate reference ranges and parameter definitions to existing patient orders
        propagate_catalogue_changes_to_orders(connection, test_id, old_code)

        connection.commit()

        # Return the freshly updated test
        updated = connection.execute(
            "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
        ).fetchone()
        return jsonify({
            "message": "Test updated. Reference ranges and test definitions updated across patient orders.",
            "test": test_to_dict(connection, updated),
        })

    except ValueError as exc:
        connection.rollback()
        return api_error(str(exc))
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Test update failed")
        return api_error("Could not update test. Please try again.", 500)


# ──────────────────────────────────────────────────────────────
# Delete test
# ──────────────────────────────────────────────────────────────

@bp.delete("/api/tests/<int:test_id>")
def delete_test(test_id):
    """Permanently delete a head test and its catalogue sub-tests.

    Deletion is blocked if the test has ever been used in a lab order
    (safety guard).  The admin should mark it Inactive instead.
    Sub-tests are cascade-deleted by the FK constraint.
    """
    connection = get_db()
    test = connection.execute(
        "SELECT * FROM head_tests WHERE head_test_id = ?", (test_id,)
    ).fetchone()

    if test is None:
        return api_error("Test not found.", 404)

    # Safety: prevent deletion of tests that appear in order history
    used = connection.execute(
        "SELECT 1 FROM lab_order_items WHERE head_test_id = ? LIMIT 1",
        (test_id,),
    ).fetchone()
    if used:
        return api_error(
            "This test is present in order history and cannot be permanently "
            "deleted. Change its status to inactive instead.",
            409,
        )

    try:
        connection.execute(
            "DELETE FROM head_tests WHERE head_test_id = ?", (test_id,)
        )
        connection.commit()
        return jsonify({"message": "Test and its catalogue sub-tests deleted."})
    except sqlite3.Error:
        connection.rollback()
        current_app.logger.exception("Test deletion failed")
        return api_error("Could not delete test.", 500)
