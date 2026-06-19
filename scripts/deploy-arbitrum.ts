import { network } from "hardhat";
import fs from "node:fs";

const ARBITRUM_ONE_CHAIN_ID = 42161n;

function explorerAddressUrl(address: string) {
  return `https://arbiscan.io/address/${address}`;
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

  const chain = await ethers.provider.getNetwork();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Network:", connection.networkName);
  console.log("Chain ID:", chain.chainId.toString());
  console.log("Deployer:", deployerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (chain.chainId !== ARBITRUM_ONE_CHAIN_ID) {
    throw new Error(
      `Wrong chain. Expected Arbitrum One chainId ${ARBITRUM_ONE_CHAIN_ID}, got ${chain.chainId}`
    );
  }

  if (balance === 0n) {
    throw new Error("Deployer has zero ETH on Arbitrum One. Fund it before deploying.");
  }

  console.log("Deploying FortuneCookiesAI_Arbitrum...");

  const contract = await ethers.deployContract("FortuneCookiesAI_Arbitrum");
  const deploymentTx = contract.deploymentTransaction();

  if (!deploymentTx) {
    throw new Error("Deployment transaction was not created");
  }

  console.log("Deployment tx:", deploymentTx.hash);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = await deploymentTx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Deployment transaction failed");
  }

  const deployment = {
    network: connection.networkName,
    chainId: Number(chain.chainId),
    contract: "FortuneCookiesAI_Arbitrum",
    source: "contracts/FortuneCookiesAI_ARBITRUM.sol",
    address,
    deployer: deployerAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    explorer: explorerAddressUrl(address),
    deployedAt: new Date().toISOString(),
    compiler: {
      version: "0.8.25",
      evmVersion: "cancun",
      viaIR: true,
      optimizerRuns: 200,
      buildProfile: "default",
    },
  };

  fs.writeFileSync(
    "deployed-arbitrum.json",
    JSON.stringify(deployment, null, 2)
  );

  console.log("FortuneCookiesAI_Arbitrum deployed:", address);
  console.log("Explorer:", deployment.explorer);
  console.log("Saved deployment to deployed-arbitrum.json");
  console.log(
    `Verify with: npm run verify:arbitrum -- ${address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
