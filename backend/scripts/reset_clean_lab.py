"""Database Reset Utility for Labora+ LIMS.
Clears all patient records, orders, items, and diagnostic test results.
Resets accession sequences so the next patient starts fresh at P1 and receipt R1.
Preserves test catalog, system users, and lab profiles.

Usage:
    python backend/scripts/reset_clean_lab.py [--force]
"""
import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
load_dotenv(ROOT_DIR / ".env")

from database import open_database, PostgresConnectionWrapper

def main():
    parser = argparse.ArgumentParser(description="Clean/wipe patient data for fresh lab setup.")
    parser.add_argument("--force", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()

    print("=" * 68)
    print("      Labora+ LIMS - Database Reset & Sequence Cleanup")
    print("=" * 68)

    conn = open_database()
    is_pg = isinstance(conn, PostgresConnectionWrapper)
    target_name = "Neon Cloud PostgreSQL" if is_pg else "Local SQLite"
    print(f"[*] Target Database: {target_name}")
    print("\n[WARNING] This operation will PERMANENTLY delete:")
    print("  - All patients")
    print("  - All lab orders and billing records")
    print("  - All diagnostic test results")
    print("  - Reset P1 and R1 sequence counters")
    print("\n[PRESERVED] The following will NOT be deleted:")
    print("  + Head Tests & Sub-tests (Clinical Catalog)")
    print("  + Lab Configuration (LAB01)")
    print("  + Staff & Admin Accounts (developer, admin, staff)")

    if not args.force:
        print("\n" + "-" * 68)
        confirm = input("Type 'RESET' to confirm deletion (or press Enter to cancel): ").strip()
        if confirm != "RESET":
            print("\n[CANCELLED] Operation aborted. No records were modified.")
            conn.close()
            sys.exit(0)

    print("\n[*] Resetting database tables...")

    try:
        # Delete dependent order subtests first
        conn.execute("DELETE FROM lab_order_subtests")
        conn.execute("DELETE FROM lab_order_items")
        conn.execute("DELETE FROM lab_orders")
        conn.execute("DELETE FROM patients")

        # Reset primary key sequences so numbering starts cleanly at 1
        if is_pg:
            # PostgreSQL sequence resets
            sequences = [
                "patients_id_seq",
                "lab_orders_id_seq",
                "lab_order_items_id_seq",
                "lab_order_subtests_id_seq"
            ]
            for seq in sequences:
                try:
                    conn.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")
                except Exception as seq_err:
                    print(f"  Note on sequence {seq}: {seq_err}")
        else:
            # SQLite auto-increment table cleanup
            conn.execute(
                """
                DELETE FROM sqlite_sequence 
                WHERE name IN ('patients', 'lab_orders', 'lab_order_items', 'lab_order_subtests')
                """
            )

        conn.commit()

        # Count verification
        p_count = conn.execute("SELECT COUNT(*) AS c FROM patients").fetchone()["c"]
        o_count = conn.execute("SELECT COUNT(*) AS c FROM lab_orders").fetchone()["c"]
        t_count = conn.execute("SELECT COUNT(*) AS c FROM head_tests").fetchone()["c"]
        u_count = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]

        print("\n" + "=" * 68)
        print("[SUCCESS] Database successfully reset!")
        print(f"  -> Patients remaining    : {p_count}")
        print(f"  -> Orders remaining      : {o_count}")
        print(f"  -> Test Catalog intact   : {t_count} tests preserved")
        print(f"  -> User Accounts intact  : {u_count} users preserved")
        print("\n[READY] The next patient you register will be P1 with Receipt R1.")
        print("=" * 68)

    except Exception as err:
        print(f"\n[ERROR] Reset failed: {err}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
