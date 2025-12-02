require('dotenv').config();
const { ethers } = require('ethers');

// Importamos los "planos" (ABIs) de los contratos que copiamos
const FactoryABI = require('../abis/VotingFactory.json').abi;
const VotingABI = require('../abis/Voting.json').abi;

// 1. Configuración del Proveedor (Alchemy)
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// 2. Configuración del Administrador (Tu billetera)
// Esta es la billetera que pagará el gas para crear nuevas votaciones
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

// 3. Conexión al Contrato "Fábrica" (El que ya desplegamos)
const factoryContract = new ethers.Contract(
  process.env.VOTING_FACTORY_ADDRESS,
  FactoryABI,
  adminWallet // Lo conectamos al admin, para que pueda firmar transacciones
);

console.log(`Servicio de Blockchain conectado a VotingFactory en: ${factoryContract.address}`);

/**
 * Función de utilidad para obtener una instancia de un contrato "Hijo" (Voting.sol)
 * en una dirección específica.
 * * @param {string} contractAddress La dirección del contrato Voting.sol
 * @returns {ethers.Contract} Una instancia del contrato conectada al adminWallet
 */
function getVotingContract(contractAddress) {
  return new ethers.Contract(
    contractAddress,
    VotingABI,
    adminWallet // Lo conectamos al admin para autorizar votantes, etc.
  );
}

// Exportamos la fábrica y la función de utilidad
module.exports = {
  provider,
  adminWallet,
  factoryContract,
  getVotingContract,
};