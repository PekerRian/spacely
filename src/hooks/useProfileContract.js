import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Types } from 'aptos';

export function useProfileContract() {
  const { signAndSubmitTransaction } = useWallet();
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
      const payload = {
        type: 'entry_function_payload',
        function: 'spacely::profiles::create_profile',
        type_arguments: [],
        arguments: [
          profileData.username,
          profileData.bio,
          profileData.profile_image,
          profileData.affiliation,
          profileData.twitter_url
        ],
      };
      // Defensive checks
      if (!signAndSubmitTransaction) {
        throw new Error('Wallet not connected or signAndSubmitTransaction not available');
      }
      if (!payload || !payload.function) {
        throw new Error('Payload is not properly constructed');
      }
      console.log('Submitting profile payload:', payload);
      const tx = await signAndSubmitTransaction(payload);
      return tx;
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
