const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { email, password, wallet_address } = req.body;

  if (!email || !password || !wallet_address) {
    return res.status(400).json({ msg: 'Por favor, ingrese todos los campos' });
  }

  try {
    // 1. Revisar si el email o billetera ya existen
    let userQuery = await db.query("SELECT * FROM Users WHERE email = $1 OR wallet_address = $2", [email, wallet_address]);
    if (userQuery.rows.length > 0) {
      return res.status(400).json({ msg: 'El email o la billetera ya están registrados' });
    }

    // 2. Determinar si este será el admin (si es el primer usuario)
    const countQuery = await db.query("SELECT COUNT(*) as userCount FROM Users");
    const isAdmin = countQuery.rows[0].usercount === '0'; // (Será '0' si es el primero)

    // 3. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Guardar en la base de datos Neon
    const newUserQuery = `
      INSERT INTO Users (email, hashed_password, wallet_address, is_admin) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, email, wallet_address, is_admin
    `;
    const newUser = await db.query(newUserQuery, [email, hashedPassword, wallet_address, isAdmin]);

    res.status(201).json({
      msg: `Usuario registrado exitosamente. ${isAdmin ? '¡Eres el Administrador!' : ''}`,
      user: newUser.rows[0],
    });

  } catch (error) {
    console.error("Error en /register:", error.message);
    res.status(500).json({ msg: 'Error del servidor al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario por email
    const userQuery = await db.query("SELECT * FROM Users WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const user = userQuery.rows[0];

    // 2. Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // 3. Crear y firmar el Token (JWT)
    // ¡Importante! Incluimos 'is_admin' en el token.
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
        is_admin: user.is_admin, // ¡Clave para el adminMiddleware!
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5h' }, // El token expira en 5 horas
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );

  } catch (error) {
    console.error("Error en /login:", error.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
});

module.exports = router;