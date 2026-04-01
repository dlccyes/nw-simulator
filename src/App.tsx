import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CssBaseline, Container, ThemeProvider, createTheme, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import FireCalculator from './components/FireCalculator';
import UsTaxTable from './components/UsTaxTable';
import RetirementSimulator from './components/RetirementSimulator';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff5722', // Orange-red color
    },
  },
});

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#ff5722', // Orange-red background
        width: '100%',
        boxShadow: 2,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Toolbar sx={{ px: 0 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Financial Calculator
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
            variant={location.pathname === '/' ? 'outlined' : 'text'}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              },
              borderColor: location.pathname === '/' ? '#fff' : 'transparent',
            }}
          >
            FIRE Calculator
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/retirement"
            variant={location.pathname === '/retirement' ? 'outlined' : 'text'}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              },
              borderColor: location.pathname === '/retirement' ? '#fff' : 'transparent',
            }}
          >
            Retirement Simulator
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/us-tax"
            variant={location.pathname === '/us-tax' ? 'outlined' : 'text'}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              },
              borderColor: location.pathname === '/us-tax' ? '#fff' : 'transparent',
            }}
          >
            US Tax Comparison
          </Button>
        </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navigation />
          <Container maxWidth="lg" sx={{ mt: 3, flex: 1 }}>
            <Routes>
              <Route path="/" element={<FireCalculator />} />
              <Route path="/retirement" element={<RetirementSimulator />} />
              <Route path="/us-tax" element={<UsTaxTable />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
