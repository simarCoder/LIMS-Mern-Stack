from flask import Blueprint, current_app, jsonify
from database import DATABASE_PATH, DATABASE_URL, get_db, is_postgres_configured
from services.common import api_error

bp = Blueprint("health", __name__)


@bp.get("/api/health")
def health_check():
    try:
        db = get_db()
        db.execute("SELECT 1").fetchone()
        engine = "postgresql" if is_postgres_configured() else "sqlite"
        target = DATABASE_URL.split("@")[-1] if is_postgres_configured() else str(DATABASE_PATH)
        return jsonify({"status": "ok", "database": "connected", "engine": engine, "target": target})
    except Exception:
        current_app.logger.exception("Database health check failed")
        return api_error("Database connection failed.", 500)
