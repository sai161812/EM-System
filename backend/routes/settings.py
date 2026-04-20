from flask import Blueprint, jsonify, request
from models import get_db
from services.cost_estimator import (
    get_rate, get_daily_cost, get_monthly_cost, project_monthly_cost
)
from datetime import datetime
import re

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings', methods=['GET'])
def get_settings():
    rate = get_rate()
    return jsonify({'rate_per_unit': rate})

@settings_bp.route('/settings', methods=['POST'])
def update_settings():
    data = request.get_json() or {}
    if 'rate_per_unit' not in data:
        return jsonify({'error': 'rate_per_unit required'}), 400
    try:
        rate = float(data['rate_per_unit'])
    except (ValueError, TypeError):
        return jsonify({'error': 'rate_per_unit must be a number'}), 400
    if rate <= 0:
        return jsonify({'error': 'rate_per_unit must be positive'}), 400
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
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    # EDGE-09: Reject malformed month values before passing to calendar functions
    if not re.match(r'^\d{4}-\d{2}$', month):
        return jsonify({'error': 'month must be in YYYY-MM format'}), 400
    return jsonify({
        'today_cost': get_daily_cost(today),
        'month_cost': get_monthly_cost(month),
        'projected_month_cost': project_monthly_cost(month),
        'rate_per_unit': get_rate()
    })