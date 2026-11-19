"""Database abstraction layer supporting PostgreSQL (primary/production) and SQLite (fallback).
Maintains identical table schemas, column names, constraints, and dictionary-like row
access across both database engines.
"""
from pathlib import Path
import os
import re
import sqlite3
from flask import g
from dotenv import load_dotenv

# Load local environment variables (.env)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
_env_db_path = os.environ.get("LIMS_DB_PATH", "").strip().strip('"').strip("'")
SQLITE_PATH = Path(_env_db_path).resolve() if _env_db_path else (BASE_DIR / "db" / "lims_local.db")
DATABASE_PATH = SQLITE_PATH

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip().strip('"').strip("'")

# Primary key mapping for PostgreSQL automatic RETURNING clauses
TABLE_PK_MAP = {
    "patients": "id",
    "labs": "lab_id",
    "users": "user_id",
    "status": "status_id",
    "head_tests": "head_test_id",
    "sub_tests": "sub_test_id",
    "lab_orders": "id",
    "lab_order_items": "id",
    "lab_order_subtests": "id",
}

# -----------------------------------------------------------------------------
# SQLITE DDL SCHEMA
# -----------------------------------------------------------------------------
SQLITE_SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT UNIQUE,
    honorific_title TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_age INTEGER NOT NULL,
    patient_age_type TEXT NOT NULL DEFAULT 'Years',
    patient_gender TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,
    patient_address TEXT,
    machine_id TEXT,
    patient_relation TEXT,
    patient_relation_name TEXT,
    sample_collected INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    patient_created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS labs (
    lab_id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_code TEXT NOT NULL UNIQUE,
    lab_name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER NOT NULL REFERENCES labs(lab_id),
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('developer', 'admin', 'user')),
    display_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    UNIQUE(lab_id, username)
);

