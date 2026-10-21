"""Test catalogue validation, serialization, and sub-test persistence."""
from decimal import Decimal, InvalidOperation
from .common import parse_int
def status_exists(connection, status_id):
    return connection.execute(
        "SELECT status_id FROM status WHERE status_id = ?", (status_id,)
    ).fetchone() is not None

def test_to_dict(connection, test_row):
    status = connection.execute(
        "SELECT status FROM status WHERE status_id = ?", (test_row["ht_status"],)
    ).fetchone()
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
        "head_test_id": test_row["head_test_id"],
        "ht_code": test_row["ht_code"],
        "ht_name": test_row["ht_name"],
        "ht_heading": test_row["ht_heading"] or "",
        "ht_status": status["status"] if status else None,
        "ht_status_id": test_row["ht_status"],
        "ht_amount": float(test_row["ht_amount"] or 0),
        "ht_type": test_row["ht_type"] or "",
        "ht_ref_ranges": test_row["ht_ref_ranges"] or "",
        "ht_interpretation": test_row["ht_interpretation"] or "",
        "sub_tests": [
            {
                "sub_test_id": row["sub_test_id"],
                "st_name": row["st_name"],
                "st_method": row["st_method"] or "",
                "st_print_seq": row["st_print_seq"],
                "st_default_value": row["st_default_value"] or "",
                "st_ref_ranges": row["st_ref_ranges"] or "",
                "st_type": row["st_type"] or "",
                "st_unit": row["st_unit"] or "",
                "st_interpretation": row["st_interpretation"] or "",
            }
            for row in sub_rows
        ],
    }

def validate_test_payload(connection, data, existing=None):
    if not isinstance(data, dict):
        raise ValueError("A valid JSON object is required.")
    code = data.get("ht_code", existing["ht_code"] if existing else "")
    name = data.get("ht_name", existing["ht_name"] if existing else "")
    if not isinstance(code, str) or not code.strip():
        raise ValueError("Test code is required.")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Test name is required.")

    try:
        amount_decimal = Decimal(str(data.get("ht_amount", existing["ht_amount"] if existing else 0)))
        if not amount_decimal.is_finite() or amount_decimal < 0 or amount_decimal != amount_decimal.to_integral_value():
            raise InvalidOperation
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Price must be a whole non-negative amount in rupees.")

    status_raw = data.get("ht_status_id", existing["ht_status"] if existing else None)
    status_id = parse_int(status_raw, "Status ID", 1)
    if not status_exists(connection, status_id):
        raise ValueError("Choose a valid test status.")

    sub_tests = data.get("sub_tests", [])
    if not isinstance(sub_tests, list):
        raise ValueError("sub_tests must be a list.")
    for sub_test in sub_tests:
        if not isinstance(sub_test, dict) or not isinstance(sub_test.get("st_name"), str) or not sub_test["st_name"].strip():
            raise ValueError("Every sub-test must have a name.")

    values = {
        "ht_name": name.strip(),
        "ht_heading": (data.get("ht_heading") or "").strip() or None,
        "ht_status": status_id,
        "ht_amount": int(amount_decimal),
        "ht_type": (data.get("ht_type") or "").strip() or None,
        "ht_ref_ranges": (data.get("ht_ref_ranges") or "").strip() or None,
        "ht_interpretation": (data.get("ht_interpretation") or "").strip() or None,
    }
    if existing is None:
        values["ht_code"] = code.strip().lower()
    return values, sub_tests

def replace_catalogue_subtests(connection, ht_code, sub_tests):
    # Historical orders use snapshots, so changing these rows does not change
    # results already entered for an existing order.
    connection.execute("DELETE FROM sub_tests WHERE ht_code = ?", (ht_code,))
    for index, item in enumerate(sub_tests, start=1):
        try:
            print_seq = parse_int(item.get("st_print_seq", index), "Sub-test print order", 1)
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
