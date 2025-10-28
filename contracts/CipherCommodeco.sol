// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { euint32, euint64, ebool, FHE } from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title CipherCommodecoV2
 * @dev A fully homomorphic encryption (FHE) enabled commodity trading platform
 * @notice This contract implements encrypted trading with Zama FHE SDK
 * @author Cipher Commodeco Team
 */
contract CipherCommodecoV2 is SepoliaConfig {
    using FHE for *;
    
    // Enhanced trading order structure with better FHE support
    struct TradingOrder {
        address trader;
        euint32 orderId;
        euint32 orderType; // 1: Buy, 2: Sell
        euint32 quantity;
        euint32 price; // Price * 100 stored for precision
        euint32 commodityType; // Commodity type numeric representation
        ebool isExecuted;
        uint256 timestamp;
    }
    
    // Enhanced portfolio structure
    struct Portfolio {
        address owner;
        euint64 totalValue; // Encrypted total value
        euint64 totalPnl; // Encrypted total PnL
        euint32 tradeCount; // Encrypted trade count
        ebool isVerified;
        mapping(string => uint256) holdings; // Plaintext holdings for display
    }
    
    // Enhanced market data structure
    struct MarketData {
        string commoditySymbol;
        string commodityName;
        uint256 currentPrice; // Plaintext price for display
        euint64 totalSupply; // Encrypted total supply
        euint64 marketCap; // Encrypted market cap
        bool isActive;
    }
    
    // State variables
    address public owner;
    mapping(string => MarketData) public commodities;
    mapping(uint256 => TradingOrder) public orders;
    mapping(address => Portfolio) public portfolios;
    uint256 public orderCounter;
    string[] public commoditySymbols;
    
    // Events with enhanced logging
    event CommodityCreated(string symbol, string name, uint256 initialPrice);
    event OrderPlaced(uint256 orderId, address trader, string symbol, uint256 quantity, uint256 price);
    event OrderExecuted(uint256 orderId, address trader, string symbol, uint256 quantity, uint256 price);
    event PortfolioUpdated(address trader, uint256 totalValue, uint256 totalPnl);
    event ReputationUpdated(address user, uint32 reputation);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Create commodity (similar to createStock in fantasy-vault-trade)
    function createCommodity(
        string memory _symbol,
        string memory _name,
        uint256 _initialPrice,
        uint256 _totalSupply,
        bytes calldata inputProof
    ) external {
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(_initialPrice > 0, "Price must be positive");
        
        euint64 encryptedSupply = FHE.asEuint64(uint64(_totalSupply));
        euint64 encryptedMarketCap = encryptedSupply.mul(FHE.asEuint64(uint64(_initialPrice)));
        
        commodities[_symbol] = MarketData({
            commoditySymbol: _symbol,
            commodityName: _name,
            currentPrice: _initialPrice,
            totalSupply: encryptedSupply,
            marketCap: encryptedMarketCap,
            isActive: true
        });
        
        commoditySymbols.push(_symbol);
        emit CommodityCreated(_symbol, _name, _initialPrice);
    }
    
    // Place order (encrypted data) - similar to fantasy-vault-trade
    function placeOrder(
        string memory _symbol,
        uint256 _orderType,
        bytes32[5] calldata _encryptedData, // Encrypted order data
        bytes calldata _inputProof
    ) external {
        require(commodities[_symbol].isActive, "Commodity not active");
        require(_orderType == 1 || _orderType == 2, "Invalid order type");
        
        orderCounter++;
        
        orders[orderCounter] = TradingOrder({
            trader: msg.sender,
            orderId: FHE.asEuint32(uint32(orderCounter)),
            orderType: FHE.asEuint32(uint32(_orderType)),
            quantity: FHE.asEuint32(0), // Will be set from encrypted data
            price: FHE.asEuint32(0), // Will be set from encrypted data
            commodityType: FHE.asEuint32(0), // Will be set from encrypted data
            isExecuted: FHE.asEbool(false),
            timestamp: block.timestamp
        });
        
        emit OrderPlaced(orderCounter, msg.sender, _symbol, 0, 0); // Quantity is 0 because encrypted
    }
    
    // Execute order - similar to fantasy-vault-trade
    function executeOrder(
        uint256 _orderId,
        bytes32[5] calldata _encryptedData,
        bytes calldata _inputProof
    ) external onlyOwner {
        require(_orderId <= orderCounter, "Order does not exist");
        // Note: We cannot directly check ebool in require, validation will be done differently
        
        orders[_orderId].isExecuted = FHE.asEbool(true);
        
        // Update portfolio (encrypted data)
        portfolios[orders[_orderId].trader].tradeCount.add(FHE.asEuint32(1));
        
        emit OrderExecuted(_orderId, orders[_orderId].trader, "", 0, 0);
    }
    
    // Get portfolio value (returns encrypted data) - similar to fantasy-vault-trade
    function getPortfolioValue(address _trader) external view returns (euint64, euint64, euint32) {
        Portfolio storage portfolio = portfolios[_trader];
        return (
            portfolio.totalValue,
            portfolio.totalPnl,
            portfolio.tradeCount
        );
    }
    
    // Get commodity holding (plaintext)
    function getCommodityHolding(address _trader, string memory _symbol) external view returns (uint256) {
        return portfolios[_trader].holdings[_symbol];
    }
    
    // Get order information (returns encrypted data) - similar to fantasy-vault-trade
    function getOrderEncryptedData(uint256 _orderId) external view returns (euint32, euint32, euint32, euint32, euint32) {
        TradingOrder storage order = orders[_orderId];
        return (
            order.orderId,
            order.orderType,
            order.quantity,
            order.price,
            order.commodityType
        );
    }
    
    // Update commodity price
    function updateCommodityPrice(string memory _symbol, uint256 _newPrice) external onlyOwner {
        require(commodities[_symbol].isActive, "Commodity not active");
        require(_newPrice > 0, "Price must be positive");
        
        commodities[_symbol].currentPrice = _newPrice;
        // Update encrypted market cap
        commodities[_symbol].marketCap = commodities[_symbol].totalSupply.mul(FHE.asEuint64(uint64(_newPrice)));
    }
    
    // Get commodity information
    function getCommodityInfo(string memory _symbol) external view returns (
        string memory,
        string memory,
        uint256,
        bool
    ) {
        MarketData storage commodity = commodities[_symbol];
        return (
            commodity.commoditySymbol,
            commodity.commodityName,
            commodity.currentPrice,
            commodity.isActive
        );
    }
    
    // Get all commodity symbols
    function getAllCommoditySymbols() external view returns (string[] memory) {
        return commoditySymbols;
    }
    
    // Get order count
    function getOrderCount() external view returns (uint256) {
        return orderCounter;
    }
    
    // Set ACL permissions
    function setACLPermissions(address _user, bool _canTrade) external onlyOwner {
        // ACL permission control logic can be added here
        // Currently simplified implementation
    }
}
