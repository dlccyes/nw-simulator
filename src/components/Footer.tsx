import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box sx={{ 
      mt: 6, 
      pt: 4, 
      borderTop: '1px solid',
      borderColor: 'divider',
      textAlign: 'center'
    }}>
      {/* Tax Disclaimer - Always shown since both pages use tax calculations */}
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        * Calculations are estimates based on 2024 tax brackets and standard deductions. 
        Actual taxes may vary based on individual circumstances, deductions, and credits.
      </Typography>
      
      {/* GitHub Link */}
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
  );
};

export default Footer; 