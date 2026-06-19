import { network } from "hardhat";
import fs from "node:fs";

type DeploymentFile = {
  address?: string;
};

function contractAddress(): string {
  if (process.env.ARBITRUM_COOKIE_CONTRACT) {
    return process.env.ARBITRUM_COOKIE_CONTRACT;
  }

  if (!fs.existsSync("deployed-arbitrum.json")) {
    throw new Error(
      "Set ARBITRUM_COOKIE_CONTRACT in .env or deploy first to create deployed-arbitrum.json"
    );
  }

  const deployment = JSON.parse(
    fs.readFileSync("deployed-arbitrum.json", "utf8")
  ) as DeploymentFile;

  if (!deployment.address) {
    throw new Error("deployed-arbitrum.json does not contain an address");
  }

  return deployment.address;
}

async function main() {
  const connection = await network.connect();
  const { ethers } = connection;
  const [signer] = await ethers.getSigners();

  if (!signer) {
    throw new Error("Signer not found. Check PRIVATE_KEY in .env");
  }

  const address = ethers.getAddress(contractAddress());
  const contract = await ethers.getContractAt(
    "FortuneCookiesAI_Arbitrum",
    address,
    signer
  );

  const signerAddress = await signer.getAddress();
  const owner = await contract.owner();

  if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error(`Signer ${signerAddress} is not contract owner ${owner}`);
  }

  const requestedPrice =
    process.env.ARBITRUM_MINT_PRICE === undefined
      ? undefined
      : ethers.parseEther(process.env.ARBITRUM_MINT_PRICE);

  const requestedFundsReceiver = process.env.ARBITRUM_FUNDS_RECEIVER
    ? ethers.getAddress(process.env.ARBITRUM_FUNDS_RECEIVER)
    : undefined;

  const royaltyReceiver = process.env.ARBITRUM_ROYALTY_RECEIVER;
  const royaltyBps = process.env.ARBITRUM_ROYALTY_BPS;

  if ((royaltyReceiver && !royaltyBps) || (!royaltyReceiver && royaltyBps)) {
    throw new Error(
      "Set both ARBITRUM_ROYALTY_RECEIVER and ARBITRUM_ROYALTY_BPS"
    );
  }

  const requestedRoyaltyReceiver = royaltyReceiver
    ? ethers.getAddress(royaltyReceiver)
    : undefined;
  const requestedRoyaltyBps = royaltyBps ? BigInt(royaltyBps) : undefined;

  if (requestedRoyaltyBps !== undefined && requestedRoyaltyBps > 10000n) {
    throw new Error("ARBITRUM_ROYALTY_BPS cannot exceed 10000");
  }

  let changes = 0;

  if (requestedPrice !== undefined) {
    const oldPrice = await contract.mintPrice();

    if (requestedPrice !== oldPrice) {
      console.log(
        "Setting mint price:",
        ethers.formatEther(oldPrice),
        "->",
        ethers.formatEther(requestedPrice),
        "ETH"
      );
      const tx = await contract.setMintPrice(requestedPrice);
      console.log("Tx:", tx.hash);
      await tx.wait();
      changes++;
    }
  }

  if (requestedFundsReceiver) {
    const oldReceiver = await contract.fundsReceiver();

    if (requestedFundsReceiver.toLowerCase() !== oldReceiver.toLowerCase()) {
      console.log(
        "Setting funds receiver:",
        oldReceiver,
        "->",
        requestedFundsReceiver
      );
      const tx = await contract.setFundsReceiver(requestedFundsReceiver);
      console.log("Tx:", tx.hash);
      await tx.wait();
      changes++;
    }
  }

  if (
    requestedRoyaltyReceiver &&
    requestedRoyaltyBps !== undefined
  ) {
    console.log(
      "Setting default royalty:",
      requestedRoyaltyReceiver,
      `${requestedRoyaltyBps} bps`
    );
    const tx = await contract.setDefaultRoyalty(
      requestedRoyaltyReceiver,
      requestedRoyaltyBps
    );
    console.log("Tx:", tx.hash);
    await tx.wait();
    changes++;
  }

  if (changes === 0) {
    console.log("No configuration changes were needed.");
  } else {
    console.log(`Applied ${changes} configuration change(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
