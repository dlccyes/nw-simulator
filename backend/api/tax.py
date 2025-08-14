import json
import os

# Cache for loaded tax configurations
_tax_config_cache = {}


def load_tax_config(country_code='US'):
    """
    Load tax configuration for a specific country.

    Args:
        country_code: Two-letter country code (e.g., 'US', 'TW')

    Returns:
        Dictionary containing tax configuration for the country
    """
    if country_code in _tax_config_cache:
        return _tax_config_cache[country_code]

    try:
        # Get the directory where this file is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to backend directory, then into data/tax-rates
        data_dir = os.path.join(current_dir, '..', 'data', 'tax-rates')

        # Use country code directly as filename
        filename = f'{country_code}.json'
        json_path = os.path.join(data_dir, filename)

        with open(json_path, 'r') as f:
            config = json.load(f)
            _tax_config_cache[country_code] = config
            return config
    except Exception as e:
        print(f"Warning: Could not load tax rates for {country_code}: {e}")
        # Return empty configuration for unknown countries
        return {
            'federal': {'standard_deduction': 0, 'brackets': []},
            'payroll_taxes': {},
            'states': {} if country_code == 'US' else None
        }

# Load default US tax configuration
TAX_CONFIG = load_tax_config('US')




def get_tax_config(country_code='US'):
    """Get the tax configuration for a specific country"""
    return load_tax_config(country_code)


def get_federal_config(country_code='US', filing_status='single'):
    """Get federal tax configuration for a specific country and filing status"""
    config = load_tax_config(country_code)
    federal_config = config.get('federal', {})
    
    # Check if filing status specific config exists
    if filing_status in federal_config:
        return federal_config[filing_status]
    
    # Fall back to general config for backward compatibility
    return federal_config


def get_payroll_config(country_code='US'):
    """Get payroll tax configuration for a specific country"""
    config = load_tax_config(country_code)
    return config.get('payroll_taxes', {})


def get_state_config(state, country_code='US', filing_status='single'):
    """Get state/regional tax configuration for a specific country and filing status"""
    config = load_tax_config(country_code)

    # Only US has state taxes in our current implementation
    if country_code == 'US':
        states = config.get('states', {})
        state_config = states.get(state, {'standard_deduction': 0, 'brackets': []})
        
        # Check if filing status specific config exists
        if filing_status in state_config:
            return state_config[filing_status]
        
        # Fall back to general config for backward compatibility
        return state_config
    else:
        # Non-US countries don't have state taxes
        return {'standard_deduction': 0, 'brackets': []}


def calculate_tax_for_bracket(income, brackets):
    """Calculate tax based on progressive brackets"""
    tax = 0
    for bracket in brackets:
        min_income = bracket["min"]
        max_income = bracket["max"]
        rate = bracket["rate"]

        if max_income is None:  # Handle the top bracket
            if income > min_income:
                taxable_amount = income - min_income
                tax += taxable_amount * rate
        else:
            if income > min_income:
                taxable_amount = min(income - min_income, max_income - min_income)
                tax += taxable_amount * rate
    return tax


