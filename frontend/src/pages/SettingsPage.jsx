import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/users';
import {
  BsMoon,
  BsSun,
  BsBellFill,
  BsShieldLockFill,
  BsDoorOpenFill,
  BsChevronRight,
  BsCheckCircleFill,
} from 'react-icons/bs';
import { FiX, FiShield, FiCheck, FiLoader } from 'react-icons/fi';

const mapToDb = (uiVal) => {
  if (uiVal === 'My Contacts') return 'CONTACTS';
  if (uiVal === 'Nobody') return 'NOBODY';
  return 'ALL';
};

const mapFromDb = (dbVal) => {
  if (dbVal === 'CONTACTS') return 'My Contacts';
  if (dbVal === 'NOBODY') return 'Nobody';
  return 'Everyone';
};

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();

  // Notification state with localStorage persistence
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') !== 'false';
  });

  // Privacy states synced with User profile
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [readReceipts, setReadReceipts] = useState(() => localStorage.getItem('privacy_read_receipts') !== 'false');
  const [lastSeen, setLastSeen] = useState(() => mapFromDb(user?.lastSeenPrivacy));
  const [profileVisibility, setProfileVisibility] = useState(() => mapFromDb(user?.profilePhotoPrivacy));
  const [isSaving, setIsSaving] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.lastSeenPrivacy) setLastSeen(mapFromDb(user.lastSeenPrivacy));
      if (user.profilePhotoPrivacy) setProfileVisibility(mapFromDb(user.profilePhotoPrivacy));
    }
  }, [user]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    localStorage.setItem('notifications_enabled', nextVal);
    if (nextVal && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    triggerToast(nextVal ? 'Message notifications enabled' : 'Message notifications muted');
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      const payload = {
        lastSeenPrivacy: mapToDb(lastSeen),
        profilePhotoPrivacy: mapToDb(profileVisibility),
      };

      const res = await userApi.updateProfile(payload);
      if (res && res.data) {
        updateUser(res.data);
      }

      localStorage.setItem('privacy_read_receipts', readReceipts);
      localStorage.setItem('privacy_last_seen', lastSeen);
      localStorage.setItem('privacy_profile_vis', profileVisibility);

      setShowPrivacyModal(false);
      triggerToast('Privacy preferences updated successfully!');
    } catch (err) {
      console.error('Failed to update privacy:', err);
      triggerToast(err.response?.data?.message || 'Failed to update privacy preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 p-6 overflow-y-auto transition-colors relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fadeIn">
          <BsCheckCircleFill size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-teal-600 dark:text-teal-400">App Settings</h2>

        <div className="space-y-4">
          
          {/* Theme Toggle */}
          <div className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
                {theme === 'dark' ? <BsMoon size={20} className="text-teal-400" /> : <BsSun size={20} className="text-amber-500" />}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Appearance</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Switch between Dark and Light mode</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-gray-100 dark:bg-[#202c33] hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-800 dark:text-white border border-gray-200 dark:border-[#222d34] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <BsBellFill size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Message tones and desktop alerts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Privacy & Security Settings */}
          <div
            onClick={() => setShowPrivacyModal(true)}
            className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4.5 rounded-2xl flex items-center justify-between shadow-sm hover:border-teal-500/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BsShieldLockFill size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Privacy & Security</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Read receipts, last seen, profile photo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">PROTECTED</span>
              <BsChevronRight size={14} className="text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
            </div>
          </div>

          {/* Sign Out Button */}
          <div
            onClick={logout}
            className="bg-red-500/10 border border-red-500/30 p-4.5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3.5 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <BsDoorOpenFill size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Sign Out</h4>
                <p className="text-xs opacity-75">Log out of your ChatApp account</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Privacy & Security Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] w-full max-w-md rounded-2xl p-6 relative text-gray-900 dark:text-gray-100 shadow-2xl">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FiShield size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Privacy & Security</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage who can see your activity</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Read Receipts */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-[#222d34]">
                <div>
                  <p className="font-semibold text-xs text-gray-900 dark:text-gray-100">Read Receipts</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">If turned off, blue ticks won't be sent</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Last Seen */}
              <div className="p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-[#222d34]">
                <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 mb-2">Who can see my Last Seen</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['Everyone', 'My Contacts', 'Nobody'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLastSeen(opt)}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        lastSeen === opt
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222d34]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Photo Visibility */}
              <div className="p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-[#222d34]">
                <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 mb-2">Profile Photo Visibility</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Everyone', 'My Contacts'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setProfileVisibility(opt)}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        profileVisibility === opt
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222d34]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-gray-200 dark:border-[#222d34]">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-[#202c33] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-semibold rounded-xl border border-gray-200 dark:border-transparent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={isSaving}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <FiLoader size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <FiCheck size={14} /> Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
