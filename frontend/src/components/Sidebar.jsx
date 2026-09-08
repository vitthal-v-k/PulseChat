import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BsChatDotsFill, BsPeopleFill, BsThreeDotsVertical, BsSun, BsMoon, BsPersonCircle, BsGearFill, BsCameraVideoFill, BsImageFill, BsMicFill, BsFileEarmarkFill, BsPeopleFill as BsGroupFill } from 'react-icons/bs';
import { MdOutlineAmpStories } from 'react-icons/md';
import { FiSearch, FiPlus, FiTrash2, FiSlash, FiUserX, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StoryRing from './StoryRing';
import ConfirmModal from './ConfirmModal';

import { friendApi } from '../api/friends';

// Helper: pick a consistent gradient from name
const nameGradients = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-orange-400 to-amber-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];
const getGradient = (name = '') => {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return nameGradients[code % nameGradients.length];
};

// Helper: message preview icon
const MsgTypeIcon = ({ type }) => {
  const cls = 'inline mr-1 shrink-0 opacity-70';
  if (type === 'IMAGE') return <BsImageFill size={11} className={cls} />;
  if (type === 'VIDEO') return <BsCameraVideoFill size={11} className={cls} />;
  if (type === 'AUDIO') return <BsMicFill size={11} className={cls} />;
  if (type === 'DOCUMENT') return <BsFileEarmarkFill size={11} className={cls} />;
  return null;
};

