// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { euint32, externalEuint32, euint8, ebool, FHE } from "@fhevm/solidity/lib/FHE.sol";

contract CipherCommodeco is SepoliaConfig {
    using FHE for *;
    
    struct TradingOrder {
        euint32 orderId;
        euint32 amount;
        euint32 price;
        ebool isBuy;
        ebool isActive;
        address trader;
        uint256 timestamp;
    }
    
    struct Portfolio {
        euint32 totalValue;
        euint32 profitLoss;
        euint32 tradeCount;
        ebool isVerified;
        address owner;
    }
    
    struct MarketData {
        euint32 currentPrice;
        euint32 volume24h;
        euint32 priceChange;
        uint256 lastUpdate;
    }
    
    mapping(uint256 => TradingOrder) public orders;
    mapping(address => Portfolio) public portfolios;
    mapping(address => euint32) public userReputation;
    
    MarketData public marketData;
    
    uint256 public orderCounter;
    address public owner;
    address public verifier;
    
    event OrderCreated(uint256 indexed orderId, address indexed trader, bool isBuy);
    event OrderExecuted(uint256 indexed orderId, address indexed buyer, address indexed seller);
    event PortfolioUpdated(address indexed owner, uint32 totalValue);
    event ReputationUpdated(address indexed user, uint32 reputation);
    event MarketDataUpdated(uint32 currentPrice, uint32 volume);
    
    constructor(address _verifier) {
        owner = msg.sender;
        verifier = _verifier;
        
        // Initialize market data
        marketData = MarketData({
            currentPrice: FHE.asEuint32(100), // Initial price
            volume24h: FHE.asEuint32(0),
            priceChange: FHE.asEuint32(0),
            lastUpdate: block.timestamp
        });
    }
    
    function createOrder(
        externalEuint32 amount,
        externalEuint32 price,
        ebool isBuy,
        bytes calldata inputProof
    ) public returns (uint256) {
        require(amount != FHE.asEuint32(0), "Amount cannot be zero");
        require(price != FHE.asEuint32(0), "Price cannot be zero");
        
        uint256 orderId = orderCounter++;
        
        // Convert external encrypted values to internal
        euint32 internalAmount = FHE.fromExternal(amount, inputProof);
        euint32 internalPrice = FHE.fromExternal(price, inputProof);
        
        orders[orderId] = TradingOrder({
            orderId: FHE.asEuint32(orderId),
            amount: internalAmount,
            price: internalPrice,
            isBuy: isBuy,
            isActive: FHE.asEbool(true),
            trader: msg.sender,
            timestamp: block.timestamp
        });
        
        emit OrderCreated(orderId, msg.sender, FHE.decrypt(isBuy));
        return orderId;
    }
    
    function executeOrder(
        uint256 orderId,
        externalEuint32 amount,
        bytes calldata inputProof
    ) public {
        require(orders[orderId].trader != address(0), "Order does not exist");
        require(orders[orderId].isActive, "Order is not active");
        require(orders[orderId].trader != msg.sender, "Cannot execute own order");
        
        euint32 internalAmount = FHE.fromExternal(amount, inputProof);
        
        // Update order status
        orders[orderId].isActive = FHE.asEbool(false);
        
        // Update market data
        marketData.currentPrice = orders[orderId].price;
        marketData.volume24h = FHE.add(marketData.volume24h, internalAmount);
        marketData.lastUpdate = block.timestamp;
        
        // Update portfolios
        _updatePortfolio(orders[orderId].trader, internalAmount, orders[orderId].price, FHE.decrypt(orders[orderId].isBuy));
        _updatePortfolio(msg.sender, internalAmount, orders[orderId].price, !FHE.decrypt(orders[orderId].isBuy));
        
        emit OrderExecuted(orderId, msg.sender, orders[orderId].trader);
        emit MarketDataUpdated(FHE.decrypt(orders[orderId].price), FHE.decrypt(internalAmount));
    }
    
    function _updatePortfolio(
        address trader,
        euint32 amount,
        euint32 price,
        bool isBuy
    ) internal {
        Portfolio storage portfolio = portfolios[trader];
        
        if (portfolio.owner == address(0)) {
            portfolio.owner = trader;
            portfolio.totalValue = FHE.asEuint32(0);
            portfolio.profitLoss = FHE.asEuint32(0);
            portfolio.tradeCount = FHE.asEuint32(0);
            portfolio.isVerified = FHE.asEbool(false);
        }
        
        euint32 tradeValue = FHE.mul(amount, price);
        
        if (isBuy) {
            portfolio.totalValue = FHE.add(portfolio.totalValue, tradeValue);
        } else {
            portfolio.totalValue = FHE.sub(portfolio.totalValue, tradeValue);
        }
        
        portfolio.tradeCount = FHE.add(portfolio.tradeCount, FHE.asEuint32(1));
        
        emit PortfolioUpdated(trader, FHE.decrypt(portfolio.totalValue));
    }
    
    function updateReputation(address user, euint32 reputation) public {
        require(msg.sender == verifier, "Only verifier can update reputation");
        require(user != address(0), "Invalid user address");
        
        userReputation[user] = reputation;
        emit ReputationUpdated(user, FHE.decrypt(reputation));
    }
    
    function verifyPortfolio(address trader, ebool isVerified) public {
        require(msg.sender == verifier, "Only verifier can verify portfolios");
        require(portfolios[trader].owner != address(0), "Portfolio does not exist");
        
        portfolios[trader].isVerified = isVerified;
    }
    
    function getOrderInfo(uint256 orderId) public view returns (
        uint8 amount,
        uint8 price,
        bool isBuy,
        bool isActive,
        address trader,
        uint256 timestamp
    ) {
        TradingOrder storage order = orders[orderId];
        return (
            FHE.decrypt(order.amount),
            FHE.decrypt(order.price),
            FHE.decrypt(order.isBuy),
            FHE.decrypt(order.isActive),
            order.trader,
            order.timestamp
        );
    }
    
    function getPortfolioInfo(address trader) public view returns (
        uint8 totalValue,
        uint8 profitLoss,
        uint8 tradeCount,
        bool isVerified
    ) {
        Portfolio storage portfolio = portfolios[trader];
        return (
            FHE.decrypt(portfolio.totalValue),
            FHE.decrypt(portfolio.profitLoss),
            FHE.decrypt(portfolio.tradeCount),
            FHE.decrypt(portfolio.isVerified)
        );
    }
    
    function getMarketData() public view returns (
        uint8 currentPrice,
        uint8 volume24h,
        uint8 priceChange,
        uint256 lastUpdate
    ) {
        return (
            FHE.decrypt(marketData.currentPrice),
            FHE.decrypt(marketData.volume24h),
            FHE.decrypt(marketData.priceChange),
            marketData.lastUpdate
        );
    }
    
    function getUserReputation(address user) public view returns (uint8) {
        return FHE.decrypt(userReputation[user]);
    }
    
    function withdrawFunds(uint256 amount) public {
        require(portfolios[msg.sender].owner != address(0), "Portfolio does not exist");
        require(portfolios[msg.sender].isVerified, "Portfolio must be verified");
        
        // Transfer funds to trader
        // Note: In a real implementation, funds would be transferred based on decrypted amount
        portfolios[msg.sender].totalValue = FHE.sub(portfolios[msg.sender].totalValue, FHE.asEuint32(amount));
    }
}
