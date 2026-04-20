import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import statistics
from datetime import datetime
from models import get_db

def run_detection():
    conn = get_db()

    # --- Read all energy readings first (no writes yet) ---
    rows = conn.execute(
        "SELECT id, timestamp, consumption_kwh FROM energy_readings ORDER BY timestamp"
    ).fetchall()

    readings = [
        {
            'id': r['id'],
            'timestamp': r['timestamp'],
            'kwh': r['consumption_kwh'],
            'dt': datetime.strptime(r['timestamp'], '%Y-%m-%d %H:%M:%S')
        }
        for r in rows
    ]

    # Build hourly average baseline (per hour-of-day)
    hour_buckets = {h: [] for h in range(24)}
    for r in readings:
        hour_buckets[r['dt'].hour].append(r['kwh'])
    hour_avg = {h: (sum(v)/len(v) if v else 0) for h, v in hour_buckets.items()}

    all_kwh = [r['kwh'] for r in readings]
    if len(all_kwh) < 2:
        conn.close()
        print('⚠️ Not enough readings for anomaly detection (need at least 2).')
        return
    global_mean = sum(all_kwh) / len(all_kwh)
    global_std = statistics.stdev(all_kwh)

    # Weekend baseline
    weekend_buckets = {h: [] for h in range(24)}
    for r in readings:
        if r['dt'].weekday() >= 5:
            weekend_buckets[r['dt'].hour].append(r['kwh'])
    weekend_avg = {h: (sum(v)/len(v) if v else 0) for h, v in weekend_buckets.items()}

    # --- Run detection entirely in memory; no DB writes yet ---
    anomalies = []
    i = 0
    while i < len(readings):
        r = readings[i]
        hour = r['dt'].hour
        kwh = r['kwh']
        flagged = False

        # Rule 1: Z-score spike
        if global_std > 0:
            z = (kwh - global_mean) / global_std
            if z > 2.5:
                ratio = round(kwh / global_mean, 1)
                anomalies.append({
                    'timestamp': r['timestamp'],
                    'rule_triggered': 'SPIKE',
                    'consumption_kwh': kwh,
                    'severity': 'HIGH' if z > 3.5 else 'MEDIUM',
                    'explanation': f"Abnormal consumption spike — {ratio}x above hourly average. Possible high-draw appliance turned on."
                })
                flagged = True

        # Rule 2: Dead-hour anomaly (1 AM – 5 AM)
        if not flagged and 1 <= hour <= 5:
            avg = hour_avg[hour]
            if avg > 0 and kwh > 1.5 * avg:
                anomalies.append({
                    'timestamp': r['timestamp'],
                    'rule_triggered': 'INACTIVE_HOUR',
                    'consumption_kwh': kwh,
                    'severity': 'MEDIUM',
                    'explanation': f"High usage at {r['dt'].strftime('%I:%M %p')} — possible unattended appliance or overnight device left on."
                })
                flagged = True

        # Rule 3: Sustained overload — 3+ consecutive readings above 2x daily mean
        if not flagged and i + 2 < len(readings):
            window = readings[i:i+3]
            if all(w['kwh'] > 2 * global_mean for w in window):
                n = 3
                while i + n < len(readings) and readings[i + n]['kwh'] > 2 * global_mean:
                    n += 1
                anomalies.append({
                    'timestamp': r['timestamp'],
                    'rule_triggered': 'SUSTAINED_OVERLOAD',
                    'consumption_kwh': kwh,
                    'severity': 'HIGH',
                    'explanation': f"Sustained high consumption for {n} consecutive hours — possible appliance malfunction or unreported high usage activity."
                })
                i += n
                continue

        # Rule 4: Near-zero dropout during active hours (8 AM – 10 PM)
        if not flagged and 8 <= hour <= 22 and kwh < 0.05:
            anomalies.append({
                'timestamp': r['timestamp'],
                'rule_triggered': 'DROPOUT',
                'consumption_kwh': kwh,
                'severity': 'LOW',
                'explanation': f"Unexpected drop in usage during active hours ({r['dt'].strftime('%I:%M %p')}) — possible outage or sensor disconnection."
            })
            flagged = True

        # Rule 5: Weekend surge
        if not flagged and r['dt'].weekday() >= 5:
            wk_avg = weekend_avg[hour]
            if wk_avg > 0 and kwh > 2 * wk_avg:
                anomalies.append({
                    'timestamp': r['timestamp'],
                    'rule_triggered': 'WEEKEND_SURGE',
                    'consumption_kwh': kwh,
                    'severity': 'MEDIUM',
                    'explanation': f"Unusual usage surge on weekend at {r['dt'].strftime('%I:%M %p')} — deviation from typical weekend pattern."
                })

        i += 1

    # --- Atomic write: DELETE old rows + INSERT new rows in one transaction ---
    # If executemany raises, rollback restores the previous anomalies intact.
    try:
        conn.execute("BEGIN")
        conn.execute("DELETE FROM anomalies")
        conn.executemany('''
            INSERT INTO anomalies (timestamp, rule_triggered, consumption_kwh, severity, explanation)
            VALUES (:timestamp, :rule_triggered, :consumption_kwh, :severity, :explanation)
        ''', anomalies)
        conn.execute("COMMIT")
        print(f"✅ Detected and stored {len(anomalies)} anomalies.")
    except Exception:
        conn.execute("ROLLBACK")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    run_detection()