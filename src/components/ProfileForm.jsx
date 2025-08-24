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
              style={{ marginTop: '0.5em' }}
              onClick={onTwitterAuth}
            >
              Connect Twitter
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
