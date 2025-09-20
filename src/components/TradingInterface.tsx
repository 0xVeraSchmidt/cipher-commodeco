import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Lock, Eye, EyeOff } from "lucide-react";
import { useMarketData, usePortfolioInfo } from "@/lib/contract";
import OrderForm from "./OrderForm";

const commodities = [
  {
    symbol: "GOLD",
    name: "Gold Futures",
    price: 1987.45,
    change: 12.33,
    changePercent: 0.62,
    volume: "24.5M",
    icon: "🥇",
    color: "text-gold"
  },
  {
    symbol: "OIL",
    name: "Crude Oil",
    price: 73.21,
    change: -1.45,
    changePercent: -1.94,
    volume: "89.2M",
    icon: "🛢️",
    color: "text-oil"
  },
  {
    symbol: "WHEAT",
    name: "Wheat Futures",
    price: 645.75,
    change: 8.90,
    changePercent: 1.40,
    volume: "12.1M",
    icon: "🌾",
    color: "text-wheat"
  },
  {
    symbol: "COPPER",
    name: "Copper",
    price: 8234.50,
    change: -23.45,
    changePercent: -0.28,
    volume: "45.8M",
    icon: "🔶",
    color: "text-copper"
  }
];

const TradingInterface = () => {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState(commodities[0]);
  
  // Fetch real-time market data from contract
  const { marketData, isLoading: marketLoading } = useMarketData();
  const { portfolioInfo, isLoading: portfolioLoading } = usePortfolioInfo();

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
              {commodities.map((commodity) => (
                <div
                  key={commodity.symbol}
                  onClick={() => setSelectedCommodity(commodity)}
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-secondary/50 ${
                    selectedCommodity.symbol === commodity.symbol ? 'bg-secondary chart-glow' : ''
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
                          {commodity.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {privacyMode ? "●●●●" : `$${commodity.price}`}
                      </div>
                      <div className={`flex items-center text-xs ${
                        commodity.change > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {commodity.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {privacyMode ? "●●%" : `${commodity.changePercent}%`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <span className="text-2xl">{selectedCommodity.icon}</span>
                  <span className={selectedCommodity.color}>
                    {selectedCommodity.name}
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-gold" />
                  <Badge variant="outline" className="border-gold/20 text-gold">
                    Encrypted
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
                      {privacyMode ? "●●●●" : `$${selectedCommodity.price}`}
                    </span>
                  </div>
                </div>
                {/* Glowing lines for chart effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"></div>
                <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-success to-transparent opacity-40"></div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Controls */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;