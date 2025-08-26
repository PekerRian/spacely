
import { Aptoimport import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      networkName="testnet"etAdapterProvider, useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletConnector } from '@aptos-labs/wallet-adapter-core';

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      networkName="testnet"terProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { Types } from 'aptos';

const wallets = [new PetraWallet()];

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      network="testnet"
      onError={(error) => {
        console.error("Wallet error:", error);
      }} AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from "petra-plugin-wallet-adapter";

const wallets = [new PetraWallet()];

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      network="testnet"
      onError={(error) => {
        console.error('Wallet error:', error?.name, error?.message);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
