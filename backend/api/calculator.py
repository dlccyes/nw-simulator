from .tax import calculate_tax


def calculate_yearly_data(year, yearly_income, yearly_spending, stop_at_fire, retirement_spending, end_age):
    gross_income = sum(inc['amount'] for inc in yearly_income if inc['startAge'] <= year <= inc['endAge'])
    spending = sum(exp['amount'] for exp in yearly_spending if exp['startAge'] <= year <= exp['endAge'])
    
    if stop_at_fire and gross_income > 0:  # Only check if we have income
        return 0, retirement_spending, [], [{'startAge': year, 'endAge': end_age, 'amount': retirement_spending}]
    return gross_income, spending, yearly_income, yearly_spending

def calculate_income_tax(gross_income, state, pre_tax_401k, employer_match):
    if gross_income <= 0:
        return 0, 0, 0
    
    tax_data = {
        'income': gross_income,
        'state': state,
        'preTax401k': pre_tax_401k
    }
    tax_result = calculate_tax(tax_data)
    after_tax_income = tax_result['afterTaxIncome']
    effective_tax_rate = (tax_result['totalTax'] / gross_income) * 100
    employer_contribution = gross_income * employer_match
    return after_tax_income + employer_contribution, effective_tax_rate, after_tax_income

def calculate_net_worth(current_net_worth, previous_real_balance, real_return_rate, i):
    if i == 0:
        return current_net_worth, current_net_worth
    
    real_interest_earned = previous_real_balance * real_return_rate
    real_balance = previous_real_balance + real_interest_earned
    return real_balance, real_interest_earned

def calculate_fire_projection(data):
    # Extract input parameters
    current_age = data['currentAge']
    end_age = data['endAge']
    current_net_worth = data.get('currentNetWorth', 0)
    annual_return = data['annualReturn'] / 100
    inflation_rate = data['inflationRate'] / 100
    retirement_spending = data['retirementSpending']
    withdrawal_rate = data['withdrawalRate'] / 100
    pre_tax_401k = data['preTax401k']
    employer_match = data['employerMatch'] / 100
    state = data.get('state', 'CA')
    stop_at_fire = data.get('stopAtFire', False)
    
    # Calculate real return rate and check FIRE possibility
    real_return_rate = (1 + annual_return) / (1 + inflation_rate) - 1
    fire_possible = withdrawal_rate <= real_return_rate
    required_savings = retirement_spending / withdrawal_rate
    
    # Initialize arrays
    years = range(current_age, end_age + 1)
    arrays = {
        'real_net_worth': [0] * len(years),
        'yearly_after_tax_income': [0] * len(years),
        'yearly_spending_amounts': [0] * len(years),
        'yearly_pre_tax_income': [0] * len(years),
        'yearly_tax_rates': [0] * len(years),
        'yearly_savings': [0] * len(years),
        'yearly_real_interest': [0] * len(years)
    }
    
    yearly_spending = data.get('yearlySpending', [])
    yearly_income = data.get('yearlyIncome', [])
    
    # Calculate year-by-year projection
    for i, year in enumerate(years):
        gross_income, spending, yearly_income, yearly_spending = calculate_yearly_data(
            year, yearly_income, yearly_spending, stop_at_fire, retirement_spending, end_age
        )
        
        total_available_income, effective_tax_rate, _ = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match
        )
        
        real_balance, real_interest_earned = calculate_net_worth(
            current_net_worth,
            arrays['real_net_worth'][i-1] if i > 0 else current_net_worth,
            real_return_rate,
            i
        )
        
        savings = total_available_income - spending
        
        # Update arrays
        arrays['real_net_worth'][i] = current_net_worth if i == 0 else arrays['real_net_worth'][i-1] + savings + real_interest_earned
        arrays['yearly_pre_tax_income'][i] = gross_income
        arrays['yearly_after_tax_income'][i] = total_available_income
        arrays['yearly_spending_amounts'][i] = spending
        arrays['yearly_tax_rates'][i] = effective_tax_rate
        arrays['yearly_savings'][i] = savings
        arrays['yearly_real_interest'][i] = real_interest_earned if i > 0 else 0
    
    # Calculate nominal values from real values
    nominal_net_worth = [real * ((1 + inflation_rate) ** i) for i, real in enumerate(arrays['real_net_worth'])]
    
    # Find FIRE age
    fire_age = next((years[i] for i, worth in enumerate(arrays['real_net_worth']) if worth >= required_savings), None)
    
    result = {
        'years': list(years),
        'nominalNetWorth': nominal_net_worth,
        'realNetWorth': arrays['real_net_worth'],
        'yearlyPreTaxIncome': arrays['yearly_pre_tax_income'],
        'yearlyAfterTaxIncome': arrays['yearly_after_tax_income'],
        'yearlySpending': arrays['yearly_spending_amounts'],
        'yearlyTaxRates': arrays['yearly_tax_rates'],
        'yearlySavings': arrays['yearly_savings'],
        'yearlyRealInterest': arrays['yearly_real_interest'],
        'fireAge': fire_age,
        'requiredSavings': required_savings
    }
    
    if not fire_possible:
        result['error'] = f"FIRE is not possible: Withdrawal rate ({withdrawal_rate*100:.1f}%) exceeds real return rate ({real_return_rate*100:.1f}%)"
        result['fireAge'] = None
    
    return result