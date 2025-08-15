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
    Expects: { 
        "income": number, 
        "filing_status": "single|married", 
        "partner_income": number (optional)
    }
    Returns: Array of state tax comparisons
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        income = data.get('income', 0)
        partner_income = data.get('partner_income', 0)
        filing_status = data.get('filing_status', 'single')

        if income <= 0:
            return jsonify({'error': 'Income must be greater than 0'}), 400

        # Load US tax configuration to get all states
        us_config = load_tax_config('US')
        states = us_config.get('states', {}) or {}

        results = []

        for state_code, state_config in states.items():
            if filing_status == 'compare':
                # Compare mode: calculate both single and married filing
                total_income = income + partner_income if partner_income > 0 else income
                
                # Calculate single filing
                if partner_income > 0:
                    # Two separate single calculations
                    _, _, tax_breakdown1_single = calculate_income_tax(
                        income=income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'
                    )
                    
                    _, _, tax_breakdown2_single = calculate_income_tax(
                        income=partner_income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'
                    )
                    
                    # Sum single filing results
                    single_breakdown = {
                        'afterTaxIncome': tax_breakdown1_single['afterTaxIncome'] + tax_breakdown2_single['afterTaxIncome'],
                        'totalTax': tax_breakdown1_single['totalTax'] + tax_breakdown2_single['totalTax'],
                        'federalTax': tax_breakdown1_single['federalTax'] + tax_breakdown2_single['federalTax'],
                        'stateTax': tax_breakdown1_single['stateTax'] + tax_breakdown2_single['stateTax'],
                        'socialSecurityTax': tax_breakdown1_single['socialSecurityTax'] + tax_breakdown2_single['socialSecurityTax'],
                        'medicareTax': tax_breakdown1_single['medicareTax'] + tax_breakdown2_single['medicareTax'],
                        'additionalMedicareTax': tax_breakdown1_single['additionalMedicareTax'] + tax_breakdown2_single['additionalMedicareTax']
                    }
                    single_effective_rate = (single_breakdown['totalTax'] / total_income) * 100
                else:
                    # Single person
                    _, single_effective_rate, single_breakdown = calculate_income_tax(
                        income=income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'
                    )
                
                # Calculate married filing jointly
                if partner_income > 0:
                    # Use combined income for married but calculate SS individually
                    _, _, combined_tax_breakdown = calculate_income_tax(
                        income=total_income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='married'
                    )
                    
                    # Get individual SS calculations
                    _, _, tax_breakdown1_ss = calculate_income_tax(
                        income=income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'
                    )
                    
                    _, _, tax_breakdown2_ss = calculate_income_tax(
                        income=partner_income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'
                    )
                    
                    # Use combined calculation but replace SS with individual calculations
                    married_breakdown = {
                        'afterTaxIncome': combined_tax_breakdown['afterTaxIncome'],
                        'federalTax': combined_tax_breakdown['federalTax'],
                        'stateTax': combined_tax_breakdown['stateTax'],
                        'medicareTax': combined_tax_breakdown['medicareTax'],
                        'additionalMedicareTax': combined_tax_breakdown['additionalMedicareTax'],
                        'socialSecurityTax': tax_breakdown1_ss['socialSecurityTax'] + tax_breakdown2_ss['socialSecurityTax']
                    }
                    
                    # Recalculate total tax and after-tax income
                    married_breakdown['totalTax'] = (
                        married_breakdown['federalTax'] + 
                        married_breakdown['stateTax'] + 
                        married_breakdown['socialSecurityTax'] + 
                        married_breakdown['medicareTax'] + 
                        married_breakdown['additionalMedicareTax']
                    )
                    married_breakdown['afterTaxIncome'] = total_income - married_breakdown['totalTax']
                    married_effective_rate = (married_breakdown['totalTax'] / total_income) * 100
                else:
                    # Single person filed as married
                    _, married_effective_rate, married_breakdown = calculate_income_tax(
                        income=income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='married'
                    )
                
                # Get state name
                state_name = get_state_name(state_code)
                
                # Return both single and married results as separate entries
                results.append({
                    'stateCode': state_code,
                    'stateName': f"{state_name} 🫃 (Single)",
                    'effectiveRate': round(single_effective_rate, 2),
                    'afterTaxIncome': round(single_breakdown['afterTaxIncome'], 2),
                    'totalTax': round(single_breakdown['totalTax'], 2),
                    'federalTax': round(single_breakdown['federalTax'], 2),
                    'stateTax': round(single_breakdown['stateTax'], 2),
                    'payrollTax': round(single_breakdown['socialSecurityTax'] +
                                     single_breakdown['medicareTax'] +
                                     single_breakdown['additionalMedicareTax'], 2),
                    'filingType': 'single'
                })
                
                results.append({
                    'stateCode': state_code,
                    'stateName': f"{state_name} 👩‍❤️‍👩 (Married)",
                    'effectiveRate': round(married_effective_rate, 2),
                    'afterTaxIncome': round(married_breakdown['afterTaxIncome'], 2),
                    'totalTax': round(married_breakdown['totalTax'], 2),
                    'federalTax': round(married_breakdown['federalTax'], 2),
                    'stateTax': round(married_breakdown['stateTax'], 2),
                    'payrollTax': round(married_breakdown['socialSecurityTax'] +
                                     married_breakdown['medicareTax'] +
                                     married_breakdown['additionalMedicareTax'], 2),
                    'filingType': 'married'
                })
                
                # Skip the rest of the loop for compare mode
                continue
                
            elif partner_income > 0:
                # Handle partner income calculations
                if filing_status == 'single':
                    # For single filing: calculate separately and sum
                    _, _, tax_breakdown1 = calculate_income_tax(
                        income=income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status=filing_status
                    )
                    
                    _, _, tax_breakdown2 = calculate_income_tax(
                        income=partner_income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status=filing_status
                    )
                    
                    # Sum all tax components
                    combined_breakdown = {
                        'afterTaxIncome': tax_breakdown1['afterTaxIncome'] + tax_breakdown2['afterTaxIncome'],
                        'totalTax': tax_breakdown1['totalTax'] + tax_breakdown2['totalTax'],
                        'federalTax': tax_breakdown1['federalTax'] + tax_breakdown2['federalTax'],
                        'stateTax': tax_breakdown1['stateTax'] + tax_breakdown2['stateTax'],
                        'socialSecurityTax': tax_breakdown1['socialSecurityTax'] + tax_breakdown2['socialSecurityTax'],
                        'medicareTax': tax_breakdown1['medicareTax'] + tax_breakdown2['medicareTax'],
                        'additionalMedicareTax': tax_breakdown1['additionalMedicareTax'] + tax_breakdown2['additionalMedicareTax']
                    }
                    
                    total_income = income + partner_income
                    effective_tax_rate = (combined_breakdown['totalTax'] / total_income) * 100
                    
                elif filing_status == 'married':
                    # For married filing jointly: use combined income but calculate Social Security individually
                    total_income = income + partner_income
                    
                    # Calculate taxes using combined income
                    _, _, combined_tax_breakdown = calculate_income_tax(
                        income=total_income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status=filing_status
                    )
                    
                    # Calculate Social Security tax individually for each person
                    _, _, tax_breakdown1 = calculate_income_tax(
                        income=income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'  # Use single for individual SS calculation
                    )
                    
                    _, _, tax_breakdown2 = calculate_income_tax(
                        income=partner_income,
                        state=state_code,
                        pre_tax_401k=0,
                        employer_match=0,
                        country_code='US',
                        filing_status='single'  # Use single for individual SS calculation
                    )
                    
                    # Use combined tax calculation but replace Social Security with individual calculations
                    combined_breakdown = {
                        'afterTaxIncome': combined_tax_breakdown['afterTaxIncome'],
                        'federalTax': combined_tax_breakdown['federalTax'],
                        'stateTax': combined_tax_breakdown['stateTax'],
                        'medicareTax': combined_tax_breakdown['medicareTax'],
                        'additionalMedicareTax': combined_tax_breakdown['additionalMedicareTax'],
                        'socialSecurityTax': tax_breakdown1['socialSecurityTax'] + tax_breakdown2['socialSecurityTax']
                    }
                    
                    # Recalculate total tax and after-tax income with correct Social Security
                    combined_breakdown['totalTax'] = (
                        combined_breakdown['federalTax'] + 
                        combined_breakdown['stateTax'] + 
                        combined_breakdown['socialSecurityTax'] + 
                        combined_breakdown['medicareTax'] + 
                        combined_breakdown['additionalMedicareTax']
                    )
                    combined_breakdown['afterTaxIncome'] = total_income - combined_breakdown['totalTax']
                    
                    effective_tax_rate = (combined_breakdown['totalTax'] / total_income) * 100
                
                tax_breakdown = combined_breakdown
                
            else:
                # Single income calculation (existing logic)
                total_available_income, effective_tax_rate, tax_breakdown = calculate_income_tax(
                    income=income,
                    state=state_code,
                    pre_tax_401k=0,  # No 401k as requested
                    employer_match=0,  # No employer match
                    country_code='US',
                    filing_status=filing_status
                )

            # Get state name
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
