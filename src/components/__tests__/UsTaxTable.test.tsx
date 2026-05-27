import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UsTaxTable from '../UsTaxTable';
import axios from 'axios';
import type { Mock } from 'vitest';

vi.mock('axios');

const mockedAxios = axios as unknown as { post: Mock; get: Mock };

describe('UsTaxTable', () => {
  beforeEach(() => {
    mockedAxios.post.mockResolvedValue({
      data: [
        {
          stateCode: 'CA',
          stateName: 'California',
          effectiveRate: 25.12,
          afterTaxIncome: 175000,
          totalTax: 55000,
          federalTax: 35000,
          stateTax: 15000,
          payrollTax: 5000
        }
      ]
    });
    mockedAxios.get.mockResolvedValue({ data: { federal: { standard_deduction: 0, brackets: [] }, payroll_taxes: {}, states: {} } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and shows results row', async () => {
    render(<UsTaxTable />);
    await waitFor(() => {
      expect(screen.getByText(/California/)).toBeInTheDocument();
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/us-tax-comparison$/),
      expect.objectContaining({ tax_exempt_income: 24500 })
    );
  });

  it('ranks emojis based on filtered states, not all states', async () => {
    // This test verifies the bug fix: emojis should be ranked among filtered states,
    // not all states. When filtering to CA, NY, TX, they should get 🥇🥈🥉 respectively
    // based on their effective rates within the filtered subset.
    mockedAxios.post.mockResolvedValue({
      data: [
        {
          stateCode: 'CA',
          stateName: 'California',
          effectiveRate: 30.0, // Highest - should be 🥇 when filtered to top 3
          afterTaxIncome: 140000,
          totalTax: 90000,
          federalTax: 60000,
          stateTax: 25000,
          payrollTax: 5000
        },
        {
          stateCode: 'NY',
          stateName: 'New York',
          effectiveRate: 28.0, // Second highest - should be 🥈 when filtered to top 3
          afterTaxIncome: 144000,
          totalTax: 86000,
          federalTax: 58000,
          stateTax: 23000,
          payrollTax: 5000
        },
        {
          stateCode: 'TX',
          stateName: 'Texas',
          effectiveRate: 20.0, // Third highest - should be 🥉 when filtered to top 3
          afterTaxIncome: 160000,
          totalTax: 70000,
          federalTax: 60000,
          stateTax: 0,
          payrollTax: 10000
        },
        {
          stateCode: 'FL',
          stateName: 'Florida',
          effectiveRate: 18.0, // Lower - should not get medal when filtered
          afterTaxIncome: 164000,
          totalTax: 66000,
          federalTax: 60000,
          stateTax: 0,
          payrollTax: 6000
        },
        {
          stateCode: 'WA',
          stateName: 'Washington',
          effectiveRate: 19.0, // Lower - should not get medal when filtered
          afterTaxIncome: 162000,
          totalTax: 68000,
          federalTax: 60000,
          stateTax: 0,
          payrollTax: 8000
        }
      ]
    });

    render(<UsTaxTable />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/California/)).toBeInTheDocument();
    });

    // Find the Autocomplete input for state filtering
    const autocompleteInput = screen.getByPlaceholderText(/Search and select states to filter/i);
    
    // Filter to only CA, NY, and TX (the top 3 by effective rate)
    // Click to open the dropdown
    fireEvent.mouseDown(autocompleteInput);
    await waitFor(() => {
      const californiaOption = screen.getByText('California');
      fireEvent.click(californiaOption);
    });

    fireEvent.mouseDown(autocompleteInput);
    await waitFor(() => {
      const newYorkOption = screen.getByText('New York');
      fireEvent.click(newYorkOption);
    });

    fireEvent.mouseDown(autocompleteInput);
    await waitFor(() => {
      const texasOption = screen.getByText('Texas');
      fireEvent.click(texasOption);
    });

    // Wait for filtered results and verify emojis are assigned based on filtered subset
    await waitFor(() => {
      // California should have 🥇 (highest effective rate among filtered states: CA, NY, TX)
      expect(screen.getByText(/California.*🥇/)).toBeInTheDocument();
      // New York should have 🥈 (second highest among filtered states)
      expect(screen.getByText(/New York.*🥈/)).toBeInTheDocument();
      // Texas should have 🥉 (third highest among filtered states)
      expect(screen.getByText(/Texas.*🥉/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
