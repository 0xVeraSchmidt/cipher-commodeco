import { useState, useEffect, useRef } from 'react';

// 全局价格状态管理
interface CommodityPrice {
  symbol: string;
  basePrice: number;
  currentPrice: number;
  volatility: number;
  name: string;
  icon: string;
  color: string;
}

let globalPrices: Record<string, CommodityPrice> = {};
let priceUpdateInterval: NodeJS.Timeout | null = null;
let listeners: Set<() => void> = new Set();

// 初始化商品价格
const initializePrices = () => {
  const commodities = [
    { symbol: 'GOLD', name: 'Gold Futures', basePrice: 1987.45, icon: '🥇', color: 'text-yellow-600' },
    { symbol: 'OIL', name: 'Crude Oil', basePrice: 73.21, icon: '🛢️', color: 'text-blue-600' },
    { symbol: 'WHEAT', name: 'Wheat Futures', basePrice: 645.75, icon: '🌾', color: 'text-green-600' },
    { symbol: 'COPPER', name: 'Copper', basePrice: 8234.5, icon: '🔶', color: 'text-orange-600' }
  ];

  commodities.forEach(commodity => {
    globalPrices[commodity.symbol] = {
      ...commodity,
      currentPrice: commodity.basePrice,
      volatility: 0
    };
  });
};

// 更新价格波动
const updatePriceVolatility = () => {
  Object.keys(globalPrices).forEach(symbol => {
    const commodity = globalPrices[symbol];
    // 生成-0.5%到0.5%的波动
    const volatility = (Math.random() - 0.5) * 0.01; // -0.5% to 0.5%
    const newPrice = commodity.basePrice * (1 + volatility);
    
    globalPrices[symbol] = {
      ...commodity,
      currentPrice: newPrice,
      volatility: volatility
    };
  });

  // 通知所有监听器
  listeners.forEach(listener => listener());
};

// 启动价格更新
const startPriceUpdates = () => {
  if (priceUpdateInterval) return;
  
  priceUpdateInterval = setInterval(updatePriceVolatility, 30000); // 每30秒更新
};

// 停止价格更新
const stopPriceUpdates = () => {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
};

export function usePriceManager() {
  const [prices, setPrices] = useState<Record<string, CommodityPrice>>(globalPrices);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // 初始化价格
    if (Object.keys(globalPrices).length === 0) {
      initializePrices();
      setPrices({ ...globalPrices });
    }

    // 添加监听器
    const listener = () => {
      if (mountedRef.current) {
        setPrices({ ...globalPrices });
      }
    };
    
    listeners.add(listener);

    // 启动价格更新
    startPriceUpdates();

    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
      
      // 如果没有监听器了，停止价格更新
      if (listeners.size === 0) {
        stopPriceUpdates();
      }
    };
  }, []);

  return {
    prices,
    getPrice: (symbol: string) => globalPrices[symbol] || null,
    getAllPrices: () => Object.values(globalPrices)
  };
}
