import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'database.db')
DEFAULT_RATE_PER_UNIT = 8.0

_env_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip())

GROQ_API_KEY = os.environ.get('LLM_API', '')
GROQ_MODEL = 'llama-3.3-70b-versatile'
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
