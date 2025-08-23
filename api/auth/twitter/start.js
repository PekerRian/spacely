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

function getRequestToken() {
  return new Promise((resolve, reject) => {
    oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
      if (error) return reject(error);
      resolve({ oauthToken, oauthTokenSecret });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { walletAddress } = req.body || {};
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  // Quick config checks to help debug serverless 500s
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || !process.env.TWITTER_CALLBACK_URL) {
    console.error('[api/auth/twitter/start] Missing required Twitter env vars', {
      hasKey: !!process.env.TWITTER_API_KEY,
      hasSecret: !!process.env.TWITTER_API_SECRET,
      hasCallback: !!process.env.TWITTER_CALLBACK_URL
    });
    return res.status(500).json({ error: 'Server misconfigured: missing TWITTER_API_KEY, TWITTER_API_SECRET or TWITTER_CALLBACK_URL' });
  }

  try {
    const { oauthToken, oauthTokenSecret } = await getRequestToken();

    // Persist the request token secret and wallet address in Vercel KV keyed by oauthToken
    // TTL set to 5 minutes
    try {
      await kv.set(`oauth:${oauthToken}`, JSON.stringify({ oauthTokenSecret, walletAddress }), { ex: 300 });
    } catch (kvErr) {
      console.error('[api/auth/twitter/start] Vercel KV set error:', kvErr);
      return res.status(500).json({ error: 'Vercel KV error', details: kvErr?.message || String(kvErr) });
    }

    const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`;
    return res.json({ authUrl });
  } catch (err) {
    console.error('[api/auth/twitter/start] error:', err);
    return res.status(500).json({ error: 'Failed to get request token' });
  }
}
