import { OAuth } from 'oauth';
import kv from '@vercel/kv';

const oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_API_KEY,
  process.env.TWITTER_API_SECRET,
  '1.0A',
  process.env.TWITTER_CALLBACK_URL,
  'HMAC-SHA1'
);

function getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier) {
  return new Promise((resolve, reject) => {
    oauth.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (err, accessToken, accessTokenSecret) => {
      if (err) return reject(err);
      resolve({ accessToken, accessTokenSecret });
    });
  });
}

function getTwitterUser(accessToken, accessTokenSecret) {
  return new Promise((resolve, reject) => {
    oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json', accessToken, accessTokenSecret, (err, data) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { oauth_token: oauthToken, oauth_verifier: oauthVerifier } = req.body || {};
  if (!oauthToken || !oauthVerifier) return res.status(400).json({ error: 'Missing oauth params' });

  try {
    const raw = await kv.get(`oauth:${oauthToken}`);
    if (!raw) return res.status(400).json({ error: 'No matching OAuth session' });
    const { oauthTokenSecret, walletAddress } = JSON.parse(raw);

    const { accessToken, accessTokenSecret } = await getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier);
    const twitterData = await getTwitterUser(accessToken, accessTokenSecret);

    // Clean up KV
    await kv.del(`oauth:${oauthToken}`);

    return res.json({ twitterData, walletAddress });
  } catch (err) {
    console.error('[api/auth/twitter/complete] error:', err);
    return res.status(500).json({ error: 'Failed to complete OAuth' });
  }
}
