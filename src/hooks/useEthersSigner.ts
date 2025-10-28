import { useWalletClient } from 'wagmi';
import { useMemo, useState, useEffect } from 'react';
import { JsonRpcSigner } from 'ethers';
import { BrowserProvider } from 'ethers';

function walletClientToSigner(walletClient: any): Promise<JsonRpcSigner> {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();

  useEffect(() => {
    async function getSigner() {
      if (walletClient) {
        try {
          const ethSigner = await walletClientToSigner(walletClient);
          setSigner(ethSigner);
        } catch (error) {
          console.error('Error creating signer:', error);
          setSigner(undefined);
        }
      } else {
        setSigner(undefined);
      }
    }

    getSigner();
  }, [walletClient]);

  return signer;
}
