const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("Conectado a la base de datos Neon en la nube.");
module.exports = {
  query: (text, params) => pool.query(text, params),
};