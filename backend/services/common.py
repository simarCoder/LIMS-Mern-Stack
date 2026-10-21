"""Small shared helpers used by route and service modules."""
from datetime import datetime, timezone
from flask import jsonify


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def api_error(message, status_code=400):
    return jsonify({"error": message}), status_code

def parse_int(value, field_name, minimum=None, maximum=None):
    if isinstance(value, bool):
        raise ValueError(f"{field_name} must be a whole number.")
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a whole number.")
    if isinstance(value, float) and not value.is_integer():
        raise ValueError(f"{field_name} must be a whole number.")
    if isinstance(value, str) and value.strip() != str(parsed):
        raise ValueError(f"{field_name} must be a whole number.")
    if minimum is not None and parsed < minimum:
        raise ValueError(f"{field_name} must be at least {minimum}.")
    if maximum is not None and parsed > maximum:
        raise ValueError(f"{field_name} must be at most {maximum}.")
    return parsed
