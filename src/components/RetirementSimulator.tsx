import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/env';
import {
  Box,
  TextField,
  Typography,
  Grid as MuiGrid,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Alert
} from '@mui/material';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import DarkModeToggle from './DarkModeToggle';
import { usePersistentDarkMode } from '../hooks/usePersistentDarkMode';
import Footer from './Footer';
import type { SelectChangeEvent } from '@mui/material/Select';

const Grid = MuiGrid as React.ComponentType<Record<string, unknown>>;

interface Inputs {
  currentAge: number;
  retirementAge: number;
  endAge: number;
  traditionalIRA: number;
  rothIRA: number;
  traditional401k: number;
  roth401k: number;
  taxableAccounts: number;
  annualIncome: number;
  annualSpending: number;
  annualReturn: number;
  inflationRate: number;
  state: string;
  filingStatus: 'single' | 'married';
  socialSecurityClaimAge: number;
}

interface RetirementResult {
  years: number[];
  traditionalIRA: number[];
  rothIRA: number[];
  traditional401k: number[];
  roth401k: number[];
  taxableAccounts: number[];
  totalNetWorth: number[];
  socialSecurityBenefit: number[];
  withdrawals: number[];
  taxes: number[];
  remainingSpending: number[];
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const RetirementSimulator: React.FC = () => {
  const [darkMode, setDarkMode] = usePersistentDarkMode();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#ff5722',
      },
    },
  });

  const [inputs, setInputs] = useState<Inputs>({
    currentAge: 30,
    retirementAge: 65,
    endAge: 90,
    traditionalIRA: 50000,
    rothIRA: 30000,
    traditional401k: 100000,
    roth401k: 0,
    taxableAccounts: 20000,
    annualIncome: 100000,
    annualSpending: 50000,
    annualReturn: 7,
    inflationRate: 3,
    state: 'CA',
    filingStatus: 'single',
    socialSecurityClaimAge: 67,
  });

  const [result, setResult] = useState<RetirementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Inputs) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setInputs(prev => ({
      ...prev,
      [field]: field === 'state' || field === 'filingStatus' ? value : Number(value)
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/retirement`, inputs);
      setResult(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to calculate retirement projection');
      }
      console.error('Error calculating retirement:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const prepareChartData = () => {
    if (!result) return [];
    
    return result.years.map((year, i) => ({
      year,
      'Traditional IRA': Math.round(result.traditionalIRA[i]),
      'Roth IRA': Math.round(result.rothIRA[i]),
      'Traditional 401k': Math.round(result.traditional401k[i]),
      'Roth 401k': Math.round(result.roth401k[i]),
      'Taxable': Math.round(result.taxableAccounts[i]),
      'Total': Math.round(result.totalNetWorth[i]),
      'Withdrawals': Math.round(result.withdrawals[i]),
      'Social Security': Math.round(result.socialSecurityBenefit[i]),
      'Taxes': Math.round(result.taxes[i]),
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Retirement Simulator
          </Typography>
          <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Plan your retirement with detailed account tracking, Social Security benefits, and state-specific tax treatment.
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Current Age"
                type="number"
                value={inputs.currentAge}
                onChange={handleInputChange('currentAge')}
                inputProps={{ min: 18, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Retirement Age"
                type="number"
                value={inputs.retirementAge}
                onChange={handleInputChange('retirementAge')}
                inputProps={{ min: inputs.currentAge, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Life Expectancy"
                type="number"
                value={inputs.endAge}
                onChange={handleInputChange('endAge')}
                inputProps={{ min: inputs.retirementAge, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Annual Income (Current)"
                type="number"
                value={inputs.annualIncome}
                onChange={handleInputChange('annualIncome')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={inputs.state}
                  onChange={handleInputChange('state')}
                  label="State"
                >
                  {US_STATES.map(state => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filing Status</InputLabel>
                <Select
                  value={inputs.filingStatus}
                  onChange={handleInputChange('filingStatus')}
                  label="Filing Status"
                >
                  <MenuItem value="single">Single</MenuItem>
                  <MenuItem value="married">Married</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Balances (Current)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Traditional IRA"
                type="number"
                value={inputs.traditionalIRA}
                onChange={handleInputChange('traditionalIRA')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Roth IRA"
                type="number"
                value={inputs.rothIRA}
                onChange={handleInputChange('rothIRA')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Traditional 401k"
                type="number"
                value={inputs.traditional401k}
                onChange={handleInputChange('traditional401k')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Roth 401k"
                type="number"
                value={inputs.roth401k}
                onChange={handleInputChange('roth401k')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Taxable Accounts"
                type="number"
                value={inputs.taxableAccounts}
                onChange={handleInputChange('taxableAccounts')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Retirement Planning
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Annual Spending (Retirement)"
                type="number"
                value={inputs.annualSpending}
                onChange={handleInputChange('annualSpending')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Social Security Claim Age"
                type="number"
                value={inputs.socialSecurityClaimAge}
                onChange={handleInputChange('socialSecurityClaimAge')}
                inputProps={{ min: 62, max: 70 }}
                helperText="Age 62-70, 67 is Full Retirement Age"
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Investment Assumptions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Annual Return (%)"
                type="number"
                value={inputs.annualReturn}
                onChange={handleInputChange('annualReturn')}
                inputProps={{ min: 0, max: 20, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Inflation Rate (%)"
                type="number"
                value={inputs.inflationRate}
                onChange={handleInputChange('inflationRate')}
                inputProps={{ min: 0, max: 10, step: 0.1 }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Retirement Plan'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Account Balances Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Age: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="Traditional IRA" 
                    stackId="1"
                    fill="#8884d8" 
                    stroke="#8884d8"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Roth IRA" 
                    stackId="1"
                    fill="#82ca9d" 
                    stroke="#82ca9d"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Traditional 401k" 
                    stackId="1"
                    fill="#ffc658" 
                    stroke="#ffc658"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Roth 401k" 
                    stackId="1"
                    fill="#ff7300" 
                    stroke="#ff7300"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Taxable" 
                    stackId="1"
                    fill="#a4de6c" 
                    stroke="#a4de6c"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Total" 
                    stroke="#d62728" 
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Retirement Income & Expenses
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Age: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="Social Security" 
                    fill="#8884d8" 
                    stroke="#8884d8"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Withdrawals" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Taxes" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Projection Table
              </Typography>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Age</TableCell>
                      <TableCell align="right">Total NW</TableCell>
                      <TableCell align="right">Trad IRA</TableCell>
                      <TableCell align="right">Roth IRA</TableCell>
                      <TableCell align="right">Trad 401k</TableCell>
                      <TableCell align="right">Taxable</TableCell>
                      <TableCell align="right">SS Benefit</TableCell>
                      <TableCell align="right">Withdrawals</TableCell>
                      <TableCell align="right">Taxes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.years.map((year, i) => (
                      <TableRow key={year}>
                        <TableCell>{year}</TableCell>
                        <TableCell align="right">{formatCurrency(result.totalNetWorth[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.traditionalIRA[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.rothIRA[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.traditional401k[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.taxableAccounts[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.socialSecurityBenefit[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.withdrawals[i])}</TableCell>
                        <TableCell align="right">{formatCurrency(result.taxes[i])}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default RetirementSimulator;
