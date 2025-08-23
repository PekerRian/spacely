import { AptosWalletAdapterProvider, useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { createContext, useContext } from 'react';

const wallets = [new PetraWallet()];
const WalletContext = createContext(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

function WalletContextProvider({ children }) {
  const wallet = useAptosWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </AptosWalletAdapterProvider>
  );
}
