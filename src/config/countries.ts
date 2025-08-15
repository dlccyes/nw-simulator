// Country configuration for FIRE calculator
// This file centralizes all country-specific settings for easy maintenance and scalability

export interface CountryConfig {
  currency: {
    symbol: string;
    code: string;
  };
  defaults: {
    currentAge: number;
    endAge: number;
    currentNetWorth: number;
    annualReturn: number;
    inflationRate: number;
    retirementSpending: number;
    withdrawalRate: number;
    country: string;
    state: string;
    preTax401k: number;
    employerMatch: number;
    filingStatus: string;
  };
  spendingDefaults: Array<{
    id: string;
    startAge: number;
    endAge: number;
    spending: number;
  }>;
  incomeDefaults: Array<{
    id: string;
    startAge: number;
    endAge: number;
    income: number;
  }>;
}

export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  'US': {
    currency: { symbol: '$', code: 'USD' },
    defaults: {
      currentAge: 23,
      endAge: 50,
      currentNetWorth: 70000,
      annualReturn: 8,
      inflationRate: 3,
      retirementSpending: 100000,
      withdrawalRate: 4,
      country: 'US',
      state: 'CA',
      preTax401k: 23000,
      employerMatch: 5,
      filingStatus: 'single'
    },
    spendingDefaults: [
      { id: 'spending-1', startAge: 23, endAge: 50, spending: 100000 }
    ],
    incomeDefaults: [
      { id: 'income-1', startAge: 23, endAge: 25, income: 230000 },
      { id: 'income-2', startAge: 26, endAge: 30, income: 300000 },
      { id: 'income-3', startAge: 31, endAge: 40, income: 400000 }
    ]
  },
  'TW': {
    currency: { symbol: 'NT$', code: 'TWD' },
    defaults: {
      currentAge: 23,
      endAge: 50,
      currentNetWorth: 700000,  // 10x US values for Taiwan
      annualReturn: 8,
      inflationRate: 3,
      retirementSpending: 1000000,
      withdrawalRate: 4,
      country: 'TW',
      state: '',
      preTax401k: 0,  // Taiwan doesn't use 401k system
      employerMatch: 0,
      filingStatus: 'single'
    },
    spendingDefaults: [
      { id: 'spending-1', startAge: 23, endAge: 50, spending: 1000000 }
    ],
    incomeDefaults: [
      { id: 'income-1', startAge: 23, endAge: 25, income: 2300000 },
      { id: 'income-2', startAge: 26, endAge: 30, income: 3000000 },
      { id: 'income-3', startAge: 31, endAge: 40, income: 4000000 }
    ]
  }
  // Future countries can be easily added here:
  // 'GB': {
  //   currency: { symbol: '£', code: 'GBP' },
  //   defaults: {
  //     currentAge: 23,
  //     endAge: 50,
  //     currentNetWorth: 50000,
  //     annualReturn: 7,
  //     inflationRate: 2.5,
  //     retirementSpending: 60000,
  //     withdrawalRate: 4,
  //     country: 'GB',
  //     state: '',
  //     preTax401k: 0,  // UK uses different pension systems
  //     employerMatch: 0,
  //     filingStatus: 'single'
  //   },
  //   spendingDefaults: [
  //     { id: 'spending-1', startAge: 23, endAge: 50, spending: 60000 }
  //   ],
  //   incomeDefaults: [
  //     { id: 'income-1', startAge: 23, endAge: 25, income: 40000 },
  //     { id: 'income-2', startAge: 26, endAge: 30, income: 55000 },
  //     { id: 'income-3', startAge: 31, endAge: 40, income: 75000 }
  //   ]
  // },
  // 'CA': {
  //   currency: { symbol: 'C$', code: 'CAD' },
  //   defaults: { /* Canadian defaults */ },
  //   spendingDefaults: [ /* Canadian spending patterns */ ],
  //   incomeDefaults: [ /* Canadian income patterns */ ]
  // },
  // 'AU': {
  //   currency: { symbol: 'A$', code: 'AUD' },
  //   defaults: { /* Australian defaults */ },
  //   spendingDefaults: [ /* Australian spending patterns */ ],
  //   incomeDefaults: [ /* Australian income patterns */ ]
  // },
  // 'JP': {
  //   currency: { symbol: '¥', code: 'JPY' },
  //   defaults: { /* Japanese defaults with yen values */ },
  //   spendingDefaults: [ /* Japanese spending patterns */ ],
  //   incomeDefaults: [ /* Japanese income patterns */ ]
  // }
};

// Helper functions for easy access to country data
export const getCurrencySymbol = (country: string): string => {
  return COUNTRY_CONFIG[country]?.currency.symbol || '$';
};

export const getCurrencyCode = (country: string): string => {
  return COUNTRY_CONFIG[country]?.currency.code || 'USD';
};

export const getCountryDefaults = (country: string) => {
  const config = COUNTRY_CONFIG[country];
  return config ? {
    inputs: config.defaults,
    spending: [...config.spendingDefaults],
    income: [...config.incomeDefaults]
  } : {
    inputs: COUNTRY_CONFIG.US.defaults,
    spending: [...COUNTRY_CONFIG.US.spendingDefaults],
    income: [...COUNTRY_CONFIG.US.incomeDefaults]
  };
};

export const getSupportedCountries = (): string[] => {
  return Object.keys(COUNTRY_CONFIG);
};

export const isCountrySupported = (country: string): boolean => {
  return country in COUNTRY_CONFIG;
}; 