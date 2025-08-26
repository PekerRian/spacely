import './user.css';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import useProfileContract from '../hooks/useProfileContract';
import useProfileInfo from '../hooks/useProfileInfo';
import ProfileForm from '../components/ProfileForm';

export default function UserPage() {
  // Handler to trigger Twitter OAuth popup
  const onTwitterAuth = () => {
    const twitterAuthUrl = '/api/auth/twitter/start';
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      twitterAuthUrl,
      'TwitterAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=1`
    );
  };
  const { account } = useWallet();
  const walletAddress = account?.address;
  console.log('UserPage rendered, walletAddress:', walletAddress);
  const [twitterProfile, setTwitterProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const { checkProfile } = useProfileContract();
  const { profile: userProfile, loading: profileLoading } = useProfileInfo();

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'TWITTER_PROFILE') {
        setTwitterProfile(event.data.profile);
        setShowProfileForm(true);
      } else if (event.data.type === 'TWITTER_ERROR') {
        console.error('Twitter error:', event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  // Only show the ProfileForm if the user does NOT have an on-chain profile
  useEffect(() => {
    if (userProfile) {
      setShowProfileForm(false);
    } else if (walletAddress) {
      setShowProfileForm(true);
    }
  }, [userProfile, walletAddress]);

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
            src={userProfile?.profile_image || "https://placehold.co/120x120/22ff22/111?text=IMG"}
            alt="Profile"
          />
          <div className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Username:</span>
              <span className="profile-value">{userProfile?.username || 'spaceuser123'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Twitter:</span>
              <span className="profile-value">
                {userProfile?.twitter_url ? (
                  <a href={userProfile.twitter_url} target="_blank" rel="noopener noreferrer">
                    {userProfile.twitter_url.replace('https://twitter.com/', '@')}
                  </a>
                ) : '@spaceuser'}
              </span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Affiliation:</span>
              <span className="profile-value">{userProfile?.affiliation || 'Galactic Org'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Connections:</span>
              <span className="profile-value">42</span>
            </div>
            <div className="profile-row profile-bio-row">
              <span className="profile-label">Bio:</span>
              <span className="profile-value">{userProfile?.bio || 'Exploring the universe, one badge at a time.'}</span>
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
        onTwitterAuth={onTwitterAuth}
      />
    </div>
  );
}
