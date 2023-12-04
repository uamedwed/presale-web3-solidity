# solidity-hardhat-boilerplate

## Description
Application template

## Table of Contents

- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Development Team](#development-team)
- [Acknowledgements](#acknowledgements)

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
git clone https://github.com/uamedwed/solidity-hardhat-boilerplate.git
```

### Navigate to the Project Directory
Navigate to the project directory using the following command:
```bash
cd solidity-hardhat-boilerplate
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
If you'd like to contribute to this project, please follow the guidelines in [CONTRIBUTING.md](https://github.com/uamedwed/solidity-hardhat-boilerplate/blob/main/CONTRIBUTING.md)

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