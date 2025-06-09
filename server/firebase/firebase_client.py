import firebase_admin
from firebase_admin import credentials, auth, firestore
import logging
from config import Config

logger = logging.getLogger(__name__)

def initialize_firebase():
    try:
        if not Config.FIREBASE_CREDENTIALS:
            raise ValueError("FIREBASE_CREDENTIALS not set in config")
        
        cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        
        logger.info("Firebase Admin SDK initialized successfully")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise

# Initialize Firebase when this module is imported
db = initialize_firebase()