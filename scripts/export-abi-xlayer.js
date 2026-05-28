import fs from "node:fs";
import path from "node:path";

const artifactPath = path.join(
  "artifacts",
  "contracts",
  "FortuneCookiesAI_XLayer.sol",
  "FortuneCookiesAI_XLayer.json"
);

if (!fs.existsSync(artifactPath)) {
  throw new Error(`Artifact not found at ${artifactPath}. Run npm run compile first.`);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

fs.mkdirSync("abi", { recursive: true });

fs.writeFileSync(
  path.join("abi", "FortuneCookiesAI_XLayer.json"),
  JSON.stringify(artifact.abi, null, 2)
);

console.log("Exported ABI to abi/FortuneCookiesAI_XLayer.json");