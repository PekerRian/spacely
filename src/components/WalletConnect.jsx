import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { ProfileForm } from './ProfileForm';
import { useProfileContract } from '../hooks/useProfileContract';
import '../styles/modal.css';

export function WalletConnect() {
  const { connect, disconnect, account, wallets, connected } = useWallet();
  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [error, setError] = useState(null);
  const [twitterProfile, setTwitterProfile] = useState(null);
  const { checkProfile, createProfile } = useProfileContract();

  // Use backend for Twitter OAuth flow
  const handleTwitterAuth = async () => {
    try {
      const response = await fetch('https://spacely-blush.vercel.app/api/auth/twitter/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account?.address })
      });
      const data = await response.json();
      if (data.authUrl) {
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(data.authUrl, 'twitter-auth', `width=${width},height=${height},left=${left},top=${top}`);
      } else {
        setError('Failed to get Twitter auth URL');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleTwitterProfile = (profileData) => {
    try {
      const { username, url, name, description } = profileData;
      setTwitterProfile({
        handle: username,
        url: url || `https://twitter.com/${username}`,
        name: name || username,
        bio: description || '',
      });
      // Show profile form immediately after getting Twitter data
      setShowProfileForm(true);
    } catch (err) {
      console.error('Error handling Twitter profile:', err);
      setError(err.message);
    }
  };

  const checkAndHandleProfile = async (address) => {
    try {
      const hasProfile = await checkProfile(address);
      if (!hasProfile && twitterProfile) {
        setShowProfileForm(true);
      }
      return hasProfile;
    } catch (err) {
      console.error('Profile check error:', err);
      setError(err.message);
      return false;
    }
  };

  // Handle Twitter OAuth response
  useEffect(() => {
    // Listen for Twitter OAuth callback via URL params
    const checkTwitterCallback = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'success') {
        const twitterProfile = {
          handle: params.get('twitterUsername'),
          url: `https://twitter.com/${params.get('twitterUsername')}`,
          name: params.get('twitterUsername'),
          bio: '',
        };
        setTwitterProfile(twitterProfile);
        setShowProfileForm(true);
      } else if (params.get('auth') === 'error') {
        setError(params.get('error'));
      }
    };
    checkTwitterCallback();
  }, [connected, account?.address]);

  // Start Twitter auth after wallet connection
  useEffect(() => {
    if (connected && account?.address && !twitterProfile) {
      handleTwitterAuth();
    }
  }, [connected, account?.address, twitterProfile]);



  const handleConnectWallet = async () => {
    try {
      if (connected) {
        await disconnect();
        setShowProfileForm(false);
      } else {
        if (!wallets || wallets.length === 0) {
          throw new Error('No wallets available');
        }
        await connect(wallets[0].name);
        // Profile check will be handled by the useEffect
      }
      setError(null);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    }
  };

  // Format address for display (first 6 and last 4 characters)
  const formatAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };



  return (
    <>
      <button 
        className={`login-button ${connected ? 'connected' : ''}`} 
        onClick={handleConnectWallet}
        onMouseEnter={() => connected && setShowAddressMenu(true)}
        onMouseLeave={() => setShowAddressMenu(false)}
      >
        <span className="login-icon">
          {connected ? '👤' : '👥'}
        </span>
        {error && (
          <div className="error-tooltip">{error}</div>
        )}
        {showAddressMenu && connected && !error && (
          <div className="address-menu">
            <div className="menu-item" onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(account?.address);
            }}>
              Copy Address
            </div>
            <div className="menu-item" onClick={(e) => {
              e.stopPropagation();
              disconnect();
            }}>
              Disconnect
            </div>
          </div>
        )}
      </button>
      
      <ProfileForm
        isOpen={showProfileForm}
        onClose={() => setShowProfileForm(false)}
        walletAddress={account?.address?.toString()}
        twitterProfile={twitterProfile}
      />
    </>
  );
}