const Sidebar = ({
  activeTab,
  setActiveTab,
  chats,
  activeChat,
  onSelectChat,
  onOpenNewGroup,
  searchTerm,
  setSearchTerm,
  onClearChat,
  onDeleteChat,
  hiddenStatusUsers,
  onToggleHideStatus,
  onBlockUser,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, chat }
  const contextMenuRef = useRef(null);
  const longPressTimer = useRef(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null, // 'clear' | 'delete' | 'block'
    chat: null,
    loading: false,
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const handleContextMenu = useCallback((e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 200;
    const menuHeight = 220;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
    setContextMenu({ x, y, chat });
  }, []);

  // Long-press for mobile (500ms hold = open context menu)
  const handleTouchStart = useCallback((e, chat) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      const menuWidth = 200;
      const menuHeight = 220;
      const x = Math.min(touch.clientX, window.innerWidth - menuWidth - 8);
      const y = Math.min(touch.clientY, window.innerHeight - menuHeight - 8);
      setContextMenu({ x, y, chat });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const openClearConfirm = (chat) => {
    setContextMenu(null);
    setConfirmState({ isOpen: true, type: 'clear', chat, loading: false });
  };

  const openDeleteConfirm = (chat) => {
    setContextMenu(null);
    setConfirmState({ isOpen: true, type: 'delete', chat, loading: false });
  };

  const openBlockConfirm = (chat) => {
    setContextMenu(null);
    setConfirmState({ isOpen: true, type: 'block', chat, loading: false });
  };

  const handleHideStatus = (chat) => {
    const userId = chat?.otherParticipant?.id;
    if (!userId) return;
    setContextMenu(null);
    onToggleHideStatus?.(userId);
  };

  const handleConfirm = async () => {
    if (!confirmState.chat) return;
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmState.type === 'clear') {
        await onClearChat?.(confirmState.chat.id);
      } else if (confirmState.type === 'delete') {
        await onDeleteChat?.(confirmState.chat.id);
      } else if (confirmState.type === 'block') {
        const userId = confirmState.chat?.otherParticipant?.id;
        if (userId) await onBlockUser?.(userId);
      }
    } finally {
      setConfirmState({ isOpen: false, type: null, chat: null, loading: false });
    }
  };

  const chatName = (chat) =>
    chat?.type === 'GROUP'
      ? chat.name
      : chat?.otherParticipant?.fullName || chat?.otherParticipant?.username || 'User';

  return (
    <div className="w-full md:w-96 h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-[#222d34] text-gray-800 dark:text-gray-200 select-none transition-colors">
      
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between border-b border-gray-200 dark:border-[#222d34]">
        <div
          onClick={() => setActiveTab('profile')}
          title="View Profile"
          className="flex items-center gap-3 cursor-pointer p-1 -ml-1 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-700/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 border border-teal-400/40 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {user?.fullName || user?.username}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold tracking-wide uppercase">Online</span>
              {user?.uniqueNumber && (
                <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-full px-1.5 py-px" title="Your unique 7-digit User ID">
                  #{user.uniqueNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setActiveTab('profile')}
            title="My Profile"
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-gray-700' : 'hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-gray-700/50'
            }`}
          >
            <BsPersonCircle size={18} />
          </button>
          <button
            onClick={toggleTheme}
            title="Toggle Theme"
            className="hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-200/80 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <BsSun size={18} className="text-yellow-400" /> : <BsMoon size={18} className="text-gray-700" />}
          </button>
          <button
            onClick={onOpenNewGroup}
            title="New Group"
            className="hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-200/80 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            <FiPlus size={19} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs — desktop only; mobile uses the bottom nav bar */}
      <div className="hidden md:flex justify-around bg-white dark:bg-[#111b21] border-b border-gray-200 dark:border-[#222d34] px-2 py-1.5 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chats'
              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-gray-100 dark:hover:bg-gray-800/40'
          }`}
        >
          <BsChatDotsFill size={17} />
          <span>Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-gray-100 dark:hover:bg-gray-800/40'
          }`}
        >
          <BsPeopleFill size={17} />
          <span>Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-gray-100 dark:hover:bg-gray-800/40'
          }`}
        >
          <MdOutlineAmpStories size={19} />
          <span>Status</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-gray-100 dark:hover:bg-gray-800/40'
          }`}
        >
          <BsGearFill size={16} />
          <span>Settings</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-slate-50/70 dark:bg-[#111b21]">
        <div className="relative flex items-center bg-white dark:bg-[#202c33] rounded-xl px-3.5 py-1.5 border border-gray-200/80 dark:border-[#222d34] shadow-xs focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
          <FiSearch className="text-gray-400 dark:text-gray-400 mr-2 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search or start new chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#2a3942] scrollbar-track-transparent">
        {chats && chats.length > 0 ? (
          chats.filter(Boolean).map((chat) => {
            if (!chat || !chat.id) return null;
            const isSelected = activeChat && Number(activeChat.id) === Number(chat.id);
            const displayName = chat.type === 'GROUP'
              ? chat.name
              : (chat.otherParticipant?.fullName || chat.otherParticipant?.username || 'User');
            const displayAvatar = chat.type === 'GROUP' ? chat.groupPicture : chat.otherParticipant?.profilePicture;
            const gradient = getGradient(displayName);
            const isOnline = chat.type === 'PRIVATE' && chat.otherParticipant?.isOnline;
            const lastMsgType = chat.lastMessage?.messageType;
            const lastMsgContent = (chat.lastMessage?.content || '').replace(/\[STORY_ID:\d+\]\s*/g, '');

            return (
              <div
                key={chat.id}
                onClick={(e) => { e.stopPropagation(); if (onSelectChat) onSelectChat(chat); }}
              onContextMenu={(e) => handleContextMenu(e, chat)}
                onTouchStart={(e) => handleTouchStart(e, chat)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                className={`
                  group relative flex items-center gap-4 px-4 py-4 cursor-pointer
                  transition-all duration-200 ease-out
                  ${isSelected
                    ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 dark:from-teal-900/20 dark:to-emerald-900/10 border-l-[3px] border-teal-500'
                    : 'border-l-[3px] border-transparent hover:bg-gray-50/80 dark:hover:bg-white/[0.03] hover:translate-x-0.5'}
                `}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {/* Glowing ring when selected or online */}
                  <div className={`
                    w-14 h-14 p-[2.5px] rounded-full transition-all duration-300
                    ${isSelected
                      ? 'bg-gradient-to-tr from-teal-400 to-emerald-400 shadow-lg shadow-teal-500/30'
                      : isOnline
                        ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 shadow-md shadow-emerald-400/20'
                        : 'bg-gray-200/60 dark:bg-white/10'}
                  `}>
                    <div className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-tr ${gradient} text-white flex items-center justify-center font-bold text-lg uppercase`}>
                      {displayAvatar
                        ? <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                        : <span className="text-base font-extrabold tracking-wide drop-shadow">{displayName?.charAt(0) || 'C'}</span>
                      }
                    </div>
                  </div>

                  {/* Online dot */}
                  {isOnline && (
                    <span className="absolute bottom-0.5 right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#111b21]" />
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name + Time row */}
                  <div className="flex justify-between items-center mb-[4px]">
                    <h4 className={`
                      font-semibold text-[15px] truncate leading-tight transition-colors
                      ${isSelected
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white'}
                    `}>
                      {displayName}
                    </h4>
                    {chat.lastMessage && (
                      <span className={`
                        text-[11.5px] ml-2 shrink-0 font-medium tabular-nums
                        ${chat.unreadCount > 0
                          ? 'text-teal-600 dark:text-teal-400 font-bold'
                          : 'text-gray-400 dark:text-gray-500'}
                      `}>
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    )}
                  </div>

                  {/* Preview + Badge row */}
                  <div className="flex justify-between items-center gap-2">
                    <p className={`
                      truncate text-[13px] leading-snug flex items-center
                      ${chat.unreadCount > 0
                        ? 'text-gray-700 dark:text-gray-300 font-medium'
                        : 'text-gray-400 dark:text-gray-500'}
                    `}>
                      <MsgTypeIcon type={lastMsgType} />
                      {chat.lastMessage
                        ? (lastMsgType && lastMsgType !== 'TEXT'
                            ? lastMsgType.charAt(0) + lastMsgType.slice(1).toLowerCase()
                            : lastMsgContent || '…')
                        : <span className="italic opacity-60">No messages yet</span>}
                    </p>

                    {/* Unread badge */}
                    {chat.unreadCount > 0 && (
                      <span className="
                        shrink-0 min-w-[22px] h-6 px-1.5
                        bg-gradient-to-br from-teal-500 to-emerald-500
                        text-white text-[11px] font-extrabold
                        rounded-full flex items-center justify-center
                        shadow-md shadow-teal-500/40
                        animate-[pop_0.2s_ease-out]
                      ">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Three-dot on hover */}
                  <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleContextMenu(e, chat); }}
                  className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-white/10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                  title="Chat options"
                >
                  <BsThreeDotsVertical size={14} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400 dark:text-gray-500 text-sm select-none">
            <BsChatDotsFill size={28} className="opacity-30" />
            <p className="font-medium">No conversations yet</p>
            <p className="text-xs opacity-60">Start a new chat from Contacts</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[100] bg-white dark:bg-[#233138] border border-gray-200 dark:border-[#374045] rounded-xl shadow-2xl overflow-hidden py-1 min-w-[180px] animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chat name header */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-[#374045]">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[160px]">
              {chatName(contextMenu.chat)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openClearConfirm(contextMenu.chat)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <FiSlash size={15} />
            Clear Chat
          </button>

          <button
            type="button"
            onClick={() => openDeleteConfirm(contextMenu.chat)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <FiTrash2 size={15} />
            Delete Chat
          </button>

          {contextMenu.chat?.type !== 'GROUP' && (
            <>
              <div className="border-t border-gray-100 dark:border-[#374045] my-1" />
              <button
                type="button"
                onClick={() => handleHideStatus(contextMenu.chat)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <FiEyeOff size={15} />
                {hiddenStatusUsers?.includes(contextMenu.chat?.otherParticipant?.id)
                  ? 'Show Status'
                  : 'Hide Status'}
              </button>
              <button
                type="button"
                onClick={() => openBlockConfirm(contextMenu.chat)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer font-semibold"
              >
                <FiUserX size={15} />
                Block
              </button>
            </>
          )}
        </div>
      )}

      {/* Block Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen && confirmState.type === 'block'}
        onClose={() => setConfirmState({ isOpen: false, type: null, chat: null, loading: false })}
        onConfirm={handleConfirm}
        title="Block User"
        message={`Block "${chatName(confirmState.chat)}"? They won't be able to message you or see your status.`}
        confirmText={confirmState.loading ? 'Blocking…' : 'Block'}
        loading={confirmState.loading}
        isDanger={true}
      />

      {/* Clear Chat Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen && confirmState.type === 'clear'}
        onClose={() => setConfirmState({ isOpen: false, type: null, chat: null, loading: false })}
        onConfirm={handleConfirm}
        title="Clear Chat History"
        message={`Clear all messages in "${chatName(confirmState.chat)}" for yourself? This cannot be undone.`}
        confirmText={confirmState.loading ? 'Clearing…' : 'Clear Chat'}
        loading={confirmState.loading}
        isDanger={false}
      />

      {/* Delete Chat Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen && confirmState.type === 'delete'}
        onClose={() => setConfirmState({ isOpen: false, type: null, chat: null, loading: false })}
        onConfirm={handleConfirm}
        title="Delete Chat"
        message={`Delete your conversation with "${chatName(confirmState.chat)}"? The chat will be removed from your list.`}
        confirmText={confirmState.loading ? 'Deleting…' : 'Delete Chat'}
        loading={confirmState.loading}
        isDanger={true}
      />
    </div>
  );
};

export default Sidebar;
