"""
Retirement simulator calculations including:
- Different retirement account types (401k, Roth IRA, Traditional IRA)
- Social security benefit calculations
- Retirement withdrawal strategies
- State-specific retirement tax treatment
"""

import json
import os

try:
    from .tax import calculate_tax_for_bracket, get_federal_config, get_state_config
except ImportError:
    from tax import calculate_tax_for_bracket, get_federal_config, get_state_config


# Social Security benefit calculation constants (2024)
SOCIAL_SECURITY_BEND_POINTS = [1174, 7078]  # Monthly bend points for 2024
SOCIAL_SECURITY_BEND_PERCENTAGES = [0.90, 0.32, 0.15]
SOCIAL_SECURITY_MAX_TAXABLE_EARNINGS = 168600  # 2024 wage base
SOCIAL_SECURITY_FRA = 67  # Full Retirement Age for those born 1960+


def calculate_social_security_benefit(average_indexed_monthly_earnings):
    """
    Calculate monthly Social Security benefit based on AIME.
    
    Uses the bend point formula:
    - 90% of first $1,174
    - 32% of amount between $1,174 and $7,078
    - 15% of amount over $7,078
    
    Args:
        average_indexed_monthly_earnings: Average Indexed Monthly Earnings (AIME)
    
    Returns:
        Monthly Social Security benefit at Full Retirement Age
    """
    if average_indexed_monthly_earnings <= 0:
        return 0
    
    benefit = 0
    remaining = average_indexed_monthly_earnings
    
    # First bend point
    if remaining > 0:
        amount = min(remaining, SOCIAL_SECURITY_BEND_POINTS[0])
        benefit += amount * SOCIAL_SECURITY_BEND_PERCENTAGES[0]
        remaining -= amount
    
    # Second bend point
    if remaining > 0:
        amount = min(remaining, SOCIAL_SECURITY_BEND_POINTS[1] - SOCIAL_SECURITY_BEND_POINTS[0])
        benefit += amount * SOCIAL_SECURITY_BEND_PERCENTAGES[1]
        remaining -= amount
    
    # Third bend point
    if remaining > 0:
        benefit += remaining * SOCIAL_SECURITY_BEND_PERCENTAGES[2]
    
    return benefit


def estimate_aime_from_income(annual_income, years_worked=35):
    """
    Estimate Average Indexed Monthly Earnings from current annual income.
    This is a simplified estimation assuming consistent income.
    
    Args:
        annual_income: Current annual income
        years_worked: Number of years worked (default 35 for full benefit)
    
    Returns:
        Estimated AIME (Average Indexed Monthly Earnings)
    """
    # Cap income at Social Security maximum
    capped_income = min(annual_income, SOCIAL_SECURITY_MAX_TAXABLE_EARNINGS)
    
    # Calculate average monthly earnings
    monthly_income = capped_income / 12
    
    # For simplification, assume consistent earnings (in reality, indexing is complex)
    return monthly_income


def adjust_benefit_for_age(monthly_benefit, retirement_age, full_retirement_age=SOCIAL_SECURITY_FRA):
    """
    Adjust Social Security benefit based on claiming age.
    
    - Claiming before FRA: reduction of 5/9 of 1% per month for first 36 months, 
      then 5/12 of 1% for each additional month
    - Claiming after FRA: increase of 2/3 of 1% per month (8% per year)
    
    Args:
        monthly_benefit: Benefit amount at Full Retirement Age
        retirement_age: Age when starting to claim benefits
        full_retirement_age: Full Retirement Age (default 67)
    
    Returns:
        Adjusted monthly benefit based on claiming age
    """
    months_difference = (retirement_age - full_retirement_age) * 12
    
    if months_difference == 0:
        # Claiming at FRA
        return monthly_benefit
    elif months_difference < 0:
        # Early claiming (before FRA)
        months_early = abs(months_difference)
        
        if months_early <= 36:
            # First 36 months: 5/9 of 1% per month
            reduction_rate = (5/9) * 0.01 * months_early
        else:
            # First 36 months plus additional months
            reduction_36_months = (5/9) * 0.01 * 36
            additional_months = months_early - 36
            additional_reduction = (5/12) * 0.01 * additional_months
            reduction_rate = reduction_36_months + additional_reduction
        
        return monthly_benefit * (1 - reduction_rate)
    else:
        # Delayed claiming (after FRA)
        months_delayed = months_difference
        # 2/3 of 1% per month, up to age 70
        max_months_delayed = min(months_delayed, (70 - full_retirement_age) * 12)
        increase_rate = (2/3) * 0.01 * max_months_delayed
        return monthly_benefit * (1 + increase_rate)


