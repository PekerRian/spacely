// Vercel/Next.js API route: /api/auth/twitter/callback
// Handles the redirect from Twitter after user authorizes the app

// Helper to parse cookies from request headers
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    });
  }
  return list;
}

export default async function handler(req, res) {
  // Twitter will redirect with ?code=...&state=...
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send('Missing code');
  }

  // Read code_verifier and state from cookies
  const cookies = parseCookies(req);
  const code_verifier = cookies['twitter_code_verifier'];
  const expected_state = cookies['twitter_state'];
  if (!code_verifier || !expected_state) {
    return res.status(400).send('Missing PKCE or state');
  }
  if (state !== expected_state) {
    return res.status(400).send('State mismatch');
  }
  const redirect_uri = process.env.TWITTER_REDIRECT_URI || `${req.headers.origin}/api/auth/twitter/callback`;

  // Exchange code for access token
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    code_verifier,
    client_id: process.env.TWITTER_CLIENT_ID,
  });

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
    if (!tokenRes.ok) {
      return res.status(400).send('Token exchange failed: ' + (tokenData.error || 'Unknown error'));
    }
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profileRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,description', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      return res.status(400).send('Profile fetch failed: ' + (profileData.error || profileData.title || 'Unknown error'));
    }

    // Normalize profile: always include handle and twitter_url
    const normalized = {
      ...profileData.data,
      handle: profileData.data.username || profileData.data.handle || '',
      twitter_url: profileData.data.username ? `https://twitter.com/${profileData.data.username}` : '',
    };
    const html = `<!DOCTYPE html><html><body><script>window.opener && window.opener.postMessage({type:'TWITTER_PROFILE',profile:${JSON.stringify(normalized)}}, window.origin);window.close();</script></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('Internal server error: ' + error.message);
  }
}
