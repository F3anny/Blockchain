const hre = require("hardhat");

async function main() {
  const registry = await hre.ethers.deployContract("RecipeRegistry");
  await registry.waitForDeployment();
  console.log(`RecipeRegistry deployed to: ${registry.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});






