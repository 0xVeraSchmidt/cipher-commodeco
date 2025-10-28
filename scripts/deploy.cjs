const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CipherCommodecoV2 contract...");

  // Get the contract factory
  const CipherCommodecoV2 = await ethers.getContractFactory("CipherCommodecoV2");

  // Deploy the contract (no constructor arguments needed)
  const cipherCommodeco = await CipherCommodecoV2.deploy();

  await cipherCommodeco.waitForDeployment();

  const contractAddress = await cipherCommodeco.getAddress();
  
  console.log("CipherCommodecoV2 deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "sepolia",
    timestamp: new Date().toISOString(),
    transactionHash: cipherCommodeco.deploymentTransaction()?.hash
  };

  const fs = require('fs');
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  
  console.log("Deployment info saved to deployment-info.json");
  
  // Verify contract on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
