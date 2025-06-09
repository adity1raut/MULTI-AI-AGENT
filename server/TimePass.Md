from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import firebase_admin
from firebase_admin import credentials, auth, firestore
import jwt
from functools import wraps
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import datetime as dt  # Added for UTC timezone
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# Initialize rate limiter (In-memory for development, Redis for production)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
)

# Initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_CREDENTIALS")
if not cred_path:
    raise ValueError("FIREBASE_CREDENTIALS not set in .env")

if not os.path.exists(cred_path):
    raise FileNotFoundError(f"Firebase credentials file not found: {cred_path}")

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase Admin SDK and Firestore initialized successfully")
    # Test Firestore connection
    try:
        test_ref = db.collection("test").document("test_doc")
        test_ref.set({"test": "Hello Firestore"})
        logger.info("Firestore test write successful")
    except Exception as e:
        logger.error(f"Firestore test write failed: {e}")
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")
    raise

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET not set in .env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXP = 3600  # 1 hour
REFRESH_TOKEN_EXP = 7 * 24 * 3600  # 7 days

def create_access_token(uid, email=None, provider_id=None, role=None):
    """Create access JWT token"""
    payload = {
        "uid": uid,
        "email": email,
        "provider_id": provider_id,
        "role": role,
        "type": "access",
        "iat": datetime.now(dt.UTC),
        "exp": datetime.now(dt.UTC) + timedelta(seconds=ACCESS_TOKEN_EXP)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(uid):
    """Create refresh JWT token"""
    payload = {
        "uid": uid,
        "type": "refresh",
        "iat": datetime.now(dt.UTC),
        "exp": datetime.now(dt.UTC) + timedelta(seconds=REFRESH_TOKEN_EXP)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

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
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
                logger.error(f"JWT verification error: {e}")
                return jsonify({"error": "Token verification failed"}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now(dt.UTC).isoformat()})

@app.route("/auth/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    """Signup endpoint that creates a new user with role"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        id_token = data.get("idToken")
        role = data.get("role")
        
        if not id_token:
            return jsonify({"error": "idToken is required"}), 400
        
        if not role or role not in ["requester", "applicant"]:
            return jsonify({"error": "Valid role (requester or applicant) is required"}), 400
        
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        
        # Check if the provider is Google
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        if provider_id != "google.com":
            return jsonify({"error": "Only Google Sign-In is supported"}), 401
        
        # Check if user already exists in Firestore
        user_ref = db.collection("users").document(uid)
        existing_user = user_ref.get()
        
        if existing_user.exists:
            return jsonify({"error": "User already exists. Please try logging in instead."}), 409
        
        # Get user record from Firebase Auth
        user_record = auth.get_user(uid)
        
        # Create new user in Firestore
        user_data = {
            "email": email,
            "displayName": user_record.display_name,
            "photoURL": user_record.photo_url,
            "role": role,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": datetime.now(dt.UTC),
            "lastLogin": datetime.now(dt.UTC),
            "isActive": True
        }
        
        user_ref.set(user_data)
        
        # Create tokens
        access_token = create_access_token(uid, email, provider_id, role)
        refresh_token = create_refresh_token(uid)
        
        logger.info(f"New user {email} signed up with role {role}")
        
        return jsonify({
            "success": True,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
        
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid Google Sign-In token"}), 401
    except auth.UserNotFoundError:
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500

@app.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    """Login endpoint that verifies Firebase Google Sign-In ID token and returns JWTs"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        id_token = data.get("idToken")
        role = data.get("role")
        
        if not id_token:
            return jsonify({"error": "idToken is required"}), 400
        
        if not role or role not in ["requester", "applicant"]:
            return jsonify({"error": "Valid role (requester or applicant) is required"}), 400
        
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        
        # Check if the provider is Google
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        if provider_id != "google.com":
            return jsonify({"error": "Only Google Sign-In is supported"}), 401
        
        # Check if user exists in Firestore and has the correct role
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({
                "error": "Account not found. Please sign up first.",
                "needsSignup": True
            }), 404
        
        user_data = user_doc.to_dict()
        stored_role = user_data.get("role")
        
        if stored_role != role:
            return jsonify({
                "error": f"Account exists with different role. You are registered as {stored_role}.",
                "needsSignup": True
            }), 403
        
        # Get user record for additional info
        user_record = auth.get_user(uid)
        
        # Update last login
        user_ref.update({
            "lastLogin": datetime.now(dt.UTC),
            "updatedAt": datetime.now(dt.UTC)
        })
        
        # Create tokens
        access_token = create_access_token(uid, email, provider_id, role)
        refresh_token = create_refresh_token(uid)
        
        logger.info(f"User {email} logged in with role {role}")
        
        return jsonify({
            "success": True,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
        
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid Google Sign-In token"}), 401
    except auth.UserNotFoundError:
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route("/auth/refresh", methods=["POST"])
@limiter.limit("5 per minute")
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        refresh_token = data.get("refreshToken")
        if not refresh_token:
            return jsonify({"error": "refreshToken is required"}), 400
        
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid token type"}), 401
        
        uid = payload["uid"]
        user_record = auth.get_user(uid)
        
        # Get user role from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        role = user_data.get("role")
        
        # Create new access token
        access_token = create_access_token(uid, user_record.email, "google.com", role)
        
        return jsonify({
            "success": True,
            "accessToken": access_token,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({"error": f"Token refresh failed: {str(e)}"}), 401

@app.route("/auth/verify", methods=["GET"])
@jwt_required("access")
def verify_token():
    """Verify JWT token and return user info"""
    try:
        uid = request.uid
        user_record = auth.get_user(uid)
        
        # Get user role from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User data not found"}), 404
        
        user_data = user_doc.to_dict()
        role = user_data.get("role")
        
        return jsonify({
            "success": True,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return jsonify({"error": f"Token verification failed: {str(e)}"}), 401

@app.route("/user/profile", methods=["GET"])
@jwt_required("access")
def get_profile():
    """Get user profile information"""
    try:
        uid = request.uid
        user_record = auth.get_user(uid)
        user_doc = db.collection("users").document(uid).get()
        
        user_data = user_doc.to_dict() if user_doc.exists else {}
        
        return jsonify({
            "success": True,
            "profile": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": user_data.get("role"),
                "createdAt": user_data.get("createdAt"),
                "lastLogin": user_data.get("lastLogin"),
                "additionalInfo": user_data.get("additionalInfo", {})
            }
        })
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        return jsonify({"error": f"Failed to fetch profile: {str(e)}"}), 500

@app.route("/user/profile", methods=["PUT"])
@jwt_required("access")
def update_profile():
    """Update user profile information"""
    try:
        uid = request.uid
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        # Update Firebase user record
        update_data = {}
        if "displayName" in data:
            update_data["display_name"] = data["displayName"]
        if "photoURL" in data:
            update_data["photo_url"] = data["photoURL"]
        
        if update_data:
            auth.update_user(uid, **update_data)
        
        # Update Firestore user data
        user_ref = db.collection("users").document(uid)
        firestore_update = {
            "updatedAt": datetime.now(dt.UTC)
        }
        if "additionalInfo" in data:
            firestore_update["additionalInfo"] = data["additionalInfo"]
        
        user_ref.set(firestore_update, merge=True)
        
        logger.info(f"Profile updated for user {uid}")
        
        # Return updated profile
        user_record = auth.get_user(uid)
        user_data = user_ref.get().to_dict()
        
        return jsonify({
            "success": True,
            "profile": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": user_data.get("role"),
                "createdAt": user_data.get("createdAt"),
                "lastLogin": user_data.get("lastLogin"),
                "additionalInfo": user_data.get("additionalInfo", {})
            }
        })
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500

@app.route("/auth/logout", methods=["POST"])
@jwt_required("access")
def logout():
    """Logout endpoint (client should remove tokens)"""
    uid = request.uid
    logger.info(f"User {uid} logged out")
    return jsonify({"success": True, "message": "Logged out successfully"})

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"  # Set to False for production
    app.run(host="0.0.0.0", port=port, debug=debug)

#     from flask import Flask
# from flask_cors import CORS
# from config import Config
# from routes.auth import auth_bp
# from routes.user import user_bp
# from routes.health import health_bp
# from utils.logging_config import configure_logging

# def create_app():
#     app = Flask(__name__)
    
#     # Configure CORS
#     CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    
#     # Configure logging
#     configure_logging(app)
    
#     # Register blueprints
#     app.register_blueprint(auth_bp)
#     app.register_blueprint(user_bp)
#     app.register_blueprint(health_bp)
    
#     # Add error handlers
#     @app.errorhandler(404)
#     def not_found(error):
#         return jsonify({"error": "Endpoint not found"}), 404
    
#     @app.errorhandler(500)
#     def internal_error(error):
#         return jsonify({"error": "Internal server error"}), 500
    
#     # Security headers
#     @app.after_request
#     def add_security_headers(response):
#         response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
#         response.headers["X-Content-Type-Options"] = "nosniff"
#         response.headers["X-Frame-Options"] = "DENY"
#         response.headers["Content-Security-Policy"] = "default-src 'self'"
#         return response
    
#     return app

# if __name__ == "__main__":
#     app = create_app()
#     app.run(host="0.0.0.0", port=5000, debug=True)