import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import { getCurrencySymbol } from '../config/countries';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

interface TaxConfig {
  standard_deduction: number;
  brackets: TaxBracket[];
  single?: {
    standard_deduction: number;
    brackets: TaxBracket[];
  };
  married?: {
    standard_deduction: number;
    brackets: TaxBracket[];
  };
}

interface PayrollTaxConfig {
  social_security?: {
    rate: number;
    wage_base: number;
  };
  medicare?: {
    rate: number;
    additional_rate: number;
    additional_threshold: number;
    additional_threshold_married?: number;
  };
  labor_insurance?: {
    rate: number;
    description?: string;
  };
  health_insurance?: {
    rate: number;
    annual_cap: number;
    annual_cap_married?: number;
    description?: string;
  };
}

interface TaxInfoData {
  federal: TaxConfig;
  payroll_taxes: PayrollTaxConfig;
  states: { [key: string]: TaxConfig };
}

interface TaxInfoDialogProps {
  open: boolean;
  onClose: () => void;
  taxType: 'federal' | 'fica' | 'state';
  stateCode?: string;
  taxData: TaxInfoData | null;
  country?: string;
}

const TaxInfoDialog: React.FC<TaxInfoDialogProps> = ({
  open,
  onClose,
  taxType,
  stateCode,
  taxData,
  country
}) => {
  const formatCurrency = (amount: number): string => {
    // Use the exact same currency logic as the FireCalculator
    return `${getCurrencySymbol(country || 'US')}${Math.round(amount).toLocaleString()}`;
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getStateName = (code: string): string => {
    const stateNames: { [key: string]: string } = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia'
    };
    return stateNames[code] || code;
  };

  const renderTitle = () => {
    switch (taxType) {
      case 'federal':
        return 'Federal Income Tax';
      case 'fica':
        if (country === 'TW') {
          return 'Payroll Deductions (Labor & Health Insurance)';
        } else {
          return 'FICA Taxes (Social Security & Medicare)';
        }
      case 'state':
        return `${getStateName(stateCode || '')} State Tax`;
      default:
        return 'Tax Information';
    }
  };

  const renderContent = () => {
    if (!taxData) return <Typography>Loading tax information...</Typography>;

    switch (taxType) {
      case 'federal':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Standard Deduction
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1">
                Single: {formatCurrency(taxData.federal.single?.standard_deduction || taxData.federal.standard_deduction)}
              </Typography>
              <Typography variant="body1">
                Married Filing Jointly: {formatCurrency(taxData.federal.married?.standard_deduction || taxData.federal.standard_deduction)}
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Tax Brackets (2024)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Income Range (Single)</TableCell>
                    <TableCell>Income Range (Married)</TableCell>
                    <TableCell align="right">Tax Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const singleBrackets = taxData.federal.single?.brackets || taxData.federal.brackets;
                    const marriedBrackets = taxData.federal.married?.brackets || taxData.federal.brackets;
                    const maxLength = Math.max(singleBrackets.length, marriedBrackets.length);
                    
                    return Array.from({ length: maxLength }, (_, index) => {
                      const singleBracket = singleBrackets[index];
                      const marriedBracket = marriedBrackets[index];
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {singleBracket ? 
                              `${formatCurrency(singleBracket.min)} - ${singleBracket.max ? formatCurrency(singleBracket.max) : 'No limit'}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            {marriedBracket ? 
                              `${formatCurrency(marriedBracket.min)} - ${marriedBracket.max ? formatCurrency(marriedBracket.max) : 'No limit'}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell align="right">
                            {singleBracket?.rate || marriedBracket?.rate ? 
                              formatPercentage(singleBracket?.rate || marriedBracket?.rate || 0) : 
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
          </Box>
        );

      case 'fica': {
        if (country === 'US' && taxData.payroll_taxes.social_security && taxData.payroll_taxes.medicare) {
          // US FICA taxes
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Social Security Tax
              </Typography>
              <Typography variant="body1" gutterBottom>
                Rate: {formatPercentage(taxData.payroll_taxes.social_security.rate)} (per individual, regardless of filing status)
              </Typography>
              <Typography variant="body1" gutterBottom>
                Wage Base: {formatCurrency(taxData.payroll_taxes.social_security.wage_base)} (per individual)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Note: Social Security tax is calculated separately for each individual. For married couples filing jointly, each spouse pays Social Security tax on their own wages up to the wage base limit.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Medicare Tax
              </Typography>
              <Typography variant="body1" gutterBottom>
                Standard Rate: {formatPercentage(taxData.payroll_taxes.medicare.rate)} (per individual, no wage cap)
              </Typography>
              <Typography variant="body1" gutterBottom>
                Additional Rate: {formatPercentage(taxData.payroll_taxes.medicare.additional_rate)}
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Single: On income over {formatCurrency(taxData.payroll_taxes.medicare.additional_threshold)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Married Filing Jointly: On combined income over {formatCurrency(taxData.payroll_taxes.medicare.additional_threshold_married || taxData.payroll_taxes.medicare.additional_threshold)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Note: Unlike Social Security tax, the Medicare additional tax threshold considers combined income for married couples filing jointly.
              </Typography>
            </Box>
          );
        } else if (country === 'TW' && taxData.payroll_taxes.labor_insurance && taxData.payroll_taxes.health_insurance) {
          // Taiwan payroll deductions
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Labor Insurance
              </Typography>
              <Typography variant="body1" gutterBottom>
                Rate: {formatPercentage(taxData.payroll_taxes.labor_insurance.rate)} (per individual)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Direct payroll deduction with no annual cap
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Health Insurance
              </Typography>
              <Typography variant="body1" gutterBottom>
                Rate: {formatPercentage(taxData.payroll_taxes.health_insurance.rate)} (per individual)
              </Typography>
              <Typography variant="body1" gutterBottom>
                Annual Cap:
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Single: {formatCurrency(taxData.payroll_taxes.health_insurance.annual_cap)} per person
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Married: {formatCurrency(taxData.payroll_taxes.health_insurance.annual_cap_married || taxData.payroll_taxes.health_insurance.annual_cap)} combined for both spouses
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Note: Health insurance is calculated per individual but has different annual caps for single vs married filing status.
              </Typography>
            </Box>
          );
        } else {
          return <Typography>No payroll tax information available.</Typography>;
        }
      }

      case 'state': {
        if (!stateCode || !taxData.states[stateCode]) {
          return <Typography>No state tax information available.</Typography>;
        }
        const stateData = taxData.states[stateCode];
        
        const hasTax = (stateData.single?.brackets || stateData.brackets || []).length > 0 || 
                      (stateData.married?.brackets || stateData.brackets || []).length > 0;
        
        if (!hasTax) {
          return (
            <Typography variant="body1">
              {getStateName(stateCode)} has no state income tax 🥳
            </Typography>
          );
        }

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Standard Deduction
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body1">
                Single: {formatCurrency(stateData.single?.standard_deduction || stateData.standard_deduction)}
              </Typography>
              <Typography variant="body1">
                Married Filing Jointly: {formatCurrency(stateData.married?.standard_deduction || stateData.standard_deduction)}
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              State Tax Brackets
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Income Range (Single)</TableCell>
                    <TableCell>Income Range (Married)</TableCell>
                    <TableCell align="right">Tax Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const singleBrackets = stateData.single?.brackets || stateData.brackets;
                    const marriedBrackets = stateData.married?.brackets || stateData.brackets;
                    const maxLength = Math.max(singleBrackets.length, marriedBrackets.length);
                    
                    return Array.from({ length: maxLength }, (_, index) => {
                      const singleBracket = singleBrackets[index];
                      const marriedBracket = marriedBrackets[index];
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {singleBracket ? 
                              `${formatCurrency(singleBracket.min)} - ${singleBracket.max ? formatCurrency(singleBracket.max) : 'No limit'}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            {marriedBracket ? 
                              `${formatCurrency(marriedBracket.min)} - ${marriedBracket.max ? formatCurrency(marriedBracket.max) : 'No limit'}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell align="right">
                            {singleBracket?.rate || marriedBracket?.rate ? 
                              formatPercentage(singleBracket?.rate || marriedBracket?.rate || 0) : 
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
          </Box>
        );
      }

      default:
        return <Typography>No information available.</Typography>;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{renderTitle()}</DialogTitle>
      <DialogContent>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaxInfoDialog; 