import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

// Fetches the on-chain user profile for the connected wallet
export default function useProfileInfo() {
  const { account } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!account?.address) {
        setProfile(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}/resources`
        );
        if (!res.ok) throw new Error('Failed to fetch resources');
        const resources = await res.json();
        console.log('Fetched resources for', account.address, resources);
        const profileResource = resources.find(
          (r) => r.type === '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51::spacelyapp::UserProfile'
        );
        console.log('UserProfile resource:', profileResource);
        if (profileResource && profileResource.data) {
          setProfile(profileResource.data);
        } else {
          setProfile(null);
        }
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [account?.address]);

  return { profile, loading };
}
