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
  Slider,
  Link,
  Autocomplete,
  Chip
} from '@mui/material';
import CalculateButton from './CalculateButton';
import TaxInfoDialog from './TaxInfoDialog';

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
  const [income, setIncome] = useState<string>('230,000');
  const [data, setData] = useState<StateComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('effectiveRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Tax info dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTaxType, setDialogTaxType] = useState<'federal' | 'fica' | 'state'>('federal');
  const [dialogStateCode, setDialogStateCode] = useState<string>('');
  const [taxInfoData, setTaxInfoData] = useState<any>(null);
  
  // State filtering
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  // All US states for autocomplete
  const allStates = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' }
  ];

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
    // Load tax info data
    fetchTaxInfoData();
  }, []);

  const fetchTaxInfoData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tax-info/US`);
      setTaxInfoData(response.data);
    } catch (err) {
      console.error('Failed to load tax info data:', err);
    }
  };

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

  const filteredData = selectedStates.length > 0 
    ? data.filter(row => selectedStates.includes(row.stateCode))
    : data;

  const sortedData = [...filteredData].sort((a, b) => {
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

  const handleTaxInfoClick = (taxType: 'federal' | 'fica' | 'state', stateCode?: string) => {
    setDialogTaxType(taxType);
    setDialogStateCode(stateCode || '');
    setDialogOpen(true);
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.125rem' },
          fontWeight: 800
        }}
      >
        US State Tax Comparison
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3, 
          color: 'text.secondary',
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
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
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: 3 
          }}
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
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          />
          <CalculateButton 
            type="submit"
            loading={loading}
          />
        </Box>
        
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust income: $1 - $500,000
          </Typography>
          <Slider
            value={parseFloat(income.replace(/,/g, '')) || 1}
            onChange={(_, newValue) => {
              const roundedValue = Math.max(1, Math.round(Number(newValue) / 1000) * 1000);
              setIncome(roundedValue.toLocaleString());
            }}
            min={1}
            max={500000}
            step={1000}
            sx={{ mt: 1 }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `$${value.toLocaleString()}`}
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Filter states (optional)
            </Typography>
            {selectedStates.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Showing {filteredData.length} of {data.length} states
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setSelectedStates([])}
                  sx={{ 
                    ml: 1,
                    cursor: 'pointer', 
                    textDecoration: 'none',
                    color: 'primary.light',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'red'
                    },
                    '&:focus': {
                      outline: 'none'
                    }
                  }}
                >
                  (clear all)
                </Link>
              </Typography>
            )}
          </Box>
          <Autocomplete
            multiple
            options={allStates}
            getOptionLabel={(option) => option.name}
            value={selectedStates.map(stateCode => 
              allStates.find(state => state.code === stateCode)
            ).filter((state): state is { code: string; name: string } => state !== undefined)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue, reason) => {
              if (reason !== 'reset') {
                setInputValue(newInputValue);
              }
            }}
            onChange={(_, newValue) => {
              setSelectedStates(newValue.map(state => state.code));
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            onKeyDown={(event) => {
              if (event.key === 'Enter' && inputValue.trim()) {
                event.preventDefault();
                
                // Find the first matching option
                const filteredOptions = allStates.filter(option =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase()) &&
                  !selectedStates.includes(option.code)
                );
                
                if (filteredOptions.length > 0) {
                  const firstMatch = filteredOptions[0];
                  setSelectedStates([...selectedStates, firstMatch.code]);
                  setTimeout(() => setInputValue(''), 0); // Clear the input after selection
                }
              }
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.code}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '& .MuiChip-label': {
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'white',
                      '&:hover': {
                        color: 'rgba(255, 255, 255, 0.8)'
                      }
                    }
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={selectedStates.length === 0 ? "Search and select states to filter..." : "Add more states..."}
                variant="outlined"
              />
            )}
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
          
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Federal & FICA Taxes
            </Typography>
                          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <Link 
                      component="button"
                      variant="body2"
                      onClick={() => handleTaxInfoClick('federal')}
                      sx={{ 
                        cursor: 'pointer', 
                        textDecoration: 'none',
                        color: 'primary.light',
                        fontWeight: 500,
                        '&:hover': {
                          color: 'red',
                          textDecoration: 'underline'
                        },
                        '&:focus': {
                          outline: 'none'
                        }
                      }}
                    >
                      Federal Tax
                    </Link>
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
                    <Link 
                      component="button"
                      variant="body2"
                      onClick={() => handleTaxInfoClick('fica')}
                      sx={{ 
                        cursor: 'pointer', 
                        textDecoration: 'none',
                        color: 'primary.light',
                        fontWeight: 500,
                        '&:hover': {
                          color: 'red',
                          textDecoration: 'underline'
                        },
                        '&:focus': {
                          outline: 'none'
                        }
                      }}
                    >
                      FICA Tax (Payroll)
                    </Link>
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

          <Box sx={{ 
            width: '100%',
            display: 'grid',
            overflowX: 'auto'
          }}>
            <TableContainer component={Paper}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { px: { xs: 1, sm: 2 } } }}>
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
                        <Link 
                          component="button"
                          variant="body1"
                          onClick={() => handleTaxInfoClick('state', row.stateCode)}
                          sx={{ 
                            cursor: 'pointer', 
                            textDecoration: 'none',
                            color: 'primary.light',
                            fontWeight: 500,
                            '&:hover': {
                              color: 'red',
                              textDecoration: 'underline'
                            },
                            '&:focus': {
                              outline: 'none'
                            }
                          }}
                        >
                          {row.stateName}
                        </Link>
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
        </Box>
      )}

      {data.length > 0 && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          * Calculations are estimates based on 2024 tax brackets and standard deductions. 
          Actual taxes may vary based on individual circumstances, deductions, and credits.
        </Typography>
      )}

      <TaxInfoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        taxType={dialogTaxType}
        stateCode={dialogStateCode}
        taxData={taxInfoData}
      />
    </Box>
  );
};

export default UsTaxTable; 