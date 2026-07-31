import React, { useState, useEffect } from 'react';
import { storyApi } from '../api/stories';
import { chatApi } from '../api/chats';
import { messageApi } from '../api/messages';
import StoryRing from '../components/StoryRing';
import StoryViewer from '../components/StoryViewer';
import { FiPlus, FiX, FiUploadCloud, FiType, FiImage, FiCheck, FiSend } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';

const StoriesPage = () => {
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
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] text-gray-900 dark:text-gray-100 p-6 overflow-y-auto transition-colors">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400">Status Stories</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Photos & videos that disappear after 24 hours</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FiPlus size={18} /> Add Story
          </button>
        </div>

        {/* My Status Card */}
        <div
          onClick={() => {
            if (myStories.length > 0) {
              setActiveStoryGroup(myStories);
            } else {
              setShowCreateModal(true);
            }
          }}
          className="mb-8 bg-white dark:bg-[#111b21] p-4 rounded-2xl border border-gray-200 dark:border-[#222d34] flex items-center justify-between shadow-sm cursor-pointer hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <StoryRing user={user} hasUnviewed={myStories.length > 0} />
              {myStories.length === 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-600 border-2 border-white dark:border-[#111b21] flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                  +
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                My Status
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {myStories.length > 0 ? `${myStories.length} active story` : 'Tap to add status update'}
              </p>
            </div>
          </div>
          {myStories.length === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-500/30 hover:bg-teal-600 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              Add Story
            </button>
          )}
        </div>

        {/* Recent Contact Stories */}
        <h3 className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Recent Updates</h3>
        {groupedContactStories.length === 0 ? (
          <div className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-8 rounded-2xl text-center text-gray-400 text-xs font-semibold">
            No status updates from your contacts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {groupedContactStories.map((group) => (
              <div
                key={group.user.id}
                onClick={() => setActiveStoryGroup(group.stories)}
                className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] p-4 rounded-2xl flex items-center gap-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a242d] hover:border-teal-500/40 transition-all shadow-xs group"
              >
                <StoryRing user={group.user} hasUnviewed={group.hasUnviewed} />
                <div className="truncate">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                    {group.user?.fullName || group.user?.username}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {group.stories.length} update{group.stories.length > 1 ? 's' : ''} • {new Date(group.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer Overlay */}
      {activeStoryGroup && (
        <StoryViewer
          stories={activeStoryGroup}
          currentUser={user}
          onClose={() => setActiveStoryGroup(null)}
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
