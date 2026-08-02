import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ContactsPage from './ContactsPage';
import StoriesPage from './StoriesPage';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import CreateGroupModal from '../components/CreateGroupModal';
import StoryViewer from '../components/StoryViewer';
import NotificationModal from '../components/NotificationModal';
import Logo from '../components/Logo';

import { chatApi } from '../api/chats';
import { messageApi } from '../api/messages';
import { friendApi } from '../api/friends';
import { groupApi } from '../api/groups';
import { storyApi } from '../api/stories';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const { connected, subscribe, publish } = useSocket();

  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'contacts', 'stories', 'settings', 'profile'
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  // Contacts for group creation
  const [contacts, setContacts] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    loadUserChats();
    loadFriends();
  }, []);

  // STOMP WebSocket Subscription for User Presence (Online / Offline status)
  useEffect(() => {
    if (!connected) return;

    const presenceSub = subscribe('/topic/presence', (presenceEvent) => {
      if (!presenceEvent || !presenceEvent.userId) return;

      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.type === 'PRIVATE' && Number(c.otherParticipant?.id) === Number(presenceEvent.userId)) {
            return {
              ...c,
              otherParticipant: {
                ...c.otherParticipant,
                isOnline: presenceEvent.isOnline,
              },
            };
          }
          return c;
        })
      );

      setActiveChat((prevActive) => {
        if (
          prevActive &&
          prevActive.type === 'PRIVATE' &&
          Number(prevActive.otherParticipant?.id) === Number(presenceEvent.userId)
        ) {
          return {
            ...prevActive,
            otherParticipant: {
              ...prevActive.otherParticipant,
              isOnline: presenceEvent.isOnline,
            },
          };
        }
        return prevActive;
      });
    });

    return () => {
      if (presenceSub) presenceSub.unsubscribe();
    };
  }, [connected, subscribe]);

  const mergeOrAppendMessage = (prevMessages, newMsg, tempIdToRemove = null) => {
    if (!newMsg) return prevMessages;

    let list = [...prevMessages];

    // Remove explicit temp message if specified
    if (tempIdToRemove) {
      list = list.filter((m) => m.id !== tempIdToRemove);
    }

    // Check if real message ID already exists in list
    const existingIndex = list.findIndex((m) => m.id === newMsg.id);
    if (existingIndex !== -1) {
      list[existingIndex] = { ...list[existingIndex], ...newMsg };
      return list;
    }

    // Check if there is an unresolved 'temp-' message sent by the same user matching chat
    const pendingTempIndex = list.findIndex(
      (m) =>
        typeof m.id === 'string' &&
        m.id.startsWith('temp-') &&
        Number(m.sender?.id) === Number(newMsg.sender?.id) &&
        Number(m.chatId || activeChat?.id) === Number(newMsg.chatId || activeChat?.id)
    );

    if (pendingTempIndex !== -1) {
      list[pendingTempIndex] = newMsg;
      return list;
    }

    return [...list, newMsg];
  };

  // STOMP WebSocket Subscriptions for active chat
  useEffect(() => {
    if (!connected || !activeChat) return;

    const msgSub = subscribe(`/topic/chat/${activeChat.id}`, (incomingMsg) => {
      setMessages((prev) => mergeOrAppendMessage(prev, incomingMsg));
      loadUserChats(); // Refresh chat preview order
    });

    // Typing Stream
    const typingSub = subscribe(`/topic/chat/${activeChat.id}/typing`, (event) => {
      if (event.userId !== user.id) {
        setTypingUser(event.isTyping ? event.username : null);
      }
    });

    return () => {
      if (msgSub) msgSub.unsubscribe();
      if (typingSub) typingSub.unsubscribe();
    };
  }, [connected, activeChat?.id]);

  const loadUserChats = async () => {
    try {
      const res = await chatApi.getUserChats();
      setChats(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await friendApi.getFriends();
      setContacts(res.data.content || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectChat = (chat) => {
    if (!chat) return;
    setActiveTab('chats');
    setActiveChat(chat);

    // Immediately clear the unread badge in the sidebar (optimistic update)
    setChats((prev) =>
      prev.map((c) => (Number(c.id) === Number(chat.id) ? { ...c, unreadCount: 0 } : c))
    );

    messageApi
      .getChatMessages(chat.id)
      .then((res) => {
        const rawList = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
        const msgList = Array.isArray(rawList) ? rawList : [];
        setMessages([...msgList].reverse());
        messageApi.markAsRead(chat.id).catch(() => {});
      })
      .catch((e) => {
        console.error('Failed to load messages for chat:', e);
      });
  };

  const determineMessageType = (file) => {
    if (!file) return 'TEXT';
    const type = file.type || '';
    const name = file.name ? file.name.toLowerCase() : '';
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'IMAGE';
    if (type.startsWith('video/') || name.match(/\.(mp4|mkv|avi|mov)$/)) return 'VIDEO';
    if (type.startsWith('audio/') || name.match(/\.(mp3|wav|ogg|m4a)$/)) return 'AUDIO';
    return 'DOCUMENT';
  };

  const handleSendMessage = async ({ content, files, replyToId, messageType }) => {
    if (!activeChat) return;

    const hasFiles = files && files.length > 0;
    const tempId = 'temp-' + Date.now();

    const tempAttachments = hasFiles
      ? files.map((f, idx) => ({
          id: 'temp-att-' + idx + '-' + Date.now(),
          url: URL.createObjectURL(f),
          fileName: f.name,
          fileSize: f.size,
          type: determineMessageType(f),
        }))
      : [];

    const computedMessageType = messageType
      ? messageType
      : hasFiles
      ? determineMessageType(files[0])
      : 'TEXT';

    const tempMessage = {
      id: tempId,
      chatId: activeChat.id,
      sender: user,
      content: content,
      messageType: computedMessageType,
      attachments: tempAttachments,
      replyToId: replyToId,
      createdAt: new Date().toISOString(),
      isSending: true,
      status: 'SENDING',
    };

    setMessages((prev) => [...prev, tempMessage]);

    const formData = new FormData();
    formData.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            chatId: activeChat.id,
            content: content,
            messageType: computedMessageType,
            replyToId: replyToId,
          }),
        ],
        { type: 'application/json' }
      )
    );

    if (hasFiles) {
      files.forEach((f) => formData.append('files', f));
    }

    try {
      const res = await messageApi.sendMessage(formData);
      if (res && res.data) {
        setMessages((prev) => mergeOrAppendMessage(prev, res.data, tempId));
        loadUserChats();
      }
    } catch (err) {
      console.error('Send message failed:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isSending: false, isError: true } : m))
      );
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeChat) return;
    publish('/app/chat.typing', {
      chatId: activeChat.id,
      userId: user.id,
      username: user.username,
      isTyping,
    });
  };

  const handleCreateGroup = async (groupData) => {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            name: groupData.name,
            description: groupData.description,
            memberIds: groupData.memberIds,
          }),
        ],
        { type: 'application/json' }
      )
    );
    if (groupData.groupPicture) {
      formData.append('groupPicture', groupData.groupPicture);
    }

    try {
      const res = await groupApi.createGroup(formData);
      loadUserChats();
      handleSelectChat(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredChats = (chats || []).filter((c) => {
    if (!c) return false;
    const name = c.type === 'GROUP' ? c.name : (c.otherParticipant?.fullName || c.otherParticipant?.username || 'User');
    return (name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  const handleReactMessage = async (id, emoji) => {
    try {
      const res = await messageApi.addReaction(id, emoji);
      if (res.data) {
        setMessages((prev) => prev.map((m) => (m.id === id ? res.data : m)));
      }
    } catch (e) {
      console.error('Failed to react:', e);
    }
  };

  const handleDeleteForEveryone = async (id) => {
    try {
      await messageApi.deleteForEveryone(id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, isDeletedForEveryone: true, content: 'This message was deleted.' } : m
        )
      );
    } catch (e) {
      console.error('Failed to delete for everyone:', e);
    }
  };

  const handleDeleteForMe = async (id) => {
    try {
      await messageApi.deleteForMe(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error('Failed to delete for me:', e);
    }
  };

  const handleClearChat = async (chatId) => {
    try {
      await chatApi.clearChatHistory(chatId);
      if (activeChat && Number(activeChat.id) === Number(chatId)) {
        setMessages([]);
      }
      loadUserChats();
    } catch (e) {
      console.error('Failed to clear chat:', e);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatApi.deleteChat(chatId);
      if (activeChat && Number(activeChat.id) === Number(chatId)) {
        setActiveChat(null);
        setMessages([]);
      }
      loadUserChats();
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  };

  const handleOpenStory = async (statusId, targetUserId) => {
    try {
      const [contactRes, myRes] = await Promise.all([
        storyApi.getContactStatuses(),
        storyApi.getMyStatuses(),
      ]);

      const allStatuses = [...(contactRes.data || []), ...(myRes.data || [])];

      let targetStories = [];
      if (statusId) {
        const found = allStatuses.find((s) => Number(s.id) === Number(statusId));
        if (found) {
          const userStories = allStatuses.filter((s) => Number(s.user?.id) === Number(found.user?.id));
          targetStories = userStories.length > 0 ? userStories : [found];
        }
      }

      if (targetStories.length === 0 && targetUserId) {
        targetStories = allStatuses.filter((s) => Number(s.user?.id) === Number(targetUserId));
      }

      if (targetStories.length > 0) {
        setActiveStoryGroup(targetStories);
      } else {
        setNotification({
          isOpen: true,
          title: 'Story Unavailable',
          message: 'This status story has expired or was deleted by the owner.',
        });
      }
    } catch (err) {
      console.error('Failed to open story:', err);
      setNotification({
        isOpen: true,
        title: 'Story Unavailable',
        message: 'Unable to load this status story at this moment.',
      });
    }
  };

  const handleDeleteStoryFromHome = async (statusId) => {
    try {
      await storyApi.deleteStatus(statusId);
      if (activeStoryGroup) {
        const updated = activeStoryGroup.filter((s) => s.id !== statusId);
        if (updated.length > 0) {
          setActiveStoryGroup(updated);
        } else {
          setActiveStoryGroup(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-screen h-screen flex bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 overflow-hidden transition-colors">
      {/* Sidebar Navigation & Chat List */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        chats={filteredChats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onOpenNewGroup={() => setIsGroupModalOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content Area */}
      <div className="flex-1 h-full flex">
        {activeTab === 'chats' ? (
          activeChat ? (
            <ChatWindow
              chat={activeChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              typingUser={typingUser}
              onReplyMessage={(msg) => setReplyingTo(msg)}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onDeleteForEveryone={handleDeleteForEveryone}
              onDeleteForMe={handleDeleteForMe}
              onStarMessage={(id) => messageApi.toggleStar(id)}
              onReactMessage={handleReactMessage}
              onOpenStory={handleOpenStory}
              onBack={() => setActiveChat(null)}
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-500 dark:text-gray-400 border-b-8 border-blue-500 transition-colors">
              <div className="w-28 h-28 p-2 bg-white dark:bg-[#111b21] rounded-full flex items-center justify-center mb-4 shadow-md border border-gray-200 dark:border-[#222d34]">
                <Logo className="w-full h-full" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">PulseChat for Web</h2>
              <p className="text-sm max-w-sm text-center opacity-75">
                Select a chat or start a new conversation to begin messaging.
              </p>
            </div>
          )
        ) : activeTab === 'contacts' ? (
          <ContactsPage onSelectChat={handleSelectChat} />
        ) : activeTab === 'stories' ? (
          <StoriesPage />
        ) : activeTab === 'profile' ? (
          <ProfilePage />
        ) : (
          <SettingsPage />
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        contacts={contacts}
      />

      {/* Story Viewer Overlay */}
      {activeStoryGroup && (
        <StoryViewer
          stories={activeStoryGroup}
          currentUser={user}
          onClose={() => setActiveStoryGroup(null)}
          onDelete={handleDeleteStoryFromHome}
        />
      )}

      {/* Custom Notification Dialog */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        iconType="story"
      />
    </div>
  );
};

export default Home;
