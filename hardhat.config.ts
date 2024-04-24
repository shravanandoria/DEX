import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config()

const config: HardhatUserConfig = {
  solidity: "0.8.25",
  networks: {
    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: [`0x${process.env.SECRET_KEY}`],
      chainId: 11155111,
    }
  }
};

export default config;
