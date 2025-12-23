const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class RecipeBlockchain {
  constructor(storagePath, difficulty = 2) {
    this.storagePath = storagePath;
    this.difficulty = Math.max(1, difficulty);
    this.chain = [];
    this.loadChain();
  }

  loadChain() {
    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          this.chain = parsed;
          return;
        }
      } catch (err) {
        console.warn("Could not parse blockchain file, recreating...", err);
      }
    }
    this.chain = [this.createGenesisBlock()];
    this.persist();
  }

  createGenesisBlock() {
    const block = {
      index: 0,
      timestamp: Date.now() / 1000,
      title: "Genesis Recipe",
      ingredients: ["love", "curiosity"],
      steps: ["Boot the blockchain."],
      creator: "system",
      previous_hash: "0".repeat(64),
      nonce: 0,
    };
    block.hash = this.mineBlock(block);
    return block;
  }

  persist() {
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify(this.chain, null, 2));
  }

  hashableBlock(block) {
    const { hash, ...rest } = block;
    return rest;
  }

  calculateHash(block) {
    const data = JSON.stringify(this.hashableBlock(block), Object.keys(block).sort());
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  mineBlock(block) {
    const prefix = "0".repeat(this.difficulty);
    while (true) {
      const hash = this.calculateHash(block);
      if (hash.startsWith(prefix)) {
        return hash;
      }
      block.nonce += 1;
    }
  }

  addRecipe({ title, ingredients, steps, creator }) {
    const previousBlock = this.chain[this.chain.length - 1];
    const block = {
      index: this.chain.length,
      timestamp: Date.now() / 1000,
      title,
      ingredients,
      steps,
      creator,
      previous_hash: previousBlock.hash,
      nonce: 0,
    };
    block.hash = this.mineBlock(block);
    this.chain.push(block);
    this.persist();
    return block;
  }

  setOnchainData(index, data) {
    const block = this.chain[index];
    if (!block) {
      throw new Error(`Block ${index} not found`);
    }
    block.onchain = data;
    this.persist();
    return block;
  }

  validateChain() {
    for (let i = 0; i < this.chain.length; i += 1) {
      const block = this.chain[i];
      const recalculated = this.calculateHash(block);
      if (block.hash !== recalculated) {
        return [false, `Hash mismatch at block ${i}`];
      }
      if (i === 0) continue;
      const prev = this.chain[i - 1];
      if (block.previous_hash !== prev.hash) {
        return [false, `Previous hash mismatch between ${i - 1} and ${i}`];
      }
    }
    return [true, "Chain is valid"];
  }

  verifyBlock(index) {
    if (index < 0 || index >= this.chain.length) {
      return [false, "Block not found"];
    }
    const block = this.chain[index];
    const recalculated = this.calculateHash(block);
    if (block.hash !== recalculated) {
      return [false, "Block hash has been tampered with"];
    }
    return this.validateChain();
  }

  toJSON() {
    return this.chain;
  }
}

module.exports = RecipeBlockchain;

