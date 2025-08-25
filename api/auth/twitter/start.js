
// Helper to base64url encode a buffer
function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper to generate a random string
function randomString(length = 64) {
  return base64url(require('crypto').randomBytes(length)).substring(0, length);
}

// Helper to generate S256 code challenge
async function pkceChallengeFromVerifier(verifier) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64url(hash);
}

export default async function handler(req, res) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = process.env.TWITTER_REDIRECT_URI || `${req.headers.origin}/api/auth/twitter/callback`;
  const state = randomString(32);
  const codeVerifier = randomString(64);
  const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);

  // Set code_verifier and state in secure, HTTP-only cookies
  res.setHeader('Set-Cookie', [
    `twitter_code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    `twitter_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  ]);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  res.writeHead(302, { Location: twitterAuthUrl });
  res.end();
}
