"""Order creation and serialization with immutable patient/test snapshots."""
from decimal import Decimal, InvalidOperation
from .common import parse_int, utc_now
def order_to_dict(connection, order_row):
    patient_row = connection.execute(
        "SELECT * FROM patients WHERE id = ?", (order_row["patient_record_id"],)
    ).fetchone()
    if patient_row:
        from .patients_service import patient_to_dict
        patient = patient_to_dict(patient_row)
    else:
        patient = {
            "id": order_row["patient_record_id"],
            "patientId": order_row["patient_code_snapshot"] or "",
            "patient_name": order_row["patient_name_snapshot"],
            "patient_age": order_row["patient_age_snapshot"] or "",
            "patient_gender": order_row["patient_gender_snapshot"] or "",
        }
    items = connection.execute(
        "SELECT * FROM lab_order_items WHERE order_id = ? ORDER BY id",
        (order_row["id"],),
    ).fetchall()
    item_dicts = []
    for item in items:
        sub_tests = connection.execute(
            """
            SELECT id, sub_test_id, name_snapshot, type_snapshot, unit_snapshot,
                   method_snapshot, default_value_snapshot, ref_ranges_snapshot,
                   interpretation_snapshot, print_seq, result_value, result_notes,
                   result_status, updated_at
            FROM lab_order_subtests
            WHERE order_item_id = ?
            ORDER BY print_seq, id
            """,
            (item["id"],),
        ).fetchall()
        item_dicts.append(
            {
                "id": item["id"],
                "head_test_id": item["head_test_id"],
                "ht_code": item["test_code_snapshot"],
                "ht_name": item["test_name_snapshot"],
                "ht_heading": item["test_heading_snapshot"] or "",
                "unit_price": float(item["unit_price"] or 0),
                "sub_tests": [
                    {
                        "id": st["id"],
                        "sub_test_id": st["sub_test_id"],
                        "st_name": st["name_snapshot"],
                        "st_type": st["type_snapshot"] or "",
                        "st_unit": st["unit_snapshot"] or "",
                        "st_method": st["method_snapshot"] or "",
                        "st_default_value": st["default_value_snapshot"] or "",
                        "st_ref_ranges": st["ref_ranges_snapshot"] or "",
                        "st_interpretation": st["interpretation_snapshot"] or "",
                        "st_print_seq": st["print_seq"],
                        "result_value": st["result_value"] or "",
                        "result_notes": st["result_notes"] or "",
                        "result_status": st["result_status"] or "Pending",
                        "updated_at": st["updated_at"],
                    }
                    for st in sub_tests
                ],
            }
        )
    keys = order_row.keys() if hasattr(order_row, "keys") else []
    sample_collected = bool(order_row["sample_collected"]) if "sample_collected" in keys else False

    specimens_raw = order_row["specimens_data"] if "specimens_data" in keys else None
    specimens = []
    if specimens_raw:
        import json
        try:
            specimens = json.loads(specimens_raw) if isinstance(specimens_raw, str) else specimens_raw
        except Exception:
            specimens = []

    payment_mode = order_row["payment_mode"] if "payment_mode" in keys else "Cash"
    payment_status = order_row["payment_status"] if "payment_status" in keys else "Paid"
    doctor_remarks = (order_row["doctor_remarks"] or "") if "doctor_remarks" in keys else ""
    verified_by = order_row["verified_by"] if "verified_by" in keys else None
    verified_at = order_row["verified_at"] if "verified_at" in keys else None

    total_val = float(order_row["total"] or 0)
    if "paid_amount" in keys and order_row["paid_amount"] is not None:
        paid_amount = float(order_row["paid_amount"])
    else:
        paid_amount = total_val if (payment_status or "").lower() == "paid" else 0.0

    if "due_amount" in keys and order_row["due_amount"] is not None:
        due_amount = float(order_row["due_amount"])
    else:
        due_amount = max(0.0, total_val - paid_amount)

    # Compute overall diagnostic status from sub-tests if not explicitly set
    raw_status = (order_row["order_status"] or "Pending") if "order_status" in keys else "Pending"
    all_subtests = [st for it in item_dicts for st in it.get("sub_tests", [])]
    if all_subtests:
        if all(st.get("result_status") == "Verified" for st in all_subtests):
            computed_status = "Verified"
        elif any(bool(st.get("result_value")) for st in all_subtests):
            computed_status = "In Progress"
        else:
            computed_status = "Pending"
        clinical_status = raw_status if raw_status == "Verified" else computed_status
    else:
        clinical_status = raw_status

    return {
        "id": order_row["id"],
        "order_no": order_row["order_no"],
        "created_at": order_row["created_at"],
        "patient": patient,
        "subtotal": float(order_row["subtotal"] or 0),
        "discount": float(order_row["discount"] or 0),
        "total": total_val,
        "paid_amount": paid_amount,
        "due_amount": due_amount,
        "sample_collected": sample_collected,
        "payment_mode": payment_mode or "Cash",
        "payment_status": payment_status or "Paid",
        "doctor_remarks": doctor_remarks,
        "verified_by": verified_by,
        "verified_at": verified_at,
        "order_status": clinical_status,
        "specimens": specimens,
        "items": item_dicts,
    }

