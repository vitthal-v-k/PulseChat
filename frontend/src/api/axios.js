import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

// Max retries for cold-start timeouts / network errors
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 s between retries

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: API_BASE_URL,
  // 65 s per attempt — Railway free tier can take 30-50 s to cold start
  timeout: 65000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Track retry count on the config object
    config._retryCount = config._retryCount ?? 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-retry on timeout / network error ────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Determine if this is a retryable cold-start error
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    const isNetworkError = !error.response && !isTimeout; // no response at all

    if (config && (isTimeout || isNetworkError) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;

      // Fire a custom event so UI can show "Waking server…" progress
      window.dispatchEvent(
        new CustomEvent('api:retrying', {
          detail: { attempt: config._retryCount, max: MAX_RETRIES },
        })
      );

      await sleep(RETRY_DELAY_MS);
      return api(config); // retry the original request
    }

    // Global 401 handling (non-login routes)
    if (error.response?.status === 401) {
      if (!config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
