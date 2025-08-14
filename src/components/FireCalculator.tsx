import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Typography,
  Grid as MuiGrid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Switch,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Collapse
} from '@mui/material';
import CalculateButton from './CalculateButton';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, FolderOpen as FolderOpenIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SelectChangeEvent } from '@mui/material/Select';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// only enable save/load profile feature when in local
// TODO: enable in prod once we have a production db
const enableProfile = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

interface Inputs {
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
}

interface YearlyDataItem {
  id: string;
  startAge: number;
  endAge: number;
  spending?: number;
  income?: number;
}

interface TaxInfo {
  afterTaxIncome: number;
}

interface Results {
  fireAge: number;
  requiredSavings: number;
  years: number[];
  nominalNetWorth: number[];
  realNetWorth: number[];
  yearlyPreTaxIncome: number[];
  yearlyAfterTaxIncome: number[];
  yearlySpending: number[];
  yearlyTaxRates: number[];
  yearlySavings: number[];
  yearlyRealInterest: number[];
  taxInfo: TaxInfo;
  error?: string;
}

interface ChartData {
  id: string;
  age: number;
  nominal: number;
  real: number;
  afterTaxIncome: number;
  spending: number;
}

interface Profile {
  _id: string;
  name: string;
}

const STATES = [
  'AL',  // Alabama
  'AK',  // Alaska
  'AR',  // Arkansas
  'AZ',  // Arizona
  'CA',  // California
  'CO',  // Colorado
  'CT',  // Connecticut
  'DC',  // District of Columbia
  'DE',  // Delaware
  'FL',  // Florida
  'GA',  // Georgia
  'HI',  // Hawaii
  'IA',  // Iowa
  'ID',  // Idaho
  'IL',  // Illinois
  'IN',  // Indiana
  'KS',  // Kansas
  'KY',  // Kentucky
  'LA',  // Louisiana
  'MA',  // Massachusetts
  'MD',  // Maryland
  'ME',  // Maine
  'MI',  // Michigan
  'MN',  // Minnesota
  'MO',  // Missouri
  'MS',  // Mississippi
  'MT',  // Montana
  'NC',  // North Carolina
  'ND',  // North Dakota
  'NE',  // Nebraska
  'NH',  // New Hampshire
  'NJ',  // New Jersey
  'NM',  // New Mexico
  'NV',  // Nevada
  'NY',  // New York
  'OH',  // Ohio
  'OK',  // Oklahoma
  'OR',  // Oregon
  'PA',  // Pennsylvania
  'RI',  // Rhode Island
  'SC',  // South Carolina
  'SD',  // South Dakota
  'TN',  // Tennessee
  'TX',  // Texas
  'UT',  // Utah
  'VA',  // Virginia
  'VT',  // Vermont
  'WA',  // Washington
  'WV',  // West Virginia
  'WI',  // Wisconsin
  'WY'   // Wyoming
];

const Grid = MuiGrid as React.ComponentType<Record<string, unknown>>;  // Type assertion to bypass the type error

