# FortuneCookiesAI — 0G + X Layer Deployment

Standalone Hardhat deployment project for Cookieverse `FortuneCookiesAI` smart contracts.

For Arbitrum One deployment and Arbiscan verification, see
[`ARBITRUM_DEPLOYMENT.md`](./ARBITRUM_DEPLOYMENT.md).

This repo supports:

- Existing `FortuneCookiesAI_OG` deployment on **0G Mainnet**
- New `FortuneCookiesAI_XLayer` deployment on **X Layer**
- AI fortune text NFTs
- Wallet Roast image NFTs
- Cookieverse app integration through public contract address env variables
- ABI export for frontend integration
- Optional mint price management

---

## Overview

Cookieverse uses an ERC-721 NFT contract with two minting modes:

```solidity
mintWithFortune(string fortune)
mintWithImage(string fortune, string imageURI)
```

The same core contract logic can be deployed to X Layer because X Layer is EVM-compatible. The X Layer version keeps the same ABI-facing mint/read functions, but changes branding and metadata strings from `0G Mainnet` to `X Layer`.

Recommended X Layer contract name:

```txt
FortuneCookiesAI_XLayer
```

Recommended X Layer frontend env variable:

```env
NEXT_PUBLIC_COOKIE_ADDRESS_XLAYER=0xYOUR_DEPLOYED_X_LAYER_CONTRACT
```

---

## Networks

### 0G Mainnet

```txt
Network: 0G Mainnet
Chain ID: 16661
RPC: https://evmrpc.0g.ai
Explorer: https://chainscan.0g.ai
Native token: 0G
```

### X Layer Mainnet

```txt
Network: X Layer mainnet
Chain ID: 196
RPC: https://rpc.xlayer.tech
Backup RPC: https://xlayerrpc.okx.com
Explorer: https://www.okx.com/web3/explorer/xlayer
Native token: OKB
```

### X Layer Testnet

```txt
Network: X Layer testnet
Chain ID: 1952
RPC: https://testrpc.xlayer.tech/terigon
Backup RPC: https://xlayertestrpc.okx.com/terigon
Explorer: https://www.okx.com/web3/explorer/xlayer-test
Native token: OKB
```

Official X Layer docs:

```txt
Network information:
https://web3.okx.com/xlayer/docs/developer/build-on-xlayer/network-information

Hardhat verification:
https://web3.okx.com/xlayer/docs/developer/verify-a-smart-contract/verify-with-hardhat
```

---

## Contract behavior

### Text fortune mint

```txt
mintWithFortune(fortune)
→ stores fortune text
→ tokenURI()
→ returns base64 JSON metadata
→ metadata image is generated as on-chain SVG
```

Used for normal Cookieverse AI fortune NFTs.

### Image mint

```txt
mintWithImage(fortune, imageURI)
→ stores fortune text
→ stores external imageURI
→ tokenURI()
→ returns base64 JSON metadata with imageURI
```

Used for Cookieverse Wallet Roast cards.

---

## Mint tracking

The contract stores ordered mint history for Cookieverse dashboards and holdings APIs.

```solidity
struct MintRecord {
    uint256 id;
    address wallet;
    bool isImage;
}
```

`getAllMints()` returns all mints in order.

Text mints:

```txt
isImage = false
```

Image mints:

```txt
isImage = true
```

---

## Core ABI compatibility

Keep these functions unchanged so Cookieverse can reuse the same frontend mint/read logic:

```txt
mintWithFortune
mintWithImage
mintPrice
setMintPrice
getAllMints
getFortune
getImageURI
totalMinted
totalTextMinted
totalImageMinted
nextTokenId
tokenURI
```

If the existing Cookieverse ABI already includes these functions, the frontend can reuse it. Otherwise, export and copy the new ABI from:

```txt
abi/FortuneCookiesAI_XLayer.json
```

---

## Project structure

Recommended final structure:

