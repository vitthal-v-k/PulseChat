import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/users';
import { BsCameraFill, BsPersonFill, BsPencilFill, BsCheck } from 'react-icons/bs';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || 'Available');
  const [editing, setEditing] = useState(false);

  const handleAvatarUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await userApi.uploadProfilePicture(formData);
        updateUser(res.data);
      } catch (err) {
        alert(err.response?.data?.message || 'Avatar upload failed');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await userApi.updateProfile({ fullName, bio });
      updateUser(res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update failed');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 p-6 overflow-y-auto transition-colors">
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-teal-600 dark:text-teal-400">User Profile</h2>

        <div className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] rounded-2xl p-6 flex flex-col items-center shadow-md">
          
          {/* Avatar Upload */}
          <div className="relative group mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-teal-500/50 bg-gray-300 dark:bg-gray-800 flex items-center justify-center font-bold text-3xl text-gray-700 dark:text-white uppercase shadow-md">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.username?.charAt(0)
              )}
            </div>
            <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
              <BsCameraFill size={26} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          {/* User ID Badge */}
          <div className="flex flex-col items-center gap-1 mb-4">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{user?.fullName || user?.username}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 px-2.5 py-1 rounded-full shadow-sm" title="Your unique 7-digit User ID — share this so others can find you">
                #{user?.uniqueNumber || '-------'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Share your ID so others can find you</p>
          </div>

          <div className="w-full space-y-6">
            <div>
              <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">Your Name</label>
              <div className="flex items-center justify-between bg-gray-100 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] px-4 py-3 rounded-xl">
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none w-full"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.fullName || 'Not set'}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">About / Bio</label>
              <div className="flex items-center justify-between bg-gray-100 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] px-4 py-3 rounded-xl">
                {editing ? (
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none w-full"
                  />
                ) : (
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user?.bio || 'Hey there! I am using ChatApp.'}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">Username</label>
              <div className="bg-gray-100 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-400">
                @{user?.username}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">Email</label>
              <div className="bg-gray-100 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              {editing ? (
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-[#202c33] hover:bg-gray-200 dark:hover:bg-[#2a3942] text-gray-800 dark:text-white font-semibold text-sm rounded-xl transition-colors border border-gray-200 dark:border-[#222d34] cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
