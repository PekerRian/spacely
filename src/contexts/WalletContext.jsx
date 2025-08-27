

import { 
  AptosWalletAdapterProvider,
  PetraWallet,
  FewchaWallet,
  MartianWallet,
  PontemWallet,
  RiseWallet,
  SpikaWallet,
  TokenPocketWallet,
  MSafeWalletAdapter,
  ONTOWallet,
  BloctoWallet,
  WalletAdapter
} from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function WalletProvider({ children }) {
  const wallets = useMemo(() => [
    new PetraWallet(),
    new MartianWallet(),
    new FewchaWallet(),
    new PontemWallet(),
    new RiseWallet(),
    new SpikaWallet(),
    new TokenPocketWallet(),
    new ONTOWallet(),
    new MSafeWalletAdapter(),
    new BloctoWallet({
      network: Network.TESTNET,
      chainId: "2",
    }),
  ], []);

  return (
    <ErrorBoundary>
      <AptosWalletAdapterProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error) => {
          console.warn('Wallet error:', error);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
  );
}
