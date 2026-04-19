import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
import calendar
from models import get_db

def get_rate():
    conn = get_db()
    row = conn.execute("SELECT value FROM settings WHERE key='rate_per_unit'").fetchone()
    conn.close()
    return float(row['value']) if row else 8.0

def get_cost(kwh):
    return round(kwh * get_rate(), 2)

def get_daily_cost(date_str):
    conn = get_db()
    row = conn.execute('''
        SELECT SUM(consumption_kwh) as total
        FROM energy_readings
        WHERE DATE(timestamp) = ?
    ''', (date_str,)).fetchone()
    conn.close()
    total = row['total'] if row['total'] else 0
    return round(total * get_rate(), 2)

def get_monthly_cost(month_str):
    conn = get_db()
    row = conn.execute('''
        SELECT SUM(consumption_kwh) as total
        FROM energy_readings
        WHERE strftime('%Y-%m', timestamp) = ?
    ''', (month_str,)).fetchone()
    conn.close()
    total = row['total'] if row['total'] else 0
    return round(total * get_rate(), 2)

def project_monthly_cost(month_str):

    conn = get_db()
    row = conn.execute('''
        SELECT SUM(consumption_kwh) as total,
               COUNT(DISTINCT DATE(timestamp)) as days_counted
        FROM energy_readings
        WHERE strftime('%Y-%m', timestamp) = ?
    ''', (month_str,)).fetchone()
    conn.close()

    total = row['total'] if row['total'] else 0
    days_counted = row['days_counted'] if row['days_counted'] else 1

    year, month = map(int, month_str.split('-'))
    total_days = calendar.monthrange(year, month)[1]

    daily_avg = total / days_counted
    projected_kwh = daily_avg * total_days
    return round(projected_kwh * get_rate(), 2)