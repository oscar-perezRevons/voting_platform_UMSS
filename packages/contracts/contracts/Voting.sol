// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importamos Ownable para la seguridad de admin
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting (El Contrato "Hijo")
 * @dev Representa una única elección.
 * Es desplegado por la VotingFactory.
 */
contract Voting is Ownable {

    // --- Estructuras y Variables de Estado ---

    struct Option {
        uint id;
        string name;
        uint voteCount;
    }

    Option[] public options;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public isAuthorized;

    // ¡NUEVO! Variables de tiempo
    uint256 public startTime;
    uint256 public endTime;
    bool public votingActive; // Para control manual (iniciar/detener)

    /**
     * @dev El constructor ahora es llamado por la "Fábrica".
     * @param _optionNames Los nombres de los candidatos.
     * @param _startTime El tiempo (Unix timestamp) de inicio.
     * @param _endTime El tiempo (Unix timestamp) de fin.
     * @param _admin La dirección de la billetera del admin que está creando esta votación.
     */
    constructor(
        string[] memory _optionNames,
        uint256 _startTime,
        uint256 _endTime,
        address _admin
    ) Ownable(_admin) { // Asigna al admin (no a la fábrica) como el dueño
        
        for (uint i = 0; i < _optionNames.length; i++) {
            options.push(Option({
                id: i,
                name: _optionNames[i],
                voteCount: 0
            }));
        }
        
        // ¡NUEVO! Almacenamos los tiempos
        require(_startTime < _endTime, "El inicio debe ser antes que el fin");
        require(block.timestamp < _startTime, "El inicio debe ser en el futuro");
        
        startTime = _startTime;
        endTime = _endTime;
        votingActive = true; // La votación está activa por defecto
    }

    // --- Funciones de Administrador (Solo el Dueño) ---

    /**
     * @dev Autoriza a una lista de direcciones a votar.
     * (Sin cambios)
     */
    function authorizeVoters(address[] memory _voters) public onlyOwner {
        for (uint i = 0; i < _voters.length; i++) {
            isAuthorized[_voters[i]] = true;
        }
    }

    /**
     * @dev Finaliza la votación manualmente (ignora el endTime).
     */
    function stopVoting() public onlyOwner {
        votingActive = false;
    }

    /**
     * @dev Reinicia la votación (si se finalizó manualmente).
     */
    function startVoting() public onlyOwner {
        votingActive = true;
    }

    // --- Funciones Públicas (Para Votantes) ---

    /**
     * @dev Emite un voto.
     * (Actualizado con verificaciones de tiempo).
     */
    function vote(uint _optionId) public {
        // 1. Verificar que la votación esté activa (control manual)
        require(votingActive, "La votacion ha sido finalizada por el admin");

        // ¡NUEVO! 2. Verificar que la votación esté dentro del período de tiempo
        require(block.timestamp >= startTime, "La votacion aun no ha comenzado");
        require(block.timestamp < endTime, "La votacion ya ha finalizado");

        // 3. Verificar que el votante esté autorizado
        require(isAuthorized[msg.sender], "No estas autorizado para votar");

        // 4. Verificar que el votante no haya votado antes
        require(!hasVoted[msg.sender], "Ya has votado");

        // 5. Verificar que la opción sea válida
        require(_optionId < options.length, "Opcion invalida");

        // Si todo está bien:
        hasVoted[msg.sender] = true;
        options[_optionId].voteCount++;
    }

    // --- Funciones de Vista (Sin cambios) ---

    function getResults() public view returns (Option[] memory) {
        return options;
    }
}