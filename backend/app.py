import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from models import init_db
from routes.energy import energy_bp
from routes.anomalies import anomalies_bp
from routes.settings import settings_bp
from routes.budget import budget_bp
from routes.insights import insights_bp
from routes.refresh import refresh_bp
from routes.health import health_bp

app = Flask(__name__)

# BUG-01: Restrict CORS to known trusted origins only.
# Set FRONTEND_ORIGIN env var in production (e.g. https://yourdomain.com).
_allowed_origins = ["http://localhost:3000", "http://localhost:5173"]
_extra_origin = os.getenv('FRONTEND_ORIGIN')
if _extra_origin:
    _allowed_origins.append(_extra_origin)
CORS(app, resources={r"/api/*": {"origins": _allowed_origins}})

init_db()

# ARCH-05: Require X-API-Key header on all state-mutating (POST) requests.
# In development, set API_KEY='' (empty) or omit the env var to disable the guard.
_api_key = os.getenv('API_KEY', '')

@app.before_request
def check_api_key():
    if request.method == 'POST' and _api_key:
        provided = request.headers.get('X-API-Key', '')
        if provided != _api_key:
            return jsonify({'error': 'Unauthorized'}), 401

# Register all blueprints
app.register_blueprint(energy_bp,    url_prefix='/api/energy')
app.register_blueprint(anomalies_bp, url_prefix='/api/anomalies')
app.register_blueprint(settings_bp,  url_prefix='/api')
app.register_blueprint(budget_bp,    url_prefix='/api/budget')
app.register_blueprint(insights_bp,  url_prefix='/api/insights')
app.register_blueprint(refresh_bp,   url_prefix='/api')
app.register_blueprint(health_bp,    url_prefix='/api')

# Global error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # BUG-10: Never hardcode debug=True — use an env var.
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, port=5000)