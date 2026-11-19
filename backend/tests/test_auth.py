"""
Test suite verifying the authentication, session cookie management, and user roles.
"""
import sys
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app import app
from database import open_database


def test_auth_system():
    print("\n=======================================================")
    print("RUNNING AUTHENTICATION & ROLE VERIFICATION SUITE")
    print("=======================================================\n")

    client = app.test_client()

    # 1. Test Status
    print("[1] Testing /api/auth/status...")
    res = client.get("/api/auth/status")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    status_data = res.get_json()
    assert "labs" in status_data, "Labs missing from status"
    assert len(status_data["labs"]) > 0, "No labs seeded"
    print(f"    Available Labs: {status_data['labs']}")

    # 2. Test Lab Lookup & Autofill
    print("\n[2] Testing Lab Code lookup for autofill (/api/auth/lab/LAB01)...")
    res = client.get("/api/auth/lab/LAB01")
    assert res.status_code == 200
    lab_data = res.get_json()
    assert lab_data["lab_code"] == "LAB01"
    assert lab_data["lab_name"] == "Labora+ Pathology & Diagnostics"
    print(f"    Autofilled Lab Name: {lab_data['lab_name']}")

    # Invalid lab code
    res_bad = client.get("/api/auth/lab/NONEXISTENT")
    assert res_bad.status_code == 404

    # 3. Test Invalid Login
    print("\n[3] Testing Invalid Credentials...")
    res = client.post("/api/auth/login", json={
        "lab_code": "LAB01",
        "username": "developer",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    print("    Invalid password rejected as expected.")

    # 4. Test Developer Login & Role Badge
    print("\n[4] Testing Developer Login (developer / dev123)...")
    res = client.post("/api/auth/login", json={
        "lab_code": "LAB01",
        "username": "developer",
        "password": "dev123"
    })
    assert res.status_code == 200
    dev_user = res.get_json()["user"]
    assert dev_user["role"] == "developer"
    assert dev_user["display_name"] == "Lead Developer"
    print(f"    Logged in as: {dev_user['username']} | Role: {dev_user['role']} | Badge: Lead Developer")

    # Verify session preservation via /api/auth/me
    res_me = client.get("/api/auth/me")
    assert res_me.status_code == 200
    assert res_me.get_json()["user"]["username"] == "developer"
    print("    Session cookie preserved for subsequent requests.")

    # 5. Test Admin Login
    print("\n[5] Testing Admin Login (admin / admin123)...")
    client.post("/api/auth/logout")
    res_admin = client.post("/api/auth/login", json={
        "lab_code": "LAB01",
        "username": "admin",
        "password": "admin123"
    })
    assert res_admin.status_code == 200
    admin_user = res_admin.get_json()["user"]
    assert admin_user["role"] == "admin"
    print(f"    Logged in as: {admin_user['username']} | Role: {admin_user['role']}")

    # 6. Test Staff/User Login
    print("\n[6] Testing Staff (User) Login (staff / staff123)...")
    client.post("/api/auth/logout")
    res_staff = client.post("/api/auth/login", json={
        "lab_code": "LAB01",
        "username": "staff",
        "password": "staff123"
    })
    assert res_staff.status_code == 200
    staff_user = res_staff.get_json()["user"]
    assert staff_user["role"] == "user"
    print(f"    Logged in as: {staff_user['username']} | Role: {staff_user['role']}")

    # 7. Test Logout
    print("\n[7] Testing Logout...")
    res_logout = client.post("/api/auth/logout")
    assert res_logout.status_code == 200
    res_after = client.get("/api/auth/me")
    assert res_after.status_code == 401
    print("    Session successfully cleared after logout.")

    print("\n=======================================================")
    print("ALL AUTH & ROLE TESTS PASSED SUCCESSFULLY!")
    print("=======================================================\n")


if __name__ == "__main__":
    test_auth_system()
