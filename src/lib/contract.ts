import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useZamaInstance } from '@/hooks/useZamaInstance';
import { useEthersSigner } from '@/hooks/useEthersSigner';

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
      {"name": "amount", "type": "uint32"},
      {"name": "price", "type": "uint32"},
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
      {"name": "totalValue", "type": "uint32"},
      {"name": "profitLoss", "type": "uint32"},
      {"name": "tradeCount", "type": "uint32"},
      {"name": "isVerified", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketData",
    "outputs": [
      {"name": "currentPrice", "type": "uint32"},
      {"name": "volume24h", "type": "uint32"},
      {"name": "priceChange", "type": "uint32"},
      {"name": "lastUpdate", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "orderId", "type": "uint256"}],
    "name": "getOrderEncryptedData",
    "outputs": [
      {"name": "amountHandle", "type": "bytes32"},
      {"name": "priceHandle", "type": "bytes32"},
      {"name": "isBuyHandle", "type": "bytes32"},
      {"name": "isActiveHandle", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "trader", "type": "address"}],
    "name": "getPortfolioEncryptedData",
    "outputs": [
      {"name": "totalValueHandle", "type": "bytes32"},
      {"name": "profitLossHandle", "type": "bytes32"},
      {"name": "tradeCountHandle", "type": "bytes32"},
      {"name": "isVerifiedHandle", "type": "bytes32"}
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

// Hook for creating encrypted orders with FHE
export function useCreateOrder() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const signer = useEthersSigner();
  
  const createOrder = async (
    amount: number,
    price: number,
    isBuy: boolean
  ) => {
    console.log('🚀 Starting encrypted order creation...');
    console.log('📊 Input parameters:', { amount, price, isBuy, address, hasInstance: !!instance, hasSigner: !!signer });
    
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
      console.log('📊 Adding amount:', amount);
      input.add32(BigInt(amount));
      
      // Convert price to cents to avoid decimal issues
      const priceInCents = Math.floor(price * 100);
      console.log('📊 Adding price (in cents):', priceInCents);
      input.add32(BigInt(priceInCents));
      
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
      // Call contract
      const result = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createOrder',
        args: [handles[0], handles[1], isBuy, proof]
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
        inputParams: { amount, price, isBuy }
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

// Hook for decrypting order data
export function useDecryptOrderData(orderId: number) {
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const signer = useEthersSigner();
  
  const { data: encryptedData, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getOrderEncryptedData',
    args: [BigInt(orderId)]
  });

  const decryptOrderData = async () => {
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
        amount: result[encryptedData[0]]?.toString(),
        price: result[encryptedData[1]]?.toString(),
        isBuy: result[encryptedData[2]],
        isActive: result[encryptedData[3]]
      };
    } catch (err) {
      console.error('Error decrypting order data:', err);
      throw err;
    }
  };

  return { decryptOrderData, encryptedData, isLoading, error };
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

// Hook for getting all commodity symbols
export function useCommoditySymbols() {
  const { data: symbols, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getAllCommoditySymbols'
  });

  return { symbols, isLoading, error };
}

// Hook for getting commodity info by symbol
export function useCommodityInfo(symbol: string) {
  const { data: info, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getCommodityInfo',
    args: [symbol]
  });

  return { info, isLoading, error };
}
