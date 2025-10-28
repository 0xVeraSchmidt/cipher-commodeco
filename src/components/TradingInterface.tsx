import { useState, useEffect, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Lock, Plus } from "lucide-react";
import { useMarketData, usePortfolioInfo, useDecryptPortfolioData, useCommoditySymbols, useCommodityInfo, useOrderCounter, useOrderData, useOrderEncryptedData, useDecryptOrderData } from "@/lib/contract";
import { useZamaInstance } from "@/hooks/useZamaInstance";
import { usePriceManager } from "@/hooks/usePriceManager";
import { useAccount } from "wagmi";
import OrderForm from "./OrderForm";
import { ethers } from "ethers";
import { createCommodity } from "@/lib/fhe-trading-utils";
import { Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

// Commodity icon mapping
const getCommodityIcon = (symbol: string) => {
  const icons: { [key: string]: string } = {
    'GOLD': '🥇',
    'OIL': '🛢️',
    'WHEAT': '🌾',
    'COPPER': '🔶'
  };
  return icons[symbol] || '📦';
};

// Commodity color mapping
const getCommodityColor = (symbol: string) => {
  const colors: { [key: string]: string } = {
    'GOLD': 'text-gold',
    'OIL': 'text-oil',
    'WHEAT': 'text-wheat',
    'COPPER': 'text-copper'
  };
  return colors[symbol] || 'text-gray-600';
};

interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  isActive: boolean;
  icon: string;
  color: string;
  change: number;
  changePercent: number;
  volume: string;
}

