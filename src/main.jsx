import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { TwitterCallback } from './components/TwitterCallback'

const params = new URLSearchParams(window.location.search || window.location.hash.substring(1));
const code = params.get('code');
const state = params.get('state');

const root = createRoot(document.getElementById('root'));

if (code && state) {
  root.render(
    <StrictMode>
      <TwitterCallback />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
