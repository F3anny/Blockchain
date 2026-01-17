import hre from "hardhat";

async function main() {
  const SimpleStorage = await hre.ethers.getContractFactory("SiStorage");
  const contract = await SimpleStorage.deploy();

  await contract.waitForDeployment();

  console.log("SimpleStorage deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