def create_order_for_patient(
    connection,
    patient_row,
    test_ids,
    raw_discount,
    sample_collected=False,
    payment_mode="Cash",
    payment_status="Paid",
    paid_amount=None,
    test_rates=None,
):
    if not isinstance(test_ids, list) or not test_ids:
        raise ValueError("Select at least one head test.")
    normalized_ids = [parse_int(value, "Test ID", 1) for value in test_ids]
    if len(set(normalized_ids)) != len(normalized_ids):
        raise ValueError("A head test cannot be selected more than once.")

    try:
        discount = Decimal(str(raw_discount if raw_discount is not None else 0))
        if not discount.is_finite() or discount < 0:
            raise InvalidOperation
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Discount must be a valid non-negative amount.")

    placeholders = ",".join("?" for _ in normalized_ids)
    rows = connection.execute(
        f"""
        SELECT ht.*
        FROM head_tests ht
        JOIN status s ON s.status_id = ht.ht_status
        WHERE ht.head_test_id IN ({placeholders})
          AND lower(s.status) = 'active'
        """,
        normalized_ids,
    ).fetchall()
    by_id = {row["head_test_id"]: row for row in rows}
    if len(by_id) != len(normalized_ids):
        raise ValueError("One or more selected head tests are unavailable or inactive.")

    test_rates_map = test_rates if isinstance(test_rates, dict) else {}
    ordered_tests = [by_id[test_id] for test_id in normalized_ids]

    # Calculate subtotal using custom rate if provided, else catalog rate
    subtotal = Decimal("0.00")
    for test in ordered_tests:
        tid = test["head_test_id"]
        custom_rate = test_rates_map.get(tid) or test_rates_map.get(str(tid))
        if custom_rate is not None:
            subtotal += Decimal(str(custom_rate))
        else:
            subtotal += Decimal(str(test["ht_amount"] or 0))

    if discount > subtotal:
        raise ValueError("Discount cannot exceed the subtotal.")
    total = subtotal - discount

    # Calculate paid and due amounts
    if paid_amount is not None:
        try:
            paid = Decimal(str(paid_amount))
            if paid < 0:
                paid = Decimal("0.00")
        except Exception:
            paid = total
    else:
        if (payment_status or "").lower() in {"pending", "unpaid"}:
            paid = Decimal("0.00")
        else:
            paid = total

    due = max(Decimal("0.00"), total - paid)

    if due == Decimal("0.00"):
        actual_payment_status = "Paid"
    elif paid > Decimal("0.00"):
        actual_payment_status = "Partial"
    else:
        actual_payment_status = "Pending"

    patient_code = patient_row["patient_id"]
    patient_name = f'{patient_row["honorific_title"] or ""} {patient_row["patient_name"]}'.strip()
    patient_age = f'{patient_row["patient_age"]} {patient_row["patient_age_type"]}'
    patient_gender = patient_row["patient_gender"]
    created_at = utc_now()

    sample_collected_val = 1 if sample_collected in {True, 1, "1", "true", "True"} else 0

    cursor = connection.execute(
        """
        INSERT INTO lab_orders (
            order_no, patient_record_id, patient_code_snapshot, patient_name_snapshot,
            patient_age_snapshot, patient_gender_snapshot, subtotal, discount, total,
            paid_amount, due_amount,
            sample_collected, payment_mode, payment_status, created_at
        ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            patient_row["id"], patient_code, patient_name, patient_age,
            patient_gender, str(subtotal), str(discount), str(total),
            str(paid), str(due),
            sample_collected_val, payment_mode or "Cash", actual_payment_status, created_at,
        ),
    )
    order_id = cursor.lastrowid
    order_no = f"R{order_id}"
    connection.execute("UPDATE lab_orders SET order_no = ? WHERE id = ?", (order_no, order_id))

    for test in ordered_tests:
        tid = test["head_test_id"]
        custom_rate = test_rates_map.get(tid) or test_rates_map.get(str(tid))
        unit_price = Decimal(str(custom_rate)) if custom_rate is not None else Decimal(str(test["ht_amount"] or 0))

        item_cursor = connection.execute(
            """
            INSERT INTO lab_order_items (
                order_id, head_test_id, test_code_snapshot, test_name_snapshot,
                test_heading_snapshot, unit_price
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                order_id, test["head_test_id"], test["ht_code"], test["ht_name"],
                test["ht_heading"], str(unit_price),
            ),
        )
        item_id = item_cursor.lastrowid
        sub_tests = connection.execute(
            """
            SELECT * FROM sub_tests WHERE ht_code = ?
            ORDER BY st_print_seq, sub_test_id
            """,
            (test["ht_code"],),
        ).fetchall()
        for sub_test in sub_tests:
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
                    item_id, sub_test["sub_test_id"], sub_test["st_name"],
                    sub_test["st_type"], sub_test["st_unit"], sub_test["st_method"],
                    sub_test["st_default_value"], sub_test["st_ref_ranges"],
                    sub_test["st_interpretation"], sub_test["st_print_seq"],
                ),
            )
    return order_to_dict(connection, connection.execute(
        "SELECT * FROM lab_orders WHERE id = ?", (order_id,)
    ).fetchone())


