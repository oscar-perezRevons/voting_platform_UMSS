const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar si el usuario está logueado (tiene un token válido).
 */
function authMiddleware(req, res, next) {
  // Obtenemos el token del header 'x-auth-token'
  const token = req.header('x-auth-token');

  // Si no hay token, acceso denegado
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  try {
    // Verificamos el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Añadimos el payload del token (que incluye id, email, is_admin)
    // al objeto 'req' para que las rutas lo puedan usar
    req.user = decoded.user;
    next(); // Pasa al siguiente middleware o a la ruta
  } catch (e) {
    res.status(400).json({ msg: 'Token no es válido' });
  }
}

function adminMiddleware(req, res, next) {
  // req.user fue establecido por el authMiddleware
  if (!req.user.is_admin) {
    return res.status(403).json({ msg: 'Acceso denegado. No eres administrador.' });
  }
  next();
}

module.exports = {
  authMiddleware,
  adminMiddleware,
};