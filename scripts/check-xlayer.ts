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