# Country Configuration

This directory contains the configuration for different countries supported by the FIRE calculator.

## Adding a New Country

To add support for a new country, follow these steps:

### 1. Update `countries.ts`

Add a new entry to the `COUNTRY_CONFIG` object with the following structure:

```typescript
'COUNTRY_CODE': {
  currency: { 
    symbol: 'SYMBOL',  // e.g., '£', '€', '¥'
    code: 'CODE'       // e.g., 'GBP', 'EUR', 'JPY'
  },
  defaults: {
    currentAge: 23,
    endAge: 50,
    currentNetWorth: 0,      // Adjust for local currency
    annualReturn: 7,         // Typical market return for the country
    inflationRate: 2.5,     // Historical inflation rate
    retirementSpending: 0,   // Adjust for local currency and cost of living
    withdrawalRate: 4,
    country: 'COUNTRY_CODE',
    state: '',               // Leave empty unless country has states/provinces
    preTax401k: 0,          // Adjust based on local retirement systems
    employerMatch: 0,
    filingStatus: 'single'
  },
  spendingDefaults: [
    { id: 'spending-1', startAge: 23, endAge: 50, spending: 0 }  // Adjust amounts
  ],
  incomeDefaults: [
    { id: 'income-1', startAge: 23, endAge: 25, income: 0 },     // Adjust amounts
    { id: 'income-2', startAge: 26, endAge: 30, income: 0 },
    { id: 'income-3', startAge: 31, endAge: 40, income: 0 }
  ]
}
```

### 2. Research Required

Before adding a country, research the following:

- **Currency**: Symbol and ISO code
- **Market Returns**: Historical stock market returns
- **Inflation**: Historical inflation rates
- **Wages**: Typical salary ranges by age group
- **Cost of Living**: Average spending amounts
- **Retirement Systems**: How retirement savings work (401k equivalent)
- **Tax System**: Whether the backend supports the country's tax calculations

### 3. Backend Integration

Ensure the backend API supports tax calculations for the new country:

- Add tax bracket data to `backend/data/tax-rates/[COUNTRY_CODE].json`
- Update backend tax calculation logic if needed
- Test tax calculations for accuracy

### 4. Testing

After adding a new country:

1. Test currency symbol display in all UI components
2. Verify default values are reasonable for the country
3. Test country switching functionality
4. Validate tax calculations (if supported)
5. Check that all monetary values display correctly

## Current Supported Countries

- **US** 🇺🇸: Full tax calculation support
- **TW** 🇹🇼: Full tax calculation support

## Example: Adding United Kingdom

```typescript
'GB': {
  currency: { symbol: '£', code: 'GBP' },
  defaults: {
    currentAge: 23,
    endAge: 50,
    currentNetWorth: 50000,    // £50k starting net worth
    annualReturn: 7,           // UK historical market returns
    inflationRate: 2.5,       // UK historical inflation
    retirementSpending: 60000, // £60k annual spending
    withdrawalRate: 4,
    country: 'GB',
    state: '',
    preTax401k: 0,            // UK uses pension schemes, not 401k
    employerMatch: 0,
    filingStatus: 'single'
  },
  spendingDefaults: [
    { id: 'spending-1', startAge: 23, endAge: 50, spending: 60000 }
  ],
  incomeDefaults: [
    { id: 'income-1', startAge: 23, endAge: 25, income: 40000 },  // Graduate salary
    { id: 'income-2', startAge: 26, endAge: 30, income: 55000 },  // Mid-career
    { id: 'income-3', startAge: 31, endAge: 40, income: 75000 }   // Senior role
  ]
}
```

## Notes

- Monetary values should reflect the typical economic situation in each country
- Currency symbols should be the most commonly used representation
- Default values can be adjusted based on user feedback and local economic data
- The system gracefully falls back to US defaults for unsupported countries 