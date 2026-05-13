import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

dotenvConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const OG_MAINNET_RPC_URL =
  process.env.OG_MAINNET_RPC_URL || "https://evmrpc.0g.ai";

export default defineConfig({
  plugins: [hardhatEthers],

  solidity: {
    profiles: {
      default: {
        version: "0.8.25",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              yul: true,
            },
          },
        },
      },
      production: {
        version: "0.8.25",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              yul: true,
            },
          },
        },
      },
    },
  },

  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    ogMainnet: {
      type: "http",
      chainType: "l1",
      url: OG_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
});