const TradingInterface = () => {
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityData | null>(null);
  const [decryptedPortfolio, setDecryptedPortfolio] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCommodity, setNewCommodity] = useState({
    symbol: '',
    name: '',
    price: '',
    supply: ''
  });
  
  // Use price manager for synchronized price updates
  const { prices, getPrice, getAllPrices } = usePriceManager();
  
  // Fetch commodity symbols from contract
  const { symbols, isLoading: symbolsLoading } = useCommoditySymbols();
  
  // Fetch real-time market data from contract
  const { marketData, isLoading: marketLoading } = useMarketData();
  const { portfolioInfo, isLoading: portfolioLoading } = usePortfolioInfo();
  const { decryptPortfolioData } = useDecryptPortfolioData();
  
  // Fetch orders from contract
  const { count: orderCount, isLoading: orderCountLoading } = useOrderCounter();

  // Stable computed order id list (newest first), contract ids start from 1
  const totalOrders = orderCount ? Number(orderCount) : 0;
  const orderIds = useMemo(() => {
    if (!totalOrders) return [] as number[];
    return Array.from({ length: totalOrders }, (_, i) => totalOrders - i);
  }, [totalOrders]);

  // Load commodities data from contract (only when symbols change)
  useEffect(() => {
    const loadCommodities = async () => {
      if (!symbols || symbols.length === 0) return;

      const commodityData: CommodityData[] = [];
      
      // Fixed volume data for each commodity
      const volumeMap: { [key: string]: string } = {
        'GOLD': '24.5M',
        'OIL': '81.8M', 
        'WHEAT': '0.3M',
        'COPPER': '95.7M'
      };
      
      for (const symbol of symbols) {
        try {
          const priceData = getPrice(symbol);
          const volume = volumeMap[symbol] || '1.0M'; // Default volume if not found

          commodityData.push({
            symbol,
            name: priceData?.name || `${symbol} Futures`,
            price: priceData?.currentPrice || 0,
            isActive: true,
            icon: priceData?.icon || getCommodityIcon(symbol),
            color: priceData?.color || getCommodityColor(symbol),
            change: priceData ? (priceData.currentPrice - priceData.basePrice) : 0,
            changePercent: priceData ? (priceData.volatility * 100) : 0,
            volume: volume
          });
        } catch (error) {
          console.error(`Error loading commodity ${symbol}:`, error);
        }
      }

      setCommodities(commodityData);
      if (commodityData.length > 0 && !selectedCommodity) {
        setSelectedCommodity(commodityData[0]);
      }
    };

    loadCommodities();
  }, [symbols]); // Remove prices dependency to prevent infinite loop

  // Update selected commodity when prices change
  useEffect(() => {
    if (selectedCommodity) {
      const updatedPrice = getPrice(selectedCommodity.symbol);
      if (updatedPrice) {
        setSelectedCommodity(prev => prev ? {
          ...prev,
          price: updatedPrice.currentPrice,
          change: updatedPrice.currentPrice - updatedPrice.basePrice,
          changePercent: updatedPrice.volatility * 100
        } : null);
      }
    }
  }, [prices]); // Remove selectedCommodity dependency to prevent infinite loop

  // Component to display contract order data
  const ContractOrderItem = ({ orderId }: { orderId: number }) => {
    const { orderData, isLoading } = useOrderData(orderId);
    const { encryptedData, isLoading: encryptedLoading } = useOrderEncryptedData(orderId);
    const { decryptOrderData } = useDecryptOrderData();
    const [decryptedData, setDecryptedData] = useState<any>(null);
    const [decrypting, setDecrypting] = useState(false);
    const [showDecrypted, setShowDecrypted] = useState(false);
    const [notAvailable, setNotAvailable] = useState(false);
    
    useEffect(() => {
      // 若contract返回空结构（常见于未存在的id），打标示
      if (!orderData && !isLoading) {
        setNotAvailable(true);
      }
    }, [orderData, isLoading]);
    
    if (isLoading) {
      return (
        <div className="p-3 bg-muted rounded-md animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      );
    }

    if (!orderData && notAvailable) {
      return (
        <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">not available</div>
      );
    }
    
    const [trader, orderIdBytes, orderTypeBytes, quantityBytes, priceBytes, commodityTypeBytes, isExecuted, timestamp] = orderData || [] as any;
    
    // Convert timestamp to readable date
    const orderDate = new Date(Number(timestamp) * 1000);
    
    // Get commodity info for display
    const commoditySymbol = commodityTypeBytes ? ethers.toUtf8String(commodityTypeBytes) : 'Unknown';
    const commodity = commodities.find(c => c.symbol === commoditySymbol);
    
    const handleDecryptOrder = async () => {
      if (!encryptedData) {
        alert('No encrypted data available for this order');
        return;
      }
      
      setDecrypting(true);
      try {
        const result = await decryptOrderData(orderId, encryptedData);
        setDecryptedData(result);
        setShowDecrypted(true);
        console.log('Order decrypted successfully:', result);
      } catch (error) {
        console.error('Failed to decrypt order:', error);
        alert('Failed to decrypt order. Please check console for details.');
      } finally {
        setDecrypting(false);
      }
    };
    
    return (
      <div className="p-3 bg-muted rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{commodity?.icon || '📦'}</span>
            <span className="font-semibold">{commoditySymbol}</span>
            <Badge variant={isExecuted ? 'default' : 'secondary'}>
              {isExecuted ? 'EXECUTED' : 'PENDING'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {orderDate.toLocaleTimeString()}
          </span>
        </div>
        
        {!showDecrypted ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Trader: {trader.slice(0, 6)}...{trader.slice(-4)}</div>
            <div>Order ID: {orderId}</div>
            <div>Type: {orderTypeBytes ? ethers.toUtf8String(orderTypeBytes) : 'Unknown'}</div>
            <div>Status: {isExecuted ? 'Completed' : 'Pending'}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-green-600">Decrypted Order Data:</div>
            <div className="grid grid-cols-2 gap-2 text-sm bg-green-50 p-2 rounded">
              <div>Order ID: {decryptedData?.orderId || 'N/A'}</div>
              <div>Type: {decryptedData?.orderType === 0 ? 'BUY' : 'SELL'}</div>
              <div>Quantity: {decryptedData?.quantity || 'N/A'}</div>
              <div>Price: ${decryptedData?.price || 'N/A'}</div>
              <div>Commodity Type: {decryptedData?.commodityType || 'N/A'}</div>
              <div>Total Value: ${decryptedData?.quantity && decryptedData?.price ? (decryptedData.quantity * decryptedData.price).toFixed(2) : 'N/A'}</div>
            </div>
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            FHE Encrypted
          </Badge>
          <div className="flex space-x-2">
            {!showDecrypted ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDecryptOrder}
                disabled={decrypting || encryptedLoading}
              >
                {decrypting ? 'Decrypting...' : 'Decrypt Order'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDecrypted(false)}
              >
                Hide Details
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Component to display individual commodity with real price
  const CommodityItem = memo(({ commodity }: { commodity: CommodityData }) => {
    const { info, isLoading } = useCommodityInfo(commodity.symbol);
    const priceData = getPrice(commodity.symbol);
    
    // Use price manager data or fallback to contract data
    const basePrice = priceData?.basePrice || (info ? parseFloat(ethers.formatEther(info[2])) : commodity.price);
    const currentPrice = priceData?.currentPrice || commodity.price;
    const volatility = priceData?.volatility || 0;
    const name = priceData?.name || (info ? info[1] : commodity.name);
    const isActive = info ? info[3] : commodity.isActive;

    return (
      <div
        onClick={() => setSelectedCommodity({ ...commodity, price: currentPrice, name, isActive })}
        className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-secondary/50 ${
          selectedCommodity?.symbol === commodity.symbol ? 'bg-secondary chart-glow' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{commodity.icon}</span>
            <div>
              <div className={`font-semibold ${commodity.color}`}>
                {commodity.symbol}
              </div>
              <div className="text-xs text-muted-foreground">
                {name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`text-xs flex items-center ${
              volatility >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {volatility >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              ${(volatility * 100).toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{commodity.volume}</span>
          <Badge variant="outline" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            FHE
          </Badge>
        </div>
      </div>
    );
  });
  const { instance } = useZamaInstance();
  const { address } = useAccount();

  const handleDecryptPortfolio = async () => {
    if (!instance || !address) {
      alert('Please connect your wallet to decrypt portfolio data');
      return;
    }

    try {
      const decrypted = await decryptPortfolioData();
      setDecryptedPortfolio(decrypted);
    } catch (error) {
      console.error('Failed to decrypt portfolio:', error);
      alert('Failed to decrypt portfolio data');
    }
  };

  const handleCreateCommodity = async () => {
    if (!instance || !address) {
      alert('Please connect your wallet to create commodities');
      return;
    }

    if (!newCommodity.symbol || !newCommodity.name || !newCommodity.price || !newCommodity.supply) {
      alert('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, await instance.getSigner());
      await createCommodity(
        contract,
        newCommodity.symbol,
        newCommodity.name,
        parseFloat(newCommodity.price),
        parseInt(newCommodity.supply)
      );
      
      setShowCreateDialog(false);
      setNewCommodity({ symbol: '', name: '', price: '', supply: '' });
      alert('Commodity created successfully!');
      
      // Reload commodities
      window.location.reload();
    } catch (error) {
      console.error('Failed to create commodity:', error);
      alert('Failed to create commodity');
    } finally {
      setCreating(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Commodity List */}
        <div className="lg:col-span-1">
          <Card className="trading-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gold">Commodity Markets</CardTitle>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gold/20">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Commodity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="symbol">Symbol</Label>
                        <Input
                          id="symbol"
                          value={newCommodity.symbol}
                          onChange={(e) => setNewCommodity({...newCommodity, symbol: e.target.value})}
                          placeholder="e.g., SILVER"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newCommodity.name}
                          onChange={(e) => setNewCommodity({...newCommodity, name: e.target.value})}
                          placeholder="e.g., Silver Futures"
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Initial Price (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newCommodity.price}
                          onChange={(e) => setNewCommodity({...newCommodity, price: e.target.value})}
                          placeholder="e.g., 25.50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supply">Total Supply</Label>
                        <Input
                          id="supply"
                          type="number"
                          value={newCommodity.supply}
                          onChange={(e) => setNewCommodity({...newCommodity, supply: e.target.value})}
                          placeholder="e.g., 1000000"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateCommodity} 
                        disabled={creating}
                        className="w-full"
                      >
                        {creating ? 'Creating...' : 'Create Commodity'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {symbolsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading commodities...</p>
                </div>
              ) : commodities.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No commodities found</p>
                </div>
              ) : (
                commodities.map((commodity) => (
                  <CommodityItem key={commodity.symbol} commodity={commodity} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          <Card className="trading-card mt-6">
            <CardHeader>
              <CardTitle className="text-gold">Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolioLoading ? (
                <div className="text-center text-muted-foreground">
                  Loading portfolio...
                </div>
              ) : portfolioInfo ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Value:</span>
                    <span className="font-mono text-sm">
                      ${portfolioInfo[0] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trade Count:</span>
                    <span className="font-mono text-sm">
                      {portfolioInfo[2] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Verified:</span>
                    <span className="font-mono text-sm">
                      {portfolioInfo[3] ? "Yes" : "No"}
                    </span>
                  </div>
                  
                  {instance && address && (
                    <Button 
                      onClick={handleDecryptPortfolio}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                    >
                      Decrypt Portfolio
                    </Button>
                  )}
                  
                  {decryptedPortfolio && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <div className="text-sm font-semibold mb-2">Decrypted Data:</div>
                      <div className="space-y-1 text-xs">
                        <div>Total Value: {decryptedPortfolio.totalValue}</div>
                        <div>Profit/Loss: {decryptedPortfolio.profitLoss}</div>
                        <div>Trade Count: {decryptedPortfolio.tradeCount}</div>
                        <div>Verified: {decryptedPortfolio.isVerified ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No portfolio data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Section */}
          <Card className="trading-card mt-6">
            <CardHeader>
              <CardTitle className="text-gold">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderCountLoading ? (
                <div className="text-center text-muted-foreground py-4">
                  Loading orders...
                </div>
              ) : orderIds.length > 0 ? (
                orderIds.map((id) => (
                  <ContractOrderItem key={id} orderId={id} />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No orders yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart and Trading */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Area */}
          <Card className="trading-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">{selectedCommodity?.icon || '📦'}</span>
                  <span className={selectedCommodity?.color || 'text-gray-600'}>
                    {selectedCommodity?.name || 'Select Commodity'}
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-gold" />
                  <Badge variant="outline" className="border-gold/20 text-gold">
                    FHE Encrypted
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock Chart */}
              <div className="h-64 bg-gradient-to-br from-muted/20 to-secondary/20 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 circuit-pattern"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="chart-glow bg-gold/10 rounded-full w-32 h-32 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gold">
                      ${selectedCommodity?.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                {/* Glowing lines for chart effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"></div>
                <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-success to-transparent opacity-40"></div>
              </div>
              
              {/* Market Data from Contract */}
              {marketData && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <div className="text-sm font-semibold mb-2">Contract Market Data:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Current Price: {marketData[0]}</div>
                    <div>Volume 24h: {marketData[1]}</div>
                    <div>Price Change: {marketData[2]}</div>
                    <div>Last Update: {new Date(Number(marketData[3]) * 1000).toLocaleTimeString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trading Controls */}
          <div className="grid grid-cols-2 gap-4">
            {selectedCommodity ? (
              <>
                <OrderForm 
                  type="buy" 
                  commodity={selectedCommodity} 
                />
                <OrderForm 
                  type="sell" 
                  commodity={selectedCommodity} 
                />
              </>
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Please select a commodity to start trading
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;