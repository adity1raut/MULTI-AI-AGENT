from flask import Blueprint, jsonify
from datetime import datetime
import datetime as dt

# Create the health Blueprint
health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now(dt.UTC).isoformat()
    })