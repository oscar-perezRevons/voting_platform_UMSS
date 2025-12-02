import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { toast } from 'react-hot-toast';

import { 
  Paper, Box, Typography, TextField, Button, 
  Stack, Divider, Chip, useTheme 
} from '@mui/material';

import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SportsScoreIcon from '@mui/icons-material/SportsScore';

export default function AuthForm() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLoginView) {
      const result = await login(email, password);
      if (result.success) {
        toast.success(result.isAdmin ? 'Bienvenido al Panel de Administacion' : 'Bienvenido..');
      } else {
        toast.error(`Error de acceso: ${result.msg}`);
      }
    } else {
      if (!isConnected || !address) {
        toast.error('Debes conectar tu billetera para obtener tu Registro.');
        setLoading(false);
        return;
      }
      
      const result = await register(email, password, address);
      if (result.success) {
        toast.success('¡Usuario creado! Ahora inicia sesión para entrar a la votacion.');
        setIsLoginView(true); 
        setPassword('');
      } else {
        toast.error(`Fallo en el registro de usuario: ${result.msg}`);
      }
    }
    setLoading(false);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        py: 4
      }}
    >
      <Paper 
        elevation={10} 
        sx={{ 
          p: 5, 
          width: '100%', 
          maxWidth: 450, 
          borderRadius: 2,
          bgcolor: '#1E1E1E', 
          border: `2px solid ${theme.palette.primary.main}`, 
          boxShadow: `0 0 25px rgba(255, 40, 0, 0.5)` 
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <SportsScoreIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Exo 2", sans-serif', fontWeight: 800, color: 'white' }}>
            {isLoginView ? 'ACCESO' : 'NUEVO REGISTRO'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoginView 
              ? 'Ingresa tus credenciales para acceder al sistema de votación.' 
              : 'Registra tu identidad y vincula tu billetera Ethereum.'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Correo Electrónico"
              type="email"
              fullWidth
              required
              variant="outlined" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ bgcolor: '#242424', '.MuiInputBase-root': { color: 'white' } }}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              required
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ bgcolor: '#242424', '.MuiInputBase-root': { color: 'white' } }}
            />
            {!isLoginView && (
              <Box sx={{ mt: 2, p: 2, border: `1px dashed ${theme.palette.secondary.main}`, borderRadius: 1, textAlign: 'center', bgcolor: '#282828' }}>
                <Typography variant="caption" display="block" gutterBottom sx={{ color: theme.palette.secondary.main, fontWeight: 700 }}>
                  VINCULACIÓN DE BILLETERA
                </Typography>
                
                {isConnected ? (
                  <Chip 
                    icon={<AccountBalanceWalletIcon />} 
                    label={`Vinculada: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`} 
                    color="success" 
                    variant="filled"
                    sx={{ fontWeight: 700 }}
                  />
                ) : (
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={() => connect({ connector: injected() })}
                    size="medium"
                    sx={{ fontWeight: 700 }}
                  >
                    Conectar MetaMask
                  </Button>
                )}
              </Box>
            )}
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large" 
              fullWidth
              disabled={loading || (!isLoginView && !isConnected)}
              sx={{ 
                py: 1.5, 
                fontSize: '1.2rem', 
                fontWeight: 900, 
                letterSpacing: '1px',
                mt: 4,
                '&:hover': {
                  boxShadow: `0 0 10px ${theme.palette.primary.main}`
                }
              }}
            >
              {loading ? 'Procesando...' : (isLoginView ? 'ENTRAR' : 'REGISTRAR USUARIO')}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
            {isLoginView ? "¿No tienes cuenta?" : "¿Ya tienes una cuenta?"}
          </Typography>
          <Button 
            onClick={() => setIsLoginView(!isLoginView)}
            color="secondary"
            startIcon={isLoginView ? <AppRegistrationIcon /> : <LoginIcon />}
            sx={{ fontWeight: 700 }}
          >
            {isLoginView ? "Obtener Registro" : "Iniciar Sesión"}
          </Button>
        </Box>

      </Paper>
    </Box>
  );
}