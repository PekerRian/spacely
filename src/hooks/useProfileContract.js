
import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const MODULE_ADDRESS = '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51';

export default function useProfileContract() {
	const [loading, setLoading] = useState(false);
	const { account, signAndSubmitTransaction, connected } = useWallet();

	const hasProfile = async () => {
		try {
			if (!connected || !account) {
				return false;
			}
			const response = await fetch(
				`https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}/resources`
			);
			const resources = await response.json();
			const profileResource = resources.find(
				(r) => r.type === `${MODULE_ADDRESS}::spacelyapp::UserProfile`
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

			const transaction = {
				function: `${MODULE_ADDRESS}::spacelyapp::create_profile_entry`,
				arguments: [
					profileData.username || '',
					profileData.bio || '',
					profileData.profile_image || '',
					profileData.affiliation || '',
					profileData.twitter_url || ''
				],
				type_arguments: []
			};

			console.log('Submitting transaction:', transaction);
			try {
				const pendingTransaction = await signAndSubmitTransaction(transaction);
				const result = await pendingTransaction.wait();
				console.log('Transaction successful:', result.hash);
				return true;
			} catch (error) {
				console.error('Transaction failed:', error);
				throw error;
			}
			return true;
		} catch (error) {
			console.error('Error creating profile:', error);
			throw error;
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