def get_state_retirement_tax_treatment(state):
    """
    Get state-specific retirement income tax treatment.
    
    Returns dictionary with:
    - social_security_taxable: Whether SS benefits are taxed
    - retirement_account_taxable: Whether retirement distributions are taxed
    - pension_exemption: Amount of pension/retirement income exempt from state tax
    
    Args:
        state: State code (e.g., 'CA', 'FL', 'TX')
    
    Returns:
        Dictionary with state retirement tax treatment
    """
    # State retirement tax treatment (simplified version)
    # In reality, this should be loaded from a configuration file
    state_retirement_rules = {
        # States with no income tax
        'AK': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'FL': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'NV': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'NH': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'SD': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'TN': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'TX': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'WA': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'WY': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        
        # States that don't tax Social Security but tax other retirement income
        'AL': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'AZ': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 2500},
        'AR': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 6000},
        'CA': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'DE': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 12500},
        'GA': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 65000},
        'HI': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'ID': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'IL': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'IN': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'IA': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 6000},
        'KY': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 31110},
        'LA': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 6000},
        'ME': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 10000},
        'MD': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'MA': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'MI': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 20000},
        'MS': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'NC': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'ND': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'OH': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'OK': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 10000},
        'OR': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'PA': {'social_security_taxable': False, 'retirement_account_taxable': False, 'pension_exemption': float('inf')},
        'SC': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 10000},
        'VA': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 12000},
        'WV': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'WI': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'DC': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 0},
        
        # States that tax Social Security (under certain conditions)
        'CO': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 20000},
        'CT': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'KS': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'MN': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'MO': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'MT': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'NE': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'NM': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 8000},
        'NY': {'social_security_taxable': False, 'retirement_account_taxable': True, 'pension_exemption': 20000},
        'RI': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'UT': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
        'VT': {'social_security_taxable': True, 'retirement_account_taxable': True, 'pension_exemption': 0},
    }
    
    # Default for unknown states
    default_treatment = {
        'social_security_taxable': False,
        'retirement_account_taxable': True,
        'pension_exemption': 0
    }
    
    return state_retirement_rules.get(state, default_treatment)


