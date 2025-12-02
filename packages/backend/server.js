require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('./services/blockchainService'); 

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// --- Importar Rutas ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const votingRoutes = require('./routes/votingRoutes'); 

// --- Usar Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/votings', votingRoutes); 


// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API del Pit Wall (F1 Voting Platform) corriendo.');
});

// Iniciar el servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});