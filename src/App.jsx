import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TwitterAuthContext } from './contexts/TwitterAuthContext';
import './navbar.css';
import User from './pages/User.jsx';
import Calendar from './pages/Calendar.jsx';
import Ecosystem from './pages/Ecosystem.jsx';
import { WalletProvider } from './contexts/WalletContext';
import { WalletConnect } from './components/WalletConnect';

// Context to share Twitter profile and form state

function Starfield() {
  // Spiral starfield: each star gets a unique angle and speed
  const stars = Array.from({ length: 80 }).map((_, i) => {
    const size = Math.random() * 2 + 1;
    const angle = Math.random() * 2 * Math.PI; // random angle in radians
    const spiralTurns = Math.random() * 2 + 1.5; // 1.5 to 3.5 turns
    const duration = Math.random() * 3 + 12; // 8s to 16s (slower)
    const delay = Math.random() * 6;
    const opacity = Math.random() * 0.5 + 0.5;
    // Each star will animate from center (50vw, 50vh) outward in a spiral
    return (
      <div
        key={i}
        className="star spiral-star"
        style={{
          width: size + 'px',
          height: size + 'px',
          left: '50vw',
          top: '50vh',
          opacity,
          // Custom properties for animation
          '--spiral-angle': angle + 'rad',
          '--spiral-turns': spiralTurns,
          animationDuration: duration + 's',
          animationDelay: delay + 's',
        }}
      />
    );
  });
  return <div className="stars">{stars}</div>;
}

function App() {
  const [twitterProfile, setTwitterProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);

  useEffect(() => {
    // Listen for Twitter profile from popup (postMessage)
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'TWITTER_PROFILE') {
        const p = event.data.profile || {};
        const normalized = {
          handle: p.handle || p.twitterUsername || p.screen_name || null,
          url: p.url || (p.twitterUsername ? `https://twitter.com/${p.twitterUsername}` : '') || p.profileUrl || '',
          name: p.name || p.twitterName || p.screen_name || '',
          bio: p.bio || p.twitterBio || p.description || '',
          profile_image_url: p.profile_image_url || p.twitterProfileImageUrl || p.profile_image_url_https || ''
        };
        setTwitterProfile(normalized);
        setShowProfileForm(true);
      } else if (event.data && event.data.type === 'TWITTER_ERROR') {
        console.error('Twitter error:', event.data.error);
        alert('Twitter authentication failed: ' + event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    // Detect Twitter OAuth redirect in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      // Exchange code for profile
      fetch(`/api/twitter-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.profile) {
            const p = data.profile;
            const normalized = {
              handle: p.handle || p.twitterUsername || p.screen_name || null,
              url: p.url || (p.twitterUsername ? `https://twitter.com/${p.twitterUsername}` : '') || p.profileUrl || '',
              name: p.name || p.twitterName || p.screen_name || '',
              bio: p.bio || p.twitterBio || p.description || '',
              profile_image_url: p.profile_image_url || p.twitterProfileImageUrl || p.profile_image_url_https || ''
            };
            setTwitterProfile(normalized);
            setShowProfileForm(true);
          } else if (data && data.error) {
            alert('Twitter authentication failed: ' + data.error);
          }
        })
        .catch(err => {
          alert('Twitter authentication failed: ' + err.message);
        });
    }
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <WalletProvider>
      <TwitterAuthContext.Provider value={{ twitterProfile, setTwitterProfile, showProfileForm, setShowProfileForm }}>
        <Router>
          <div>
            <Starfield />
            <nav className="navbar">
              <div className="navbar-container">
                <div className="navbar-links">
                  <NavLink to="/user" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>👾 USER</NavLink>
                  <NavLink to="/calendar" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>🛸 CALENDAR</NavLink>
                  <NavLink to="/ecosystem" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>🚀 ECOSYSTEM</NavLink>
                </div>
                <WalletConnect />
              </div>
            </nav>
            <Routes>
              <Route path="/user" element={<User />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/ecosystem" element={<Ecosystem />} />
            </Routes>
          </div>
        </Router>
      </TwitterAuthContext.Provider>
    </WalletProvider>
  );
}

export default App;
