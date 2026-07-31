import React, { useState, useEffect } from 'react';
import { friendApi } from '../api/friends';
import { userApi } from '../api/users';
import { chatApi } from '../api/chats';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { FiSearch, FiUserPlus, FiUserCheck, FiUserX, FiCheckCircle, FiMessageSquare, FiTrash2, FiClock, FiX, FiHash } from 'react-icons/fi';
import { BsPersonBadge } from 'react-icons/bs';

const ContactsPage = ({ onSelectChat }) => {
  const { user } = useAuth();
  const { connected, subscribe } = useSocket();

  const [activeSubTab, setActiveSubTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [requestTabType, setRequestTabType] = useState('received'); // 'received', 'sent'
  
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequestsList, setSentRequestsList] = useState([]);
  const [sentRequestUserIds, setSentRequestUserIds] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState({ isOpen: false, friend: null, loading: false });

  useEffect(() => {
    loadAllData();

    // Auto-refresh requests every 3 seconds as a real-time fallback
    const interval = setInterval(() => {
      loadRequests();
      loadFriends();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Real-time WebSocket listener for incoming notifications
  useEffect(() => {
    if (!connected || !user) return;

    const notifSub = subscribe(`/user/${user.email}/queue/notifications`, (notif) => {
      if (notif.type === 'FRIEND_REQUEST') {
        loadRequests();
        loadFriends();
      }
    });

    return () => {
      if (notifSub) notifSub.unsubscribe();
    };
  }, [connected, user?.email]);

  const loadAllData = () => {
    loadFriends();
    loadRequests();
    loadSentRequests();
  };

  const loadFriends = async () => {
    try {
      const res = await friendApi.getFriends();
      setFriends(res.data.content || []);
    } catch (e) {
      console.error('Failed to load friends:', e);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await friendApi.getReceivedRequests();
      setReceivedRequests(res.data || []);
    } catch (e) {
      console.error('Failed to load received requests:', e);
    }
  };

  const loadSentRequests = async () => {
    try {
      const res = await friendApi.getSentRequests();
      const list = res.data || [];
      setSentRequestsList(list);
      const ids = list.map((r) => r.receiver?.id);
      setSentRequestUserIds(ids);
    } catch (e) {
      console.error('Failed to load sent requests:', e);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.searchUsers(query);
      setSearchResults(res.data.content || []);
    } catch (e) {
      console.error('Failed to search users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId) => {
    setActionLoadingId(targetUserId);
    try {
      await friendApi.sendRequest(targetUserId);
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId, senderUserId) => {
    if (senderUserId) setActionLoadingId(senderUserId);
    try {
      await friendApi.acceptRequest(requestId);
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
      loadAllData();
    } catch (e) {
      console.error('Failed to accept request:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendApi.rejectRequest(requestId);
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
      loadAllData();
    } catch (e) {
      console.error('Failed to reject request:', e);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await friendApi.cancelRequest(requestId);
      loadAllData();
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
    } catch (e) {
      console.error('Failed to cancel request:', e);
    }
  };

  const handleRemoveFriend = (friend) => {
    setConfirmModalData({ isOpen: true, friend, loading: false });
  };

  const confirmRemoveFriend = async () => {
    if (!confirmModalData.friend) return;
    setConfirmModalData((prev) => ({ ...prev, loading: true }));
    try {
      await friendApi.removeFriend(confirmModalData.friend.id);
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
      loadAllData();
    } catch (e) {
      console.error('Failed to remove friend:', e);
    } finally {
      setConfirmModalData({ isOpen: false, friend: null, loading: false });
    }
  };

  const handleStartChat = async (targetUser) => {
    try {
      const res = await chatApi.getOrCreatePrivateChat(targetUser.id);
      if (onSelectChat) onSelectChat(res.data);
    } catch (e) {
      console.error('Failed to start chat:', e);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 p-6 overflow-y-auto transition-colors">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-teal-600 dark:text-teal-400">Contacts & Connections</h2>

        {/* Sub tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-[#222d34] mb-6">
          <button
            onClick={() => {
              setActiveSubTab('friends');
              loadFriends();
            }}
            className={`pb-3 font-semibold text-sm cursor-pointer transition-colors ${
              activeSubTab === 'friends' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            My Friends ({friends.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('requests');
              loadRequests();
              loadSentRequests();
            }}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'requests' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Friend Requests
            {receivedRequests.length > 0 && (
              <span className="bg-teal-500 text-white dark:text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {receivedRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('search')}
            className={`pb-3 font-semibold text-sm cursor-pointer transition-colors ${
              activeSubTab === 'search' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Find New People
          </button>
        </div>

        {/* FRIENDS LIST */}
        {activeSubTab === 'friends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 font-bold flex items-center justify-center text-lg text-white uppercase shadow-xs">
                      {friend.profilePicture ? (
                        <img src={friend.profilePicture} alt={friend.username} className="w-full h-full object-cover" />
                      ) : (
                        friend.username?.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{friend.fullName || friend.username}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{friend.username}</p>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-full px-1.5 py-0.5 mt-0.5">
                        <FiHash size={8} />#{friend.uniqueNumber || friend.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartChat(friend)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend)}
                      title="Unfriend / Remove Friend"
                      className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-600 text-gray-600 dark:text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8 col-span-2">No friends yet. Search users under 'Find New People' to connect!</p>
            )}
          </div>
        )}

        {/* REQUESTS LIST */}
        {activeSubTab === 'requests' && (
          <div className="space-y-4">
            {/* Toggle Received vs Sent */}
            <div className="flex gap-3 bg-white dark:bg-[#111b21] p-1.5 rounded-xl border border-gray-200 dark:border-[#222d34] w-fit text-xs font-semibold">
              <button
                onClick={() => setRequestTabType('received')}
                className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  requestTabType === 'received' ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Received ({receivedRequests.length})
              </button>
              <button
                onClick={() => setRequestTabType('sent')}
                className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  requestTabType === 'sent' ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sent ({sentRequestsList.length})
              </button>
            </div>

            {/* RECEIVED REQUESTS */}
            {/* RECEIVED REQUESTS */}
            {requestTabType === 'received' && (
              <div className="space-y-3">
                {receivedRequests.length > 0 ? (
                  receivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4 rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 font-bold flex items-center justify-center text-sm text-white uppercase shadow-xs shrink-0">
                          {req.sender?.profilePicture ? (
                            <img src={req.sender.profilePicture} alt={req.sender.username} className="w-full h-full object-cover" />
                          ) : (
                            req.sender?.username?.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{req.sender?.fullName || req.sender?.username}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{req.sender?.username} sent you a friend request</p>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-full px-1.5 py-0.5 mt-0.5">
                            <FiHash size={8} />#{req.sender?.uniqueNumber || req.sender?.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.sender?.id)}
                          disabled={actionLoadingId === req.sender?.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                        >
                          <FiUserCheck /> Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <FiUserX /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">No pending received friend requests</p>
                )}
              </div>
            )}

            {/* SENT REQUESTS */}
            {requestTabType === 'sent' && (
              <div className="space-y-3">
                {sentRequestsList.length > 0 ? (
                  sentRequestsList.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4 rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 font-bold flex items-center justify-center text-sm text-white uppercase shadow-xs shrink-0">
                          {req.receiver?.profilePicture ? (
                            <img src={req.receiver.profilePicture} alt={req.receiver.username} className="w-full h-full object-cover" />
                          ) : (
                            req.receiver?.username?.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{req.receiver?.fullName || req.receiver?.username}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <FiClock size={12} /> Waiting for @{req.receiver?.username} to accept
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-full px-1.5 py-0.5 mt-0.5">
                            <FiHash size={8} />#{req.receiver?.uniqueNumber || req.receiver?.id}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-600 text-gray-700 dark:text-gray-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-gray-200 dark:border-transparent"
                      >
                        <FiX /> Cancel Request
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">No pending sent friend requests</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* SEARCH PEOPLE */}
        {activeSubTab === 'search' && (
          <div className="space-y-4">
            {/* ID Search hint banner */}
            <div className="flex items-start gap-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-3">
              <BsPersonBadge size={20} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Search by User ID</p>
                <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-0.5">
                  Each user has a unique 7-digit numeric ID. Type a number (e.g. <code className="bg-teal-100 dark:bg-teal-900 px-1 rounded font-mono">8759753</code>) to find someone instantly, or search by name/username.
                </p>
              </div>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Type ID number, username, or full name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#111b21] border border-gray-300 dark:border-[#222d34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 shadow-xs"
              />
              {searchQuery && /^\d+$/.test(searchQuery) && (
                <span className="absolute right-3.5 top-2.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-700 px-2 py-1 rounded-full">
                  🔢 ID Search
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((u) => {
                const isAlreadyFriend = u.friendshipStatus === 'FRIEND' || friends.some((f) => Number(f.id) === Number(u.id));
                const isSent = u.friendshipStatus === 'PENDING_SENT' || sentRequestUserIds.some((id) => Number(id) === Number(u.id));
                const incomingReq = receivedRequests.find((r) => Number(r.sender?.id) === Number(u.id));
                const isIncoming = u.friendshipStatus === 'PENDING_RECEIVED' || !!incomingReq;
                const reqId = u.requestId || incomingReq?.id;
                const isActionLoading = actionLoadingId === u.id;

                return (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4 rounded-xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 font-bold flex items-center justify-center text-sm text-white uppercase shadow-xs shrink-0">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username?.charAt(0)
                        )}
                      </div>
                    <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{u.fullName || u.username}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-full px-1.5 py-0.5 mt-0.5">
                          <FiHash size={8} />#{u.uniqueNumber || u.id}
                        </span>
                      </div>
                    </div>

                    {isAlreadyFriend ? (
                      <button
                        onClick={() => handleStartChat(u)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <FiMessageSquare /> Message
                      </button>
                    ) : isIncoming ? (
                      <button
                        onClick={() => handleAcceptRequest(reqId, u.id)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                      >
                        <FiUserCheck /> Accept Request
                      </button>
                    ) : isSent ? (
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-transparent">
                        Request Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u.id)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
                      >
                        <FiUserPlus /> {isActionLoading ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Dark Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        onClose={() => setConfirmModalData({ isOpen: false, friend: null, loading: false })}
        onConfirm={confirmRemoveFriend}
        title="Remove Friend"
        message={`Are you sure you want to remove ${
          confirmModalData.friend?.fullName || confirmModalData.friend?.username || 'this friend'
        } (@${confirmModalData.friend?.username || ''}) from your friends list?`}
        confirmText="Remove Friend"
        cancelText="Cancel"
        isDanger={true}
        loading={confirmModalData.loading}
      />
    </div>
  );
};

export default ContactsPage;
