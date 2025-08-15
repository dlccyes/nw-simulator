import unittest
import sys
import os

# Add the parent directory to sys.path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
import json


class TestPartnerIncome(unittest.TestCase):
    """Test partner income calculations for US tax comparison."""

    def setUp(self):
        """Set up test client."""
        app.testing = True
        self.app = app.test_client()

    def test_single_income_baseline(self):
        """Test single income calculation as baseline for comparison."""
        response = self.app.post('/api/us-tax-comparison', 
                                data=json.dumps({
                                    'income': 100000,
                                    'filing_status': 'single'
                                }),
                                content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Find California data for comparison
        ca_data = next((state for state in data if state['stateCode'] == 'CA'), None)
        self.assertIsNotNone(ca_data, "California data should be present")
        
        # Store baseline values for comparison
        self.single_100k_ca = ca_data
        if ca_data:
            print(f"Single $100k CA - Total Tax: ${ca_data['totalTax']:,.2f}, After-Tax: ${ca_data['afterTaxIncome']:,.2f}")

    def test_partner_income_single_filing(self):
        """Test partner income with single filing status - should sum two separate calculations."""
        # First get baseline $100k calculation
        response_100k = self.app.post('/api/us-tax-comparison', 
                                     data=json.dumps({
                                         'income': 100000,
                                         'filing_status': 'single'
                                     }),
                                     content_type='application/json')
        data_100k = json.loads(response_100k.data)
        ca_data_100k = next((state for state in data_100k if state['stateCode'] == 'CA'), None)
        
        # Test with partner income
        response = self.app.post('/api/us-tax-comparison', 
                                data=json.dumps({
                                    'income': 100000,
                                    'partner_income': 50000,
                                    'filing_status': 'single'
                                }),
                                content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        ca_data_with_partner = next((state for state in data if state['stateCode'] == 'CA'), None)
        self.assertIsNotNone(ca_data_with_partner, "California data should be present")
        
        # Get individual calculation for $50k single filer
        response_50k = self.app.post('/api/us-tax-comparison', 
                                    data=json.dumps({
                                        'income': 50000,
                                        'filing_status': 'single'
                                    }),
                                    content_type='application/json')
        
        data_50k = json.loads(response_50k.data)
        ca_data_50k = next((state for state in data_50k if state['stateCode'] == 'CA'), None)
        
        # Manual calculation: $100k single + $50k single should equal combined result
        self.assertIsNotNone(ca_data_100k, "100k single data should be present")
        self.assertIsNotNone(ca_data_50k, "50k single data should be present")
        self.assertIsNotNone(ca_data_with_partner, "Partner data should be present")
        
        if ca_data_100k and ca_data_50k and ca_data_with_partner:
            expected_total_tax = ca_data_100k['totalTax'] + ca_data_50k['totalTax']
            expected_after_tax = ca_data_100k['afterTaxIncome'] + ca_data_50k['afterTaxIncome']
            
            print(f"Single filing with partner:")
            print(f"  $100k individual tax: ${ca_data_100k['totalTax']:,.2f}")
            print(f"  $50k individual tax: ${ca_data_50k['totalTax']:,.2f}")
            print(f"  Expected combined tax: ${expected_total_tax:,.2f}")
            print(f"  Actual combined tax: ${ca_data_with_partner['totalTax']:,.2f}")
            print(f"  Expected after-tax: ${expected_after_tax:,.2f}")
            print(f"  Actual after-tax: ${ca_data_with_partner['afterTaxIncome']:,.2f}")
            
            # Allow for small rounding differences
            self.assertAlmostEqual(ca_data_with_partner['totalTax'], expected_total_tax, places=0,
                                  msg="Single filing with partner should sum individual calculations")
            self.assertAlmostEqual(ca_data_with_partner['afterTaxIncome'], expected_after_tax, places=0,
                                  msg="Single filing after-tax income should sum individual calculations")

    def test_married_filing_jointly_uses_combined_income(self):
        """Test married filing jointly uses combined income for tax brackets."""
        # Test married filing jointly with same incomes
        response = self.app.post('/api/us-tax-comparison', 
                                data=json.dumps({
                                    'income': 100000,
                                    'partner_income': 50000,
                                    'filing_status': 'married'
                                }),
                                content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        ca_data_married = next((state for state in data if state['stateCode'] == 'CA'), None)
        self.assertIsNotNone(ca_data_married, "California data should be present")
        
        # Get what a single person making $150k would pay
        response_150k_single = self.app.post('/api/us-tax-comparison', 
                                           data=json.dumps({
                                               'income': 150000,
                                               'filing_status': 'single'
                                           }),
                                           content_type='application/json')
        
        data_150k_single = json.loads(response_150k_single.data)
        ca_data_150k_single = next((state for state in data_150k_single if state['stateCode'] == 'CA'), None)
        
        # Get what a married couple making $150k combined would pay (without partner income feature)
        response_150k_married = self.app.post('/api/us-tax-comparison', 
                                            data=json.dumps({
                                                'income': 150000,
                                                'filing_status': 'married'
                                            }),
                                            content_type='application/json')
        
        data_150k_married = json.loads(response_150k_married.data)
        ca_data_150k_married = next((state for state in data_150k_married if state['stateCode'] == 'CA'), None)
        
        print(f"\nMarried filing jointly comparison:")
        print(f"  Partner income ($100k + $50k) married: ${ca_data_married['totalTax']:,.2f}")
        print(f"  $150k single filer: ${ca_data_150k_single['totalTax']:,.2f}")
        print(f"  $150k married (no partner): ${ca_data_150k_married['totalTax']:,.2f}")
        
        # The married filing jointly with partner income should be closer to 
        # the married $150k than to the single $150k due to different tax brackets
        married_diff = abs(ca_data_married['totalTax'] - ca_data_150k_married['totalTax'])
        single_diff = abs(ca_data_married['totalTax'] - ca_data_150k_single['totalTax'])
        
        print(f"  Difference from $150k married: ${married_diff:,.2f}")
        print(f"  Difference from $150k single: ${single_diff:,.2f}")
        
        # The married filing with partner should be much closer to regular married filing
        # than to single filing (due to different tax brackets)
        self.assertLess(married_diff, single_diff, 
                       "Married filing with partner should use married tax brackets, not single")
        
        # They should be very close but not exactly equal due to Social Security differences
        self.assertLess(married_diff, 1000,  # Allow some difference for SS calculation
                       "Married filing with partner should be very close to regular married filing")

    def test_social_security_calculated_individually_for_married(self):
        """Test that Social Security tax is calculated individually even for married filing jointly."""
        # Use incomes that will hit Social Security wage base limit
        high_income = 180000  # Above SS wage base of $160,200 (approximate)
        partner_income = 100000  # Below SS wage base
        
        response = self.app.post('/api/us-tax-comparison', 
                                data=json.dumps({
                                    'income': high_income,
                                    'partner_income': partner_income,
                                    'filing_status': 'married'
                                }),
                                content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        ca_data_married = next((state for state in data if state['stateCode'] == 'CA'), None)
        
        # Calculate individual Social Security taxes
        response_high = self.app.post('/api/us-tax-comparison', 
                                     data=json.dumps({
                                         'income': high_income,
                                         'filing_status': 'single'
                                     }),
                                     content_type='application/json')
        
        response_partner = self.app.post('/api/us-tax-comparison', 
                                        data=json.dumps({
                                            'income': partner_income,
                                            'filing_status': 'single'
                                        }),
                                        content_type='application/json')
        
        data_high = json.loads(response_high.data)
        data_partner = json.loads(response_partner.data)
        
        ca_high = next((state for state in data_high if state['stateCode'] == 'CA'), None)
        ca_partner = next((state for state in data_partner if state['stateCode'] == 'CA'), None)
        
        # Compare with what combined income would pay
        combined_income = high_income + partner_income
        response_combined = self.app.post('/api/us-tax-comparison', 
                                         data=json.dumps({
                                             'income': combined_income,
                                             'filing_status': 'married'
                                         }),
                                         content_type='application/json')
        
        data_combined = json.loads(response_combined.data)
        ca_combined = next((state for state in data_combined if state['stateCode'] == 'CA'), None)
        
        print(f"\nSocial Security individual calculation test:")
        print(f"  High income SS contribution: ${ca_high['payrollTax']:,.2f}")
        print(f"  Partner SS contribution: ${ca_partner['payrollTax']:,.2f}")
        print(f"  Expected combined payroll: ${ca_high['payrollTax'] + ca_partner['payrollTax']:,.2f}")
        print(f"  Actual partner payroll: ${ca_data_married['payrollTax']:,.2f}")
        print(f"  Combined income payroll: ${ca_combined['payrollTax']:,.2f}")
        
        # The partner income calculation should be closer to individual sum than combined calculation
        # This proves Social Security is calculated individually
        individual_sum_payroll = ca_high['payrollTax'] + ca_partner['payrollTax']
        
        partner_diff = abs(ca_data_married['payrollTax'] - individual_sum_payroll)
        combined_diff = abs(ca_data_married['payrollTax'] - ca_combined['payrollTax'])
        
        print(f"  Diff from individual sum: ${partner_diff:,.2f}")
        print(f"  Diff from combined calc: ${combined_diff:,.2f}")
        
        # Should be much closer to individual sum (small difference due to Medicare additional tax)
        self.assertLess(partner_diff, combined_diff,
                       "Married filing with partner should calculate Social Security individually")


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2) 