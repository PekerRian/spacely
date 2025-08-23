import { useEffect } from 'react';

export function TwitterCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL (either query params or hash)
        const params = new URLSearchParams(window.location.search || window.location.hash.substring(1));
        const code = params.get('code');
        const state = params.get('state');
        const storedState = sessionStorage.getItem('twitter_state');
        const codeVerifier = sessionStorage.getItem('twitter_verifier');

        if (!code) {
          throw new Error('No authorization code received');
        }

        if (state !== storedState) {
          throw new Error('State mismatch - possible CSRF attack');
        }

        // Exchange code for token

        const tokenParams = new URLSearchParams({
          code: code,
          grant_type: 'authorization_code',
          client_id: import.meta.env.VITE_TWITTER_CLIENT_ID,
          redirect_uri: window.location.origin + '/twitter-callback',
          code_verifier: codeVerifier
        });

        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: tokenParams
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          throw new Error(`Failed to get access token: ${error}`);
        }

        const tokenData = await tokenResponse.json();
        
        // Send token back to main window
        // Get user profile data with additional fields
        const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=url,username,name,profile_image_url,description', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch Twitter profile');
        }

        const userData = await userResponse.json();

        if (window.opener) {
          window.opener.postMessage({
            type: 'TWITTER_PROFILE',
            profile: {
              handle: userData.data.username,
              bio: userData.data.description,
              url: userData.data.url || `https://twitter.com/${userData.data.username}`,
              name: userData.data.name,
              profile_image: userData.data.profile_image_url
            }
          }, window.location.origin);
        }

        // Clean up
        sessionStorage.removeItem('twitter_state');
        sessionStorage.removeItem('twitter_verifier');
        
      } catch (error) {
        console.error('Twitter callback error:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'TWITTER_ERROR',
            error: error.message
          }, window.location.origin);
        }
      } finally {
        // Close the popup
        window.close();
      }
    };

    handleCallback();
  }, []);

  return <div>Processing Twitter login...</div>;
}
