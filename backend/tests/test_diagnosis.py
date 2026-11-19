import sys
from pathlib import Path

# Add backend to PYTHONPATH
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from database import get_db

app = create_app()
client = app.test_client()

def test_diagnosis_flow():
    print("\n" + "=" * 55)
    print("RUNNING DIAGNOSIS MODULE INTEGRATION & SYSTEM TEST")
    print("=" * 55)

    # 1. Fetch diagnosis orders queue
    res = client.get("/api/diagnosis/orders")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    orders = res.get_json()
    assert isinstance(orders, list), "Expected list of orders"
    print(f"[1] Diagnosis orders queue returned {len(orders)} orders.")

    if not orders:
        print("[!] No orders to test against. Exiting.")
        return

    test_order = None
    for o in orders:
        if o.get("items") and any(item.get("sub_tests") for item in o["items"]):
            test_order = o
            break

    if not test_order:
        test_order = orders[0]

    order_id = test_order["id"]
    print(f"[2] Testing with Order ID: {order_id} ({test_order.get('order_no')})")

    # 2. Get specific diagnostic order
    res = client.get(f"/api/diagnosis/orders/{order_id}")
    assert res.status_code == 200
    single_order = res.get_json()
    assert single_order["id"] == order_id
    print(f"    Fetched details for Patient: {single_order.get('patient', {}).get('patient_name')}")

    # 3. Batch save sub-test results
    subtests_to_update = []
    for it in single_order.get("items", []):
        for st in it.get("sub_tests", []):
            subtests_to_update.append({
                "id": st["id"],
                "result_value": "14.2",
                "result_notes": "Clinically evaluated",
                "result_status": "Entered",
            })

    if subtests_to_update:
        save_res = client.put(
            f"/api/diagnosis/orders/{order_id}/results",
            json={
                "sub_tests": subtests_to_update,
                "doctor_remarks": "No abnormal cell morphology seen. Adequate cellularity.",
            },
        )
        assert save_res.status_code == 200
        saved_data = save_res.get_json()
        assert "Diagnostic results saved" in saved_data["message"]
        assert saved_data["order"]["order_status"] in {"In Progress", "Verified"}
        print(f"[3] Batch saved {len(subtests_to_update)} sub-test results. Status: {saved_data['order']['order_status']}")

        # 4. Verify and sign diagnostic order
        verify_res = client.post(f"/api/diagnosis/orders/{order_id}/verify")
        assert verify_res.status_code == 200
        verified_data = verify_res.get_json()
        assert verified_data["order"]["order_status"] == "Verified"
        assert verified_data["order"]["verified_at"] is not None
        print(f"[4] Verified order #{order_id}. Verifier: {verified_data['order'].get('verified_by')} at {verified_data['order'].get('verified_at')}")

    print("\n" + "=" * 55)
    print("ALL DIAGNOSIS INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 55)

if __name__ == "__main__":
    test_diagnosis_flow()
