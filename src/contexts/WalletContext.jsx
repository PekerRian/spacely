

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function WalletProvider({ children }) {
  const network = useMemo(() => ({
    name: 'Testnet',
    chainId: '2',
  }), []);

  return (
    <ErrorBoundary>
      <AptosWalletAdapterProvider
        plugins={[]}
        autoConnect={true}
        network={network}
        onError={(error) => {
          console.warn('Wallet error:', error);
          // Don't throw to prevent app crashes
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
  );
}
