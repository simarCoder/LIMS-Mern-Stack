"""
Authentication Service — Lab lookup, password hashing, and user credential validation.
"""
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash


def hash_password(password: str) -> str:
    """Hash raw plaintext password using scrypt/pbkdf2 via Werkzeug."""
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Safely check password against hash."""
    if not password_hash or not password:
        return False
    return check_password_hash(password_hash, password)


def user_to_dict(user_row, lab_row=None) -> dict:
    """Serialize a user row into an API response without leaking password_hash."""
    data = {
        "user_id": user_row["user_id"],
        "lab_id": user_row["lab_id"],
        "username": user_row["username"],
        "role": user_row["role"],
        "display_name": user_row["display_name"] or user_row["username"],
        "is_active": bool(user_row["is_active"]),
        "created_at": user_row["created_at"],
    }
    if lab_row:
        data["lab_code"] = lab_row["lab_code"]
        data["lab_name"] = lab_row["lab_name"]
    return data


def lookup_lab_by_code(connection, lab_code: str):
    """Lookup a lab by code (case-insensitive). Returns sqlite3.Row or None."""
    if not lab_code:
        return None
    cleaned = lab_code.strip().upper()
    return connection.execute(
        "SELECT lab_id, lab_code, lab_name, created_at FROM labs WHERE upper(lab_code) = ?",
        (cleaned,),
    ).fetchone()


def get_user_by_id(connection, user_id: int):
    """Retrieve full active user info by ID, joining lab details."""
    row = connection.execute(
        """
        SELECT u.user_id, u.lab_id, u.username, u.role, u.display_name,
               u.is_active, u.created_at, l.lab_code, l.lab_name
        FROM users u
        JOIN labs l ON l.lab_id = u.lab_id
        WHERE u.user_id = ? AND u.is_active = 1
        """,
        (user_id,),
    ).fetchone()
    if not row:
        return None
    return {
        "user_id": row["user_id"],
        "lab_id": row["lab_id"],
        "username": row["username"],
        "role": row["role"],
        "display_name": row["display_name"] or row["username"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "lab_code": row["lab_code"],
        "lab_name": row["lab_name"],
    }


def validate_login(connection, lab_code: str, username: str, password: str):
    """
    Validates login credentials against lab_code, username, and password.
    Raises ValueError with client-safe message if authentication fails.
    """
    if not lab_code or not lab_code.strip():
        raise ValueError("Lab code is required.")
    if not username or not username.strip():
        raise ValueError("Username is required.")
    if not password:
        raise ValueError("Password is required.")

    lab = lookup_lab_by_code(connection, lab_code)
    if not lab:
        raise ValueError(f"No laboratory registered with code '{lab_code.strip().upper()}'.")

    user_row = connection.execute(
        """
        SELECT user_id, lab_id, username, password_hash, role, display_name, is_active, created_at
        FROM users
        WHERE lab_id = ? AND lower(username) = lower(?)
        """,
        (lab["lab_id"], username.strip()),
    ).fetchone()

    if not user_row:
        raise ValueError("Invalid username or password.")

    if not user_row["is_active"]:
        raise ValueError("This account has been deactivated. Please contact an administrator.")

    if not verify_password(user_row["password_hash"], password):
        raise ValueError("Invalid username or password.")

    return user_to_dict(user_row, lab)


def create_lab_with_admin(connection, lab_code: str, lab_name: str, username: str, password: str, display_name: str = None):
    """Creates a new laboratory alongside its primary administrator user."""
    code_cleaned = (lab_code or "").strip().upper()
    name_cleaned = (lab_name or "").strip()
    user_cleaned = (username or "").strip().lower()

    if not code_cleaned or len(code_cleaned) < 2:
        raise ValueError("Lab code must be at least 2 characters.")
    if not name_cleaned:
        raise ValueError("Lab name is required.")
    if not user_cleaned or len(user_cleaned) < 3:
        raise ValueError("Username must be at least 3 characters.")
    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters.")

    existing = lookup_lab_by_code(connection, code_cleaned)
    if existing:
        raise ValueError(f"Lab code '{code_cleaned}' already exists.")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    cursor = connection.execute(
        "INSERT INTO labs (lab_code, lab_name, created_at) VALUES (?, ?, ?)",
        (code_cleaned, name_cleaned, now),
    )
    lab_id = cursor.lastrowid

    phash = hash_password(password)
    user_cursor = connection.execute(
        """
        INSERT INTO users (lab_id, username, password_hash, role, display_name, is_active, created_at)
        VALUES (?, ?, ?, 'admin', ?, 1, ?)
        """,
        (lab_id, user_cleaned, phash, (display_name or "").strip() or user_cleaned, now),
    )
    user_id = user_cursor.lastrowid

    return {
        "lab_id": lab_id,
        "lab_code": code_cleaned,
        "lab_name": name_cleaned,
        "user_id": user_id,
        "username": user_cleaned,
        "role": "admin",
        "display_name": display_name or user_cleaned,
    }
