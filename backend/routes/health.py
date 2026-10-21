from flask import Blueprint, current_app, jsonify
import sqlite3
from database import DATABASE_PATH, get_db
from services.common import api_error

bp = Blueprint("health", __name__)


@bp.get("/api/health")
def health_check():
    try:
        get_db().execute("SELECT 1").fetchone()
        return jsonify({"status": "ok", "database": "connected", "path": str(DATABASE_PATH)})
    except sqlite3.Error:
        current_app.logger.exception("Database health check failed")
        return api_error("Database connection failed.", 500)
