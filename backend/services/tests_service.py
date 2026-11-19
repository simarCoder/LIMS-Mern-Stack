"""
Test Catalogue Service — validation, serialization, and sub-test persistence.

In a LIMS, the "test catalogue" is the master list of laboratory tests offered
by the diagnostic centre.  It has two levels:

  Head Test (Test Panel)
  ──────────────────────
  A billable laboratory test ordered by a doctor.
  Examples: CBC (₹350, Haematology), LFT (₹650, Biochemistry),
            TFT (₹550, Endocrinology), Lipid Profile (₹500).

  Sub-Test (Test Parameter)
  ─────────────────────────
  An individual measurable parameter WITHIN a head test.  These are the
  actual reportable values that appear on a patient's lab report.
  Example sub-tests for CBC:
    • Haemoglobin (Hb)   — g/dL   — Cyanmethemoglobin — M 13–17, F 12–16
    • RBC Count          — M/µL   — Electrical Impedance
    • WBC Count          — /µL    — Electrical Impedance — 4000–11000
    • Platelet Count     — L/µL   — Electrical Impedance — 1.5–4.0
    • PCV / Hematocrit   — %      — Male 40–50, Female 36–44
    • MCV                — fL     — 80–100
    • MCH                — pg     — 27–31
    • MCHC               — g/dL   — 32–36

Editing the catalogue does NOT retroactively change results that have already
been entered for existing lab orders — those use snapshot copies taken at
order-creation time (see lab_order_subtests table).
"""

from decimal import Decimal, InvalidOperation
from .common import parse_int


# ──────────────────────────────────────────────────────────────
# Lookup helpers
# ──────────────────────────────────────────────────────────────

def status_exists(connection, status_id):
    """Return True if *status_id* is present in the status reference table.

    Used during validation to ensure only valid statuses (Active / Inactive)
    are assigned to a head test.
    """
    return connection.execute(
        "SELECT status_id FROM status WHERE status_id = ?", (status_id,)
    ).fetchone() is not None


# ──────────────────────────────────────────────────────────────
# Serialization
# ──────────────────────────────────────────────────────────────

def test_to_dict(connection, test_row):
    """Convert a head_tests Row + its sub_tests into an API-friendly dict.

    The returned dictionary contains every field the React frontend needs
    to display or edit a test panel and its parameters.

    Parameters
    ----------
    connection : sqlite3.Connection
        Active database connection (needed to resolve the status label and
        to fetch child sub-test rows).
    test_row : sqlite3.Row
        A single row from the ``head_tests`` table.

    Returns
    -------
    dict
        Fully serialized test panel including a ``sub_tests`` list ordered
        by print sequence (the order they should appear on a lab report).
    """
    # Resolve the human-readable status label (e.g. "Active" / "Inactive")
    status = connection.execute(
        "SELECT status FROM status WHERE status_id = ?", (test_row["ht_status"],)
    ).fetchone()

    # Fetch all sub-test (parameter) rows for this head test, ordered by
    # print sequence so the report prints in the correct clinical order.
    sub_rows = connection.execute(
        """
        SELECT sub_test_id, st_name, st_method, st_print_seq, st_default_value,
               st_ref_ranges, st_type, st_unit, st_interpretation
        FROM sub_tests
        WHERE ht_code = ?
        ORDER BY st_print_seq, sub_test_id
        """,
        (test_row["ht_code"],),
    ).fetchall()

    return {
        # --- Head test (panel) fields ---
        "head_test_id": test_row["head_test_id"],
        "ht_code":      test_row["ht_code"],
        "ht_name":      test_row["ht_name"],
        "ht_heading":   test_row["ht_heading"] or "",
        "ht_status":    status["status"] if status else None,
        "ht_status_id": test_row["ht_status"],
        "ht_amount":    float(test_row["ht_amount"] or 0),
        "ht_type":      test_row["ht_type"] or "",
        "ht_ref_ranges":     test_row["ht_ref_ranges"] or "",
        "ht_interpretation": test_row["ht_interpretation"] or "",

        # --- Sub-tests (parameters) list ---
        "sub_tests": [
            {
                "sub_test_id":     row["sub_test_id"],
                "st_name":         row["st_name"],
                "st_method":       row["st_method"] or "",
                "st_print_seq":    row["st_print_seq"],
                "st_default_value": row["st_default_value"] or "",
                "st_ref_ranges":   row["st_ref_ranges"] or "",
                "st_type":         row["st_type"] or "",
                "st_unit":         row["st_unit"] or "",
                "st_interpretation": row["st_interpretation"] or "",
            }
            for row in sub_rows
        ],
    }


# ──────────────────────────────────────────────────────────────
# Payload validation
# ──────────────────────────────────────────────────────────────

