import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'database.db')
DEFAULT_RATE_PER_UNIT = 8.0  # INR per kWh