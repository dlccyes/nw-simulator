import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import CalculateButton from './CalculateButton';
import TaxInfoDialog from './TaxInfoDialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

interface TaxConfig {
  standard_deduction: number;
  brackets: TaxBracket[];
}

interface PayrollTaxConfig {
  social_security: {
    rate: number;
    wage_base: number;
  };
  medicare: {
    rate: number;
    additional_rate: number;
    additional_threshold: number;
  };
}

interface TaxInfoData {
  federal: TaxConfig;
  payroll_taxes: PayrollTaxConfig;
  states: { [key: string]: TaxConfig };
}

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
  filingType?: 'single' | 'married';
}

type SortField = keyof StateComparison;

const UsTaxTable: React.FC = () => {
  const [income, setIncome] = useState<string>('230,000');
  const [filingStatus, setFilingStatus] = useState<string>('single');
  const [data, setData] = useState<StateComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('effectiveRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Partner income state
  const [hasPartner, setHasPartner] = useState<boolean>(false);
  const [partnerIncome, setPartnerIncome] = useState<string>('150,000');
  
  // Tax info dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTaxType, setDialogTaxType] = useState<'federal' | 'fica' | 'state'>('federal');
  const [dialogStateCode, setDialogStateCode] = useState<string>('');
  const [taxInfoData, setTaxInfoData] = useState<TaxInfoData | null>(null);
  
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

  const fetchTaxData = useCallback(async () => {
    const numericIncome = parseFloat(income.replace(/,/g, ''));
    if (!income || numericIncome < 1) {
      setError('Please enter a valid income amount (minimum $1)');
      return;
    }

    let numericPartnerIncome = 0;
    if (hasPartner) {
      numericPartnerIncome = parseFloat(partnerIncome.replace(/,/g, ''));
      if (!partnerIncome || numericPartnerIncome < 0) {
        setError('Please enter a valid partner income amount (minimum $0)');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const requestData: any = {
        income: numericIncome,
        filing_status: filingStatus
      };
      
      if (hasPartner) {
        requestData.partner_income = numericPartnerIncome;
      }

      const response = await axios.post(`${API_BASE_URL}/api/us-tax-comparison`, requestData);
      // Only update data after successful response to prevent flash
      setData(response.data);
    } catch (err) {
      setError('Failed to calculate tax data. Please try again.');
      console.error('Tax calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [income, filingStatus, hasPartner, partnerIncome]);

  useEffect(() => {
    if (income && parseFloat(income) > 0) {
      fetchTaxData();
    }
    // Load tax info data
    fetchTaxInfoData();
  }, [fetchTaxData, income]);

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
  }, [fetchTaxData, income]);

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

  // Calculate total income including partner
  const getTotalIncome = (): number => {
    const primaryIncome = parseFloat(income.replace(/,/g, ''));
    const partnerIncomeValue = hasPartner ? parseFloat(partnerIncome.replace(/,/g, '')) || 0 : 0;
    return primaryIncome + partnerIncomeValue;
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
        variant="h3" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 800,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <span style={{
          background: 'linear-gradient(45deg, #1976d2, #d32f2f)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 800,
          letterSpacing: '0.05em'
        }}>
          US
        </span>
        <span style={{
          fontWeight: 800,
          letterSpacing: '0.05em'
        }}>
          State Tax Comparison
        </span>
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3, 
          color: 'text.secondary',
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        Compare effective tax rates and after-tax income across all US states based on your income
        {hasPartner && ` (${formatCurrency(parseFloat(income.replace(/,/g, '')))} + ${formatCurrency(parseFloat(partnerIncome.replace(/,/g, '')))} partner income)`}.
        This calculation includes federal, state, and payroll taxes, but excludes 401(k) contributions.
        {filingStatus === 'compare' ? (
          <>Tax rates shown for <strong>both single and married filing jointly</strong> to help you compare which option saves more money.</>
        ) : (
          <>Tax rates shown are for {filingStatus === 'married' ? 'married filing jointly' : 'single filers'}</>
        )}
        {hasPartner && filingStatus !== 'compare' && '. All percentages are calculated based on total household income'}
        .
        {hasPartner && filingStatus === 'single' && ' (calculated separately for each person)'}
        {hasPartner && filingStatus === 'married' && ' (combined income, but Social Security tax calculated individually)'}
        {filingStatus === 'compare' && ' In compare mode, each state appears twice: once for single filing and once for married filing jointly.'}.
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
          <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Filing Status</InputLabel>
            <Select
              value={filingStatus}
              label="Filing Status"
              onChange={(e) => setFilingStatus(e.target.value)}
            >
              <MenuItem value="single">Single</MenuItem>
              <MenuItem value="married">Married Filing Jointly</MenuItem>
              <MenuItem value="compare">Compare Both</MenuItem>
            </Select>
          </FormControl>
          <CalculateButton 
            type="submit"
            loading={loading}
          />
        </Box>
        
        <Box sx={{ px: { xs: 1, sm: 2 } }}>
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

        {/* Partner Income Section */}
        <Box sx={{ mt: 3, mb: 3 }}>
          {!hasPartner ? (
            <Button
              variant="outlined"
              onClick={() => {
                setHasPartner(true);
                setPartnerIncome(income); // Set partner income to match current income
              }}
              sx={{ 
                borderStyle: 'dashed',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
            >
              Add Partner Income
            </Button>
          ) : (
            <Box sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              backgroundColor: 'background.paper'
            }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Partner Income
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  onClick={() => setHasPartner(false)}
                >
                  Remove
                </Button>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <TextField
                  label="Partner Annual Income"
                  value={partnerIncome}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (value === '' || /^\d+$/.test(value)) {
                      const formattedValue = value === '' ? '' : parseInt(value).toLocaleString();
                      setPartnerIncome(formattedValue);
                    }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                />
                
                <Box sx={{ px: { xs: 1, sm: 2 }, flex: 1 }}>
                  <Slider
                    value={parseFloat(partnerIncome.replace(/,/g, '')) || 0}
                    onChange={(_, newValue) => {
                      const roundedValue = Math.max(0, Math.round(Number(newValue) / 10000) * 10000);
                      setPartnerIncome(roundedValue.toLocaleString());
                    }}
                    min={0}
                    max={500000}
                    step={10000}
                    sx={{ mt: 1 }}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                  />
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                {filingStatus === 'single' 
                  ? 'For single filing status: Taxes calculated separately for each person and summed.'
                  : 'For married filing jointly: Combined income used for tax brackets, but Social Security tax calculated individually.'
                }
              </Typography>

              {/* Interactive Income Distribution Pie Chart */}
              <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.default' }}>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  Income Distribution
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
                  {/* Pie Chart */}
                  <Box sx={{ height: 300, width: { xs: '100%', md: 400 }, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                                                 <Pie
                           data={[
                             { 
                               name: 'Your Income', 
                               value: parseFloat(income.replace(/,/g, '')) || 0,
                               color: '#1976d2'
                             },
                             { 
                               name: 'Partner Income', 
                               value: parseFloat(partnerIncome.replace(/,/g, '')) || 0,
                               color: '#dc004e'
                             }
                           ]}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={100}
                           paddingAngle={2}
                           dataKey="value"
                         >
                          {[
                            { name: 'Your Income', color: '#1976d2' },
                            { name: 'Partner Income', color: '#dc004e' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                          labelFormatter={(label) => label}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center label showing total */}
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatCurrency(getTotalIncome())}
                      </Typography>
                    </Box>
                  </Box>
                  
                                     {/* Summary and Instructions */}
                   <Box sx={{ flex: 1, minWidth: 200 }}>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                       <strong>Use the buttons below</strong> to adjust income distribution while keeping the total constant.
                     </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: '50%' }} />
                        <Typography variant="body2">
                          Your Income: <strong>{formatCurrency(parseFloat(income.replace(/,/g, '')) || 0)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({getTotalIncome() > 0 ? ((parseFloat(income.replace(/,/g, '')) || 0) / getTotalIncome() * 100).toFixed(1) : 0}%)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#dc004e', borderRadius: '50%' }} />
                        <Typography variant="body2">
                          Partner Income: <strong>{formatCurrency(parseFloat(partnerIncome.replace(/,/g, '')) || 0)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({getTotalIncome() > 0 ? ((parseFloat(partnerIncome.replace(/,/g, '')) || 0) / getTotalIncome() * 100).toFixed(1) : 0}%)
                        </Typography>
                      </Box>
                    </Box>
                    
                                         <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                       <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                         <strong>Adjust Split:</strong>
                       </Typography>
                       
                       {/* Income Split Slider */}
                       <Box sx={{ mb: 2 }}>
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                           Your Income Share
                         </Typography>
                         <Slider
                           value={getTotalIncome() > 0 ? Math.round(((parseFloat(income.replace(/,/g, '')) || 0) / getTotalIncome() * 100) / 5) * 5 : 50}
                           onChange={(_, newValue) => {
                             const totalIncome = getTotalIncome();
                             const yourShare = Number(newValue) / 100;
                             const newYourIncome = Math.round(totalIncome * yourShare);
                             const newPartnerIncome = totalIncome - newYourIncome;
                             setIncome(newYourIncome.toLocaleString());
                             setPartnerIncome(newPartnerIncome.toLocaleString());
                           }}
                           min={5}
                           max={95}
                           step={5}
                           valueLabelDisplay="auto"
                           valueLabelFormat={(value) => `${value.toFixed(0)}%`}
                           sx={{ mt: 1 }}
                         />
                       </Box>

                       <Typography variant="body2" color="text.secondary">
                         <strong>Quick Splits:</strong>
                       </Typography>
                       <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                         {[
                           { label: '50/50', yourShare: 0.5 },
                           { label: '60/40', yourShare: 0.6 },
                           { label: '70/30', yourShare: 0.7 },
                           { label: '80/20', yourShare: 0.8 },
                           { label: '100/0', yourShare: 1.0 }
                         ].map(split => (
                           <Button
                             key={split.label}
                             size="small"
                             variant="outlined"
                             onClick={() => {
                               const totalIncome = getTotalIncome();
                               const newYourIncome = Math.round(totalIncome * split.yourShare);
                               const newPartnerIncome = totalIncome - newYourIncome;
                               setIncome(newYourIncome.toLocaleString());
                               setPartnerIncome(newPartnerIncome.toLocaleString());
                             }}
                             sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                           >
                             {split.label}
                           </Button>
                         ))}
                       </Box>
                     </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
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
            {filingStatus === 'compare' ? (
              // Compare mode: show both single and married side by side
              <Box>
                {/* Single Filing Row */}
                <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    Single Filing
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
                        {formatCurrency(data.find(d => d.filingType === 'single')?.federalTax || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({formatPercentage(((data.find(d => d.filingType === 'single')?.federalTax || 0) / getTotalIncome()) * 100)})
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
                        {formatCurrency(data.find(d => d.filingType === 'single')?.payrollTax || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({formatPercentage(((data.find(d => d.filingType === 'single')?.payrollTax || 0) / getTotalIncome()) * 100)})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Combined Federal + FICA
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {formatCurrency((data.find(d => d.filingType === 'single')?.federalTax || 0) + (data.find(d => d.filingType === 'single')?.payrollTax || 0))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({formatPercentage((((data.find(d => d.filingType === 'single')?.federalTax || 0) + (data.find(d => d.filingType === 'single')?.payrollTax || 0)) / getTotalIncome()) * 100)})
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Married Filing Row */}
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'secondary.main' }}>
                    Married Filing Jointly
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
                        {formatCurrency(data.find(d => d.filingType === 'married')?.federalTax || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({formatPercentage(((data.find(d => d.filingType === 'married')?.federalTax || 0) / getTotalIncome()) * 100)})
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
                        {formatCurrency(data.find(d => d.filingType === 'married')?.payrollTax || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({formatPercentage(((data.find(d => d.filingType === 'married')?.payrollTax || 0) / getTotalIncome()) * 100)})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Combined Federal + FICA
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {formatCurrency((data.find(d => d.filingType === 'married')?.federalTax || 0) + (data.find(d => d.filingType === 'married')?.payrollTax || 0))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({formatPercentage((((data.find(d => d.filingType === 'married')?.federalTax || 0) + (data.find(d => d.filingType === 'married')?.payrollTax || 0)) / getTotalIncome()) * 100)})
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              // Normal mode: show single result
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
                    ({formatPercentage(((data[0]?.federalTax || 0) / getTotalIncome()) * 100)})
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
                    ({formatPercentage(((data[0]?.payrollTax || 0) / getTotalIncome()) * 100)})
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
                    ({formatPercentage((((data[0]?.federalTax || 0) + (data[0]?.payrollTax || 0)) / getTotalIncome()) * 100)})
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Filter states section */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Filter states (optional)
              </Typography>
              {selectedStates.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredData.length} of {data.length} rows
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
                  {sortedData.map((row) => {
                    // Add medal emojis to top 3 most taxed states (highest effective rate)
                    // In compare mode, get top 3 from current filtered data, otherwise use original logic
                    const dataForRanking = filingStatus === 'compare' ? sortedData : data;
                    const top3MostTaxedStates = [...dataForRanking]
                      .sort((a, b) => b.effectiveRate - a.effectiveRate)
                      .slice(0, 3);
                    
                    const stateRank = top3MostTaxedStates.findIndex(state => 
                      filingStatus === 'compare' 
                        ? state.stateName === row.stateName // Compare by full name including (Single)/(Married)
                        : state.stateCode === row.stateCode // Normal mode compare by state code
                    );
                    let displayName = row.stateName;
                    
                    if (stateRank === 0) {
                      displayName = `${row.stateName} 🥇`; // 1st place - gold
                    } else if (stateRank === 1) {
                      displayName = `${row.stateName} 🥈`; // 2nd place - silver
                    } else if (stateRank === 2) {
                      displayName = `${row.stateName} 🥉`; // 3rd place - bronze
                    }
                    
                    return (
                      <TableRow key={filingStatus === 'compare' ? `${row.stateCode}-${row.filingType}` : row.stateCode} hover>
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
                            {displayName}
                          </Link>
                        </TableCell>
                      <TableCell align="right">
                        <Box>
                          {formatCurrency(row.stateTax)}
                        </Box>
                        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          ({formatPercentage((row.stateTax / getTotalIncome()) * 100)})
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
                    );
                  })}
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
        country="US"
      />
    </Box>
  );
};

export default UsTaxTable; 