def validate_test_payload(connection, data, existing=None):
    """Validate and normalise a JSON payload for creating or updating a test.

    Parameters
    ----------
    connection : sqlite3.Connection
        Used to verify that the chosen status ID exists.
    data : dict | None
        Raw JSON body from the request.
    existing : sqlite3.Row | None
        If updating, the current head_tests row (used to fill in defaults
        for any fields omitted by the client).

    Returns
    -------
    tuple[dict, list]
        ``(values, sub_tests)`` where *values* is a dict of cleaned
        head_test column values and *sub_tests* is the validated list
        of sub-test dicts (may be empty).

    Raises
    ------
    ValueError
        With a user-friendly message for any validation failure.
    """
    if not isinstance(data, dict):
        raise ValueError("A valid JSON object is required.")

    # --- Test code & name (required) ---
    code = data.get("ht_code", existing["ht_code"] if existing else "")
    name = data.get("ht_name", existing["ht_name"] if existing else "")
    if not isinstance(code, str) or not code.strip():
        raise ValueError("Test code is required.")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Test name is required.")

    # --- Price validation (must be a non-negative whole number in ₹) ---
    try:
        amount_decimal = Decimal(str(
            data.get("ht_amount", existing["ht_amount"] if existing else 0)
        ))
        if (not amount_decimal.is_finite()
                or amount_decimal < 0
                or amount_decimal != amount_decimal.to_integral_value()):
            raise InvalidOperation
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Price must be a whole non-negative amount in rupees.")

    # --- Status validation (must reference a valid status row) ---
    status_raw = data.get("ht_status_id", existing["ht_status"] if existing else None)
    status_id = parse_int(status_raw, "Status ID", 1)
    if not status_exists(connection, status_id):
        raise ValueError("Choose a valid test status.")

    # --- Sub-tests list validation ---
    sub_tests = data.get("sub_tests", [])
    if not isinstance(sub_tests, list):
        raise ValueError("sub_tests must be a list.")
    for sub_test in sub_tests:
        if (not isinstance(sub_test, dict)
                or not isinstance(sub_test.get("st_name"), str)
                or not sub_test["st_name"].strip()):
            raise ValueError("Every sub-test must have a name.")

    # --- Build cleaned values dict ---
    values = {
        "ht_name":           name.strip(),
        "ht_heading":        (data.get("ht_heading") or "").strip() or None,
        "ht_status":         status_id,
        "ht_amount":         int(amount_decimal),
        "ht_type":           (data.get("ht_type") or "").strip() or None,
        "ht_ref_ranges":     (data.get("ht_ref_ranges") or "").strip() or None,
        "ht_interpretation": (data.get("ht_interpretation") or "").strip() or None,
    }

    # Normalise test code to uppercase
    values["ht_code"] = code.strip().upper()

    return values, sub_tests


# ──────────────────────────────────────────────────────────────
# Sub-test (parameter) persistence
# ──────────────────────────────────────────────────────────────

