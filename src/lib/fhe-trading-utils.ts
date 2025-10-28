import { Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';

// FHE Handle 转换工具 - 参考fantasy-vault-trade
export const convertToBytes32 = (handle: any): string => {
  let hex = '';
  if (handle instanceof Uint8Array) {
    hex = `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  } else if (typeof handle === 'string') {
    hex = handle.startsWith('0x') ? handle : `0x${handle}`;
  } else if (Array.isArray(handle)) {
    hex = `0x${handle.map(b => b.toString(16).padStart(2, '0')).join('')}`;
  } else {
    hex = `0x${handle.toString()}`;
  }
  
  // 确保恰好 32 字节 (66 字符包含 0x)
  if (hex.length < 66) {
    hex = hex.padEnd(66, '0');
  } else if (hex.length > 66) {
    hex = hex.substring(0, 66);
  }
  return hex;
};

// 字符串到数字的安全转换 (避免 32位溢出) - 参考fantasy-vault-trade
export const getStringValue = (str: string): number => {
  const first6 = str.substring(0, 6);
  let value = 0;
  for (let i = 0; i < first6.length; i++) {
    value = value * 100 + first6.charCodeAt(i);
  }
  return Math.min(value, 2000000000); // 限制在 32位范围内
};

// 数字到字符串的反向转换 - 参考fantasy-vault-trade
export const getStringDescription = (value: number): string => {
  let result = '';
  let num = value;
  while (num > 0 && result.length < 6) {
    const charCode = num % 100;
    if (charCode >= 32 && charCode <= 126) {
      result = String.fromCharCode(charCode) + result;
    }
    num = Math.floor(num / 100);
  }
  return result ? `${result}...` : 'Unknown';
};

// 加密交易订单 - 增强版本，参考fantasy-vault-trade
export const encryptTradingOrder = async (
  instance: any,
  userAddress: string,
  orderData: {
    commoditySymbol: string;
    quantity: number;
    price: number;
    orderType: number; // 1: Buy, 2: Sell
    orderId: number;
  }
) => {
  try {
    console.log('🚀 Starting FHE encryption process...');
    console.log('📊 Input data:', {
      contractAddress: CONTRACT_ADDRESS,
      userAddress,
      orderData
    });
    
    console.log('🔄 Step 1: Creating encrypted input...');
    const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
    console.log('✅ Step 1 completed: Encrypted input created');
    
    console.log('🔄 Step 2: Adding encrypted data...');
    
    // 验证所有值都在32位范围内
    const max32Bit = 4294967295; // 2^32 - 1
    
    console.log('📊 Adding orderId:', orderData.orderId);
    if (orderData.orderId > max32Bit) {
      throw new Error(`Order ID ${orderData.orderId} exceeds 32-bit limit`);
    }
    input.add32(BigInt(orderData.orderId)); // 订单ID
    
    console.log('📊 Adding orderType:', orderData.orderType);
    if (orderData.orderType > max32Bit) {
      throw new Error(`Order type ${orderData.orderType} exceeds 32-bit limit`);
    }
    input.add32(BigInt(orderData.orderType)); // 订单类型
    
    console.log('📊 Adding quantity:', orderData.quantity);
    if (orderData.quantity > max32Bit) {
      throw new Error(`Quantity ${orderData.quantity} exceeds 32-bit limit`);
    }
    input.add32(BigInt(orderData.quantity)); // 数量
    
    const priceInCents = Math.floor(orderData.price * 100);
    console.log('📊 Adding price (in cents):', priceInCents);
    if (priceInCents > max32Bit) {
      throw new Error(`Price ${priceInCents} exceeds 32-bit limit`);
    }
    input.add32(BigInt(priceInCents)); // 价格 (转换为整数)
    
    const commoditySymbolValue = getStringValue(orderData.commoditySymbol);
    console.log('📊 Adding commoditySymbol (converted):', commoditySymbolValue);
    if (commoditySymbolValue > max32Bit) {
      throw new Error(`Commodity symbol value ${commoditySymbolValue} exceeds 32-bit limit`);
    }
    input.add32(BigInt(commoditySymbolValue)); // 商品代码
    
    console.log('✅ Step 2 completed: All data added to encrypted input');
    
    console.log('🔄 Step 3: Encrypting data...');
    const encryptedInput = await input.encrypt();
    console.log('✅ Step 3 completed: Data encrypted successfully');
    console.log('📊 Encrypted handles count:', encryptedInput.handles.length);
    
    console.log('🔄 Step 4: Converting handles to hex format...');
    const handles = encryptedInput.handles.map((handle, index) => {
      const hex = convertToBytes32(handle);
      console.log(`📊 Handle ${index}: ${hex.substring(0, 10)}... (${hex.length} chars)`);
      return hex;
    });
    
    const proof = `0x${Array.from(encryptedInput.inputProof)
      .map((b: number) => b.toString(16).padStart(2, '0')).join('')}`;
    console.log('📊 Proof length:', proof.length);
    
    console.log('🎉 Encryption completed successfully!');
    console.log('📊 Final result:', {
      handlesCount: handles.length,
      proofLength: proof.length,
      handles: handles.map(h => h.substring(0, 10) + '...')
    });
    
    return { handles, proof };
  } catch (error) {
    console.error('❌ FHE encryption failed:', error);
    console.error('📊 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      orderData
    });
    throw error;
  }
};

// 解密交易数据 - 增强版本，参考fantasy-vault-trade
export const decryptTradingData = async (
  instance: any,
  contract: Contract,
  orderId: string
) => {
  try {
    console.log('🚀 Starting FHE decryption process...');
    console.log('📊 Input parameters:', {
      orderId,
      contractAddress: CONTRACT_ADDRESS
    });
    
    console.log('🔄 Step 1: Fetching encrypted data from contract...');
    const encryptedData = await contract.getOrderEncryptedData(orderId);
    console.log('✅ Step 1 completed: Encrypted data fetched');
    console.log('📊 Encrypted data array length:', encryptedData.length);
    console.log('📊 Encrypted data preview:', encryptedData.map((item, index) => ({
      index,
      type: typeof item,
      length: item?.length || 'N/A'
    })));
    
    console.log('🔄 Step 2: Building handle-contract pairs...');
    const handleContractPairs = [
      { handle: encryptedData[0], contractAddress: CONTRACT_ADDRESS },
      { handle: encryptedData[1], contractAddress: CONTRACT_ADDRESS },
      { handle: encryptedData[2], contractAddress: CONTRACT_ADDRESS },
      { handle: encryptedData[3], contractAddress: CONTRACT_ADDRESS },
      { handle: encryptedData[4], contractAddress: CONTRACT_ADDRESS }
    ];
    console.log('✅ Step 2 completed: Handle-contract pairs built');
    console.log('📊 Pairs count:', handleContractPairs.length);
    
    console.log('🔄 Step 3: Decrypting handles...');
    const result = await instance.userDecrypt(handleContractPairs);
    console.log('✅ Step 3 completed: Handles decrypted');
    console.log('📊 Decryption result keys:', Object.keys(result || {}));
    
    console.log('🔄 Step 4: Parsing decrypted data...');
    const decryptedData = {
      orderId: result[encryptedData[0]]?.toString() || '0',
      orderType: Number(result[encryptedData[1]]) || 0,
      quantity: result[encryptedData[2]]?.toString() || '0',
      price: Number(result[encryptedData[3]]) / 100 || 0,
      commoditySymbol: getStringDescription(Number(result[encryptedData[4]]) || 0)
    };
    
    console.log('✅ Step 4 completed: Data parsed successfully');
    console.log('📊 Decrypted data:', decryptedData);
    
    console.log('🎉 Decryption completed successfully!');
    return decryptedData;
  } catch (error) {
    console.error('❌ FHE decryption failed:', error);
    console.error('📊 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      orderId
    });
    throw error;
  }
};

// 加密投资组合数据 - 增强版本
export const encryptPortfolioData = async (
  instance: any,
  contractAddress: string,
  userAddress: string,
  portfolioData: {
    totalValue: number;
    totalPnl: number;
    tradeCount: number;
    userId: number;
  }
) => {
  try {
    console.log('🔄 Creating encrypted portfolio data...');
    console.log('📊 Portfolio data:', portfolioData);
    
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    
    // 添加加密数据
    input.add32(BigInt(Math.floor(portfolioData.totalValue * 100))); // 总价值
    input.add32(BigInt(Math.floor(portfolioData.totalPnl * 100))); // 总盈亏
    input.add32(BigInt(portfolioData.tradeCount)); // 交易次数
    input.add32(BigInt(portfolioData.userId)); // 用户ID
    
    console.log('🔄 Encrypting portfolio data...');
    const encryptedInput = await input.encrypt();
    
    const handles = encryptedInput.handles.map(convertToBytes32);
    const proof = `0x${Array.from(encryptedInput.inputProof)
      .map((b: number) => b.toString(16).padStart(2, '0')).join('')}`;
    
    console.log('✅ Portfolio data encrypted successfully');
    console.log('📊 Portfolio handles count:', handles.length);
    return { handles, proof };
  } catch (error) {
    console.error('❌ Failed to encrypt portfolio data:', error);
    console.error('📊 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      portfolioData
    });
    throw error;
  }
};

// 解密投资组合数据 - 新增功能
export const decryptPortfolioData = async (
  instance: any,
  contract: Contract,
  traderAddress: string
) => {
  try {
    console.log('🚀 Starting portfolio decryption process...');
    console.log('📊 Input parameters:', {
      traderAddress,
      contractAddress: CONTRACT_ADDRESS
    });
    
    console.log('🔄 Step 1: Fetching encrypted portfolio data from contract...');
    const encryptedData = await contract.getPortfolioValue(traderAddress);
    console.log('✅ Step 1 completed: Encrypted portfolio data fetched');
    console.log('📊 Encrypted portfolio data:', encryptedData);
    
    console.log('🔄 Step 2: Building handle-contract pairs for portfolio...');
    const handleContractPairs = [
      { handle: encryptedData[0], contractAddress: CONTRACT_ADDRESS },
      { handle: encryptedData[1], contractAddress: CONTRACT_ADDRESS },
      { handle: encryptedData[2], contractAddress: CONTRACT_ADDRESS }
    ];
    console.log('✅ Step 2 completed: Portfolio handle-contract pairs built');
    
    console.log('🔄 Step 3: Decrypting portfolio handles...');
    const result = await instance.userDecrypt(handleContractPairs);
    console.log('✅ Step 3 completed: Portfolio handles decrypted');
    console.log('📊 Portfolio decryption result:', result);
    
    console.log('🔄 Step 4: Parsing decrypted portfolio data...');
    const decryptedData = {
      totalValue: Number(result[encryptedData[0]]) / 100 || 0,
      totalPnl: Number(result[encryptedData[1]]) / 100 || 0,
      tradeCount: Number(result[encryptedData[2]]) || 0
    };
    
    console.log('✅ Step 4 completed: Portfolio data parsed successfully');
    console.log('📊 Decrypted portfolio data:', decryptedData);
    
    console.log('🎉 Portfolio decryption completed successfully!');
    return decryptedData;
  } catch (error) {
    console.error('❌ Portfolio decryption failed:', error);
    console.error('📊 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      traderAddress
    });
    throw error;
  }
};

// 测试 FHE 功能 - 参考fantasy-vault-trade
export const testFHEFunctionality = async (instance: any) => {
  try {
    console.log('🧪 Testing FHE functionality...');
    
    const testData = {
      orderId: 1,
      orderType: 1,
      quantity: 100,
      price: 50.25,
      commoditySymbol: 'GOLD'
    };
    
    // 测试加密
    const encrypted = await encryptTradingOrder(
      instance,
      '0x0000000000000000000000000000000000000000', // 测试地址
      testData
    );
    
    console.log('✅ FHE Test Successful! Encrypted', encrypted.handles.length, 'handles');
    return true;
  } catch (error) {
    console.error('❌ FHE Test Failed:', error);
    return false;
  }
};

// 创建商品 - 新增功能
export const createCommodity = async (
  signer: any,
  symbol: string,
  name: string,
  initialPrice: number,
  totalSupply: number
) => {
  try {
    console.log('🔄 Creating new commodity...');
    console.log('📊 Commodity data:', {
      symbol,
      name,
      initialPrice,
      totalSupply
    });
    
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Convert price to wei format
    const priceInWei = Math.floor(initialPrice * 1e18);
    
    const tx = await contract.createCommodity(
      symbol,
      name,
      priceInWei,
      totalSupply,
      "0x" // Empty proof for initialization
    );
    
    console.log('⏳ Waiting for transaction confirmation...');
    await tx.wait();
    
    console.log('✅ Commodity created successfully!');
    console.log('📊 Transaction hash:', tx.hash);
    
    return tx.hash;
  } catch (error) {
    console.error('❌ Failed to create commodity:', error);
    console.error('📊 Error details:', {
      errorName: error?.name,
      message: error?.message,
      stack: error?.stack,
      symbol,
      commodityName: name,
      initialPrice,
      totalSupply
    });
    throw error;
  }
};

// 获取商品信息 - 新增功能
export const getCommodityInfo = async (contract: Contract, symbol: string) => {
  try {
    console.log('🔄 Fetching commodity info...');
    console.log('📊 Symbol:', symbol);
    
    const info = await contract.getCommodityInfo(symbol);
    console.log('✅ Commodity info fetched successfully');
    console.log('📊 Commodity info:', info);
    
    return {
      symbol: info[0],
      name: info[1],
      currentPrice: Number(info[2]) / 1e18, // Convert from wei
      isActive: info[3]
    };
  } catch (error) {
    console.error('❌ Failed to fetch commodity info:', error);
    throw error;
  }
};

// 获取所有商品符号 - 新增功能
export const getAllCommoditySymbols = async (contract: Contract) => {
  try {
    console.log('🔄 Fetching all commodity symbols...');
    
    const symbols = await contract.getAllCommoditySymbols();
    console.log('✅ Commodity symbols fetched successfully');
    console.log('📊 Symbols count:', symbols.length);
    console.log('📊 Symbols:', symbols);
    
    return symbols;
  } catch (error) {
    console.error('❌ Failed to fetch commodity symbols:', error);
    throw error;
  }
};
