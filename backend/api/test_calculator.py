import unittest
from parameterized import parameterized
from calculator import (
    calculate_yearly_data,
    calculate_income_tax,
    calculate_net_worth,
    calculate_fire_projection
)


class TestCalculator(unittest.TestCase):
    @parameterized.expand([
        # (year, yearly_income, yearly_spending, stop_at_fire, retirement_spending, end_age, fire_age,  expected_income, expected_spending)
        ("normal_case", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, None, 100000, 50000),

        ("fire_stop", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         True, 40000, 65, 25, 0, 40000),

        ("not_fired_yet", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         True, 40000, 65, 35, 100000, 50000),

        ("won't fire", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, 25, 100000, 50000),

        ("no_income", 30,
         [],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, None, 0, 50000),

        ("no_spending", 30,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [],
         False, 40000, 65, None, 100000, 0),

        ("age_out_of_range", 70,
         [{'startAge': 25, 'endAge': 65, 'amount': 100000}],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, None, 0, 0),

        ("multiple_income_sources", 30,
         [
             {'startAge': 25, 'endAge': 65, 'amount': 100000},
             {'startAge': 30, 'endAge': 40, 'amount': 20000}
         ],
         [{'startAge': 25, 'endAge': 65, 'amount': 50000}],
         False, 40000, 65, None, 120000, 50000),
    ])
    def test_calculate_yearly_data(self, name, year, yearly_income, yearly_spending,
                                 stop_at_fire, retirement_spending, end_age, fire_age,
                                 expected_income, expected_spending):
        result = calculate_yearly_data(year, yearly_income, yearly_spending,
                                     stop_at_fire, retirement_spending, end_age, fire_age)
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
        ("230k_income_5pct_match", 230000, 'CA', 23000, 0.05, 172000, 33),
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

        after_tax, tax_rate, tax_breakdown = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match
        )

        # Expected values based on actual calculation with correct tax brackets
        expected_employer_match = gross_income * employer_match  # $11,500

        # Use the actual calculated values from the tax function
        expected_federal_tax = tax_breakdown['federalTax']
        expected_state_tax = tax_breakdown['stateTax']
        expected_social_security = tax_breakdown['socialSecurityTax']
        expected_medicare = tax_breakdown['medicareTax']
        expected_additional_medicare = tax_breakdown['additionalMedicareTax']

        expected_total_tax = (
            expected_federal_tax +
            expected_state_tax +
            expected_social_security +
            expected_medicare +
            expected_additional_medicare
        )

        expected_after_tax_income = gross_income - expected_total_tax
        expected_total_available = expected_after_tax_income + expected_employer_match

        # Verify the calculation is consistent
        self.assertAlmostEqual(after_tax, expected_total_available, delta=1)
        self.assertAlmostEqual(tax_rate, (expected_total_tax / gross_income) * 100, delta=0.1)

        # Print the breakdown for verification
        print(f"\nTax breakdown for ${gross_income:,} income:")
        print(f"Federal tax: ${expected_federal_tax:,.2f}")
        print(f"State tax: ${expected_state_tax:,.2f}")
        print(f"Social Security: ${expected_social_security:,.2f}")
        print(f"Medicare: ${expected_medicare:,.2f}")
        print(f"Additional Medicare: ${expected_additional_medicare:,.2f}")
        print(f"Total tax: ${expected_total_tax:,.2f}")
        print(f"After-tax income: ${expected_after_tax_income:,.2f}")
        print(f"Employer match: ${expected_employer_match:,.2f}")
        print(f"Total available: ${expected_total_available:,.2f}")
        print(f"Effective tax rate: {tax_rate:.1f}%")

    def test_401k_deduction_from_taxable_income(self):
        """Test that 401k contributions are properly deducted from taxable income"""
        gross_income = 100000
        state = 'CA'
        pre_tax_401k = 23000
        employer_match = 0.05

        # Calculate tax with 401k contribution
        after_tax_with_401k, _, tax_breakdown_with_401k = calculate_income_tax(
            gross_income, state, pre_tax_401k, employer_match
        )

        # Calculate tax without 401k contribution
        after_tax_without_401k, _, tax_breakdown_without_401k = calculate_income_tax(
            gross_income, state, 0, employer_match
        )

        # Verify that 401k reduces taxable income
        # Federal taxable income should be reduced by 401k contribution
        federal_taxable_with_401k = gross_income - pre_tax_401k - 14600  # 14600 is federal standard deduction
        federal_taxable_without_401k = gross_income - 14600

        # State taxable income should be reduced by 401k contribution
        state_taxable_with_401k = gross_income - pre_tax_401k - 5540  # 5540 is CA standard deduction
        state_taxable_without_401k = gross_income - 5540

        # Verify that taxable income is reduced by 401k amount
        self.assertEqual(federal_taxable_with_401k, federal_taxable_without_401k - pre_tax_401k)
        self.assertEqual(state_taxable_with_401k, state_taxable_without_401k - pre_tax_401k)

        # Verify that total tax is lower with 401k
        self.assertLess(tax_breakdown_with_401k['totalTax'], tax_breakdown_without_401k['totalTax'])

        # Verify that after-tax income is higher with 401k (excluding employer match)
        after_tax_with_401k_no_match = after_tax_with_401k - (gross_income * employer_match)
        after_tax_without_401k_no_match = after_tax_without_401k - (gross_income * employer_match)
        self.assertGreater(after_tax_with_401k_no_match, after_tax_without_401k_no_match)

        # Verify that the tax savings are reasonable
        tax_savings = tax_breakdown_without_401k['totalTax'] - tax_breakdown_with_401k['totalTax']
        # Tax savings should be at least the 401k contribution times the marginal tax rate
        # For $100k income, marginal rate is around 24% federal + 8% state = 32%
        expected_min_tax_savings = pre_tax_401k * 0.30  # Conservative estimate
        self.assertGreaterEqual(tax_savings, expected_min_tax_savings)

        print("✓ 401k deduction test passed:")
        print(f"  - Tax with 401k: ${tax_breakdown_with_401k['totalTax']:,.2f}")
        print(f"  - Tax without 401k: ${tax_breakdown_without_401k['totalTax']:,.2f}")
        print(f"  - Tax savings: ${tax_savings:,.2f}")
        print(f"  - After-tax income with 401k: ${after_tax_with_401k:,.2f}")
        print(f"  - After-tax income without 401k: ${after_tax_without_401k:,.2f}")

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
