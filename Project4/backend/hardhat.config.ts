import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: process.env.RPC_URL_INFURA,
      accounts: [process.env.PK!],
      chainId: 11155111,
    },
  },
  sourcify: {
    enabled: true
  },
  gasReporter: {
    enabled: true, 
    currency: "ETH",  
    // gasPrice: 20,
    gasPrice: 0.5,
    outputFile: "gas-report.txt",  // Génère un rapport dans un fichier
  },
};

export default config;
