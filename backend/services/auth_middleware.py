"""
Authentication Middleware & Decorators for route protection.
"""
from functools import wraps
from flask import session, g
from database import get_db
from services.common import api_error
from services.auth_service import get_user_by_id


def get_current_user():
    """Retrieve and cache the current authenticated user in Flask's g context."""
    if "current_user" in g:
        return g.current_user

    user_id = session.get("user_id")
    if not user_id:
        g.current_user = None
        return None

    db = get_db()
    user = get_user_by_id(db, user_id)
    g.current_user = user
    return user


def login_required(f):
    """Decorator ensuring that the endpoint request has a valid active session."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return api_error("Authentication required. Please sign in.", 401)
        return f(*args, **kwargs)
    return decorated_function


def role_required(allowed_roles):
    """Decorator factory restricting access to users with specified roles."""
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return api_error("Authentication required. Please sign in.", 401)
            if user["role"] not in allowed_roles and user["role"] != "developer":
                return api_error("Access denied. Insufficient permissions.", 403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
