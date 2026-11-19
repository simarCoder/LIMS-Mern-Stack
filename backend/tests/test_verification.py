"""
Automated verification test for LIMS patient registration, sample verification, and receipt creation.
"""
import sys
import os
from pathlib import Path

# Set up paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from database import open_database, init_db

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        init_db()

    print("[1] Testing Registration with Sample Collected = True + Head Tests Order...")
    payload_with_tests = {
        "patient": {
            "honorific_title": "Mr.",
            "patient_name": "Rajesh Verma",
            "patient_age": 42,
            "patient_age_type": "Years",
            "patient_gender": "Male",
            "patient_phone": "9876543210",
            "patient_email": "rajesh@example.com",
            "patient_address": "Indiranagar, Bangalore",
            "patient_relation": "S/o",
            "patient_relation_name": "R. K. Verma",
            "machine_id": "M1",
            "sample_collected": True
        },
        "head_test_ids": [1, 2],
        "discount": 50,
        "sample_collected": True
    }

    res = client.post("/api/registrations", json=payload_with_tests)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
    data = res.get_json()
    assert "patient" in data, "Missing patient in response"
    assert "order" in data, "Missing order in response"
    
    pat = data["patient"]
    order = data["order"]
    
    # Verify Patient ID format (P1, P2... no PT- or leading zeros)
    assert pat["patientId"].startswith("P") and pat["patientId"][1:].isdigit(), f"Invalid patientId: {pat['patientId']}"
    assert not pat["patientId"].startswith("P0"), f"PatientId has leading zero: {pat['patientId']}"
    print(f"    Patient ID: {pat['patientId']} (Format valid: P + integer)")
    
    # Verify Sample Collected is True
    assert pat["sample_collected"] is True or pat["sample_collected"] == 1, "Patient sample_collected not true"
    assert order["sample_collected"] is True or order["sample_collected"] == 1, "Order sample_collected not true"
    print("    sample_collected verified as True on both patient and order.")

    # Verify Order items & totals
    assert len(order["items"]) == 2, f"Expected 2 items, got {len(order['items'])}"
    assert order["discount"] == 50.0, f"Expected discount 50, got {order['discount']}"
    assert order["patient"]["patient_name"] == "Rajesh Verma", "Patient details not snapshot on order"
    assert order["patient"]["patient_phone"] == "9876543210", "Patient phone missing from order"
    print(f"    Order No: {order['order_no']}, Total: {order['total']}, Subtotal: {order['subtotal']}")

    print("\n[2] Testing Registration with Sample Collected = False (Demographic Only)...")
    payload_demographic = {
        "honorific_title": "Mrs.",
        "patient_name": "Sunita Sharma",
        "patient_age": 35,
        "patient_age_type": "Years",
        "patient_gender": "Female",
        "patient_phone": "9812345678",
        "patient_email": "sunita@example.com",
        "patient_address": "Koramangala, Bangalore",
        "patient_relation": "W/o",
        "patient_relation_name": "Ramesh Sharma",
        "machine_id": "M2",
        "sample_collected": False
    }

    res2 = client.post("/api/patients", json=payload_demographic)
    assert res2.status_code == 201, f"Expected 201, got {res2.status_code}: {res2.get_json()}"
    pat2 = res2.get_json()["patient"]
    assert pat2["patientId"].startswith("P") and pat2["patientId"][1:].isdigit(), f"Invalid patientId: {pat2['patientId']}"
    assert pat2["sample_collected"] is False or pat2["sample_collected"] == 0, "Demographic sample_collected should be false"
    print(f"    Demographic Patient ID: {pat2['patientId']}")
    print("    sample_collected verified as False.")

    print("\n[3] Testing Test Catalog Retrieval...")
    res3 = client.get("/api/tests")
    assert res3.status_code == 200, f"Expected 200, got {res3.status_code}"
    catalog = res3.get_json()
    assert len(catalog) > 0, "Test catalog is empty"
    print(f"    Fetched {len(catalog)} head tests from catalog.")

    print("\n[4] Testing Receipt Retrieval for Saved Patients...")
    # 4a. Patient with order
    res_receipt1 = client.get(f"/api/patients/{pat['id']}/receipt")
    assert res_receipt1.status_code == 200, f"Expected 200, got {res_receipt1.status_code}"
    receipt_data1 = res_receipt1.get_json()["receipt"]
    assert receipt_data1["order_no"].startswith("R"), f"Unexpected order_no: {receipt_data1['order_no']}"
    assert len(receipt_data1["items"]) == 2, "Items missing from restored receipt"
    print(f"    Restored Order Receipt: {receipt_data1['order_no']} for Patient {pat['patientId']}")

    # 4b. Patient without order (demographic slip)
    res_receipt2 = client.get(f"/api/patients/{pat2['id']}/receipt")
    assert res_receipt2.status_code == 200, f"Expected 200, got {res_receipt2.status_code}"
    receipt_data2 = res_receipt2.get_json()["receipt"]
    assert receipt_data2["order_no"] == pat2["patientId"], f"Unexpected demo order_no: {receipt_data2['order_no']}"
    assert receipt_data2["items"] == [], "Demographic slip should have empty items"
    print(f"    Generated Admission Slip: {receipt_data2['order_no']} for Patient {pat2['patientId']}")

    # 4c. Listing all orders
    res_orders = client.get("/api/orders")
    assert res_orders.status_code == 200, f"Expected 200, got {res_orders.status_code}"
    orders_list = res_orders.get_json()
    assert len(orders_list) > 0, "Orders list is empty"
    print(f"    Total Orders in Database: {len(orders_list)}")

    print("\nAll verification checks passed successfully!")

if __name__ == "__main__":
    run_tests()
