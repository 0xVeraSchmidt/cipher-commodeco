import { useState, useEffect, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Lock, Plus } from "lucide-react";
import { useMarketData, useCommoditySymbols, useCommodityInfo, useOrderCounter, useOrderData, useOrderEncryptedData, useDecryptOrderData, useUserOrderIds } from "@/lib/contract";
import { useZamaInstance } from "@/hooks/useZamaInstance";
import { usePriceManager } from "@/hooks/usePriceManager";
import { useAccount } from "wagmi";
import { useEthersSigner } from '@/hooks/useEthersSigner';
import OrderForm from "./OrderForm";
import { ethers } from "ethers";
import { createCommodity } from "@/lib/fhe-trading-utils";

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
  
  // Fetch orders from contract
  const { count: orderCount, isLoading: orderCountLoading } = useOrderCounter();
  const { address } = useAccount();
  const { orderIds: userOrderIds, isLoading: userOrderIdsLoading } = useUserOrderIds(address);
  const signer = useEthersSigner();

  // Use user's order IDs if available, otherwise fall back to all orders
  // Only update when userOrderIds actually changes (not on loading state changes)
  const orderIds = useMemo(() => {
    console.log('📊 Order data debug:', {
      userOrderIds,
      userOrderIdsLength: userOrderIds?.length,
      orderCount,
      address
    });
    
    if (userOrderIds && userOrderIds.length > 0) {
      // Convert bigint to number and reverse to show newest first
      const convertedIds = userOrderIds.map(id => Number(id)).reverse();
      console.log('📊 Using user order IDs:', convertedIds);
      return convertedIds;
    }
    // Fallback to all orders (for display purposes)
    const totalOrders = orderCount ? Number(orderCount) : 0;
    if (!totalOrders) {
      console.log('📊 No orders found, returning empty array');
      return [] as number[];
    }
    const fallbackIds = Array.from({ length: totalOrders }, (_, i) => totalOrders - i);
    console.log('📊 Using fallback order IDs:', fallbackIds);
    return fallbackIds;
  }, [userOrderIds, orderCount, address]); // Removed loading states to prevent constant refresh

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

          // For new commodities not in price manager, use default values
          // The actual price will be loaded by CommodityItem component via useCommodityInfo
          commodityData.push({
            symbol,
            name: priceData?.name || `${symbol} Futures`,
            price: priceData?.currentPrice || 0, // Will be overridden by CommodityItem
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Only check availability once when orderData changes from loading to loaded
    useEffect(() => {
      if (!isLoading && !orderData) {
        console.log(`📊 Order ${orderId} not available`);
        setNotAvailable(true);
      }
    }, [isLoading, orderData, orderId]);
    
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
        <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
          Order #{orderId} - Not Available
        </div>
      );
    }
    
    const [trader, symbol, timestamp] = orderData || [] as [string, string, bigint];
    
    if (!trader || !timestamp) {
      return (
        <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
          Order #{orderId} - Data Incomplete
        </div>
      );
    }
    
    // Convert timestamp to readable date
    const orderDate = new Date(Number(timestamp) * 1000);
    
    // Get commodity info for display
    const commoditySymbol = symbol || 'Unknown';
    const commodity = commodities.find(c => c.symbol === commoditySymbol);
    
    const handleDecryptOrder = async () => {
      if (!encryptedData) {
        alert('No encrypted data available for this order');
        return;
      }
      
      setDecrypting(true);
      try {
        const result = await decryptOrderData(orderId, encryptedData);
        console.log('🔍 Decryption result received:', result);
        setDecryptedData(result);
        setShowDecrypted(true);
        setIsDialogOpen(true); // Open dialog after successful decryption
        console.log('✅ Order decrypted successfully, dialog should open:', result);
        console.log('🔍 Dialog state after setting:', { isDialogOpen: true, decryptedData: result });
      } catch (error) {
        console.error('Failed to decrypt order:', error);
        alert('Failed to decrypt order. Please check console for details.');
      } finally {
        setDecrypting(false);
      }
    };
    
    return (
      <>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Order #{orderId}</span>
              <span className="text-xs text-muted-foreground">
                {orderDate.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                FHE Encrypted
              </span>
              <button
                onClick={handleDecryptOrder}
                disabled={decrypting || !encryptedData}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
              >
                {decrypting ? 'Decrypting...' : 'Decrypt Order'}
              </button>
            </div>
          </div>
        </div>

        {/* Decryption Results Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-gold" />
                <span>Order #{orderId} - Decrypted Data</span>
              </DialogTitle>
            </DialogHeader>
            {decryptedData && (
              <div className="space-y-4">
                {console.log('🔍 Rendering decrypted data in dialog:', decryptedData)}
                {decryptedData.isMockData && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <span className="text-sm font-medium">⚠️ Demo Data</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      FHE decryption in development - This is demonstration data
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Symbol:</span>
                      <span className="text-sm font-semibold">{decryptedData.symbol || symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Type:</span>
                      <span className={`text-sm font-semibold ${decryptedData.orderType === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {decryptedData.orderType === 0 ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                      <span className="text-sm font-semibold">{decryptedData.quantity || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Price:</span>
                      <span className="text-sm font-semibold text-gold">${decryptedData.price || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Trader:</span>
                      <span className="text-sm font-mono">{trader.slice(0, 6)}...{trader.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Time:</span>
                      <span className="text-sm">{orderDate.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Data encrypted with FHE technology</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  };

  // Component to display individual commodity with real price
  const CommodityItem = memo(({ commodity }: { commodity: CommodityData }) => {
    const { info, isLoading } = useCommodityInfo(commodity.symbol);
    const priceData = getPrice(commodity.symbol);
    
    // Debug logging for new commodities
    if (!priceData && info) {
      console.log(`📊 Loading contract data for ${commodity.symbol}:`, {
        symbol: info[0],
        name: info[1],
        priceInCents: info[2],
        priceInDollars: Number(info[2]) / 100,
        isActive: info[3]
      });
    }
    
    // Use price manager data or fallback to contract data
    const basePrice = priceData?.basePrice || (info ? Number(info[2]) / 100 : commodity.price);
    const currentPrice = priceData?.currentPrice || (info ? Number(info[2]) / 100 : commodity.price);
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
      if (!signer) {
        alert('Missing signer');
        return;
      }
      
      const priceValue = parseFloat(newCommodity.price);
      console.log('📊 Creating commodity with price:', {
        inputPrice: newCommodity.price,
        parsedPrice: priceValue,
        priceType: typeof priceValue
      });
      
      await createCommodity(
        signer,
        newCommodity.symbol,
        newCommodity.name,
        priceValue,
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

          {/* Orders Section */}
          <Card className="trading-card mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gold">Recent Orders</CardTitle>
                <button
                  onClick={() => {
                    // Force refresh by updating a dummy state
                    setCommodities(prev => [...prev]);
                    console.log('🔄 Manual refresh triggered');
                  }}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  title="Refresh orders manually"
                >
                  🔄 Refresh
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {userOrderIdsLoading || orderCountLoading ? (
                <div className="text-center text-muted-foreground py-4">
                  Loading orders...
                </div>
              ) : orderIds.length > 0 ? (
                orderIds.map((id) => (
                  <ContractOrderItem key={id} orderId={id} />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  {address ? 'No orders found for your account' : 'Please connect wallet to view orders'}
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