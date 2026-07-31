import React, { useState, useEffect, useRef } from 'react';
import {
  BsSearch,
  BsPaperclip,
  BsEmojiSmile,
  BsSendFill,
  BsXCircle,
  BsMicFill,
  BsMic,
} from 'react-icons/bs';
import {
  FiMoreVertical,
  FiArrowLeft,
  FiX,
  FiFileText,
  FiImage,
  FiVideo,
  FiFile,
  FiMapPin,
  FiLoader,
  FiTrash2,
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';
import ConfirmModal from './ConfirmModal';
import { useAuth } from '../context/AuthContext';

const ChatWindow = ({
  chat,
  messages,
  onSendMessage,
  onTyping,
  typingUser,
  onReplyMessage,
  replyingTo,
  onCancelReply,
  onDeleteForEveryone,
  onDeleteForMe,
  onStarMessage,
  onReactMessage,
  onOpenStory,
  onBack,
}) => {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start voice recording:', err);
      alert('Microphone permission is required to record voice messages.');
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const finishAndSendVoiceRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

      onSendMessage({
        content: '🎙️ Voice Message',
        files: [audioFile],
        replyToId: replyingTo ? replyingTo.id : null,
        messageType: 'AUDIO',
      });

      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };

    mediaRecorderRef.current.stop();
  };

  const formatRecordingTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFileTypeDetails = (file) => {
    const type = file.type || '';
    const name = file.name ? file.name.toLowerCase() : '';
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return { icon: <FiImage className="text-teal-600 dark:text-teal-400 text-base shrink-0" />, color: 'bg-teal-50 dark:bg-teal-500/10 border-teal-300 dark:border-teal-500/30' };
    }
    if (type.startsWith('video/') || name.match(/\.(mp4|mkv|avi|mov)$/)) {
      return { icon: <FiVideo className="text-purple-600 dark:text-purple-400 text-base shrink-0" />, color: 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30' };
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return { icon: <FiFileText className="text-rose-600 dark:text-rose-400 text-base shrink-0" />, color: 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30' };
    }
    return { icon: <FiFile className="text-blue-600 dark:text-blue-400 text-base shrink-0" />, color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30' };
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && selectedFiles.length === 0) return;

    onSendMessage({
      content: inputText,
      files: selectedFiles,
      replyToId: replyingTo ? replyingTo.id : null,
    });

    setInputText('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationContent = `📍 Live Location\nLat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}\n${locationUrl}`;

        onSendMessage({
          content: locationContent,
          files: [],
          replyToId: replyingTo ? replyingTo.id : null,
          messageType: 'LOCATION',
        });

        if (onCancelReply) onCancelReply();
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Error fetching location:', error);
        alert('Unable to retrieve location. Please check browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const displayName = chat?.type === 'GROUP' ? chat.name : (chat?.otherParticipant?.fullName || chat?.otherParticipant?.username);
  const displayAvatar = chat?.type === 'GROUP' ? chat.groupPicture : chat?.otherParticipant?.profilePicture;

  const filteredMessages = Array.isArray(messages)
    ? searchQuery.trim()
      ? messages.filter(
          (msg) =>
            msg?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg?.attachments?.some((att) => att.fileName?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : messages
    : [];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 select-none relative transition-colors">
      
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between border-b border-gray-200 dark:border-[#222d34] z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to chat list"
              className="p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
          )}
          <div
            onClick={() => setShowInfoModal(true)}
            title="Click to view info"
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white uppercase shadow-xs shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName?.charAt(0) || 'C'}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-gray-100">{displayName}</h3>
              <p className="text-xs">
                {typingUser ? (
                  <span className="text-teal-600 dark:text-teal-400 font-semibold animate-pulse">{typingUser} is typing...</span>
                ) : chat?.type === 'PRIVATE' ? (
                  chat?.otherParticipant?.isOnline ? (
                    <span className="text-teal-600 dark:text-teal-400 font-semibold">online</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">last seen recently</span>
                  )
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{chat?.members?.length || 0} members</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            title="Search Messages"
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showSearch
                ? 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-gray-700'
                : 'hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
            }`}
          >
            <BsSearch size={17} />
          </button>
        </div>
      </div>

      {/* Search Input Bar Overlay */}
      {showSearch && (
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 flex items-center gap-3 border-b border-gray-200 dark:border-[#222d34] animate-fadeIn z-10">
          <div className="flex-1 relative flex items-center bg-white dark:bg-[#111b21] rounded-xl px-3 py-1.5 border border-gray-300 dark:border-[#222d34] shadow-xs">
            <BsSearch className="text-gray-400 mr-2 shrink-0" size={15} />
            <input
              type="text"
              placeholder="Search messages in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white ml-1 cursor-pointer"
              >
                <FiX size={15} />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold shrink-0">
              {filteredMessages.length} found
            </span>
          )}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Messages Scroll Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-pattern">
        {filteredMessages && filteredMessages.length > 0 ? (
          filteredMessages.filter(Boolean).map((msg, idx) => (
            <MessageBubble
              key={msg?.id || idx}
              message={msg}
              isOwn={Boolean(user?.id && msg?.sender?.id && Number(user.id) === Number(msg.sender.id))}
              onReply={onReplyMessage}
              onDelete={(msgObj) => setDeleteTargetMessage(msgObj)}
              onStar={onStarMessage}
              onReact={onReactMessage}
              onOpenStory={onOpenStory}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-xl text-center max-w-sm border border-gray-200 dark:border-[#222d34] shadow-sm">
              <p className="font-semibold mb-1 text-gray-800 dark:text-gray-300">
                {searchQuery ? 'No matching messages found' : 'End-to-end encrypted'}
              </p>
              <p className="text-xs opacity-75">
                {searchQuery ? 'Try searching for a different keyword.' : `Send a message to start conversation with ${displayName}.`}
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] border-t border-teal-500/50 px-4 py-2 flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold text-teal-600 dark:text-teal-400">Replying to {replyingTo.sender?.fullName}</span>
            <p className="truncate opacity-80 max-w-md">{replyingTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <BsXCircle size={18} />
          </button>
        </div>
      )}

      {/* WhatsApp-Style Selected File Previews */}
      {selectedFiles.length > 0 && (
        <div className="bg-white dark:bg-[#111b21] px-4 py-2.5 flex items-center gap-2.5 overflow-x-auto border-t border-gray-200 dark:border-[#222d34] animate-fadeIn select-none">
          {selectedFiles.map((file, idx) => {
            const { icon, color } = getFileTypeDetails(file);
            const fileSizeFormatted = (file.size / 1024 / 1024).toFixed(2);
            return (
              <div
                key={idx}
                className={`relative px-3 py-2 rounded-xl border flex items-center gap-2.5 ${color} shadow-sm backdrop-blur-xs max-w-[220px] shrink-0 transition-all`}
              >
                {icon}
                <div className="overflow-hidden flex-1 leading-tight">
                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{fileSizeFormatted} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = selectedFiles.filter((_, i) => i !== idx);
                    setSelectedFiles(updated);
                    if (updated.length === 0 && fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-red-500 text-gray-600 dark:text-gray-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer shrink-0 ml-1 shadow-sm"
                  title="Remove file"
                >
                  <FiX size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-30">
          <EmojiPicker
            theme="dark"
            onEmojiClick={(emojiData) => setInputText((prev) => prev + emojiData.emoji)}
          />
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-3 border-t border-gray-200 dark:border-[#222d34]">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-white p-2"
        >
          <BsEmojiSmile size={20} />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach files (Photos, PDFs, Documents)"
          className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-white p-2 cursor-pointer transition-colors"
        >
          <BsPaperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleSendLocation}
          disabled={isGettingLocation}
          title={isGettingLocation ? 'Retrieving location...' : 'Send Live / Current Location'}
          className={`p-2 transition-colors cursor-pointer ${
            isGettingLocation
              ? 'text-teal-500 animate-spin'
              : 'text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'
          }`}
        >
          {isGettingLocation ? (
            <FiLoader size={20} className="animate-spin" />
          ) : (
            <FiMapPin size={20} />
          )}
        </button>

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-2 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping shrink-0" />
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                {formatRecordingTime(recordingTime)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
                Recording voice note...
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                title="Cancel Recording"
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors cursor-pointer"
              >
                <FiTrash2 size={18} />
              </button>
              <button
                type="button"
                onClick={finishAndSendVoiceRecording}
                title="Send Voice Note"
                className="bg-teal-600 hover:bg-teal-500 text-white p-2.5 rounded-xl transition-colors shadow-md flex items-center justify-center cursor-pointer"
              >
                <BsSendFill size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 bg-white dark:bg-[#2a3942] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl px-4 py-2.5 focus:outline-none border border-gray-200 dark:border-transparent"
            />

            {/* Separate Microphone Button */}
            <button
              type="button"
              onClick={startVoiceRecording}
              title="Record Voice Note"
              className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer transform active:scale-95 shrink-0"
            >
              <BsMicFill size={16} />
            </button>

            {/* Separate Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() && selectedFiles.length === 0}
              title="Send Message"
              className={`p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                inputText.trim() || selectedFiles.length > 0
                  ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                  : 'bg-gray-300 dark:bg-[#2a3942] text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              <BsSendFill size={16} />
            </button>
          </>
        )}
      </form>

      {/* WhatsApp-style Delete Message Modal */}
      {deleteTargetMessage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setDeleteTargetMessage(null)}
        >
          <div
            className="bg-[#111b21] border border-[#222d34] w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-100">Delete Message?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {deleteTargetMessage.sender?.id === user?.id
                ? 'Choose how you would like to delete this message:'
                : 'Delete this message from your chat history?'}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {deleteTargetMessage.sender?.id === user?.id && (
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteForEveryone) onDeleteForEveryone(deleteTargetMessage.id);
                    setDeleteTargetMessage(null);
                  }}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Delete for Everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onDeleteForMe) onDeleteForMe(deleteTargetMessage.id);
                  setDeleteTargetMessage(null);
                }}
                className="w-full py-2.5 bg-[#202c33] hover:bg-gray-700 text-gray-200 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-gray-700"
              >
                Delete for Me
              </button>
              <button
                type="button"
                onClick={() => setDeleteTargetMessage(null)}
                className="w-full py-2 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* WhatsApp-Style Contact / Group Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-gray-900 dark:text-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiX size={20} />
            </button>

            {chat?.type === 'GROUP' ? (
              /* Group Info Details */
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  onClick={() => displayAvatar && setPreviewPhotoUrl(displayAvatar)}
                  title={displayAvatar ? 'Click to view full photo' : ''}
                  className={`w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white uppercase shadow-lg border-4 border-teal-500/20 group relative ${
                    displayAvatar ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                  }`}
                >
                  {displayAvatar ? (
                    <>
                      <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                        View
                      </div>
                    </>
                  ) : (
                    <span>{displayName?.charAt(0) || 'G'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{chat?.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Group • {chat?.members?.length || 0} members
                  </p>
                </div>

                {chat?.description && (
                  <div className="w-full bg-gray-50 dark:bg-[#202c33] p-3 rounded-2xl text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222d34]">
                    <span className="font-semibold text-teal-600 dark:text-teal-400 block mb-0.5">Group Description</span>
                    <p>{chat.description}</p>
                  </div>
                )}

                {/* Group Members List */}
                <div className="w-full text-left space-y-2 pt-2 border-t border-gray-200 dark:border-[#222d34]">
                  <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    Members ({chat?.members?.length || 0})
                  </h4>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {chat?.members?.map((m) => {
                      const mUser = m.user || m;
                      const isOwner = m.role === 'ADMIN' || m.role === 'OWNER';
                      return (
                        <div
                          key={mUser.id}
                          className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-[#202c33] rounded-xl border border-gray-100 dark:border-[#222d34]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              onClick={() => mUser.profilePicture && setPreviewPhotoUrl(mUser.profilePicture)}
                              title={mUser.profilePicture ? 'Click to view photo' : ''}
                              className={`w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 font-bold text-white flex items-center justify-center text-xs uppercase overflow-hidden ${
                                mUser.profilePicture ? 'cursor-pointer hover:scale-110 transition-transform' : ''
                              }`}
                            >
                              {mUser.profilePicture ? (
                                <img src={mUser.profilePicture} alt={mUser.username} className="w-full h-full object-cover" />
                              ) : (
                                mUser.username?.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                {mUser.fullName || mUser.username}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">@{mUser.username}</span>
                                {mUser.uniqueNumber && (
                                  <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                                    #{mUser.uniqueNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isOwner && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                              ADMIN
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Private Contact Info Details */
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  onClick={() => displayAvatar && setPreviewPhotoUrl(displayAvatar)}
                  title={displayAvatar ? 'Click to view full photo' : ''}
                  className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-3xl font-bold text-white uppercase shadow-xl border-4 border-teal-500/20 group relative ${
                    displayAvatar ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                  }`}
                >
                  {displayAvatar ? (
                    <>
                      <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        View
                      </div>
                    </>
                  ) : (
                    <span>{displayName?.charAt(0) || 'U'}</span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{chat?.otherParticipant?.username}</p>
                  
                  {/* Unique ID Badge */}
                  {(chat?.otherParticipant?.uniqueNumber || chat?.otherParticipant?.id) && (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-mono font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-1 rounded-full shadow-sm">
                      #{chat?.otherParticipant?.uniqueNumber || chat?.otherParticipant?.id}
                    </div>
                  )}
                </div>

                {/* Bio / About */}
                <div className="w-full bg-gray-50 dark:bg-[#202c33] p-3.5 rounded-2xl text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222d34]">
                  <span className="font-semibold text-teal-600 dark:text-teal-400 block mb-0.5">About / Bio</span>
                  <p className="italic">{chat?.otherParticipant?.bio || 'Available on ChatApp'}</p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`w-2.5 h-2.5 rounded-full ${chat?.otherParticipant?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className={chat?.otherParticipant?.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}>
                    {chat?.otherParticipant?.isOnline ? 'Online now' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Avatar Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewPhotoUrl(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 p-3 rounded-full cursor-pointer transition-all z-10"
            title="Close"
          >
            <FiX size={22} />
          </button>
          <img
            src={previewPhotoUrl}
            alt="Profile View"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
