from flask import Blueprint, jsonify, request
from datetime import datetime
from services.insights_engine import generate_insights

insights_bp = Blueprint('insights', __name__)

@insights_bp.route('/', methods=['GET'], strict_slashes=False)
def get_insights():
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        data = generate_insights(date)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500