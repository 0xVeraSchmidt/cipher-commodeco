// Test encrypted trading functionality
const { ethers } = require("hardhat");

async function testEncryptedTrading() {
  console.log("🔐 Testing encrypted trading functionality...");
  
  try {
    // Get contract instance
    const contractAddress = "0xB08F713B543ba71c53B2673Bd1095E9628F8B9ef";
    const CipherCommodecoV2 = await ethers.getContractFactory("CipherCommodecoV2");
    const contract = CipherCommodecoV2.attach(contractAddress);
    
    console.log("📊 Contract address:", contractAddress);
    
    // Get all available commodities
    console.log("🔄 Fetching available commodities...");
    const commodities = await contract.getAllCommoditySymbols();
    console.log("✅ Available commodities:", commodities);
    
    // Display commodity information
    console.log("\n📈 Commodity Information:");
    for (const symbol of commodities) {
      const info = await contract.getCommodityInfo(symbol);
      const priceInUSD = ethers.formatEther(info[2]);
      console.log(`\n${symbol}:`);
      console.log(`  Name: ${info[1]}`);
      console.log(`  Price: $${priceInUSD} USD`);
      console.log(`  Active: ${info[3]}`);
    }
    
    // Test order placement (simulated encrypted data)
    console.log("\n🔄 Testing order placement...");
    
    // Simulate placing orders for different commodities
    const testOrders = [
      {
        symbol: "GOLD",
        orderType: 1, // Buy
        quantity: 100,
        price: 1987.45,
        orderId: 1
      },
      {
        symbol: "OIL", 
        orderType: 2, // Sell
        quantity: 500,
        price: 73.21,
        orderId: 2
      },
      {
        symbol: "WHEAT",
        orderType: 1, // Buy
        quantity: 200,
        price: 645.75,
        orderId: 3
      },
      {
        symbol: "COPPER",
        orderType: 2, // Sell
        quantity: 50,
        price: 8234.5,
        orderId: 4
      }
    ];
    
    console.log("📝 Simulating encrypted order placement:");
    for (const order of testOrders) {
      console.log(`\n${order.orderType === 1 ? '🟢' : '🔴'} ${order.orderType === 1 ? 'BUY' : 'SELL'} Order:`);
      console.log(`   Symbol: ${order.symbol}`);
      console.log(`   Quantity: ${order.quantity}`);
      console.log(`   Price: $${order.price} USD`);
      console.log(`   Total Value: $${(order.quantity * order.price).toLocaleString()} USD`);
      console.log(`   Order ID: ${order.orderId}`);
      console.log(`   🔐 Data would be encrypted before blockchain submission`);
    }
    
    // Check order count
    console.log("\n📊 Checking order counter...");
    const orderCount = await contract.getOrderCount();
    console.log("✅ Current order count:", orderCount.toString());
    
    console.log("\n🎉 Encrypted trading test completed successfully!");
    console.log("💡 Note: Actual encrypted order placement requires FHE SDK integration");
    
  } catch (error) {
    console.error("❌ Encrypted trading test failed:", error);
  }
}

testEncryptedTrading()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
