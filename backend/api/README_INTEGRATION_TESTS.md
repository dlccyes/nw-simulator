# Integration Tests

This directory contains integration tests for the FIRE Calculator backend API. Integration tests verify complete end-to-end scenarios with realistic inputs and expected outputs.

## Current Tests

### US Default Scenario
- **File**: `test_integration.py`
- **Scenario**: US default values with realistic income progression
- **Test**: Verifies complete calculation from age 23-50 with multiple income phases
- **FIRE Age**: 37 (14 years to FIRE)
- **Key Features**: 401k contributions, state taxes (CA), employer matching

## Adding New Integration Tests

### Method 1: Add to Existing Test File

```python
def test_new_scenario(self):
    """Test description here."""
    # Add to setUp method in self.test_scenarios
    self.test_scenarios["new_scenario_name"] = {
        "description": "Description of the scenario",
        "request": {
            # Complete request object
        },
        "expected_response": {
            # Complete expected response
        }
    }
    
    # Run the test
    scenario = self.test_scenarios["new_scenario_name"]
    actual_response = calculate_fire_projection(scenario["request"])
    self.compare_response(actual_response, scenario["expected_response"])
```

### Method 2: Use Helper Methods

```python
def test_taiwan_scenario(self):
    """Test Taiwan scenario with 10x monetary values."""
    request = {
        "currentAge": 23,
        "endAge": 50,
        "currentNetWorth": 700000,  # 10x US value
        "retirementSpending": 1000000,  # 10x US value
        "country": "TW",
        "state": "",
        # ... other Taiwan-specific values
    }
    
    # Generate expected response by running calculation
    expected_response = calculate_fire_projection(request)
    
    # Add to test scenarios
    self.add_test_scenario(
        "taiwan_default",
        "Taiwan default values (10x US monetary values)", 
        request,
        expected_response
    )
    
    # Run test
    actual_response = self.run_scenario_test("taiwan_default")
```

### Method 3: External Test Data

Create JSON files with test scenarios:

```json
{
  "scenarios": {
    "high_earner_us": {
      "description": "High earner in US with aggressive savings",
      "request": {
        "currentAge": 25,
        "endAge": 45,
        "currentNetWorth": 100000,
        "yearlyIncome": [
          {"startAge": 25, "endAge": 35, "amount": 500000},
          {"startAge": 36, "endAge": 45, "amount": 600000}
        ],
        "country": "US",
        "state": "CA"
      },
      "tolerance": 0.01
    }
  }
}
```

## Test Structure

### Request Format
All requests must include:
- `currentAge`, `endAge`: Age range
- `currentNetWorth`: Starting net worth
- `annualReturn`, `inflationRate`: Return assumptions  
- `retirementSpending`, `withdrawalRate`: FIRE targets
- `country`: "US" or "TW"
- `yearlyIncome`: Array of income phases
- `yearlySpending`: Array of spending phases

### Response Validation
Tests automatically verify:
- **Structure**: All required fields present
- **Arrays**: Consistent lengths across all yearly data
- **Values**: Numerical accuracy within tolerance
- **Logic**: Mathematical relationships (savings = income - spending)

### Tolerance Settings
- **Default**: 0.01 (1 cent tolerance)
- **Custom**: Can be set per test for specific scenarios
- **Arrays**: Element-by-element comparison with tolerance

## Running Tests

### Single Integration Test
```bash
cd backend/api
python3 -m pytest test_integration.py -v
```

### Specific Scenario
```bash
python3 -m pytest test_integration.py::TestIntegration::test_us_default_scenario -v -s
```

### All Tests (Including Integration)
```bash
cd ../../  # From project root
python3 test_backend.py
```

## Best Practices

### 1. Realistic Scenarios
- Use realistic income/spending values for each country
- Include appropriate tax considerations
- Test edge cases (early retirement, high inflation, etc.)

### 2. Clear Documentation
- Descriptive test names and scenario descriptions
- Document key assumptions and expected outcomes
- Include tolerance rationale for custom values

### 3. Forward Compatibility
- Use the scenario dictionary structure for consistency
- Include all required fields even if zero/default
- Consider future feature additions when designing tests

### 4. Verification Steps
- Run test to get actual values first
- Manually verify a few key calculations
- Use reasonable tolerance for floating point comparisons
- Test both success and edge cases

## Example: Adding Taiwan Test

```python
def test_taiwan_default_scenario(self):
    """Test Taiwan default scenario with 10x monetary values."""
    taiwan_request = {
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
    }
    
    # Run calculation to get expected response
    expected_response = calculate_fire_projection(taiwan_request)
    
    # Verify the response makes sense
    self.assertIsNotNone(expected_response['fireAge'])
    self.assertGreater(expected_response['requiredSavings'], 0)
    
    # Add to scenarios for future runs
    self.add_test_scenario(
        "taiwan_default",
        "Taiwan default values with 10x monetary amounts",
        taiwan_request,
        expected_response
    )
    
    # Test it
    actual = self.run_scenario_test("taiwan_default")
    
    print(f"Taiwan FIRE Age: {actual['fireAge']}")
    print(f"Required Savings: NT${actual['requiredSavings']:,.0f}")
```

## Troubleshooting

### Common Issues
1. **Floating Point Precision**: Use appropriate tolerance values
2. **Array Length Mismatches**: Ensure age ranges are consistent
3. **Missing Fields**: Include all required request/response fields
4. **Tax Calculation Changes**: Update expected values when tax logic changes

### Debugging
```python
# Print actual vs expected for debugging
print("Actual:", actual_response['fireAge'])
print("Expected:", expected_response['fireAge'])

# Use delta parameter for specific comparisons
self.assertAlmostEqual(actual, expected, delta=1.0)
``` 