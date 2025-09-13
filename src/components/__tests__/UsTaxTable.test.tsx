import { render, screen, waitFor } from '@testing-library/react';
import UsTaxTable from '../UsTaxTable';
import axios from 'axios';

vi.mock('axios');

const mockedAxios = axios as unknown as { post: any; get: any };

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
  });
});
