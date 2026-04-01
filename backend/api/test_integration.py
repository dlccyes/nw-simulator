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
                    "fireAge": 37,
                    "nominalNetWorth": [
                        70000.0, 150615.88674, 239931.52102139994, 385118.2394538279,
                        545699.6612633717, 723020.7556972761, 918537.4913318778,
                        1133825.8180726122, 1444370.5811881076, 1786354.0862829336,
                        2162489.2875433387, 2575712.1111353096, 3029199.471032293,
                        3526388.7314512203, 3657240.857481807, 3794023.3844202748,
                        3937074.6112640183, 4086755.816937964, 4243452.976169012,
                        4407578.608954822, 4579573.774204266, 4759910.218969658,
                        4949092.695601152, 5147661.460136584, 5356194.96630147,
                        5575312.770640166, 5805678.665536995, 6048004.058222939
                    ],
                    "realNetWorth": [
                        70000, 146229.01625242716, 226158.47018701097, 352437.7447009435,
                        484847.0810844845, 623684.0551565469, 769260.6881641462,
                        921904.1480167746, 1140199.474561278, 1369091.6616176509,
                        1609095.1198903525, 1860749.231477263, 2124619.5620732466,
                        2401299.13201855, 2417867.0510485764, 2435239.237992682,
                        2453454.734982618, 2472554.47939925, 2492581.3958749417,
                        2513580.492762075, 2535598.9632845055, 2558686.291599287,
                        2582894.3640070194, 2608277.585560758, 2634893.002335552,
                        2662800.4296333943, 2692062.5864117146, 2722745.236237526
                    ],
                    "requiredSavings": 2500000.0,
                    "yearlyAfterTaxIncome": [
                        172830.95799999998, 172830.95799999998, 172830.95799999998, 215300.708, 215300.708,
                        215300.708, 215300.708, 215300.708, 273542.698, 273542.698,
                        273542.698, 273542.698, 273542.698, 273542.698, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyPreTaxIncome": [
                        230000, 230000, 230000, 300000, 300000, 300000, 300000,
                        300000, 400000, 400000, 400000, 400000, 400000, 400000,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyRealInterest": [
                        0, 3398.058252427183, 7098.49593458384, 10978.566513932567,
                        17108.62838354094, 23536.266072062346, 30275.925007599348,
                        37342.75185262844, 44752.6285445036, 55349.489056372695,
                        66460.76027270147, 78111.41358691028, 90327.6325959836,
                        103136.87194530318, 116567.91903002663, 117372.18694410559,
                        118215.49698993597, 119099.74441663189, 120026.91647569169,
                        120999.09688713304, 122018.47052243075, 123087.32831478177,
                        124208.07240773234, 125383.22155373875, 126615.41677479402,
                        127907.42729784228, 129262.15677832006, 130682.64982581133
                    ],
                    "yearlySavings": [
                        72830.95799999998, 72830.95799999998, 72830.95799999998, 115300.70800000001, 115300.70800000001,
                        115300.70800000001, 115300.70800000001, 115300.70800000001, 173542.69799999997, 173542.69799999997,
                        173542.69799999997, 173542.69799999997, 173542.69799999997, 173542.69799999997, -100000,
                        -100000, -100000, -100000, -100000, -100000, -100000,
                        -100000, -100000, -100000, -100000, -100000, -100000, -100000
                    ],
                    "yearlySpending": [
                        100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000
                    ],
                    "yearlyTaxRates": [
                        29.856105217391303, 29.856105217391303, 29.856105217391303,
                        33.233097333333326, 33.233097333333326, 33.233097333333326, 33.233097333333326, 33.233097333333326,
                        36.6143255, 36.6143255, 36.6143255,
                        36.6143255, 36.6143255, 36.6143255,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "years": [
                        23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
                        37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
                    ]
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
                    "fireAge": 35,
                    "nominalNetWorth": [
                        700000.0, 1769262.8296000003, 2954464.570456, 4846740.581565119,
                        6940076.238927148, 9252046.641203243, 11801677.604756285,
                        14609563.062361274, 18553994.421798967, 22897250.279425133,
                        27673734.694777858, 32920678.99514877, 34128572.42791449,
                        35390324.50869609, 36708960.74453667, 38087710.18749883,
                        39530020.56339995, 41039574.576200195, 42620307.48105631,
                        44276426.02646372, 46012428.873911396, 47833128.61211481,
                        49743675.49222321, 51749583.020474456, 53856755.555652015,
                        56071518.070449956, 58400648.248542115, 60851411.10285533
                    ],
                    "realNetWorth": [
                        700000, 1717730.902524272, 2784866.2177924407, 4435454.218267801,
                        6166167.849834198, 7980896.706233917, 9883719.196439447,
                        11878911.710441362, 14646694.529977351, 17548835.738811202,
                        20591857.58885058, 23782598.946173426, 23937094.040647864,
                        24099088.896989994, 24268947.581309896, 24447051.832829792,
                        24633801.92180211, 24829617.549074057, 25034938.789320372,
                        25250227.08006408, 25475966.258707967, 25712663.64990738,
                        25960851.205728125, 26221086.701151818, 26493954.9876155,
                        26780069.30740266, 27080072.67183968, 27394639.306395005
                    ],
                    "requiredSavings": 25000000.0,
                    "yearlyAfterTaxIncome": [
                        1983750.32, 1983750.32, 1983750.32, 2515400.32, 2515400.32,
                        2515400.32, 2515400.32, 2515400.32, 3191136.62, 3191136.62,
                        3191136.62, 3191136.62, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0
                    ],
                    "yearlyPreTaxIncome": [
                        2300000, 2300000, 2300000, 3000000, 3000000, 3000000, 3000000,
                        3000000, 4000000, 4000000, 4000000, 4000000, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyRealInterest": [
                        0, 33980.58252427183, 83384.99526816851, 135187.68047536115,
                        215313.311566398, 299328.5363997182, 387422.1702055298,
                        479792.1940019147, 576646.1995359882, 711004.5888338517,
                        851885.2300393784, 999604.7373228433, 1154495.0944744376,
                        1161994.8563421287, 1169858.684319902, 1178104.2515198973,
                        1186750.0889723194, 1195815.6272719465, 1205321.240246313,
                        1215288.2907437067, 1225739.178643887, 1236697.3911994153,
                        1248187.555820746, 1260235.4954236948, 1272868.28646368,
                        1286114.3197871596, 1300003.3644370218, 1314566.6345553237
                    ],
                    "yearlySavings": [
                        983750.3200000001, 983750.3200000001, 983750.3200000001,
                        1515400.3199999998, 1515400.3199999998, 1515400.3199999998,
                        1515400.3199999998, 1515400.3199999998, 2191136.62, 2191136.62,
                        2191136.62, 2191136.62, -1000000, -1000000, -1000000, -1000000,
                        -1000000, -1000000, -1000000, -1000000, -1000000, -1000000,
                        -1000000, -1000000, -1000000, -1000000, -1000000, -1000000
                    ],
                    "yearlySpending": [
                        1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000,
                        1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000,
                        1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000,
                        1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000
                    ],
                    "yearlyTaxRates": [
                        13.749986086956522, 13.749986086956522, 13.749986086956522,
                        16.153322666666668, 16.153322666666668, 16.153322666666668,
                        16.153322666666668, 16.153322666666668, 20.2215845, 20.2215845,
                        20.2215845, 20.2215845, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0
                    ],
                    "years": [
                        23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
                        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
                    ]
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
                    "fireAge": 37,
                    "nominalNetWorth": [
                        70000.0, 150615.88674, 239931.52102139994, 385118.2394538279,
                        545699.6612633717, 723020.7556972761, 918537.4913318778,
                        1133825.8180726122, 1444370.5811881076, 1786354.0862829336,
                        2162489.2875433387, 2575712.1111353096, 3029199.471032293,
                        3526388.7314512203, 4070998.731785752, 4667052.499201598,
                        5318901.784076902, 6031253.564290405, 6343510.5433096485,
                        6675640.781466709, 7029080.920517106, 7405377.936987524,
                        7806197.831060448, 8233335.006432624, 8688722.396301193,
                        9174442.395039866, 9692738.659888672, 10246028.852122748
                    ],
                    "realNetWorth": [
                        70000, 146229.01625242716, 226158.47018701097, 352437.7447009435,
                        484847.0810844845, 623684.0551565469, 769260.6881641462,
                        921904.1480167746, 1140199.474561278, 1369091.6616176509,
                        1609095.1198903525, 1860749.231477263, 2124619.5620732466,
                        2401299.13201855, 2691409.749048576, 2995603.4057402546,
                        3314563.7447956065, 3649007.595455587, 3726143.8864971204,
                        3807024.657686301, 3891831.679904083, 3980755.5478605917,
                        4073996.1084363484, 4171762.9098167536, 4274275.672429217,
                        4381764.782741315, 4494471.811029728, 4612650.0542835975
                    ],
                    "requiredSavings": 2500000.0,
                    "yearlyAfterTaxIncome": [
                        172830.95799999998, 172830.95799999998, 172830.95799999998, 215300.708, 215300.708,
                        215300.708, 215300.708, 215300.708, 273542.698, 273542.698,
                        273542.698, 273542.698, 273542.698, 273542.698, 273542.698,
                        273542.698, 273542.698, 273542.698, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyPreTaxIncome": [
                        230000, 230000, 230000, 300000, 300000, 300000, 300000, 300000,
                        400000, 400000, 400000, 400000, 400000, 400000, 400000, 400000,
                        400000, 400000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyRealInterest": [
                        0, 3398.058252427183, 7098.49593458384, 10978.566513932567,
                        17108.62838354094, 23536.266072062346, 30275.925007599348,
                        37342.75185262844, 44752.6285445036, 55349.489056372695,
                        66460.76027270147, 78111.41358691028, 90327.6325959836,
                        103136.87194530318, 116567.91903002663, 130650.9586916784,
                        145417.6410553521, 160901.1526599808, 177136.29104153326,
                        180880.77118918052, 184807.02221778152, 188923.8679565088,
                        193240.5605757568, 197766.80138040517, 202512.76261246367,
                        207489.11031209782, 212707.02828841325, 218178.24325387017
                    ],
                    "yearlySavings": [
                        72830.95799999998, 72830.95799999998, 72830.95799999998, 115300.70800000001, 115300.70800000001,
                        115300.70800000001, 115300.70800000001, 115300.70800000001, 173542.69799999997, 173542.69799999997,
                        173542.69799999997, 173542.69799999997, 173542.69799999997, 173542.69799999997, 173542.69799999997,
                        173542.69799999997, 173542.69799999997, 173542.69799999997, -100000, -100000, -100000,
                        -100000, -100000, -100000, -100000, -100000, -100000, -100000
                    ],
                    "yearlySpending": [
                        100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000
                    ],
                    "yearlyTaxRates": [
                        29.856105217391303, 29.856105217391303, 29.856105217391303,
                        33.233097333333326, 33.233097333333326, 33.233097333333326, 33.233097333333326, 33.233097333333326,
                        36.6143255, 36.6143255, 36.6143255,
                        36.6143255, 36.6143255, 36.6143255,
                        36.6143255, 36.6143255, 36.6143255,
                        36.6143255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "years": [
                        23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
                        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
                    ]
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

    def compare_response(self, actual, expected, tolerance=0.01):
        """Compare actual response with expected response structure."""
        # Check required fields exist
        required_fields = [
            'fireAge', 'nominalNetWorth', 'realNetWorth', 'requiredSavings',
            'yearlyAfterTaxIncome', 'yearlyPreTaxIncome', 'yearlyRealInterest',
            'yearlySavings', 'yearlySpending', 'yearlyTaxRates', 'years'
        ]

        for field in required_fields:
            self.assertIn(field, actual, f"Missing required field: {field}")

        # Compare scalar values
        self.assertEqual(actual['fireAge'], expected['fireAge'])
        self.assertAlmostEqual(actual['requiredSavings'], expected['requiredSavings'], delta=tolerance)

        # Compare arrays
        self.compare_arrays(actual['nominalNetWorth'], expected['nominalNetWorth'],
                          tolerance, 'nominalNetWorth')
        self.compare_arrays(actual['realNetWorth'], expected['realNetWorth'],
                          tolerance, 'realNetWorth')
        self.compare_arrays(actual['yearlyAfterTaxIncome'], expected['yearlyAfterTaxIncome'],
                          tolerance, 'yearlyAfterTaxIncome')
        self.compare_arrays(actual['yearlyPreTaxIncome'], expected['yearlyPreTaxIncome'],
                          tolerance, 'yearlyPreTaxIncome')
        self.compare_arrays(actual['yearlyRealInterest'], expected['yearlyRealInterest'],
                          tolerance, 'yearlyRealInterest')
        self.compare_arrays(actual['yearlySavings'], expected['yearlySavings'],
                          tolerance, 'yearlySavings')
        self.compare_arrays(actual['yearlySpending'], expected['yearlySpending'],
                          tolerance, 'yearlySpending')
        self.compare_arrays(actual['yearlyTaxRates'], expected['yearlyTaxRates'],
                          tolerance, 'yearlyTaxRates')
        self.compare_arrays(actual['years'], expected['years'], tolerance, 'years')

    def test_us_default_scenario(self):
        """Test US default scenario with realistic income progression."""
        scenario = self.test_scenarios["us_default_scenario"]

        # Execute the calculation
        actual_response = calculate_fire_projection(scenario["request"])

        # Compare with expected response
        self.compare_response(actual_response, scenario["expected_response"])

        # Additional validation specific to this scenario
        self.assertEqual(actual_response['fireAge'], 37, "FIRE age should be 37")
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
        self.compare_response(actual_response, scenario["expected_response"])

        # Additional validation specific to this scenario
        self.assertEqual(actual_response['fireAge'], 35, "FIRE age should be 35")
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
        self.compare_response(actual_response, scenario["expected_response"])

        # Additional validation specific to this scenario
        self.assertEqual(actual_response['fireAge'], 37, "FIRE age should be 37")
        self.assertAlmostEqual(actual_response['requiredSavings'], 2500000.0, delta=0.01)

        # Verify continuing work after FIRE - key difference from stopAtFire=true
        fire_age_index = actual_response['years'].index(37)

        # Should continue earning income until age 40 (end of income range)
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index], 400000,
                        "Should continue earning $400k at FIRE age")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 1], 400000,
                        "Should continue earning after FIRE age")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 3], 400000,
                        "Should continue earning until income range ends")
        self.assertEqual(actual_response['yearlyPreTaxIncome'][fire_age_index + 4], 0,
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
        self.compare_response(actual_response, scenario["expected_response"])

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
