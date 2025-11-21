from flask import Flask, request, jsonify, g
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import logging
import os
import time

from api.calculator import calculate_fire_projection
from api.tax import (
    calculate_tax,
    get_tax_info,
    calculate_income_tax,
    load_tax_config,
)
from api.retirement import calculate_retirement_projection
from api.db import save_profile, get_profiles, get_profile, delete_profile
from api.validation import (
    validate_calculate_payload,
    validate_tax_payload,
    validate_us_tax_comparison_payload,
)


def create_app() -> Flask:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    app = Flask(__name__)

    # Config
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 1_000_000))
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
    app.config['ENABLE_PROFILES'] = os.getenv('ENABLE_PROFILES', 'false').lower() == 'true'

    cors_origins = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:5173,https://nw.derricklin.net,https://fire.derricklin.net,https://nw.approximator.net',
    ).split(',')
    CORS(app, origins=[o.strip() for o in cors_origins if o.strip()], max_age=3600)

    @app.before_request
    def _before_request():
        g.start_time = time.time()
        logger.info(f'Received {request.method} request to {request.path}')

    @app.after_request
    def _after_request(response):
        duration = time.time() - g.start_time
        logger.info(
            f'Completed {request.method} request to {request.path} in {duration:.2f}s with status {response.status_code}'
        )
        return response

    @app.errorhandler(HTTPException)
    def _handle_http_exception(err: HTTPException):
        return jsonify({'error': err.description or 'HTTP error', 'code': err.code}), err.code

    @app.errorhandler(Exception)
    def _handle_exception(err: Exception):
        logger.exception('Unhandled error')
        return jsonify({'error': 'Internal server error'}), 500

    @app.post('/api/calculate')
    def calculate():
        data = request.get_json(silent=True) or {}
        try:
            validate_calculate_payload(data)
            result = calculate_fire_projection(data)
            return jsonify(result)
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
        except Exception:
            raise

    @app.post('/api/tax')
    def tax():
        data = request.get_json(silent=True) or {}
        try:
            validate_tax_payload(data)
            result = calculate_tax(data)
            return jsonify(result)
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
        except Exception:
            raise

    @app.get('/api/tax-info/<country_code>')
    def tax_info(country_code):
        try:
            result = get_tax_info(country_code.upper())
            return jsonify(result)
        except Exception:
            raise

    @app.post('/api/retirement')
    def retirement():
        """
        Calculate retirement projection with detailed account tracking.
        Expects: { currentAge, retirementAge, endAge, traditionalIRA, rothIRA, 
                   traditional401k, roth401k, taxableAccounts, annualIncome, 
                   annualSpending, annualReturn, inflationRate, state, 
                   filingStatus, socialSecurityClaimAge }
        Returns: Detailed projection with account balances and withdrawals
        """
        data = request.get_json(silent=True) or {}
        try:
            # Basic validation
            required_fields = ['currentAge', 'retirementAge', 'endAge', 'annualSpending', 
                             'annualReturn', 'inflationRate']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            result = calculate_retirement_projection(data)
            return jsonify(result)
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
        except Exception:
            raise

    @app.get('/api/profiles')
    def list_profiles():
        if not app.config['ENABLE_PROFILES']:
            return jsonify({'error': 'Profiles are disabled'}), 501
        try:
            profiles_list = get_profiles()
            for p in profiles_list:
                p['_id'] = str(p['_id'])
            return jsonify(profiles_list)
        except Exception:
            raise

    @app.post('/api/profiles')
    def create_profile_route():
        if not app.config['ENABLE_PROFILES']:
            return jsonify({'error': 'Profiles are disabled'}), 501
        data = request.get_json(silent=True) or {}
        name = data.get('name')
        config = data.get('config')
        if not name or config is None:
            return jsonify({'error': 'name and config are required'}), 400
        try:
            profile_id = save_profile(name, config)
            return jsonify({'id': profile_id})
        except Exception:
            raise

    @app.get('/api/profiles/<profile_id>')
    def get_profile_by_id(profile_id):
        if not app.config['ENABLE_PROFILES']:
            return jsonify({'error': 'Profiles are disabled'}), 501
        try:
            profile = get_profile(profile_id)
            if profile:
                return jsonify(profile)
            return jsonify({'error': 'Profile not found'}), 404
        except Exception:
            raise

    @app.delete('/api/profiles/<profile_id>')
    def delete_profile_by_id(profile_id):
        if not app.config['ENABLE_PROFILES']:
            return jsonify({'error': 'Profiles are disabled'}), 501
        try:
            ok = delete_profile(profile_id)
            if ok:
                return jsonify({'success': True})
            return jsonify({'error': 'Profile not found'}), 404
        except Exception:
            raise

    @app.post('/api/us-tax-comparison')
    def us_tax_comparison():
        """
        Calculate effective tax rates and after-tax income for all US states.
        Expects: { "income": number, "filing_status": "single|married|compare", "partner_income": number (optional) }
        Returns: Array of state tax comparisons
        """
        try:
            data = request.get_json(silent=True) or {}
            validate_us_tax_comparison_payload(data)
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            income = data.get('income', 0)
            partner_income = data.get('partner_income', 0)
            filing_status = data.get('filing_status', 'single')

            if income <= 0:
                return jsonify({'error': 'Income must be greater than 0'}), 400

            us_config = load_tax_config('US')
            states = us_config.get('states', {}) or {}

            results = []

            for state_code in states.keys():
                if filing_status == 'compare':
                    # Single
                    total_income = income + partner_income if partner_income > 0 else income
                    if partner_income > 0:
                        _, _, t1 = calculate_income_tax(income, state_code, 0, 0, 'US', 'single')
                        _, _, t2 = calculate_income_tax(partner_income, state_code, 0, 0, 'US', 'single')
                        single_breakdown = {
                            'afterTaxIncome': t1['afterTaxIncome'] + t2['afterTaxIncome'],
                            'totalTax': t1['totalTax'] + t2['totalTax'],
                            'federalTax': t1['federalTax'] + t2['federalTax'],
                            'stateTax': t1['stateTax'] + t2['stateTax'],
                            'socialSecurityTax': t1['socialSecurityTax'] + t2['socialSecurityTax'],
                            'medicareTax': t1['medicareTax'] + t2['medicareTax'],
                            'additionalMedicareTax': t1['additionalMedicareTax'] + t2['additionalMedicareTax'],
                        }
                        single_effective_rate = (single_breakdown['totalTax'] / total_income) * 100
                    else:
                        _, single_effective_rate, single_breakdown = calculate_income_tax(
                            income, state_code, 0, 0, 'US', 'single'
                        )

                    # Married
                    if partner_income > 0:
                        _, _, combined = calculate_income_tax(total_income, state_code, 0, 0, 'US', 'married')
                        _, _, s1 = calculate_income_tax(income, state_code, 0, 0, 'US', 'single')
                        _, _, s2 = calculate_income_tax(partner_income, state_code, 0, 0, 'US', 'single')
                        married_breakdown = {
                            'afterTaxIncome': combined['afterTaxIncome'],
                            'federalTax': combined['federalTax'],
                            'stateTax': combined['stateTax'],
                            'medicareTax': combined['medicareTax'],
                            'additionalMedicareTax': combined['additionalMedicareTax'],
                            'socialSecurityTax': s1['socialSecurityTax'] + s2['socialSecurityTax'],
                        }
                        married_breakdown['totalTax'] = (
                            married_breakdown['federalTax'] + married_breakdown['stateTax'] +
                            married_breakdown['socialSecurityTax'] + married_breakdown['medicareTax'] +
                            married_breakdown['additionalMedicareTax']
                        )
                        married_breakdown['afterTaxIncome'] = total_income - married_breakdown['totalTax']
                        married_effective_rate = (married_breakdown['totalTax'] / total_income) * 100
                    else:
                        _, married_effective_rate, married_breakdown = calculate_income_tax(
                            income, state_code, 0, 0, 'US', 'married'
                        )

                    state_name = get_state_name(state_code)
                    results.append({
                        'stateCode': state_code,
                        'stateName': f"{state_name} 🫃 (Single)",
                        'effectiveRate': round(single_effective_rate, 2),
                        'afterTaxIncome': round(single_breakdown['afterTaxIncome'], 2),
                        'totalTax': round(single_breakdown['totalTax'], 2),
                        'federalTax': round(single_breakdown['federalTax'], 2),
                        'stateTax': round(single_breakdown['stateTax'], 2),
                        'payrollTax': round(single_breakdown['socialSecurityTax'] + single_breakdown['medicareTax'] + single_breakdown['additionalMedicareTax'], 2),
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
                        'payrollTax': round(married_breakdown['socialSecurityTax'] + married_breakdown['medicareTax'] + married_breakdown['additionalMedicareTax'], 2),
                        'filingType': 'married'
                    })
                    continue

                # Non-compare flow
                if partner_income > 0:
                    total_income = income + partner_income
                    if filing_status == 'single':
                        _, _, t1 = calculate_income_tax(income, state_code, 0, 0, 'US', 'single')
                        _, _, t2 = calculate_income_tax(partner_income, state_code, 0, 0, 'US', 'single')
                        combined = {
                            'afterTaxIncome': t1['afterTaxIncome'] + t2['afterTaxIncome'],
                            'federalTax': t1['federalTax'] + t2['federalTax'],
                            'stateTax': t1['stateTax'] + t2['stateTax'],
                            'socialSecurityTax': t1['socialSecurityTax'] + t2['socialSecurityTax'],
                            'medicareTax': t1['medicareTax'] + t2['medicareTax'],
                            'additionalMedicareTax': t1['additionalMedicareTax'] + t2['additionalMedicareTax'],
                        }
                        combined['totalTax'] = (
                            combined['federalTax'] + combined['stateTax'] + combined['socialSecurityTax'] +
                            combined['medicareTax'] + combined['additionalMedicareTax']
                        )
                        combined['afterTaxIncome'] = total_income - combined['totalTax']
                        effective_tax_rate = (combined['totalTax'] / total_income) * 100
                        tax_breakdown = combined
                    else:
                        _, _, combined_base = calculate_income_tax(total_income, state_code, 0, 0, 'US', 'married')
                        _, _, s1 = calculate_income_tax(income, state_code, 0, 0, 'US', 'single')
                        _, _, s2 = calculate_income_tax(partner_income, state_code, 0, 0, 'US', 'single')
                        combined = {
                            'afterTaxIncome': combined_base['afterTaxIncome'],
                            'federalTax': combined_base['federalTax'],
                            'stateTax': combined_base['stateTax'],
                            'medicareTax': combined_base['medicareTax'],
                            'additionalMedicareTax': combined_base['additionalMedicareTax'],
                            'socialSecurityTax': s1['socialSecurityTax'] + s2['socialSecurityTax'],
                        }
                        combined['totalTax'] = (
                            combined['federalTax'] + combined['stateTax'] + combined['socialSecurityTax'] +
                            combined['medicareTax'] + combined['additionalMedicareTax']
                        )
                        combined['afterTaxIncome'] = total_income - combined['totalTax']
                        effective_tax_rate = (combined['totalTax'] / total_income) * 100
                        tax_breakdown = combined
                else:
                    _, effective_tax_rate, tax_breakdown = calculate_income_tax(
                        income, state_code, 0, 0, 'US', filing_status
                    )

                state_name = get_state_name(state_code)
                results.append({
                    'stateCode': state_code,
                    'stateName': state_name,
                    'effectiveRate': round(effective_tax_rate, 2),
                    'afterTaxIncome': round(tax_breakdown['afterTaxIncome'], 2),
                    'totalTax': round(tax_breakdown['totalTax'], 2),
                    'federalTax': round(tax_breakdown['federalTax'], 2),
                    'stateTax': round(tax_breakdown['stateTax'], 2),
                    'payrollTax': round(tax_breakdown['socialSecurityTax'] + tax_breakdown['medicareTax'] + tax_breakdown['additionalMedicareTax'], 2),
                })

            results.sort(key=lambda x: x['effectiveRate'])
            return jsonify(results)

        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f'US tax comparison request failed: {str(e)}')
            raise

    return app


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


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=int(os.getenv('PORT', '5000')))

