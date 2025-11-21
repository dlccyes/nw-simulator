"""
Tests for retirement simulator calculations.
"""

import unittest
from retirement import (
    calculate_social_security_benefit,
    estimate_aime_from_income,
    adjust_benefit_for_age,
    get_state_retirement_tax_treatment,
    calculate_retirement_withdrawal,
    calculate_retirement_projection,
    SOCIAL_SECURITY_FRA
)


class TestSocialSecurityCalculations(unittest.TestCase):
    """Test Social Security benefit calculations."""
    
    def test_social_security_benefit_zero_income(self):
        """Test SS benefit with zero AIME."""
        benefit = calculate_social_security_benefit(0)
        self.assertEqual(benefit, 0)
    
    def test_social_security_benefit_low_income(self):
        """Test SS benefit with low AIME (first bend point only)."""
        # AIME of $1000 (below first bend point of $1174)
        benefit = calculate_social_security_benefit(1000)
        expected = 1000 * 0.90  # 90% of first $1174
        self.assertAlmostEqual(benefit, expected, places=2)
    
    def test_social_security_benefit_medium_income(self):
        """Test SS benefit with medium AIME (second bend point)."""
        # AIME of $5000
        benefit = calculate_social_security_benefit(5000)
        # 90% of first $1174 + 32% of ($5000 - $1174)
        expected = 1174 * 0.90 + (5000 - 1174) * 0.32
        self.assertAlmostEqual(benefit, expected, places=2)
    
    def test_social_security_benefit_high_income(self):
        """Test SS benefit with high AIME (third bend point)."""
        # AIME of $10000
        benefit = calculate_social_security_benefit(10000)
        # 90% of $1174 + 32% of ($7078 - $1174) + 15% of ($10000 - $7078)
        expected = (1174 * 0.90 + 
                   (7078 - 1174) * 0.32 + 
                   (10000 - 7078) * 0.15)
        self.assertAlmostEqual(benefit, expected, places=2)
    
    def test_estimate_aime_from_income(self):
        """Test AIME estimation from annual income."""
        annual_income = 120000
        aime = estimate_aime_from_income(annual_income)
        expected = 120000 / 12  # Monthly income
        self.assertAlmostEqual(aime, expected, places=2)
    
    def test_estimate_aime_caps_at_max_taxable(self):
        """Test that AIME estimation caps at SS max taxable earnings."""
        annual_income = 200000  # Above max
        aime = estimate_aime_from_income(annual_income)
        # Should be capped at max taxable earnings
        expected_max = 168600 / 12
        self.assertAlmostEqual(aime, expected_max, places=2)
    
    def test_adjust_benefit_for_age_at_fra(self):
        """Test benefit adjustment when claiming at FRA."""
        base_benefit = 2000
        adjusted = adjust_benefit_for_age(base_benefit, SOCIAL_SECURITY_FRA)
        self.assertEqual(adjusted, base_benefit)
    
    def test_adjust_benefit_for_age_early(self):
        """Test benefit reduction for early claiming."""
        base_benefit = 2000
        # Claim 3 years early (36 months)
        adjusted = adjust_benefit_for_age(base_benefit, SOCIAL_SECURITY_FRA - 3)
        # 36 months * 5/9 * 1% = 20% reduction
        expected = base_benefit * 0.80
        self.assertAlmostEqual(adjusted, expected, places=2)
    
    def test_adjust_benefit_for_age_very_early(self):
        """Test benefit reduction for claiming more than 36 months early."""
        base_benefit = 2000
        # Claim 5 years early (60 months)
        adjusted = adjust_benefit_for_age(base_benefit, SOCIAL_SECURITY_FRA - 5)
        # First 36 months: 36 * 5/9 * 1% = 20%
        # Next 24 months: 24 * 5/12 * 1% = 10%
        # Total reduction: 30%
        expected = base_benefit * 0.70
        self.assertAlmostEqual(adjusted, expected, places=2)
    
    def test_adjust_benefit_for_age_delayed(self):
        """Test benefit increase for delayed claiming."""
        base_benefit = 2000
        # Claim 3 years late (36 months)
        adjusted = adjust_benefit_for_age(base_benefit, SOCIAL_SECURITY_FRA + 3)
        # 36 months * 2/3 * 1% = 24% increase
        expected = base_benefit * 1.24
        self.assertAlmostEqual(adjusted, expected, places=2)


class TestStateRetirementTaxTreatment(unittest.TestCase):
    """Test state-specific retirement tax treatment."""
    
    def test_no_income_tax_states(self):
        """Test that no-income-tax states don't tax retirement income."""
        for state in ['FL', 'TX', 'WA', 'NV']:
            treatment = get_state_retirement_tax_treatment(state)
            self.assertFalse(treatment['social_security_taxable'])
            self.assertFalse(treatment['retirement_account_taxable'])
            self.assertEqual(treatment['pension_exemption'], float('inf'))
    
    def test_retirement_friendly_states(self):
        """Test states that don't tax retirement accounts."""
        for state in ['IL', 'MS', 'PA']:
            treatment = get_state_retirement_tax_treatment(state)
            self.assertFalse(treatment['social_security_taxable'])
            self.assertFalse(treatment['retirement_account_taxable'])
    
    def test_california_treatment(self):
        """Test California's retirement tax treatment."""
        treatment = get_state_retirement_tax_treatment('CA')
        self.assertFalse(treatment['social_security_taxable'])
        self.assertTrue(treatment['retirement_account_taxable'])
        self.assertEqual(treatment['pension_exemption'], 0)
    
    def test_state_with_pension_exemption(self):
        """Test state with pension exemption."""
        treatment = get_state_retirement_tax_treatment('GA')
        self.assertEqual(treatment['pension_exemption'], 65000)


