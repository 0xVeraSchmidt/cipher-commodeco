// Initialize commodity assets for Cipher Commodeco
const { ethers } = require("hardhat");

async function initializeCommodities() {
  console.log("🚀 Initializing commodity assets for Cipher Commodeco...");
  
  try {
    // Get contract instance
    let contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      try {
        const info = require("../deployment-info.json");
        contractAddress = info?.contractAddress;
      } catch {}
    }
    if (!contractAddress) {
      throw new Error("Missing CONTRACT_ADDRESS. Set env or deployment-info.json");
    }
    const CipherCommodecoV2 = await ethers.getContractFactory("CipherCommodecoV2");
    const contract = CipherCommodecoV2.attach(contractAddress);
    
    console.log("📊 Contract address:", contractAddress);
    
    // Define commodity assets
    const commodities = [
      {
        symbol: "GOLD",
        name: "Gold Futures",
        price: 1987.45, // USD per ounce
        supply: 1000000, // Total supply
        emoji: "🥇"
      },
      {
        symbol: "OIL", 
        name: "Crude Oil",
        price: 73.21, // USD per barrel
        supply: 5000000, // Total supply
        emoji: "🛢️"
      },
      {
        symbol: "WHEAT",
        name: "Wheat Futures", 
        price: 645.75, // USD per bushel
        supply: 2000000, // Total supply
        emoji: "🌾"
      },
      {
        symbol: "COPPER",
        name: "Copper",
        price: 8234.5, // USD per ton
        supply: 800000, // Total supply
        emoji: "🔶"
      }
    ];
    
    console.log("🔄 Creating commodity assets...");
    
    for (const commodity of commodities) {
      try {
        console.log(`\n${commodity.emoji} Creating ${commodity.symbol} - ${commodity.name}`);
        console.log(`   Price: $${commodity.price} USD`);
        console.log(`   Supply: ${commodity.supply.toLocaleString()}`);
        
        // Use cents to fit uint64 arithmetic in contract (avoid overflow)
        const priceInCents = Math.round(commodity.price * 100);
        
        // Create commodity
        const tx = await contract.createCommodity(
          commodity.symbol,
          commodity.name,
          priceInCents,
          commodity.supply,
          "0x" // Empty proof for initialization
        );
        
        console.log(`   ⏳ Transaction submitted: ${tx.hash}`);
        await tx.wait();
        console.log(`   ✅ ${commodity.symbol} created successfully!`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create ${commodity.symbol}:`, error.message);
      }
    }
    
    // Verify all commodities were created
    console.log("\n🔍 Verifying created commodities...");
    const allSymbols = await contract.getAllCommoditySymbols();
    console.log("✅ All commodity symbols:", allSymbols);
    
    // Display detailed information for each commodity
    for (const symbol of allSymbols) {
      try {
        const info = await contract.getCommodityInfo(symbol);
        const priceInUSD = Number(info[2]) / 100;
        console.log(`\n${symbol}:`);
        console.log(`  Name: ${info[1]}`);
        console.log(`  Price: $${priceInUSD} USD`);
        console.log(`  Active: ${info[3]}`);
      } catch (error) {
        console.error(`  ❌ Error fetching ${symbol}:`, error.message);
      }
    }
    
    console.log("\n🎉 Commodity initialization completed successfully!");
    
  } catch (error) {
    console.error("❌ Commodity initialization failed:", error);
  }
}

initializeCommodities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
