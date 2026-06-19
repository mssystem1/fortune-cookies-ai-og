import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

dotenvConfig({ path: ".env" });

function normalizePrivateKey(value?: string): string[] {
  const raw = (value || "").trim();

  if (!raw) return [];

  const key = raw.startsWith("0x") ? raw : `0x${raw}`;

  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error(
      "Invalid PRIVATE_KEY in .env. It must be 64 hex chars, with or without 0x."
    );
  }

  return [key];
}

const OG_MAINNET_RPC_URL =
  process.env.OG_MAINNET_RPC_URL || "https://evmrpc.0g.ai";

const X_LAYER_MAINNET_RPC_URL =
  process.env.X_LAYER_MAINNET_RPC_URL || "https://rpc.xlayer.tech";

const ARBITRUM_MAINNET_RPC_URL =
  process.env.ARBITRUM_MAINNET_RPC_URL || "https://arb1.arbitrum.io/rpc";

export default defineConfig({
  plugins: [hardhatEthers, hardhatVerify],

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
              yul: true
            }
          },
          evmVersion: "cancun"
        }
      }
    }
  },

  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1"
    },

    ogMainnet: {
      type: "http",
      chainType: "l1",
      url: OG_MAINNET_RPC_URL,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY)
    },

    xLayerMainnet: {
      type: "http",
      chainType: "l1",
      url: X_LAYER_MAINNET_RPC_URL,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },

    arbitrumOne: {
      type: "http",
      chainType: "generic",
      chainId: 42161,
      url: ARBITRUM_MAINNET_RPC_URL,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
  },

  verify: {
    etherscan: {
      apiKey:
        process.env.ETHERSCAN_API_KEY ||
        process.env.ARBISCAN_API_KEY ||
        process.env.OG_CHAINSCAN_API_KEY ||
        "empty"
    }
  },

  chainDescriptors: {
    16661: {
      name: "ogMainnet",
      blockExplorers: {
        etherscan: {
          name: "0G ChainScan",
          url: "https://chainscan.0g.ai",
          apiUrl: "https://chainscan.0g.ai/api"
        }
      }
    }
  }
});
