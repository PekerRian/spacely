import { OAuth } from 'oauth';

const oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_API_KEY,
  process.env.TWITTER_API_SECRET,
  '1.0A',
  process.env.TWITTER_CALLBACK_URL,
  'HMAC-SHA1'
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
      if (error) {
        console.error('OAuth request token error:', error);
        console.error('Environment:', {
          TWITTER_API_KEY: process.env.TWITTER_API_KEY,
          TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
          TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL
        });
        res.status(500).json({ error: 'Failed to get request token', details: error, env: {
          TWITTER_API_KEY: !!process.env.TWITTER_API_KEY,
          TWITTER_API_SECRET: !!process.env.TWITTER_API_SECRET,
          TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL
        }});
        return;
      }
      if (!oauthToken) {
        console.error('No OAuth token received from Twitter.', { results });
        res.status(500).json({ error: 'No OAuth token received from Twitter.', results });
        return;
      }
      const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`;
      res.status(200).json({ authUrl });
    });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error', details: err?.message || err });
  }
}