const NetWorthChart: React.FC<{ data: Omit<ChartData, 'id'>[]; fireAge: number }> = ({ data, fireAge }) => {
  return (
    <>
      <style>
        {`
          ::selection {
            background: rgba(255, 0, 0, 0.2);
          }
        `}
      </style>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="age"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Age', position: 'bottom', offset: 15 }}
            tick={false}
          />
          <YAxis
            type="number"
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            label={{ value: 'Net Worth', angle: -90, position: 'left' }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const formattedValue = `$${(value / 1000000).toFixed(2)}M`;
              return [formattedValue, name];
            }}
            labelFormatter={(label) => `Age: ${label}`}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          {data.filter(d => d.age % 5 === 0).map((d) => (
            <ReferenceLine
              key={`ref-${d.age}`}
              x={d.age}
              stroke="#ccc"
              strokeDasharray="3 3"
              label={{
                value: d.age,
                position: 'bottom',
                offset: 5,
                fill: '#666'
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="nominal"
            name="Nominal Net Worth"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="real"
            name="Real Net Worth"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
          />
          {fireAge > 0 && (
            <ReferenceLine x={fireAge} stroke="red" label="FIRE Age" />
          )}
          <ReferenceLine y={0} stroke="black" strokeWidth={2} strokeDasharray="5 5" label="" />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
};

const fireAnimation = `
  @keyframes fire {
    0% {
      color: #ff4500;
      text-shadow: 0 0 2px #fff,
                   0 0 3px #ff4500;
    }
    50% {
      color: #ff8c00;
      text-shadow: 0 0 2px #fff,
                   0 0 3px #ff8c00;
    }
    100% {
      color: #ff4500;
      text-shadow: 0 0 2px #fff,
                   0 0 3px #ff4500;
    }
  }

  .fire-text {
    animation: fire 0.8s ease-in-out infinite;
    font-weight: 800;
    letter-spacing: 0.05em;
  }
`;

const FireCalculator: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
            },
          },
        },
      },
    },
  });

  // Default values for US
  const US_DEFAULTS = {
    currentAge: 23,
    endAge: 50,
    currentNetWorth: 70000,
    annualReturn: 8,
    inflationRate: 3,
    retirementSpending: 100000,
    withdrawalRate: 4,
    country: 'US' as const,
    state: 'CA',
    preTax401k: 23000,
    employerMatch: 5,
    filingStatus: 'single'
  };

  // Default values for Taiwan (10x monetary values)
  const TW_DEFAULTS = {
    currentAge: 23,
    endAge: 50,
    currentNetWorth: 700000,
    annualReturn: 8,
    inflationRate: 3,
    retirementSpending: 1000000,
    withdrawalRate: 4,
    country: 'TW' as const,
    state: '',
    preTax401k: 0,
    employerMatch: 0,
    filingStatus: 'single'
  };

  const US_SPENDING_DEFAULTS = [
    { id: 'spending-1', startAge: 23, endAge: 50, spending: 100000 }
  ];

  const TW_SPENDING_DEFAULTS = [
    { id: 'spending-1', startAge: 23, endAge: 50, spending: 1000000 }
  ];

  const US_INCOME_DEFAULTS = [
    { id: 'income-1', startAge: 23, endAge: 25, income: 230000 },
    { id: 'income-2', startAge: 26, endAge: 30, income: 300000 },
    { id: 'income-3', startAge: 31, endAge: 40, income: 400000 }
  ];

  const TW_INCOME_DEFAULTS = [
    { id: 'income-1', startAge: 23, endAge: 25, income: 2300000 },
    { id: 'income-2', startAge: 26, endAge: 30, income: 3000000 },
    { id: 'income-3', startAge: 31, endAge: 40, income: 4000000 }
  ];

  const [inputs, setInputs] = useState<Inputs>(US_DEFAULTS);

  const [yearlySpending, setYearlySpending] = useState<YearlyDataItem[]>(US_SPENDING_DEFAULTS);

  const [yearlyIncome, setYearlyIncome] = useState<YearlyDataItem[]>(US_INCOME_DEFAULTS);

  const [results, setResults] = useState<Results | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [stopAtFire, setStopAtFire] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taxInfo, setTaxInfo] = useState<{
    federal?: {
      standard_deduction?: number;
      brackets?: Array<{min: number; max: number | null; rate: number}>;
      single?: {
        standard_deduction?: number;
        brackets?: Array<{min: number; max: number | null; rate: number}>;
      };
      married?: {
        standard_deduction?: number;
        brackets?: Array<{min: number; max: number | null; rate: number}>;
      };
    };
    states?: Record<string, {
      standard_deduction?: number;
      brackets?: Array<{min: number; max: number | null; rate: number}>;
      single?: {
        standard_deduction?: number;
        brackets?: Array<{min: number; max: number | null; rate: number}>;
      };
      married?: {
        standard_deduction?: number;
        brackets?: Array<{min: number; max: number | null; rate: number}>;
      };
    }>;
    payroll_taxes?: {
      social_security?: {rate: number; wage_base: number};
      medicare?: {rate: number; additional_rate: number; additional_threshold: number};
      labor_insurance?: {rate: number};
      health_insurance?: {rate: number; annual_cap: number};
    };
  } | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  useEffect(() => {
    if (enableProfile) {
      loadProfiles();
    }
  }, []);

  useEffect(() => {
    const fetchTaxInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tax-info/${inputs.country}`);
        if (response.ok) {
          const data = await response.json();
          setTaxInfo(data);
        }
      } catch (error) {
        console.error('Error fetching tax info:', error);
      }
    };

    fetchTaxInfo();
  }, [inputs.country]);

  const loadProfiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles`);
      setProfiles(response.data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const config = {
        ...inputs,
        yearlySpending: yearlySpending.map(d => ({ startAge: d.startAge, endAge: d.endAge, amount: d.spending })),
        yearlyIncome: yearlyIncome.map(d => ({ startAge: d.startAge, endAge: d.endAge, amount: d.income }))
      };

      await axios.post(`${API_BASE_URL}/api/profiles`, {
        name: profileName,
        config
      });

      setSaveDialogOpen(false);
      setProfileName('');
      loadProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleLoadProfile = async (profileId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles/${profileId}`);
      const { config } = response.data;

      setInputs({
        currentAge: config.currentAge,
        endAge: config.endAge,
        currentNetWorth: config.currentNetWorth,
        annualReturn: config.annualReturn,
        inflationRate: config.inflationRate,
        retirementSpending: config.retirementSpending,
        withdrawalRate: config.withdrawalRate,
        country: config.country || 'US',
        state: config.state,
        preTax401k: config.preTax401k,
        employerMatch: config.employerMatch,
        filingStatus: config.filingStatus || 'single'
      });

      setYearlySpending(config.yearlySpending.map((d: {id: string; startAge: number; endAge: number; amount: number}) => ({
        id: d.id,
        startAge: d.startAge,
        endAge: d.endAge,
        spending: d.amount
      })));

      setYearlyIncome(config.yearlyIncome.map((d: {id: string; startAge: number; endAge: number; amount: number}) => ({
        id: d.id,
        startAge: d.startAge,
        endAge: d.endAge,
        income: d.amount
      })));

      setLoadDialogOpen(false);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/profiles/${profileId}`);
      loadProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: (name === 'state' || name === 'country') ? value : Number(value)
    }));
  };

  const handleMonetaryInputChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      const numericValue = value === '' ? 0 : parseInt(value);
      setInputs(prev => ({
        ...prev,
        [name]: numericValue
      }));
    }
  };

  const formatMonetaryValue = (value: number): string => {
    return value === 0 ? '' : value.toLocaleString();
  };

  const handleCountryChange = (event: SelectChangeEvent<string>) => {
    const newCountry = event.target.value;
    
    if (newCountry === 'TW') {
      // Switch to Taiwan defaults
      setInputs(TW_DEFAULTS);
      setYearlySpending(TW_SPENDING_DEFAULTS);
      setYearlyIncome(TW_INCOME_DEFAULTS);
    } else if (newCountry === 'US') {
      // Switch to US defaults
      setInputs(US_DEFAULTS);
      setYearlySpending(US_SPENDING_DEFAULTS);
      setYearlyIncome(US_INCOME_DEFAULTS);
    } else {
      // For other countries, just update country and clear state
      setInputs({
        ...inputs,
        country: newCountry,
        state: newCountry === 'US' ? (inputs.state || 'CA') : ''
      });
    }
  };

  const handleStateChange = (event: SelectChangeEvent<string>) => {
    setInputs({
      ...inputs,
      state: event.target.value
    });
  };

  const handleFilingStatusChange = (event: SelectChangeEvent<string>) => {
    setInputs({
      ...inputs,
      filingStatus: event.target.value
    });
  };

  const handleSpendingChange = (index: number, field: keyof YearlyDataItem, value: number) => {
    const newData = [...yearlySpending];
    newData[index] = { ...newData[index], [field]: value };
    setYearlySpending(newData);
  };

  const handleIncomeChange = (index: number, field: keyof YearlyDataItem, value: number) => {
    const newData = [...yearlyIncome];
    newData[index] = { ...newData[index], [field]: value };
    setYearlyIncome(newData);
  };

  const addYearlyData = (type: 'spending' | 'income') => {
    const newEntry: YearlyDataItem = {
      id: `${type}-${Date.now()}`,
      startAge: inputs.currentAge,
      endAge: inputs.endAge,
      [type]: 0
    };
    if (type === 'spending') {
      setYearlySpending([...yearlySpending, newEntry]);
    } else {
      setYearlyIncome([...yearlyIncome, newEntry]);
    }
  };

  const removeSpending = (index: number) => {
    setYearlySpending(yearlySpending.filter((_, i) => i !== index));
  };

  const removeIncome = (index: number) => {
    setYearlyIncome(yearlyIncome.filter((_, i) => i !== index));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inputs,
          endAge: inputs.endAge,  // Keep API compatibility
          preTax401k: inputs.country === 'US' ? inputs.preTax401k : 0,
          employerMatch: inputs.country === 'US' ? inputs.employerMatch : 0,
          yearlySpending: yearlySpending.map(d => ({
            startAge: d.startAge,
            endAge: d.endAge,
            amount: d.spending
          })),
          yearlyIncome: yearlyIncome.map(d => ({
            startAge: d.startAge,
            endAge: d.endAge,
            amount: d.income
          })),
          stopAtFire: stopAtFire && (results?.fireAge ?? 0) > 0  // Only stop at FIRE if it's possible
        }),
      });

      if (!response.ok) {
        throw new Error('Calculation failed');
      }

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Error calculating FIRE projection:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSavingsColor = (savings: number) => {
    if (savings < 0) return 'red';
    if (savings > 0) return 'green';
    return 'inherit';
  };

  const getRowBackgroundColor = (savings: number, netWorthGrowth: number, netWorth: number) => {
    if (netWorth < 0) return darkMode ? 'rgba(255, 0, 0, 0.1)' : '#ffebee';  // red when net worth is negative
    if (netWorthGrowth < 0) return darkMode ? 'rgba(255, 165, 0, 0.1)' : '#fff3e0';  // orange when net worth growth is negative
    if (savings < 0) return darkMode ? 'rgba(255, 255, 0, 0.1)' : '#faf9c4';  // softer yellow when savings negative but net worth growth positive
    if (savings > 0) return darkMode ? 'rgba(0, 255, 0, 0.1)' : '#e8f5e8';  // green when savings positive
    return 'inherit';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <style>{fireAnimation}</style>
        <Typography variant="h3" gutterBottom sx={{ 
          fontWeight: 800,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <span className="fire-text">FIRE</span>
          <span style={{
            background: 'linear-gradient(45deg, rgb(255, 76, 37), rgb(140, 94, 253)) text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Calculator
          </span>
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2, 
              mb: 3,
              '& .MuiButton-root': {
                minWidth: 120
              }
            }}>
              <IconButton 
                onClick={() => setDarkMode(!darkMode)}
                color="primary"
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              {enableProfile && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    Save Profile
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FolderOpenIcon />}
                    onClick={() => setLoadDialogOpen(true)}
                  >
                    Load Profile
                  </Button>
                </>
              )}
            </Box>
            <Box sx={{ mb: 4 }}>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {inputs.country === 'US' ? (
                'Enter the money in today\'s US dollars (USD).'
              ) : inputs.country === 'TW' ? (
                'Enter the money in today\'s Taiwan dollars (TWD).'
              ) : (
                'Enter the money in today\'s local currency.'
              )}
              {' '}
              For detailed usage instructions, <Typography 
                component="a"
                href="/doc"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                consult the manual
              </Typography>.
            </Typography>

              <Box 
                sx={{ 
                  backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                  borderRadius: 3,
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    p: 2.5, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => setInfoExpanded(!infoExpanded)}
                >
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    Info
                  </Typography>
                  <ExpandMoreIcon 
                    sx={{ 
                      transform: infoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
                    }} 
                  />
                </Box>
                
                <Collapse in={infoExpanded}>
                  <Box sx={{ p: 2.5, pt: 0 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '0.95rem' }}>
                      {inputs.country === 'US' ? (
                        <>
                          All tax calculations include federal and state taxes (if applicable), plus mandatory payroll deductions. 
                          Tax rates and deductions are for {inputs.filingStatus === 'married' ? 'married filing jointly' : 'single filers'}. Pre-tax 401(k) contributions reduce your taxable income.
                        </>
                      ) : inputs.country === 'TW' ? (
                        <>
                          All calculations include income tax and mandatory payroll deductions (Labor and Health Insurance). 
                          Tax rates and deductions apply to unmarried, non-disabled employees under 70.
                        </>
                      ) : null}
                    </Typography>

                    {taxInfo && (
                      <>
                        <Typography variant="h6" sx={{ mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>
                          {inputs.country === 'US' ? 'Federal Tax' : 'Income Tax'}
                        </Typography>
                        {taxInfo.federal && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Standard Deduction:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              Single: {inputs.country === 'US' ? '$' : 'NT$'}{(taxInfo.federal.single?.standard_deduction || taxInfo.federal.standard_deduction || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              Married: {inputs.country === 'US' ? '$' : 'NT$'}{(taxInfo.federal.married?.standard_deduction || taxInfo.federal.standard_deduction || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                        <TableContainer sx={{ mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Income Range (Single)</strong></TableCell>
                                <TableCell><strong>Income Range (Married)</strong></TableCell>
                                <TableCell align="right"><strong>Tax Rate</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(() => {
                                const singleBrackets = taxInfo.federal?.single?.brackets || taxInfo.federal?.brackets || [];
                                const marriedBrackets = taxInfo.federal?.married?.brackets || taxInfo.federal?.brackets || [];
                                const maxLength = Math.max(singleBrackets.length, marriedBrackets.length);
                                
                                return Array.from({ length: maxLength }, (_, index) => {
                                  const singleBracket = singleBrackets[index];
                                  const marriedBracket = marriedBrackets[index];
                                  
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>
                                        {singleBracket ? 
                                          `${inputs.country === 'US' ? '$' : 'NT$'}${singleBracket.min.toLocaleString()} - ${singleBracket.max ? `${inputs.country === 'US' ? '$' : 'NT$'}${singleBracket.max.toLocaleString()}` : '∞'}` : 
                                          '-'
                                        }
                                      </TableCell>
                                      <TableCell>
                                        {marriedBracket ? 
                                          `${inputs.country === 'US' ? '$' : 'NT$'}${marriedBracket.min.toLocaleString()} - ${marriedBracket.max ? `${inputs.country === 'US' ? '$' : 'NT$'}${marriedBracket.max.toLocaleString()}` : '∞'}` : 
                                          '-'
                                        }
                                      </TableCell>
                                      <TableCell align="right">
                                        {singleBracket?.rate || marriedBracket?.rate ? 
                                          `${((singleBracket?.rate || marriedBracket?.rate || 0) * 100).toFixed(1)}%` : 
                                          '-'
                                        }
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              })()}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {inputs.country === 'US' && inputs.state && taxInfo.states?.[inputs.state] && (
                          <>
                            <Typography variant="h6" sx={{ mt: 3, mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>
                              {inputs.state} State Tax
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Standard Deduction:</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                Single: ${(taxInfo.states[inputs.state].single?.standard_deduction || taxInfo.states[inputs.state].standard_deduction || 0).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                Married: ${(taxInfo.states[inputs.state].married?.standard_deduction || taxInfo.states[inputs.state].standard_deduction || 0).toLocaleString()}
                              </Typography>
                            </Box>
                            {taxInfo.states?.[inputs.state]?.brackets && taxInfo.states[inputs.state]?.brackets && taxInfo.states[inputs.state]!.brackets!.length > 0 ? (
                              <TableContainer sx={{ mb: 3 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell><strong>Income Range (Single)</strong></TableCell>
                                      <TableCell><strong>Income Range (Married)</strong></TableCell>
                                      <TableCell align="right"><strong>Tax Rate</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {(() => {
                                      const singleBrackets = taxInfo.states[inputs.state]?.single?.brackets || taxInfo.states[inputs.state]?.brackets || [];
                                      const marriedBrackets = taxInfo.states[inputs.state]?.married?.brackets || taxInfo.states[inputs.state]?.brackets || [];
                                      const maxLength = Math.max(singleBrackets.length, marriedBrackets.length);
                                      
                                      return Array.from({ length: maxLength }, (_, index) => {
                                        const singleBracket = singleBrackets[index];
                                        const marriedBracket = marriedBrackets[index];
                                        
                                        return (
                                          <TableRow key={index}>
                                            <TableCell>
                                              {singleBracket ? 
                                                `$${singleBracket.min.toLocaleString()} - ${singleBracket.max ? `$${singleBracket.max.toLocaleString()}` : '∞'}` : 
                                                '-'
                                              }
                                            </TableCell>
                                            <TableCell>
                                              {marriedBracket ? 
                                                `$${marriedBracket.min.toLocaleString()} - ${marriedBracket.max ? `$${marriedBracket.max.toLocaleString()}` : '∞'}` : 
                                                '-'
                                              }
                                            </TableCell>
                                            <TableCell align="right">
                                              {singleBracket?.rate || marriedBracket?.rate ? 
                                                `${((singleBracket?.rate || marriedBracket?.rate || 0) * 100).toFixed(1)}%` : 
                                                '-'
                                              }
                                            </TableCell>
                                          </TableRow>
                                        );
                                      });
                                    })()}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                                No state income tax
                              </Typography>
                            )}
                          </>
                        )}

                        {inputs.country === 'US' && taxInfo.payroll_taxes && (
                          <>
                            <Typography variant="h6" sx={{ mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>
                              Payroll Taxes
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Type</strong></TableCell>
                                    <TableCell align="right"><strong>Rate</strong></TableCell>
                                    <TableCell align="right"><strong>Cap/Notes</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>Social Security</TableCell>
                                    <TableCell align="right">{((taxInfo.payroll_taxes.social_security?.rate || 0) * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="right">${taxInfo.payroll_taxes.social_security?.wage_base?.toLocaleString() || 'N/A'} wage base</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Medicare</TableCell>
                                    <TableCell align="right">{((taxInfo.payroll_taxes.medicare?.rate || 0) * 100).toFixed(2)}%</TableCell>
                                    <TableCell align="right">No cap</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Medicare Additional</TableCell>
                                    <TableCell align="right">{((taxInfo.payroll_taxes.medicare?.additional_rate || 0) * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="right">On income over ${taxInfo.payroll_taxes.medicare?.additional_threshold?.toLocaleString() || 'N/A'}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {inputs.country === 'TW' && taxInfo.payroll_taxes && (
                          <>
                            <Typography variant="h6" sx={{ mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>
                              Payroll Deductions
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Type</strong></TableCell>
                                    <TableCell align="right"><strong>Rate</strong></TableCell>
                                    <TableCell align="right"><strong>Annual Cap</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>Labor Insurance</TableCell>
                                    <TableCell align="right">{((taxInfo.payroll_taxes.labor_insurance?.rate || 0) * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="right">No cap</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Health Insurance</TableCell>
                                    <TableCell align="right">{((taxInfo.payroll_taxes.health_insurance?.rate || 0) * 100).toFixed(2)}%</TableCell>
                                    <TableCell align="right">NT${taxInfo.payroll_taxes.health_insurance?.annual_cap?.toLocaleString() || 'N/A'}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                </Collapse>
              </Box>
            </Box>
          </Grid>

                    <Grid item xs={12} sx={{ width: '100%' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={inputs.country === 'US' ? 6 : 12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Row 1: Country and State */}
                    {inputs.country === 'US' ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                              name="country"
                              value={inputs.country}
                              label="Country"
                              onChange={handleCountryChange}
                            >
                              <MenuItem value="US">United States</MenuItem>
                              <MenuItem value="TW">Taiwan</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>State</InputLabel>
                            <Select
                              name="state"
                              value={inputs.state}
                              label="State"
                              onChange={handleStateChange}
                            >
                              {STATES.map(state => (
                                <MenuItem key={state} value={state}>{state}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                              name="country"
                              value={inputs.country}
                              label="Country"
                              onChange={handleCountryChange}
                            >
                              <MenuItem value="US">United States</MenuItem>
                              <MenuItem value="TW">Taiwan</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}

                    {/* Row 1.5: Filing Status (US only) */}
                    {inputs.country === 'US' && (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth sx={{ minWidth: 220 }}>
                            <InputLabel>Filing Status</InputLabel>
                            <Select
                              name="filingStatus"
                              value={inputs.filingStatus}
                              label="Filing Status"
                              onChange={handleFilingStatusChange}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    minWidth: 220
                                  }
                                }
                              }}
                            >
                              <MenuItem value="single">Single</MenuItem>
                              <MenuItem value="married">Married Filing Jointly</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}

                    {/* Row 2: Age */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Current Age"
                          name="currentAge"
                          type="number"
                          value={inputs.currentAge}
                          onChange={handleInputChange}
                          slotProps={{ htmlInput: { min: 0 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="End Age"
                          name="endAge"
                          type="number"
                          value={inputs.endAge}
                          onChange={handleInputChange}
                          slotProps={{ htmlInput: { min: inputs.currentAge + 1 } }}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 2: Net Worth */}
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Net Worth"
                          name="currentNetWorth"
                          value={formatMonetaryValue(inputs.currentNetWorth)}
                          onChange={handleMonetaryInputChange('currentNetWorth')}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 3: Return and Inflation */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          sx={{ width: '100%', minWidth: '200px' }}
                          label="Annual Return (%)"
                          name="annualReturn"
                          type="number"
                          value={inputs.annualReturn}
                          onChange={handleInputChange}
                          slotProps={{ htmlInput: { min: 0, max: 100 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          sx={{ width: '100%', minWidth: '200px' }}
                          label="Inflation Rate (%)"
                          name="inflationRate"
                          type="number"
                          value={inputs.inflationRate}
                          onChange={handleInputChange}
                          slotProps={{ htmlInput: { min: 0, max: 100 } }}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 4: Retirement Spending and Withdrawal */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Retirement Spending"
                          name="retirementSpending"
                          value={formatMonetaryValue(inputs.retirementSpending)}
                          onChange={handleMonetaryInputChange('retirementSpending')}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          sx={{ width: '100%', minWidth: '200px' }}
                          label="Withdrawal Rate (%)"
                          name="withdrawalRate"
                          type="number"
                          value={inputs.withdrawalRate}
                          onChange={handleInputChange}
                          slotProps={{ htmlInput: { min: 0, max: 100 } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>
                    Real return rate: {(((1 + inputs.annualReturn / 100) / (1 + inputs.inflationRate / 100) - 1) * 100).toFixed(1)}%
                    {'\n'}(nominal {inputs.annualReturn}% ÷ inflation {inputs.inflationRate}%)
                  </Typography>
                </Paper>
              </Grid>

                                           {inputs.country === 'US' && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                      Retirement Accounts
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Pre-tax 401(k) Contribution"
                          name="preTax401k"
                          value={formatMonetaryValue(inputs.preTax401k)}
                          onChange={handleMonetaryInputChange('preTax401k')}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          sx={{ width: '100%', minWidth: '200px' }}
                          label="Employer Match (%)"
                          name="employerMatch"
                          type="number"
                          value={inputs.employerMatch}
                          onChange={handleInputChange}
                          slotProps={{ htmlInput: { min: 0, max: 100 } }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Yearly Spending
              </Typography>
              {yearlySpending.map((item) => (
                <Grid container spacing={2} key={item.id} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <TextField
                      sx={{ width: '100%', minWidth: '120px' }}
                      label="Start Age"
                      type="number"
                      value={item.startAge}
                      onChange={(e) => handleSpendingChange(yearlySpending.indexOf(item), 'startAge', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: inputs.currentAge, max: inputs.endAge } }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      sx={{ width: '100%', minWidth: '120px' }}
                      label="End Age"
                      type="number"
                      value={item.endAge}
                      onChange={(e) => handleSpendingChange(yearlySpending.indexOf(item), 'endAge', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: inputs.currentAge, max: inputs.endAge } }}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      sx={{ width: '100%', minWidth: '200px' }}
                      label="Amount"
                      value={formatMonetaryValue(item.spending || 0)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (value === '' || /^\d+$/.test(value)) {
                          const numericValue = value === '' ? 0 : parseInt(value);
                          handleSpendingChange(yearlySpending.indexOf(item), 'spending', numericValue);
                        }
                      }}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton 
                      onClick={() => removeSpending(yearlySpending.indexOf(item))} 
                      color="error"
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addYearlyData('spending')}
                sx={{ mt: 2 }}
              >
                Add Spending
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Yearly Income
              </Typography>

              {yearlyIncome.map((item) => (
                <Grid container spacing={2} key={item.id} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <TextField
                      sx={{ width: '100%', minWidth: '120px' }}
                      label="Start Age"
                      type="number"
                      value={item.startAge}
                      onChange={(e) => handleIncomeChange(yearlyIncome.indexOf(item), 'startAge', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: inputs.currentAge, max: inputs.endAge } }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      sx={{ width: '100%', minWidth: '120px' }}
                      label="End Age"
                      type="number"
                      value={item.endAge}
                      onChange={(e) => handleIncomeChange(yearlyIncome.indexOf(item), 'endAge', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: inputs.currentAge, max: inputs.endAge } }}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      sx={{ width: '100%', minWidth: '200px' }}
                      label="Amount"
                      value={formatMonetaryValue(item.income || 0)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (value === '' || /^\d+$/.test(value)) {
                          const numericValue = value === '' ? 0 : parseInt(value);
                          handleIncomeChange(yearlyIncome.indexOf(item), 'income', numericValue);
                        }
                      }}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton 
                      onClick={() => removeIncome(yearlyIncome.indexOf(item))} 
                      color="error"
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addYearlyData('income')}
                sx={{ mt: 2 }}
              >
                Add Income
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={stopAtFire}
                  onChange={(e) => setStopAtFire(e.target.checked)}
                  color="primary"
                />
              }
              label="Stop at FIRE (Set spending to retirement amount and income to 0 after FIRE age)"
            />
          </Grid>

          <Grid item xs={12}>
            <CalculateButton
              onClick={handleCalculate}
              loading={loading}
              fullWidth
            />
          </Grid>

          {results && (
            <>
              <Box sx={{ width: '100%' }}>
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Results
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ flex: '1 1 300px' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        FIRE Age: {results.fireAge ? results.fireAge : 'Not Possible'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 300px' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Required Savings: {results.requiredSavings ? `$${results.requiredSavings.toLocaleString()}` : 'Not Possible'}
                      </Typography>
                    </Box>
                    {results.error && (
                      <Typography color="error" variant="body1" gutterBottom>
                        {results.error}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ width: '100%', mt: 3 }}>
                <Paper sx={{ 
                  p: 3,
                  width: '100%',
                  height: { xs: '300px', sm: '400px', md: '500px' }
                }}>
                  {results && (
                    <Box sx={{ width: '100%', height: '100%' }}>
                      <NetWorthChart
                        data={results.years.map((year, index) => ({
                          age: year,
                          nominal: Math.round(results.nominalNetWorth[index]),
                          real: Math.round(results.realNetWorth[index]),
                          afterTaxIncome: Math.round(results.yearlyAfterTaxIncome[index]),
                          spending: Math.round(results.yearlySpending[index])
                        }))}
                        fireAge={results.fireAge}
                      />
                    </Box>
                  )}
                </Paper>
              </Box>

              <Box sx={{ width: '100%', mt: 3 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Yearly Financial Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    All values shown in today's money.
                    Real return rate: {(((1 + inputs.annualReturn / 100) / (1 + inputs.inflationRate / 100) - 1) * 100).toFixed(1)}%
                    (nominal {inputs.annualReturn}% ÷ inflation {inputs.inflationRate}%)
                  </Typography>
                  {results && (
                    <Box sx={{ 
                      width: '100%',
                      display: 'grid',
                      overflowX: 'auto'
                    }}>
                      <TableContainer>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Age</strong></TableCell>
                              <TableCell align="right"><strong>Pre-Tax Income</strong></TableCell>
                              <TableCell align="right"><strong>After-Tax Income</strong></TableCell>
                              <TableCell align="right"><strong>Tax Rate</strong></TableCell>
                              <TableCell align="right"><strong>Spending</strong></TableCell>
                              <TableCell align="right"><strong>Savings</strong></TableCell>
                              <TableCell align="right"><strong>Interest Earned</strong></TableCell>
                              <TableCell align="right"><strong>Net Worth Growth</strong></TableCell>
                              <TableCell align="right"><strong>Net Worth</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {results.years.map((year, index) => (
                              <TableRow 
                                key={`row-${year}`}
                                sx={{ 
                                  backgroundColor: getRowBackgroundColor(
                                    results.yearlySavings[index],
                                    results.yearlySavings[index] + results.yearlyRealInterest[index],
                                    results.realNetWorth[index]
                                  ),
                                  '&:hover': { backgroundColor: '#f5f5f5' },
                                  transition: 'background-color 0.2s ease-in-out'
                                }}
                              >
                                <TableCell component="th" scope="row">
                                  <strong>{year}</strong>
                                  {results.fireAge === year && (
                                    <Box component="span" sx={{ ml: 1, color: 'error.main', fontWeight: 'bold' }}>
                                      🔥 FIRE
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  ${Math.round(results.yearlyPreTaxIncome[index]).toLocaleString()}
                                </TableCell>
                                <TableCell align="right">
                                  ${Math.round(results.yearlyAfterTaxIncome[index]).toLocaleString()}
                                </TableCell>
                                <TableCell align="right">
                                  {results.yearlyTaxRates[index].toFixed(1)}%
                                </TableCell>
                                <TableCell align="right">
                                  ${Math.round(results.yearlySpending[index]).toLocaleString()}
                                </TableCell>
                                <TableCell 
                                  align="right"
                                  sx={{ 
                                    color: getSavingsColor(results.yearlySavings[index]),
                                    fontWeight: results.yearlySavings[index] !== 0 ? 'bold' : 'normal'
                                  }}
                                >
                                  ${Math.round(results.yearlySavings[index]).toLocaleString()}
                                </TableCell>
                                <TableCell 
                                  align="right"
                                  sx={{ 
                                    color: getSavingsColor(results.yearlyRealInterest[index]),
                                    fontWeight: results.yearlyRealInterest[index] !== 0 ? 'bold' : 'normal'
                                  }}
                                >
                                  ${Math.round(results.yearlyRealInterest[index]).toLocaleString()}
                                </TableCell>
                                <TableCell 
                                  align="right"
                                  sx={{ 
                                    color: getSavingsColor(results.yearlySavings[index] + results.yearlyRealInterest[index]),
                                    fontWeight: (results.yearlySavings[index] + results.yearlyRealInterest[index]) !== 0 ? 'bold' : 'normal'
                                  }}
                                >
                                  ${Math.round(results.yearlySavings[index] + results.yearlyRealInterest[index]).toLocaleString()}
                                </TableCell>
                                <TableCell 
                                  align="right"
                                  sx={{ 
                                    color: results.realNetWorth[index] < 0 ? 'error.main' : 'inherit',
                                    fontWeight: results.realNetWorth[index] < 0 ? 'bold' : 'normal'
                                  }}
                                >
                                  ${Math.round(results.realNetWorth[index]).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Paper>
              </Box>
            </>
          )}

          {/* Save Profile Dialog */}
          <Dialog 
            open={saveDialogOpen} 
            onClose={() => setSaveDialogOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: 2,
                minWidth: { xs: '90%', sm: 400 }
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>Save Profile</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Profile Name"
                fullWidth
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSaveProfile} 
                disabled={!profileName}
                variant="contained"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Load Profile Dialog */}
          <Dialog
            open={loadDialogOpen}
            onClose={() => setLoadDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>Load Profile</DialogTitle>
            <DialogContent>
              {profiles.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No saved profiles found
                </Typography>
              ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {profiles.map((profile) => (
                    <ListItem
                      key={profile._id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:last-child': { mb: 0 },
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)'
                        }
                      }}
                    >
                      <ListItemText
                        primary={profile.name}
                        slotProps={{ primary: { fontWeight: 'medium' } }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleLoadProfile(profile._id)}
                        >
                          Load
                        </Button>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteProfile(profile._id)}
                          color="error"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setLoadDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Grid>
        
        {/* GitHub Link */}
        <Box sx={{ 
          mt: 6, 
          pt: 4, 
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            component="a"
            href="https://github.com/dlccyes/nw-simulator"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontFamily: 'monospace',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            GitHub
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default FireCalculator;