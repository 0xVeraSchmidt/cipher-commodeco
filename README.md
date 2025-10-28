# 🔐 Cipher Commodeco

> **Next-Generation Privacy-Preserving Commodity Trading Platform**

Experience the future of decentralized trading with **Fully Homomorphic Encryption (FHE)** technology. Trade commodities with complete privacy while maintaining full transparency where it matters.

## 🎥 Demo Video

[![Cipher Commodeco Demo](https://img.shields.io/badge/📹%20Watch%20Demo-Video%20Demo-blue)](./cipher-commodeco.mov)

**Watch the full demo**: [cipher-commodeco.mov](./cipher-commodeco.mov) (13MB)

The demo showcases:
- 🔐 **FHE-encrypted order creation** with real-time price updates
- 📊 **Commodity trading interface** with GOLD, OIL, WHEAT, COPPER
- 🔓 **Order decryption** revealing encrypted trading data
- ⚡ **Real-time price volatility** (-0.5% to +0.5% every 60 seconds)
- 🛡️ **Privacy-preserving** trading without exposing strategies

## ✨ What Makes Us Different

### 🛡️ **Zero-Knowledge Trading**
- Your trading strategies remain completely private
- Market makers cannot front-run your orders
- Order details are encrypted until decryption by authorized users

### ⚡ **Real-Time FHE Operations**
- Execute complex trading algorithms on encrypted data
- Perform risk calculations without revealing positions
- Maintain competitive advantage through privacy

### 🌐 **Multi-Chain Ready**
- Built on Ethereum with FHEVM integration
- Seamless cross-chain asset management
- Future-proof architecture

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/0xVeraSchmidt/cipher-commodeco.git
cd cipher-commodeco
npm install

# Configure environment
cp env.example .env
# Edit .env with your settings

# Start development
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FHE Layer     │    │   Blockchain    │
│   React + TS    │◄──►│   Zama FHEVM    │◄──►│   Ethereum      │
│   RainbowKit    │    │   Encryption    │    │   Sepolia       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Core Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Encrypted Orders** | All order data is homomorphically encrypted | Complete trading privacy |
| **Order Decryption** | Authorized users can decrypt their own orders | Selective data revelation |
| **Real-time Prices** | Dynamic commodity pricing with volatility simulation | Realistic trading environment |
| **Portfolio Management** | Encrypted position tracking | Private wealth management |

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Git
- Basic understanding of FHE concepts

### Environment Setup
```bash
# Required environment variables
VITE_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_CONTRACT_ADDRESS=deployed_contract_address
```

## 📋 Smart Contract Details

### Contract Address
```
Sepolia: 0x[CONTRACT_ADDRESS]
```

### Key Functions

#### Order Management
```solidity
// Create encrypted order
function createOrder(
    bytes32 encryptedOrderType,
    bytes32 encryptedQuantity,
    bytes32 encryptedPrice,
    bytes32 encryptedCommodityType
) external returns (uint256 orderId);

// Get order data
function getOrder(uint256 orderId) external view returns (address, string memory, uint256);

// Get encrypted order data
function getEncryptedOrderData(uint256 orderId) external view returns (bytes32[5] memory);
```

#### Commodity Management
```solidity
// Create new commodity
function createCommodity(
    string memory symbol,
    string memory name,
    uint256 priceInCents,
    uint256 supply
) external;

// Get commodity info
function getCommodityInfo(string memory symbol) external view returns (string memory, string memory, uint256, bool);
```

## 🔐 FHE Implementation Details

### Encryption Flow
1. **Client-Side Encryption**: User data is encrypted using Zama's FHE SDK
2. **Contract Storage**: Encrypted data is stored on-chain with ACL permissions
3. **Computation**: FHE operations are performed on encrypted data
4. **Decryption**: Only authorized users can decrypt their own data

### Key Data Encryption/Decryption Logic

#### Order Creation (Encryption)
```typescript
// Encrypt order data before sending to contract
const encryptedOrderType = await zamaInstance.encrypt32(orderType);
const encryptedQuantity = await zamaInstance.encrypt32(quantity);
const encryptedPrice = await zamaInstance.encrypt32(price);
const encryptedCommodityType = await zamaInstance.encrypt32(commodityType);

// Store encrypted data on-chain
await contract.createOrder(
    encryptedOrderType,
    encryptedQuantity,
    encryptedPrice,
    encryptedCommodityType
);
```

#### Order Decryption
```typescript
// Retrieve encrypted data from contract
const encryptedData = await contract.getEncryptedOrderData(orderId);

// Decrypt using user's private key and signature
const decryptedData = await zamaInstance.userDecrypt(
    encryptedHandles,
    privateKey,
    signature,
    contractAddresses
);

// Parse decrypted values
const orderData = {
    orderType: Number(decryptedData[0]),
    quantity: Number(decryptedData[1]),
    price: Number(decryptedData[2]),
    commodityType: Number(decryptedData[3])
};
```

### Key Components
- **useZamaInstance**: FHE SDK initialization and management
- **useEthersSigner**: Wallet integration for signing operations
- **Contract Hooks**: Encrypted data interaction with smart contracts
- **ACL Management**: Proper permission handling for data access

### Data Types Used
- `euint32`: For amounts, prices, and numerical values
- `ebool`: For boolean flags (buy/sell, active status)
- `externalEuint32`: For external encrypted inputs
- `bytes32`: For FHE handles and proofs

## 📦 Deployment

### Contract Deployment
```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy

# Verify on Etherscan
npm run verify
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Preview locally
npm run preview
```

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

## 🔄 Price Management System

### Real-time Price Updates
- **Refresh Rate**: Every 60 seconds
- **Volatility Range**: -0.5% to +0.5%
- **Supported Commodities**: GOLD, OIL, WHEAT, COPPER
- **Price Calculation**: `newPrice = basePrice * (1 + volatility)`

### Price Manager Implementation
```typescript
// Price update logic
const updatePriceVolatility = () => {
  Object.keys(globalPrices).forEach(symbol => {
    const commodity = globalPrices[symbol];
    const volatility = (Math.random() - 0.5) * 0.01; // -0.5% to 0.5%
    const newPrice = commodity.basePrice * (1 + volatility);
    
    globalPrices[symbol] = {
      ...commodity,
      currentPrice: newPrice,
      volatility: volatility
    };
  });
};

// Start price updates every 60 seconds
setInterval(updatePriceVolatility, 60000);
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

- **FHE Implementation**: State-of-the-art homomorphic encryption
- **Zero-Knowledge Proofs**: Additional privacy layers
- **Audit Ready**: Smart contracts designed for security audits
- **Open Source**: Transparent and verifiable code

## 🌟 Roadmap

- [ ] Cross-chain FHE operations
- [ ] Advanced trading algorithms
- [ ] Institutional-grade security
- [ ] Mobile application
- [ ] API for third-party integrations

## 🚨 Important Notes

### FHE Requirements
- **CDN Script**: Must include Zama FHE SDK CDN in index.html
- **CORS Headers**: Required for FHE SDK initialization
- **Global Definition**: Vite config must define global as globalThis
- **ACL Permissions**: Proper permission handling is critical for data access

### Best Practices
- Always use `writeContractAsync` instead of `writeContract`
- Implement proper error handling for FHE operations
- Validate FHE handles are 32 bytes before contract calls
- Use BigInt for numerical values to avoid overflow

### Current Implementation Status
- ✅ **FHE Order Encryption**: Orders are encrypted before storage
- ✅ **Order Decryption**: Users can decrypt their own orders
- ✅ **Real-time Pricing**: Dynamic commodity price updates
- ✅ **Mock Data Fallback**: Demonstration data when FHE authorization fails
- ✅ **Responsive UI**: Clean, modern trading interface
- 🔄 **FHE Authorization**: Working on proper ACL permission setup

---

**Built with ❤️ for the future of private trading**