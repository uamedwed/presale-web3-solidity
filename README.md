# Presale Contract

## Description
The `Presale` contract is a Solidity smart contract designed for managing a presale event, particularly suitable for new project launches or token sales. Built on Ethereum, it incorporates features from OpenZeppelin's contracts library, ensuring robust security and functionality.

## Table of Contents

- [Features](#features)
- [Key Functions](#key-functions)
- [Setup and Deployment](#setup-and-deployment)
- [Security](#security)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Development Team](#development-team)
- [Acknowledgements](#acknowledgements)
- [Warning](#warning)

## Features
- **Pausable**: Integrates the `Pausable` functionality, allowing the contract owner to pause and resume the contract operations.
- **Two-Step Ownership Transfer**: Utilizes OpenZeppelin's `Ownable2Step` for secure ownership management with a two-step transfer process.
- **Reentrancy Protection**: Includes `ReentrancyGuard` to prevent against reentrancy attacks during external calls.
- **Registration Management**: Handles user registrations for the presale, tracking each participant's details including payment.
- **Presale Time Frame**: Enforces a start and end date for the presale period.
- **Registration Limits**: Allows setting a maximum number of registrations.
- **Registration Fee**: Supports the collection of fees for registration in the presale.
- 
## Key Functions
### Registration
- `register()`: Allows users to register for the presale by paying a registration fee, provided the presale is active and registration limits are not exceeded.

### Admin Controls
- `setSettings(...)`: Enables the contract owner to update presale settings including dates, maximum registrations, and registration fee.
- `withdrawFunds(...)`: Allows the owner to withdraw collected funds from the contract.

### Utilities
- `getSettings()`: Returns the current settings of the presale.
- `checkRegistration(...)`: Checks the registration details of a given user address.

### Events
- `Registered`: Emitted when a user successfully registers for the presale.
- `ChangedSettings`: Emitted when the presale settings are updated.
- `Withdrawal`: Emitted upon a successful withdrawal of funds by the owner.

## Setup and Deployment
The contract is constructed with initial settings for the presale period, maximum registrations, and the registration fee. It can be deployed using standard Solidity deployment frameworks like Hardhat or Truffle.

## Security
This contract is built with security as a priority, leveraging OpenZeppelin's trusted libraries and practices, including Pausable, Ownable2Step, and ReentrancyGuard.

## Project Structure
The project has the following structure:

```plaintext
.
├── contracts/            # Source solidity files for the application
├── scripts/              # Script functions and utilities
├── test/                 # Test files and test suites
├── .husky/               # Configuration for Git hooks using Husky
│   └── pre-commit        # Pre-commit hook script
├── .env.example          # Example .env file with required variables
├── .eslintrc.json        # Configuration for ESLint code linter
├── .gitignore            # List of files and directories to ignore in Git
├── .lintstagedrc.json    # Configuration for lint-staged
├── .prettierrc           # Configuration for Prettier code formatter
├── .solhint.json         # Configuration for solhint
├── .versionrc            # Configuration for version bumping
├── hardhat.config.ts     # Configuration for hardhat
├── package.json          # Package configuration and dependencies
├── README.md             # Detailed information about the project
└── tsconfig.json         # Configuration for TypeScript compiler
```

## Installation

### Clone the Repository
Clone the repository using the following command:
```bash
git clone https://github.com/uamedwed/presale-web3-solidity.git
```

### Navigate to the Project Directory
Navigate to the project directory using the following command:
```bash
cd presale-web3-solidity
```

### Install Dependencies
Install the project dependencies using the following command:
```bash
npm install
```

### Environment Variables
Create a .env.development file in the root of your project and add the required environment variables as shown below:
```plaintext
# Mnemonic phrase for your blockchain account. Ensure this remains private.
MNEMONIC="example example example"

# API key for Infura, a blockchain infrastructure provider
INFURA_API_KEY=your_infura_api_key_here

# API key for Etherscan, a blockchain explorer
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# API key for CoinMarketCap, a crypto market cap website
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Whether to report gas usage or not (e.g., true or false)
REPORT_GAS=

# Add more environment variables as needed for your application
```

### Running in Development Mode
To run the application in development mode, set the environment variables and execute the following command:
```bash
npm run dev
```

### Running a Local Hardhat Node
To spin up a local Ethereum network for development purposes, execute the following command:
```bash
npm run hardhat:node
```

### Compiling Smart Contracts
To compile your smart contracts using Hardhat, execute the command below:
```bash
npm run hardhat:compile
```
If you encounter any caching issues or want to force a fresh compile, you can use the following command:
```bash
npm run hardhat:compile:force
```

### Testing Smart Contracts
To test your smart contracts using Hardhat's built-in testing framework, execute the command below:
```bash
npm run hardhat:test
```
This command will run all the tests you've defined for your smart contracts to ensure their correctness and desired behavior.

### Testing Smart Contracts with Gas Reporting
To test your smart contracts and enable gas usage reporting, use the command:
```bash
npm run hardhat:test:gas
```
This command sets the REPORT_GAS environment variable to true and then runs the tests, allowing you to monitor the gas consumption of your contract functions.

### Deploying Smart Contracts to Localhost
If you wish to deploy your smart contracts to the local Hardhat Ethereum network, execute:
```bash
npm run hardhat:deploy:localhost
```
This command uses the scripts/deploy.ts script to handle deployment to the localhost network.

### Verifying Smart Contracts on Sepolia Network
To verify your deployed smart contracts on the Sepolia test network, you'll need to provide the contract's address as an argument. Use the command:
```bash
npm run hardhat:verify:sepolia <address>
```
Replace <address> with the actual contract address you want to verify.

### Release
```bash
npm run release
```

## Contributing
If you'd like to contribute to this project, please follow the guidelines in [CONTRIBUTING.md](https://github.com/uamedwed/presale-web3-solidity/blob/main/CONTRIBUTING.md)

## License
This project is licensed under the MIT License.

## Development Team
- Mykhailo Kudriashev - uamedwed.me

## Acknowledgements
Special thanks to the following projects and libraries:
- Ethereum
- Solidity
- Hardhat
- TypeScript

## Warning
Note: This contract is a test version and is not intended for production use. Its use is at the user's own risk. The author is not responsible for any consequences associated with its use, including but not limited to financial losses or security breaches. It is recommended to conduct comprehensive testing and, if possible, involve third-party auditors before any use in real-world conditions.