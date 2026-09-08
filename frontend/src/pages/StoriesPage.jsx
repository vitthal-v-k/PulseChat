import React, { useState, useEffect } from 'react';
import { storyApi } from '../api/stories';
import { chatApi } from '../api/chats';
import { messageApi } from '../api/messages';
import StoryRing from '../components/StoryRing';
import StoryViewer from '../components/StoryViewer';
import { FiPlus, FiX, FiUploadCloud, FiType, FiImage, FiCheck, FiSend } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';

const StoriesPage = ({ hiddenStatusUsers = [] }) => {
  const { user } = useAuth();
  const [contactStories, setContactStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [statusType, setStatusType] = useState('TEXT');
  const [textContent, setTextContent] = useState('');
  const [bgColor, setBgColor] = useState('#128C7E');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const contactRes = await storyApi.getContactStatuses();
      setContactStories(contactRes.data || []);
      const myRes = await storyApi.getMyStatuses();
      setMyStories(myRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStatus = async (e) => {
    e.preventDefault();

    if (statusType === 'TEXT' && !textContent.trim()) {
      alert('Please enter text content for your story.');
      return;
    }

    if (statusType === 'IMAGE' && (!mediaFiles || mediaFiles.length === 0)) {
      alert('Please select a photo or video file for your story.');
      return;
    }

    setIsPosting(true);
    try {
      const isVideoFile = mediaFiles?.[0]?.type?.startsWith('video/') || mediaFiles?.[0]?.name?.match(/\.(mp4|mkv|avi|mov|webm)$/i);
      const computedType = statusType === 'TEXT' ? 'TEXT' : isVideoFile ? 'VIDEO' : 'IMAGE';

      const formData = new FormData();
      formData.append(
        'data',
        new Blob(
          [
            JSON.stringify({
              type: computedType,
              content: textContent || '',
              backgroundColor: bgColor || '#128C7E',
            }),
          ],
          { type: 'application/json' }
        )
      );

      if (mediaFiles && mediaFiles.length > 0) {
        mediaFiles.forEach((file) => formData.append('mediaFiles', file));
      }

      await storyApi.createStatus(formData);
      setShowCreateModal(false);
      setTextContent('');
      setMediaFiles([]);
      loadStories();
    } catch (err) {
      console.error('Failed to create status:', err);
      alert(err.response?.data?.message || err.message || 'Failed to post status story');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteStory = async (statusId) => {
    try {
      await storyApi.deleteStatus(statusId);

      const updatedMyStories = myStories.filter((s) => s.id !== statusId);
      setMyStories(updatedMyStories);

      if (activeStoryGroup) {
        const updatedGroup = activeStoryGroup.filter((s) => s.id !== statusId);
        if (updatedGroup.length > 0) {
          setActiveStoryGroup(updatedGroup);
        } else {
          setActiveStoryGroup(null);
        }
      }

      loadStories();
    } catch (err) {
      console.error('Failed to delete status story:', err);
      alert(err.response?.data?.message || 'Failed to delete status story');
    }
  };

  const handleReplyStory = async (storyUser, replyContent, story) => {
    if (!storyUser?.id) return;
    try {
      const chatRes = await chatApi.getOrCreatePrivateChat(storyUser.id);
      const chat = chatRes.data;

      const storyTextSnippet = story?.content ? `"${story.content}"` : 'Status Story';
      const messageContent = `[STORY_ID:${story.id}] Replying to status story:\n${storyTextSnippet}\n\n💬 ${replyContent}`;

      const formData = new FormData();
      formData.append(
        'data',
        new Blob(
          [
            JSON.stringify({
              chatId: chat.id,
              content: messageContent,
              messageType: 'TEXT',
            }),
          ],
          { type: 'application/json' }
        )
      );

      await messageApi.sendMessage(formData);
    } catch (err) {
      console.error('Failed to send story reply:', err);
      throw err;
    }
  };

  const groupedContactStories = Object.values(
    contactStories.reduce((acc, story) => {
      const userId = story.user?.id;
      if (!userId) return acc;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
          latestTimestamp: story.createdAt,
          hasUnviewed: false,
        };
      }
      acc[userId].stories.push(story);
      if (!story.isViewed) acc[userId].hasUnviewed = true;
      if (new Date(story.createdAt) > new Date(acc[userId].latestTimestamp)) {
        acc[userId].latestTimestamp = story.createdAt;
      }
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.latestTimestamp) - new Date(a.latestTimestamp))
    .filter((group) => !hiddenStatusUsers.includes(group.user?.id));

  return (
    <div className="flex-1 h-full bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 pb-24 md:pb-0 overflow-y-auto transition-colors">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f766e] via-[#059669] to-[#0d9488] dark:from-[#0f3d38] dark:via-[#064e3b] dark:to-[#0f3d38] px-8 pt-10 pb-20">
        {/* Animated mesh blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-4 left-1/3 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-teal-300/10 rounded-full blur-3xl" />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="sg" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sg)" />
          </svg>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-200/70 text-xs font-semibold uppercase tracking-[0.2em] mb-2">PulseChat</p>
              <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Status</h2>
              <p className="text-emerald-100/60 text-sm mt-1.5">Moments that disappear in 24 hours</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-emerald-50 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <FiPlus size={17} strokeWidth={3} /> Add Status
            </button>
          </div>
        </div>
      </div>

      {/* ── Cards float over hero ───────────────────────────── */}
      <div className="relative max-w-3xl mx-auto w-full px-6 -mt-10 pb-12 space-y-6">

        {/* My Status glass card */}
        <div
          onClick={() => {
            if (myStories.length > 0) setActiveStoryGroup(myStories);
            else setShowCreateModal(true);
          }}
          className="relative bg-white/95 dark:bg-[#111b21]/95 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-2xl hover:shadow-emerald-200/40 dark:hover:shadow-emerald-900/40 transition-all cursor-pointer group overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400" />
          <div className="flex items-center gap-5 px-6 py-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full ring-4 ring-emerald-400/40 dark:ring-emerald-500/30 ring-offset-2 ring-offset-white dark:ring-offset-[#111b21] overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="me" className="w-full h-full object-cover" />
                  : user?.username?.charAt(0)?.toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 border-2 border-white dark:border-[#111b21] flex items-center justify-center text-white text-sm font-black shadow-md">
                +
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
                My Status
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                {myStories.length > 0
                  ? `${myStories.length} active update${myStories.length > 1 ? 's' : ''} · Tap to view`
                  : 'Tap to share a status update'}
              </p>
            </div>
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div>
          {/* Section label */}
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
            <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] whitespace-nowrap">Recent Updates</span>
            {groupedContactStories.length > 0 && (
              <span className="text-[11px] font-black text-white bg-gradient-to-r from-teal-500 to-emerald-500 px-2.5 py-0.5 rounded-full shadow-sm">
                {groupedContactStories.length}
              </span>
            )}
            <div className="flex-1 h-px bg-gradient-to-l from-gray-200 dark:from-gray-700 to-transparent" />
          </div>

          {groupedContactStories.length === 0 ? (
            <div className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-8 rounded-3xl text-center shadow-lg">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                <BsStars size={22} className="text-teal-500" />
              </div>
              <p className="font-bold text-gray-600 dark:text-gray-300">Nothing here yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your contacts' updates will appear here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {groupedContactStories.map((group) => (
                <div
                  key={group.user.id}
                  onClick={() => setActiveStoryGroup(group.stories)}
                  className="group relative bg-white dark:bg-[#111b21] rounded-2xl border border-gray-100 dark:border-[#1e2d35] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-4 px-4 py-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-full overflow-hidden border-[3px] ${group.hasUnviewed ? 'border-teal-400 dark:border-teal-500 shadow-[0_0_0_3px_rgba(45,212,191,0.2)]' : 'border-gray-200 dark:border-gray-600'} bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg`}>
                        {group.user?.profilePicture
                          ? <img src={group.user.profilePicture} alt={group.user.username} className="w-full h-full object-cover" />
                          : (group.user?.fullName || group.user?.username)?.charAt(0)?.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[15px] text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                        {group.user?.fullName || group.user?.username}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Today at {new Date(group.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {group.stories.length > 1 && (
                        <span className="text-[11px] font-black text-white bg-gradient-to-r from-teal-500 to-emerald-500 px-2.5 py-1 rounded-full shadow-sm">
                          {group.stories.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Story Viewer Overlay */}
      {activeStoryGroup && (
        <StoryViewer
          stories={activeStoryGroup}
          currentUser={user}
          onClose={() => { setActiveStoryGroup(null); loadStories(); }}
          onDelete={handleDeleteStory}
          onReply={handleReplyStory}
        />
      )}

      {/* Create Status Modal */}



      {/* Premium Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111b21] border border-slate-200/80 dark:border-[#222d34] w-full max-w-lg rounded-3xl p-6 md:p-7 relative text-slate-900 dark:text-gray-100 shadow-2xl transform transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-[#222d34]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                  <BsStars size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    Create Status Story
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Share what's on your mind with friends</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 hover:rotate-90 transition-all cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStatus} className="space-y-5">
              
              {/* Segmented Control Tabs */}
              <div className="flex bg-slate-100 dark:bg-[#1a242d] p-1.5 rounded-2xl border border-slate-200/80 dark:border-[#222d34]">
                <button
                  type="button"
                  onClick={() => setStatusType('TEXT')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    statusType === 'TEXT'
                      ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-md scale-[1.02]'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FiType size={15} />
                  <span>Text Story</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusType('IMAGE')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    statusType === 'IMAGE'
                      ? 'bg-white dark:bg-teal-600 text-teal-700 dark:text-white shadow-md scale-[1.02]'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FiImage size={15} />
                  <span>Photo / Video</span>
                </button>
              </div>

              {statusType === 'TEXT' ? (
                <div className="space-y-4">
                  {/* Status Input Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Story Caption / Message</label>
                    <textarea
                      required
                      placeholder="What's happening? Type your status..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-[#1a242d] border border-slate-200 dark:border-[#222d34] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 dark:text-white transition-all shadow-inner placeholder-slate-400"
                    />
                  </div>

                  {/* Glossy Color Swatches */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-gray-300 block mb-2">Choose Background Color</span>
                    <div className="flex items-center gap-3">
                      {['#128C7E', '#075E54', '#0284C7', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0F172A'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBgColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all flex items-center justify-center shadow-md ${
                            bgColor === c ? 'ring-3 ring-teal-500 ring-offset-2 dark:ring-offset-[#111b21] scale-115' : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          {bgColor === c && <FiCheck className="text-white text-xs drop-shadow-sm" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Realtime Story Preview Box */}
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-400 block mb-1.5 uppercase tracking-wider">Live Preview</span>
                    <div
                      style={{ backgroundColor: bgColor }}
                      className="w-full h-32 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-white font-bold text-base shadow-lg transition-all duration-300 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      <p className="relative z-10 break-words max-w-xs drop-shadow-md">
                        {textContent || 'Your story text will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">Upload Media</label>
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 dark:border-[#222d34] hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl cursor-pointer bg-slate-50 dark:bg-[#1a242d] hover:bg-slate-100 dark:hover:bg-[#1a242d]/80 transition-all p-4 group">
                    <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform mb-2">
                      <FiUploadCloud size={26} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-gray-200 text-center">
                      {mediaFiles.length > 0 ? `${mediaFiles.length} file chosen: ${mediaFiles[0].name}` : 'Click or drag photo / video to upload'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">High resolution JPG, PNG or MP4</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setMediaFiles(Array.from(e.target.files))}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isPosting}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Posting Story...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    <span>Post Story Now</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
