


import { AptosWalletAdapterProvider, useWallet } from '@aptos-labs/wallet-adapter-react';
import { Network, NetworkInfo } from '@aptos-labs/ts-sdk';
import { createContext, useContext, useEffect } from 'react';

const WalletStatusContext = createContext(null);

export function useWalletStatus() {
  return useContext(WalletStatusContext);
}

export function WalletProvider({ children }) {
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.connected && !wallet.account) {
      console.warn('Wallet appears connected but no account available');
    }
  }, [wallet.connected, wallet.account]);

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
        networkInfo: {
          nodeUrl: "https://fullnode.testnet.aptoslabs.com/v1",
          name: "testnet"
        }
      }}
      onError={(error) => {
        console.error('Wallet error:', error?.name, error?.message);
        if (error?.message) {
          // You might want to show this in your UI
          console.error('Detailed error:', error.message);
        }
      }}
    >
      <WalletStatusContext.Provider value={wallet}>
        {children}
      </WalletStatusContext.Provider>
    </AptosWalletAdapterProvider>
  );
}
