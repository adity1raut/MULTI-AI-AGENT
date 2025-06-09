from functools import wraps
from flask import request, jsonify
import jwt
from config import Config
from utils.jwt_utils import decode_token

def jwt_required(token_type="access"):
    """Decorator to protect routes with JWT authentication"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            
            if not auth_header:
                return jsonify({"error": "Authorization header missing"}), 401
            
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Invalid authorization header format"}), 401
            
            token = auth_header.split("Bearer ")[1]
            
            try:
                payload = decode_token(token)
                if payload.get("type") != token_type:
                    return jsonify({"error": f"Invalid token type, expected {token_type}"}), 401
                if token_type == "access" and payload.get("provider_id") != "google.com":
                    return jsonify({"error": "Invalid authentication provider"}), 401
                
                request.uid = payload["uid"]
                request.user_email = payload.get("email")
                request.user_role = payload.get("role")
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token has expired"}), 401
            except jwt.InvalidTokenError as e:
                return jsonify({"error": f"Invalid token: {str(e)}"}), 401
            except Exception as e:
                return jsonify({"error": "Token verification failed"}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator