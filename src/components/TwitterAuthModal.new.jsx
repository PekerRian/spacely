import { useState, useEffect } from 'react';

export function TwitterAuthModal({ isOpen, onClose, walletAddress, onTwitterSuccess }) {
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (code && state === walletAddress) {
        onTwitterSuccess(code);
        onClose();
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        setLoginError(`Twitter authentication failed: ${error}`);
      }
    };

    if (isOpen) {
      handleCallback();
    }
  }, [isOpen, onTwitterSuccess, onClose, walletAddress]);

  const handleTwitterLogin = () => {
    try {
      setLoginError(null);
      
      // Twitter OAuth 2.0 parameters
      const params = {
        response_type: 'code',
        client_id: 'Ym5VZ2lEakdpa3l0MEh3T1Z6UVg6MTpjaQ',
        redirect_uri: 'http://localhost:5173',
        scope: 'tweet.read users.read',
        state: walletAddress || generateRandomString(32), // Use wallet address or random string as state
      };

      // Build the authorization URL
      const authUrl = 'https://twitter.com/i/oauth2/authorize?' + 
        new URLSearchParams(params).toString();

      // Open Twitter auth in a popup
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        authUrl,
        'Twitter Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Twitter login error:', error);
      setLoginError('Failed to connect to Twitter. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Connect with Twitter</h2>
        <p>Link your Twitter account to continue</p>
        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}
        <button className="twitter-button" onClick={handleTwitterLogin}>
          <span className="twitter-icon">𝕏</span>
          Continue with Twitter
        </button>
      </div>
    </div>
  );
}
