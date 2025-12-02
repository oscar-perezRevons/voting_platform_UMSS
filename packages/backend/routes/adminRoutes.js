const express = require('express');
const router = express.Router();
const db = require('../db'); // Conexión a Neon
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { factoryContract, getVotingContract } = require('../services/blockchainService');
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @route   POST /api/admin/votings/create
 * @desc    Crear una nueva elección (Contrato + Base de Datos)
 * @access  Admin
 */
router.post('/votings/create', async (req, res) => {
  const { title, description, candidates, startTime, endTime } = req.body;
  const adminId = req.user.id; // Obtenido del token JWT

  // 1. Validación de entrada
  if (!title || !candidates || candidates.length === 0 || !startTime || !endTime) {
    return res.status(400).json({ msg: 'Por favor, complete todos los campos requeridos.' });
  }

  try {
    // 2. Convertir fechas a Timestamps de Unix (segundos) para Solidity
    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    // 3. (Blockchain) Llamar a la Fábrica para desplegar un nuevo contrato Voting.sol
    console.log(`[Admin] Creando contrato en la blockchain para: ${title}`);
    const tx = await factoryContract.createVoting(
      candidates.map(c => c.name), // Pasamos solo un array de nombres
      startTimestamp,
      endTimestamp
    );
    
    // 4. (Blockchain) Esperar la confirmación y obtener la dirección del nuevo contrato
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'VotingCreated');
    if (!event) {
      throw new Error("No se pudo encontrar el evento VotingCreated en la transacción.");
    }
    const newContractAddress = event.args.votingAddress;
    console.log(`[Admin] Contrato creado exitosamente en: ${newContractAddress}`);

    // 5. (Base de Datos) Guardar la nueva votación en la tabla "Votings" de Neon
    const votingQuery = `
      INSERT INTO Votings (title, description, admin_id, start_time, end_time, contract_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title;
    `;
    const newVoting = await db.query(votingQuery, [
      title, description, adminId, startTime, endTime, newContractAddress
    ]);
    const newVotingId = newVoting.rows[0].id;

    // 6. (Base de Datos) Guardar los candidatos en la tabla "Candidates" de Neon
    for (const candidate of candidates) {
      const candidateQuery = `
        INSERT INTO Candidates (voting_id, name) VALUES ($1, $2);
      `;
      await db.query(candidateQuery, [newVotingId, candidate.name]);
    }

    res.status(201).json(newVoting.rows[0]);

  } catch (error) {
    console.error("[Error en /admin/votings/create]:", error.message);
    res.status(500).json({ msg: 'Error del servidor al crear la votación.', error: error.message });
  }
});


/**
 * @route   POST /api/admin/votings/:id/whitelist
 * @desc    Añadir un array de emails a la lista blanca de una votación (solo en la BD)
 * @access  Admin
 */
router.post('/votings/:id/whitelist', async (req, res) => {
  const { id: votingId } = req.params;
  const { voterEmails } = req.body; // Espera un array: ["email1@test.com", "email2@test.com"]

  if (!voterEmails || voterEmails.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron emails de votantes.' });
  }

  try {
    // 1. Encontrar los IDs de usuario que coincidan con los emails
    const usersQuery = "SELECT id, email FROM Users WHERE email = ANY($1::text[])";
    const { rows: users } = await db.query(usersQuery, [voterEmails]);

    if (users.length === 0) {
      return res.status(404).json({ msg: 'Ninguno de los emails proporcionados se encontró en la base de datos de usuarios.' });
    }

    // 2. Crear los valores para una inserción masiva
    // (voting_id, user_id), (voting_id, user_id), ...
    const values = users.map(user => `(${votingId}, ${user.id})`).join(',');

    // 3. Insertar en "AllowedVoters", ignorando duplicados
    const insertQuery = `
      INSERT INTO AllowedVoters (voting_id, user_id)
      VALUES ${values}
      ON CONFLICT (voting_id, user_id) DO NOTHING
      RETURNING user_id;
    `;
    const { rows: inserted } = await db.query(insertQuery);

    res.status(201).json({
      msg: `Se añadieron ${inserted.length} de ${users.length} votantes encontrados a la lista blanca de la base de datos.`,
      added_user_ids: inserted.map(r => r.user_id)
    });

  } catch (error) {
    console.error("[Error en /admin/votings/:id/whitelist]:", error.message);
    res.status(500).json({ msg: 'Error del servidor al actualizar la lista blanca.', error: error.message });
  }
});


/**
 * @route   POST /api/admin/votings/:id/authorize-on-chain
 * @desc    Pushear la lista blanca de la BD a la Blockchain
 * @access  Admin
 */
router.post('/votings/:id/authorize-on-chain', async (req, res) => {
  const { id: votingId } = req.params;

  try {
    // 1. (Base de Datos) Obtener la dirección del contrato de esta votación
    const votingQuery = "SELECT contract_address FROM Votings WHERE id = $1";
    const votingResult = await db.query(votingQuery, [votingId]);
    if (votingResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Votación no encontrada.' });
    }
    const contractAddress = votingResult.rows[0].contract_address;

    // 2. (Base de Datos) Obtener todas las *direcciones de billetera* de la lista blanca
    const whitelistQuery = `
      SELECT u.wallet_address FROM Users u
      JOIN AllowedVoters av ON u.id = av.user_id
      WHERE av.voting_id = $1;
    `;
    const { rows: voters } = await db.query(whitelistQuery, [votingId]);
    
    if (voters.length === 0) {
      return res.status(400).json({ msg: 'No hay votantes en la lista blanca de la base de datos para enviar a la blockchain.' });
    }

    const walletAddresses = voters.map(v => v.wallet_address);

    // 3. (Blockchain) Conectarse al contrato "Hijo" (Voting.sol)
    const votingContract = getVotingContract(contractAddress);

    // 4. (Blockchain) Enviar la transacción 'authorizeVoters'
    console.log(`[Admin] Autorizando ${walletAddresses.length} votantes en el contrato ${contractAddress}...`);
    const tx = await votingContract.authorizeVoters(walletAddresses);
    await tx.wait(); // Esperar la confirmación

    res.json({
      msg: `¡Éxito! ${walletAddresses.length} votantes han sido autorizados en la blockchain.`,
      hash: tx.hash
    });

  } catch (error) {
    console.error("[Error en /admin/votings/:id/authorize-on-chain]:", error.message);
    res.status(500).json({ msg: 'Error del servidor al autorizar en la blockchain.', error: error.message });
  }
});

/**
 * @route   GET /api/admin/my-created-votings
 * @desc    Obtener todas las votaciones creadas por este admin
 * @access  Admin
 */
router.get('/my-created-votings', async (req, res) => {
  const adminId = req.user.id; // Obtenido del token

  try {
    // Obtenemos todas las votaciones de Neon que pertenecen a este admin
    const query = `
      SELECT id, title, description, start_time, end_time, contract_address 
      FROM Votings 
      WHERE admin_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [adminId]);

    res.json(rows);

  } catch (error) {
    console.error("[Error en /admin/my-created-votings]:", error.message);
    res.status(500).json({ msg: 'Error del servidor al obtener votaciones.' });
  }
});
module.exports = router;