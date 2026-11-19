import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from database import get_db

app = create_app()
client = app.test_client()

def test_reference_range_propagation_and_editing():
    with app.app_context():
        db = get_db()
        # Find CBC test
        ht = db.execute("SELECT * FROM head_tests WHERE ht_code = 'CBC'").fetchone()
        assert ht is not None
        test_id = ht["head_test_id"]

        # Fetch test details via API
        res = client.get(f"/api/tests/{test_id}")
        assert res.status_code == 200
        test_data = res.get_json()

        # Update Haemoglobin reference range
        for st in test_data["sub_tests"]:
            if "Haemoglobin" in st["st_name"]:
                st["st_ref_ranges"] = "Male: 13.5 - 17.5, Female: 12.5 - 16.0"

        put_res = client.put(f"/api/tests/{test_id}", json=test_data)
        assert put_res.status_code == 200

        # Verify that existing orders have updated reference range
        orders = client.get("/api/diagnosis/orders").get_json()
        cbc_found = False
        for o in orders:
            for item in o.get("items", []):
                if item["ht_code"] == "CBC":
                    for st in item.get("sub_tests", []):
                        if "Haemoglobin" in st["st_name"]:
                            assert st["st_ref_ranges"] == "Male: 13.5 - 17.5, Female: 12.5 - 16.0"
                            cbc_found = True
        assert cbc_found

        # Test sync endpoint
        test_order_id = orders[0]["id"]
        sync_res = client.post(f"/api/diagnosis/orders/{test_order_id}/sync-catalogue")
        assert sync_res.status_code == 200

        # Test per-order custom reference range override
        subtest_id = None
        for item in orders[0].get("items", []):
            if item.get("sub_tests"):
                subtest_id = item["sub_tests"][0]["id"]
                break

        if subtest_id:
            save_res = client.put(
                f"/api/diagnosis/orders/{test_order_id}/results",
                json={
                    "sub_tests": [
                        {
                            "id": subtest_id,
                            "result_value": "15.0",
                            "st_ref_ranges": "Custom: 10.0 - 20.0",
                        }
                    ]
                },
            )
            assert save_res.status_code == 200
            updated_order = client.get(f"/api/diagnosis/orders/{test_order_id}").get_json()
            first_st = updated_order["items"][0]["sub_tests"][0]
            assert first_st["st_ref_ranges"] == "Custom: 10.0 - 20.0"

        print("Reference range propagation test passed successfully!")
