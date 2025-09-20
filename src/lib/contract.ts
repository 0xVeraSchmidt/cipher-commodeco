import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';

// Contract ABI for CipherCommodeco
export const CONTRACT_ABI = [
  {
    "inputs": [
      {"name": "amount", "type": "bytes", "internalType": "externalEuint32"},
      {"name": "price", "type": "bytes", "internalType": "externalEuint32"},
      {"name": "isBuy", "type": "bool", "internalType": "ebool"},
      {"name": "inputProof", "type": "bytes", "internalType": "bytes"}
    ],
    "name": "createOrder",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "orderId", "type": "uint256"},
      {"name": "amount", "type": "bytes", "internalType": "externalEuint32"},
      {"name": "inputProof", "type": "bytes", "internalType": "bytes"}
    ],
    "name": "executeOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "orderId", "type": "uint256"}],
    "name": "getOrderInfo",
    "outputs": [
      {"name": "amount", "type": "uint8"},
      {"name": "price", "type": "uint8"},
      {"name": "isBuy", "type": "bool"},
      {"name": "isActive", "type": "bool"},
      {"name": "trader", "type": "address"},
      {"name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "trader", "type": "address"}],
    "name": "getPortfolioInfo",
    "outputs": [
      {"name": "totalValue", "type": "uint8"},
      {"name": "profitLoss", "type": "uint8"},
      {"name": "tradeCount", "type": "uint8"},
      {"name": "isVerified", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketData",
    "outputs": [
      {"name": "currentPrice", "type": "uint8"},
      {"name": "volume24h", "type": "uint8"},
      {"name": "priceChange", "type": "uint8"},
      {"name": "lastUpdate", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address - should be set via environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Hook for creating encrypted orders
export function useCreateOrder() {
  const { writeContract, isPending, error } = useWriteContract();
  
  const createOrder = async (
    amount: number,
    price: number,
    isBuy: boolean,
    encryptedData: string
  ) => {
    try {
      // Convert to FHE format (this would typically involve FHE encryption)
      const encryptedAmount = new TextEncoder().encode(encryptedData);
      const encryptedPrice = new TextEncoder().encode(encryptedData);
      
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createOrder',
        args: [encryptedAmount, encryptedPrice, isBuy, '0x00']
      });
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  return { createOrder, isPending, error };
}

// Hook for executing orders
export function useExecuteOrder() {
  const { writeContract, isPending, error } = useWriteContract();
  
  const executeOrder = async (
    orderId: number,
    amount: number,
    encryptedData: string
  ) => {
    try {
      const encryptedAmount = new TextEncoder().encode(encryptedData);
      
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'executeOrder',
        args: [BigInt(orderId), encryptedAmount, '0x00']
      });
    } catch (err) {
      console.error('Error executing order:', err);
    }
  };

  return { executeOrder, isPending, error };
}

// Hook for reading order information
export function useOrderInfo(orderId: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getOrderInfo',
    args: [BigInt(orderId)]
  });

  return { orderInfo: data, isLoading, error };
}

// Hook for reading portfolio information
export function usePortfolioInfo(traderAddress?: string) {
  const { address } = useAccount();
  const trader = traderAddress || address;
  
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getPortfolioInfo',
    args: trader ? [trader as `0x${string}`] : undefined
  });

  return { portfolioInfo: data, isLoading, error };
}

// Hook for reading market data
export function useMarketData() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getMarketData'
  });

  return { marketData: data, isLoading, error };
}

// Utility function for FHE encryption simulation
export function encryptTradingData(data: {
  amount: number;
  price: number;
  timestamp: number;
}): string {
  // In a real implementation, this would use FHE encryption
  // For now, we'll simulate with base64 encoding
  const dataString = JSON.stringify(data);
  return btoa(dataString);
}

// Utility function for FHE decryption simulation
export function decryptTradingData(encryptedData: string): {
  amount: number;
  price: number;
  timestamp: number;
} {
  // In a real implementation, this would use FHE decryption
  // For now, we'll simulate with base64 decoding
  const dataString = atob(encryptedData);
  return JSON.parse(dataString);
}
