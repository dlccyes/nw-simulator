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

interface TaxInfoDialogProps {
  open: boolean;
  onClose: () => void;
  taxType: 'federal' | 'fica' | 'state';
  stateCode?: string;
  taxData: TaxInfoData | null;
}

const TaxInfoDialog: React.FC<TaxInfoDialogProps> = ({
  open,
  onClose,
  taxType,
  stateCode,
  taxData
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
        return 'FICA Taxes (Social Security & Medicare)';
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
              Standard Deduction: {formatCurrency(taxData.federal.standard_deduction)}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Tax Brackets (2024)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Income Range</TableCell>
                    <TableCell align="right">Tax Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxData.federal.brackets.map((bracket, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatCurrency(bracket.min)} - {bracket.max ? formatCurrency(bracket.max) : 'No limit'}
                      </TableCell>
                      <TableCell align="right">{formatPercentage(bracket.rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 'fica':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Social Security Tax
            </Typography>
            <Typography variant="body1" gutterBottom>
              Rate: {formatPercentage(taxData.payroll_taxes.social_security.rate)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Wage Base: {formatCurrency(taxData.payroll_taxes.social_security.wage_base)}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Medicare Tax
            </Typography>
            <Typography variant="body1" gutterBottom>
              Standard Rate: {formatPercentage(taxData.payroll_taxes.medicare.rate)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Additional Rate: {formatPercentage(taxData.payroll_taxes.medicare.additional_rate)} 
              (on income over {formatCurrency(taxData.payroll_taxes.medicare.additional_threshold)})
            </Typography>
          </Box>
        );

      case 'state': {
        if (!stateCode || !taxData.states[stateCode]) {
          return <Typography>No state tax information available.</Typography>;
        }
        const stateData = taxData.states[stateCode];
        
        if (stateData.brackets.length === 0) {
          return (
            <Typography variant="body1">
              {getStateName(stateCode)} has no state income tax 🥳
            </Typography>
          );
        }

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Standard Deduction: {formatCurrency(stateData.standard_deduction)}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              State Tax Brackets
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Income Range</TableCell>
                    <TableCell align="right">Tax Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stateData.brackets.map((bracket, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatCurrency(bracket.min)} - {bracket.max ? formatCurrency(bracket.max) : 'No limit'}
                      </TableCell>
                      <TableCell align="right">{formatPercentage(bracket.rate)}</TableCell>
                    </TableRow>
                  ))}
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