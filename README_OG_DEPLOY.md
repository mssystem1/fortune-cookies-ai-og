# mfv3-verify — 0G deployment-ready setup

This package fixes the missing deployment setup for `FortuneCookiesAI_OG`.

## Files to add / replace

```txt
package.json
hardhat.config.ts
tsconfig.json
.env.example
.gitignore
contracts/FortuneCookiesAI_OG.sol
scripts/deploy-og.ts
scripts/check-og.ts
scripts/set-mint-price-og.ts
scripts/export-abi-og.js
```

## 0G Mainnet

```txt
Network: 0G Mainnet
Chain ID: 16661
RPC: https://evmrpc.0g.ai
Explorer: https://chainscan.0g.ai
Native token: 0G
```

## Contract

`FortuneCookiesAI_OG` keeps:

```solidity
mintWithFortune(string fortune)
mintWithImage(string fortune, string imageURI)
getAllMints()
totalMinted()
totalTextMinted()
totalImageMinted()
getTextMinters()
getImageMinters()
tokenURI()
```

It removes only the logo upload/rendering part. SVG generation is kept for `mintWithFortune()` and uses the purple/glass 0G-style design.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```bash
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
OG_MAINNET_RPC_URL=https://evmrpc.0g.ai
```

Check RPC and wallet:

```bash
npm run check:og
```

Compile:

```bash
npm run compile
```

Deploy:

```bash
npm run deploy:og
```

Export ABI:

```bash
npm run export:abi:og
```

After deploy, copy the address from `deployed-og.json` into Cookieverse:

```bash
NEXT_PUBLIC_RPC_HTTP_OG=https://evmrpc.0g.ai
NEXT_PUBLIC_COOKIE_ADDRESS_OG=0xYOUR_DEPLOYED_CONTRACT
```
