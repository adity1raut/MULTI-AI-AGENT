import jwt
from datetime import datetime, timedelta
import datetime as dt
from config import Config

def create_access_token(uid, email=None, provider_id=None, role=None):
    """Create access JWT token"""
    payload = {
        "uid": uid,
        "email": email,
        "provider_id": provider_id,
        "role": role,
        "type": "access",
        "iat": datetime.now(dt.UTC),
        "exp": datetime.now(dt.UTC) + timedelta(seconds=Config.ACCESS_TOKEN_EXP)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)

def create_refresh_token(uid):
    """Create refresh JWT token"""
    payload = {
        "uid": uid,
        "type": "refresh",
        "iat": datetime.now(dt.UTC),
        "exp": datetime.now(dt.UTC) + timedelta(seconds=Config.REFRESH_TOKEN_EXP)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)

def decode_token(token):
    """Decode and verify JWT token"""
    return jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALGORITHM])