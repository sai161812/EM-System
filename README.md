# EM-System — Energy Management System

A full-stack household energy monitoring platform with real-time anomaly detection, budget tracking, AI-powered advisory, and consumption insights. Built with a Flask REST API backend and a React dashboard frontend.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Anomaly Detection Rules](#anomaly-detection-rules)
- [AI Energy Advisor](#ai-energy-advisor)
- [Contributing](#contributing)

---

## Overview

EM-System ingests hourly electricity consumption readings, processes them through a multi-rule anomaly engine, tracks spending against a configurable daily budget, and surfaces actionable insights through both a rule-based insights engine and an LLM-powered advisor. All costs are denominated in Indian Rupees (₹) and calculated against a configurable per-unit rate.

---

## Features

| Feature | Description |
|---|---|
| **Live Dashboard** | Summary cards, an interactive hourly/daily energy chart, a live anomaly feed, and an insights panel |
| **Anomaly Detection** | Five deterministic rules — spike, inactive-hour, sustained overload, dropout, and weekend surge — run over the full reading history and refresh atomically |
| **Budget Tracking** | Three-stage alert system (warning → critical → exceeded) with projected breach-time estimation and a full alert history log |
| **AI Energy Advisor** | Sends live context to the Groq LLM (Llama 3.3 70B) and returns a structured JSON advisory: assessment, urgency level, key issues, recommendations, and estimated savings |
| **Insights Engine** | Generates rule-based insights including best/worst day of the week, peak hour, trend direction, and weekend-vs-weekday comparisons |
| **Cost Estimation** | Real-time daily cost, month-to-date cost, and projected month-end bill based on a configurable ₹/kWh rate |
| **Settings** | Configurable electricity rate (₹/kWh) and daily budget (₹) from the UI |
| **History Page** | Drill into any date range; view hourly breakdowns and anomaly overlays |
| **Alerts Page** | Full paginated anomaly log with severity badges and budget alert history |
| **Data Simulator** | Built-in simulator for generating realistic test readings without real hardware |

---

## Tech Stack

**Backend**
- Python 3 / Flask
- Flask-CORS
- SQLite (via the standard `sqlite3` module)
- Groq API — `llama-3.3-70b-versatile` for the AI advisor

**Frontend**
- React 19 + Vite 8
- React Router v7
- Tailwind CSS v4
- Recharts (energy charts)
- Axios (API client)
- Lucide React (icons)

---

## Project Structure

```
EM-System-main/
├── backend/
│   ├── app.py                  # Flask application entry point
│   ├── config.py               # Paths, defaults, and env loading
│   ├── models.py               # SQLite schema and db helper
│   ├── requirements.txt
│   ├── routes/
│   │   ├── advisor.py          # POST /api/advisor/analyse
│   │   ├── anomalies.py        # GET  /api/anomalies/
│   │   ├── budget.py           # GET/POST /api/budget/*
│   │   ├── energy.py           # GET  /api/energy/summary|hourly|daily
│   │   ├── health.py           # GET  /api/health
│   │   ├── insights.py         # GET  /api/insights/
│   │   ├── refresh.py          # POST /api/refresh
│   │   └── settings.py         # GET/POST /api/settings
│   └── services/
│       ├── advisor.py          # LLM prompt building and Groq API call
│       ├── anomaly_engine.py   # Five-rule detection engine
│       ├── budget_engine.py    # Stage evaluation and alert logging
│       ├── cost_estimator.py   # Daily / monthly / projected cost
│       ├── insights_engine.py  # Rule-based insights generation
│       └── simulator.py        # Test data generator
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── api/index.js       
    │   ├── components/
    │   │   ├── AnomalyFeed.jsx
    │   │   ├── BudgetAlertHistory.jsx
    │   │   ├── BudgetSettings.jsx
    │   │   ├── BudgetStatus.jsx
    │   │   ├── EnergyAdvisor.jsx
    │   │   ├── EnergyChart.jsx
    │   │   ├── ErrorBoundary.jsx
    │   │   ├── InsightsPanel.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── SummaryCards.jsx
    │   ├── pages/
    │   │   ├── Alerts.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── History.jsx
    │   │   └── Settings.jsx
    │   └── utils/
    │       ├── formatDate.js
    │       ├── severityStyles.js
    │       └── stageStyles.js
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier is sufficient for the advisor feature)

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. (Recommended) Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create the environment file (see Configuration below)
cp .env.example .env      # or create .env manually

# 5. Start the development server
python app.py
```

The API will be available at `http://localhost:5000`.

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173`. The Vite dev proxy forwards all `/api/*` requests to the Flask backend automatically.

---

## Configuration

Create a `.env` file inside the `backend/` directory:

```dotenv
# Required for the AI Energy Advisor feature
LLM_API=your_groq_api_key_here
```

Additional defaults (editable in `config.py`):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `backend/database.db` | SQLite database file location |
| `DEFAULT_RATE_PER_UNIT` | `8.0` | Default electricity rate in ₹/kWh |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model used for the advisor |

Both the electricity rate and daily budget can also be changed at runtime from the **Settings** page in the UI.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/energy/summary` | Total kWh, cost, and projected bill |
| `GET` | `/api/energy/hourly?date=YYYY-MM-DD` | Hourly readings for a given date |
| `GET` | `/api/energy/daily?month=YYYY-MM` | Daily totals for a given month |
| `GET` | `/api/anomalies/` | All detected anomalies |
| `GET` | `/api/anomalies/recent?limit=N` | N most recent anomalies |
| `GET` | `/api/insights/` | Current rule-based insights |
| `GET` | `/api/budget/status` | Today's budget stage and percent used |
| `GET` | `/api/budget/settings` | Current daily budget value |
| `POST` | `/api/budget/settings` | Update daily budget `{ "daily_budget": 250 }` |
| `GET` | `/api/budget/alerts/history` | Full budget alert log |
| `GET` | `/api/settings` | Current electricity rate |
| `POST` | `/api/settings` | Update rate `{ "rate_per_unit": 9.5 }` |
| `POST` | `/api/refresh` | Re-run anomaly detection and budget evaluation |
| `POST` | `/api/advisor/analyse` | Trigger the AI advisor and return structured advice |

---

## Anomaly Detection Rules

The anomaly engine (`services/anomaly_engine.py`) processes all stored readings in a single pass and applies five rules. Results are written atomically — the old anomaly table is replaced in one transaction, so partial states never persist.

| Rule | Trigger | Severity |
|---|---|---|
| **SPIKE** | Z-score > 2.5 (reading is 2.5+ standard deviations above the global mean) | `HIGH` if z > 3.5, else `MEDIUM` |
| **INACTIVE_HOUR** | Consumption > 1.5× the hourly average between 1 AM and 5 AM | `MEDIUM` |
| **SUSTAINED_OVERLOAD** | Three or more consecutive readings each exceeding 2× the global daily mean | `HIGH` |
| **DROPOUT** | Consumption < 0.05 kWh during active hours (8 AM – 10 PM) | `LOW` |
| **WEEKEND_SURGE** | Weekend reading exceeds 2× the average for that hour on weekends | `MEDIUM` |

---

## AI Energy Advisor

Calling `POST /api/advisor/analyse` builds a context snapshot from live database values (total/average consumption, costs, budget stage, recent anomalies, and current insights) and sends a structured prompt to the Groq API. The response is parsed into a typed JSON object:

```json
{
  "overall_assessment": "...",
  "urgency_level": "LOW | MEDIUM | HIGH",
  "key_issues": ["..."],
  "recommendations": ["..."],
  "estimated_savings": ["..."],
  "summary": "..."
}
```

The advisor requires a valid `LLM_API` key in the backend `.env` file. All other features work without it.

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feature/my-feature`).
2. Make your changes and ensure the backend starts cleanly (`python app.py`) and the frontend lints without errors (`npm run lint`).
3. Open a pull request with a clear description of the change and any relevant screenshots.

Please keep backend routes thin — business logic belongs in `services/`, not in route handlers.

---

> Built for household energy awareness. All monetary values are in Indian Rupees (₹). Electricity rate and daily budget are fully configurable from the UI.
