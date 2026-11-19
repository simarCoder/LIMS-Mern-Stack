"""Bulk Patient & Diagnostic Order Generator for Labora+ LIMS.
Usage:
    python backend/scripts/generate_bulk_patients.py [--count 200]
"""
import sys
import os
import random
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
load_dotenv(ROOT_DIR / ".env")

from database import open_database, PostgresConnectionWrapper
from services.patients_service import insert_patient, validate_patient_payload
from services.orders_service import create_order_for_patient

# Diverse realistic patient demographic pools
FIRST_NAMES_MALE = [
    "Rajesh", "Amit", "Vikram", "Rohan", "Suresh", "Sunil", "Manoj", "Aarav", 
    "Deepak", "Prakash", "Manish", "Gaurav", "Nitin", "Harish", "Arjun", 
    "Sanjay", "Ramesh", "Ajay", "Karan", "Vishal", "Ashok", "Kunal", "Anand",
    "Pankaj", "Vikas", "Rahul", "Sachin", "Dinesh", "Devendra", "Hemant"
]

FIRST_NAMES_FEMALE = [
    "Sunita", "Pooja", "Anjali", "Priya", "Kavita", "Ritu", "Rekha", "Meena",
    "Sneha", "Divya", "Neha", "Shweta", "Preeti", "Suman", "Anita", "Geeta",
    "Sarita", "Monika", "Deepika", "Shalini", "Jyoti", "Aarti", "Simran",
    "Mamta", "Radha", "Nisha", "Swati", "Rashmi", "Vandana", "Shikha"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Nair", "Singh", "Yadav", "Kumar",
    "Mishra", "Joshi", "Chauhan", "Bhatia", "Malhotra", "Kapoor", "Saxena",
    "Reddy", "Rao", "Iyer", "Choudhary", "Kulkarni", "Deshmukh", "Pandey",
    "Agarwal", "Bansal", "Mehta", "Shah", "Trivedi", "Soni", "Chhabra"
]

RELATIONS_MALE = ["S/o"]
RELATIONS_FEMALE = ["D/o", "W/o"]

LOCALITIES = [
    "Civil Lines", "Model Town", "Green Park", "Gandhi Nagar", "Sector 14",
    "Malviya Nagar", "Rajouri Garden", "Tilak Nagar", "Indira Nagar", "Ashok Vihar",
    "Defence Colony", "Lajpat Nagar", "Saket", "Vasant Kunj", "Preet Vihar",
    "Shastri Nagar", "Kamla Nagar", "Pitampura", "Janakpuri", "Rohini"
]

CITIES = ["New Delhi", "Noida", "Gurugram", "Faridabad", "Ghaziabad", "Jaipur", "Chandigarh", "Ludhiana"]

# Realistic test result parameters pool
RESULT_RANGES = {
    "Haemoglobin (Hb)": (11.5, 17.5, "g/dL"),
    "Total RBC Count": (3.8, 5.8, "million/µL"),
    "Total Leukocyte Count (WBC)": (4200, 10800, "cells/µL"),
    "Platelet Count": (1.6, 4.2, "lakhs/µL"),
    "Packed Cell Volume (PCV)": (36, 48, "%"),
    "Mean Corpuscular Volume (MCV)": (82, 98, "fL"),
    "Total Cholesterol": (140, 230, "mg/dL"),
    "HDL Cholesterol": (38, 65, "mg/dL"),
    "LDL Cholesterol": (80, 140, "mg/dL"),
    "Triglycerides": (90, 180, "mg/dL"),
    "Blood Urea": (16, 42, "mg/dL"),
    "Serum Creatinine": (0.7, 1.3, "mg/dL"),
    "Serum Uric Acid": (3.2, 6.8, "mg/dL"),
    "Fasting Plasma Glucose": (74, 115, "mg/dL"),
    "Total Bilirubin": (0.4, 1.2, "mg/dL"),
    "SGPT / ALT": (15, 45, "U/L"),
    "SGOT / AST": (14, 40, "U/L"),
    "Thyroid Stimulating Hormone (TSH)": (0.5, 4.2, "µIU/mL"),
    "C-Reactive Protein (CRP)": (0.5, 5.5, "mg/L"),
}