def calculate_retirement_withdrawal(
    age,
    traditional_ira_balance,
    roth_ira_balance,
    traditional_401k_balance,
    roth_401k_balance,
    taxable_account_balance,
    annual_spending,
    social_security_benefit_monthly,
    state='CA',
    filing_status='single'
):
    """
    Calculate optimal retirement withdrawal strategy.
    
    Strategy:
    1. Take Social Security benefits
    2. Withdraw from taxable accounts (already taxed)
    3. Withdraw from Roth accounts (tax-free)
    4. Withdraw from Traditional accounts (taxable)
    
    Args:
        age: Current age
        traditional_ira_balance: Traditional IRA balance
        roth_ira_balance: Roth IRA balance
        traditional_401k_balance: Traditional 401k balance
        roth_401k_balance: Roth 401k balance
        taxable_account_balance: Regular taxable account balance
        annual_spending: Annual spending need
        social_security_benefit_monthly: Monthly Social Security benefit
        state: State code
        filing_status: Tax filing status
    
    Returns:
        Dictionary with withdrawal amounts from each account and taxes owed
    """
    # Calculate Social Security income
    social_security_annual = social_security_benefit_monthly * 12
    
    # Remaining spending need after Social Security
    remaining_need = annual_spending - social_security_annual
    
    withdrawals = {
        'social_security': social_security_annual,
        'taxable_account': 0,
        'roth_ira': 0,
        'roth_401k': 0,
        'traditional_ira': 0,
        'traditional_401k': 0,
        'total_withdrawn': social_security_annual,
        'taxable_income': 0,
        'taxes_owed': 0
    }
    
    if remaining_need <= 0:
        return withdrawals
    
    # Step 1: Withdraw from taxable accounts (most flexible, but already taxed on contributions)
    taxable_withdrawal = min(remaining_need, taxable_account_balance)
    withdrawals['taxable_account'] = taxable_withdrawal
    withdrawals['total_withdrawn'] += taxable_withdrawal
    remaining_need -= taxable_withdrawal
    
    if remaining_need <= 0:
        return withdrawals
    
    # Step 2: Withdraw from Roth accounts (tax-free)
    roth_ira_withdrawal = min(remaining_need, roth_ira_balance)
    withdrawals['roth_ira'] = roth_ira_withdrawal
    withdrawals['total_withdrawn'] += roth_ira_withdrawal
    remaining_need -= roth_ira_withdrawal
    
    if remaining_need <= 0:
        return withdrawals
    
    roth_401k_withdrawal = min(remaining_need, roth_401k_balance)
    withdrawals['roth_401k'] = roth_401k_withdrawal
    withdrawals['total_withdrawn'] += roth_401k_withdrawal
    remaining_need -= roth_401k_withdrawal
    
    if remaining_need <= 0:
        return withdrawals
    
    # Step 3: Withdraw from Traditional accounts (taxable) - need to account for taxes
    # This is more complex because we need to withdraw enough to cover both spending and taxes
    
    # Get state retirement tax treatment
    state_treatment = get_state_retirement_tax_treatment(state)
    
    # Calculate how much we need to withdraw from traditional accounts
    # This is an iterative process, but we'll use an approximation
    
    # Approximate marginal tax rate (federal + state)
    federal_config = get_federal_config('US', filing_status)
    state_config = get_state_config(state, 'US', filing_status)
    
    # Estimate effective tax rate on traditional withdrawals
    # This is simplified - in reality, we'd need to calculate precisely
    estimated_federal_rate = 0.22  # Approximate marginal rate
    estimated_state_rate = 0.05    # Approximate state rate
    
    if not state_treatment['retirement_account_taxable']:
        estimated_state_rate = 0
    
    estimated_tax_rate = estimated_federal_rate + estimated_state_rate
    
    # Need to withdraw more to account for taxes
    gross_withdrawal_needed = remaining_need / (1 - estimated_tax_rate)
    
    # Withdraw from Traditional IRA first
    traditional_ira_withdrawal = min(gross_withdrawal_needed, traditional_ira_balance)
    withdrawals['traditional_ira'] = traditional_ira_withdrawal
    withdrawals['taxable_income'] += traditional_ira_withdrawal
    gross_withdrawal_needed -= traditional_ira_withdrawal
    
    # Then from Traditional 401k if needed
    if gross_withdrawal_needed > 0:
        traditional_401k_withdrawal = min(gross_withdrawal_needed, traditional_401k_balance)
        withdrawals['traditional_401k'] = traditional_401k_withdrawal
        withdrawals['taxable_income'] += traditional_401k_withdrawal
    
    # Calculate taxes on traditional withdrawals
    # Federal tax on traditional distributions
    federal_standard_deduction = federal_config.get('standard_deduction', 0)
    federal_taxable = max(0, withdrawals['taxable_income'] - federal_standard_deduction)
    federal_brackets = federal_config.get('brackets', [])
    federal_tax = calculate_tax_for_bracket(federal_taxable, federal_brackets)
    
    # State tax on traditional distributions (if applicable)
    state_tax = 0
    if state_treatment['retirement_account_taxable']:
        # Apply pension exemption if available
        pension_exemption = state_treatment.get('pension_exemption', 0)
        state_taxable_retirement = max(0, withdrawals['taxable_income'] - pension_exemption)
        
        state_standard_deduction = state_config.get('standard_deduction', 0)
        state_taxable = max(0, state_taxable_retirement - state_standard_deduction)
        state_brackets = state_config.get('brackets', [])
        state_tax = calculate_tax_for_bracket(state_taxable, state_brackets)
    
    # Tax on Social Security (federal only, based on combined income)
    ss_taxable_amount = 0
    if social_security_annual > 0:
        combined_income = withdrawals['taxable_income'] / 2 + social_security_annual / 2
        
        if filing_status == 'married':
            if combined_income > 44000:
                ss_taxable_amount = min(
                    social_security_annual * 0.85,
                    0.85 * (combined_income - 44000) + 0.50 * min(combined_income - 32000, 12000)
                )
            elif combined_income > 32000:
                ss_taxable_amount = min(
                    social_security_annual * 0.50,
                    0.50 * (combined_income - 32000)
                )
        else:  # single
            if combined_income > 34000:
                ss_taxable_amount = min(
                    social_security_annual * 0.85,
                    0.85 * (combined_income - 34000) + 0.50 * min(combined_income - 25000, 9000)
                )
            elif combined_income > 25000:
                ss_taxable_amount = min(
                    social_security_annual * 0.50,
                    0.50 * (combined_income - 25000)
                )
    
    # Add SS taxable amount to federal tax calculation
    if ss_taxable_amount > 0:
        total_federal_taxable = federal_taxable + ss_taxable_amount
        total_federal_tax = calculate_tax_for_bracket(total_federal_taxable, federal_brackets)
        # The additional tax is the difference
        federal_tax = total_federal_tax
    
    withdrawals['taxes_owed'] = federal_tax + state_tax
    withdrawals['total_withdrawn'] += withdrawals['traditional_ira'] + withdrawals['traditional_401k']
    
    return withdrawals


