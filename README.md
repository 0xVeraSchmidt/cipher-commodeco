# 🔐 Cipher Commodeco

> **Next-Generation Privacy-Preserving Commodity Trading Platform**

Experience the future of decentralized trading with **Fully Homomorphic Encryption (FHE)** technology. Trade commodities with complete privacy while maintaining full transparency where it matters.

## ✨ What Makes Us Different

### 🛡️ **Zero-Knowledge Trading**
- Your trading strategies remain completely private
- Market makers cannot front-run your orders
- Portfolio positions are encrypted until settlement

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
| **Private Portfolios** | Portfolio values encrypted until withdrawal | No position exposure |
| **Reputation System** | Trust scores calculated on encrypted data | Fair reputation without revealing history |
| **Market Analytics** | Real-time data with privacy guarantees | Informed decisions without data leakage |

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

### Smart Contract Features
- **Order Management**: Encrypted order creation and execution
- **Portfolio Tracking**: Private position management
- **Reputation System**: Trust-based trading with encrypted scores
- **Market Data**: Encrypted price feeds and analytics

## 🔐 FHE Implementation Details

### Encryption Flow
1. **Client-Side Encryption**: User data is encrypted using Zama's FHE SDK
2. **Contract Storage**: Encrypted data is stored on-chain with ACL permissions
3. **Computation**: FHE operations are performed on encrypted data
4. **Decryption**: Only authorized users can decrypt their own data

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

---

**Built with ❤️ for the future of private trading**
# Test push
