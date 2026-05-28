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