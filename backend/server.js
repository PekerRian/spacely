import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { OAuth } from 'oauth';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Twitter OAuth configuration
const oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_API_KEY,
  process.env.TWITTER_API_SECRET,
  '1.0A',
  process.env.TWITTER_CALLBACK_URL,
  'HMAC-SHA1'
);

// No MongoDB schema needed

// Routes
app.post('/api/auth/twitter/start', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to get request token' });
    }

    // Store tokens and wallet address in session
    req.session.oauthRequestToken = oauthToken;
    req.session.oauthRequestTokenSecret = oauthTokenSecret;
    req.session.walletAddress = walletAddress;

    // Redirect URL for Twitter authentication
    const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`;
    res.json({ authUrl });
  });
});

app.get('/api/auth/twitter/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;

  if (!req.session.oauthRequestToken) {
    return res.status(400).json({ error: 'No OAuth request token found' });
  }

  oauth.getOAuthAccessToken(
    oauth_token,
    req.session.oauthRequestTokenSecret,
    oauth_verifier,
    async (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to get access token' });
      }

      try {
        // Get Twitter user details
        oauth.get(
          'https://api.twitter.com/1.1/account/verify_credentials.json',
          oauthAccessToken,
          oauthAccessTokenSecret,
          async (error, data) => {
            if (error) {
              return res.status(500).json({ error: 'Failed to get user details' });
            }

            const twitterData = JSON.parse(data);
            const walletAddress = req.session.walletAddress;

            // Clear session
            req.session.destroy();

            // Return Twitter data and wallet address to frontend
            // Add all required fields for the frontend popup
            const params = new URLSearchParams({
              auth: 'success',
              twitterId: twitterData.id_str,
              twitterUsername: twitterData.screen_name,
              twitterName: twitterData.name || '',
              twitterBio: twitterData.description || '',
              twitterProfileImageUrl: twitterData.profile_image_url_https || twitterData.profile_image_url || '',
              walletAddress: walletAddress || ''
            });
            res.redirect(`${process.env.FRONTEND_URL}?${params.toString()}`);
          }
        );
      } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
      }
    }
  );
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
