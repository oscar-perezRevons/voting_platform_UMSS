// Importamos 'hre' (Hardhat Runtime Environment)
const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts(); // Obtiene la cuenta 'deployer' del hardhat.config.js
    const chainId = network.config.chainId;

    log("----------------------------------------------------");
    log("Desplegando VotingFactory y esperando confirmaciones...");

    const votingFactory = await deploy("VotingFactory", {
        from: deployer,
        args: [], // El constructor de VotingFactory no tiene argumentos
        log: true, // Muestra la dirección del contrato y el costo del gas
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    log(`VotingFactory desplegado en: ${votingFactory.address}`);

    // Verificación automática en Etherscan (si no es una red local)
    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log("Verificando contrato en Etherscan...");
        await hre.run("verify:verify", {
            address: votingFactory.address,
            constructorArguments: [], // Sin argumentos
        });
    }

    log("----------------------------------------------------");
};

module.exports.tags = ["all", "factory"];