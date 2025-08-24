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
      
      if (!profileData?.username || !profileData?.twitter_url) {
        throw new Error('Username and Twitter URL are required');
      }

      const transaction = {
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

      if (!signAndSubmitTransaction) {
        throw new Error('signAndSubmitTransaction is not available');
      }

      const pendingTransaction = await signAndSubmitTransaction(transaction);
      console.log('pendingTransaction', pendingTransaction);
      return pendingTransaction.hash;

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