def calculate_retirement_projection(data):
    """
    Calculate retirement projection with detailed account tracking.
    
    Args:
        data: Dictionary with retirement parameters including:
            - currentAge
            - retirementAge
            - endAge (life expectancy)
            - currentNetWorth (total)
            - traditionalIRA
            - rothIRA
            - traditional401k
            - roth401k
            - taxableAccounts
            - annualIncome (current)
            - annualSpending (retirement)
            - annualReturn (%)
            - inflationRate (%)
            - state
            - filingStatus
            - socialSecurityClaimAge (optional)
    
    Returns:
        Detailed projection with account balances, withdrawals, and taxes by year
    """
    # Extract parameters
    current_age = data['currentAge']
    retirement_age = data['retirementAge']
    end_age = data['endAge']
    annual_return = data['annualReturn'] / 100
    inflation_rate = data['inflationRate'] / 100
    annual_spending = data['annualSpending']
    annual_income = data.get('annualIncome', 0)
    state = data.get('state', 'CA')
    filing_status = data.get('filingStatus', 'single')
    ss_claim_age = data.get('socialSecurityClaimAge', SOCIAL_SECURITY_FRA)
    
    # Account balances
    traditional_ira = data.get('traditionalIRA', 0)
    roth_ira = data.get('rothIRA', 0)
    traditional_401k = data.get('traditional401k', 0)
    roth_401k = data.get('roth401k', 0)
    taxable_accounts = data.get('taxableAccounts', 0)
    
    # Calculate Social Security benefit
    aime = estimate_aime_from_income(annual_income)
    base_ss_benefit = calculate_social_security_benefit(aime)
    adjusted_ss_benefit = adjust_benefit_for_age(base_ss_benefit, ss_claim_age)
    
    # Real return rate
    real_return_rate = (1 + annual_return) / (1 + inflation_rate) - 1
    
    # Initialize result arrays
    years = list(range(current_age, end_age + 1))
    result = {
        'years': years,
        'traditionalIRA': [],
        'rothIRA': [],
        'traditional401k': [],
        'roth401k': [],
        'taxableAccounts': [],
        'totalNetWorth': [],
        'socialSecurityBenefit': [],
        'withdrawals': [],
        'taxes': [],
        'remainingSpending': []
    }
    
    # Simulate each year
    for i, year in enumerate(years):
        # Apply growth to all accounts
        if i > 0:
            traditional_ira *= (1 + real_return_rate)
            roth_ira *= (1 + real_return_rate)
            traditional_401k *= (1 + real_return_rate)
            roth_401k *= (1 + real_return_rate)
            taxable_accounts *= (1 + real_return_rate)
        
        # Record balances before withdrawals
        result['traditionalIRA'].append(traditional_ira)
        result['rothIRA'].append(roth_ira)
        result['traditional401k'].append(traditional_401k)
        result['roth401k'].append(roth_401k)
        result['taxableAccounts'].append(taxable_accounts)
        result['totalNetWorth'].append(
            traditional_ira + roth_ira + traditional_401k + 
            roth_401k + taxable_accounts
        )
        
        # If in retirement, calculate withdrawals
        if year >= retirement_age:
            # Check if claiming Social Security
            ss_benefit_monthly = adjusted_ss_benefit if year >= ss_claim_age else 0
            result['socialSecurityBenefit'].append(ss_benefit_monthly * 12)
            
            # Calculate optimal withdrawals
            withdrawal_plan = calculate_retirement_withdrawal(
                year,
                traditional_ira,
                roth_ira,
                traditional_401k,
                roth_401k,
                taxable_accounts,
                annual_spending,
                ss_benefit_monthly,
                state,
                filing_status
            )
            
            # Update account balances after withdrawals
            traditional_ira -= withdrawal_plan['traditional_ira']
            roth_ira -= withdrawal_plan['roth_ira']
            traditional_401k -= withdrawal_plan['traditional_401k']
            roth_401k -= withdrawal_plan['roth_401k']
            taxable_accounts -= withdrawal_plan['taxable_account']
            
            result['withdrawals'].append(withdrawal_plan['total_withdrawn'])
            result['taxes'].append(withdrawal_plan['taxes_owed'])
            
            # Calculate how much spending need is met
            net_available = withdrawal_plan['total_withdrawn'] - withdrawal_plan['taxes_owed']
            remaining_need = max(0, annual_spending - net_available)
            result['remainingSpending'].append(remaining_need)
        else:
            # Before retirement
            result['socialSecurityBenefit'].append(0)
            result['withdrawals'].append(0)
            result['taxes'].append(0)
            result['remainingSpending'].append(0)
    
    return result
