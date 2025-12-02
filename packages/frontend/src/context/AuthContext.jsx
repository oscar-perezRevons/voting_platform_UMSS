import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // URL de tu Backend
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Al cargar, verificamos si hay un token guardado
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Verificamos si el token ha expirado
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded.user); // decoded.user incluye is_admin
          api.defaults.headers.common['x-auth-token'] = token;
        }
      } catch (error) {
        logout();
      }
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const newToken = res.data.token;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      const decoded = jwtDecode(newToken);
      setUser(decoded.user);
      api.defaults.headers.common['x-auth-token'] = newToken; // Header global
      
      return { success: true, isAdmin: decoded.user.is_admin };
    } catch (error) {
      console.error(error);
      return { success: false, msg: error.response?.data?.msg || 'Error de conexión' };
    }
  };

  const register = async (email, password, wallet_address) => {
    try {
      const res = await api.post('/auth/register', { email, password, wallet_address });
      return { success: true, msg: res.data.msg };
    } catch (error) {
      return { success: false, msg: error.response?.data?.msg || 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
  };

  // Exportamos la instancia de 'api' para usarla en otros componentes
  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);