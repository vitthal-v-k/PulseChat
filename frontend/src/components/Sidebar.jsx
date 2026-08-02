import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BsChatDotsFill, BsPeopleFill, BsThreeDotsVertical, BsSun, BsMoon, BsPersonCircle, BsGearFill } from 'react-icons/bs';
import { MdOutlineAmpStories } from 'react-icons/md';
import { FiSearch, FiPlus, FiTrash2, FiSlash } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StoryRing from './StoryRing';
import ConfirmModal from './ConfirmModal';

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
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, chat }
  const contextMenuRef = useRef(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null, // 'clear' | 'delete'
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
    setContextMenu({ x: e.clientX, y: e.clientY, chat });
  }, []);

  const openClearConfirm = (chat) => {
    setContextMenu(null);
    setConfirmState({ isOpen: true, type: 'clear', chat, loading: false });
  };

  const openDeleteConfirm = (chat) => {
    setContextMenu(null);
    setConfirmState({ isOpen: true, type: 'delete', chat, loading: false });
  };

  const handleConfirm = async () => {
    if (!confirmState.chat) return;
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmState.type === 'clear') {
        await onClearChat?.(confirmState.chat.id);
      } else {
        await onDeleteChat?.(confirmState.chat.id);
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

      {/* Navigation Tabs */}
      <div className="flex justify-around bg-white dark:bg-[#111b21] border-b border-gray-200 dark:border-[#222d34] px-2 py-1.5 text-xs font-semibold">
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
          <span>Stories</span>
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
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#222d34]/40">
        {chats && chats.length > 0 ? (
          chats.filter(Boolean).map((chat) => {
            if (!chat || !chat.id) return null;
            const isSelected = activeChat && Number(activeChat.id) === Number(chat.id);
            const displayName = chat.type === 'GROUP' ? chat.name : (chat.otherParticipant?.fullName || chat.otherParticipant?.username || 'User');
            const displayAvatar = chat.type === 'GROUP' ? chat.groupPicture : chat.otherParticipant?.profilePicture;

            return (
              <div
                key={chat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectChat) onSelectChat(chat);
                }}
                onContextMenu={(e) => handleContextMenu(e, chat)}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-all border-l-4 group relative ${
                  isSelected
                    ? 'bg-[#e9edef] dark:bg-[#2a3942] border-teal-500 shadow-xs'
                    : 'bg-white dark:bg-[#111b21] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      displayName?.charAt(0) || 'C'
                    )}
                  </div>
                  {chat.type === 'PRIVATE' && chat.otherParticipant?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#111b21] rounded-full shadow-xs" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{displayName}</h4>
                    {chat.lastMessage && (
                      <span className={`text-[11px] ml-2 shrink-0 ${chat.unreadCount > 0 ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-400 dark:text-gray-400'}`}>
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <p className="truncate pr-2">
                      {chat.lastMessage
                        ? (chat.lastMessage.content || '').replace(/\[STORY_ID:\d+\]\s*/g, '')
                        : 'No messages yet'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Three-dot button visible on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, chat);
                  }}
                  className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Chat options"
                >
                  <BsThreeDotsVertical size={14} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
            <p>No conversations found</p>
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
        </div>
      )}

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
