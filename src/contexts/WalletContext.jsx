

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      networkName="testnet"
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
