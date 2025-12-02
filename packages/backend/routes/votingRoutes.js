const express = require('express');
const router = express.Router();
const db = require('../db'); 
const { authMiddleware } = require('../middleware/authMiddleware');
router.use(authMiddleware);

/**
 * @route   GET /api/votings/my-votings
 * @desc    Obtener todas las votaciones en las que el usuario logueado está en la lista blanca
 * @access  Usuario Logueado
 */
router.get('/my-votings', async (req, res) => {
  const userId = req.user.id; // Obtenido del token

  try {
    // Consulta que une Votings y AllowedVoters para encontrar
    // solo aquellas en las que el usuario actual está permitido
    const query = `
      SELECT v.id, v.title, v.description, v.start_time, v.end_time, v.contract_address
      FROM Votings v
      JOIN AllowedVoters av ON v.id = av.voting_id
      WHERE av.user_id = $1;
    `;
    const { rows: votings } = await db.query(query, [userId]);

    res.json(votings);

  } catch (error) {
    console.error("[Error en /votings/my-votings]:", error.message);
    res.status(500).json({ msg: 'Error del servidor al obtener votaciones.' });
  }
});

/**
 * @route   GET /api/votings/:id/details
 * @desc    Obtener los detalles (candidatos) de una votación específica
 * @access  Usuario Logueado
 */
router.get('/:id/details', async (req, res) => {
  const { id: votingId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verificar que el usuario tenga permiso para ver esta votación
    const allowedQuery = "SELECT 1 FROM AllowedVoters WHERE voting_id = $1 AND user_id = $2";
    const allowedResult = await db.query(allowedQuery, [votingId, userId]);
    if (allowedResult.rows.length === 0) {
      return res.status(403).json({ msg: 'No tienes permiso para ver esta votación.' });
    }

    // 2. Obtener los detalles de la votación
    const votingQuery = "SELECT * FROM Votings WHERE id = $1";
    const votingResult = await db.query(votingQuery, [votingId]);

    // 3. Obtener los candidatos de la votación
    const candidatesQuery = "SELECT id, name FROM Candidates WHERE voting_id = $1";
    const candidatesResult = await db.query(candidatesQuery, [votingId]);

    res.json({
      voting: votingResult.rows[0],
      candidates: candidatesResult.rows
    });

  } catch (error) {
    console.error(`[Error en /votings/${votingId}/details]:`, error.message);
    res.status(500).json({ msg: 'Error del servidor al obtener detalles.' });
  }
});

module.exports = router;