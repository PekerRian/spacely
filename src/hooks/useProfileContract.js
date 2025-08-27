
import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosClient, Network, Types } from '@aptos-labs/ts-sdk';

const MODULE_ADDRESS = '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51';
const client = new AptosClient({ network: Network.TESTNET });

export default function useProfileContract() {
  const [loading, setLoading] = useState(false);
  const { account, signAndSubmitTransaction, connected } = useWallet();

  const hasProfile = async () => {
    if (!connected || !account?.address) {
      return false;
    }
    
    try {
      const accountResources = await client.getAccountResources({
        accountAddress: account.address,
      });
      
      const profileResource = accountResources.find(
        (r) => r.type === `${MODULE_ADDRESS}::spacelyapp::UserProfile`
      );
      
      return !!profileResource;
    } catch (e) {
      console.warn('Error checking profile:', e);
      return false;
    }
  };

  const createProfile = async (profileData) => {
    try {
      setLoading(true);
      
      if (!connected || !account?.address) {
        throw new Error('Wallet not connected');
      }
      
      if (!profileData?.username || !profileData?.twitter_url) {
        throw new Error('Username and Twitter URL are required');
      }

      const transaction = {
        function: `${MODULE_ADDRESS}::spacelyapp::create_profile_entry`,
        type_arguments: [],
        arguments: [
          profileData.username || '',
          profileData.bio || '',
          profileData.profile_image || '',
          profileData.affiliation || '',
          profileData.twitter_url || ''
        ]
      };

      const pendingTransaction = await signAndSubmitTransaction({
        sender: account.address,
        data: transaction
      });

      // Wait for transaction
      const response = await client.waitForTransaction({
        transactionHash: pendingTransaction.hash
      });

      return response.success;
		} finally {
			setLoading(false);
		}
	};

	return {
		loading,
		hasProfile,
		createProfile
	};
}
