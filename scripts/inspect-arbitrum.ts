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
  const chain = await ethers.provider.getNetwork();
  const address = ethers.getAddress(contractAddress());
  const code = await ethers.provider.getCode(address);

  if (chain.chainId !== 42161n) {
    throw new Error(`Wrong chain. Expected 42161, got ${chain.chainId}`);
  }

  if (code === "0x") {
    throw new Error(`No contract bytecode found at ${address}`);
  }

  const contract = await ethers.getContractAt(
    "FortuneCookiesAI_Arbitrum",
    address
  );

  const [
    name,
    symbol,
    owner,
    fundsReceiver,
    mintPrice,
    totalMinted,
    nextTokenId,
    supportsERC721,
    supportsERC2981,
  ] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.owner(),
    contract.fundsReceiver(),
    contract.mintPrice(),
    contract.totalMinted(),
    contract.nextTokenId(),
    contract.supportsInterface("0x80ac58cd"),
    contract.supportsInterface("0x2a55205a"),
  ]);

  console.log("Network:", connection.networkName);
  console.log("Chain ID:", chain.chainId.toString());
  console.log("Contract:", address);
  console.log("Explorer:", `https://arbiscan.io/address/${address}`);
  console.log("Runtime bytecode:", `${(code.length - 2) / 2} bytes`);
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Owner:", owner);
  console.log("Funds receiver:", fundsReceiver);
  console.log("Mint price:", ethers.formatEther(mintPrice), "ETH");
  console.log("Total minted:", totalMinted.toString());
  console.log("Next token ID:", nextTokenId.toString());
  console.log("ERC-721 interface:", supportsERC721);
  console.log("ERC-2981 interface:", supportsERC2981);
  console.log("On-chain inspection OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
