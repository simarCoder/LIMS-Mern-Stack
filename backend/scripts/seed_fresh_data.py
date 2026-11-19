"""Clean reset and seed utility for LIMS.
Clears older test records and seeds 5 realistic clinical patients with receipt numbers R1..R5.
"""
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add backend to PYTHONPATH
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from database import get_db, init_db
from services.patients_service import insert_patient, validate_patient_payload
from services.orders_service import create_order_for_patient
from app import create_app

def seed_fresh_data():
    app = create_app()
    with app.app_context():
        connection = get_db()

        print("[*] Clearing older orders and patients data...")
        # Clean up dependent tables
        connection.execute("DELETE FROM lab_order_subtests")
        connection.execute("DELETE FROM lab_order_items")
        connection.execute("DELETE FROM lab_orders")
        connection.execute("DELETE FROM patients")

        # Reset SQLite sequence counters if sqlite
        try:
            connection.execute("DELETE FROM sqlite_sequence WHERE name IN ('patients', 'lab_orders', 'lab_order_items', 'lab_order_subtests')")
        except Exception:
            pass

        # Ensure test catalog exists
        head_tests = connection.execute("SELECT * FROM head_tests ORDER BY head_test_id").fetchall()
        if not head_tests:
            print("[!] Head tests catalog empty. Running init_db()...")
            init_db()
            head_tests = connection.execute("SELECT * FROM head_tests ORDER BY head_test_id").fetchall()

        test_by_code = {t["ht_code"].upper(): t for t in head_tests}
        print(f"[*] Available Test Catalog: {list(test_by_code.keys())}")

        now = datetime.now(timezone.utc).isoformat(timespec="seconds")

        patients_data = [
            {
                "honorific_title": "Mr.",
                "patient_name": "Rajesh Sharma",
                "patient_age": 45,
                "patient_age_type": "Years",
                "patient_gender": "Male",
                "patient_relation": "S/o",
                "patient_relation_name": "Ramesh Sharma",
                "patient_phone": "9876543210",
                "patient_email": "rajesh.sharma@example.com",
                "patient_address": "42, Civil Lines, Near Clock Tower",
                "machine_id": "M-AUTO-01",
                "sample_collected": 1,
                "payment_mode": "Cash",
                "payment_status": "Paid",
                "discount": 50.0,
                "test_codes": ["CBC", "CRP"],
                "results": {
                    "Haemoglobin(Hb)": "14.2",
                    "Total RBC Count": "4.85",
                    "Total Leukocyte Count (WBC)": "7800",
                    "Platelet Count": "2.45",
                    "Packed Cell Volume (PCV)": "42.6",
                    "Mean Corpuscular Volume (MCV)": "87.8",
                    "Mean Corpuscular Hemoglobin (MCH)": "29.3",
                    "MCHC": "33.3",
                    "RDW-CV": "12.8",
                    "Neutrophils": "64",
                    "Lymphocytes": "28",
                    "Eosinophils": "3",
                    "Monocytes": "5",
                    "Basophils": "0",
                    "C-Reactive Protein (Quantitative)": "4.2"
                },
                "verify": True,
                "doctor_remarks": "Normal CBC parameters with normal CRP. No signs of acute inflammation."
            },
            {
                "honorific_title": "Mrs.",
                "patient_name": "Sunita Verma",
                "patient_age": 38,
                "patient_age_type": "Years",
                "patient_gender": "Female",
                "patient_relation": "W/o",
                "patient_relation_name": "Deepak Verma",
                "patient_phone": "9811223344",
                "patient_email": "sunita.v@example.com",
                "patient_address": "12/B, Green Park Extension",
                "machine_id": "M-BIO-03",
                "sample_collected": 1,
                "payment_mode": "Credit (Online / UPI)",
                "payment_status": "Paid",
                "discount": 0.0,
                "test_codes": ["LIPID", "FBS"],
                "results": {
                    "Fasting Blood Glucose": "108.0",
                    "Total Cholesterol": "215.0",
                    "Triglycerides": "180.0",
                    "HDL Cholesterol": "44.0",
                    "LDL Cholesterol": "135.0",
                    "VLDL Cholesterol": "36.0",
                    "TC / HDL Ratio": "4.88"
                },
                "verify": True,
                "doctor_remarks": "Mild hyperlipidemia and impaired fasting glucose. Dietary modification advised."
            },
            {
                "honorific_title": "Mr.",
                "patient_name": "Amit Patel",
                "patient_age": 52,
                "patient_age_type": "Years",
                "patient_gender": "Male",
                "patient_relation": "S/o",
                "patient_relation_name": "Kirit Patel",
                "patient_phone": "9925012345",
                "patient_email": "amit.patel@example.com",
                "patient_address": "77, Shanti Nagar, Ring Road",
                "machine_id": "M-BIO-02",
                "sample_collected": 1,
                "payment_mode": "Card (Debit / Credit)",
                "payment_status": "Paid",
                "discount": 0.0,
                "test_codes": ["KFT"],
                "results": {
                    "Blood Urea": "32.0",
                    "Serum Creatinine": "1.1",
                    "Uric Acid": "6.2",
                    "Serum Sodium": "139.0",
                    "Serum Potassium": "4.3",
                    "Serum Chloride": "101.0"
                },
                "verify": False,
                "doctor_remarks": "Renal parameters within biological reference intervals."
            },
            {
                "honorific_title": "Ms.",
                "patient_name": "Pooja Nair",
                "patient_age": 29,
                "patient_age_type": "Years",
                "patient_gender": "Female",
                "patient_relation": "D/o",
                "patient_relation_name": "K. V. Nair",
                "patient_phone": "9447011223",
                "patient_email": "pooja.nair@example.com",
                "patient_address": "204, Palm Grove Apartments",
                "machine_id": "M-IMMUNO-01",
                "sample_collected": 1,
                "payment_mode": "Credit (Online / UPI)",
                "payment_status": "Paid",
                "discount": 100.0,
                "test_codes": ["TFT"],
                "results": {
                    "Total Triiodothyronine (T3)": "1.25",
                    "Total Thyroxine (T4)": "8.4",
                    "Thyroid Stimulating Hormone (TSH)": "2.85"
                },
                "verify": False,
                "doctor_remarks": "Euthyroid profile."
            },
            {
                "honorific_title": "Master",
                "patient_name": "Aarav Gupta",
                "patient_age": 8,
                "patient_age_type": "Years",
                "patient_gender": "Male",
                "patient_relation": "S/o",
                "patient_relation_name": "Vikas Gupta",
                "patient_phone": "9820098200",
                "patient_email": "vikas.gupta@example.com",
                "patient_address": "Plot 54, Sector 15, Vashi",
                "machine_id": "M-CLIN-01",
                "sample_collected": 0,
                "payment_mode": "Cash",
                "payment_status": "Pending",
                "discount": 0.0,
                "test_codes": ["URINE_RE"],
                "results": {},
                "verify": False,
                "doctor_remarks": None
            }
        ]

        print("\n[*] Seeding 5 fresh patient records...")
        for idx, p in enumerate(patients_data, start=1):
            patient_vals = validate_patient_payload(p)
            patient_record = insert_patient(connection, patient_vals)
            patient_row = connection.execute("SELECT * FROM patients WHERE id = ?", (patient_record["id"],)).fetchone()

            # Find head test IDs
            test_ids = [test_by_code[c]["head_test_id"] for c in p["test_codes"] if c in test_by_code]

            # Create Order
            order = create_order_for_patient(
                connection=connection,
                patient_row=patient_row,
                test_ids=test_ids,
                raw_discount=p["discount"],
                sample_collected=p["sample_collected"],
                payment_mode=p["payment_mode"],
                payment_status=p["payment_status"],
            )

            order_id = order["id"]
            order_no = order["order_no"]

            # Populate Subtests with observed results if available
            if p["results"]:
                subtests = connection.execute(
                    """
                    SELECT s.id, s.name_snapshot
                    FROM lab_order_subtests s
                    JOIN lab_order_items i ON i.id = s.order_item_id
                    WHERE i.order_id = ?
                    """,
                    (order_id,)
                ).fetchall()

                all_filled = True
                for st in subtests:
                    val = p["results"].get(st["name_snapshot"])
                    if val is not None:
                        connection.execute(
                            """
                            UPDATE lab_order_subtests
                            SET result_value = ?, result_status = 'Completed', updated_at = ?
                            WHERE id = ?
                            """,
                            (str(val), now, st["id"])
                        )
                    else:
                        all_filled = False

                if all_filled:
                    connection.execute(
                        "UPDATE lab_orders SET order_status = 'Completed' WHERE id = ?",
                        (order_id,)
                    )

            if p["verify"]:
                connection.execute(
                    """
                    UPDATE lab_orders
                    SET verified_by = 'Dr. S. K. Mukherjee (MD Path)',
                        verified_at = ?,
                        doctor_remarks = ?,
                        order_status = 'Verified'
                    WHERE id = ?
                    """,
                    (now, p["doctor_remarks"], order_id)
                )

            print(f"  [OK] Seeded Patient {patient_record['patientId']}: {p['patient_name']} | Receipt No: {order_no} | Payment: {p['payment_mode']}")

        connection.commit()
        print("\n[OK] Successfully seeded 5 fresh patients with receipt numbers R1 through R5.")

if __name__ == "__main__":
    seed_fresh_data()
