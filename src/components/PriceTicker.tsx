import { TrendingUp, TrendingDown } from "lucide-react";

const tickerData = [
  { symbol: "GOLD", price: 1987.45, change: 0.62, icon: "🥇" },
  { symbol: "SILVER", price: 24.33, change: -0.45, icon: "🥈" },
  { symbol: "OIL", price: 73.21, change: -1.94, icon: "🛢️" },
  { symbol: "COPPER", price: 8234.50, change: -0.28, icon: "🔶" },
  { symbol: "WHEAT", price: 645.75, change: 1.40, icon: "🌾" },
  { symbol: "CORN", price: 432.10, change: 0.85, icon: "🌽" },
  { symbol: "PLATINUM", price: 945.80, change: 0.32, icon: "⚪" },
  { symbol: "PALLADIUM", price: 1234.56, change: -2.15, icon: "◯" }
];

const PriceTicker = () => {
  return (
    <div className="bg-secondary/30 border-y border-border overflow-hidden">
      <div className="price-ticker flex items-center space-x-8 py-3 whitespace-nowrap">
        {[...tickerData, ...tickerData].map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center space-x-2 min-w-max">
            <span className="text-lg">{item.icon}</span>
            <span className="font-semibold text-foreground">{item.symbol}</span>
            <span className="font-mono text-sm">${item.price}</span>
            <span className={`flex items-center text-xs ${
              item.change > 0 ? 'text-success' : 'text-destructive'
            }`}>
              {item.change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {item.change > 0 ? '+' : ''}{item.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceTicker;