<!-- 
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
#     app.run(host="0.0.0.0", port=5000, debug=True) -->