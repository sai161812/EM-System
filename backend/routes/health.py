from flask import Blueprint, jsonify
from datetime import datetime
from models import get_db

health_bp = Blueprint('health', __name__)

@health_bp.route('/ping', methods=['GET'])
def ping():
    try:
        # Verify DB is reachable
        conn = get_db()
        conn.execute("SELECT 1").fetchone()
        conn.close()
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500