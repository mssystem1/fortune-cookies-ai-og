import { network } from "hardhat";

async function main() {
  if (!process.env.OG_COOKIE_CONTRACT) {
    throw new Error("Missing OG_COOKIE_CONTRACT in .env");
  }

  const price = process.env.OG_MINT_PRICE || "0";

  const connection = await network.connect();
  const { ethers } = connection;

  const contract = await ethers.getContractAt(
    "FortuneCookiesAI_OG",
    process.env.OG_COOKIE_CONTRACT
  );

  const priceWei = ethers.parseEther(price);

  console.log("Network:", connection.networkName);
  console.log("Contract:", process.env.OG_COOKIE_CONTRACT);
  console.log("Setting mint price:", price, "0G");

  const tx = await contract.setMintPrice(priceWei);
  console.log("Tx:", tx.hash);

  await tx.wait();

  console.log("Mint price updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});