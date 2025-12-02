// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importamos el contrato "Hijo" para poder crearlo
import "./Voting.sol";

/**
 * @title VotingFactory (El Contrato "Maestro")
 * @dev Este es el único contrato que desplegamos manualmente.
 * Su propósito es crear y rastrear nuevos contratos de Votación.
 */
contract VotingFactory {

    // Un array para almacenar las direcciones de todas las votaciones creadas
    address[] public deployedVotings;

    // Un evento que se emite cada vez que se crea una nueva votación
    event VotingCreated(
        address indexed votingAddress, 
        address indexed admin, 
        uint256 startTime, 
        uint256 endTime
    );

    /**
     * @dev Crea y despliega un nuevo contrato Voting.
     * Esta función será llamada por nuestro Backend.
     */
    function createVoting(
        string[] memory _optionNames,
        uint256 _startTime,
        uint256 _endTime
    ) public {
        // Crea una nueva instancia del contrato Voting
        // 'msg.sender' (el backend/admin) se pasa como el dueño
        Voting newVoting = new Voting(
            _optionNames,
            _startTime,
            _endTime,
            msg.sender // El que llama a esta función se vuelve el admin del nuevo contrato
        );

        // Almacena la dirección del contrato recién creado
        deployedVotings.push(address(newVoting));

        // Emite un evento para que el backend pueda escucharlo
        emit VotingCreated(
            address(newVoting),
            msg.sender,
            _startTime,
            _endTime
        );
    }

    /**
     * @dev Devuelve la lista de todas las votaciones creadas.
     */
    function getDeployedVotings() public view returns (address[] memory) {
        return deployedVotings;
    }
}