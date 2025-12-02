# voting_platform_UMSS
# 🚀 Plataforma de Votación Descentralizada (Voting Platform)

Este proyecto es un sistema de votación moderno que combina una aplicación web robusta con la seguridad y la inmutabilidad de la tecnología **Blockchain**. Utiliza una arquitectura distribuida (Monorepo) con tres componentes principales: Frontend (React), Backend (Node.js) y Contratos Inteligentes (Solidity/Hardhat).

## 💡 Arquitectura del Proyecto

El proyecto se estructura como un **Monorepo** que contiene tres *packages* principales, diseñados para garantizar la trazabilidad y la seguridad del proceso electoral:

| Package | Función Principal | Tecnologías Clave |
| :--- | :--- | :--- |
| `frontend` | Interfaz de Usuario (IU) y Cliente Web3 | **React**, **Vite**, **wagmi**, **Material UI (MUI)** |
| `backend` | API REST, Autenticación y Despliegue de Contratos | **Node.js/Express**, **PostgreSQL (pg)**, **Ethers.js**, **JWT** |
| `contracts` | Lógica de Votación On-Chain | **Solidity**, **Hardhat**, **OpenZeppelin** |

---

## ⚙️ Stack Tecnológico Detallado

### Frontend (`packages/frontend`)
Desarrollado con **React** y **Vite** para una experiencia rápida y moderna. Maneja la conexión directa con la Blockchain vía `wagmi`.

| Dependencia | Propósito |
| :--- | :--- |
| `react`, `react-router-dom` | Core de la interfaz de usuario. |
| `wagmi`, `@tanstack/react-query` | Conexión con *wallets* (MetaMask), manejo de estado de la Blockchain y caché de datos. |
| `@mui/material`, `@emotion/react` | Framework de componentes para un diseño profesional y responsive (Material Design). |
| `axios`, `jwt-decode` | Comunicación con el Backend y manejo de tokens de autenticación. |

### Backend (`packages/backend`)
Servidor API construido con **Node.js/Express**, actuando como *gateway* entre la base de datos y la blockchain.

| Dependencia | Propósito |
| :--- | :--- |
| `express`, `cors` | Servidor web y manejo de peticiones API. |
| `pg` | Conexión con la base de datos **PostgreSQL** (para Neon u otro servicio). |
| `ethers` | Interacción *programática* con los Contratos Inteligentes (despliegue, llamadas y transacciones). |
| `jsonwebtoken`, `bcryptjs` | Autenticación de usuarios segura y manejo de sesiones. |

### Contratos (`packages/contracts`)
Entorno de desarrollo y pruebas para los Contratos Inteligentes.

| Dependencia | Propósito |
| :--- | :--- |
| `hardhat` | Entorno de desarrollo, compilación, pruebas y despliegue para Solidity. |
| `@openzeppelin/contracts` | Librería de contratos inteligentes seguros y auditados. |
| `ethers`, `@nomiclabs/hardhat-ethers` | Utilidades para trabajar con Ethereum/EVM dentro de Hardhat. |

---

## ⛓️ Funcionamiento con Blockchain

1.  **Despliegue:** El Backend despliega un **Contrato Inteligente** en la red de pruebas **Sepolia** por cada elección creada por el administrador.
2.  **Autorización (Whitelist):** El Contrato es responsable de almacenar la **Lista Blanca** de direcciones de *wallet* autorizadas, garantizando que solo los votantes elegibles puedan emitir una transacción de voto.
3.  **Inmutabilidad:** Cada voto es una **transacción** irreversible y transparente registrada en Sepolia, eliminando la posibilidad de fraude o manipulación del escrutinio.

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

* Node.js (v18+)
* npm (o yarn/pnpm)
* Una instancia de **PostgreSQL** (para la DB de metadatos y usuarios).
* Una clave RPC de **Sepolia** (ej. Infura o Alchemy).
* **MetaMask** instalado en su navegador.

### Pasos de Configuración

1.  **Clonar el Repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd voting-platform
    ```

2.  **Instalar Dependencias Globales:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en el directorio principal y en `packages/backend/`.
    Ejemplo de variables necesarias:
    ```env
    # Variables de Base de Datos
    DATABASE_URL=postgres://user:password@host:port/dbname

    # Variables de Blockchain
    SEPOLIA_RPC_URL=[https://sepolia.infura.io/v3/TU_API_KEY](https://sepolia.infura.io/v3/TU_API_KEY)
    PRIVATE_KEY=TU_WALLET_PRIVATE_KEY_CON_GAS

    # Variables de Seguridad
    JWT_SECRET=TU_SECRETO_SEGURO
    ```

4.  **Instalar Dependencias de Packages (Opcional, si no usas `npm install` globalmente):**
    ```bash
    cd packages/backend && npm install
    cd ../frontend && npm install
    cd ../contracts && npm install
    ```

---

## ▶️ Ejecución del Proyecto

### 1. Iniciar el Backend (API & Blockchain Gateway)

Desde el directorio `packages/backend`:

```bash
npm run dev
# El servidor se iniciará en http://localhost:PORT
