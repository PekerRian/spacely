import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Types, AptosClient } from 'aptos';

export function useProfileContract() {
  const wallet = useWallet();
  const { account, signAndSubmitTransaction, connected } = wallet;
  const [loading, setLoading] = useState(false);

  const checkProfile = async (address) => {
    try {
      // Query the account resources to check for UserProfile
      const response = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/accounts/${address}/resources`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch account resources');
      }

      const resources = await response.json();
      
      // Look for the UserProfile resource in the account's resources
      const profileResource = resources.find(
        (r) => r.type === 'spacely::profiles::UserProfile'
      );

      return !!profileResource;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  const createProfile = async (profileData) => {
    try {
      setLoading(true);
      if (!account) {
        throw new Error('Wallet not connected');
      }
      // Defensive check for profileData
      if (!profileData || typeof profileData !== 'object') {
        throw new Error('Profile data is missing or invalid');
      }
      // Check required fields
      if (!profileData.username || !profileData.twitter_url) {
        throw new Error('Profile data missing required fields');
      }
      // Construct the transaction payload
      const transactionPayload = {
        type: "entry_function_payload",
        function: `${account.address}::profiles::create_profile`,
        type_arguments: [],
        arguments: [
          profileData.username,
          profileData.bio || '',
          profileData.profile_image || '',
          profileData.affiliation || '',
          profileData.twitter_url || ''
        ]
      };

      // Create the transaction request
      const transaction = {
        data: transactionPayload,
      };
      // Defensive checks
      if (!signAndSubmitTransaction) {
        throw new Error('Wallet not connected or signAndSubmitTransaction not available');
      }
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload is not properly constructed (missing or not an object)');
      }
      if (!('function' in payload) || typeof payload.function !== 'string') {
        throw new Error('Payload.function is missing or not a string');
      }

      // Diagnostic logs to debug adapter behavior
      console.debug('Preparing to call signAndSubmitTransaction. Diagnostics:');
      console.debug('connected:', connected);
      console.debug('account:', account);
      try {
          // Log wallet object and sign function for diagnostics
          try { console.debug('wallet keys:', Object.keys(wallet)); } catch (e) { console.debug('wallet: [unserializable]'); }
          console.debug('signAndSubmitTransaction typeof:', typeof signAndSubmitTransaction);
          try { console.debug('signAndSubmitTransaction:', signAndSubmitTransaction.toString().slice(0, 200)); } catch (e) { console.debug('signAndSubmitTransaction: [function]'); }
      } catch (diagErr) {
        console.warn('Diagnostics failed:', diagErr);
      }
      console.debug('payload:', payload);
        // Normalize payload.function: if it lacks a 0x address, try prefixing with account.address
        try {
          if (payload && typeof payload.function === 'string') {
            // If it already has 0x prefix, leave as-is
            if (!payload.function.startsWith('0x')) {
              const parts = payload.function.split('::');
              if (parts.length === 3) {
                const moduleName = parts[1];
                const fnName = parts[2];
                const address = account?.address || '';
                if (address) {
                  payload.function = `${address}::${moduleName}::${fnName}`;
                  console.debug('Normalized payload.function to include address:', payload.function);
                }
              }
            }
          }
        } catch (normErr) {
          console.warn('Failed to normalize payload.function', normErr);
        }
      // Attempt to submit transaction. Some adapters expect the payload directly,
      // others may expect an object with a `transaction` key. Try both and provide
      // detailed logs for debugging.
      if (typeof signAndSubmitTransaction !== 'function') {
        throw new Error('signAndSubmitTransaction is not a function on the wallet adapter');
      }
      try {
        // Try to submit the transaction with the properly structured payload
        console.debug('Submitting transaction:', transaction);
        const tx = await signAndSubmitTransaction(transaction);
        return tx;
      } catch (err) {
        console.error('Transaction submission failed:', err);
        throw err;
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkProfile,
    createProfile,
    loading,
  };
}
