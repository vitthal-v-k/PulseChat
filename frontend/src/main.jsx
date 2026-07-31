import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clean up non-chatapp stale keys from previous projects on localhost:5173
const ALLOWED_KEYS = new Set([
  'token',
  'user',
  'theme',
  'privacy_last_seen',
  'privacy_profile_vis',
  'privacy_read_receipts',
  'notifications_enabled',
]);

try {
  Object.keys(localStorage).forEach((key) => {
    if (!ALLOWED_KEYS.has(key)) {
      localStorage.removeItem(key);
    }
  });
} catch (e) {
  console.warn('LocalStorage cleanup failed:', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