```txt
fortune-cookies-ai-og/
  contracts/
    FortuneCookiesAI_OG.sol
    FortuneCookiesAI_XLayer.sol

  scripts/
    check-og.ts
    deploy-og.ts
    set-mint-price-og.ts
    export-abi-og.js

    check-xlayer.ts
    deploy-xlayer.ts
    set-mint-price-xlayer.ts
    export-abi-xlayer.js

  abi/
    .gitkeep

  package.json
  hardhat.config.ts
  tsconfig.json
  .env.example
  .gitignore
  README.md
```

---

# X Layer update guide

## 1. Create the X Layer contract

Copy the existing 0G contract:

```bash
cp contracts/FortuneCookiesAI_OG.sol contracts/FortuneCookiesAI_XLayer.sol
```

Then update the copied file.

### Contract name

```solidity
contract FortuneCookiesAI_XLayer is ERC721, Ownable, ERC2981, ReentrancyGuard {
```

### Title comments

```solidity
/// @title FortuneCookiesAI_XLayer
/// @notice X Layer version of FortuneCookiesAI for Cookieverse.
/// @dev Keeps both mint modes and removes only logo upload/rendering.
///      Text mints generate a beautiful on-chain SVG.
///      Image mints use external imageURI, e.g. Wallet Roast PNG on IPFS.
```

### Constructor

```solidity
constructor() ERC721("Fortune Cookies AI on X Layer", "COOKIEAI") Ownable(msg.sender) {
    mintPrice = 0;
    fundsReceiver = msg.sender;
}
```

### Mint price error messages

Replace:

```solidity
require(msg.value >= mintPrice, "not enough 0G");
```

With:

```solidity
require(msg.value >= mintPrice, "not enough OKB");
```

There are two places:

```solidity
mintWithFortune()
mintWithImage()
```

### Image NFT metadata

Replace the image NFT description with:

```solidity
'","description":"Cookieverse AI fortune or Wallet Roast image NFT minted on X Layer.",',
```

Replace network trait with:

```solidity
'{"trait_type":"Network","value":"X Layer"},',
```

### Text NFT metadata

Replace the text NFT description with:

```solidity
'","description":"AI-generated fortune minted on X Layer. On-chain SVG inspired by Cookieverse glass design.",',
```

Replace network trait with:

```solidity
'{"trait_type":"Network","value":"X Layer"},',
```

### SVG subtitle

Inside `_svgBrand()`, replace:

```solidity
AI FORTUNE ON 0G
```

With:

```solidity
AI FORTUNE ON X LAYER
```

Example full line:

```solidity
"<text x='400' y='418' text-anchor='middle' fill='#F7F0FF' fill-opacity='0.9' font-family='Arial, Helvetica, sans-serif' font-size='17' font-weight='500' letter-spacing='0.12em'>AI FORTUNE ON X LAYER</text>",
```

---

## 2. Update `hardhat.config.ts`

Use this config:

```ts
import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

dotenvConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const OG_MAINNET_RPC_URL =
  process.env.OG_MAINNET_RPC_URL || "https://evmrpc.0g.ai";

const X_LAYER_MAINNET_RPC_URL =
  process.env.X_LAYER_MAINNET_RPC_URL || "https://rpc.xlayer.tech";

const X_LAYER_TESTNET_RPC_URL =
  process.env.X_LAYER_TESTNET_RPC_URL || "https://testrpc.xlayer.tech/terigon";

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

    xLayerMainnet: {
      type: "http",
      chainType: "l1",
      url: X_LAYER_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },

    xLayerTestnet: {
      type: "http",
      chainType: "l1",
      url: X_LAYER_TESTNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
});
```

---

## 3. Update `package.json`

Use these scripts:

