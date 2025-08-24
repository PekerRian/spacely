// Minimal Vercel serverless function for Twitter OAuth2 token exchange and profile fetch

export default async function handler(req, res) {
  console.log('[twitter-callback] Method:', req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  // Vercel may not parse JSON automatically in some runtimes
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.log('[twitter-callback] Failed to parse body:', req.body);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  console.log('[twitter-callback] Body:', body);
  const { code, code_verifier, redirect_uri } = body;
  if (!code || !code_verifier || !redirect_uri) {
    console.log('[twitter-callback] Missing required fields:', { code, code_verifier, redirect_uri });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Log env vars (do not log secrets in production, but for debug only)
  console.log('[twitter-callback] TWITTER_CLIENT_ID:', process.env.TWITTER_CLIENT_ID);
  console.log('[twitter-callback] TWITTER_CLIENT_SECRET exists:', !!process.env.TWITTER_CLIENT_SECRET);

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    code_verifier,
    client_id: process.env.TWITTER_CLIENT_ID,
    // Do NOT include client_secret in body for PKCE
  });

  // Prepare Basic Auth header
  const basicAuth = Buffer.from(
    `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
    console.log('[twitter-callback] Token response:', tokenData);
    if (!tokenRes.ok) {
      return res.status(400).json({ error: tokenData.error || 'Token exchange failed' });
    }
    const accessToken = tokenData.access_token;

    const profileRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,description', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json();
    console.log('[twitter-callback] Profile response:', profileData);
    if (!profileRes.ok) {
      // Handle Twitter rate limit (429)
      if (profileRes.status === 429) {
        return res.status(429).json({ error: 'Twitter rate limit exceeded. Please wait a few minutes before trying again.' });
      }
      // Handle other errors
      return res.status(400).json({ error: profileData.error || profileData.title || 'Profile fetch failed' });
    }
    return res.status(200).json({ profile: profileData.data });
  } catch (error) {
    console.log('[twitter-callback] Exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