def generate_random_patient(index):
    is_male = random.random() < 0.52
    gender = "Male" if is_male else "Female"
    title = "Mr." if is_male else random.choice(["Mrs.", "Ms."])
    first_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
    last_name = random.choice(LAST_NAMES)
    full_name = f"{first_name} {last_name}"
    
    age = random.randint(14, 78)
    phone = f"98{random.randint(10000000, 99999999)}"
    
    # 70% have email, 90% have address
    email = f"{first_name.lower()}.{last_name.lower()}{random.randint(10, 99)}@gmail.com" if random.random() < 0.70 else None
    address = f"{random.randint(10, 850)}, {random.choice(LOCALITIES)}, {random.choice(CITIES)}"
    
    # Guardian / Relation (S/o, D/o, W/o)
    relation = random.choice(RELATIONS_MALE if is_male else RELATIONS_FEMALE)
    guardian_first = random.choice(FIRST_NAMES_MALE)
    relation_name = f"{guardian_first} {last_name}"
    
    sample_collected = random.random() < 0.85 # 85% verified sample
    
    return {
        "honorific_title": title,
        "patient_name": full_name,
        "patient_age": age,
        "patient_age_type": "Years",
        "patient_gender": gender,
        "patient_phone": phone,
        "patient_email": email,
        "patient_address": address,
        "machine_id": None,
        "patient_relation": relation,
        "patient_relation_name": relation_name,
        "sample_collected": 1 if sample_collected else 0,
    }

