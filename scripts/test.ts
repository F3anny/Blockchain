import hre from "hardhat";

async function main() {
  // 1. Get the contract factory
  const SimpleStorage = await hre.ethers.getContractFactory("SiStorage");

  // 2. Deploy the contract
  const contract = await SimpleStorage.deploy();
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());

  // 3. Read initial value
  let value = await contract.variable();
  console.log("Initial value:", value.toString()); // should be 0

  // 4. Increment
  let tx = await contract.increment();
  await tx.wait(); // wait for the transaction to be mined
  value = await contract.variable();
  console.log("After increment:", value.toString()); // should be 1

  // 5. Decrement
  tx = await contract.decrement();
  await tx.wait();
  value = await contract.variable();
  console.log("After decrement:", value.toString()); // should be 0 again
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
