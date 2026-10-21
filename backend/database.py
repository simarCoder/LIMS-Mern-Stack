"""SQLite schema and connection management for the local LIMS backend."""
from pathlib import Path
import os
import sqlite3
from flask import g

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.environ.get("LIMS_DB_PATH", BASE_DIR / "lims_local.db")).resolve()

SCHEMA = """
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
    patient_created_at TEXT NOT NULL
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


def open_database():
    """Open a SQLite connection with row objects and foreign keys enabled."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(DATABASE_PATH), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


def init_db():
    """Create missing tables and indexes. No destructive or additive migrations."""
    connection = open_database()
    try:
        connection.executescript(SCHEMA)
        connection.executemany(
            "INSERT OR IGNORE INTO status (status_id, status) VALUES (?, ?)",
            [(1, "Active"), (2, "Inactive")],
        )
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
