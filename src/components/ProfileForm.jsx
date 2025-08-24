import { useState, useEffect } from 'react';
import { useProfileContract } from '../hooks/useProfileContract';
import { useWallet } from '../contexts/WalletContext';
import '../styles/modal.css';

export function ProfileForm({ isOpen, onClose, walletAddress, twitterProfile, onTwitterAuth }) {
  const { createProfile, loading } = useProfileContract();
  const { connected } = useWallet();
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profile_image: '',
    affiliation: '',
    twitter_url: ''
  });

  // Update form when Twitter profile changes
  useEffect(() => {
    if (twitterProfile) {
      setFormData(prev => ({
        username: twitterProfile.handle || prev.username,
        bio: twitterProfile.bio || prev.bio,
        profile_image: twitterProfile.profile_image_url || prev.profile_image,
        affiliation: prev.affiliation,
        twitter_url: twitterProfile.url || ''
      }));
    }
  }, [twitterProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!connected) {
      alert('Please connect your wallet to create a profile.');
      return;
    }
    try {
      await createProfile(formData);
      onClose();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-content" style={{ zIndex: 10000, background: 'linear-gradient(135deg, #1a2236 60%, #232946 100%)', color: '#e0e6f6', borderRadius: '18px', boxShadow: '0 4px 32px 0 #23294688', padding: '32px 24px', maxWidth: '400px', margin: '40px auto', position: 'relative' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Complete Your Profile</h2>
        {!connected && (
          <div className="wallet-warning" style={{ color: 'red', marginBottom: '1em' }}>
            Please connect your wallet to create a profile.
          </div>
        )}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-control"
              placeholder="Your username"
              required
            />
          </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 500, color: '#e0e6f6' }}>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Tell us about yourself"
                  rows="3"
                  required
                  style={{ background: '#232946', color: '#e0e6f6', border: '1px solid #2d3250', borderRadius: '8px', padding: '8px' }}
                />
              </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label>Profile Image</label>
            {formData.profile_image && (
              <img
                src={formData.profile_image}
                alt="Profile"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '8px auto' }}
              />
            )}
          </div>
          <div className="form-group">
            <label>Affiliation</label>
            <input
              type="text"
              name="affiliation"
              value={formData.affiliation}
              onChange={handleChange}
              className="form-control"
              placeholder="Your organization or affiliation"
              required
            />
          </div>
          <div className="form-group">
            <label>Twitter URL</label>
            <input
              type="url"
              name="twitter_url"
              value={formData.twitter_url}
              className="form-control"
              readOnly
            />
            <button
                type="button"
                className="login-option"
                style={{
                  marginTop: '0.5em',
                  background: 'linear-gradient(90deg, #1da1f2 0%, #0a192f 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #23294644',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center'
                }}
                onClick={onTwitterAuth}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.09 9.09 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.4 4.07 3.67 1.64.9c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.48 4.48 0 01.96 6.1v.06c0 2.13 1.52 3.91 3.54 4.31-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.72 2.16 2.97 4.07 3A9.06 9.06 0 010 19.54a12.8 12.8 0 006.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.01-.58A9.22 9.22 0 0023 3z" fill="#fff"/>
                </svg>
                Connect with Twitter
              </button>
          </div>
              <button type="submit" className="submit-button" disabled={loading} style={{ background: 'linear-gradient(90deg, #6c63ff 0%, #232946 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px #23294644' }}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
        </form>
      </div>
    </div>
  );
}
