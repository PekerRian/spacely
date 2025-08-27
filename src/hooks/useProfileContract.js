
import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const MODULE_ADDRESS = '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51';

export default function useProfileContract() {
	const [loading, setLoading] = useState(false);
	const walletApi = useWallet();
	const { account, signAndSubmitTransaction, connected, wallet } = walletApi;

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

			const payloadData = {
				function: `${MODULE_ADDRESS}::spacelyapp::create_profile_entry`,
				typeArguments: [],
				functionArguments: [
					profileData.username || '',
					profileData.bio || '',
					profileData.profile_image || '',
					profileData.affiliation || '',
					profileData.twitter_url || ''
				]
			};

			console.log('Wallet API dump:', {
				walletApiKeys: Object.keys(walletApi || {}),
				walletKeys: wallet ? Object.keys(wallet) : undefined,
				signAndSubmitTransactionType: typeof signAndSubmitTransaction
			});

			if (typeof signAndSubmitTransaction !== 'function') {
				throw new Error('signAndSubmitTransaction is not available from wallet adapter');
			}

			// Try multiple documented payload shapes to support different adapter versions
			const attempts = [
				{ label: 'data.camelCase', payload: { data: payloadData } },
				{ label: 'data.snake_case', payload: { data: {
						function: payloadData.function,
						type_arguments: [],
						arguments: payloadData.functionArguments
					} } },
				{ label: 'entry_function_payload', payload: {
						type: 'entry_function_payload',
						function: payloadData.function,
						type_arguments: [],
						arguments: payloadData.functionArguments
					} }
			];

			let lastError = null;
			for (const attempt of attempts) {
				console.log(`Attempting signAndSubmitTransaction with ${attempt.label}`, attempt.payload);
				try {
					const response = await signAndSubmitTransaction(attempt.payload);
					console.log(`Response for ${attempt.label}:`, response);
					if (response && (response.hash || response.transactionHash)) {
						return true;
					}
					// Some adapters return a pending object with hash
					if (response && response.hash) return true;
					// If response undefined but no error thrown, break and return truthy
					if (response) return true;
				} catch (err) {
					console.error(`Attempt ${attempt.label} failed:`, err);
					lastError = err;
				}
			}

			// All attempts failed
			console.error('All signAndSubmitTransaction payload attempts failed');
			throw lastError || new Error('signAndSubmitTransaction failed with unknown error');
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
