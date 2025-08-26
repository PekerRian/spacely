import { createContext } from 'react';

export const TwitterAuthContext = createContext({
  twitterProfile: null,
  setTwitterProfile: () => {},
  showProfileForm: false,
  setShowProfileForm: () => {}
});
