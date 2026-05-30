import sqlite3
from config import DATABASE_PATH, DEFAULT_RATE_PER_UNIT

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS energy_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            consumption_kwh REAL NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            rule_triggered TEXT NOT NULL,
            consumption_kwh REAL NOT NULL,
            severity TEXT NOT NULL,
            explanation TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        INSERT OR IGNORE INTO settings (key, value)
        VALUES ('rate_per_unit', ?)
    ''', (str(DEFAULT_RATE_PER_UNIT),))

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budget_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            daily_budget REAL NOT NULL DEFAULT 200.0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        INSERT OR IGNORE INTO budget_settings (id, daily_budget)
        VALUES (1, 200.0)
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budget_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            stage INTEGER NOT NULL,
            severity TEXT NOT NULL,
            amount_used REAL NOT NULL,
            daily_budget REAL NOT NULL,
            overage REAL,
            message TEXT NOT NULL,
            contributing_anomaly TEXT
        )
    ''')

    conn.commit()
    conn.close()