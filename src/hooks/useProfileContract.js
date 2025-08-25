import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient, Network } from '@aptos-labs/ts-sdk';

export default function useProfileContract() {
  const wallet = useWallet();
  const { account, signAndSubmitTransaction, connected } = wallet;
  const [loading, setLoading] = useState(false);
  
  const client = new AptosClient({ network: Network.TESTNET });

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
      if (!connected || !account) {
        throw new Error('Wallet not connected');
      }
      if (!profileData?.username || !profileData?.twitter_url) {
        throw new Error('Username and Twitter URL are required');
      }
      if (!account.address) {
        throw new Error('Wallet address not available');
      }
      // Use the published module address from Move.toml
      const MODULE_ADDRESS = "0x030a49e550317d928495602ea9146550f90ec9808666fa5bd949e8ef9db5ff31";
      const transaction = {
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::profiles::create_profile`,
          typeArguments: [],
          functionArguments: [
            profileData.username || '',
            profileData.bio || '',
            profileData.profile_image || '',
            profileData.affiliation || '',
            profileData.twitter_url || ''
          ]
        }
      };

      if (!signAndSubmitTransaction) {
        throw new Error('signAndSubmitTransaction is not available');
      }

      console.log('Submitting transaction:', transaction);
      const pendingTransaction = await signAndSubmitTransaction(transaction);
      console.log('Transaction submitted:', pendingTransaction);

      // Wait for transaction
      try {
        const txnHash = pendingTransaction.hash;
        await client.waitForTransaction({ transactionHash: txnHash });
        console.log('Transaction confirmed');
        return txnHash;
      } catch (error) {
        console.error('Error waiting for transaction:', error);
        throw new Error('Transaction failed: ' + error.message);
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
