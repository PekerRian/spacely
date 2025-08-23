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
      if (!response.ok) {
        const text = await response.text();
      // PKCE Twitter OAuth2 flow client-side only
      const handleTwitterAuth = async () => {
        // 1. Generate code_verifier and code_challenge
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
        const state = generateRandomString(16);
        sessionStorage.setItem('twitter_verifier', codeVerifier);
        sessionStorage.setItem('twitter_state', state);
        // 2. Build Twitter authorize URL
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: import.meta.env.VITE_TWITTER_CLIENT_ID,
          redirect_uri: window.location.origin + '/twitter-callback',
          scope: 'tweet.read users.read offline.access',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        });
        const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
        // 3. Open popup
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(authUrl, 'twitter-auth', `width=${width},height=${height},left=${left},top=${top}`);
      };

      // Helper: PKCE
      function generateRandomString(length) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        for (let i = 0; i < array.length; i++) {
          result += charset[array[i] % charset.length];
        }
        return result;
      }
      async function pkceChallengeFromVerifier(v) {
        const data = new TextEncoder().encode(v);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
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
