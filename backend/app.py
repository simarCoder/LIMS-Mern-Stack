"""Application factory for the modular local LIMS API."""
import os
import re
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from database import init_app as init_database
from routes.health import bp as health_bp
from routes.auth import bp as auth_bp
from routes.patients import bp as patients_bp
from routes.tests import bp as tests_bp
from routes.registrations import bp as registrations_bp
from routes.orders import bp as orders_bp
from routes.diagnosis import bp as diagnosis_bp


def create_app():
    app = Flask(__name__)

    # Session & Security Configuration
    app.secret_key = os.environ.get(
        "FLASK_SECRET_KEY", "lims-security-session-key-dev-wal-2026-local"
    )
    app.config.update(
        SESSION_COOKIE_NAME="lims_session",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=False,  # Set to True when served over HTTPS
        PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    )

    # CORS configured for browser session cookies across local ports & public tunnels
    CORS(
        app,
        resources={r"/api/*": {"origins": [
            re.compile(r"^https?://.*"),
        ]}},
        supports_credentials=True,
    )

    init_database(app)
    for blueprint in (
        health_bp, auth_bp, patients_bp, tests_bp,
        registrations_bp, orders_bp, diagnosis_bp,
    ):
        app.register_blueprint(blueprint)
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    try:
        from waitress import serve
        print(f" * Serving LIMS Backend via Waitress on http://0.0.0.0:{port} (threads=8)")
        serve(app, host="0.0.0.0", port=port, threads=8)
    except ImportError:
        print(f" * Serving LIMS Backend via Flask dev server on http://0.0.0.0:{port} (threaded=True)")
        app.run(host="0.0.0.0", port=port, threaded=True, debug=False)
