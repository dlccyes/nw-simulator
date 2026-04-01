import unittest
from calculator import calculate_fire_projection


class TestIntegration(unittest.TestCase):
    """Integration tests for complete FIRE calculator scenarios."""

    def setUp(self):
        """Set up test fixtures."""
        # Load test scenarios from a standardized format
        self.test_scenarios = {
            "us_default_scenario": {
                "description": "US default values with realistic income progression",
                "request": {
                    "currentAge": 23,
                    "endAge": 50,
                    "currentNetWorth": 70000,
                    "annualReturn": 8,
                    "inflationRate": 3,
                    "retirementSpending": 100000,
                    "withdrawalRate": 4,
                    "country": "US",
                    "state": "CA",
                    "preTax401k": 23000,
                    "employerMatch": 5,
                    "yearlySpending": [{"startAge": 23, "endAge": 50, "amount": 100000}],
                    "yearlyIncome": [
                        {"startAge": 23, "endAge": 25, "amount": 230000},
                        {"startAge": 26, "endAge": 30, "amount": 300000},
                        {"startAge": 31, "endAge": 40, "amount": 400000}
                    ],
                    "stopAtFire": True
                },
                "expected_response": {
                    "fireAge": 36,
                    "requiredSavings": 2500000.0
                }
            },
            "tw_default_scenario": {
                "description": "Taiwan default values with 10x US monetary amounts",
                "request": {
                    "currentAge": 23,
                    "endAge": 50,
                    "currentNetWorth": 700000,
                    "annualReturn": 8,
                    "inflationRate": 3,
                    "retirementSpending": 1000000,
                    "withdrawalRate": 4,
                    "country": "TW",
                    "state": "",
                    "preTax401k": 0,
                    "employerMatch": 0,
                    "yearlySpending": [{"startAge": 23, "endAge": 50, "amount": 1000000}],
                    "yearlyIncome": [
                        {"startAge": 23, "endAge": 25, "amount": 2300000},
                        {"startAge": 26, "endAge": 30, "amount": 3000000},
                        {"startAge": 31, "endAge": 40, "amount": 4000000}
                    ],
                    "stopAtFire": True
                },
                "expected_response": {
                    "fireAge": 34,
                    "requiredSavings": 25000000.0
                }
            },
            "us_no_stop_at_fire_scenario": {
                "description": "US default values continuing work after FIRE (stopAtFire=false)",
                "request": {
                    "currentAge": 23,
                    "endAge": 50,
                    "currentNetWorth": 70000,
                    "annualReturn": 8,
                    "inflationRate": 3,
                    "retirementSpending": 100000,
                    "withdrawalRate": 4,
                    "country": "US",
                    "state": "CA",
                    "preTax401k": 23000,
                    "employerMatch": 5,
                    "yearlySpending": [{"startAge": 23, "endAge": 50, "amount": 100000}],
                    "yearlyIncome": [
                        {"startAge": 23, "endAge": 25, "amount": 230000},
                        {"startAge": 26, "endAge": 30, "amount": 300000},
                        {"startAge": 31, "endAge": 40, "amount": 400000}
                    ],
                    "stopAtFire": False
                },
                "expected_response": {
                    "fireAge": 36,
                    "requiredSavings": 2500000.0
                }
            }
        }

    def compare_arrays(self, actual, expected, tolerance=0.01, array_name="array"):
        """Compare two arrays with tolerance for floating point differences."""
        self.assertEqual(len(actual), len(expected),
                        f"{array_name} length mismatch: expected {len(expected)}, got {len(actual)}")

        for i, (actual_val, expected_val) in enumerate(zip(actual, expected)):
            if isinstance(expected_val, (int, float)) and isinstance(actual_val, (int, float)):
                self.assertAlmostEqual(actual_val, expected_val, delta=tolerance,
                                     msg=f"{array_name}[{i}]: expected {expected_val}, got {actual_val}")
            else:
                self.assertEqual(actual_val, expected_val,
                               f"{array_name}[{i}]: expected {expected_val}, got {actual_val}")

    def compare_response(self, actual, expected, request, tolerance=0.01):
        """Compare actual response with expected response structure."""
        # Check required fields exist
        required_fields = [
            'fireAge', 'nominalNetWorth', 'realNetWorth', 'requiredSavings',
            'yearlyAfterTaxIncome', 'yearlyPreTaxIncome', 'yearlyRealInterest',
            'yearlySavings', 'yearlySpending', 'yearlyTaxRates', 'years'
        ]

        for field in required_fields:
            self.assertIn(field, actual, f"Missing required field: {field}")

        # Compare scalar values (keep these stable)
        self.assertEqual(actual['fireAge'], expected['fireAge'])
        self.assertAlmostEqual(actual['requiredSavings'], expected['requiredSavings'], delta=tolerance)

        # Sanity checks on arrays (avoid brittle golden-data snapshots)
        years_count = len(actual['years'])
        self.assertGreater(years_count, 0, "years should not be empty")
        for array_name in [
            'nominalNetWorth', 'realNetWorth', 'yearlyAfterTaxIncome', 'yearlyPreTaxIncome',
            'yearlyRealInterest', 'yearlySavings', 'yearlySpending', 'yearlyTaxRates'
        ]:
            self.assertEqual(len(actual[array_name]), years_count, f"{array_name} length mismatch")

        # End-of-age net worth definition consistency check:
        # realNetWorth[i] == start_balance(i) + yearlySavings[i] + yearlyRealInterest[i]
        # where start_balance(0) = currentNetWorth, and start_balance(i) = realNetWorth[i-1] for i>0.
        starting_nw = request.get("currentNetWorth", 0)
        for i in range(years_count):
            start_balance = starting_nw if i == 0 else actual['realNetWorth'][i - 1]
            expected_end_balance = (
                start_balance +
                actual['yearlySavings'][i] +
                actual['yearlyRealInterest'][i]
            )
            self.assertAlmostEqual(actual['realNetWorth'][i], expected_end_balance, delta=0.01)

    def test_us_default_scenario(self):
        """Test US default scenario with realistic income progression."""
        scenario = self.test_scenarios["us_default_scenario"]

        # Execute the calculation
        actual_response = calculate_fire_projection(scenario["request"])

        # Compare with expected response
        self.compare_response(actual_response, scenario["expected_response"], scenario["request"])

        # Additional validation specific to this scenario
        self.assertEqual(actual_response['fireAge'], 36, "FIRE age should be 36")
        self.assertAlmostEqual(actual_response['requiredSavings'], 2500000.0, delta=0.01)

        # Verify the calculation makes logical sense
        self.assertGreater(actual_response['realNetWorth'][-1], 0, "Final net worth should be positive")
        self.assertEqual(len(actual_response['years']), 28, "Should cover ages 23-50 (28 years)")

        # Print summary for verification
        print(f"\n✅ {scenario['description']}")
        print(f"FIRE Age: {actual_response['fireAge']}")
        print(f"Required Savings: ${actual_response['requiredSavings']:,.0f}")
        print(f"Final Real Net Worth: ${actual_response['realNetWorth'][-1]:,.0f}")
        print(f"Years to FIRE: {actual_response['fireAge'] - scenario['request']['currentAge']}")

    def test_tw_default_scenario(self):
        """Test Taiwan default scenario with 10x US monetary values."""
        scenario = self.test_scenarios["tw_default_scenario"]

        # Execute the calculation
        actual_response = calculate_fire_projection(scenario["request"])

        # Compare with expected response
        self.compare_response(actual_response, scenario["expected_response"], scenario["request"])

        # Additional validation specific to this scenario
        self.assertEqual(actual_response['fireAge'], 34, "FIRE age should be 34")
        self.assertAlmostEqual(actual_response['requiredSavings'], 25000000.0, delta=0.01)

        # Verify Taiwan-specific calculations
        self.assertEqual(actual_response['yearlyPreTaxIncome'][0], 2300000, "First year income should be 2.3M TWD")
        self.assertEqual(actual_response['yearlySpending'][0], 1000000, "Yearly spending should be 1M TWD")

        # Verify the calculation makes logical sense
        self.assertGreater(actual_response['realNetWorth'][-1], 0, "Final net worth should be positive")
        self.assertEqual(len(actual_response['years']), 28, "Should cover ages 23-50 (28 years)")

        # Verify Taiwan tax rates are lower than US (no state tax, different brackets)
        tw_tax_rate = actual_response['yearlyTaxRates'][0]
        self.assertLess(tw_tax_rate, 20, "Taiwan tax rate should be reasonable")
        self.assertGreater(tw_tax_rate, 10, "Taiwan tax rate should include payroll taxes")

        # Print summary for verification
        print(f"\n✅ {scenario['description']}")
        print(f"FIRE Age: {actual_response['fireAge']}")
        print(f"Required Savings: NT${actual_response['requiredSavings']:,.0f}")
        print(f"Final Real Net Worth: NT${actual_response['realNetWorth'][-1]:,.0f}")
        print(f"Years to FIRE: {actual_response['fireAge'] - scenario['request']['currentAge']}")
        print(f"Tax Rate (first year): {tw_tax_rate:.1f}%")

    def test_us_no_stop_at_fire_scenario(self):
        """Test US scenario continuing work after reaching FIRE (stopAtFire=false)."""
        scenario = self.test_scenarios["us_no_stop_at_fire_scenario"]

        # Execute the calculation
        actual_response = calculate_fire_projection(scenario["request"])

        # Compare with expected response
        self.compare_response(actual_response, scenario["expected_response"], scenario["request"])

        # Additional validation specific to this scenario
        self.assertEqual(actual_response['fireAge'], 36, "FIRE age should be 36")
        self.assertAlmostEqual(actual_response['requiredSavings'], 2500000.0, delta=0.01)

        # Verify continuing work after FIRE - key difference from stopAtFire=true
        fire_age_index = actual_response['years'].index(36)

        # Should continue earning income until age 40 (end of income range)
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index], 400000,
                        "Should continue earning $400k at FIRE age")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 1], 400000,
                        "Should continue earning after FIRE age")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 3], 400000,
                        "Should continue earning until income range ends")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 4], 400000,
                        "Should continue earning at age 40 (end of range)")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 5], 0,
                        "Income should stop at age 41 (end of range)")

        # Verify final net worth is higher than stopAtFire=true scenario
        final_net_worth = actual_response['realNetWorth'][-1]
        self.assertGreater(final_net_worth, 4000000,
                          "Final net worth should be higher when continuing work")

        # Verify the calculation makes logical sense
        self.assertGreater(actual_response['realNetWorth'][-1], 0, "Final net worth should be positive")
        self.assertEqual(len(actual_response['years']), 28, "Should cover ages 23-50 (28 years)")

        # Print summary for verification
        print(f"\n✅ {scenario['description']}")
        print(f"FIRE Age: {actual_response['fireAge']}")
        print(f"Required Savings: ${actual_response['requiredSavings']:,.0f}")
        print(f"Final Real Net Worth: ${actual_response['realNetWorth'][-1]:,.0f}")
        print(f"Years to FIRE: {actual_response['fireAge'] - scenario['request']['currentAge']}")
        print(f"Continues working: {actual_response['yearlyPreTaxIncome'][fire_age_index + 1] > 0}")
        print(f"Extra years of income: {fire_age_index + 4 - fire_age_index} years")

    def add_test_scenario(self, name, description, request, expected_response):
        """Helper method to add new test scenarios programmatically."""
        self.test_scenarios[name] = {
            "description": description,
            "request": request,
            "expected_response": expected_response
        }

    def run_scenario_test(self, scenario_name):
        """Generic method to run any scenario test."""
        if scenario_name not in self.test_scenarios:
            self.fail(f"Scenario '{scenario_name}' not found")

        scenario = self.test_scenarios[scenario_name]
        actual_response = calculate_fire_projection(scenario["request"])
        self.compare_response(actual_response, scenario["expected_response"], scenario["request"])

        print(f"\n✅ {scenario['description']} - PASSED")
        return actual_response

    def test_response_structure_validity(self):
        """Test that all scenarios produce valid response structures."""
        for scenario_name, scenario in self.test_scenarios.items():
            with self.subTest(scenario=scenario_name):
                response = calculate_fire_projection(scenario["request"])

                # Verify no errors in response
                self.assertNotIn('error', response, f"Scenario {scenario_name} produced an error")

                # Verify basic structure
                self.assertIn('fireAge', response)
                self.assertIn('years', response)
                self.assertIn('nominalNetWorth', response)
                self.assertIn('realNetWorth', response)

                # Verify array consistency
                years_count = len(response['years'])
                arrays_to_check = [
                    'nominalNetWorth', 'realNetWorth', 'yearlyAfterTaxIncome',
                    'yearlyPreTaxIncome', 'yearlyRealInterest', 'yearlySavings',
                    'yearlySpending', 'yearlyTaxRates'
                ]

                for array_name in arrays_to_check:
                    if array_name in response:
                        self.assertEqual(len(response[array_name]), years_count,
                                       f"Array {array_name} length mismatch in {scenario_name}")


if __name__ == '__main__':
    # Create a test suite that can be run independently or as part of larger test runs
    unittest.main(verbosity=2)
