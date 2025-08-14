import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  CircularProgress,
  Alert,
  InputAdornment,
  Slider
} from '@mui/material';
import CalculateButton from './CalculateButton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StateComparison {
  stateCode: string;
  stateName: string;
  effectiveRate: number;
  afterTaxIncome: number;
  totalTax: number;
  federalTax: number;
  stateTax: number;
  payrollTax: number;
}

type SortField = keyof StateComparison;

const UsTaxTable: React.FC = () => {
  const [income, setIncome] = useState<string>('230000');
  const [data, setData] = useState<StateComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('effectiveRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchTaxData = async () => {
    const numericIncome = parseFloat(income.replace(/,/g, ''));
    if (!income || numericIncome < 1) {
      setError('Please enter a valid income amount (minimum $1)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/us-tax-comparison`, {
        income: numericIncome
      });
      // Only update data after successful response to prevent flash
      setData(response.data);
    } catch (err) {
      setError('Failed to calculate tax data. Please try again.');
      console.error('Tax calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (income && parseFloat(income) > 0) {
      fetchTaxData();
    }
  }, []);

  // Auto-call API when income changes (immediate)
  useEffect(() => {
    const numericIncome = parseFloat(income.replace(/,/g, ''));
    if (!income || numericIncome < 1) {
      return;
    }

    fetchTaxData();
  }, [income]);

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        US State Tax Comparison
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Compare effective tax rates and after-tax income across all US states based on your income.
        This calculation includes federal, state, and payroll taxes, but excludes 401(k) contributions.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box 
          component="form" 
          onSubmit={(e) => {
            e.preventDefault();
            fetchTaxData();
            // Remove focus from the button after submission
            (e.target as HTMLFormElement).querySelector('button')?.blur();
          }}
          sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}
        >
          <TextField
            label="Annual Income"
            value={income}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, '');
              if (value === '' || /^\d+$/.test(value)) {
                const formattedValue = value === '' ? '' : parseInt(value).toLocaleString();
                setIncome(formattedValue);
              }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ minWidth: 200 }}
          />
          <CalculateButton 
            type="submit"
            loading={loading}
          />
        </Box>
        
        <Box sx={{ px: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust income: $1 - $500,000
          </Typography>
          <Slider
            value={parseFloat(income.replace(/,/g, '')) || 1}
            onChange={(_, newValue) => setIncome(newValue.toLocaleString())}
            min={1}
            max={500000}
            step={10000}
            sx={{ mt: 1 }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `$${value.toLocaleString()}`}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

            {loading && data.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {data.length > 0 && (
        <Box>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Federal & FICA Taxes
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Federal Tax
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {formatCurrency(data[0]?.federalTax || 0)}
                </Typography>
                                  <Typography variant="body2" color="text.secondary">
                    ({formatPercentage(((data[0]?.federalTax || 0) / parseFloat(income.replace(/,/g, ''))) * 100)})
                  </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  FICA Tax (Payroll)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {formatCurrency(data[0]?.payrollTax || 0)}
                </Typography>
                                  <Typography variant="body2" color="text.secondary">
                    ({formatPercentage(((data[0]?.payrollTax || 0) / parseFloat(income.replace(/,/g, ''))) * 100)})
                  </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Combined Federal + FICA
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {formatCurrency((data[0]?.federalTax || 0) + (data[0]?.payrollTax || 0))}
                </Typography>
                                  <Typography variant="body2" color="text.secondary">
                    ({formatPercentage((((data[0]?.federalTax || 0) + (data[0]?.payrollTax || 0)) / parseFloat(income.replace(/,/g, ''))) * 100)})
                  </Typography>
              </Box>
            </Box>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'stateName'}
                      direction={sortField === 'stateName' ? sortDirection : 'asc'}
                      onClick={() => handleSort('stateName')}
                    >
                      State
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'stateTax'}
                      direction={sortField === 'stateTax' ? sortDirection : 'asc'}
                      onClick={() => handleSort('stateTax')}
                    >
                      State Tax
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'effectiveRate'}
                      direction={sortField === 'effectiveRate' ? sortDirection : 'asc'}
                      onClick={() => handleSort('effectiveRate')}
                    >
                      Total Effective Rate
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'totalTax'}
                      direction={sortField === 'totalTax' ? sortDirection : 'asc'}
                      onClick={() => handleSort('totalTax')}
                    >
                      Total Tax
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'afterTaxIncome'}
                      direction={sortField === 'afterTaxIncome' ? sortDirection : 'asc'}
                      onClick={() => handleSort('afterTaxIncome')}
                    >
                      After-Tax Income
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.stateCode} hover>
                    <TableCell component="th" scope="row">
                      {row.stateName}
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        {formatCurrency(row.stateTax)}
                      </Box>
                      <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                        ({formatPercentage((row.stateTax / parseFloat(income.replace(/,/g, ''))) * 100)})
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatPercentage(row.effectiveRate)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.totalTax)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.afterTaxIncome)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {data.length > 0 && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          * Calculations are estimates based on 2024 tax brackets and standard deductions. 
          Actual taxes may vary based on individual circumstances, deductions, and credits.
        </Typography>
      )}
    </Box>
  );
};

export default UsTaxTable; 