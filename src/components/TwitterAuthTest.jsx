import { useState } from 'react';

export function TwitterAuthTest() {
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      // We already have a bearer token from environment variables
      const bearerToken = import.meta.env.VITE_TWITTER_BEARER_TOKEN;

      // Now proceed with OAuth using the bearer token
      const state = crypto.randomUUID();
      const params = new URLSearchParams({
        response_type: 'token',
        client_id: 'xEysQo3YmebKkgZcxr0rZW07M',
        redirect_uri: 'http://localhost:5173',
        scope: 'users.read',
        state: state
      });

      // Try to authenticate directly with the bearer token
      const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Twitter');
      }

      const userData = await response.json();

      // You can now use the user data as needed
      return userData;
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleLogin}>
        Test Twitter Login
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
