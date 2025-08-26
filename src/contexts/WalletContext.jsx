


import { AptosWalletAdapterProvider, NetworkName } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from "petra-plugin-wallet-adapter";

const wallets = [new PetraWallet()];

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      network={NetworkName.Testnet}
      onError={(error) => {
        console.error('Wallet error:', error?.name, error?.message);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
