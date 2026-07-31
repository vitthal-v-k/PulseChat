import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { userApi } from '../api/users';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up stale leftover keys from other local projects on port 5173
    ['jarvis_token', 'jarvis-auth', 'jarvis-voice-store', 'neuroq-auth', 'coc-converter-store', 'epr_suggested'].forEach(
      (key) => localStorage.removeItem(key)
    );

    if (token) {
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
      }
      sessionStorage.setItem('token', token);
      userApi.getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          sessionStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (authData) => {
    setToken(authData.token);
    localStorage.setItem('token', authData.token);
    sessionStorage.setItem('token', authData.token);
    sessionStorage.setItem('sessionId', 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));

    const userData = {
      id: authData.userId,
      username: authData.username,
      uniqueNumber: authData.uniqueNumber,
      email: authData.email,
      fullName: authData.fullName,
      profilePicture: authData.profilePicture,
      isEmailVerified: authData.emailVerified,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const newObj = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newObj));
      sessionStorage.setItem('user', JSON.stringify(newObj));
      return newObj;
    });
  };

  const logout = async () => {
    try {
      if (token) await authApi.logout();
    } catch (e) {
      console.warn('Logout API failed or session expired');
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
