from flask import Flask, jsonify
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
CORS(app)

init_db()

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
    return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)