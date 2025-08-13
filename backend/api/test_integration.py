import unittest
import json
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
                        70000.0, 150696.43274, 240101.47308139998, 385294.35713502794,
                        545882.2148991596, 723210.0305602219, 918733.7886282429,
                        1134029.4560104017, 1444581.896124367, 1786573.4339564433,
                        2162717.04439935, 2575948.6757494807, 3029445.2656415673,
                        3526644.2035999848, 3657516.767402473, 3794321.367134594,
                        3937396.432595483, 4087103.3839759463, 4243828.348570032,
                        4407984.011147924, 4580011.608572817, 4760383.0800876925,
                        4949603.38560863, 5148213.00534466, 5356790.635126192,
                        5575956.092970866, 5806373.453654151, 6048754.429389467
                    ],
                    "realNetWorth": [
                        70000, 146307.21625242717, 226318.66630351587, 352598.91732795833,
                        485009.277625432, 623847.325315987, 769425.0840594815,
                        922069.7242953787, 1140366.2885233096, 1369259.7733448294,
                        1609264.5923809863, 1860920.1307878303, 2124791.9574668515,
                        2401473.096120582, 2418049.4600099307, 2435430.5017579854,
                        2453655.2833967227, 2472764.7631732626, 2492801.8875991493,
                        2513811.68796804, 2535841.3815587214, 2558940.4777508923,
                        2583160.889292198, 2608557.0489665763, 2635186.031926119,
                        2663107.6839613672, 2692384.755998327, 2723083.045124459
                    ],
                    "requiredSavings": 2500000.0,
                    "yearlyAfterTaxIncome": [
                        172909.158, 172909.158, 172909.158, 215293.908, 215293.908,
                        215293.908, 215293.908, 215293.908, 273535.898, 273535.898,
                        273535.898, 273535.898, 273535.898, 273535.898, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyPreTaxIncome": [
                        230000, 230000, 230000, 300000, 300000, 300000, 300000,
                        300000, 400000, 400000, 400000, 400000, 400000, 400000,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyRealInterest": [
                        0, 3398.058252427183, 7102.292051088694, 10986.343024442513,
                        17116.452297473697, 23544.13969055494, 30283.850743494502,
                        37350.73223589714, 44760.66622793098, 55357.58682151986,
                        66468.92103615674, 78119.64040684396, 90335.92867902086,
                        103145.24065373061, 116576.36388934859, 117381.04174805483,
                        118224.7816387371, 119109.47977653988, 120037.12442588648,
                        121009.80036889069, 122029.69359068149, 123099.0961921709,
                        124220.4115413054, 125396.15967437848, 126628.98295954248,
                        127921.65203524842, 129277.07203695952, 130698.28912613232
                    ],
                    "yearlySavings": [
                        72909.158, 72909.158, 72909.158, 115293.908, 115293.908,
                        115293.908, 115293.908, 115293.908, 173535.898, 173535.898,
                        173535.898, 173535.898, 173535.898, 173535.898, -100000,
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
                        29.822105217391304, 29.822105217391304, 29.822105217391304,
                        33.235364, 33.235364, 33.235364, 33.235364, 33.235364,
                        36.616025500000006, 36.616025500000006, 36.616025500000006,
                        36.616025500000006, 36.616025500000006, 36.616025500000006,
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
                        70000.0, 150696.43274, 240101.47308139998, 385294.35713502794,
                        545882.2148991596, 723210.0305602219, 918733.7886282429,
                        1134029.4560104017, 1444581.896124367, 1786573.4339564433,
                        2162717.04439935, 2575948.6757494807, 3029445.2656415673,
                        3526644.2035999848, 4071264.356096289, 4667328.779278546,
                        5319189.25455622, 6031552.79304417, 6343833.710363714,
                        6675989.8018851, 7029457.862568967, 7405785.034403534,
                        7806637.496269738, 8233809.844858657, 8689235.221801309,
                        9174996.24657999, 9693336.819552006, 10246674.864559153
                    ],
                    "realNetWorth": [
                        70000, 146307.21625242717, 226318.66630351587, 352598.91732795833,
                        485009.277625432, 623847.325315987, 769425.0840594815,
                        922069.7242953787, 1140366.2885233096, 1369259.7733448294,
                        1609264.5923809863, 1860920.1307878303, 2124791.9574668515,
                        2401473.096120582, 2691585.3580099307, 2995780.739408471,
                        3314742.886894319, 3649188.6337726843, 3726333.713082038,
                        3807223.699153981, 3892040.3835789314, 3980974.382781792,
                        4074225.566411976, 4172003.506529062, 4274527.948593579,
                        4382029.305321422, 4494749.174511783, 4612940.882012355
                    ],
                    "requiredSavings": 2500000.0,
                    "yearlyAfterTaxIncome": [
                        172909.158, 172909.158, 172909.158, 215293.908, 215293.908,
                        215293.908, 215293.908, 215293.908, 273535.898, 273535.898,
                        273535.898, 273535.898, 273535.898, 273535.898, 273535.898,
                        273535.898, 273535.898, 273535.898, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyPreTaxIncome": [
                        230000, 230000, 230000, 300000, 300000, 300000, 300000, 300000,
                        400000, 400000, 400000, 400000, 400000, 400000, 400000, 400000,
                        400000, 400000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    "yearlyRealInterest": [
                        0, 3398.058252427183, 7102.292051088694, 10986.343024442513,
                        17116.452297473697, 23544.13969055494, 30283.850743494502,
                        37350.73223589714, 44760.66622793098, 55357.58682151986,
                        66468.92103615674, 78119.64040684396, 90335.92867902086,
                        103145.24065373061, 116576.36388934859, 130659.48339854027,
                        145426.24948584806, 160909.84887836495, 177145.07930935352,
                        180889.9860719435, 184816.68442495045, 188933.99920286066,
                        193251.18363018398, 197777.9401170861, 202524.4420645175,
                        207501.35672784355, 212719.86919036022, 218191.70750057188
                    ],
                    "yearlySavings": [
                        72909.158, 72909.158, 72909.158, 115293.908, 115293.908,
                        115293.908, 115293.908, 115293.908, 173535.898, 173535.898,
                        173535.898, 173535.898, 173535.898, 173535.898, 173535.898,
                        173535.898, 173535.898, 173535.898, -100000, -100000, -100000,
                        -100000, -100000, -100000, -100000, -100000, -100000, -100000
                    ],
                    "yearlySpending": [
                        100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000,
                        100000, 100000, 100000, 100000
                    ],
                    "yearlyTaxRates": [
                        29.822105217391304, 29.822105217391304, 29.822105217391304,
                        33.235364, 33.235364, 33.235364, 33.235364, 33.235364,
                        36.616025500000006, 36.616025500000006, 36.616025500000006,
                        36.616025500000006, 36.616025500000006, 36.616025500000006,
                        36.616025500000006, 36.616025500000006, 36.616025500000006,
                        36.616025500000006, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
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