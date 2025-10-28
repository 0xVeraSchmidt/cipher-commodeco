import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useZamaInstance } from '@/hooks/useZamaInstance';
import { useEthersSigner } from '@/hooks/useEthersSigner';

// Contract ABI for CipherCommodecoV2 - Updated to match deployed contract
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "initialPrice", "type": "uint256"}
    ],
    "name": "CommodityCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "trader", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "OrderExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "trader", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "OrderPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "address", "name": "trader", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "totalValue", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalPnl", "type": "uint256"}
    ],
    "name": "PortfolioUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "address", "name": "trader", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "newReputation", "type": "uint256"}
    ],
    "name": "ReputationUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_symbol", "type": "string"},
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "uint256", "name": "_initialPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalSupply", "type": "uint256"},
      {"internalType": "bytes", "name": "inputProof", "type": "bytes"}
    ],
    "name": "createCommodity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_symbol", "type": "string"},
      {"internalType": "uint256", "name": "_orderType", "type": "uint256"},
      {"internalType": "bytes32[5]", "name": "_encryptedData", "type": "bytes32[5]"},
      {"internalType": "bytes", "name": "_inputProof", "type": "bytes"}
    ],
    "name": "placeOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_orderId", "type": "uint256"},
      {"internalType": "bytes32[5]", "name": "_encryptedData", "type": "bytes32[5]"},
      {"internalType": "bytes", "name": "_inputProof", "type": "bytes"}
    ],
    "name": "executeOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_trader", "type": "address"}
    ],
    "name": "getPortfolioValue",
    "outputs": [
      {"internalType": "bytes32", "name": "", "type": "bytes32"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_trader", "type": "address"},
      {"internalType": "string", "name": "_symbol", "type": "string"}
    ],
    "name": "getCommodityHolding",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_orderId", "type": "uint256"}
    ],
    "name": "getOrderEncryptedData",
    "outputs": [
      {"internalType": "bytes32", "name": "", "type": "bytes32"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"},
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_symbol", "type": "string"},
      {"internalType": "uint256", "name": "_newPrice", "type": "uint256"}
    ],
    "name": "updateCommodityPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_symbol", "type": "string"}
    ],
    "name": "getCommodityInfo",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCommoditySymbols",
    "outputs": [
      {"internalType": "string[]", "name": "", "type": "string[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"},
      {"internalType": "bool", "name": "_canTrade", "type": "bool"}
    ],
    "name": "setACLPermissions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "", "type": "string"}
    ],
    "name": "commodities",
    "outputs": [
      {"internalType": "string", "name": "commoditySymbol", "type": "string"},
      {"internalType": "string", "name": "commodityName", "type": "string"},
      {"internalType": "uint256", "name": "currentPrice", "type": "uint256"},
      {"internalType": "bytes32", "name": "totalSupply", "type": "bytes32"},
      {"internalType": "bytes32", "name": "marketCap", "type": "bytes32"},
      {"internalType": "bool", "name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "orders",
    "outputs": [
      {"internalType": "address", "name": "trader", "type": "address"},
      {"internalType": "bytes32", "name": "orderId", "type": "bytes32"},
      {"internalType": "bytes32", "name": "orderType", "type": "bytes32"},
      {"internalType": "bytes32", "name": "quantity", "type": "bytes32"},
      {"internalType": "bytes32", "name": "price", "type": "bytes32"},
      {"internalType": "bytes32", "name": "commodityType", "type": "bytes32"},
      {"internalType": "bool", "name": "isExecuted", "type": "bool"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "orderCounter",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address - should be set via environment variable
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xB08F713B543ba71c53B2673Bd1095E9628F8B9ef';

// Utility function to convert FHE handles to proper format
const convertToBytes32 = (handle: Uint8Array): string => {
  const hex = Array.from(handle)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
};

// 字符串到数字的安全转换 (避免 32位溢出)
const getStringValue = (str: string): number => {
  const first6 = str.substring(0, 6);
  let value = 0;
  for (let i = 0; i < first6.length; i++) {
    value = value * 100 + first6.charCodeAt(i);
  }
  return Math.min(value, 2000000000); // 限制在 32位范围内
};

// Hook for creating encrypted orders with FHE
export function useCreateOrder() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const signer = useEthersSigner();
  
  const createOrder = async (
    symbol: string,
    amount: number,
    price: number,
    isBuy: boolean
  ) => {
    console.log('🚀 Starting encrypted order creation...');
    console.log('📊 Input parameters:', { symbol, amount, price, isBuy, address, hasInstance: !!instance, hasSigner: !!signer });
    
    if (!instance || !address || !signer) {
      const missing = [];
      if (!instance) missing.push('FHE instance');
      if (!address) missing.push('wallet address');
      if (!signer) missing.push('signer');
      throw new Error(`Missing: ${missing.join(', ')}`);
    }

    try {
      console.log('🔄 Step 1: Creating encrypted input...');
      console.log('📊 Contract address:', CONTRACT_ADDRESS);
      console.log('📊 User address:', address);
      
      // Create encrypted input
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      console.log('✅ Step 1 completed: Encrypted input created');
      
      console.log('🔄 Step 2: Adding encrypted data...');
      console.log('📊 Adding orderId:', 1); // Placeholder order ID
      input.add32(BigInt(1)); // Order ID
      
      console.log('📊 Adding orderType:', isBuy ? 1 : 2);
      input.add32(BigInt(isBuy ? 1 : 2)); // Order type
      
      console.log('📊 Adding quantity:', amount);
      input.add32(BigInt(amount)); // Quantity
      
      // Convert price to cents to avoid decimal issues
      const priceInCents = Math.floor(price * 100);
      console.log('📊 Adding price (in cents):', priceInCents);
      input.add32(BigInt(priceInCents)); // Price
      
      // Convert symbol to number
      const symbolValue = getStringValue(symbol);
      console.log('📊 Adding symbol (converted):', symbolValue);
      input.add32(BigInt(symbolValue)); // Commodity type
      
      console.log('✅ Step 2 completed: All data added to encrypted input');
      
      console.log('🔄 Step 3: Encrypting data...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Step 3 completed: Data encrypted successfully');
      console.log('📊 Encrypted handles count:', encryptedInput.handles.length);
      
      console.log('🔄 Step 4: Converting handles to proper format...');
      // Convert handles to proper format
      const handles = encryptedInput.handles.map(convertToBytes32);
      const proof = `0x${Array.from(encryptedInput.inputProof)
        .map(b => b.toString(16).padStart(2, '0')).join('')}`;
      console.log('✅ Step 4 completed: Handles converted');
      console.log('📊 Proof length:', proof.length);
      
      console.log('🔄 Step 5: Calling contract...');
      // Call contract with new ABI format
      const result = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'placeOrder',
        args: [
          symbol,
          BigInt(isBuy ? 1 : 2),
          handles as [string, string, string, string, string],
          proof as `0x${string}`
        ]
      });
      
      console.log('✅ Step 5 completed: Contract call successful');
      console.log('📊 Transaction hash:', result);
      console.log('🎉 Encrypted order creation completed successfully!');
      
      return result;
    } catch (err) {
      console.error('❌ Error creating encrypted order:', err);
      console.error('📊 Error details:', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        inputParams: { symbol, amount, price, isBuy }
      });
      throw err;
    }
  };

  return { createOrder, isPending, error };
}

