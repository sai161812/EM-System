import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from models import get_db
from services.cost_estimator import get_rate

def get_daily_budget():
    conn = get_db()
    row = conn.execute("SELECT daily_budget FROM budget_settings WHERE id = 1").fetchone()
    conn.close()
    return float(row['daily_budget']) if row else 200.0

def set_daily_budget(amount):
    conn = get_db()
    conn.execute("UPDATE budget_settings SET daily_budget = ? WHERE id = 1", (amount,))
    conn.commit()
    conn.close()

def get_projected_breach_time(cost_so_far, budget, date_str):
    """
    Based on spend so far and hours elapsed,
    project what time the budget will be breached today.
    """
    now = datetime.now()
    hours_elapsed = now.hour + (now.minute / 60) or 1
    burn_rate_per_hour = cost_so_far / hours_elapsed  # ₹ per hour

    if burn_rate_per_hour <= 0:
        return None

    remaining = budget - cost_so_far
    hours_until_breach = remaining / burn_rate_per_hour
    breach_time = now + timedelta(hours=hours_until_breach)

    if breach_time.date() > now.date():
        return None  # won't breach today

    return breach_time.strftime('%I:%M %p')

def get_contributing_anomaly(date_str):
    """
    Find the highest-cost anomaly for today to explain the budget stage.
    """
    conn = get_db()
    row = conn.execute('''
        SELECT a.timestamp, a.explanation, a.consumption_kwh
        FROM anomalies a
        WHERE DATE(a.timestamp) = ?
        ORDER BY a.consumption_kwh DESC
        LIMIT 1
    ''', (date_str,)).fetchone()
    conn.close()

    if not row:
        return None

    rate = get_rate()
    cost = round(row['consumption_kwh'] * rate, 2)
    time_str = datetime.strptime(row['timestamp'], '%Y-%m-%d %H:%M:%S').strftime('%I:%M %p')
    return f"Spike at {time_str} contributed ₹{cost} of excess cost."

def evaluate_budget(date_str=None):
    """
    Core engine. Evaluates current day spend against budget.
    Returns current stage (0=safe, 1=warning, 2=critical, 3=breached)
    and a full alert object.
    """
    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')

    conn = get_db()
    row = conn.execute('''
        SELECT SUM(consumption_kwh) as total
        FROM energy_readings
        WHERE DATE(timestamp) = ?
    ''', (date_str,)).fetchone()
    conn.close()

    total_kwh = row['total'] if row['total'] else 0
    rate = get_rate()
    cost_so_far = round(total_kwh * rate, 2)
    budget = get_daily_budget()
    percent_used = (cost_so_far / budget * 100) if budget > 0 else 0

    stage = 0
    severity = 'SAFE'
    message = None
    overage = None
    contributing = None

    if percent_used >= 100:
        stage = 3
        severity = 'CRITICAL'
        overage = round(cost_so_far - budget, 2)
        contributing = get_contributing_anomaly(date_str)
        message = (
            f"🚨 Daily budget exceeded by ₹{overage}. "
            f"You're ₹{overage} over your ₹{budget} limit."
        )
        if contributing:
            message += f" {contributing}"

    elif percent_used >= 90:
        stage = 2
        severity = 'HIGH'
        remaining = round(budget - cost_so_far, 2)
        breach_time = get_projected_breach_time(cost_so_far, budget, date_str)
        message = (
            f"🔴 Only ₹{remaining} left in today's budget."
        )
        if breach_time:
            message += f" At current rate, limit hits by {breach_time}."

    elif percent_used >= 70:
        stage = 1
        severity = 'LOW'
        message = (
            f"⚠️ You've used ₹{cost_so_far} of your ₹{budget} daily budget. "
            f"Moderate your usage."
        )

    return {
        'stage': stage,
        'severity': severity,
        'daily_budget': budget,
        'amount_used': cost_so_far,
        'percent_used': round(percent_used, 1),
        'overage': overage,
        'message': message,
        'contributing_anomaly': contributing,
        'date': date_str
    }

def store_budget_alert(alert):
    """Store alert in DB only if stage > 0 and not already stored for this stage today."""
    if alert['stage'] == 0:
        return

    conn = get_db()
    existing = conn.execute('''
        SELECT id FROM budget_alerts
        WHERE DATE(timestamp) = ? AND stage = ?
    ''', (alert['date'], alert['stage'])).fetchone()

    if not existing:
        conn.execute('''
            INSERT INTO budget_alerts
            (timestamp, stage, severity, amount_used, daily_budget, overage, message, contributing_anomaly)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            alert['stage'],
            alert['severity'],
            alert['amount_used'],
            alert['daily_budget'],
            alert['overage'],
            alert['message'],
            alert['contributing_anomaly']
        ))
        conn.commit()

    conn.close()