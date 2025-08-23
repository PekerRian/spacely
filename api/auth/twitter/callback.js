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
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const { oauth_token, oauth_verifier } = req.query;
    if (!oauth_token || !oauth_verifier) {
      res.status(400).json({ error: 'Missing oauth_token or oauth_verifier' });
      return;
    }
    oauth.getOAuthAccessToken(
      oauth_token,
      null, // No request token secret in serverless, so pass null
      oauth_verifier,
      async (error, oauthAccessToken, oauthAccessTokenSecret) => {
        if (error) {
          res.status(500).json({ error: 'Failed to get access token', details: error });
          return;
        }
        oauth.get(
          'https://api.twitter.com/1.1/account/verify_credentials.json',
          oauthAccessToken,
          oauthAccessTokenSecret,
          (error, data) => {
            if (error) {
              res.status(500).json({ error: 'Failed to get user details', details: error });
              return;
            }
            try {
              const twitterData = JSON.parse(data);
              // Redirect to /user with profile info
              const redirectUrl = `${process.env.FRONTEND_URL}/user?auth=success&twitterId=${twitterData.id_str}&twitterUsername=${twitterData.screen_name}&name=${encodeURIComponent(twitterData.name || '')}&bio=${encodeURIComponent(twitterData.description || '')}&profile_image=${encodeURIComponent(twitterData.profile_image_url || '')}`;
              res.writeHead(302, { Location: redirectUrl });
              res.end();
            } catch (err) {
              res.status(500).json({ error: 'Failed to parse Twitter data', details: err });
            }
          }
        );
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error', details: err?.message || err });
  }
}