def calculate_income_tax(income, state, pre_tax_401k, employer_match, country_code='US', filing_status='single'):
    """
    Calculate income tax for the calculator.

    Args:
        income: Gross income
        state: State/region code (only used for US)
        pre_tax_401k: Pre-tax retirement contributions
        employer_match: Employer match rate (decimal)
        country_code: Two-letter country code
        filing_status: Filing status ('single' or 'married')

    Returns:
        (total_available_income, effective_tax_rate, tax_breakdown)
        where total_available_income = after_tax_income + employer_match
    """
    if income <= 0:
        return 0, 0, {}

    # Get tax configurations for the specific country
    federal_config = get_federal_config(country_code, filing_status)
    payroll_config = get_payroll_config(country_code)
    state_config = get_state_config(state, country_code, filing_status)

    # Calculate employer match amount (employer_match is already a decimal, e.g., 0.05 for 5%)
    employer_match_amount = income * employer_match

    # Calculate taxable income after deductions
    federal_standard_deduction = federal_config.get('standard_deduction', 0)
    state_standard_deduction = state_config.get('standard_deduction', 0)

    federal_taxable_income = max(0, income - pre_tax_401k - federal_standard_deduction)
    state_taxable_income = max(0, income - pre_tax_401k - state_standard_deduction)

    # Calculate federal tax
    federal_brackets = federal_config.get('brackets', [])
    federal_tax = calculate_tax_for_bracket(federal_taxable_income, federal_brackets)

    # Calculate state tax
    state_brackets = state_config.get('brackets', [])
    state_tax = calculate_tax_for_bracket(state_taxable_income, state_brackets)

    # Calculate payroll taxes (implementation varies by country)
    social_security_tax = 0
    medicare_tax = 0
    additional_medicare_tax = 0

    if country_code == 'US':
        # US payroll taxes
        social_security_config = payroll_config.get('social_security', {})
        medicare_config = payroll_config.get('medicare', {})

        social_security_rate = social_security_config.get('rate', 0)
        social_security_wage_base = social_security_config.get('wage_base', 0)
        medicare_rate = medicare_config.get('rate', 0)
        medicare_additional_rate = medicare_config.get('additional_rate', 0)
        
        # Use different threshold for married filing jointly
        if filing_status == 'married':
            medicare_additional_threshold = medicare_config.get('additional_threshold_married', medicare_config.get('additional_threshold', 0))
        else:
            medicare_additional_threshold = medicare_config.get('additional_threshold', 0)

        social_security_tax = min(income * social_security_rate, social_security_wage_base * social_security_rate)
        medicare_tax = income * medicare_rate
        additional_medicare_tax = max(0, income - medicare_additional_threshold) * medicare_additional_rate

    elif country_code == 'TW':
        # Taiwan payroll taxes (direct deductions from payroll)
        labor_insurance_config = payroll_config.get('labor_insurance', {})
        health_insurance_config = payroll_config.get('health_insurance', {})

        # Labor insurance - direct rate on income
        labor_insurance_rate = labor_insurance_config.get('rate', 0)
        social_security_tax = income * labor_insurance_rate

        # Health insurance - rate with annual cap
        health_insurance_rate = health_insurance_config.get('rate', 0)
        health_insurance_cap = health_insurance_config.get('annual_cap', 0)
        health_insurance_tax = income * health_insurance_rate
        if health_insurance_cap > 0:
            health_insurance_tax = min(health_insurance_tax, health_insurance_cap)
        medicare_tax = health_insurance_tax

    # Add other countries' payroll tax calculations here as needed

    total_tax = federal_tax + state_tax + social_security_tax + medicare_tax + additional_medicare_tax
    after_tax_income = income - total_tax

    # Calculate total available income (after-tax + employer match)
    total_available_income = after_tax_income + employer_match_amount

    # Calculate effective tax rate
    effective_tax_rate = (total_tax / income) * 100 if income > 0 else 0

    # Adjust field names based on country for better clarity
    if country_code == 'TW':
        tax_breakdown = {
            'federalTax': federal_tax,
            'stateTax': state_tax,
            'laborInsuranceTax': social_security_tax,  # Taiwan: Labor Insurance
            'healthInsuranceTax': medicare_tax,        # Taiwan: Health Insurance
            'additionalMedicareTax': additional_medicare_tax,
            'totalTax': total_tax,
            'afterTaxIncome': after_tax_income,
            'employerMatch': employer_match_amount
        }
    else:
        tax_breakdown = {
            'federalTax': federal_tax,
            'stateTax': state_tax,
            'socialSecurityTax': social_security_tax,
            'medicareTax': medicare_tax,
            'additionalMedicareTax': additional_medicare_tax,
            'totalTax': total_tax,
            'afterTaxIncome': after_tax_income,
            'employerMatch': employer_match_amount
        }

    return total_available_income, effective_tax_rate, tax_breakdown


def calculate_tax(data):
    """Legacy API function for backward compatibility"""
    income = data['income']
    state = data['state']
    pre_tax_401k = data.get('preTax401k', 0)
    country_code = data.get('country', 'US')

    _, _, tax_breakdown = calculate_income_tax(income, state, pre_tax_401k, 0, country_code)

    # For the old API, return after-tax income without employer match
    after_tax_income = tax_breakdown['afterTaxIncome']

    # Handle country-specific field names
    if country_code == 'TW':
        return {
            'federalTax': tax_breakdown['federalTax'],
            'stateTax': tax_breakdown['stateTax'],
            'laborInsuranceTax': tax_breakdown.get('laborInsuranceTax', 0),
            'healthInsuranceTax': tax_breakdown.get('healthInsuranceTax', 0),
            'additionalMedicareTax': tax_breakdown['additionalMedicareTax'],
            'totalTax': tax_breakdown['totalTax'],
            'afterTaxIncome': after_tax_income
        }
    else:
        return {
            'federalTax': tax_breakdown['federalTax'],
            'stateTax': tax_breakdown['stateTax'],
            'socialSecurityTax': tax_breakdown.get('socialSecurityTax', 0),
            'medicareTax': tax_breakdown.get('medicareTax', 0),
            'additionalMedicareTax': tax_breakdown['additionalMedicareTax'],
            'totalTax': tax_breakdown['totalTax'],
            'afterTaxIncome': after_tax_income
        }


def get_tax_info(country_code='US'):
    """
    Get tax configuration info for API exposure.
    Returns tax brackets, deductions, and payroll tax info for display.
    """
    try:
        config = load_tax_config(country_code)

        # Format the response for frontend consumption
        tax_info = {
            'country': country_code,
            'federal': config.get('federal', {}),
            'payroll_taxes': config.get('payroll_taxes', {}),
            'states': config.get('states', {}) if country_code == 'US' else None
        }

        return tax_info
    except Exception as e:
        print(f"Error getting tax info for {country_code}: {e}")
        return {
            'country': country_code,
            'federal': {'standard_deduction': 0, 'brackets': []},
            'payroll_taxes': {},
            'states': {} if country_code == 'US' else None
        }