```json
{
  "scripts": {
    "compile": "hardhat compile",
    "clean": "hardhat clean",

    "deploy:og": "hardhat run scripts/deploy-og.ts --network ogMainnet",
    "check:og": "hardhat run scripts/check-og.ts --network ogMainnet",
    "export:abi:og": "node scripts/export-abi-og.js",
    "set-price:og": "hardhat run scripts/set-mint-price-og.ts --network ogMainnet",

    "check:xlayer": "hardhat run scripts/check-xlayer.ts --network xLayerMainnet",
    "deploy:xlayer": "hardhat run scripts/deploy-xlayer.ts --network xLayerMainnet",
    "set-price:xlayer": "hardhat run scripts/set-mint-price-xlayer.ts --network xLayerMainnet",
    "export:abi:xlayer": "node scripts/export-abi-xlayer.js",

    "check:xlayer:testnet": "hardhat run scripts/check-xlayer.ts --network xLayerTestnet",
    "deploy:xlayer:testnet": "hardhat run scripts/deploy-xlayer.ts --network xLayerTestnet",
    "set-price:xlayer:testnet": "hardhat run scripts/set-mint-price-xlayer.ts --network xLayerTestnet"
  }
}
```

If you already have `dependencies`, `devDependencies`, `keywords`, and other fields, only replace or merge the `scripts` object.

---

## 4. Add `scripts/check-xlayer.ts`

```ts
import { network } from "hardhat";

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  const connection = await network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("Signer not found. Check PRIVATE_KEY in .env");
  }

  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  const blockNumber = await ethers.provider.getBlockNumber();
  const chain = await ethers.provider.getNetwork();

  console.log("Network:", connection.networkName);
  console.log("Chain ID:", chain.chainId.toString());
  console.log("Deployer:", address);
  console.log("Balance:", ethers.formatEther(balance), "OKB");
  console.log("Current block:", blockNumber);
  console.log("RPC OK");
  console.log("Signer OK");

  if (balance === 0n) {
    throw new Error("Deployer has zero OKB balance. Fund it before deploying.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 5. Add `scripts/deploy-xlayer.ts`

```ts
import { network } from "hardhat";
import fs from "node:fs";

