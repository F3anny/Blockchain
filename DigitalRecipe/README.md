🍳 Digital Recipe Book (Local Blockchain Demo)

Welcome to the Digital Recipe Book, a blockchain-powered demo that proves you can own your recipes. Each recipe you submit becomes a unique block in a local blockchain, complete with metadata, a proof-of-work hash, and a reference to the previous block. This ensures tampering is impossible to hide and every recipe is securely anchored on your local network.

💡 Optional: For public verification and ownership proofs, recipe hashes can also be anchored to the Sepolia Ethereum testnet.

🌟 Features

Submit new recipes through an easy-to-use web form.

Explore the full recipe chain with hashes, nonces, and previous block references.

Verify individual recipes or validate the entire blockchain for authenticity.

Optional proof-of-work mining with adjustable difficulty.

Optional Sepolia anchoring for public verification.

🛠 Tech Stack

Node.js 18+

Express

Vanilla HTML/CSS/JavaScript frontend

JSON file storage (data/blockchain.json)

🚀 Getting Started (Local Deployment)
# Install backend dependencies
npm install

# Install React frontend dependencies
cd client
npm install
cd ..

# Build the frontend once so Express can serve it
npm run client:build

# Launch the API + local blockchain node
npm start


Open your browser at http://127.0.0.1:5000/
 to interact with your local blockchain recipe book.

🔄 Local Development (Hot Reload)

Run backend and frontend development servers side-by-side:

npm run dev           # Backend with nodemon
npm run client:dev    # React dev server (http://localhost:5173)


Frontend requests to /api/* are automatically proxied to the backend at http://localhost:5000
.

⛓️ Sepolia Anchoring (Optional)

If you want to anchor recipes publicly:

Copy env.example → .env and populate:

SEPOLIA_RPC_URL (Infura/Alchemy endpoint)

SEPOLIA_PRIVATE_KEY (funding account)

RECIPE_CONTRACT_ADDRESS (after deployment)

METADATA_URI_BASE (optional prefix for each on-chain record, e.g., IPFS gateway)

Compile and deploy the smart contract:

npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia


Update .env with the deployed contract address and restart npm start.
New recipes will now submit transactions to Sepolia, while failures gracefully fallback to local storage.

📡 API Overview

GET /api/recipes — Returns the full blockchain of recipes.

POST /api/recipes — Adds a recipe. Body fields: title, ingredients[], steps[], creator.

GET /api/recipes/<index>/verify — Verify the integrity of a single recipe block.

GET /api/chain/validate — Validate the full blockchain.

⚡ Customizing Mining Difficulty

The default proof-of-work difficulty is 3 leading zeros. Adjust this in server.js when instantiating RecipeBlockchain. Higher difficulty = stronger tamper resistance, slower block creation.