// Hook for executing orders with FHE
export function useExecuteOrder() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const signer = useEthersSigner();
  
  const executeOrder = async (
    orderId: number,
    amount: number
  ) => {
    if (!instance || !address || !signer) {
      throw new Error('Missing wallet or encryption service');
    }

    try {
      // Create encrypted input for execution amount
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(BigInt(amount));
      
      const encryptedInput = await input.encrypt();
      
      // Convert handles to proper format
      const handles = encryptedInput.handles.map(convertToBytes32);
      const proof = `0x${Array.from(encryptedInput.inputProof)
        .map(b => b.toString(16).padStart(2, '0')).join('')}`;
      
      // Call contract
      const result = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'executeOrder',
        args: [BigInt(orderId), handles[0], proof]
      });
      
      return result;
    } catch (err) {
      console.error('Error executing order:', err);
      throw err;
    }
  };

  return { executeOrder, isPending, error };
}

// Hook for getting all commodity symbols
export function useCommoditySymbols() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getAllCommoditySymbols',
  });

  return {
    symbols: data as string[] | undefined,
    isLoading,
    error,
  };
}

// Hook for getting commodity info
export function useCommodityInfo(symbol: string) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getCommodityInfo',
    args: [symbol],
  });

  return {
    info: data as [string, string, bigint, boolean] | undefined,
    isLoading,
    error,
  };
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

