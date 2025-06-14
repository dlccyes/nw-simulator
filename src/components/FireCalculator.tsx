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
  Switch
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, FolderOpen as FolderOpenIcon } from '@mui/icons-material';
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
  state: string;
  preTax401k: number;
  employerMatch: number;
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
  'CA',  // California
  'AK',  // Alaska
  'FL',  // Florida
  'NV',  // Nevada
  'NH',  // New Hampshire
  'SD',  // South Dakota
  'TN',  // Tennessee
  'TX',  // Texas
  'WA',  // Washington
  'WY'   // Wyoming
];

const Grid = MuiGrid as any;  // Type assertion to bypass the type error

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
  const [inputs, setInputs] = useState<Inputs>({
    currentAge: 23,
    endAge: 50,
    currentNetWorth: 70000,
    annualReturn: 8,
    inflationRate: 3,
    retirementSpending: 100000,
    withdrawalRate: 4,
    state: 'CA',
    preTax401k: 23000,
    employerMatch: 5
  });

  const [yearlySpending, setYearlySpending] = useState<YearlyDataItem[]>([
    { id: 'spending-1', startAge: 23, endAge: 50, spending: 100000 }
  ]);

  const [yearlyIncome, setYearlyIncome] = useState<YearlyDataItem[]>([
    { id: 'income-1', startAge: 23, endAge: 25, income: 230000 },
    { id: 'income-2', startAge: 26, endAge: 30, income: 300000 },
    { id: 'income-3', startAge: 31, endAge: 40, income: 400000 }
  ]);

  const [results, setResults] = useState<Results | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [stopAtFire, setStopAtFire] = useState(false);

  useEffect(() => {
    if (enableProfile) {
      loadProfiles();
    }
  }, [enableProfile]);

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
        state: config.state,
        preTax401k: config.preTax401k,
        employerMatch: config.employerMatch
      });

      setYearlySpending(config.yearlySpending.map((d: any) => ({
        id: d.id,
        startAge: d.startAge,
        endAge: d.endAge,
        spending: d.amount
      })));

      setYearlyIncome(config.yearlyIncome.map((d: any) => ({
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
      [name]: name === 'state' ? value : Number(value)
    }));
  };

  const handleStateChange = (event: SelectChangeEvent<string>) => {
    setInputs({
      ...inputs,
      state: event.target.value
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inputs,
          endAge: inputs.endAge,  // Keep API compatibility
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
    }
  };

  const getSavingsColor = (savings: number) => {
    if (savings < 0) return 'red';
    if (savings > 0) return 'green';
    return 'inherit';
  };

  const getRowBackgroundColor = (savings: number, netWorthGrowth: number, netWorth: number) => {
    if (netWorth < 0) return '#ffebee';  // red when net worth is negative
    if (netWorthGrowth < 0) return '#fff3e0';  // orange when net worth growth is negative
    if (savings < 0) return '#faf9c4';  // softer yellow when savings negative but net worth growth positive
    if (savings > 0) return '#e8f5e8';  // green when savings positive
    return 'inherit';
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <style>{fireAnimation}</style>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 600,
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <span className="fire-text">FIRE</span>
        <span style={{
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Calculator
        </span>
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item component="div" xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            mb: 3,
            '& .MuiButton-root': {
              minWidth: 120
            }
          }}>
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
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Enter the money in today's dollars.
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  sx={{ width: '100%', minWidth: '120px' }}
                  label="Current Age"
                  name="currentAge"
                  type="number"
                  value={inputs.currentAge}
                  onChange={handleInputChange}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  sx={{ width: '100%', minWidth: '120px' }}
                  label="End Age"
                  name="endAge"
                  type="number"
                  value={inputs.endAge}
                  onChange={handleInputChange}
                  slotProps={{ htmlInput: { min: inputs.currentAge + 1 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  sx={{ width: '100%', minWidth: '200px' }}
                  label="Current Net Worth"
                  name="currentNetWorth"
                  type="number"
                  value={inputs.currentNetWorth}
                  onChange={handleInputChange}
                  slotProps={{
                    htmlInput: { min: 0 },
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  sx={{ width: '100%', minWidth: '200px' }}
                  label="Nominal Annual Return (%)"
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
              <Grid item xs={6}>
                <TextField
                  sx={{ width: '100%', minWidth: '200px' }}
                  label="Retirement Spending"
                  name="retirementSpending"
                  type="number"
                  value={inputs.retirementSpending}
                  onChange={handleInputChange}
                  slotProps={{
                    htmlInput: { min: 0 },
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Real return rate: {(((1 + inputs.annualReturn / 100) / (1 + inputs.inflationRate / 100) - 1) * 100).toFixed(1)}%
              (nominal {inputs.annualReturn}% ÷ inflation {inputs.inflationRate}%)
            </Typography>
          </Paper>
        </Grid>

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
                  type="number"
                  value={inputs.preTax401k}
                  onChange={handleInputChange}
                  slotProps={{
                    htmlInput: { min: 0 },
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
                    type="number"
                    value={item.spending}
                    onChange={(e) => handleSpendingChange(yearlySpending.indexOf(item), 'spending', Number(e.target.value))}
                    slotProps={{
                      htmlInput: { min: 0 },
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
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select
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
                    type="number"
                    value={item.income}
                    onChange={(e) => handleIncomeChange(yearlyIncome.indexOf(item), 'income', Number(e.target.value))}
                    slotProps={{
                      htmlInput: { min: 0 },
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleCalculate}
            fullWidth
            size="large"
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              }
            }}
          >
            Calculate
          </Button>
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
    </Box>
  );
};

export default FireCalculator;