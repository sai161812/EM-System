from flask import Blueprint, jsonify
from services.advisor import run_analysis

advisor_bp = Blueprint('advisor', __name__)

@advisor_bp.route('/analyse', methods=['POST'])
def analyse():
    try:
        result = run_analysis()
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 502
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500
