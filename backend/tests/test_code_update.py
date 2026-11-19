import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import app

client = app.test_client()
client.post("/api/auth/login", json={"lab_code": "LAB01", "username": "admin", "password": "admin123"})
tests = client.get("/api/tests").get_json()
t1 = tests[0]
tid = t1["head_test_id"]
old_code = t1["ht_code"]
print(f"Original Code: {old_code} (ID: {tid})")

# Test updating code to CBC_EDITED
res = client.put(f"/api/tests/{tid}", json={**t1, "ht_code": "CBC_EDITED"})
assert res.status_code == 200, res.get_json()
new_code = res.get_json()["test"]["ht_code"]
print(f"Updated Code: {new_code}")
assert new_code == "CBC_EDITED"

# Revert back
res_rev = client.put(f"/api/tests/{tid}", json={**t1, "ht_code": old_code})
assert res_rev.status_code == 200
print(f"Reverted Code: {res_rev.get_json()['test']['ht_code']}")
print("Head code update test passed successfully!")
