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