import { useWallet } from '../contexts/WalletContext';
import { useState, useEffect, useContext, useRef } from 'react';
import { TwitterAuthContext } from '../contexts/TwitterAuthContext';
import { ProfileForm } from './ProfileForm';
import { useProfileContract } from '../hooks/useProfileContract';
import '../styles/modal.css';
import { useNavigate } from 'react-router-dom';

export function WalletConnect() {
  const { twitterProfile, setTwitterProfile, showProfileForm, setShowProfileForm } = useContext(TwitterAuthContext);
  // On mount, check for Twitter profile or error in sessionStorage (main window callback flow)
  useEffect(() => {
    const storedProfile = sessionStorage.getItem('twitter_profile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        setTwitterProfile({
          ...profile,
          url: `https://twitter.com/${profile.username || profile.handle || ''}`
        });
      } catch (e) {
        console.error('Failed to parse twitter_profile:', e);
      }
      sessionStorage.removeItem('twitter_profile');
    }
    const twitterError = sessionStorage.getItem('twitter_error');
    if (twitterError) {
      alert('Twitter authentication failed: ' + twitterError);
      sessionStorage.removeItem('twitter_error');
    }
  }, [setTwitterProfile]);

  // Show profile modal only when both wallet is connected and twitterProfile is set
  useEffect(() => {
    if (twitterProfile && connected) {
      setShowProfileForm(true);
    }
  }, [twitterProfile, connected, setShowProfileForm]);
  const navigate = useNavigate();
  const { connect, disconnect, account, wallets, connected } = useWallet();
  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { checkProfile, createProfile } = useProfileContract();

  // Handles wallet connect/disconnect button
  const handleConnectWallet = async () => {
    setError(null);
    if (connected) {
      await disconnect();
      setShowProfileForm(false);
      return;
    }
    setShowLoginModal(true);
  };

  // Check for profile existence when wallet connects
  // Only open modal on wallet connect if Twitter profile is NOT present
  useEffect(() => {
    const check = async () => {
      if (connected && account?.address && !twitterProfile) {
        try {
          const exists = await checkProfile(account.address);
          // ...existing code...
          setShowProfileForm(!exists);
        } catch (err) {
          setError('Error checking profile: ' + (err?.message || err));
        }
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, account?.address, twitterProfile]);

  // PKCE Twitter OAuth2 flow using serverless function
  const handleTwitterAuth = async () => {
    // 1. Save current route
    sessionStorage.setItem('twitter_prev_route', window.location.pathname + window.location.search);
    // 2. Generate code_verifier and code_challenge
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    const state = generateRandomString(16);
    sessionStorage.setItem('twitter_verifier', codeVerifier);
    sessionStorage.setItem('twitter_state', state);
  // ...existing code...
    // 3. Build Twitter authorize URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_TWITTER_CLIENT_ID,
      redirect_uri: window.location.origin + '/',
      scope: 'tweet.read users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  // 4. Redirect in same tab (never use window.open)
  window.location.href = authUrl;
  };

  // Handle Twitter OAuth2 callback (call serverless function)
  // Remove sessionStorage dependency: always handle code/state in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (code && state) {
      // Try POST first (for PKCE), fallback to GET if needed
      const codeVerifier = sessionStorage.getItem('twitter_verifier');
      const redirect_uri = window.location.origin + '/';
      const payload = codeVerifier
        ? { code, code_verifier: codeVerifier, redirect_uri }
        : null;
      const fetchProfile = payload
        ? fetch('/api/twitter-callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : fetch(`/api/twitter-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
      fetchProfile
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            // ...existing code...
            setTwitterProfile({
              ...data.profile,
              url: `https://twitter.com/${data.profile.username || data.profile.handle || ''}`
            });
            // Restore previous route using React Router's navigate
            const prevRoute = sessionStorage.getItem('twitter_prev_route');
            if (prevRoute && window.location.pathname + window.location.search !== prevRoute) {
              navigate(prevRoute, { replace: true });
            }
            setShowProfileForm(true);
            setTimeout(() => {
              const modal = document.querySelector('.modal-overlay');
              if (modal) modal.focus();
            }, 100);
          } else {
            alert('Twitter authentication failed: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(e => {
          alert('Twitter authentication failed: ' + e.message);
        });
    }
  }, [setTwitterProfile, setShowProfileForm]);

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
        onTwitterAuth={handleTwitterAuth}
      />
    </>
  );
}