def main():
    parser = argparse.ArgumentParser(description="Seed bulk patient records into LIMS.")
    parser.add_argument("--count", type=int, default=200, help="Number of patients to generate (default: 200)")
    args = parser.parse_args()

    count = args.count
    print("=" * 68)
    print(f"       LIMS Bulk Patient Generator ({count} Patients)")
    print("=" * 68)

    conn = open_database()
    is_pg = isinstance(conn, PostgresConnectionWrapper)
    print(f"[*] Connected Database: {'PostgreSQL (Cloud Neon)' if is_pg else 'SQLite (Local)'}")

    # Fetch available head tests
    available_tests = conn.execute(
        """
        SELECT ht.head_test_id, ht.ht_code, ht.ht_name, ht.ht_amount
        FROM head_tests ht
        JOIN status s ON s.status_id = ht.ht_status
        WHERE lower(s.status) = 'active'
        ORDER BY ht.head_test_id
        """
    ).fetchall()

    if not available_tests:
        print("[ERROR] No active head tests found in catalog! Please seed catalog first.")
        conn.close()
        sys.exit(1)

    print(f"[*] Found {len(available_tests)} active test packages in catalog.")
    print(f"[*] Generating {count} realistic clinical records...")

    now = datetime.now(timezone.utc)
    created_count = 0
    first_pid = None
    last_pid = None
    first_rno = None
    last_rno = None

    for i in range(count):
        # 1. Distribute creation timestamps over the past 30 days
        days_ago = random.expovariate(0.12) # higher probability of recent records
        days_ago = min(days_ago, 28.0)
        record_time = now - timedelta(days=days_ago, minutes=random.randint(0, 1440))
        record_iso = record_time.strftime("%Y-%m-%d %H:%M:%S")

        # 2. Insert Patient
        p_data = generate_random_patient(i)
        payload = validate_patient_payload(p_data)
        
        # Override creation time for backdating
        cur = conn.execute(
            """
            INSERT INTO patients (
                patient_id, honorific_title, patient_name, patient_age,
                patient_age_type, patient_gender, patient_phone, patient_email,
                patient_address, machine_id, patient_relation, patient_relation_name,
                sample_collected, is_active, patient_created_at
            ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """,
            (
                payload["honorific_title"], payload["patient_name"], payload["patient_age"],
                payload["patient_age_type"], payload["patient_gender"], payload["patient_phone"],
                payload["patient_email"], payload["patient_address"], payload["machine_id"],
                payload["patient_relation"], payload["patient_relation_name"],
                payload["sample_collected"], record_iso,
            ),
        )
        pid_num = cur.lastrowid
        patient_code = f"P{pid_num}"
        conn.execute("UPDATE patients SET patient_id = ? WHERE id = ?", (patient_code, pid_num))
        
        if not first_pid:
            first_pid = patient_code
        last_pid = patient_code

        # Fetch fresh patient row
        patient_row = conn.execute("SELECT * FROM patients WHERE id = ?", (pid_num,)).fetchone()

        # 3. Select 1 to 3 random tests
        num_tests = random.choices([1, 2, 3], weights=[0.45, 0.40, 0.15])[0]
        selected_tests = random.sample(available_tests, min(num_tests, len(available_tests)))
        test_ids = [t["head_test_id"] for t in selected_tests]

        # Calculate billing
        subtotal = sum(float(t["ht_amount"] or 0) for t in selected_tests)
        discount = 50.0 if (subtotal >= 800 and random.random() < 0.3) else 0.0
        net = subtotal - discount

        # Payment distribution: 70% Paid in Full, 20% Partial, 10% Due
        pay_roll = random.random()
        if pay_roll < 0.70:
            payment_status = "Paid"
            paid_amount = net
            due_amount = 0.0
        elif pay_roll < 0.90:
            payment_status = "Partial"
            paid_amount = round(net * random.choice([0.4, 0.5, 0.6]), -1)
            due_amount = net - paid_amount
        else:
            payment_status = "Due"
            paid_amount = 0.0
            due_amount = net

        payment_mode = random.choices(["Cash", "Credit", "Card"], weights=[0.60, 0.25, 0.15])[0]

        # Create Order
        order = create_order_for_patient(
            conn,
            patient_row,
            test_ids=test_ids,
            raw_discount=discount,
            sample_collected=bool(payload["sample_collected"]),
            payment_mode=payment_mode,
            payment_status=payment_status,
            paid_amount=paid_amount,
        )

        order_id = order["id"]
        order_no = order["order_no"]
        if not first_rno:
            first_rno = order_no
        last_rno = order_no

        # Backdate the order timestamp to match patient
        conn.execute("UPDATE lab_orders SET created_at = ? WHERE id = ?", (record_iso, order_id))

        # 4. Fill diagnostic results for ~75% of patients
        should_verify = random.random() < 0.75 and payload["sample_collected"]
        if should_verify:
            # Update all subtests with realistic values
            subtest_rows = conn.execute(
                """
                SELECT st.id, st.name_snapshot, st.unit_snapshot
                FROM lab_order_subtests st
                JOIN lab_order_items oi ON oi.id = st.order_item_id
                WHERE oi.order_id = ?
                """,
                (order_id,),
            ).fetchall()

            for st_row in subtest_rows:
                param_name = st_row["name_snapshot"]
                if param_name in RESULT_RANGES:
                    min_val, max_val, _ = RESULT_RANGES[param_name]
                    # Generate normal with occasional mild deviation
                    val = round(random.uniform(min_val, max_val), 1)
                    if random.random() < 0.10: # 10% slightly abnormal
                        val = round(max_val * random.uniform(1.05, 1.25), 1)
                    val_str = f"{int(val)}" if val > 100 else f"{val:.1f}"
                else:
                    val_str = "Normal" if "Examination" in param_name or "Color" in param_name else f"{random.randint(12, 85)}"

                conn.execute(
                    """
                    UPDATE lab_order_subtests
                    SET result_value = ?, result_status = 'Verified', updated_at = ?
                    WHERE id = ?
                    """,
                    (val_str, record_iso, st_row["id"]),
                )

            # Mark order as verified
            verified_at = (record_time + timedelta(hours=random.randint(2, 6))).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute(
                """
                UPDATE lab_orders
                SET order_status = 'Verified', verified_by = 'Dr. S. Sharma, MD (Path)', verified_at = ?
                WHERE id = ?
                """,
                (verified_at, order_id),
            )

        created_count += 1
        if created_count % 50 == 0:
            conn.commit()
            print(f"  -> Generated {created_count}/{count} patients...")

    conn.commit()
    conn.close()

    print("\n" + "=" * 68)
    print(f"[SUCCESS] Successfully created {created_count} patients with lab orders!")
    print(f"[*] Patient accession range : {first_pid}  -->  {last_pid}")
    print(f"[*] Receipt numbers range   : {first_rno}  -->  {last_rno}")
    print("=" * 68)

if __name__ == "__main__":
    main()
