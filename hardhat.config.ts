import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
require('dotenv').config();

const MNEMONIC = process.env.MNEMONIC;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const REPORT_GAS = process.env.REPORT_GAS;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    enabled: REPORT_GAS,
    token: "ETH",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: {
        mnemonic: MNEMONIC,
      }
    }
  }
};

export default config;
