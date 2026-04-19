import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
from datetime import datetime, timedelta
from models import get_db, init_db

def base_consumption(hour, is_weekend):
    if 0 <= hour < 5:
        return random.uniform(0.05, 0.25)
    elif 5 <= hour < 7:
        return random.uniform(0.3, 0.7)
    elif 7 <= hour < 10:
        return random.uniform(1.4, 2.2)
    elif 10 <= hour < 12:
        return random.uniform(0.8, 1.3)
    elif 12 <= hour < 14:
        return random.uniform(1.0, 1.6)
    elif 14 <= hour < 17:
        return random.uniform(0.6, 1.0)
    elif 17 <= hour < 21:
        return random.uniform(1.5, 2.5)
    elif 21 <= hour < 23:
        return random.uniform(0.8, 1.2)
    else:
        return random.uniform(0.2, 0.5)

def generate_and_store():
    init_db()
    conn = get_db()
    conn.execute("DELETE FROM energy_readings")
    conn.execute("DELETE FROM anomalies")
    conn.commit()

    start_date = datetime.now().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=29)

    readings = []

    # Pre-pick 18 random slots for anomaly injection
    all_slots = list(range(30 * 24))
    anomaly_slots = set(random.sample(all_slots, 18))

    for day in range(30):
        current_date = start_date + timedelta(days=day)
        is_weekend = current_date.weekday() >= 5

        hour = 0
        while hour < 24:
            slot = day * 24 + hour
            ts = current_date + timedelta(hours=hour)
            timestamp_str = ts.strftime('%Y-%m-%d %H:%M:%S')

            if slot in anomaly_slots:
                anomaly_type = random.choice([
                    'midnight_spike', 'sustained_high', 'near_zero_drop', 'weekend_surge'
                ])

                if anomaly_type == 'midnight_spike' and 0 <= hour <= 4:
                    value = random.uniform(3.0, 4.5)
                    readings.append((timestamp_str, round(value, 4)))
                    hour += 1

                elif anomaly_type == 'sustained_high' and hour < 21:
                    for i in range(3):
                        if hour + i < 24:
                            ts2 = current_date + timedelta(hours=hour + i)
                            readings.append((
                                ts2.strftime('%Y-%m-%d %H:%M:%S'),
                                round(random.uniform(3.5, 5.0), 4)
                            ))
                    hour += 3

                elif anomaly_type == 'near_zero_drop' and 8 <= hour <= 20:
                    readings.append((timestamp_str, round(random.uniform(0.01, 0.04), 4)))
                    hour += 1

                elif anomaly_type == 'weekend_surge' and is_weekend:
                    value = random.uniform(3.2, 4.8)
                    readings.append((timestamp_str, round(value, 4)))
                    hour += 1
                else:
                    value = base_consumption(hour, is_weekend)
                    readings.append((timestamp_str, round(value + random.uniform(-0.05, 0.05), 4)))
                    hour += 1
            else:
                value = base_consumption(hour, is_weekend)
                readings.append((timestamp_str, round(value + random.uniform(-0.05, 0.05), 4)))
                hour += 1

    conn.executemany(
        "INSERT INTO energy_readings (timestamp, consumption_kwh) VALUES (?, ?)",
        readings
    )
    conn.commit()
    conn.close()
    print(f"✅ Inserted {len(readings)} energy readings.")

if __name__ == '__main__':
    generate_and_store()
    from anomaly_engine import run_detection
    run_detection()