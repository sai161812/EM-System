from flask import Blueprint, jsonify, request
from datetime import datetime
from services.anomaly_engine import run_detection
from services.budget_engine import evaluate_budget, store_budget_alert
from services.insights_engine import generate_insights

refresh_bp = Blueprint('refresh', __name__)

@refresh_bp.route('/refresh', methods=['POST'])
def refresh():
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))

        # Step 1: Re-run anomaly detection on all data
        run_detection()

        # Step 2: Re-evaluate budget for today
        alert = evaluate_budget(date)
        store_budget_alert(alert)

        # Step 3: Regenerate insights
        insights = generate_insights(date)

        return jsonify({
            'message': 'System refreshed successfully.',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'budget_stage': alert['stage'],
            'budget_message': alert['message'] or '',
            'anomaly_count': next((i['value'] for i in insights['insights'] if i['type'] == 'ANOMALY_SUMMARY'), 0),
            'insights_generated': len(insights['insights'])
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500