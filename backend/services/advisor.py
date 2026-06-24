import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import urllib.request
import urllib.error
from datetime import datetime
from config import GROQ_API_KEY, GROQ_MODEL, GROQ_API_URL
from models import get_db
from services.cost_estimator import get_rate, get_daily_cost, get_monthly_cost, project_monthly_cost
from services.insights_engine import generate_insights
from services.budget_engine import evaluate_budget, get_daily_budget

def build_context():
    today = datetime.now().strftime('%Y-%m-%d')
    month = datetime.now().strftime('%Y-%m')
    conn = get_db()

    total_row = conn.execute("SELECT SUM(consumption_kwh) as t FROM energy_readings").fetchone()
    avg_row = conn.execute('''
        SELECT AVG(daily_total) as a FROM (
            SELECT SUM(consumption_kwh) as daily_total
            FROM energy_readings GROUP BY DATE(timestamp)
        )
    ''').fetchone()

    anomaly_rows = conn.execute('''
        SELECT timestamp, rule_triggered, consumption_kwh, severity, explanation
        FROM anomalies ORDER BY timestamp DESC LIMIT 5
    ''').fetchall()
    anomalies = [dict(r) for r in anomaly_rows]

    severity_counts = conn.execute('''
        SELECT severity, COUNT(*) as count FROM anomalies GROUP BY severity
    ''').fetchall()
    severity_summary = {r['severity']: r['count'] for r in severity_counts}
    conn.close()

    rate = get_rate()
    daily_cost = get_daily_cost(today)
    monthly_cost = get_monthly_cost(month)
    projected = project_monthly_cost(month)
    budget = get_daily_budget()
    budget_status = evaluate_budget(today)
    insights = generate_insights(today)

    return {
        'date': today,
        'rate_per_unit_inr': rate,
        'total_kwh_30days': round(total_row['t'] or 0, 2),
        'avg_daily_kwh': round(avg_row['a'] or 0, 2),
        'todays_cost_inr': daily_cost,
        'monthly_cost_so_far_inr': monthly_cost,
        'projected_monthly_bill_inr': projected,
        'daily_budget_inr': budget,
        'budget_stage': budget_status['stage'],
        'budget_percent_used': budget_status['percent_used'],
        'budget_message': budget_status['message'],
        'anomaly_severity_counts': severity_summary,
        'recent_anomalies': anomalies,
        'insights': insights.get('insights', [])
    }

def build_prompt(context):
    anomaly_text = '\n'.join([
        f"  - [{a['severity']}] {a['rule_triggered']} at {a['timestamp']}: {a['explanation']}"
        for a in context['recent_anomalies']
    ]) or '  None detected recently.'

    insight_text = '\n'.join([
        f"  - {i['message']}"
        for i in context['insights']
    ]) or '  No insights available.'

    return f"""You are an expert energy efficiency advisor analyzing a household's electricity usage data.
Analyze the following real-time energy data and provide a structured advisory report.

=== ENERGY DATA ===
Date: {context['date']}
Rate: ₹{context['rate_per_unit_inr']} per kWh
Total consumption (30 days): {context['total_kwh_30days']} kWh
Average daily consumption: {context['avg_daily_kwh']} kWh
Today's cost so far: ₹{context['todays_cost_inr']}
Monthly cost so far: ₹{context['monthly_cost_so_far_inr']}
Projected monthly bill: ₹{context['projected_monthly_bill_inr']}
Daily budget: ₹{context['daily_budget_inr']}
Budget used: {context['budget_percent_used']}% (Stage {context['budget_stage']}/3)

=== ANOMALY SUMMARY ===
Severity counts: {context['anomaly_severity_counts']}
Recent anomalies:
{anomaly_text}

=== CONSUMPTION INSIGHTS ===
{insight_text}

=== YOUR TASK ===
Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON.
Use this exact structure:
{{
  "overall_assessment": "One clear sentence verdict on energy health status.",
  "urgency_level": "LOW or MEDIUM or HIGH",
  "key_issues": [
    "Issue 1 — specific and data-driven",
    "Issue 2 — specific and data-driven",
    "Issue 3 — specific and data-driven"
  ],
  "recommendations": [
    "Recommendation 1 — actionable, specific, prioritised",
    "Recommendation 2 — actionable, specific, prioritised",
    "Recommendation 3 — actionable, specific, prioritised"
  ],
  "estimated_savings": [
    "If you fix X, you could save approximately ₹Y per month",
    "Reducing usage during Z hours could save ₹W per month"
  ],
  "summary": "Two to three sentence overall summary with specific numbers from the data."
}}"""

def call_groq(prompt):
    if not GROQ_API_KEY:
        raise ValueError("GROQ API key not configured. Check backend/.env file.")

    payload = json.dumps({
        'model': GROQ_MODEL,
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.3,
        'max_tokens': 2048
    }).encode('utf-8')

    req = urllib.request.Request(
        GROQ_API_URL,
        data=payload,
        headers={
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            raw_text = result['choices'][0]['message']['content'].strip()
            # Robustly extract JSON: find the first '{' and last '}' and parse
            # whatever is between them. Handles no fences, ```json fences,
            # fences with preamble/postamble text, and bare JSON.
            start = raw_text.find('{')
            end = raw_text.rfind('}')
            if start == -1 or end == -1 or end <= start:
                raise RuntimeError(f"No JSON object found in Groq response: {raw_text[:200]}")
            return json.loads(raw_text[start:end + 1])
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise RuntimeError(f"Groq API error {e.code}: {error_body}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Could not reach Groq API: {str(e.reason)}. Check your internet connection and that api.groq.com is accessible.")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Groq response as JSON: {str(e)}")

def run_analysis():
    context = build_context()
    prompt = build_prompt(context)
    advice = call_groq(prompt)
    return {
        'advice': advice,
        'context_snapshot': {
            'date': context['date'],
            'total_kwh': context['total_kwh_30days'],
            'projected_bill': context['projected_monthly_bill_inr'],
            'budget_stage': context['budget_stage'],
            'anomaly_counts': context['anomaly_severity_counts']
        }
    }
