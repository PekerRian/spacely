import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Types } from 'aptos';

export function useProfileContract() {
  const { signAndSubmitTransaction, connected } = useWallet();
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
        if (!wallet || !wallet.account) {
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
        const payload = {
          type: 'entry_function_payload',
          function: 'spacely::profiles::create_profile',
          type_arguments: [],
          arguments: [
            profileData.username,
            profileData.bio || '',
            profileData.profile_image || '',
            profileData.affiliation || '',
            profileData.twitter_url || ''
          ],
        };
      // Defensive checks
      if (!signAndSubmitTransaction) {
        throw new Error('Wallet not connected or signAndSubmitTransaction not available');
      }
      if (!payload || !payload.function) {
        throw new Error('Payload is not properly constructed');
      }
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
