"""
Authentication Routes — Login, logout, session verification, and lab lookup.
"""
from flask import Blueprint, jsonify, request, session
from database import get_db
from services.common import api_error
from services.auth_service import (
    validate_login,
    lookup_lab_by_code,
    get_user_by_id,
    create_lab_with_admin,
)

bp = Blueprint("auth", __name__)


@bp.get("/api/auth/lab/<lab_code>")
def get_lab_info(lab_code):
    """
    Look up laboratory details by code.
    Used by login and registration forms to autofill the Lab Name!
    """
    db = get_db()
    lab = lookup_lab_by_code(db, lab_code)
    if not lab:
        return api_error(f"No laboratory found with code '{lab_code.strip().upper()}'.", 404)
    return jsonify({
        "lab_id": lab["lab_id"],
        "lab_code": lab["lab_code"],
        "lab_name": lab["lab_name"],
    })


@bp.post("/api/auth/login")
def login():
    """
    Authenticate user via Lab Code, Username, and Password.
    Sets secure HttpOnly session cookie.
    """
    data = request.get_json(silent=True) or {}
    lab_code = data.get("lab_code", "")
    username = data.get("username", "")
    password = data.get("password", "")

    db = get_db()
    try:
        user = validate_login(db, lab_code, username, password)
        # Store user identity in server-side session
        session.clear()
        session["user_id"] = user["user_id"]
        session["lab_id"] = user["lab_id"]
        session.permanent = True  # Lasts across browser sessions
        return jsonify({
            "message": "Login successful.",
            "user": user,
        })
    except ValueError as exc:
        return api_error(str(exc), 401)


@bp.post("/api/auth/logout")
def logout():
    """Clear server session and log user out."""
    session.clear()
    return jsonify({"message": "Successfully logged out."})


@bp.get("/api/auth/me")
def me():
    """
    Return currently authenticated user from session.
    Returns 401 if not logged in.
    """
    user_id = session.get("user_id")
    if not user_id:
        return api_error("Not authenticated.", 401)

    db = get_db()
    user = get_user_by_id(db, user_id)
    if not user:
        session.clear()
        return api_error("User session expired or invalid.", 401)

    return jsonify({"user": user})


@bp.get("/api/auth/status")
def status():
    """Check laboratory configuration status and available default labs."""
    db = get_db()
    labs = db.execute("SELECT lab_id, lab_code, lab_name FROM labs ORDER BY lab_id").fetchall()
    setup_required = len(labs) == 0
    return jsonify({
        "setup_required": setup_required,
        "labs": [{"lab_code": r["lab_code"], "lab_name": r["lab_name"]} for r in labs],
    })


@bp.post("/api/auth/setup")
def setup():
    """Initial onboarding endpoint for creating the first laboratory."""
    db = get_db()
    lab_count = db.execute("SELECT COUNT(*) AS c FROM labs").fetchone()["c"]
    if lab_count > 0:
        return api_error("Initial setup is already complete.", 400)

    data = request.get_json(silent=True) or {}
    lab_code = data.get("lab_code", "")
    lab_name = data.get("lab_name", "")
    username = data.get("username", "")
    password = data.get("password", "")
    display_name = data.get("display_name", "")

    try:
        result = create_lab_with_admin(db, lab_code, lab_name, username, password, display_name)
        db.commit()
        return jsonify({
            "message": "Laboratory and admin created successfully.",
            "data": result,
        }), 201
    except ValueError as exc:
        db.rollback()
        return api_error(str(exc), 400)
