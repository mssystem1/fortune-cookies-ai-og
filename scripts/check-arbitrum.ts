import { network } from "hardhat";

const ARBITRUM_ONE_CHAIN_ID = 42161n;

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
  const blockNumber = await ethers.provider.getBlockNumber();
  const feeData = await ethers.provider.getFeeData();

  console.log("Network:", connection.networkName);
  console.log("Chain ID:", chain.chainId.toString());
  console.log("Current block:", blockNumber);
  console.log("Deployer:", deployerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log(
    "Gas price:",
    feeData.gasPrice === null
      ? "unavailable"
      : `${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`
  );

  if (chain.chainId !== ARBITRUM_ONE_CHAIN_ID) {
    throw new Error(
      `Wrong chain. Expected Arbitrum One chainId ${ARBITRUM_ONE_CHAIN_ID}, got ${chain.chainId}`
    );
  }

  if (balance === 0n) {
    throw new Error("Deployer has zero ETH on Arbitrum One. Fund it before deploying.");
  }

  const factory = await ethers.getContractFactory(
    "FortuneCookiesAI_Arbitrum",
    deployer
  );
  const deployRequest = await factory.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas({
    ...deployRequest,
    from: deployerAddress,
  });

  console.log("Estimated deployment gas:", estimatedGas.toString());

  if (feeData.gasPrice !== null) {
    const estimatedCost = estimatedGas * feeData.gasPrice;
    console.log(
      "Estimated deployment cost:",
      ethers.formatEther(estimatedCost),
      "ETH"
    );

    if (balance < estimatedCost) {
      throw new Error(
        "Deployer balance is below the current estimated deployment cost."
      );
    }
  }

  console.log("RPC OK");
  console.log("Signer OK");
  console.log("Deployment estimation OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
