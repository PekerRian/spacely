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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { walletAddress } = req.body;
  if (!walletAddress) {
    res.status(400).json({ error: 'Wallet address is required' });
    return;
  }

  oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
    if (error) {
      res.status(500).json({ error: 'Failed to get request token' });
      return;
    }
    // You may want to store oauthTokenSecret and walletAddress in a DB or encrypted cookie for callback
    const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`;
    res.status(200).json({ authUrl });
  });
}
