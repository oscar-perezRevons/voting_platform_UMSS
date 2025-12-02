import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi.config.js';

import { AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';

const ferrariTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF2800' }, 
    secondary: { main: '#FFF200' }, 
    background: { default: 'transparent', paper: '#151515' },
    text: { primary: '#FFFFFF', secondary: '#B0B0B0' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' },
    h4: { fontWeight: 700, textTransform: 'uppercase', color: '#FFF200' },
    button: { fontWeight: 700, letterSpacing: '0.05em' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, transition: 'all 0.2s' }, 
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #333', backgroundImage: 'none' },
      },
    },
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider theme={ferrariTheme}>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', border: '1px solid #FF2800' } }} />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);