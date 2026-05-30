from flask import Blueprint, jsonify, request
from services.budget_engine import (
    evaluate_budget, get_daily_budget,
    set_daily_budget, store_budget_alert
)
from models import get_db
from datetime import datetime

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/status', methods=['GET'])
def budget_status():
    date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    alert = evaluate_budget(date)
    store_budget_alert(alert)
    return jsonify(alert)

@budget_bp.route('/settings', methods=['GET'])
def get_budget_settings():
    return jsonify({'daily_budget': get_daily_budget()})

@budget_bp.route('/settings', methods=['POST'])
def update_budget():
    data = request.get_json()
    if 'daily_budget' not in data:
        return jsonify({'error': 'daily_budget required'}), 400
    set_daily_budget(float(data['daily_budget']))
    return jsonify({'message': 'Budget updated', 'daily_budget': float(data['daily_budget'])})

@budget_bp.route('/alerts/history', methods=['GET'])
def alerts_history():
    conn = get_db()
    rows = conn.execute('''
        SELECT * FROM budget_alerts ORDER BY timestamp DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])