// Hook for decrypting portfolio data
export function useDecryptPortfolioData(traderAddress?: string) {
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const signer = useEthersSigner();
  const trader = traderAddress || address;
  
  const { data: encryptedData, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getPortfolioEncryptedData',
    args: trader ? [trader as `0x${string}`] : undefined
  });

  const decryptPortfolioData = async () => {
    if (!instance || !address || !signer || !encryptedData) {
      throw new Error('Missing required data for decryption');
    }

    try {
      // signer is already available
      
      // Prepare handles for decryption
      const handleContractPairs = [
        { handle: encryptedData[0], contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedData[1], contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedData[2], contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedData[3], contractAddress: CONTRACT_ADDRESS }
      ];

      // Decrypt the data
      const result = await instance.userDecrypt(handleContractPairs);
      
      return {
        totalValue: result[encryptedData[0]]?.toString(),
        profitLoss: result[encryptedData[1]]?.toString(),
        tradeCount: result[encryptedData[2]]?.toString(),
        isVerified: result[encryptedData[3]]
      };
    } catch (err) {
      console.error('Error decrypting portfolio data:', err);
      throw err;
    }
  };

  return { decryptPortfolioData, encryptedData, isLoading, error };
}

// Hook for getting order counter
export function useOrderCounter() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'orderCounter',
  });

  return {
    count: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Hook for getting order data by ID
export function useOrderData(orderId: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'orders',
    args: [BigInt(orderId)],
  });

  return {
    orderData: data as [string, string, string, string, string, string, boolean, bigint] | undefined,
    isLoading,
    error,
  };
}

// Hook for getting order encrypted data by ID
export function useOrderEncryptedData(orderId: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getOrderEncryptedData',
    args: [BigInt(orderId)],
  });

  return {
    encryptedData: data as [string, string, string, string, string] | undefined,
    isLoading,
    error,
  };
}

// Hook for decrypting order data
export function useDecryptOrderData() {
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const signer = useEthersSigner();

  const decryptOrderData = async (orderId: number, encryptedHandles: string[]) => {
    if (!instance || !address || !signer) {
      throw new Error('Missing FHE instance, wallet connection, or signer');
    }

    try {
      console.log('Starting order decryption for order ID:', orderId);
      console.log('Encrypted handles:', encryptedHandles);

      // Create decryption input
      const decryptionInput = instance.createDecryptionInput(CONTRACT_ADDRESS, address);
      
      // Add encrypted handles for decryption
      encryptedHandles.forEach((handle, index) => {
        console.log(`Adding handle ${index}:`, handle);
        decryptionInput.addExternal(handle);
      });

      // Perform decryption
      const decryptionResult = await decryptionInput.decrypt();
      console.log('Decryption result:', decryptionResult);

      // Parse decrypted values
      const decryptedValues = decryptionResult.map((value: any) => {
        if (typeof value === 'bigint') {
          return Number(value);
        }
        return value;
      });

      console.log('Parsed decrypted values:', decryptedValues);

      return {
        orderId: decryptedValues[0] || orderId,
        orderType: decryptedValues[1] || 0, // 0 = buy, 1 = sell
        quantity: decryptedValues[2] || 0,
        price: decryptedValues[3] || 0,
        commodityType: decryptedValues[4] || 0,
        success: true
      };
    } catch (error) {
      console.error('Error decrypting order data:', error);
      throw error;
    }
  };

  return { decryptOrderData };
}
