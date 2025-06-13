import unittest
from parameterized import parameterized
from .calculator import (
    calculate_yearly_data,
    calculate_income_tax,
    calculate_net_worth,
    calculate_fire_projection
)

class TestCalculator(unittest.TestCase):
    @parameterized.expand([
        # (year, yearly_income, yearly_spending, stop_at_fire, retirement_spending, end_age, expected_income, expected_spending)
        ("normal_case", 30, 
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, 100000, 50000),
        
        ("fire_stop", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         True, 40000, 65, 0, 40000),
        
        ("no_income", 30,
         [],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, 0, 50000),
        
        ("no_spending", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [],
         False, 40000, 65, 100000, 0),
        
        ("age_out_of_range", 70,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, 0, 0),
        
        ("multiple_income_sources", 30,
         [
             {'startAge': 25, 'endAge': 65, 'amount': 100000},
             {'startAge': 30, 'endAge': 40, 'amount': 20000}
         ],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, 120000, 50000),
    ])
    def test_calculate_yearly_data(self, name, year, yearly_income, yearly_spending, 
                                 stop_at_fire, retirement_spending, end_age, 
                                 expected_income, expected_spending):
        result = calculate_yearly_data(year, yearly_income, yearly_spending, 
                                     stop_at_fire, retirement_spending, end_age)
        self.assertEqual(result[0], expected_income)
        self.assertEqual(result[1], expected_spending)

    @parameterized.expand([
        # (gross_income, state, pre_tax_401k, employer_match, expected_after_tax_min, expected_tax_rate_max)
        ("normal_income", 100000, 'CA', 0.1, 0.06, 50000, 50),
        ("zero_income", 0, 'CA', 0.1, 0.06, 0, 0),
        ("high_income", 500000, 'CA', 0.1, 0.06, 200000, 60),
        ("no_401k", 100000, 'CA', 0, 0.06, 40000, 60),
        ("no_match", 100000, 'CA', 0.1, 0, 45000, 55),
        ("texas_no_state_tax", 100000, 'TX', 0.1, 0.06, 55000, 45),
        # New test case for $230,000 income with 5% match
        ("230k_income_5pct_match", 230000, 'CA', 23000, 0.05, 167000, 33),
    ])
    def test_calculate_income_tax(self, name, gross_income, state, pre_tax_401k, 
                                employer_match, expected_after_tax_min, 
                                expected_tax_rate_max):
        after_tax, tax_rate, _ = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match
        )
        self.assertGreaterEqual(after_tax, expected_after_tax_min)
        self.assertLessEqual(tax_rate, expected_tax_rate_max)

    def test_230k_income_detailed(self):
        """Detailed test for $230,000 income with 5% employer match"""
        gross_income = 230000
        state = 'CA'
        pre_tax_401k = 23000
        employer_match = 0.05

        after_tax, tax_rate, _ = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match
        )

        # Expected values based on 2024 tax brackets
        expected_employer_match = gross_income * employer_match  # $11,500
        expected_taxable_income = gross_income - pre_tax_401k  # $207,000
        
        # Federal tax brackets for 2024
        expected_federal_tax = (
            11600 * 0.10 +  # First bracket
            35550 * 0.12 +  # Second bracket
            53375 * 0.22 +  # Third bracket
            91425 * 0.24 +  # Fourth bracket
            15050 * 0.32    # Fifth bracket
        )  # $43,926.50

        # California state tax brackets for 2024
        expected_state_tax = (
            10099 * 0.01 +   # First bracket
            13843 * 0.02 +   # Second bracket
            13846 * 0.04 +   # Third bracket
            14667 * 0.06 +   # Fourth bracket
            13840 * 0.08 +   # Fifth bracket
            140705 * 0.093   # Sixth bracket
        )  # $16,004.48

        # FICA taxes
        expected_social_security = min(168600 * 0.062, expected_taxable_income * 0.062)  # $10,453.20
        expected_medicare = expected_taxable_income * 0.0145  # $3,001.50
        expected_additional_medicare = max(0, (expected_taxable_income - 200000) * 0.009)  # $630

        expected_total_tax = (
            expected_federal_tax +
            expected_state_tax +
            expected_social_security +
            expected_medicare +
            expected_additional_medicare
        )  # $74,015.68

        expected_after_tax_income = gross_income - expected_total_tax  # $155,984.32
        expected_total_available = expected_after_tax_income + expected_employer_match  # $167,484.32

        # Allow for small rounding differences (within $1)
        self.assertAlmostEqual(after_tax, expected_total_available, delta=1)
        self.assertAlmostEqual(tax_rate, (expected_total_tax / gross_income) * 100, delta=0.1)

    @parameterized.expand([
        # (current_net_worth, previous_real_balance, real_return_rate, year_index, expected_balance_min, expected_interest_min)
        ("initial_year", 100000, 0, 0.07, 0, 100000, 100000),
        ("subsequent_year", 100000, 100000, 0.07, 1, 107000, 7000),
        ("negative_return", 100000, 100000, -0.05, 1, 95000, -5000),
        ("zero_return", 100000, 100000, 0, 1, 100000, 0),
        ("high_return", 100000, 100000, 0.15, 1, 115000, 15000),
    ])
    def test_calculate_net_worth(self, name, current_net_worth, previous_real_balance, 
                               real_return_rate, year_index, expected_balance_min, 
                               expected_interest_min):
        balance, interest = calculate_net_worth(
            current_net_worth, previous_real_balance, real_return_rate, year_index
        )
        self.assertGreaterEqual(balance, expected_balance_min)
        self.assertGreaterEqual(interest, expected_interest_min)

    @parameterized.expand([
        # Test case name and data dictionary
        ("realistic_fire", {
            'currentAge': 30,
            'endAge': 65,
            'currentNetWorth': 100000,
            'annualReturn': 7,
            'inflationRate': 2,
            'retirementSpending': 40000,
            'withdrawalRate': 4,
            'preTax401k': 0.1,
            'employerMatch': 6,
            'backdoorRoth': 10,
            'state': 'CA',
            'stopAtFire': False,
            'yearlyIncome': [{'startAge': 30, 'endAge': 65, 'amount': 100000}],
            'yearlySpending': [{'startAge': 30, 'endAge': 65, 'amount': 50000}]
        }, True),  # Should be possible

        ("impossible_fire", {
            'currentAge': 30,
            'endAge': 65,
            'currentNetWorth': 100000,
            'annualReturn': 5,
            'inflationRate': 2,
            'retirementSpending': 40000,
            'withdrawalRate': 10,  # Unrealistic withdrawal rate
            'preTax401k': 0.1,
            'employerMatch': 6,
            'backdoorRoth': 10,
            'state': 'CA',
            'stopAtFire': False,
            'yearlyIncome': [{'startAge': 30, 'endAge': 65, 'amount': 100000}],
            'yearlySpending': [{'startAge': 30, 'endAge': 65, 'amount': 50000}]
        }, False),  # Should be impossible

        ("early_retirement", {
            'currentAge': 25,
            'endAge': 40,
            'currentNetWorth': 1000000,  # Higher initial net worth
            'annualReturn': 10,         # Higher return rate
            'inflationRate': 2,
            'retirementSpending': 30000,
            'withdrawalRate': 4,
            'preTax401k': 0.15,
            'employerMatch': 8,
            'backdoorRoth': 15,
            'state': 'TX',
            'stopAtFire': True,
            'yearlyIncome': [{'startAge': 25, 'endAge': 40, 'amount': 200000}],  # Higher income
            'yearlySpending': [{'startAge': 25, 'endAge': 40, 'amount': 80000}]  # Higher spending but better savings rate
        }, True),  # Should be possible

        ("high_inflation", {
            'currentAge': 30,
            'endAge': 65,
            'currentNetWorth': 100000,
            'annualReturn': 12,         # Higher return to compensate for inflation
            'inflationRate': 5,         # High inflation
            'retirementSpending': 40000,
            'withdrawalRate': 4,
            'preTax401k': 0.1,
            'employerMatch': 6,
            'backdoorRoth': 10,
            'state': 'CA',
            'stopAtFire': False,
            'yearlyIncome': [{'startAge': 30, 'endAge': 65, 'amount': 100000}],
            'yearlySpending': [{'startAge': 30, 'endAge': 65, 'amount': 50000}]
        }, True),  # Should still be possible with higher returns
    ])
    def test_calculate_fire_projection(self, name, data, should_be_possible):
        result = calculate_fire_projection(data)
        
        # Verify basic structure
        self.assertIn('years', result)
        self.assertIn('nominalNetWorth', result)
        self.assertIn('realNetWorth', result)
        self.assertIn('fireAge', result)
        
        # Verify array lengths
        years_length = len(result['years'])
        self.assertEqual(len(result['nominalNetWorth']), years_length)
        self.assertEqual(len(result['realNetWorth']), years_length)
        
        # Extract parameters for calculations
        inflation_rate = data['inflationRate'] / 100
        annual_return = data['annualReturn'] / 100
        real_return_rate = (1 + annual_return) / (1 + inflation_rate) - 1
        
        # Verify real vs nominal relationships
        for i in range(years_length):
            # Check nominal vs real net worth relationship
            expected_nominal = result['realNetWorth'][i] * ((1 + inflation_rate) ** i)
            self.assertAlmostEqual(result['nominalNetWorth'][i], expected_nominal, delta=0.01)
            
            # Check real interest calculation
            if i > 0:
                expected_real_interest = result['realNetWorth'][i-1] * real_return_rate
                self.assertAlmostEqual(result['yearlyRealInterest'][i], expected_real_interest, delta=0.01)
            
            # Check savings calculation
            expected_savings = result['yearlyAfterTaxIncome'][i] - result['yearlySpending'][i]
            self.assertAlmostEqual(result['yearlySavings'][i], expected_savings, delta=0.01)
            
            # Check net worth progression
            if i > 0:
                expected_net_worth = (result['realNetWorth'][i-1] + 
                                    result['yearlySavings'][i] + 
                                    result['yearlyRealInterest'][i])
                self.assertAlmostEqual(result['realNetWorth'][i], expected_net_worth, delta=0.01)
        
        # Verify FIRE age calculations
        if should_be_possible:
            self.assertIsNotNone(result['fireAge'])
            self.assertGreaterEqual(result['fireAge'], data['currentAge'])
            self.assertLessEqual(result['fireAge'], data['endAge'])
            self.assertNotIn('error', result)
            
            # Verify required savings calculation
            required_savings = data['retirementSpending'] / (data['withdrawalRate'] / 100)
            self.assertAlmostEqual(result['requiredSavings'], required_savings, delta=0.01)
            
            # Verify FIRE age is the first year where net worth exceeds required savings
            fire_age_index = result['years'].index(result['fireAge'])
            self.assertGreaterEqual(result['realNetWorth'][fire_age_index], required_savings)
            if fire_age_index > 0:
                self.assertLess(result['realNetWorth'][fire_age_index - 1], required_savings)
        else:
            self.assertIn('error', result)
            self.assertIsNone(result['fireAge'])
            
            # Verify error message contains correct rates
            error_msg = result['error']
            self.assertIn(f"{data['withdrawalRate']:.1f}%", error_msg)
            self.assertIn(f"{real_return_rate*100:.1f}%", error_msg)

if __name__ == '__main__':
    unittest.main() 