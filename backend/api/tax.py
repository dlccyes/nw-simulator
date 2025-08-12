import json
import os

# Load state tax rates from JSON file
def load_state_tax_rates():
    try:
        # Get the directory where this file is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to backend directory, then into data
        data_dir = os.path.join(current_dir, '..', 'data')
        json_path = os.path.join(data_dir, 'state_tax_rates.json')
        
        with open(json_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load state tax rates from JSON: {e}")
        # Fallback to empty rates if JSON loading fails
        return {}

# Load state tax rates
STATE_TAX_RATES = load_state_tax_rates()

# FICA constants for 2024
SOCIAL_SECURITY_WAGE_BASE = 168600
SOCIAL_SECURITY_RATE = 0.062
MEDICARE_RATE = 0.0145
MEDICARE_ADDITIONAL_RATE = 0.009
MEDICARE_ADDITIONAL_THRESHOLD = 200000

# Standard deductions
FEDERAL_STANDARD_DEDUCTION = 14600
CA_STANDARD_DEDUCTION = 5540

def calculate_tax_for_bracket(income, brackets):
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

def calculate_income_tax(income, state, pre_tax_401k, employer_match):
    """
    Calculate income tax for the calculator.
    Returns (total_available_income, effective_tax_rate, tax_breakdown)
    where total_available_income = after_tax_income + employer_match
    """
    if income <= 0:
        return 0, 0, {}
    
    # Calculate employer match amount (employer_match is already a decimal, e.g., 0.05 for 5%)
    employer_match_amount = income * employer_match
    
    # Calculate taxable income after deductions
    federal_taxable_income = max(0, income - pre_tax_401k - FEDERAL_STANDARD_DEDUCTION)
    state_taxable_income = max(0, income - pre_tax_401k - CA_STANDARD_DEDUCTION)
    
    # Calculate federal tax
    federal_tax = calculate_tax_for_bracket(federal_taxable_income, STATE_TAX_RATES.get('federal', []))
    
    # Calculate state tax
    state_tax = calculate_tax_for_bracket(state_taxable_income, STATE_TAX_RATES.get(state, []))
    
    # Calculate FICA taxes
    social_security_tax = min(income * SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_WAGE_BASE * SOCIAL_SECURITY_RATE)
    medicare_tax = income * MEDICARE_RATE
    additional_medicare_tax = max(0, income - MEDICARE_ADDITIONAL_THRESHOLD) * MEDICARE_ADDITIONAL_RATE
    
    total_tax = federal_tax + state_tax + social_security_tax + medicare_tax + additional_medicare_tax
    after_tax_income = income - total_tax
    
    # Calculate total available income (after-tax + employer match)
    total_available_income = after_tax_income + employer_match_amount
    
    # Calculate effective tax rate
    effective_tax_rate = (total_tax / income) * 100 if income > 0 else 0
    
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
    income = data['income']
    state = data['state']
    pre_tax_401k = data.get('preTax401k', 0)
    
    _, _, tax_breakdown = calculate_income_tax(income, state, pre_tax_401k, 0)
    
    # For the old API, return after-tax income without employer match
    after_tax_income = tax_breakdown['afterTaxIncome']
    
    return {
        'federalTax': tax_breakdown['federalTax'],
        'stateTax': tax_breakdown['stateTax'],
        'socialSecurityTax': tax_breakdown['socialSecurityTax'],
        'medicareTax': tax_breakdown['medicareTax'],
        'additionalMedicareTax': tax_breakdown['additionalMedicareTax'],
        'totalTax': tax_breakdown['totalTax'],
        'afterTaxIncome': after_tax_income
    }