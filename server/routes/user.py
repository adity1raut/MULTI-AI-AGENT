from flask import Blueprint, jsonify, request
from firebase_admin import auth
from firebase.firebase_client import db
from utils.decorators import jwt_required
from datetime import datetime
import datetime as dt
import logging

logger = logging.getLogger(__name__)

# Create the Blueprint
user_bp = Blueprint('user', __name__, url_prefix='/user')

@user_bp.route('/profile', methods=['GET'])
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

@user_bp.route('/profile', methods=['PUT'])
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