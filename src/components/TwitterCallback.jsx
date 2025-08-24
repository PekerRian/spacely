
import { useEffect } from 'react';

export function TwitterCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search || window.location.hash.substring(1));
        const code = params.get('code');
        const state = params.get('state');
        const storedState = sessionStorage.getItem('twitter_state');
        const codeVerifier = sessionStorage.getItem('twitter_verifier');
        const redirect_uri = window.location.origin + '/';

        if (!code) throw new Error('No authorization code received');
        if (state !== storedState) throw new Error('State mismatch - possible CSRF attack');

        // POST to serverless function
        const res = await fetch('/api/twitter-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri })
        });
        const data = await res.json();
        if (!res.ok || !data.profile) throw new Error(data.error || 'Failed to fetch Twitter profile');

        sessionStorage.removeItem('twitter_state');
        sessionStorage.removeItem('twitter_verifier');

        if (window.opener) {
          // Popup flow
          window.opener.postMessage({
            type: 'TWITTER_PROFILE',
            profile: data.profile
          }, window.location.origin);
          window.close();
        } else {
          // Main window flow
          sessionStorage.setItem('twitter_profile', JSON.stringify(data.profile));
          window.location.replace('/');
        }
      } catch (error) {
        console.error('Twitter callback error:', error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'TWITTER_ERROR',
            error: error.message
          }, window.location.origin);
          window.close();
        } else {
          sessionStorage.setItem('twitter_error', error.message);
          window.location.replace('/');
        }
      }
    };
    handleCallback();
  }, []);
  return <div>Processing Twitter login...</div>;
}
