import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VoterManager from '../components/VoterManager'; 
import VotingMonitor from '../components/VotingMonitor'; 

import { 
  Container, Typography, Paper, Box, TextField, Button, 
  Grid, IconButton, Alert, Divider, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress,
  Stack,
  useTheme 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const { api } = useAuth(); 
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [candidates, setCandidates] = useState([{ name: '' }, { name: '' }]);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [votings, setVotings] = useState([]);
  const [loadingVotings, setLoadingVotings] = useState(true);
  const [selectedVoting, setSelectedVoting] = useState(null); 

  useEffect(() => {
    fetchVotings();
  }, []);

  const fetchVotings = async () => {
    try {
      const res = await api.get('/admin/my-created-votings');
      setVotings(res.data);
    } catch (error) {
      toast.error('No se pudieron cargar tus votaciones.');
    }
    setLoadingVotings(false);
  };

  const handleCandidateChange = (index, value) => {
    const newCandidates = [...candidates];
    newCandidates[index].name = value;
    setCandidates(newCandidates);
  };
  const addCandidate = () => setCandidates([...candidates, { name: '' }]);
  const removeCandidate = (index) => {
    const newCandidates = candidates.filter((_, i) => i !== index);
    setCandidates(newCandidates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return toast.error('Por favor completa los campos principales.');
    const validCandidates = candidates.filter(c => c.name.trim() !== '');
    if (validCandidates.length < 2) return toast.error('Necesitas al menos 2 candidatos válidos.');

    setLoadingCreate(true);
    const toastId = toast.loading('Contactando al Pit Wall... Creando contrato...');

    try {
      const payload = { title, description, startTime: startDate, endTime: endDate, candidates: validCandidates };
      const res = await api.post('/admin/votings/create', payload);

      toast.success('¡Votación desplegada exitosamente!', { id: toastId });
      
      setTitle('');
      setDescription('');
      setCandidates([{ name: '' }, { name: '' }]);
      setStartDate('');
      setEndDate('');
      fetchVotings(); 

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.msg || error.message;
      toast.error(`Error en Boxes: ${errorMsg}`, { id: toastId });
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ color: theme.palette.primary.main, mb: 5, fontWeight: 900, borderLeft: '8px solid', pl: 3, letterSpacing: '2px' }}>
        GESTION DE VOTACIONES
      </Typography>

      <Paper 
        sx={{ 
          p: 5, 
          mb: 5, 
          bgcolor: '#1E1E1E', 
          border: '1px solid #FF280040', 
          boxShadow: '0 0 20px rgba(255, 40, 0, 0.2)', 
          borderRadius: 2
        }}
      >
        <Typography variant="h5" sx={{ color: theme.palette.secondary.main, mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <RocketLaunchIcon sx={{ mr: 1 }} /> CREAR NUEVA VOTACIÓN
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <TextField label="Título de la Elección" fullWidth required variant="outlined" 
                sx={{ 
                  bgcolor: '#282828', 
                  '.MuiInputBase-root': { color: 'white' }
                }}
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Descripción (Opcional)" fullWidth multiline rows={2} variant="outlined" 
                 sx={{ 
                  bgcolor: '#282828', 
                  '.MuiInputBase-root': { color: 'white' }
                }}
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Inicio de Votación" type="datetime-local" fullWidth required variant="outlined" 
                InputLabelProps={{ shrink: true }} 
                sx={{ 
                  bgcolor: '#282828', 
                  '.MuiInputBase-root': { color: 'white' }
                }}
                value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Fin de Votación" type="datetime-local" fullWidth required variant="outlined" 
                InputLabelProps={{ shrink: true }} 
                sx={{ 
                  bgcolor: '#282828', 
                  '.MuiInputBase-root': { color: 'white' }
                }}
                value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'white', borderBottom: '1px dashed #FF2800', pb: 1 }}>
                <PlaylistAddCheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> CONFIGURACIÓN DE CANDIDATOS
              </Typography>
              <Stack spacing={2}>
                {candidates.map((candidate, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField 
                      label={`Candidato ${index + 1}`} 
                      fullWidth 
                      required 
                      variant="outlined" 
                      value={candidate.name} 
                      onChange={(e) => handleCandidateChange(index, e.target.value)} 
                      sx={{ bgcolor: '#282828' }}
                    />
                    {candidates.length > 2 && (
                      <IconButton onClick={() => removeCandidate(index)} color="error" size="large">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Stack>
              <Button startIcon={<AddCircleIcon />} onClick={addCandidate} color="secondary" sx={{ mt: 2, fontWeight: 700 }}>
                Añadir Candidato
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2, background: 'rgba(255,40,0,0.1)', color: 'white', border: '1px solid #FF2800' }}>
                <Typography variant="body2">
                  <Box component="span" fontWeight="bold">Alerta de Despliegue:</Box> El Backend desplegará un **Contrato Inteligente en Sepolia** y pagará el gas automáticamente.
                </Typography>
              </Alert>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                size="large" 
                disabled={loadingCreate} 
                startIcon={loadingCreate ? <CircularProgress size={24} color="inherit" /> : <RocketLaunchIcon />} 
                sx={{ 
                  py: 2, 
                  fontSize: '1.2rem', 
                  fontWeight: 900, 
                  letterSpacing: '1px',
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: '#E02000', 
                    boxShadow: '0 0 15px rgba(255, 40, 0, 0.7)'
                  }
                }}
              >
                {loadingCreate ? 'DESPLEGANDO CONTRATO... EN PISTA' : 'LANZAR VOTACIÓN (DEPLOY CONTRACT)'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Divider sx={{ my: 6, borderColor: 'rgba(255,40,0,0.5)' }} />
      <Box>
        <Typography variant="h5" sx={{ color: theme.palette.secondary.main, mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ mr: 1 }} /> GESTIONAR VOTACIONES EXISTENTES
        </Typography>
        
        {loadingVotings ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress color="primary" /></Box>
        ) : (
          <Stack spacing={2}>
            {votings.length === 0 && (
              <Alert severity="info" sx={{ bgcolor: '#282828', border: '1px dashed #555' }}>
                No has creado ninguna votación todavía. ¡Lanza la primera!
              </Alert>
            )}
            
            {votings.map((voting) => (
              <Accordion 
                key={voting.id} 
                expanded={selectedVoting === voting.id}
                onChange={() => setSelectedVoting(selectedVoting === voting.id ? null : voting.id)}
                sx={{ 
                  bgcolor: '#1E1E1E', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': { borderColor: theme.palette.primary.main }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon color="primary" />}
                  sx={{ 
                    bgcolor: '#242424', 
                    borderBottom: selectedVoting === voting.id ? `2px solid ${theme.palette.primary.main}` : 'none' 
                  }}
                >
                  <Typography sx={{ flexShrink: 0, fontWeight: 700, color: theme.palette.primary.light }}>
                    {voting.title}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', ml: 2 }}>
                    Contrato: {voting.contract_address.substring(0, 6)}...
                  </Typography>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Descripción: {voting.description || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Inicio: {new Date(voting.start_time).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fin: {new Date(voting.end_time).toLocaleString()}
                  </Typography>
                  
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,40,0,0.2)' }} />
          
                  <VoterManager voting={voting} /> 
                  <VotingMonitor voting={voting} /> 

                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </Box>
    </Container>
  );
}