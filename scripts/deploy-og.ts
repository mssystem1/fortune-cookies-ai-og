import { network } from "hardhat";
import fs from "node:fs";

function explorerAddressUrl(address: string) {
  return `https://chainscan.0g.ai/address/${address}`;
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  const connection = await network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Network:", connection.networkName);
  console.log("Deployer:", deployerAddress);
  console.log("Balance:", ethers.formatEther(balance), "0G");

  if (balance === 0n) {
    throw new Error("Deployer has zero 0G balance. Fund it before deploying.");
  }

  console.log("Deploying FortuneCookiesAI_OG...");

  const contract = await ethers.deployContract("FortuneCookiesAI_OG");
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  const deployment = {
    network: connection.networkName,
    chainId: 16661,
    contract: "FortuneCookiesAI_OG",
    address,
    deployer: deployerAddress,
    explorer: explorerAddressUrl(address),
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("deployed-og.json", JSON.stringify(deployment, null, 2));

  console.log("FortuneCookiesAI_OG deployed:", address);
  console.log("Explorer:", deployment.explorer);
  console.log("Saved deployment to deployed-og.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});