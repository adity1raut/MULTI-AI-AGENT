from firebase_admin import auth
from firebase.firebase_client import db
from utils.jwt_utils import create_access_token, create_refresh_token
from datetime import datetime
import datetime as dt
import logging

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def signup(id_token, role):
        """Handle user signup"""
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        
        if provider_id != "google.com":
            raise ValueError("Only Google Sign-In is supported")
        
        user_ref = db.collection("users").document(uid)
        if user_ref.get().exists:
            raise ValueError("User already exists")
        
        user_record = auth.get_user(uid)
        
        user_data = {
            "email": email,
            "displayName": user_record.display_name,
            "photoURL": user_record.photo_url,
            "role": role,
            "createdAt": datetime.now(dt.UTC),
            "updatedAt": datetime.now(dt.UTC),
            "lastLogin": datetime.now(dt.UTC),
            "isActive": True
        }
        
        user_ref.set(user_data)
        
        access_token = create_access_token(uid, email, provider_id, role)
        refresh_token = create_refresh_token(uid)
        
        return {
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
        }

    @staticmethod
    def login(id_token, role):
        """Handle user login"""
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        
        if provider_id != "google.com":
            raise ValueError("Only Google Sign-In is supported")
        
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise ValueError("Account not found")
        
        user_data = user_doc.to_dict()
        if user_data.get("role") != role:
            raise ValueError(f"Account exists with different role: {user_data.get('role')}")
        
        user_record = auth.get_user(uid)
        user_ref.update({
            "lastLogin": datetime.now(dt.UTC),
            "updatedAt": datetime.now(dt.UTC)
        })
        
        access_token = create_access_token(uid, email, provider_id, role)
        refresh_token = create_refresh_token(uid)
        
        return {
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
        }