import React, { useState, useEffect } from 'react';
import { BsX, BsSendFill } from 'react-icons/bs';
import { FiTrash2, FiChevronLeft, FiChevronRight, FiEye, FiChevronUp, FiLoader, FiVolume2, FiVolumeX } from 'react-icons/fi';
import ConfirmModal from './ConfirmModal';
import { storyApi } from '../api/stories';

const StoryViewer = ({ stories, onClose, onDelete, onReply, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySentSuccess, setReplySentSuccess] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const currentStory = stories[currentIndex];
  const isOwnStory = currentUser && currentStory?.user && Number(currentUser.id) === Number(currentStory.user.id);
  const isVideoStory = currentStory?.mediaItems && currentStory.mediaItems.length > 0 && currentStory.mediaItems[0].mediaType === 'VIDEO';

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      if (onReply) {
        await onReply(currentStory.user, replyText, currentStory);
      }
      setReplyText('');
      setReplySentSuccess(true);
      setTimeout(() => setReplySentSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to send story reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  useEffect(() => {
    if (!isOwnStory && currentStory && !currentStory.isViewed) {
      storyApi.viewStatus(currentStory.id).catch((err) => console.error(err));
    }
  }, [currentStory, isOwnStory]);

  useEffect(() => {
    if (currentIndex >= stories.length && stories.length > 0) {
      setCurrentIndex(stories.length - 1);
      setProgress(0);
    }
  }, [stories.length, currentIndex]);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (isVideoStory || paused || showDeleteConfirm || showViewersDrawer) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, stories.length, paused, showDeleteConfirm, showViewersDrawer, isVideoStory, onClose]);

  if (!currentStory) return null;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setPaused(true);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setPaused(true);
    try {
      if (onDelete && currentStory) {
        await onDelete(currentStory.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setPaused(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center select-none animate-fadeIn">
      {/* Outer Prev Chevron */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          title="Previous story"
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center transition-all cursor-pointer z-50 border border-white/10 shadow-lg hover:scale-110"
        >
          <FiChevronLeft size={28} />
        </button>
      )}

      {/* Outer Next Chevron */}
      <button
        type="button"
        onClick={handleNext}
        title={currentIndex < stories.length - 1 ? 'Next story' : 'Close story'}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center transition-all cursor-pointer z-50 border border-white/10 shadow-lg hover:scale-110"
      >
        <FiChevronRight size={28} />
      </button>

      <div
        className="relative w-full max-w-md h-[90vh] bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Left & Right Interactive Tap Zones */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-white z-50 animate-fadeIn select-none">
            <FiLoader size={36} className="animate-spin text-teal-400 mb-2" />
            <span className="text-sm font-semibold tracking-wide animate-pulse">Deleting story...</span>
          </div>
        )}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-16 bottom-16 w-1/4 z-30 cursor-pointer"
          title="Previous"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-16 bottom-16 w-1/4 z-30 cursor-pointer"
          title="Next"
        />

        {/* Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-40">
          <div className="flex gap-1 mb-3">
            {stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                {currentStory.user?.profilePicture ? (
                  <img src={currentStory.user.profilePicture} alt={currentStory.user.username} className="w-full h-full object-cover" />
                ) : (
                  currentStory.user?.username?.charAt(0)
                )}
              </div>
              <span className="font-semibold text-xs">{currentStory.user?.fullName || currentStory.user?.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                title={isMuted ? 'Unmute video sound' : 'Mute video sound'}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/20 rounded-full transition-all cursor-pointer z-50"
              >
                {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
              {isOwnStory && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  title="Delete status story"
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all cursor-pointer z-50"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer z-50"
              >
                <BsX size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div
          className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
          style={{ backgroundColor: currentStory.type === 'TEXT' ? (currentStory.backgroundColor || '#128C7E') : '#000000' }}
        >
          {currentStory.type === 'TEXT' ? (
            <div className="p-8 flex items-center justify-center w-full h-full">
              <p className="text-xl md:text-2xl font-bold text-white whitespace-pre-wrap drop-shadow-md text-center leading-relaxed">
                {currentStory.content}
              </p>
            </div>
          ) : currentStory.mediaItems && currentStory.mediaItems.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {currentStory.mediaItems[0].mediaType === 'VIDEO' ? (
                <video
                  src={currentStory.mediaItems[0].mediaUrl}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  onTimeUpdate={(e) => {
                    if (!paused && e.target.duration) {
                      setProgress((e.target.currentTime / e.target.duration) * 100);
                    }
                  }}
                  onEnded={() => handleNext()}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <img
                  src={currentStory.mediaItems[0].mediaUrl}
                  alt="Story Media"
                  className="w-full h-full object-contain"
                />
              )}
              {currentStory.content && (
                <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white text-xs md:text-sm font-semibold text-center z-20 pointer-events-none">
                  {currentStory.content}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 flex items-center justify-center w-full h-full">
              <p className="text-white drop-shadow-md text-center">{currentStory.content}</p>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        {isOwnStory ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setPaused(true);
              setShowViewersDrawer(true);
            }}
            className="p-3 bg-black/60 backdrop-blur-md flex items-center justify-center gap-2 text-white text-xs font-bold cursor-pointer hover:bg-black/80 transition-all border-t border-white/10 z-40 group"
          >
            <FiEye size={16} className="text-teal-400 group-hover:scale-110 transition-transform" />
            <span>{currentStory.viewers?.length || currentStory.viewCount || 0} Viewers</span>
            <FiChevronUp size={14} className="text-gray-400 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="p-3 bg-black/70 backdrop-blur-md flex items-center gap-2 z-40 border-t border-white/10 relative">
            {replySentSuccess && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg animate-fadeIn flex items-center gap-1.5 z-50">
                <span>✓ Reply sent to chat!</span>
              </div>
            )}
            <input
              type="text"
              placeholder="Reply to story..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              disabled={isSendingReply}
              className="flex-1 bg-gray-800/80 border border-gray-700 text-xs text-white px-3.5 py-2 rounded-full focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSendingReply}
              className="text-white p-2 hover:text-teal-400 disabled:opacity-40 transition-colors cursor-pointer"
              title="Send reply"
            >
              {isSendingReply ? (
                <FiLoader size={16} className="animate-spin text-teal-400" />
              ) : (
                <BsSendFill size={15} />
              )}
            </button>
          </form>
        )}
      </div>

      {/* Viewers Drawer Modal */}
      {showViewersDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center animate-fadeIn p-4"
          onClick={() => {
            setShowViewersDrawer(false);
            setPaused(false);
          }}
        >
          <div
            className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] w-full max-w-sm rounded-t-3xl p-5 shadow-2xl relative text-gray-900 dark:text-gray-100 max-h-[60vh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#222d34] mb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-teal-600 dark:text-teal-400">
                <FiEye size={18} />
                <span>Viewed by ({currentStory.viewers?.length || 0})</span>
              </div>
              <button
                onClick={() => {
                  setShowViewersDrawer(false);
                  setPaused(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <BsX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              {!currentStory.viewers || currentStory.viewers.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs font-semibold">
                  No views yet. Share your story with friends!
                </div>
              ) : (
                currentStory.viewers.map((item, idx) => {
                  const vUser = item.viewer || item.user || item;
                  const name = vUser?.fullName || vUser?.username || 'Contact';
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a242d] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                          {vUser?.profilePicture ? (
                            <img src={vUser.profilePicture} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                            {name}
                          </h5>
                          <p className="text-[10px] text-gray-400">
                            {item.viewedAt ? new Date(item.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPaused(false);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Status Story"
        message="Are you sure you want to permanently delete this status story? This action cannot be undone."
        confirmText="Delete Story"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default StoryViewer;
