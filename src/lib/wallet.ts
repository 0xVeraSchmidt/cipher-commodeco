import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';

// 使用正确的Sepolia RPC URL
const sepoliaRpcUrl = 'https://1rpc.io/sepolia';

export const config = getDefaultConfig({
  appName: 'Cipher Commodeco',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'e08e99d213c331aa0fd00f625de06e66',
  chains: [sepolia],
  ssr: false,
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
  },
});
