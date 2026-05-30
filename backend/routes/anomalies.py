from flask import Blueprint, jsonify, request
from models import get_db

anomalies_bp = Blueprint('anomalies', __name__)

@anomalies_bp.route('/', methods=['GET'], strict_slashes=False)
def get_all():
    conn = get_db()
    rows = conn.execute('''
        SELECT * FROM anomalies ORDER BY timestamp DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@anomalies_bp.route('/recent', methods=['GET'])
def get_recent():
    limit = request.args.get('limit', 5)
    conn = get_db()
    rows = conn.execute('''
        SELECT * FROM anomalies ORDER BY timestamp DESC LIMIT ?
    ''', (int(limit),)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])