function explorerAddressUrl(address: string) {
  return `https://www.okx.com/web3/explorer/xlayer/address/${address}`;
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  const connection = await network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("Signer not found. Check PRIVATE_KEY in .env");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const chain = await ethers.provider.getNetwork();

  console.log("Network:", connection.networkName);
  console.log("Chain ID:", chain.chainId.toString());
  console.log("Deployer:", deployerAddress);
  console.log("Balance:", ethers.formatEther(balance), "OKB");

  if (connection.networkName === "xLayerMainnet" && chain.chainId !== 196n) {
    throw new Error(`Wrong chain. Expected X Layer mainnet chainId 196, got ${chain.chainId}`);
  }

  if (connection.networkName === "xLayerTestnet" && chain.chainId !== 1952n) {
    throw new Error(`Wrong chain. Expected X Layer testnet chainId 1952, got ${chain.chainId}`);
  }

  if (balance === 0n) {
    throw new Error("Deployer has zero OKB balance. Fund it before deploying.");
  }

  console.log("Deploying FortuneCookiesAI_XLayer...");

  const contract = await ethers.deployContract("FortuneCookiesAI_XLayer");
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  const deployment = {
    network: connection.networkName,
    chainId: Number(chain.chainId),
    contract: "FortuneCookiesAI_XLayer",
    address,
    deployer: deployerAddress,
    explorer: explorerAddressUrl(address),
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("deployed-xlayer.json", JSON.stringify(deployment, null, 2));

  console.log("FortuneCookiesAI_XLayer deployed:", address);
  console.log("Explorer:", deployment.explorer);
  console.log("Saved deployment to deployed-xlayer.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 6. Add `scripts/set-mint-price-xlayer.ts`

```ts
import { network } from "hardhat";

async function main() {
  if (!process.env.X_LAYER_COOKIE_CONTRACT) {
    throw new Error("Missing X_LAYER_COOKIE_CONTRACT in .env");
  }

  const price = process.env.X_LAYER_MINT_PRICE || "0";

  const connection = await network.connect();
  const { ethers } = connection;

  const contract = await ethers.getContractAt(
    "FortuneCookiesAI_XLayer",
    process.env.X_LAYER_COOKIE_CONTRACT
  );

  const priceWei = ethers.parseEther(price);

  console.log("Network:", connection.networkName);
  console.log("Contract:", process.env.X_LAYER_COOKIE_CONTRACT);
  console.log("Setting mint price:", price, "OKB");

  const tx = await contract.setMintPrice(priceWei);

  console.log("Tx:", tx.hash);

  await tx.wait();

  console.log("Mint price updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 7. Add `scripts/export-abi-xlayer.js`

```js
import fs from "node:fs";
import path from "node:path";

const artifactPath = path.join(
  "artifacts",
  "contracts",
  "FortuneCookiesAI_XLayer.sol",
  "FortuneCookiesAI_XLayer.json"
);

if (!fs.existsSync(artifactPath)) {
  throw new Error(`Artifact not found at ${artifactPath}. Run npm run compile first.`);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

fs.mkdirSync("abi", { recursive: true });

fs.writeFileSync(
  path.join("abi", "FortuneCookiesAI_XLayer.json"),
  JSON.stringify(artifact.abi, null, 2)
);

console.log("Exported ABI to abi/FortuneCookiesAI_XLayer.json");
```

---

## 8. Add `.env.example`

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# 0G
OG_MAINNET_RPC_URL=https://evmrpc.0g.ai
OG_COOKIE_CONTRACT=0xYOUR_DEPLOYED_OG_CONTRACT
OG_MINT_PRICE=0

# X Layer mainnet
X_LAYER_MAINNET_RPC_URL=https://rpc.xlayer.tech

# X Layer testnet
X_LAYER_TESTNET_RPC_URL=https://testrpc.xlayer.tech/terigon

# After X Layer deploy
X_LAYER_COOKIE_CONTRACT=0xYOUR_DEPLOYED_X_LAYER_CONTRACT

# Optional mint price in OKB
X_LAYER_MINT_PRICE=0

# Cookieverse frontend
NEXT_PUBLIC_COOKIE_ADDRESS_XLAYER=0xYOUR_DEPLOYED_X_LAYER_CONTRACT
NEXT_PUBLIC_X_LAYER_RPC_URL=https://rpc.xlayer.tech

# Optional OKLink verification
OKLINK_API_KEY=YOUR_OKLINK_API_KEY
```

Important:

```txt
PRIVATE_KEY must be a real deployer wallet private key.
For X Layer deployments, the deployer wallet must have OKB for gas.
Do not commit .env.
```

---

# Installation

```bash
npm install
```

Recommended versions:

```txt
Node.js: 20+
npm: 10+
Hardhat: 3.x
Solidity: 0.8.25
```

---

# Compile

```bash
npm run compile
```

If you see:

```txt
Stack too deep
```

Make sure `hardhat.config.ts` includes:

```ts
viaIR: true
```

inside Solidity compiler settings.

---

# Check RPC and deployer

## 0G

```bash
npm run check:og
```

Expected output:

```txt
Network: ogMainnet
Current block: ...
Deployer: 0x...
Balance: ... 0G
RPC OK
Signer OK
```

## X Layer mainnet

```bash
npm run check:xlayer
```

Expected output:

```txt
Network: xLayerMainnet
Chain ID: 196
Deployer: 0x...
Balance: ... OKB
Current block: ...
RPC OK
Signer OK
```

## X Layer testnet

```bash
npm run check:xlayer:testnet
```

Expected output:

```txt
Network: xLayerTestnet
Chain ID: 1952
Deployer: 0x...
Balance: ... OKB
Current block: ...
RPC OK
Signer OK
```

---

# Deploy

## Deploy to 0G Mainnet

```bash
npm run deploy:og
```

Expected output:

```txt
Network: ogMainnet
Deployer: 0x...
Balance: ... 0G
Deploying FortuneCookiesAI_OG...
FortuneCookiesAI_OG deployed: 0x...
Explorer: https://chainscan.0g.ai/address/0x...
Saved deployment to deployed-og.json
```

The deploy script creates:

```txt
deployed-og.json
```

Example:

```json
{
  "network": "ogMainnet",
  "chainId": 16661,
  "contract": "FortuneCookiesAI_OG",
  "address": "0x...",
  "deployer": "0x...",
  "explorer": "https://chainscan.0g.ai/address/0x...",
  "deployedAt": "2026-..."
}
```

---

## Deploy to X Layer Mainnet

Before deploying, fund the deployer wallet with OKB on X Layer.

```bash
npm run deploy:xlayer
```

Expected output:

```txt
Network: xLayerMainnet
Chain ID: 196
Deployer: 0x...
Balance: ... OKB
Deploying FortuneCookiesAI_XLayer...
FortuneCookiesAI_XLayer deployed: 0x...
Explorer: https://www.okx.com/web3/explorer/xlayer/address/0x...
Saved deployment to deployed-xlayer.json
```

The deploy script creates:

```txt
deployed-xlayer.json
```

Example:

```json
{
  "network": "xLayerMainnet",
  "chainId": 196,
  "contract": "FortuneCookiesAI_XLayer",
  "address": "0x...",
  "deployer": "0x...",
  "explorer": "https://www.okx.com/web3/explorer/xlayer/address/0x...",
  "deployedAt": "2026-..."
}
```

After deployment, update `.env`:

```env
X_LAYER_COOKIE_CONTRACT=0xYOUR_DEPLOYED_X_LAYER_CONTRACT
NEXT_PUBLIC_COOKIE_ADDRESS_XLAYER=0xYOUR_DEPLOYED_X_LAYER_CONTRACT
```

---

## Deploy to X Layer Testnet

```bash
npm run deploy:xlayer:testnet
```

Expected output:

```txt
Network: xLayerTestnet
Chain ID: 1952
Deployer: 0x...
Balance: ... OKB
Deploying FortuneCookiesAI_XLayer...
FortuneCookiesAI_XLayer deployed: 0x...
Saved deployment to deployed-xlayer.json
```

---

# Export ABI

## 0G ABI

```bash
npm run export:abi:og
```

Output:

```txt
abi/FortuneCookiesAI_OG.json
```

## X Layer ABI

```bash
npm run export:abi:xlayer
```

Output:

```txt
abi/FortuneCookiesAI_XLayer.json
```

Copy this ABI into Cookieverse if you want a dedicated X Layer ABI.

---

# Set mint price

Mint price is optional. Default is `0`.

## 0G

Add to `.env`:

```env
OG_COOKIE_CONTRACT=0xYOUR_DEPLOYED_OG_CONTRACT
OG_MINT_PRICE=0.01
```

Run:

```bash
npm run set-price:og
```

This calls:

```solidity
setMintPrice(uint256 newPrice)
```

`OG_MINT_PRICE` is written in 0G units, not wei.

Example:

```txt
0.01 = 0.01 0G
```

## X Layer

Add to `.env`:

```env
X_LAYER_COOKIE_CONTRACT=0xYOUR_DEPLOYED_X_LAYER_CONTRACT
X_LAYER_MINT_PRICE=0.01
```

Run:

```bash
npm run set-price:xlayer
```

This calls:

```solidity
setMintPrice(uint256 newPrice)
```

`X_LAYER_MINT_PRICE` is written in OKB units, not wei.

Example:

```txt
0.01 = 0.01 OKB
```

---

# Cookieverse frontend integration

## 1. Add X Layer chain config

Example:

```ts
import { defineChain } from "viem";

export const xLayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_X_LAYER_RPC_URL || "https://rpc.xlayer.tech"],
    },
    public: {
      http: ["https://rpc.xlayer.tech"],
    },
  },
  blockExplorers: {
    default: {
      name: "OKX X Layer Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer",
    },
  },
});
```

## 2. Add X Layer to Wagmi config

Example:

```ts
import { xLayer } from "@/lib/chains/xLayer";

export const chains = [
  // existing chains
  xLayer,
] as const;
```

## 3. Add contract address constant

```ts
export const COOKIE_ADDRESS_XLAYER =
  process.env.NEXT_PUBLIC_COOKIE_ADDRESS_XLAYER as `0x${string}`;
```

## 4. Add X Layer to contract map

```ts
export const COOKIE_CONTRACTS: Record<number, `0x${string}`> = {
  // existing chains
  196: COOKIE_ADDRESS_XLAYER,
};
```

## 5. Use same mint functions

Text fortune mint:

```ts
writeContract({
  address: COOKIE_CONTRACTS[196],
  abi: fortuneCookiesAbi,
  functionName: "mintWithFortune",
  args: [fortune],
  value: mintPrice,
});
```

Wallet Roast image mint:

```ts
writeContract({
  address: COOKIE_CONTRACTS[196],
  abi: fortuneCookiesAbi,
  functionName: "mintWithImage",
  args: [fortune, imageURI],
  value: mintPrice,
});
```

---

# Optional X Layer verification

X Layer docs describe two verification methods:

1. Recommended `@okxweb3/hardhat-explorer-verify` plugin
2. Alternative Hardhat custom chain verification config

Install plugin:

```bash
npm install --save-dev @okxweb3/hardhat-explorer-verify
```

Add API key:

```env
OKLINK_API_KEY=YOUR_OKLINK_API_KEY
```

Important:

```txt
Apply for an OKLink API key before verification.
Wait at least 1 minute after deployment before verifying.
```

Example command from X Layer docs:

```bash
npx hardhat okverify --network xlayer <YOUR_CONTRACT_ADDRESS>
```

Because this repo uses Hardhat 3, verification plugin compatibility should be tested separately. If plugin verification fails, use manual verification through the OKX / OKLink explorer.

---

# Troubleshooting

## `Missing PRIVATE_KEY in .env`

Create `.env`:

```bash
cp .env.example .env
```

Then add:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

Do not commit `.env`.

---

## `Signer not found`

Check that:

```txt
PRIVATE_KEY exists
PRIVATE_KEY starts with 0x
.env is in the project root
```

---

## `Deployer has zero OKB balance`

For X Layer, fund the deployer wallet with OKB on X Layer.

Check:

```bash
npm run check:xlayer
```

---

## Wrong chain error

For X Layer mainnet, expected chain ID:

```txt
196
```

For X Layer testnet, expected chain ID:

```txt
1952
```

If the script reports another chain ID, check the RPC URL in `.env`.

---

## `Stack too deep`

Keep this in `hardhat.config.ts`:

```ts
viaIR: true
```

---

## ABI artifact not found

Run compile first:

```bash
npm run compile
```

Then export ABI:

```bash
npm run export:abi:xlayer
```

---

# Deployment checklist

```txt
1. Add FortuneCookiesAI_XLayer.sol
2. Update hardhat.config.ts
3. Add X Layer scripts
4. Update package.json scripts
5. Add .env.example
6. Add PRIVATE_KEY to .env
7. Fund deployer wallet with OKB
8. npm install
9. npm run compile
10. npm run check:xlayer
11. npm run deploy:xlayer
12. Copy deployed address from deployed-xlayer.json
13. Add X_LAYER_COOKIE_CONTRACT to .env
14. Add NEXT_PUBLIC_COOKIE_ADDRESS_XLAYER to Cookieverse frontend
15. npm run export:abi:xlayer
16. Copy ABI to frontend if needed
17. Optional: verify contract on OKX / OKLink explorer
18. Test mintWithFortune
19. Test mintWithImage
20. Test getAllMints for dashboard/indexer support
```

---

# License

ISC