def sync_order_for_patient(
    connection,
    patient_row,
    test_ids,
    raw_discount,
    sample_collected=False,
    payment_mode="Cash",
    payment_status="Paid",
    paid_amount=None,
    test_rates=None,
):
    """Update or create the patient's lab order with new tests, discount, and payment mode."""
    existing_order = connection.execute(
        "SELECT * FROM lab_orders WHERE patient_record_id = ? ORDER BY id DESC LIMIT 1",
        (patient_row["id"],),
    ).fetchone()

    if existing_order is None:
        if test_ids and len(test_ids) > 0:
            return create_order_for_patient(
                connection, patient_row, test_ids, raw_discount,
                sample_collected=sample_collected,
                payment_mode=payment_mode,
                payment_status=payment_status,
                paid_amount=paid_amount,
                test_rates=test_rates,
            )
        return None

    order_id = existing_order["id"]

    if not test_ids or len(test_ids) == 0:
        # Wipe line items if all tests were removed
        connection.execute("DELETE FROM lab_order_items WHERE order_id = ?", (order_id,))
        connection.execute(
            """
            UPDATE lab_orders
            SET subtotal = 0, discount = 0, total = 0, paid_amount = 0, due_amount = 0,
                payment_mode = ?, payment_status = ?
            WHERE id = ?
            """,
            (payment_mode or "Cash", payment_status or "Paid", order_id),
        )
        return order_to_dict(connection, connection.execute(
            "SELECT * FROM lab_orders WHERE id = ?", (order_id,)
        ).fetchone())

    # Tests provided: validate and rebuild line items
    normalized_ids = [parse_int(value, "Test ID", 1) for value in test_ids]
    placeholders = ",".join("?" for _ in normalized_ids)
    rows = connection.execute(
        f"""
        SELECT ht.*
        FROM head_tests ht
        JOIN status s ON s.status_id = ht.ht_status
        WHERE ht.head_test_id IN ({placeholders})
          AND lower(s.status) = 'active'
        """,
        normalized_ids,
    ).fetchall()
    by_id = {row["head_test_id"]: row for row in rows}
    if len(by_id) != len(normalized_ids):
        raise ValueError("One or more selected head tests are unavailable or inactive.")

    test_rates_map = test_rates if isinstance(test_rates, dict) else {}
    ordered_tests = [by_id[test_id] for test_id in normalized_ids]

    discount = Decimal(str(raw_discount if raw_discount is not None else 0))
    subtotal = Decimal("0.00")
    for test in ordered_tests:
        tid = test["head_test_id"]
        custom_rate = test_rates_map.get(tid) or test_rates_map.get(str(tid))
        if custom_rate is not None:
            subtotal += Decimal(str(custom_rate))
        else:
            subtotal += Decimal(str(test["ht_amount"] or 0))

    if discount > subtotal:
        raise ValueError("Discount cannot exceed the subtotal.")
    total = subtotal - discount

    if paid_amount is not None:
        try:
            paid = Decimal(str(paid_amount))
            if paid < 0:
                paid = Decimal("0.00")
        except Exception:
            paid = total
    else:
        if (payment_status or "").lower() in {"pending", "unpaid"}:
            paid = Decimal("0.00")
        else:
            paid = total

    due = max(Decimal("0.00"), total - paid)

    if due == Decimal("0.00"):
        actual_payment_status = "Paid"
    elif paid > Decimal("0.00"):
        actual_payment_status = "Partial"
    else:
        actual_payment_status = "Pending"

    sample_val = 1 if sample_collected in {True, 1, "1", "true", "True"} else 0

    # Replace line items
    connection.execute("DELETE FROM lab_order_items WHERE order_id = ?", (order_id,))

    patient_name = f'{patient_row["honorific_title"] or ""} {patient_row["patient_name"]}'.strip()
    patient_age = f'{patient_row["patient_age"]} {patient_row["patient_age_type"]}'
    patient_gender = patient_row["patient_gender"]

    connection.execute(
        """
        UPDATE lab_orders
        SET patient_name_snapshot = ?, patient_age_snapshot = ?, patient_gender_snapshot = ?,
            subtotal = ?, discount = ?, total = ?, paid_amount = ?, due_amount = ?,
            sample_collected = ?, payment_mode = ?, payment_status = ?
        WHERE id = ?
        """,
        (
            patient_name, patient_age, patient_gender,
            str(subtotal), str(discount), str(total), str(paid), str(due), sample_val,
            payment_mode or "Cash", actual_payment_status, order_id,
        ),
    )

    for test in ordered_tests:
        tid = test["head_test_id"]
        custom_rate = test_rates_map.get(tid) or test_rates_map.get(str(tid))
        unit_price = Decimal(str(custom_rate)) if custom_rate is not None else Decimal(str(test["ht_amount"] or 0))

        item_cursor = connection.execute(
            """
            INSERT INTO lab_order_items (
                order_id, head_test_id, test_code_snapshot, test_name_snapshot,
                test_heading_snapshot, unit_price
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                order_id, test["head_test_id"], test["ht_code"], test["ht_name"],
                test["ht_heading"], str(unit_price),
            ),
        )
        item_id = item_cursor.lastrowid
        sub_tests = connection.execute(
            """
            SELECT * FROM sub_tests WHERE ht_code = ?
            ORDER BY st_print_seq, sub_test_id
            """,
            (test["ht_code"],),
        ).fetchall()
        for sub_test in sub_tests:
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
                    item_id, sub_test["sub_test_id"], sub_test["st_name"],
                    sub_test["st_type"], sub_test["st_unit"], sub_test["st_method"],
                    sub_test["st_default_value"], sub_test["st_ref_ranges"],
                    sub_test["st_interpretation"], sub_test["st_print_seq"],
                ),
            )

    return order_to_dict(connection, connection.execute(
        "SELECT * FROM lab_orders WHERE id = ?", (order_id,)
    ).fetchone())

