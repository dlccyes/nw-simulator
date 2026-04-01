try:
    from .tax import calculate_income_tax
except ImportError:
    from tax import calculate_income_tax


def calculate_yearly_data(year, yearly_income, yearly_spending, stop_at_fire,
                          retirement_spending, end_age, fire_age=None):
    gross_income = sum(inc['amount'] for inc in yearly_income if inc['startAge'] <= year <= inc['endAge'])
    spending = sum(exp['amount'] for exp in yearly_spending if exp['startAge'] <= year <= exp['endAge'])

    if stop_at_fire and fire_age is not None and year >= fire_age:  # Only stop after FIRE age
        return 0, retirement_spending, [], [{'startAge': year, 'endAge': end_age,
                                           'amount': retirement_spending}]
    return gross_income, spending, yearly_income, yearly_spending


def calculate_net_worth(current_net_worth, previous_real_balance, real_return_rate, i):
    """
    Calculate end-of-period balance and interest.

    Net worth in this API is defined as the **ending** net worth for the given age/year.
    That means each row in the results table represents:

      start_balance + real_interest_earned + savings

    This helper returns the interest earned on the start_balance and the balance after
    applying only interest (savings are applied by the caller for clarity).
    """
    start_balance = current_net_worth if i == 0 else previous_real_balance
    real_interest_earned = start_balance * real_return_rate
    balance_after_interest = start_balance + real_interest_earned
    return balance_after_interest, real_interest_earned


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
    country = data.get('country', 'US')
    state = data.get('state', 'CA')
    filing_status = data.get('filingStatus', 'single')
    stop_at_fire = data.get('stopAtFire', False)

    # Calculate real return rate and check FIRE possibility
    real_return_rate = (1 + annual_return) / (1 + inflation_rate) - 1
    fire_possible = withdrawal_rate <= real_return_rate
    required_savings = retirement_spending / withdrawal_rate

    # Initialize arrays
    years = range(current_age, end_age + 1)
    arrays = {
        'real_net_worth': [0.0] * len(years),
        'yearly_after_tax_income': [0.0] * len(years),
        'yearly_spending_amounts': [0.0] * len(years),
        'yearly_pre_tax_income': [0.0] * len(years),
        'yearly_tax_rates': [0.0] * len(years),
        'yearly_savings': [0.0] * len(years),
        'yearly_real_interest': [0.0] * len(years)
    }

    yearly_spending = data.get('yearlySpending', [])
    yearly_income = data.get('yearlyIncome', [])

    # First pass to calculate FIRE age
    fire_age = None
    for i, year in enumerate(years):
        gross_income, spending, _, _ = calculate_yearly_data(
            year, yearly_income, yearly_spending, False, retirement_spending, end_age
        )

        total_available_income, effective_tax_rate, _ = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match, country, filing_status
        )

        _, real_interest_earned = calculate_net_worth(
            current_net_worth,
            arrays['real_net_worth'][i-1] if i > 0 else current_net_worth,
            real_return_rate,
            i
        )

        savings = total_available_income - spending

        # Update arrays (end-of-age net worth)
        start_balance = current_net_worth if i == 0 else arrays['real_net_worth'][i - 1]
        arrays['real_net_worth'][i] = start_balance + savings + real_interest_earned

        # Check if we've reached FIRE
        if fire_age is None and arrays['real_net_worth'][i] >= required_savings:
            fire_age = year

    # Second pass to calculate final values with stop_at_fire if needed
    for i, year in enumerate(years):
        gross_income, spending, yearly_income, yearly_spending = calculate_yearly_data(
            year, yearly_income, yearly_spending, stop_at_fire, retirement_spending, end_age, fire_age
        )

        total_available_income, effective_tax_rate, _ = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match, country, filing_status
        )

        _, real_interest_earned = calculate_net_worth(
            current_net_worth,
            arrays['real_net_worth'][i-1] if i > 0 else current_net_worth,
            real_return_rate,
            i
        )

        savings = total_available_income - spending

        # Update arrays (end-of-age net worth)
        start_balance = current_net_worth if i == 0 else arrays['real_net_worth'][i - 1]
        arrays['real_net_worth'][i] = start_balance + savings + real_interest_earned
        arrays['yearly_pre_tax_income'][i] = gross_income
        arrays['yearly_after_tax_income'][i] = total_available_income
        arrays['yearly_spending_amounts'][i] = spending
        arrays['yearly_tax_rates'][i] = effective_tax_rate
        arrays['yearly_savings'][i] = savings
        arrays['yearly_real_interest'][i] = real_interest_earned

    # Calculate nominal values from real values
    nominal_net_worth = [real * ((1 + inflation_rate) ** i) for i, real in enumerate(arrays['real_net_worth'])]

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
        result['error'] = (f"FIRE is not possible: Withdrawal rate ({withdrawal_rate*100:.1f}%) "
                           f"exceeds real return rate ({real_return_rate*100:.1f}%)")
        result['fireAge'] = None

    return result
