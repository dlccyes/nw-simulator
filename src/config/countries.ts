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
    backdoorRoth: number;
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
      currentAge: 24,
      endAge: 50,
      currentNetWorth: 85000,
      annualReturn: 8,
      inflationRate: 3,
      retirementSpending: 100000,
      withdrawalRate: 4,
      country: 'US',
      state: 'CA',
      preTax401k: 24500,
      backdoorRoth: 0,
      employerMatch: 5,
      filingStatus: 'single'
    },
    spendingDefaults: [
      { id: 'spending-1', startAge: 24, endAge: 50, spending: 100000 }
    ],
    incomeDefaults: [
      { id: 'income-1', startAge: 24, endAge: 27, income: 320000 },
      { id: 'income-2', startAge: 28, endAge: 34, income: 400000 },
      { id: 'income-3', startAge: 35, endAge: 40, income: 500000 }
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
      backdoorRoth: 0,
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