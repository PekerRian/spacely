import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

// Fetches the on-chain user profile for the connected wallet
export default function useProfileInfo() {
  const { account } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setProfile(null);
      return;
    }
    const toHexString = (addr) => {
      if (!addr) return '';
      // If addr is an object with a 'data' property, use that
      if (typeof addr === 'object' && addr.data && Array.isArray(addr.data)) {
        return '0x' + Array.from(addr.data).map(x => x.toString(16).padStart(2, '0')).join('');
      }
      // If addr is a Uint8Array directly
      if (addr instanceof Uint8Array) {
        return '0x' + Array.from(addr).map(x => x.toString(16).padStart(2, '0')).join('');
      }
      // If addr is a string
      if (typeof addr === 'string') return addr.startsWith('0x') ? addr : '0x' + addr;
      return '';
    };
    const fetchProfile = async () => {
      console.log('Fetching profile for account.address:', account?.address);
      const addressHex = toHexString(account?.address);
      console.log('Converted addressHex:', addressHex);
      if (!addressHex) {
        setProfile(null);
        return;
      }
      setLoading(true);
      const url = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${addressHex}/resources`;
      console.log('Fetch URL:', url);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch resources');
        const resources = await res.json();
        console.log('Fetched resources for', addressHex, resources);
        const profileResource = resources.find(
          (r) => r.type === '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51::profiles::UserProfile'
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
