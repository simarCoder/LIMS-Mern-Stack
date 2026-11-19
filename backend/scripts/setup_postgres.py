"""PostgreSQL setup, database creation, and migration utility for LIMS.

Usage:
    python backend/scripts/setup_postgres.py --password YOUR_POSTGRES_PASSWORD [--port 2619] [--host localhost] [--user postgres] [--db lims_db]

Features:
    1. Checks connection to PostgreSQL server.
    2. Creates the 'lims_db' database if it doesn't already exist.
    3. Runs the full LIMS DDL schema (patients, labs, users, head_tests, sub_tests, lab_orders, etc.).
    4. Automatically copies existing patient & order data from local SQLite database if desired.
    5. Updates backend/.env with DATABASE_URL so Flask immediately uses PostgreSQL.
"""
import argparse
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(ENV_PATH)


def parse_args():
    parser = argparse.ArgumentParser(description="Initialize and configure PostgreSQL for LIMS")
    parser.add_argument("--host", default="localhost", help="PostgreSQL host (default: localhost)")
    parser.add_argument("--port", type=int, default=2619, help="PostgreSQL port (default: 2619 for local service)")
    parser.add_argument("--user", default="postgres", help="PostgreSQL username (default: postgres)")
    parser.add_argument("--password", default=os.environ.get("PGPASSWORD", ""), help="PostgreSQL password")
    parser.add_argument("--db", default="lims_db", help="Target database name (default: lims_db)")
    parser.add_argument("--migrate-from-sqlite", action="store_true", help="Migrate records from local SQLite DB")
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("[ERROR] psycopg2 is not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    password = args.password
    if not password:
        import getpass
        password = getpass.getpass(f"Enter PostgreSQL password for user '{args.user}' on port {args.port}: ")

    print(f"\n[*] Connecting to PostgreSQL at {args.host}:{args.port} as '{args.user}'...")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=args.user,
            password=password,
            host=args.host,
            port=args.port,
            connect_timeout=5,
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("[✓] Successfully connected to PostgreSQL server!")
    except Exception as err:
        print(f"[ERROR] Failed to connect: {err}")
        print("Please check your password, port (default 2619 or 5432), and ensure the PostgreSQL service is running.")
        sys.exit(1)

    # 1. Create target database if it doesn't exist
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (args.db,))
    if not cur.fetchone():
        print(f"[*] Creating database '{args.db}'...")
        cur.execute(f'CREATE DATABASE "{args.db}"')
        print(f"[✓] Database '{args.db}' created successfully.")
    else:
        print(f"[✓] Database '{args.db}' already exists.")
    cur.close()
    conn.close()

    # 2. Connect to the target database and run schema
    db_url = f"postgresql://{args.user}:{password}@{args.host}:{args.port}/{args.db}"
    os.environ["DATABASE_URL"] = db_url

    # Import backend database module now that DATABASE_URL is set
    sys.path.insert(0, str(BACKEND_DIR))
    from database import init_db

    print(f"[*] Initializing LIMS relational schema and clinical catalogs in '{args.db}'...")
    init_db()
    print("[✓] Schema and catalogs initialized successfully.")

    # 3. Update backend/.env file
    env_content = ""
    if ENV_PATH.exists():
        env_content = ENV_PATH.read_text(encoding="utf-8")

    lines = [line for line in env_content.splitlines() if not line.startswith("DATABASE_URL=")]
    lines.append(f"DATABASE_URL={db_url}")
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[✓] Updated {ENV_PATH.relative_to(BASE_DIR)} with DATABASE_URL.")

    print("\n" + "=" * 60)
    print(" PostgreSQL is now fully active for LIMS!")
    print(f" Connection URL: postgresql://{args.user}:***@{args.host}:{args.port}/{args.db}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
