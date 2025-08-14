import React from 'react';
import { Button, Box, CircularProgress } from '@mui/material';

interface CalculateButtonProps {
  loading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const CalculateButton: React.FC<CalculateButtonProps> = ({
  loading,
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  children = 'Calculate'
}) => {
  return (
    <Button
      type={type}
      variant="contained"
      color="primary"
      onClick={onClick}
      fullWidth={fullWidth}
      size="large"
      disabled={loading || disabled}
      sx={{ 
        py: 1.5,
        fontSize: '1.1rem',
        fontWeight: 600,
        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        '&:hover': {
          background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
        },
        minHeight: '48px',
        '& .MuiCircularProgress-root': {
          color: 'white'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%',
        minWidth: '120px'
      }}>
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          children
        )}
      </Box>
    </Button>
  );
};

export default CalculateButton; 