class TestRetirementWithdrawal(unittest.TestCase):
    """Test retirement withdrawal strategies."""
    
    def test_withdrawal_only_social_security(self):
        """Test when Social Security covers all spending."""
        result = calculate_retirement_withdrawal(
            age=67,
            traditional_ira_balance=100000,
            roth_ira_balance=50000,
            traditional_401k_balance=200000,
            roth_401k_balance=0,
            taxable_account_balance=30000,
            annual_spending=24000,
            social_security_benefit_monthly=2000,  # $24k/year
            state='CA',
            filing_status='single'
        )
        
        self.assertEqual(result['social_security'], 24000)
        self.assertEqual(result['taxable_account'], 0)
        self.assertEqual(result['roth_ira'], 0)
        self.assertEqual(result['traditional_ira'], 0)
    
    def test_withdrawal_taxable_first(self):
        """Test that taxable accounts are withdrawn first."""
        result = calculate_retirement_withdrawal(
            age=67,
            traditional_ira_balance=100000,
            roth_ira_balance=50000,
            traditional_401k_balance=200000,
            roth_401k_balance=0,
            taxable_account_balance=20000,
            annual_spending=50000,
            social_security_benefit_monthly=2000,  # $24k/year
            state='CA',
            filing_status='single'
        )
        
        # Should withdraw: $24k SS + $20k taxable + remaining from Roth
        self.assertEqual(result['social_security'], 24000)
        self.assertEqual(result['taxable_account'], 20000)
        self.assertGreater(result['roth_ira'], 0)
        self.assertEqual(result['traditional_ira'], 0)
    
    def test_withdrawal_roth_before_traditional(self):
        """Test that Roth is withdrawn before Traditional."""
        result = calculate_retirement_withdrawal(
            age=67,
            traditional_ira_balance=100000,
            roth_ira_balance=10000,
            traditional_401k_balance=200000,
            roth_401k_balance=5000,
            taxable_account_balance=5000,
            annual_spending=60000,
            social_security_benefit_monthly=2000,  # $24k/year
            state='CA',
            filing_status='single'
        )
        
        # Should deplete taxable and Roth before touching Traditional
        self.assertEqual(result['taxable_account'], 5000)
        self.assertEqual(result['roth_ira'], 10000)
        self.assertEqual(result['roth_401k'], 5000)
        self.assertGreater(result['traditional_ira'], 0)


class TestRetirementProjection(unittest.TestCase):
    """Test full retirement projection."""
    
    def test_retirement_projection_basic(self):
        """Test basic retirement projection."""
        data = {
            'currentAge': 30,
            'retirementAge': 65,
            'endAge': 90,
            'currentNetWorth': 0,
            'traditionalIRA': 50000,
            'rothIRA': 30000,
            'traditional401k': 100000,
            'roth401k': 0,
            'taxableAccounts': 20000,
            'annualIncome': 100000,
            'annualSpending': 40000,
            'annualReturn': 7,
            'inflationRate': 3,
            'state': 'CA',
            'filingStatus': 'single',
            'socialSecurityClaimAge': 67
        }
        
        result = calculate_retirement_projection(data)
        
        # Check structure
        self.assertIn('years', result)
        self.assertIn('totalNetWorth', result)
        self.assertIn('socialSecurityBenefit', result)
        self.assertIn('withdrawals', result)
        self.assertIn('taxes', result)
        
        # Check year range
        self.assertEqual(len(result['years']), 61)  # 30 to 90 inclusive
        self.assertEqual(result['years'][0], 30)
        self.assertEqual(result['years'][-1], 90)
        
        # Check that balances grow before retirement
        self.assertGreater(result['totalNetWorth'][10], result['totalNetWorth'][0])
        
        # Check that withdrawals only happen in retirement
        retirement_index = 65 - 30  # Index for age 65
        self.assertEqual(result['withdrawals'][0], 0)
        self.assertGreater(result['withdrawals'][retirement_index], 0)
    
    def test_retirement_projection_with_delayed_ss(self):
        """Test retirement projection with delayed Social Security."""
        data = {
            'currentAge': 60,
            'retirementAge': 65,
            'endAge': 80,
            'traditionalIRA': 300000,
            'rothIRA': 100000,
            'traditional401k': 400000,
            'roth401k': 0,
            'taxableAccounts': 50000,
            'annualIncome': 150000,
            'annualSpending': 60000,
            'annualReturn': 6,
            'inflationRate': 2,
            'state': 'FL',
            'filingStatus': 'single',
            'socialSecurityClaimAge': 70  # Delay to age 70
        }
        
        result = calculate_retirement_projection(data)
        
        # Check that SS benefits are 0 before age 70
        ss_start_index = 70 - 60  # Index for age 70
        self.assertEqual(result['socialSecurityBenefit'][ss_start_index - 1], 0)
        self.assertGreater(result['socialSecurityBenefit'][ss_start_index], 0)


if __name__ == '__main__':
    unittest.main()
