# ⚡ Energy Monitor

A full-stack energy monitoring dashboard with a **Flask** REST API backend and a **React + Vite** frontend.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Python, Flask, SQLite             |
| Frontend | React, Vite, TailwindCSS, Recharts|

---

## Project Structure

```
energy-monitor/
├── backend/          # Flask API
│   ├── app.py
│   ├── models.py
│   ├── config.py
│   ├── routes/
│   ├── services/
│   └── requirements.txt
└── frontend/         # React + Vite app
    ├── src/
    ├── public/
    └── package.json
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

### Version 0

This is just a basic version. The version serves as a backup version incase future versions fail.