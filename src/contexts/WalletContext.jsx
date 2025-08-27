

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';

export function WalletProvider({ children }) {
  const wallets = useMemo(() => [], []); // Initialize empty wallet list, the provider will populate it

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      wallets={wallets}
      dappConfig={{ network: Network.TESTNET }}
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
