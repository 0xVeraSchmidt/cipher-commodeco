import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Lock, Eye, EyeOff } from "lucide-react";
import { useMarketData, usePortfolioInfo, useDecryptPortfolioData, useCommoditySymbols, useCommodityInfo } from "@/lib/contract";
import { useZamaInstance } from "@/hooks/useZamaInstance";
import { useAccount } from "wagmi";
import OrderForm from "./OrderForm";
import { ethers } from "ethers";

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
  const [privacyMode, setPrivacyMode] = useState(true);
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityData | null>(null);
  const [decryptedPortfolio, setDecryptedPortfolio] = useState<any>(null);
  
  // Fetch commodity symbols from contract
  const { symbols, isLoading: symbolsLoading } = useCommoditySymbols();
  
  // Fetch real-time market data from contract
  const { marketData, isLoading: marketLoading } = useMarketData();
  const { portfolioInfo, isLoading: portfolioLoading } = usePortfolioInfo();
  const { decryptPortfolioData } = useDecryptPortfolioData();

  // Load commodities data from contract
  useEffect(() => {
    const loadCommodities = async () => {
      if (!symbols || symbols.length === 0) return;

      const commodityData: CommodityData[] = [];
      
      for (const symbol of symbols) {
        try {
          // For now, we'll use mock data for change and volume since these aren't in the contract
          // In a real implementation, you might want to add these to the contract
          const mockChange = Math.random() * 20 - 10; // Random change between -10 and 10
          const mockChangePercent = Math.random() * 4 - 2; // Random change percent between -2% and 2%
          const mockVolume = `${(Math.random() * 100).toFixed(1)}M`;

          commodityData.push({
            symbol,
            name: `${symbol} Futures`, // Default name
            price: 0, // Will be updated from contract
            isActive: true,
            icon: getCommodityIcon(symbol),
            color: getCommodityColor(symbol),
            change: mockChange,
            changePercent: mockChangePercent,
            volume: mockVolume
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
  }, [symbols, selectedCommodity]);

  // Component to display individual commodity with real price
  const CommodityItem = ({ commodity }: { commodity: CommodityData }) => {
    const { info, isLoading } = useCommodityInfo(commodity.symbol);
    
    const price = info ? parseFloat(ethers.formatEther(info[2])) : commodity.price;
    const name = info ? info[1] : commodity.name;
    const isActive = info ? info[3] : commodity.isActive;

    return (
      <div
        onClick={() => setSelectedCommodity({ ...commodity, price, name, isActive })}
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
              {privacyMode ? "●●●●" : `$${price.toFixed(2)}`}
            </div>
            <div className={`text-xs flex items-center ${
              commodity.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {commodity.changePercent >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {privacyMode ? "●●" : `${commodity.changePercent.toFixed(2)}%`}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{privacyMode ? "●●●●" : commodity.volume}</span>
          <Badge variant="outline" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            FHE
          </Badge>
        </div>
      </div>
    );
  };
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Commodity List */}
        <div className="lg:col-span-1">
          <Card className="trading-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gold">Commodity Markets</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className="border-gold/20"
                >
                  {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
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
                      {privacyMode ? "●●●●" : `$${portfolioInfo[0] || 0}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trade Count:</span>
                    <span className="font-mono text-sm">
                      {privacyMode ? "●●" : portfolioInfo[2] || 0}
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
                      {privacyMode ? "●●●●" : `$${selectedCommodity?.price?.toFixed(2) || '0.00'}`}
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
                    <div>Current Price: {privacyMode ? "●●●●" : marketData[0]}</div>
                    <div>Volume 24h: {privacyMode ? "●●●●" : marketData[1]}</div>
                    <div>Price Change: {privacyMode ? "●●●●" : marketData[2]}</div>
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
                  privacyMode={privacyMode}
                />
                <OrderForm 
                  type="sell" 
                  commodity={selectedCommodity} 
                  privacyMode={privacyMode}
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