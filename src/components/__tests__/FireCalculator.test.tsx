import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FireCalculator from '../FireCalculator';

// Minimal responses for tax-info and calculate
const taxInfoResponse = {
  federal: { standard_deduction: 0, brackets: [] },
  payroll_taxes: {},
  states: {}
};

const calcResponse = {
  years: [30, 31],
  nominalNetWorth: [100000, 110000],
  realNetWorth: [100000, 107000],
  yearlyPreTaxIncome: [100000, 100000],
  yearlyAfterTaxIncome: [70000, 70000],
  yearlySpending: [50000, 50000],
  yearlyTaxRates: [30, 30],
  yearlySavings: [20000, 20000],
  yearlyRealInterest: [0, 7000],
  fireAge: null,
  requiredSavings: 1000000
};

describe('FireCalculator', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/tax-info/')) {
        return Promise.resolve(new Response(JSON.stringify(taxInfoResponse), { status: 200 }));
      }
      if (url.includes('/api/calculate')) {
        return Promise.resolve(new Response(JSON.stringify(calcResponse), { status: 200 }));
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and triggers calculation', async () => {
    render(<FireCalculator />);
    const button = await screen.findByRole('button', { name: /calculate/i });
    fireEvent.click(button);
    await waitFor(() => {
      // called for tax-info (on mount) and calculate (on click)
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

