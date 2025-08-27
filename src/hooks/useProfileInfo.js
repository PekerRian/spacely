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
      if (typeof addr === 'string') return addr.startsWith('0x') ? addr : `0x${addr}`;
      if (addr instanceof Uint8Array) {
        return `0x${Array.from(addr).map(x => x.toString(16).padStart(2, '0')).join('')}`;
      }
      if (typeof addr === 'object' && addr.data) {
        const data = addr.data instanceof Uint8Array ? Array.from(addr.data) : addr.data;
        return `0x${data.map(x => x.toString(16).padStart(2, '0')).join('')}`;
      }
      return '';
    };

    const fetchProfile = async () => {
      const addressHex = toHexString(account?.address);
      if (!addressHex) {
        setProfile(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/accounts/${addressHex}/resources`);
        if (!res.ok) throw new Error('Failed to fetch resources');
        
        const resources = await res.json();
        const profileResource = resources.find(
          (r) => r.type === '0x19df1f1bf45028cbd46f34b49ddb9ac181e561128ef4ced0aa60c36c32f72c51::spacelyapp::UserProfile'
        );

        setProfile(profileResource?.data || null);
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
