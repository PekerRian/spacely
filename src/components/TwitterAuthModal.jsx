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
      // Use backend endpoint for Twitter OAuth
      const response = await fetch('https://spacely-blush.vercel.app/api/auth/twitter/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          <span className="twitter-icon">𝕏</span>
          Continue with Twitter
        </button>
      </div>
    </div>
  );
}
