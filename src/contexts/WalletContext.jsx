


import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
        aptosApiKeys: {
          testnet: process.env.APTOS_API_KEY_TESTNET
        }
      }}
      onError={(error) => {
        console.error('Wallet error:', error?.name, error?.message);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
