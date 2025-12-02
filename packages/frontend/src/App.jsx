import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm'; 
import AdminDashboard from './pages/AdminDashboard';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import VoterDashboard from './pages/VoterDashboard'; 
import VotingPage from './pages/VotingPage';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (!user.is_admin) return <div>Acceso Denegado: Solo Administrador.</div>;
  return children;
};

export default function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
        <Container>
          <Toolbar disableGutters>
            <Typography variant="h5" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 800, fontStyle: 'italic' }}>
              PLATAFORMA DE VOTACION UMSS
            </Typography>
            {user && (
              <Button color="secondary" onClick={logout}>Cerrar Sesión ({user.email})</Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Routes>
        <Route path="/" element={
          user ? (
            user.is_admin 
              ? <Navigate to="/admin" /> 
              : <VoterDashboard /> 
          ) : <AuthForm />
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/dashboard" element={user ? <VoterDashboard /> : <Navigate to="/" />} />
        <Route path="/voting/:id" element={user ? <VotingPage /> : <Navigate to="/" />} />

      </Routes>
    </>
  );
}