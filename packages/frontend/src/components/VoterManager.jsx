import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Box, Typography, Button, TextField, Paper, Stack, 
  Alert, Divider, useTheme 
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
export default function VoterManager({ voting }) {
  const { api } = useAuth();
  const theme = useTheme();
  const [emails, setEmails] = useState(''); 
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [loadingAuthorize, setLoadingAuthorize] = useState(false);
  const handleWhitelist = async () => {
    setLoadingWhitelist(true);
    const toastId = toast.loading('Paso 1: Guardando Superlicencias en la Base de Datos...');

    const voterEmails = emails.split(',').map(email => email.trim()).filter(Boolean);

    if (voterEmails.length === 0) {
      toast.error('Por favor, introduce al menos un email.', { id: toastId });
      setLoadingWhitelist(false);
      return;
    }

    try {
      const res = await api.post(`/admin/votings/${voting.id}/whitelist`, { voterEmails });
      toast.success(res.data.msg, { id: toastId });
      setEmails(''); 
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message;
      toast.error(`Error de Base de Datos: ${errorMsg}`, { id: toastId });
    }
    setLoadingWhitelist(false);
  };

  const handleAuthorizeOnChain = async () => {
    setLoadingAuthorize(true);
    const toastId = toast.loading('Paso 2: Transfiriendo permisos a la Blockchain... (Puede tardar)');

    try {
      const res = await api.post(`/admin/votings/${voting.id}/authorize-on-chain`);
      toast.success(res.data.msg, { id: toastId, duration: 8000 });
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message;
      toast.error(`Error de Sincronización: ${errorMsg}`, { id: toastId });
    }
    setLoadingAuthorize(false);
  };

  return (
    <Paper 
      sx={{ 
        p: 4, 
        mt: 3, 
        bgcolor: '#242424', 
        borderLeft: `6px solid ${theme.palette.secondary.main}`, 
        boxShadow: '0 0 10px rgba(0, 200, 255, 0.2)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon color="secondary" sx={{ mr: 1, fontSize: 30 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.light }}>
          Gestor de Autorización
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define qué usuarios pueden participar en la votación {voting.title} Este proceso requiere dos pasos de seguridad.
      </Typography>

      <Stack spacing={3}>
        {/* PASO 1: AGREGAR A DB */}
        <Box sx={{ p: 2, bgcolor: '#1E1E1E', borderRadius: 1, border: '1px solid #555' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1, display: 'flex', alignItems: 'center' }}>
            <GroupAddIcon sx={{ mr: 1, color: theme.palette.secondary.main }} /> PASO 1: Listado en DB
          </Typography>
          <TextField
            label="Emails de Votantes (separados por coma)"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="piloto1@univ.com, copiloto2@univ.com, ..."
            sx={{ bgcolor: '#282828', '.MuiInputBase-root': { color: 'white' }, mb: 2 }}
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={<GroupAddIcon />}
            disabled={loadingWhitelist || loadingAuthorize}
            onClick={handleWhitelist}
            fullWidth
            sx={{ py: 1.5, fontWeight: 700 }}
          >
            {loadingWhitelist ? 'Guardando en Neon...' : 'Guardar en Lista Blanca (Base de Datos)'}
          </Button>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255,40,0,0.3)' }}>
          <VerifiedUserIcon color="primary" />
        </Divider>
        <Box sx={{ p: 2, bgcolor: '#1E1E1E', borderRadius: 1, border: `1px solid ${theme.palette.primary.main}` }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1, display: 'flex', alignItems: 'center' }}>
            <CloudSyncIcon sx={{ mr: 1, color: theme.palette.primary.main }} /> PASO 2: Sincronizar en Chain
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, bgcolor: 'rgba(255,40,0,0.1)', color: 'white', border: '1px solid #FF2800' }}>
            Advertencia: Esto ejecuta una transacción en la red Sepolia para autorizar los wallets vinculados.
          </Alert>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudSyncIcon />}
            disabled={loadingWhitelist || loadingAuthorize}
            onClick={handleAuthorizeOnChain}
            fullWidth
            sx={{ py: 1.5, fontWeight: 700 }}
          >
            {loadingAuthorize ? 'Ejecutando TX...' : 'Sincronizar Lista con Blockchain (Sepolia)'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}