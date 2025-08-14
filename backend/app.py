from flask import Flask, request, jsonify, g
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from api.calculator import calculate_fire_projection
from api.tax import calculate_tax, get_tax_info, calculate_income_tax, load_tax_config
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "https://nw.derricklin.net",
    "https://fire.derricklin.net",
    "https://nw.approximator.net"
], max_age=3600)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client.fire_calculator
profiles = db.profiles

@app.before_request


def before_request():
    g.start_time = time.time()
    logger.info(f'Received {request.method} request to {request.path}')

@app.after_request


def after_request(response):
    duration = time.time() - g.start_time
    logger.info(f'Completed {request.method} request to {request.path} in {duration:.2f}s with status {response.status_code}')
    return response

@app.route('/api/calculate', methods=['POST'])


def calculate():
    data = request.json
    try:
        result = calculate_fire_projection(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f'Calculate request failed: {str(e)}')
        return jsonify({'error': str(e)}), 400

@app.route('/api/tax', methods=['POST'])


def tax():
    data = request.json
    try:
        result = calculate_tax(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/tax-info/<country_code>', methods=['GET'])


def tax_info(country_code):
    try:
        result = get_tax_info(country_code.upper())
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles', methods=['GET'])


def list_profiles():
    try:
        profiles_list = list(profiles.find({}, {'_id': 1, 'name': 1}))
        # Convert ObjectId to string for JSON serialization
        for profile in profiles_list:
            profile['_id'] = str(profile['_id'])
        return jsonify(profiles_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles', methods=['POST'])


def create_profile():
    logger.info('Received create profile request')
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        profile = {
            'name': data['name'],
            'config': data['config']
        }
        result = profiles.insert_one(profile)
        return jsonify({'id': str(result.inserted_id)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles/<profile_id>', methods=['GET'])


def get_profile_by_id(profile_id):
    try:
        profile = profiles.find_one({'_id': ObjectId(profile_id)})
        if profile:
            profile['_id'] = str(profile['_id'])
            return jsonify(profile)
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles/<profile_id>', methods=['DELETE'])


def delete_profile_by_id(profile_id):
    try:
        result = profiles.delete_one({'_id': ObjectId(profile_id)})
        if result.deleted_count > 0:
            return jsonify({'success': True})
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/us-tax-comparison', methods=['POST'])


def us_tax_comparison():
    """
    Calculate effective tax rates and after-tax income for all US states.
    Expects: { "income": number }
    Returns: Array of state tax comparisons
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        income = data.get('income', 0)

        if income <= 0:
            return jsonify({'error': 'Income must be greater than 0'}), 400

        # Load US tax configuration to get all states
        us_config = load_tax_config('US')
        states = us_config.get('states', {}) or {}

        results = []

        for state_code, state_config in states.items():
            # Calculate tax for this state (no 401k contributions as requested)
            total_available_income, effective_tax_rate, tax_breakdown = calculate_income_tax(
                income=income,
                state=state_code,
                pre_tax_401k=0,  # No 401k as requested
                employer_match=0,  # No employer match
                country_code='US'
            )

            # Get state name (using state code for now, could be enhanced with full names)
            state_name = get_state_name(state_code)

            results.append({
                'stateCode': state_code,
                'stateName': state_name,
                'effectiveRate': round(effective_tax_rate, 2),
                'afterTaxIncome': round(tax_breakdown['afterTaxIncome'], 2),
                'totalTax': round(tax_breakdown['totalTax'], 2),
                'federalTax': round(tax_breakdown['federalTax'], 2),
                'stateTax': round(tax_breakdown['stateTax'], 2),
                'payrollTax': round(tax_breakdown['socialSecurityTax'] +
                                 tax_breakdown['medicareTax'] +
                                 tax_breakdown['additionalMedicareTax'], 2)
            })

        # Sort by effective rate (lowest first)
        results.sort(key=lambda x: x['effectiveRate'])

        return jsonify(results)

    except Exception as e:
        logger.error(f'US tax comparison request failed: {str(e)}')
        return jsonify({'error': str(e)}), 400


def get_state_name(state_code):
    """Convert state code to full state name"""
    state_names = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
        'DC': 'District of Columbia'
    }
    return state_names.get(state_code, state_code)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
