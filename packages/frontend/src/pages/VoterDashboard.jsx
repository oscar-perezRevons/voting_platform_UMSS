import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Paper, Grid, Button, 
  Card, CardContent, CardActions, Chip, Box, CircularProgress, 
  useTheme 
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { toast } from 'react-hot-toast';

export default function VoterDashboard() {
  const { api, user } = useAuth();
  const [votings, setVotings] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchMyVotings = async () => {
      try {
        const res = await api.get('/votings/my-votings');
        setVotings(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar tus invitaciones de carrera.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyVotings();
    }
  }, [user, api]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ borderLeft: `8px solid ${theme.palette.primary.main}`, pl: 3, mb: 5 }}>
        <Typography variant="h3" sx={{ color: theme.palette.primary.main, fontWeight: 900, letterSpacing: '2px' }}>
          VOTACIONES DISPONIBLES
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenido, <Box component="span" sx={{ fontWeight: 700 }}>{user?.email}</Box>. Estas son las votaciones en las que estás autorizado a participar.
        </Typography>
      </Box>

      {votings.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed #555', bgcolor: '#1E1E1E' }}>
          <SportsScoreIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary">
            No tienes invitaciones activas.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Espera a que el Administrador te incluya en una lista de votantes.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {votings.map((voting) => (
            <Grid item xs={12} md={6} key={voting.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: '#1E1E1E', 
                  border: '1px solid #333',
                  transition: 'all 0.3s',
                  borderRadius: 2,
                  '&:hover': { 
                    transform: 'translateY(-6px)', 
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 10px 20px rgba(255, 40, 0, 0.3)` 
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, borderBottom: '1px solid #333' }}>
                  <Typography variant="h5" component="div" gutterBottom sx={{ fontFamily: '"Exo 2", sans-serif', fontWeight: 800, color: theme.palette.primary.light }}>
                    {voting.title}
                  </Typography>
                  
                  <Chip 
                    icon={<AccessTimeIcon />} 
                    label={`Cierre: ${new Date(voting.end_time).toLocaleDateString()} a las ${new Date(voting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                    sx={{ mb: 2, color: theme.palette.secondary.light }}
                  />
                  
                  <Typography variant="body2" color="text.secondary">
                    {voting.description || "Sin descripción adicional. ¡Entra a la pista para votar!"}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0, bgcolor: '#242424' }}>
                  <Button 
                    component={Link} 
                    to={`/voting/${voting.id}`} 
                    size="large" 
                    variant="contained" 
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                    sx={{ fontWeight: 700, py: 1.5 }}
                  >
                    Entrar a la Votacion y Vota!
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}