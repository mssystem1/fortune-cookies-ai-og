import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();

  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  const blockNumber = await ethers.provider.getBlockNumber();

  console.log("Network:", connection.networkName);
  console.log("Deployer:", address);
  console.log("Balance:", ethers.formatEther(balance), "0G");
  console.log("Current block:", blockNumber);
  console.log("RPC OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});