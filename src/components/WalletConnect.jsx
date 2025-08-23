import { useWallet } from '../contexts/WalletContext';
import { useState, useEffect, useContext, useRef } from 'react';
import { TwitterAuthContext } from '../App';
import { ProfileForm } from './ProfileForm';
import { useProfileContract } from '../hooks/useProfileContract';
import '../styles/modal.css';
import { useNavigate } from 'react-router-dom';

export function WalletConnect() {
  const navigate = useNavigate();
  const { connect, disconnect, account, wallets, connected } = useWallet();
  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { checkProfile, createProfile } = useProfileContract();
  const { twitterProfile, setTwitterProfile, showProfileForm, setShowProfileForm } = useContext(TwitterAuthContext);

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

  // No longer needed: handleTwitterProfile (handled globally)

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

  // No longer needed: Twitter OAuth callback via URL params (handled globally)

  // Start Twitter auth only when connection transitions from false -> true
  const prevConnectedRef = useRef(connected);
  useEffect(() => {
    const prev = prevConnectedRef.current;
    // rising edge: was not connected, now is connected
    if (!prev && connected && account?.address && !twitterProfile) {
      console.log('[WalletConnect] detected wallet connect, starting Twitter auth');
      handleTwitterAuth();
    }
    prevConnectedRef.current = connected;
  }, [connected, account?.address, twitterProfile]);



  const handleConnectWallet = async () => {
    try {
      if (connected) {
        await disconnect();
        setShowProfileForm(false);
      } else {
        setShowLoginModal(true);
      }
      setError(null);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    }
  };

  const handlePetraConnect = async () => {
    try {
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets available');
      }
      await connect(wallets[0].name);
      setShowLoginModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    alert('Google login not implemented yet.');
    setShowLoginModal(false);
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple OAuth
    alert('Apple login not implemented yet.');
    setShowLoginModal(false);
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

      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Choose Login Method</h2>
            <button className="login-option" onClick={handleGoogleLogin}>Login with Google</button>
            <button className="login-option" onClick={handleAppleLogin}>Login with Apple</button>
            <button className="login-option" onClick={handlePetraConnect}>Login with Petra Wallet</button>
            <button className="close-modal" onClick={() => setShowLoginModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      
      <ProfileForm
        isOpen={showProfileForm}
        onClose={() => setShowProfileForm(false)}
        walletAddress={account?.address?.toString()}
        twitterProfile={twitterProfile}
      />
    </>
  );
}
