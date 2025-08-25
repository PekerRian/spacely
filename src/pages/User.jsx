import './user.css';
import { useState, useContext } from 'react';
import { ProfileForm } from '../components/ProfileForm';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { TwitterAuthContext } from '../contexts/TwitterAuthContext';

export default function User() {
  const { walletAddress } = useWallet();
  const { twitterProfile, showProfileForm, setShowProfileForm } = useContext(TwitterAuthContext);
  const [tab, setTab] = useState('badges');

  let content;
  if (tab === 'badges') {
    content = (
      <div className="user-tab-inner-box user-box-content">
        <div className="badges-grid">
          {Array.from({ length: 30 }, (_, i) => (
            <img
              key={i}
              src={`https://placehold.co/80x80/22ff22/111?text=B${i + 1}`}
              alt={`Badge ${i + 1}`}
              className="badge-img"
            />
          ))}
        </div>
      </div>
    );
  } else if (tab === 'poaps') {
    content = <div className="user-tab-inner-box user-box-content">POAPs content goes here.</div>;
  } else if (tab === 'messages') {
    content = <div className="user-tab-inner-box user-box-content">Messages content goes here.</div>;
  }

  return (
    <div className="page-container user-flex-row">
      <div className="user-left-box">
        <div className="profile-card">
          <img 
            className="profile-avatar" 
            src={twitterProfile?.profile_image_url || "https://placehold.co/120x120/22ff22/111?text=IMG"} 
            alt="Profile" 
          />
          <div className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Username:</span> 
              <span className="profile-value">{twitterProfile?.handle || 'spaceuser123'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Twitter:</span> 
              <span className="profile-value">
                {twitterProfile?.url ? (
                  <a href={twitterProfile.url} target="_blank" rel="noopener noreferrer">
                    @{twitterProfile.handle}
                  </a>
                ) : '@spaceuser'}
              </span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Affiliation:</span> 
              <span className="profile-value">Galactic Org</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Connections:</span> 
              <span className="profile-value">42</span>
            </div>
            <div className="profile-row profile-bio-row">
              <span className="profile-label">Bio:</span> 
              <span className="profile-value">{twitterProfile?.bio || 'Exploring the universe, one badge at a time.'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="user-right-box">
        <div className="user-right-nav">
          <button className={tab === 'badges' ? 'user-nav-btn active' : 'user-nav-btn'} onClick={() => setTab('badges')}>Badges</button>
          <button className={tab === 'poaps' ? 'user-nav-btn active' : 'user-nav-btn'} onClick={() => setTab('poaps')}>POAPs</button>
          <button className={tab === 'messages' ? 'user-nav-btn active' : 'user-nav-btn'} onClick={() => setTab('messages')}>Messages</button>
        </div>
        {content}
      </div>
      <ProfileForm 
        isOpen={showProfileForm}
        onClose={() => setShowProfileForm(false)}
        walletAddress={walletAddress}
        twitterProfile={twitterProfile}
      />
    </div>
  );
}