CREATE TABLE IF NOT EXISTS status (
    status_id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS head_tests (
    head_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ht_code TEXT NOT NULL UNIQUE,
    ht_name TEXT NOT NULL,
    ht_heading TEXT,
    ht_status INTEGER NOT NULL,
    ht_amount INTEGER NOT NULL DEFAULT 0,
    ht_type TEXT,
    ht_ref_ranges TEXT,
    ht_interpretation TEXT,
    FOREIGN KEY (ht_status) REFERENCES status(status_id)
);

CREATE TABLE IF NOT EXISTS sub_tests (
    sub_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ht_code TEXT NOT NULL,
    st_name TEXT NOT NULL,
    st_method TEXT,
    st_print_seq INTEGER NOT NULL DEFAULT 1,
    st_default_value TEXT,
    st_ref_ranges TEXT,
    st_type TEXT,
    st_unit TEXT,
    st_interpretation TEXT,
    FOREIGN KEY (ht_code) REFERENCES head_tests(ht_code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lab_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE,
    patient_record_id INTEGER NOT NULL,
    patient_code_snapshot TEXT,
    patient_name_snapshot TEXT NOT NULL,
    patient_age_snapshot TEXT,
    patient_gender_snapshot TEXT,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL,
    sample_collected INTEGER NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    due_amount NUMERIC NOT NULL DEFAULT 0,
    payment_mode TEXT NOT NULL DEFAULT 'Cash',
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    doctor_remarks TEXT,
    verified_by TEXT,
    verified_at TEXT,
    order_status TEXT NOT NULL DEFAULT 'Pending',
    specimens_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (patient_record_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS lab_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    head_test_id INTEGER NOT NULL,
    test_code_snapshot TEXT NOT NULL,
    test_name_snapshot TEXT NOT NULL,
    test_heading_snapshot TEXT,
    unit_price NUMERIC NOT NULL,
    FOREIGN KEY (order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (head_test_id) REFERENCES head_tests(head_test_id)
);

CREATE TABLE IF NOT EXISTS lab_order_subtests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    sub_test_id INTEGER,
    name_snapshot TEXT NOT NULL,
    type_snapshot TEXT,
    unit_snapshot TEXT,
    method_snapshot TEXT,
    default_value_snapshot TEXT,
    ref_ranges_snapshot TEXT,
    interpretation_snapshot TEXT,
    print_seq INTEGER NOT NULL DEFAULT 1,
    result_value TEXT,
    result_notes TEXT,
    result_status TEXT NOT NULL DEFAULT 'Pending',
    updated_at TEXT,
    FOREIGN KEY (order_item_id) REFERENCES lab_order_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_record_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON lab_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_subtests_item ON lab_order_subtests(order_item_id);
CREATE INDEX IF NOT EXISTS idx_sub_tests_code ON sub_tests(ht_code);
"""

# -----------------------------------------------------------------------------
# POSTGRESQL DDL SCHEMA (100% Identical Column Names, Types & Constraints)
# -----------------------------------------------------------------------------
POSTGRES_SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(64) UNIQUE,
    honorific_title VARCHAR(32) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER NOT NULL,
    patient_age_type VARCHAR(32) NOT NULL DEFAULT 'Years',
    patient_gender VARCHAR(32) NOT NULL,
    patient_phone VARCHAR(64),
    patient_email VARCHAR(255),
    patient_address TEXT,
    machine_id VARCHAR(128),
    patient_relation VARCHAR(64),
    patient_relation_name VARCHAR(255),
    sample_collected INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    patient_created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS labs (
    lab_id SERIAL PRIMARY KEY,
    lab_code VARCHAR(64) NOT NULL UNIQUE,
    lab_name VARCHAR(255) NOT NULL,
    created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES labs(lab_id),
    username VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK(role IN ('developer', 'admin', 'user')),
    display_name VARCHAR(255),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at VARCHAR(64) NOT NULL,
    CONSTRAINT uq_lab_user UNIQUE(lab_id, username)
);

CREATE TABLE IF NOT EXISTS status (
    status_id SERIAL PRIMARY KEY,
    status VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS head_tests (
    head_test_id SERIAL PRIMARY KEY,
    ht_code VARCHAR(64) NOT NULL UNIQUE,
    ht_name VARCHAR(255) NOT NULL,
    ht_heading VARCHAR(255),
    ht_status INTEGER NOT NULL REFERENCES status(status_id),
    ht_amount INTEGER NOT NULL DEFAULT 0,
    ht_type VARCHAR(64),
    ht_ref_ranges TEXT,
    ht_interpretation TEXT
);

CREATE TABLE IF NOT EXISTS sub_tests (
    sub_test_id SERIAL PRIMARY KEY,
    ht_code VARCHAR(64) NOT NULL REFERENCES head_tests(ht_code) ON DELETE CASCADE,
    st_name VARCHAR(255) NOT NULL,
    st_method VARCHAR(255),
    st_print_seq INTEGER NOT NULL DEFAULT 1,
    st_default_value VARCHAR(255),
    st_ref_ranges TEXT,
    st_type VARCHAR(64),
    st_unit VARCHAR(64),
    st_interpretation TEXT
);

CREATE TABLE IF NOT EXISTS lab_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(64) UNIQUE,
    patient_record_id INTEGER NOT NULL REFERENCES patients(id),
    patient_code_snapshot VARCHAR(64),
    patient_name_snapshot VARCHAR(255) NOT NULL,
    patient_age_snapshot VARCHAR(64),
    patient_gender_snapshot VARCHAR(32),
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    sample_collected INTEGER NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(64) NOT NULL DEFAULT 'Cash',
    payment_status VARCHAR(64) NOT NULL DEFAULT 'Paid',
    doctor_remarks TEXT,
    verified_by VARCHAR(255),
    verified_at VARCHAR(64),
    order_status VARCHAR(64) NOT NULL DEFAULT 'Pending',
    specimens_data TEXT,
    created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    head_test_id INTEGER NOT NULL REFERENCES head_tests(head_test_id),
    test_code_snapshot VARCHAR(64) NOT NULL,
    test_name_snapshot VARCHAR(255) NOT NULL,
    test_heading_snapshot VARCHAR(255),
    unit_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_order_subtests (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES lab_order_items(id) ON DELETE CASCADE,
    sub_test_id INTEGER,
    name_snapshot VARCHAR(255) NOT NULL,
    type_snapshot VARCHAR(64),
    unit_snapshot VARCHAR(64),
    method_snapshot VARCHAR(255),
    default_value_snapshot VARCHAR(255),
    ref_ranges_snapshot TEXT,
    interpretation_snapshot TEXT,
    print_seq INTEGER NOT NULL DEFAULT 1,
    result_value VARCHAR(255),
    result_notes TEXT,
    result_status VARCHAR(64) NOT NULL DEFAULT 'Pending',
    updated_at VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_pg_lab_orders_patient ON lab_orders(patient_record_id);
CREATE INDEX IF NOT EXISTS idx_pg_order_items_order ON lab_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pg_order_subtests_item ON lab_order_subtests(order_item_id);
CREATE INDEX IF NOT EXISTS idx_pg_sub_tests_code ON sub_tests(ht_code);
"""


# -----------------------------------------------------------------------------
# POSTGRESQL CONNECTION & CURSOR WRAPPER
# -----------------------------------------------------------------------------
class PostgresCursorWrapper:
    """Wraps a psycopg2 RealDictCursor to match SQLite's interface seamlessly."""

    def __init__(self, raw_cursor, parent_conn):
        self._cur = raw_cursor
        self._conn = parent_conn
        self.lastrowid = None

    def execute(self, sql, params=None):
        cleaned_sql = sql
        # Translate SQLite '?' parameter placeholders to '%s' for psycopg2
        if "?" in cleaned_sql:
            cleaned_sql = cleaned_sql.replace("?", "%s")

        # Automatically capture generated primary keys on INSERT if not present
        is_insert = bool(re.match(r"^\s*INSERT\s+INTO\s+(\w+)", cleaned_sql, re.IGNORECASE))
        table_name = None
        if is_insert and "RETURNING" not in cleaned_sql.upper():
            m = re.match(r"^\s*INSERT\s+INTO\s+(\w+)", cleaned_sql, re.IGNORECASE)
            if m:
                table_name = m.group(1).lower()
                pk_col = TABLE_PK_MAP.get(table_name, "id")
                cleaned_sql = f"{cleaned_sql} RETURNING {pk_col}"

        if params is not None:
            self._cur.execute(cleaned_sql, params)
        else:
            self._cur.execute(cleaned_sql)

        if is_insert and "RETURNING" in cleaned_sql.upper():
            try:
                row = self._cur.fetchone()
                if row:
                    val = next(iter(row.values()), None)
                    self.lastrowid = val
            except Exception:
                self.lastrowid = None

        return self

    def executemany(self, sql, seq_of_params):
        cleaned_sql = sql.replace("?", "%s")
        self._cur.executemany(cleaned_sql, seq_of_params)
        return self

    def fetchone(self):
        row = self._cur.fetchone()
        return dict(row) if row is not None else None

    def fetchall(self):
        rows = self._cur.fetchall()
        return [dict(r) for r in rows]

    @property
    def rowcount(self):
        return self._cur.rowcount

    def close(self):
        self._cur.close()


class PostgresConnectionWrapper:
    """Wraps a psycopg2 connection providing execute(), commit(), close()."""

    def __init__(self, raw_conn):
        self._conn = raw_conn
        self.is_postgres = True

    def cursor(self):
        import psycopg2.extras
        raw_cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return PostgresCursorWrapper(raw_cur, self)

    def execute(self, sql, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def executemany(self, sql, seq_of_params):
        cur = self.cursor()
        cur.executemany(sql, seq_of_params)
        return cur

    def executescript(self, script):
        with self._conn.cursor() as cur:
            cur.execute(script)
        self.commit()

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


# -----------------------------------------------------------------------------
# DATABASE CONNECTION FACTORY
# -----------------------------------------------------------------------------
def is_postgres_configured():
    """Return True if DATABASE_URL points to PostgreSQL."""
    return bool(DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")))


def open_database():
    """Connect to PostgreSQL if DATABASE_URL is set, otherwise use local SQLite."""
    if is_postgres_configured():
        try:
            import psycopg2
            raw_conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
            return PostgresConnectionWrapper(raw_conn)
        except Exception as err:
            print(f"[LIMS Database] PostgreSQL connection error ({err}). Falling back to SQLite WAL mode.")

    # SQLite Fallback Connection
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(SQLITE_PATH), timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 15000")
    try:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = NORMAL")
    except sqlite3.Error:
        pass
    return connection


# -----------------------------------------------------------------------------
# STANDARD CLINICAL TEST CATALOG SEED DATA
# -----------------------------------------------------------------------------
CLINICAL_CATALOG = [
    {
        "ht_code": "CBC",
        "ht_name": "Complete Blood Count (CBC)",
        "ht_heading": "Haematology",
        "ht_status": 1,
        "ht_amount": 350,
        "ht_type": "Profile",
        "ht_ref_ranges": "Age & sex specific ranges apply",
        "ht_interpretation": "Screening test for anemia, infection, and hematologic disorders",
        "sub_tests": [
            ("Haemoglobin (Hb)", "Numeric", "g/dL", "Cyanmethemoglobin", "Male: 13.0 - 17.0, Female: 12.0 - 15.5", 1),
            ("Total RBC Count", "Numeric", "million/µL", "Automated Impedance", "Male: 4.5 - 5.5, Female: 3.8 - 4.8", 2),
            ("Total Leukocyte Count (WBC)", "Numeric", "cells/µL", "Automated Impedance", "4000 - 11000", 3),
            ("Platelet Count", "Numeric", "lakhs/µL", "Automated Impedance", "1.50 - 4.50", 4),
            ("Packed Cell Volume (PCV)", "Numeric", "%", "Calculated", "Male: 40 - 50, Female: 36 - 46", 5),
            ("Mean Corpuscular Volume (MCV)", "Numeric", "fL", "Calculated", "80 - 100", 6),
            ("Mean Corpuscular Hemoglobin (MCH)", "Numeric", "pg", "Calculated", "27 - 32", 7),
            ("MCHC", "Numeric", "g/dL", "Calculated", "32 - 36", 8),
        ],
    },
    {
        "ht_code": "LIPID",
        "ht_name": "Lipid Profile",
        "ht_heading": "Biochemistry",
        "ht_status": 1,
        "ht_amount": 550,
        "ht_type": "Profile",
        "ht_ref_ranges": "NCEP Adult Treatment Panel III guidelines",
        "ht_interpretation": "Cardiovascular risk stratification assessment",
        "sub_tests": [
            ("Total Cholesterol", "Numeric", "mg/dL", "Enzymatic CHOD-PAP", "Desirable: < 200, Borderline: 200-239", 1),
            ("HDL Cholesterol", "Numeric", "mg/dL", "Direct Enzymatic", "Male: > 40, Female: > 50", 2),
            ("LDL Cholesterol", "Numeric", "mg/dL", "Calculated", "Optimal: < 100, Near optimal: 100-129", 3),
            ("Triglycerides", "Numeric", "mg/dL", "Enzymatic GPO-PAP", "Normal: < 150, Borderline: 150-199", 4),
            ("VLDL Cholesterol", "Numeric", "mg/dL", "Calculated", "Normal: 10 - 30", 5),
            ("Total Cholesterol / HDL Ratio", "Numeric", "Ratio", "Calculated", "Desirable: < 4.5", 6),
        ],
    },
    {
        "ht_code": "LFT",
        "ht_name": "Liver Function Test (LFT)",
        "ht_heading": "Biochemistry",
        "ht_status": 1,
        "ht_amount": 650,
        "ht_type": "Profile",
        "ht_ref_ranges": "Standard clinical biochemistry reference intervals",
        "ht_interpretation": "Assessment of hepatic synthetic function and cellular integrity",
        "sub_tests": [
            ("Bilirubin (Total)", "Numeric", "mg/dL", "Jendrassik-Grof", "0.2 - 1.2", 1),
            ("Bilirubin (Direct)", "Numeric", "mg/dL", "Diazotization", "0.0 - 0.3", 2),
            ("Bilirubin (Indirect)", "Numeric", "mg/dL", "Calculated", "0.2 - 0.9", 3),
            ("SGOT / AST", "Numeric", "U/L", "UV with P5P", "5 - 40", 4),
            ("SGPT / ALT", "Numeric", "U/L", "UV with P5P", "7 - 56", 5),
            ("Alkaline Phosphatase (ALP)", "Numeric", "U/L", "IFCC kinetic", "44 - 147", 6),
            ("Total Protein", "Numeric", "g/dL", "Biuret", "6.4 - 8.3", 7),
            ("Albumin", "Numeric", "g/dL", "BCG dye binding", "3.5 - 5.2", 8),
            ("A/G Ratio", "Numeric", "Ratio", "Calculated", "1.1 - 2.2", 9),
        ],
    },
    {
        "ht_code": "KFT",
        "ht_name": "Kidney Function Test (KFT / RFT)",
        "ht_heading": "Biochemistry",
        "ht_status": 1,
        "ht_amount": 600,
        "ht_type": "Profile",
        "ht_ref_ranges": "Renal metabolic reference intervals",
        "ht_interpretation": "Assessment of glomerular filtration rate and nitrogenous waste clearance",
        "sub_tests": [
            ("Blood Urea", "Numeric", "mg/dL", "GLDH kinetic", "15 - 45", 1),
            ("Blood Urea Nitrogen (BUN)", "Numeric", "mg/dL", "Calculated", "7 - 20", 2),
            ("Serum Creatinine", "Numeric", "mg/dL", "Modified Jaffe", "Male: 0.7 - 1.3, Female: 0.6 - 1.1", 3),
            ("Serum Uric Acid", "Numeric", "mg/dL", "Uricase enzymatic", "Male: 3.5 - 7.2, Female: 2.6 - 6.0", 4),
            ("Serum Calcium", "Numeric", "mg/dL", "Arsenazo III", "8.5 - 10.5", 5),
        ],
    },
    {
        "ht_code": "TFT",
        "ht_name": "Thyroid Profile (T3, T4, TSH)",
        "ht_heading": "Endocrinology",
        "ht_status": 1,
        "ht_amount": 550,
        "ht_type": "Profile",
        "ht_ref_ranges": "Chemiluminescence Immunoassay reference values",
        "ht_interpretation": "Screening and monitoring of thyroid axis dysfunctions",
        "sub_tests": [
            ("Total Triiodothyronine (T3)", "Numeric", "ng/dL", "CLIA", "80 - 200", 1),
            ("Total Thyroxine (T4)", "Numeric", "µg/dL", "CLIA", "4.8 - 11.6", 2),
            ("Thyroid Stimulating Hormone (TSH)", "Numeric", "µIU/mL", "ECLIA", "0.40 - 4.20", 3),
        ],
    },
    {
        "ht_code": "FBS",
        "ht_name": "Fasting Blood Sugar (Glucose)",
        "ht_heading": "Biochemistry",
        "ht_status": 1,
        "ht_amount": 100,
        "ht_type": "Single",
        "ht_ref_ranges": "ADA Criteria: Normal: 70 - 99 mg/dL; Prediabetes: 100 - 125 mg/dL",
        "ht_interpretation": "Standard plasma glucose determination after 8-10h fast",
        "sub_tests": [
            ("Fasting Plasma Glucose", "Numeric", "mg/dL", "GOD-POD Enzymatic", "70 - 100", 1),
        ],
    },
    {
        "ht_code": "URINE_RE",
        "ht_name": "Urine Routine & Microscopic Examination",
        "ht_heading": "Clinical Pathology",
        "ht_status": 1,
        "ht_amount": 150,
        "ht_type": "Profile",
        "ht_ref_ranges": "Routine clinical urinalysis ranges",
        "ht_interpretation": "Physical, chemical, and microscopic urinary tract evaluation",
        "sub_tests": [
            ("Color & Appearance", "Text", "", "Visual", "Pale Yellow, Clear", 1),
            ("Specific Gravity", "Numeric", "", "Refractometry", "1.005 - 1.030", 2),
            ("pH", "Numeric", "", "Dipstick", "4.5 - 8.0", 3),
            ("Urine Protein / Albumin", "Text", "", "Sulfosalicylic acid", "Nil / Negative", 4),
            ("Urine Glucose / Sugar", "Text", "", "Glucose oxidase", "Nil / Negative", 5),
            ("Pus Cells (WBC)", "Numeric", "/HPF", "Microscopy (40x)", "0 - 5", 6),
            ("Epithelial Cells", "Numeric", "/HPF", "Microscopy (40x)", "1 - 4", 7),
            ("RBCs", "Numeric", "/HPF", "Microscopy (40x)", "Nil / Absent", 8),
        ],
    },
]


def seed_initial_catalog(connection):
    """Seed comprehensive clinical laboratory head tests and sub-tests."""
    for item in CLINICAL_CATALOG:
        connection.execute(
            """
            INSERT INTO head_tests (
                ht_code, ht_name, ht_heading, ht_status, ht_amount,
                ht_type, ht_ref_ranges, ht_interpretation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item["ht_code"], item["ht_name"], item["ht_heading"],
                item["ht_status"], item["ht_amount"], item["ht_type"],
                item["ht_ref_ranges"], item["ht_interpretation"],
            ),
        )
        for st in item["sub_tests"]:
            connection.execute(
                """
                INSERT INTO sub_tests (
                    ht_code, st_name, st_type, st_unit, st_method,
                    st_ref_ranges, st_print_seq
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (item["ht_code"], st[0], st[1], st[2], st[3], st[4], st[5]),
            )


def init_db():
    """Create missing tables, seed initial records, and auto-migrate schema additions."""
    connection = open_database()
    try:
        is_pg = isinstance(connection, PostgresConnectionWrapper)

        if is_pg:
            # PostgreSQL DDL Initialization
            connection.executescript(POSTGRES_SCHEMA)
            connection.execute(
                """
                INSERT INTO status (status_id, status)
                VALUES (1, 'Active'), (2, 'Inactive')
                ON CONFLICT (status) DO NOTHING
                """
            )
        else:
            # SQLite DDL Initialization
            connection.executescript(SQLITE_SCHEMA)
            connection.executemany(
                "INSERT OR IGNORE INTO status (status_id, status) VALUES (?, ?)",
                [(1, "Active"), (2, "Inactive")],
            )

            # Non-destructive migrations for existing SQLite databases
            patient_cols = [row["name"] for row in connection.execute("PRAGMA table_info(patients)").fetchall()]
            if "patient_relation_name" not in patient_cols:
                connection.execute("ALTER TABLE patients ADD COLUMN patient_relation_name TEXT")
            if "is_active" not in patient_cols:
                connection.execute("ALTER TABLE patients ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")
            if "sample_collected" not in patient_cols:
                connection.execute("ALTER TABLE patients ADD COLUMN sample_collected INTEGER NOT NULL DEFAULT 0")

            order_cols = [row["name"] for row in connection.execute("PRAGMA table_info(lab_orders)").fetchall()]
            if "sample_collected" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN sample_collected INTEGER NOT NULL DEFAULT 0")
            if "specimens_data" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN specimens_data TEXT")
            if "payment_mode" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN payment_mode TEXT NOT NULL DEFAULT 'Cash'")
            if "payment_status" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Paid'")
            if "doctor_remarks" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN doctor_remarks TEXT")
            if "verified_by" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN verified_by TEXT")
            if "verified_at" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN verified_at TEXT")
            if "order_status" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN order_status TEXT NOT NULL DEFAULT 'Pending'")
            if "paid_amount" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN paid_amount NUMERIC NOT NULL DEFAULT 0")
                connection.execute("UPDATE lab_orders SET paid_amount = total WHERE payment_status = 'Paid'")
            if "due_amount" not in order_cols:
                connection.execute("ALTER TABLE lab_orders ADD COLUMN due_amount NUMERIC NOT NULL DEFAULT 0")
                connection.execute("UPDATE lab_orders SET due_amount = total - paid_amount")

            # Normalize any legacy PT-XXXXXX IDs to simple P1, P2 format
            connection.execute("UPDATE patients SET patient_id = 'P' || id WHERE patient_id LIKE 'PT-%'")

            # Normalize legacy ORD-XXXXXX and REC-XXXXXX to R1, R2, R3 format
            connection.execute("UPDATE lab_orders SET order_no = 'R' || id WHERE order_no LIKE 'ORD-%' OR order_no LIKE 'REC-%'")

        # Seed standard laboratory test panels if catalog is empty
        test_count = connection.execute("SELECT COUNT(*) AS c FROM head_tests").fetchone()["c"]
        if test_count == 0:
            seed_initial_catalog(connection)

        # Seed initial lab and default roles if empty
        lab_count = connection.execute("SELECT COUNT(*) AS c FROM labs").fetchone()["c"]
        if lab_count == 0:
            from werkzeug.security import generate_password_hash
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat(timespec="seconds")

            cursor = connection.execute(
                "INSERT INTO labs (lab_code, lab_name, created_at) VALUES (?, ?, ?)",
                ("LAB01", "Labora+ Pathology & Diagnostics", now),
            )
            lab_id = cursor.lastrowid or 1

            users_seed = [
                ("developer", generate_password_hash("dev123"), "developer", "Lead Developer"),
                ("admin", generate_password_hash("admin123"), "admin", "Lab Administrator"),
                ("staff", generate_password_hash("staff123"), "user", "Phlebotomy Staff"),
            ]
            for uname, phash, role, dname in users_seed:
                connection.execute(
                    """
                    INSERT INTO users (lab_id, username, password_hash, role, display_name, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, 1, ?)
                    """,
                    (lab_id, uname, phash, role, dname, now),
                )

        # Sync existing orders with current test catalogue definitions
        try:
            from services.tests_service import sync_all_orders_with_catalogue
            sync_all_orders_with_catalogue(connection)
        except Exception:
            pass

        connection.commit()
    finally:
        connection.close()


def get_db():
    """Return one connection per Flask application/request context."""
    if "db" not in g:
        g.db = open_database()
    return g.db


def close_db(_error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_app(app):
    """Register the connection cleanup hook and initialize the database."""
    app.teardown_appcontext(close_db)
    init_db()
