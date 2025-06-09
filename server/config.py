import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXP = 3600  # 1 hour
    REFRESH_TOKEN_EXP = 7 * 24 * 3600  # 7 days
    FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
    CORS_ORIGINS = ["http://localhost:5173"]
    RATE_LIMITS = ["200 per day", "50 per hour"]