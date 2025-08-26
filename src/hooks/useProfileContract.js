import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';

export default function useProfileContract() {
  const wallet = useWallet();
  const { account, signAndSubmitTransaction, connected } = wallet;
  const [loading, setLoading] = useState(false);
  
  const client = new Aptos({ network: Network.TESTNET });
  // Define MODULE_ADDRESS at the top level of the hook
  const MODULE_ADDRESS = "0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51";

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
  (r) => r.type === '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51::spacelyapp::UserProfile'
      );

      return !!profileResource;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  const initProfileCollection = async () => {
    try {
      setLoading(true);
      if (!connected || !account) {
        throw new Error('Wallet not connected');
      }
      // Convert address to hex string if it's a Uint8Array
      const toHexString = (bytes) => {
        return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };
      
      const addressHex = account.address.data 
        ? toHexString(account.address.data)
        : account.address;

      const transaction = {
        sender: addressHex,
        data: {
          function: `${MODULE_ADDRESS}::spacelyapp::initialize`,
          typeArguments: [],
          functionArguments: []
        }
      };
      
      const pendingTx = await signAndSubmitTransaction(transaction);
      await client.waitForTransaction({ transactionHash: pendingTx.hash });
      console.log('Profile collection initialized');
    } catch (error) {
      console.error('Error initializing profile collection:', error);
      // If error is about already initialized, we can ignore it
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    } finally {
      setLoading(false);
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
      
      // Try to initialize first (if not already initialized)
      try {
        await initProfileCollection();
      } catch (error) {
        console.log('Initialization skipped:', error.message);
      }
      // MODULE_ADDRESS is now defined at the top of the hook
      // Convert address to hex string if it's a Uint8Array
      const toHexString = (bytes) => {
        return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };
      
      const addressHex = account.address.data 
        ? toHexString(account.address.data)
        : account.address;

      const transaction = {
        sender: addressHex,
        data: {
          function: `${MODULE_ADDRESS}::spacelyapp::create_profile_entry`,
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

  const initializeModule = async () => {
    try {
      setLoading(true);
      if (!connected || !account) {
        throw new Error('Wallet not connected');
      }
      if (!account.address) {
        throw new Error('Wallet address not available');
      }

  const MODULE_ADDRESS = "0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51";
      const transaction = {
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::spacelyapp::initialize`,
          typeArguments: [],
          functionArguments: []
        }
      };

      if (!signAndSubmitTransaction) {
        throw new Error('signAndSubmitTransaction is not available');
      }

      console.log('Initializing module:', transaction);
      const pendingTransaction = await signAndSubmitTransaction(transaction);
      console.log('Initialization submitted:', pendingTransaction);

      // Wait for transaction
      try {
        const txnHash = pendingTransaction.hash;
        await client.waitForTransaction({ transactionHash: txnHash });
        console.log('Initialization confirmed');
        return txnHash;
      } catch (error) {
        console.error('Error waiting for initialization:', error);
        throw new Error('Initialization failed: ' + error.message);
      }

    } catch (error) {
      console.error('Error initializing module:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkProfile,
    createProfile,
    initProfileCollection,
    loading,
  };
}
