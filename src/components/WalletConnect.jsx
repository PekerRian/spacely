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

  const generateCodeChallenge = async (verifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const handleTwitterAuth = async () => {
    try {
      const state = crypto.randomUUID();
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store these for validation in callback
      sessionStorage.setItem('twitter_state', state);
      sessionStorage.setItem('twitter_verifier', codeVerifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: 'Ym5VZ2lEakdpa3l0MEh3T1Z6UVg6MTpjaQ',
        redirect_uri: window.location.origin,
        scope: 'users.read tweet.read',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
        'twitter-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Error initiating Twitter auth:', error);
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
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'TWITTER_PROFILE') {
        handleTwitterProfile(event.data.profile);
      } else if (event.data.type === 'TWITTER_ERROR') {
        setError(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
