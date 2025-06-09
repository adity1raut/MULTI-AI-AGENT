from flask import Blueprint, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from services.auth_service import AuthService
from utils.decorators import jwt_required
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

@auth_bp.route('/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        result = AuthService.signup(data.get("idToken"), data.get("role"))
        return jsonify({"success": True, **result})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({"error": "Signup failed"}), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        result = AuthService.login(data.get("idToken"), data.get("role"))
        return jsonify({"success": True, **result})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": "Login failed"}), 500

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("5 per minute")
def refresh_token():
    # ... similar pattern for refresh token endpoint
    pass

@auth_bp.route('/verify', methods=['GET'])
@jwt_required("access")
def verify_token():
    # ... similar pattern for verify token endpoint
    pass

@auth_bp.route('/logout', methods=['POST'])
@jwt_required("access")
def logout():
    # ... logout endpoint
    pass