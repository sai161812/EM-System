from flask import Blueprint, jsonify, request
from models import get_db
from services.cost_estimator import (
    get_rate, get_daily_cost, get_monthly_cost, project_monthly_cost
)
from datetime import datetime

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings', methods=['GET'])
def get_settings():
    rate = get_rate()
    return jsonify({'rate_per_unit': rate})

@settings_bp.route('/settings', methods=['POST'])
def update_settings():
    data = request.get_json()
    if 'rate_per_unit' not in data:
        return jsonify({'error': 'rate_per_unit required'}), 400
    rate = float(data['rate_per_unit'])
    conn = get_db()
    conn.execute(
        "UPDATE settings SET value = ? WHERE key = 'rate_per_unit'",
        (str(rate),)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Rate updated', 'rate_per_unit': rate})

@settings_bp.route('/cost/summary', methods=['GET'])
def cost_summary():
    today = datetime.now().strftime('%Y-%m-%d')
    month = datetime.now().strftime('%Y-%m')
    return jsonify({
        'today_cost': get_daily_cost(today),
        'month_cost': get_monthly_cost(month),
        'projected_month_cost': project_monthly_cost(month),
        'rate_per_unit': get_rate()
    })