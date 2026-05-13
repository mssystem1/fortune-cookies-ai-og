# FortuneCookiesAI OG

Standalone 0G Mainnet deployment project for the Cookieverse `FortuneCookiesAI_OG` smart contract.

This repo contains the 0G version of the Cookieverse NFT contract used for:

- AI fortune text NFTs
- Wallet Roast image NFTs
- Cookieverse 0G Mainnet deployment proof
- Cookieverse app integration through `NEXT_PUBLIC_COOKIE_ADDRESS_OG`

---

## Overview

`FortuneCookiesAI_OG` is an ERC-721 contract for Cookieverse on 0G Mainnet.

It keeps both core Cookieverse minting modes:

```solidity
mintWithFortune(string fortune)
mintWithImage(string fortune, string imageURI)
```

---

## Network

```txt
Network: 0G Mainnet
Chain ID: 16661
RPC: https://evmrpc.0g.ai
Explorer: https://chainscan.0g.ai
Native token: 0G
```

---

## Contract behavior

### Text fortune mint

```txt
mintWithFortune(fortune)
→ stores fortune text
→ tokenURI()
→ returns base64 JSON metadata
→ metadata image is generated on-chain SVG
```

This is used for normal Cookieverse AI fortune NFTs.

### Image mint

```txt
mintWithImage(fortune, imageURI)
→ stores fortune text
→ stores external imageURI
→ tokenURI()
→ returns base64 JSON metadata with imageURI
```

This is used for Cookieverse Wallet Roast cards.

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

## SVG design

`mintWithFortune()` generates a beautiful on-chain SVG NFT image.

The SVG design uses:

```txt
Purple / lilac / pink gradient
Soft white glow
Glass pill capsule
Central white spark
"Built" and "For AI Agents" side text
COOKIEVERSE branding
AI FORTUNE ON 0G subtitle
Dynamic fortune text inside the capsule
```

SVG-related functions:

```solidity
_svgHead()
_svgGlassCapsule()
_svgSpark()
_svgLabels()
_svgFortune()
_svgBrand()
_svgFoot()
```

---

## Project structure

```txt
fortune-cookies-ai-og/
  contracts/
    FortuneCookiesAI_OG.sol

  scripts/
    check-og.ts
    deploy-og.ts
    set-mint-price-og.ts
    export-abi-og.js

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

## Requirements

Recommended:

```txt
Node.js: 20+
npm: 10+
Hardhat: 3.x
Solidity: 0.8.25
```

Install dependencies:

```bash
npm install
```

---

## Environment

Create `.env` in the project root:

```bash
cp .env.example .env
```

Example `.env`:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
OG_MAINNET_RPC_URL=https://evmrpc.0g.ai

# Optional after deploy
OG_COOKIE_CONTRACT=0xYOUR_DEPLOYED_CONTRACT

# Optional for set-price script
OG_MINT_PRICE=0
```

Important:

```txt
PRIVATE_KEY must be a real deployer wallet private key.
It must have enough 0G for gas.
Do not commit .env.
```

---

## Check RPC and deployer

Run:

```bash
npm run check:og
```

Expected successful output:

```txt
Network: ogMainnet
Current block: ...
Deployer: 0x...
Balance: ... 0G
RPC OK
Signer OK
```

If you see:

```txt
Signer: NOT FOUND
```

then `.env` is not loaded or `PRIVATE_KEY` is missing.

Check:

```bash
cat .env
```

On Windows PowerShell:

```powershell
Get-Content .env
```

---

## Compile

```bash
npm run compile
```

If you see:

```txt
Stack too deep
```

make sure `hardhat.config.ts` includes:

```ts
viaIR: true
```

inside Solidity compiler settings.

---

## Deploy

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

## Export ABI

```bash
npm run export:abi:og
```

Output:

```txt
abi/FortuneCookiesAI_OG.json
```

Copy this ABI into Cookieverse if you want a dedicated 0G ABI.

Cookieverse can also keep using the existing `FortuneCookiesAI.json` ABI if it contains:

```txt
mintWithFortune
mintWithImage
mintPrice
getAllMints
getFortune
getImageURI
```

---

## Set mint price

Optional.

Add to `.env`:

```env
OG_COOKIE_CONTRACT=0xYOUR_DEPLOYED_CONTRACT
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

---

## Scripts

### `check-og.ts`

Checks RPC, deployer address, and deployer balance.

```bash
npm run check:og
```

### `deploy-og.ts`

Deploys `FortuneCookiesAI_OG` to 0G Mainnet.

```bash
npm run deploy:og
```

### `set-mint-price-og.ts`

Sets mint price on the deployed contract.

```bash
npm run set-price:og
```

### `export-abi-og.js`

Exports ABI from Hardhat artifact.

```bash
npm run export:abi:og
```

---

## License

ISC
