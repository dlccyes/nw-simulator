# Tax Configuration Schema

## Overview

The tax system has been redesigned to be forward-compatible and support multiple countries with different tax structures. All hardcoded tax values have been moved to JSON configuration files.

## Schema Structure

### Top Level
```json
{
  "federal": { ... },       // Federal/national tax configuration
  "payroll_taxes": { ... }, // Payroll/social security taxes
  "states": { ... }         // State/regional taxes (optional, US only)
}
```

### Federal Tax Configuration

#### Single Filing Status Structure
```json
"federal": {
  "standard_deduction": 14600,
  "brackets": [
    {"min": 0, "max": 11600, "rate": 0.10},
    {"min": 11600, "max": 47150, "rate": 0.12},
    ...
    {"min": 609350, "max": null, "rate": 0.37}
  ]
}
```

#### Multiple Filing Status Structure
```json
"federal": {
  "single": {
    "standard_deduction": 14600,
    "brackets": [...]
  },
  "married": {
    "standard_deduction": 29200,
    "brackets": [...]
  }
}
```

The system supports both legacy single-structure and modern multi-filing-status structures. For countries supporting married filing jointly (like US and Taiwan), use the multi-status structure.

### Payroll Tax Configuration

#### US Structure
```json
"payroll_taxes": {
  "social_security": {
    "rate": 0.062,
    "wage_base": 168600
  },
  "medicare": {
    "rate": 0.0145,
    "additional_rate": 0.009,
    "additional_threshold": 200000
  }
}
```

#### Taiwan Structure
```json
"payroll_taxes": {
  "labor_insurance": {
    "rate": 0.025,
    "description": "Direct payroll deduction"
  },
  "health_insurance": {
    "rate": 0.0155,
    "annual_cap": 56364,
    "annual_cap_married": 112728,
    "description": "Direct payroll deduction with annual cap (per person for single, combined for married)"
  }
}
```

### State/Regional Tax Configuration
```json
"states": {
  "CA": {
    "standard_deduction": 5540,
    "brackets": [
      {"min": 0, "max": 10756, "rate": 0.01},
      ...
    ]
  },
  "FL": {
    "standard_deduction": 0,
    "brackets": []  // No state income tax
  }
}
```

## File Structure

```
backend/data/tax-rates/
├── US.json    # United States tax configuration
├── TW.json    # Taiwan tax configuration
└── XX.json    # Additional countries as needed
```

Each file is named with the two-letter country code and contains the tax configuration for that country.

## Forward Compatibility

### Supporting Countries Without State Taxes
The schema handles countries without regional taxes by:
1. Omitting the `states` key entirely
2. The tax calculation system automatically returns empty state tax configurations for non-US countries

### Adding New Countries
To add a new country:
1. Create `{COUNTRY_CODE}.json` in `backend/data/tax-rates/` following the schema
2. Implement country-specific payroll tax logic in `tax.py` if needed
3. The system will automatically load and use the new configuration

### Extending Tax Types
New tax types can be added to the `payroll_taxes` section without breaking existing functionality. The tax calculation logic can be extended to handle new tax types while maintaining backward compatibility.

## API Changes

The tax calculation functions now accept an optional `country_code` parameter:
```python
calculate_income_tax(income, state, pre_tax_401k, employer_match, country_code='US')
```

This allows the same tax engine to work with different countries while maintaining backward compatibility for existing code.

## Country-Specific Implementations

### Taiwan (TW)
Taiwan's tax system includes:
- **Federal income tax**: Progressive brackets with standard deduction
- **Labor Insurance**: 2.5% of income (treated as payroll tax)
- **Health Insurance**: 1.55% of income with annual cap of 4,697 TWD
- **No state/regional taxes**

Both labor and health insurance are direct payroll deductions, similar to US Social Security and Medicare, but with Taiwan-specific rates and caps.

## Benefits

1. **No Hardcoded Values**: All tax rates and thresholds are now in JSON files
2. **Easy Updates**: Tax rates can be updated without code changes
3. **Multi-Country Support**: Framework supports any number of countries
4. **Forward Compatible**: New tax types and countries can be added without breaking changes
5. **Clean Schema**: Simple structure with country code as filename, no redundant metadata
6. **Organized Structure**: All tax files in dedicated `tax-rates` directory
7. **Flexible Structure**: Accommodates different tax systems (federal only, state taxes, different payroll tax structures) 