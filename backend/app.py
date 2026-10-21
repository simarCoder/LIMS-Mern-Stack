"""Application factory for the modular local LIMS API."""
from flask import Flask
from flask_cors import CORS
from database import init_app as init_database
from routes.health import bp as health_bp
from routes.patients import bp as patients_bp
from routes.tests import bp as tests_bp
from routes.registrations import bp as registrations_bp
from routes.orders import bp as orders_bp
from routes.diagnosis import bp as diagnosis_bp


def create_app():
    app = Flask(__name__)
    CORS(
        app,
        resources={r"/api/*": {"origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]}},
    )

    init_database(app)
    for blueprint in (
        health_bp, patients_bp, tests_bp,
        registrations_bp, orders_bp, diagnosis_bp,
    ):
        app.register_blueprint(blueprint)
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
