import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from models import get_db

def get_date_range_avg(start_date, end_date, conn=None):
    _close = conn is None
    if _close:
        conn = get_db()
    row = conn.execute('''
        SELECT AVG(daily_total) as avg FROM (
            SELECT SUM(consumption_kwh) as daily_total
            FROM energy_readings
            WHERE DATE(timestamp) BETWEEN ? AND ?
            GROUP BY DATE(timestamp)
        )
    ''', (start_date, end_date)).fetchone()
    if _close:
        conn.close()
    return round(row['avg'] or 0, 2)

def get_day_total(date_str, conn=None):
    _close = conn is None
    if _close:
        conn = get_db()
    row = conn.execute('''
        SELECT SUM(consumption_kwh) as total
        FROM energy_readings
        WHERE DATE(timestamp) = ?
    ''', (date_str,)).fetchone()
    if _close:
        conn.close()
    return round(row['total'] or 0, 2)

def get_worst_day_this_week(today_str, conn=None):
    today = datetime.strptime(today_str, '%Y-%m-%d')
    week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
    _close = conn is None
    if _close:
        conn = get_db()
    row = conn.execute('''
        SELECT DATE(timestamp) as date, SUM(consumption_kwh) as total
        FROM energy_readings
        WHERE DATE(timestamp) BETWEEN ? AND ?
        GROUP BY DATE(timestamp)
        ORDER BY total DESC
        LIMIT 1
    ''', (week_start, today_str)).fetchone()
    if _close:
        conn.close()
    return dict(row) if row else None

def get_best_day_this_week(today_str, conn=None):
    today = datetime.strptime(today_str, '%Y-%m-%d')
    week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
    _close = conn is None
    if _close:
        conn = get_db()
    row = conn.execute('''
        SELECT DATE(timestamp) as date, SUM(consumption_kwh) as total
        FROM energy_readings
        WHERE DATE(timestamp) BETWEEN ? AND ?
        GROUP BY DATE(timestamp)
        ORDER BY total ASC
        LIMIT 1
    ''', (week_start, today_str)).fetchone()
    if _close:
        conn.close()
    return dict(row) if row else None

def get_peak_hour_today(date_str, conn=None):
    _close = conn is None
    if _close:
        conn = get_db()
    row = conn.execute('''
        SELECT timestamp, consumption_kwh
        FROM energy_readings
        WHERE DATE(timestamp) = ?
        ORDER BY consumption_kwh DESC
        LIMIT 1
    ''', (date_str,)).fetchone()
    if _close:
        conn.close()
    if not row:
        return None
    dt = datetime.strptime(row['timestamp'], '%Y-%m-%d %H:%M:%S')
    return {
        'time': dt.strftime('%I:%M %p'),
        'consumption_kwh': round(row['consumption_kwh'], 2)
    }

def get_anomaly_count(date_str, conn=None):
    _close = conn is None
    if _close:
        conn = get_db()
    row = conn.execute('''
        SELECT COUNT(*) as count FROM anomalies
        WHERE DATE(timestamp) = ?
    ''', (date_str,)).fetchone()
    if _close:
        conn.close()
    return row['count'] if row else 0

def generate_insights(date_str=None):
    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')

    today = datetime.strptime(date_str, '%Y-%m-%d')
    yesterday_str = (today - timedelta(days=1)).strftime('%Y-%m-%d')
    seven_days_ago = (today - timedelta(days=7)).strftime('%Y-%m-%d')

    # LOGIC-08: Use a single connection for all helper calls
    conn = get_db()
    try:
        today_total = get_day_total(date_str, conn)
        yesterday_total = get_day_total(yesterday_str, conn)
        seven_day_avg = get_date_range_avg(seven_days_ago, yesterday_str, conn)
        thirty_day_avg = get_date_range_avg(
            (today - timedelta(days=30)).strftime('%Y-%m-%d'),
            yesterday_str,
            conn
        )
        worst_day = get_worst_day_this_week(date_str, conn)
        best_day = get_best_day_this_week(date_str, conn)
        peak_hour = get_peak_hour_today(date_str, conn)
        anomaly_count = get_anomaly_count(date_str, conn)
    finally:
        conn.close()

    insights = []

    # Insight 1: vs yesterday
    if yesterday_total > 0:
        diff = round(((today_total - yesterday_total) / yesterday_total) * 100, 1)
        direction = "more" if diff > 0 else "less"
        abs_diff = abs(diff)
        insights.append({
            'type': 'VS_YESTERDAY',
            'value': diff,
            'message': f"Today you've used {abs_diff}% {direction} than yesterday ({yesterday_total} kWh)."
        })

    # Insight 2: vs 7-day average
    if seven_day_avg > 0:
        diff = round(((today_total - seven_day_avg) / seven_day_avg) * 100, 1)
        direction = "above" if diff > 0 else "below"
        abs_diff = abs(diff)
        insights.append({
            'type': 'VS_7DAY_AVG',
            'value': diff,
            'message': f"Today's usage is {abs_diff}% {direction} your 7-day average ({seven_day_avg} kWh)."
        })

    # Insight 3: vs 30-day average
    if thirty_day_avg > 0:
        diff = round(((today_total - thirty_day_avg) / thirty_day_avg) * 100, 1)
        direction = "above" if diff > 0 else "below"
        abs_diff = abs(diff)
        insights.append({
            'type': 'VS_30DAY_AVG',
            'value': diff,
            'message': f"Compared to your 30-day average, today is {abs_diff}% {direction} ({thirty_day_avg} kWh baseline)."
        })

    # Insight 4: worst day this week
    if worst_day:
        worst_dt = datetime.strptime(worst_day['date'], '%Y-%m-%d')
        day_name = worst_dt.strftime('%A')
        insights.append({
            'type': 'WORST_DAY_WEEK',
            'value': worst_day['total'],
            'message': f"{day_name} was your highest consumption day this week at {round(worst_day['total'], 2)} kWh."
        })

    # Insight 5: best day this week
    if best_day and best_day['date'] != (worst_day['date'] if worst_day else None):
        best_dt = datetime.strptime(best_day['date'], '%Y-%m-%d')
        day_name = best_dt.strftime('%A')
        insights.append({
            'type': 'BEST_DAY_WEEK',
            'value': best_day['total'],
            'message': f"{day_name} was your most efficient day this week at {round(best_day['total'], 2)} kWh."
        })

    # Insight 6: peak hour today
    if peak_hour:
        insights.append({
            'type': 'PEAK_HOUR_TODAY',
            'value': peak_hour['consumption_kwh'],
            'message': f"Your peak usage today was at {peak_hour['time']} with {peak_hour['consumption_kwh']} kWh."
        })

    # Insight 7: anomaly warning
    if anomaly_count > 0:
        insights.append({
            'type': 'ANOMALY_SUMMARY',
            'value': anomaly_count,
            'message': f"{anomaly_count} {'anomalies' if anomaly_count > 1 else 'anomaly'} detected today."
        })
    else:
        insights.append({
            'type': 'ANOMALY_SUMMARY',
            'value': 0,
            'message': "No anomalies detected today. Usage looks normal."
        })

    return {
        'date': date_str,
        'today_total_kwh': today_total,
        'seven_day_avg_kwh': seven_day_avg,
        'thirty_day_avg_kwh': thirty_day_avg,
        'insights': insights
    }