const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const dotenv = require("dotenv");
const { ethers } = require("ethers");

const RecipeBlockchain = require("./blockchain");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const blockchain = new RecipeBlockchain(path.join(__dirname, "data", "blockchain.json"), 3);

const metadataBase = process.env.METADATA_URI_BASE || "";
const shouldUseSepolia =
  process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_PRIVATE_KEY && process.env.RECIPE_CONTRACT_ADDRESS;

let registryContract = null;
if (shouldUseSepolia) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
    const abi = [
      "function anchorRecipe(uint256 localIndex,string title,string creator,bytes32 dataHash,string metadataURI) returns (tuple(uint256,string,string,bytes32,string,uint256,address))",
    ];
    registryContract = new ethers.Contract(process.env.RECIPE_CONTRACT_ADDRESS, abi, wallet);
    console.log("Sepolia anchoring enabled via contract:", process.env.RECIPE_CONTRACT_ADDRESS);
  } catch (err) {
    console.error("Failed to initialize Sepolia contract:", err);
  }
}

const fingerprintRecipe = (block) => {
  const hash = crypto.createHash("sha256");
  hash.update(
    JSON.stringify(
      {
        index: block.index,
        title: block.title,
        ingredients: block.ingredients,
        steps: block.steps,
        creator: block.creator,
        timestamp: block.timestamp,
        previous_hash: block.previous_hash,
        hash: block.hash,
      },
      null,
      2
    )
  );
  return `0x${hash.digest("hex")}`;
};

async function anchorToSepolia(block) {
  if (!registryContract) {
    return null;
  }
  const dataHash = fingerprintRecipe(block);
  const metadataURI = metadataBase ? `${metadataBase}${block.hash}` : "";
  try {
    const tx = await registryContract.anchorRecipe(block.index, block.title, block.creator, dataHash, metadataURI);
    const receipt = await tx.wait();
    console.log(`Anchored recipe ${block.index} on-chain tx ${receipt.hash}`);
    return { dataHash, txHash: receipt.hash };
  } catch (err) {
    console.error("Failed to anchor recipe on Sepolia:", err);
    return { dataHash, error: err.message };
  }
}

const clientDistPath = path.join(__dirname, "client", "dist");

app.use(express.json());

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.get("/api/recipes", (req, res) => {
  res.json(blockchain.toJSON());
});

app.post("/api/recipes", async (req, res) => {
  try {
    const { title, ingredients, steps, creator } = req.body || {};
    if (
      typeof title !== "string" ||
      !Array.isArray(ingredients) ||
      !ingredients.length ||
      !Array.isArray(steps) ||
      !steps.length ||
      typeof creator !== "string"
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sanitized = {
      title: title.trim(),
      ingredients: ingredients.map((item) => String(item).trim()).filter(Boolean),
      steps: steps.map((item) => String(item).trim()).filter(Boolean),
      creator: creator.trim(),
    };

    if (!sanitized.title || !sanitized.creator || !sanitized.ingredients.length || !sanitized.steps.length) {
      return res.status(400).json({ error: "All fields must be non-empty" });
    }

    const sanitizedBlock = blockchain.addRecipe(sanitized);
    const onchain = await anchorToSepolia(sanitizedBlock);
    if (onchain) {
      blockchain.setOnchainData(sanitizedBlock.index, onchain);
    }

    res.status(201).json(blockchain.toJSON()[sanitizedBlock.index]);
  } catch (error) {
    console.error("Error adding recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/recipes/:index/verify", (req, res) => {
  const index = Number(req.params.index);
  if (Number.isNaN(index)) {
    return res.status(400).json({ valid: false, message: "Invalid index" });
  }
  const [valid, message] = blockchain.verifyBlock(index);
  const status = valid ? 200 : 400;
  res.status(status).json({ valid, message });
});

app.get("/api/chain/validate", (req, res) => {
  const [valid, message] = blockchain.validateChain();
  const status = valid ? 200 : 400;
  res.status(status).json({ valid, message });
});

app.get("*", (req, res) => {
  if (fs.existsSync(path.join(clientDistPath, "index.html"))) {
    return res.sendFile(path.join(clientDistPath, "index.html"));
  }
  return res
    .status(404)
    .send("Frontend build not found. Run `npm run client:build` and restart the server.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

