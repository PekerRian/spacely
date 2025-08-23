import { useState, useEffect } from 'react';
import { useProfileContract } from '../hooks/useProfileContract';
import { useWallet } from '../contexts/WalletContext';
import '../styles/modal.css';

export function ProfileForm({ isOpen, onClose, walletAddress, twitterProfile }) {
  console.log('[ProfileForm] Rendered. twitterProfile prop:', twitterProfile);
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
    console.log('twitterProfile in ProfileForm:', twitterProfile);
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
    try {
      await createProfile(formData);
      onClose();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="form-control"
              placeholder="Tell us about yourself"
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label>Profile Image URL</label>
            <input
              type="url"
              name="profile_image"
              value={formData.profile_image}
              onChange={handleChange}
              className="form-control"
              placeholder="https://your-image-url.com"
              required
            />
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
              disabled
            />
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || !connected}
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
