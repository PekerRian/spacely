// Minimal Vercel serverless function for Twitter OAuth2 token exchange and profile fetch

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, code_verifier, redirect_uri } = req.body;
  if (!code || !code_verifier || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Exchange code for access token
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    code_verifier,
    client_id: process.env.TWITTER_CLIENT_ID,
    client_secret: process.env.TWITTER_CLIENT_SECRET,
  });

  try {
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(400).json({ error: tokenData.error || 'Token exchange failed' });
    }
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profileRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,description', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      return res.status(400).json({ error: profileData.error || 'Profile fetch failed' });
    }
    return res.status(200).json({ profile: profileData.data });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
