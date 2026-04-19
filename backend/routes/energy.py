from flask import Blueprint, jsonify, request
from models import get_db

energy_bp = Blueprint('energy', __name__)

@energy_bp.route('/hourly', methods=['GET'])
def get_hourly():
    date = request.args.get('date')
    if not date:
        return jsonify({'error': 'date param required (YYYY-MM-DD)'}), 400
    conn = get_db()
    rows = conn.execute('''
        SELECT timestamp, consumption_kwh
        FROM energy_readings
        WHERE DATE(timestamp) = ?
        ORDER BY timestamp
    ''', (date,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@energy_bp.route('/daily', methods=['GET'])
def get_daily():
    month = request.args.get('month')
    if not month:
        return jsonify({'error': 'month param required (YYYY-MM)'}), 400
    conn = get_db()
    rows = conn.execute('''
        SELECT DATE(timestamp) as date, SUM(consumption_kwh) as total_kwh
        FROM energy_readings
        WHERE strftime('%Y-%m', timestamp) = ?
        GROUP BY DATE(timestamp)
        ORDER BY date
    ''', (month,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@energy_bp.route('/summary', methods=['GET'])
def get_summary():
    conn = get_db()

    total = conn.execute("SELECT SUM(consumption_kwh) as t FROM energy_readings").fetchone()
    avg = conn.execute('''
        SELECT AVG(daily_total) as a FROM (
            SELECT SUM(consumption_kwh) as daily_total
            FROM energy_readings GROUP BY DATE(timestamp)
        )
    ''').fetchone()
    peak_hour = conn.execute('''
        SELECT timestamp, consumption_kwh
        FROM energy_readings
        ORDER BY consumption_kwh DESC LIMIT 1
    ''').fetchone()
    peak_day = conn.execute('''
        SELECT DATE(timestamp) as date, SUM(consumption_kwh) as total
        FROM energy_readings
        GROUP BY DATE(timestamp)
        ORDER BY total DESC LIMIT 1
    ''').fetchone()

    conn.close()
    return jsonify({
        'total_kwh': round(total['t'] or 0, 2),
        'avg_daily_kwh': round(avg['a'] or 0, 2),
        'peak_hour': dict(peak_hour) if peak_hour else {},
        'peak_day': dict(peak_day) if peak_day else {}
    })