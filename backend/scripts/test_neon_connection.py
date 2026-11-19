"""Utility script to verify connection to Neon PostgreSQL and initialize tables.
Run: python backend/scripts/test_neon_connection.py
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure project root is on Python path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
load_dotenv(ROOT_DIR / ".env")

import database

def main():
    db_url = os.environ.get("DATABASE_URL", "").strip().strip('"').strip("'")
    print("=" * 65)
    print("      LIMS Neon PostgreSQL Connection & Schema Initializer")
    print("=" * 65)
    
    if not db_url:
        print("\n[ERROR] DATABASE_URL is not set in your .env file!")
        print("Please add your Neon connection string to .env, like:")
        print("DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require\n")
        sys.exit(1)
        
    print(f"\n[*] Target Database URL: {db_url.split('@')[-1] if '@' in db_url else 'configured'}")
    print("[*] Testing direct connection to Neon PostgreSQL...")
    
    try:
        import psycopg2
        conn = psycopg2.connect(db_url, connect_timeout=10)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        ver = cur.fetchone()[0]
        print(f"\n[SUCCESS] Connected to Neon PostgreSQL!")
        print(f"[*] Engine: {ver.split(' on ')[0]}")
        cur.close()
        conn.close()
    except Exception as err:
        print(f"\n[FAIL] Could not connect to Neon: {err}")
        sys.exit(1)
        
    print("\n[*] Initializing LIMS tables and standard clinical catalog...")
    try:
        database.init_db()
        print("[SUCCESS] All tables created and initialized:")
        print("  - patients")
        print("  - lab_orders")
        print("  - lab_order_items")
        print("  - lab_order_subtests")
        print("  - head_tests (CBC, LIPID, LFT, KFT, TFT, FBS, URINE_RE, CRP)")
        print("  - users (developer, admin, staff)")
        print("\n[READY] Your LIMS is now fully running on Neon PostgreSQL!")
        print("=" * 65)
    except Exception as err:
        print(f"\n[FAIL] Error during table initialization: {err}")
        sys.exit(1)

if __name__ == "__main__":
    main()
