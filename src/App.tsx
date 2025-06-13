import React from 'react';
import { CssBaseline, Container, ThemeProvider, createTheme } from '@mui/material';
import FireCalculator from './components/FireCalculator';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <FireCalculator />
      </Container>
    </ThemeProvider>
  );
};

export default App;
