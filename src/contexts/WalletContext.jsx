

import { AptosWalletAdapterProvider, NetworkName } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function WalletProvider({ children }) {
  const wallets = useMemo(() => [], []); // Provider will populate this

  const network = useMemo(() => ({
    name: NetworkName.Testnet,
    networkId: Network.TESTNET,
    chainId: 2
  }), []);

  return (
    <ErrorBoundary>
      <AptosWalletAdapterProvider
        autoConnect={true}
        wallets={wallets}
        dappConfig={{ network: network.networkId }}
        onError={(error) => {
          console.warn('Wallet error:', error);
          // Don't throw to prevent app crashes
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
}
