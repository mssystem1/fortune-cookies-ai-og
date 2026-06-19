# FortuneCookiesAI on Arbitrum One

This runbook deploys and verifies `contracts/FortuneCookiesAI_ARBITRUM.sol`
on Arbitrum One mainnet.

## Network and contract facts

- Network: Arbitrum One
- Chain ID: `42161`
- Gas token: ETH
- Public RPC: `https://arb1.arbitrum.io/rpc`
- Explorer: `https://arbiscan.io`
- Solidity: `0.8.25`
- Optimizer: enabled, 200 runs
- `viaIR`: enabled
- EVM target: Cancun
- Constructor arguments: none

The public RPC is suitable for setup and low-volume use, but it has no uptime
or rate-limit guarantees. A private RPC provider is preferable for a
production deployment.

## 1. Review the contract

Deployment makes the deployer:

- contract owner;
- initial `fundsReceiver`;
- holder of every privileged configuration function.

The initial mint price is `0 ETH`. Decide before launch whether the owner
should remain the deployer EOA or later be transferred to a multisig.

This repository prepares deployment mechanics; it is not a security audit.
Do not treat successful compilation or explorer verification as an audit.

## 2. Install and compile

Use Node.js 22.13 or later.

```bash
npm ci
npm run clean
npm run compile
```

## 3. Configure secrets

Copy `.env.example` to `.env` and fill at least:

```dotenv
PRIVATE_KEY=0x...
ARBITRUM_MAINNET_RPC_URL=https://your-private-arbitrum-rpc
ETHERSCAN_API_KEY=...
```

Use an Etherscan API V2 key. The same Etherscan key supports Arbitrum One.
Do not use an Ethereum mainnet balance as proof of readiness: the deployer
needs ETH specifically on Arbitrum One.

## 4. Preflight

```bash
npm run check:arbitrum
```

Confirm all of the following before continuing:

- chain ID is exactly `42161`;
- the printed deployer is the intended owner;
- the deployer has enough Arbitrum ETH;
- the RPC and signer checks pass.

## 5. Deploy

```bash
npm run deploy:arbitrum
```

The script checks the chain ID, deploys the contract, waits for the receipt,
and writes `deployed-arbitrum.json`. Keep that file with your deployment
records even though it is gitignored.

## 6. Inspect the deployment

```bash
npm run inspect:arbitrum
```

This confirms that bytecode exists and reads the name, symbol, owner,
funds receiver, mint price, mint counters, and ERC-721/ERC-2981 support.

## 7. Verify on Arbiscan

Wait roughly one minute after deployment so the explorer can index it, then:

```bash
npm run verify:arbitrum -- 0xYOUR_DEPLOYED_CONTRACT
```

There are no constructor arguments. The command explicitly uses the
`default` build profile because deployment uses that profile; Hardhat 3's
verification task otherwise defaults to `production`.

If verification reports that the contract is already verified, no action is
needed. If it reports a bytecode mismatch, do not edit the source and retry.
First confirm that the checked-out source, compiler settings, dependency
versions, and build profile are exactly those used for deployment.

Contract page:

```text
https://arbiscan.io/address/0xYOUR_DEPLOYED_CONTRACT#code
```

## 8. Optional post-deployment configuration

Set only the values you intend to change in `.env`:

```dotenv
ARBITRUM_COOKIE_CONTRACT=0x...
ARBITRUM_MINT_PRICE=0.0005
ARBITRUM_FUNDS_RECEIVER=0x...
ARBITRUM_ROYALTY_RECEIVER=0x...
ARBITRUM_ROYALTY_BPS=500
```

`ARBITRUM_ROYALTY_BPS=500` means 5%. Then run:

```bash
npm run configure:arbitrum
npm run inspect:arbitrum
```

Each changed setting is a separate mainnet transaction. Unset optional
variables are ignored.

## 9. Export the frontend ABI

```bash
npm run export:abi:arbitrum
```

Output:

```text
abi/FortuneCookiesAI_Arbitrum.json
```

## Recommended final checklist

- Save the contract address and deployment transaction hash.
- Confirm source verification on Arbiscan.
- Confirm `owner()` and `fundsReceiver()` are correct.
- Confirm `mintPrice()` is intentional; deployment defaults it to zero.
- Test both mint paths with low-risk values before announcing the contract.
- Confirm `tokenURI()` renders correctly for text and image mints.
- Transfer ownership to a multisig if that is the intended control model.
- Store the exact source commit, lockfile, `.env` settings excluding secrets,
  and `deployed-arbitrum.json` as release records.

## Official references

- Arbitrum network information:
  https://docs.arbitrum.io/for-devs/dev-tools-and-resources/chain-info
- Arbitrum RPC endpoint guidance:
  https://docs.arbitrum.io/arbitrum-essentials/reference/node-providers
- Hardhat 3 contract verification:
  https://hardhat.org/docs/guides/smart-contract-verification
- Etherscan API V2 supported chains:
  https://docs.etherscan.io/supported-chains