def replace_catalogue_subtests(connection, ht_code, sub_tests):
    """Delete-and-reinsert all catalogue sub-tests for a head test.

    This uses a simple "replace" strategy: remove all existing sub-test
    rows for the given ``ht_code``, then insert the new set.  This is safe
    because historical lab orders store **snapshot copies** of the sub-test
    definitions at order-creation time (in ``lab_order_subtests``), so
    editing the catalogue never alters previously entered results.

    Parameters
    ----------
    connection : sqlite3.Connection
        Active connection (caller is responsible for committing).
    ht_code : str
        The head test code that owns these sub-tests.
    sub_tests : list[dict]
        Each dict must have at least ``st_name``.  Optional keys:
        ``st_method``, ``st_print_seq``, ``st_default_value``,
        ``st_ref_ranges``, ``st_type``, ``st_unit``, ``st_interpretation``.
    """
    # Wipe existing catalogue sub-tests for this panel
    connection.execute("DELETE FROM sub_tests WHERE ht_code = ?", (ht_code,))

    for index, item in enumerate(sub_tests, start=1):
        # Use the provided print sequence, falling back to insertion order
        try:
            print_seq = parse_int(
                item.get("st_print_seq", index), "Sub-test print order", 1
            )
        except ValueError:
            print_seq = index

        connection.execute(
            """
            INSERT INTO sub_tests (
                ht_code, st_name, st_method, st_print_seq, st_default_value,
                st_ref_ranges, st_type, st_unit, st_interpretation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ht_code,
                item["st_name"].strip(),
                (item.get("st_method") or "").strip() or None,
                print_seq,
                (item.get("st_default_value") or "").strip() or None,
                (item.get("st_ref_ranges") or "").strip() or None,
                (item.get("st_type") or "").strip() or None,
                (item.get("st_unit") or "").strip() or None,
                (item.get("st_interpretation") or "").strip() or None,
            ),
        )


def propagate_catalogue_changes_to_orders(connection, head_test_id, ht_code=None):
    """Propagate updated head test and sub-test definitions (reference ranges, units, methods, etc.)
    to existing patient lab orders, preserving all entered result values, notes, and statuses.
    """
    ht = connection.execute(
        "SELECT * FROM head_tests WHERE head_test_id = ?", (head_test_id,)
    ).fetchone()
    if not ht:
        return

    code = ht["ht_code"]
    test_name = ht["ht_name"]
    test_heading = ht["ht_heading"] or ""

    cat_subtests = connection.execute(
        """
        SELECT * FROM sub_tests
        WHERE ht_code = ?
        ORDER BY st_print_seq, sub_test_id
        """,
        (code,),
    ).fetchall()

    # Find all order line items for this head test
    items = connection.execute(
        """
        SELECT id, order_id, head_test_id, test_code_snapshot
        FROM lab_order_items
        WHERE head_test_id = ? OR UPPER(test_code_snapshot) = UPPER(?)
        """,
        (head_test_id, code if not ht_code else ht_code),
    ).fetchall()

    for item in items:
        # 1. Update line item metadata
        connection.execute(
            """
            UPDATE lab_order_items
            SET head_test_id = ?, test_code_snapshot = ?, test_name_snapshot = ?, test_heading_snapshot = ?
            WHERE id = ?
            """,
            (head_test_id, code, test_name, test_heading, item["id"]),
        )

        # 2. Get existing order subtests for this item
        order_subtests = connection.execute(
            """
            SELECT id, sub_test_id, name_snapshot, print_seq, result_value, result_notes, result_status
            FROM lab_order_subtests
            WHERE order_item_id = ?
            ORDER BY print_seq, id
            """,
            (item["id"],),
        ).fetchall()

        matched_order_st_ids = set()

        for cst in cat_subtests:
            cst_name = (cst["st_name"] or "").strip()
            cst_name_lower = cst_name.lower()
            cst_seq = cst["st_print_seq"]

            # Try to match an existing order subtest:
            # First match: by exact name (case-insensitive)
            matched = None
            for ost in order_subtests:
                if ost["id"] not in matched_order_st_ids and (ost["name_snapshot"] or "").strip().lower() == cst_name_lower:
                    matched = ost
                    break

            # Second match: by print_seq if count and position match
            if not matched:
                for ost in order_subtests:
                    if ost["id"] not in matched_order_st_ids and ost["print_seq"] == cst_seq:
                        matched = ost
                        break

            if matched:
                matched_order_st_ids.add(matched["id"])
                connection.execute(
                    """
                    UPDATE lab_order_subtests
                    SET sub_test_id = ?,
                        name_snapshot = ?,
                        type_snapshot = ?,
                        unit_snapshot = ?,
                        method_snapshot = ?,
                        default_value_snapshot = ?,
                        ref_ranges_snapshot = ?,
                        interpretation_snapshot = ?,
                        print_seq = ?
                    WHERE id = ?
                    """,
                    (
                        cst["sub_test_id"],
                        cst_name,
                        cst["st_type"],
                        cst["st_unit"],
                        cst["st_method"],
                        cst["st_default_value"],
                        cst["st_ref_ranges"],
                        cst["st_interpretation"],
                        cst_seq,
                        matched["id"],
                    ),
                )
            else:
                # New sub-test added to the catalogue: insert as Pending
                connection.execute(
                    """
                    INSERT INTO lab_order_subtests (
                        order_item_id, sub_test_id, name_snapshot, type_snapshot,
                        unit_snapshot, method_snapshot, default_value_snapshot,
                        ref_ranges_snapshot, interpretation_snapshot, print_seq,
                        result_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
                    """,
                    (
                        item["id"],
                        cst["sub_test_id"],
                        cst_name,
                        cst["st_type"],
                        cst["st_unit"],
                        cst["st_method"],
                        cst["st_default_value"],
                        cst["st_ref_ranges"],
                        cst["st_interpretation"],
                        cst_seq,
                    ),
                )

        # For remaining unmatched order subtests that were deleted from catalogue:
        for ost in order_subtests:
            if ost["id"] not in matched_order_st_ids:
                # Only delete if no result was recorded yet
                if not (ost["result_value"] or "").strip():
                    connection.execute(
                        "DELETE FROM lab_order_subtests WHERE id = ?", (ost["id"],)
                    )


def sync_all_orders_with_catalogue(connection):
    """Synchronize all existing patient orders with the latest test catalogue."""
    head_tests = connection.execute("SELECT head_test_id, ht_code FROM head_tests").fetchall()
    for ht in head_tests:
        propagate_catalogue_changes_to_orders(connection, ht["head_test_id"], ht["ht_code"])

