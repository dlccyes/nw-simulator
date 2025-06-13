# State tax rates (simplified for MVP)
STATE_TAX_RATES = {
    'CA': [
        (0, 10756, 0.01),
        (10757, 25499, 0.02),
        (25500, 40245, 0.04),
        (40246, 55866, 0.06),
        (55867, 70606, 0.08),
        (70607, 360659, 0.093),
        (360660, 432787, 0.103),
        (432788, 721314, 0.113),
        (721315, float('inf'), 0.123)
    ],
    # Add more states as needed
}

# Federal tax brackets for 2024 (single filer)
FEDERAL_TAX_RATES = [
    (0, 11600, 0.10),
    (11600, 47150, 0.12),
    (47150, 100525, 0.22),
    (100525, 191950, 0.24),
    (191950, 243725, 0.32),
    (243725, 609350, 0.35),
    (609350, float('inf'), 0.37)
]

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
    for min_income, max_income, rate in brackets:
        if income > min_income:
            taxable_amount = min(income - min_income, max_income - min_income)
            tax += taxable_amount * rate
    return tax

def calculate_tax(data):
    income = data['income']
    state = data['state']
    pre_tax_401k = data.get('preTax401k', 0)
    
    # Calculate taxable income after deductions
    federal_taxable_income = income - pre_tax_401k - FEDERAL_STANDARD_DEDUCTION
    state_taxable_income = income - pre_tax_401k - CA_STANDARD_DEDUCTION
    
    # Calculate federal tax
    federal_tax = calculate_tax_for_bracket(federal_taxable_income, FEDERAL_TAX_RATES)
    
    # Calculate state tax
    state_tax = calculate_tax_for_bracket(state_taxable_income, STATE_TAX_RATES.get(state, []))
    
    # Calculate FICA taxes
    social_security_tax = min(income * SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_WAGE_BASE * SOCIAL_SECURITY_RATE)
    medicare_tax = income * MEDICARE_RATE
    additional_medicare_tax = max(0, income - MEDICARE_ADDITIONAL_THRESHOLD) * MEDICARE_ADDITIONAL_RATE
    
    total_tax = federal_tax + state_tax + social_security_tax + medicare_tax + additional_medicare_tax
    after_tax_income = income - total_tax
    
    return {
        'federalTax': federal_tax,
        'stateTax': state_tax,
        'socialSecurityTax': social_security_tax,
        'medicareTax': medicare_tax,
        'additionalMedicareTax': additional_medicare_tax,
        'totalTax': total_tax,
        'afterTaxIncome': after_tax_income
    }