import React, { useState } from 'react';
import { BsCheck, BsCheckAll, BsStar, BsStarFill, BsReply, BsTrash, BsPlusLg, BsXLg, BsStars } from 'react-icons/bs';
import { FiDownload, FiFileText, FiLoader, FiClock, FiMapPin } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';

const MessageBubble = ({ message, isOwn, onReply, onDelete, onStar, onReact, onEdit, onOpenStory }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  if (!message) return null;

  try {

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusTicks = () => {
    if (!isOwn) return null;
    if (message.isSending) {
      return <FiClock className="text-gray-500 dark:text-gray-400 text-xs shrink-0 animate-pulse" title="Sending..." />;
    }
    const st = (message.status || 'SENT').toUpperCase();
    if (st === 'READ') {
      return <BsCheckAll className="text-[#53bdeb] dark:text-sky-400 text-lg font-bold shrink-0" title="Read" />;
    } else if (st === 'DELIVERED') {
      return <BsCheckAll className="text-gray-700 dark:text-gray-300 text-lg font-bold shrink-0 opacity-80" title="Delivered" />;
    }
    return <BsCheck className="text-gray-700 dark:text-gray-300 text-lg font-bold shrink-0 opacity-80" title="Sent" />;
  };

  const parseReactions = (reactionsJson) => {
    if (!reactionsJson) return {};
    if (typeof reactionsJson === 'object' && reactionsJson !== null) return reactionsJson;
    if (typeof reactionsJson === 'string') {
      try {
        const parsed = JSON.parse(reactionsJson);
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const reactionsObj = parseReactions(message?.reactions);

  const handleDownloadAttachment = async (e, url, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const allAttachments = (message.attachments || []).filter(Boolean);
  const imageAttachments = allAttachments.filter((att) => att.type === 'IMAGE');
  const otherAttachments = allAttachments.filter((att) => att.type !== 'IMAGE');

  const renderImageGrid = () => {
    if (imageAttachments.length === 0) return null;

    if (imageAttachments.length === 1) {
      const att = imageAttachments[0];
      return (
        <div key={att.id || 0} className="relative rounded-xl overflow-hidden max-h-64 sm:max-h-72 max-w-sm w-full group/img my-1">
          <img
            src={att.url}
            alt={att.fileName || 'Image'}
            className={`rounded-xl max-h-64 sm:max-h-72 w-full object-cover cursor-pointer transition-all hover:scale-[1.01] ${
              message.isSending ? 'opacity-70 blur-[1px]' : ''
            }`}
            onClick={() => !message.isSending && setLightboxImg(att.url)}
          />
          {message.isSending && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-2">
              <FiLoader size={26} className="animate-spin text-teal-400" />
              <span className="text-xs font-semibold tracking-wide animate-pulse">Uploading Image...</span>
            </div>
          )}
        </div>
      );
    }

    if (imageAttachments.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden max-w-sm sm:max-w-md w-full my-1">
          {imageAttachments.map((att, idx) => (
            <div key={att.id || idx} className="relative h-36 sm:h-44 w-full group/img overflow-hidden rounded-lg bg-black/10">
              <img
                src={att.url}
                alt={att.fileName || `Image ${idx + 1}`}
                className={`w-full h-full object-cover cursor-pointer transition-all hover:scale-105 ${
                  message.isSending ? 'opacity-70 blur-[1px]' : ''
                }`}
                onClick={() => !message.isSending && setLightboxImg(att.url)}
              />
              {message.isSending && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1.5 p-1 text-center">
                  <FiLoader size={22} className="animate-spin text-teal-400" />
                  <span className="text-[10px] font-semibold text-white animate-pulse">Uploading...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    const displayImages = imageAttachments.slice(0, 4);
    const extraCount = imageAttachments.length - 4;

    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden max-w-sm sm:max-w-md w-full my-1">
        {displayImages.map((att, idx) => {
          const isLastAndMore = idx === 3 && extraCount > 0;
          return (
            <div key={att.id || idx} className="relative h-32 sm:h-36 w-full group/img overflow-hidden rounded-lg bg-black/10">
              <img
                src={att.url}
                alt={att.fileName || `Image ${idx + 1}`}
                className={`w-full h-full object-cover cursor-pointer transition-all hover:scale-105 ${
                  message.isSending ? 'opacity-70 blur-[1px]' : ''
                }`}
                onClick={() => !message.isSending && setLightboxImg(att.url)}
              />
              {isLastAndMore && (
                <div
                  onClick={() => !message.isSending && setLightboxImg(att.url)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:bg-black/70 transition-colors"
                >
                  +{extraCount} more
                </div>
              )}
              {message.isSending && !isLastAndMore && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 p-1">
                  <FiLoader size={20} className="animate-spin text-teal-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderLocationCard = () => {
    const isLocationMsg = message.messageType === 'LOCATION' || message.content?.includes('maps?q=') || message.content?.includes('Live Location');
    if (!isLocationMsg) return null;

    const coordsMatch = message.content?.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || message.content?.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    const lat = coordsMatch ? coordsMatch[1] : null;
    const lng = coordsMatch ? coordsMatch[2] : null;
    const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : 'https://maps.google.com';

    return (
      <div className="my-1.5 rounded-2xl overflow-hidden border border-teal-500/30 bg-teal-50/60 dark:bg-[#111b21] max-w-xs shadow-md">
        <div className="relative h-32 w-full bg-gradient-to-tr from-emerald-950 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-3 text-center overflow-hidden border-b border-teal-500/20">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <div className="relative w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <FiMapPin size={20} />
              </div>
            </div>
            <span className="mt-2 text-xs font-bold text-white tracking-wide bg-black/50 backdrop-blur-xs px-3 py-0.5 rounded-full border border-white/20 shadow-xs">
              📍 Live Location
            </span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {lat && lng && (
            <p className="text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-300">
              Lat: {Number(lat).toFixed(4)}, Lng: {Number(lng).toFixed(4)}
            </p>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <FiMapPin size={14} /> Open in Google Maps
          </a>
        </div>
      </div>
    );
  };

  const renderStoryReplyCard = () => {
    if (!message?.content || typeof message.content !== 'string') return null;
    const content = message.content;

    try {
      const storyIdMatch = content.match(/\[STORY_ID:(\d+)\]/);
      const storyId = storyIdMatch ? storyIdMatch[1] : null;
      const cleanContent = content.replace(/\[STORY_ID:\d+\]\s*/g, '');

      const quoteMatch = cleanContent.match(/"([^"]+)"/);
      let storyQuote = quoteMatch ? quoteMatch[1] : '';
      let replyText = '';

      if (quoteMatch) {
        const afterQuote = cleanContent.substring(cleanContent.indexOf(quoteMatch[0]) + quoteMatch[0].length);
        replyText = afterQuote.replace(/💬/g, '').trim();
      } else {
        const lines = cleanContent.split('\n').map((l) => l.trim()).filter(Boolean);
        storyQuote = lines[0] || 'Status Story';
        replyText = lines.slice(1).join(' ').replace(/💬/g, '').trim() || (lines.length > 0 ? lines[lines.length - 1] : '');
      }

      return (
        <div className="my-1 space-y-1.5">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenStory) onOpenStory(storyId, message?.sender?.id);
            }}
            title="Click to view original status story"
            className={`p-2.5 rounded-xl border-l-4 text-xs select-none backdrop-blur-xs cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all group/story ${
              isOwn
                ? 'bg-black/10 dark:bg-black/25 border-teal-600 dark:border-teal-400 text-gray-800 dark:text-gray-200'
                : 'bg-black/5 dark:bg-black/30 border-teal-600 dark:border-teal-500 text-gray-800 dark:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-0.5">
              <div className="flex items-center gap-1.5">
                <BsStars size={13} />
                <span>Status Story</span>
              </div>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 opacity-80 group-hover/story:opacity-100 font-semibold flex items-center gap-0.5">
                View story ↗
              </span>
            </div>
            <p className="italic opacity-85 font-medium line-clamp-2 text-[11px]">
              "{storyQuote || 'Status Story'}"
            </p>
          </div>

          {replyText && (
            <p className="whitespace-pre-wrap break-words leading-relaxed font-normal text-sm px-0.5">
              {replyText}
            </p>
          )}
        </div>
      );
    } catch (err) {
      console.error('Failed to parse story reply card:', err);
      return null;
    }
  };

  const renderMessageBody = () => {
    if (!message) return null;

    if (message.messageType === 'LOCATION' || message.content?.includes('maps?q=')) {
      return renderLocationCard();
    }

    if (
      message.content?.includes('[STORY_ID:') ||
      message.content?.startsWith('Replying to') ||
      message.content?.includes('Replying to status story')
    ) {
      const storyCard = renderStoryReplyCard();
      if (storyCard) return storyCard;
    }

    return (
      <p className="whitespace-pre-wrap break-words leading-relaxed">
        {message.content}
      </p>
    );
  };

  return (
    <div className={`flex w-full my-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="relative group max-w-[75%] sm:max-w-[65%]">

        {/* Message bubble container */}
        <div
          className={`relative px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
            isOwn
              ? 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-white rounded-tr-none'
              : 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-transparent'
          }`}
        >
          {/* Sender name for group chats if received */}
          {!isOwn && message.sender && (
            <div className="font-semibold text-xs text-teal-400 mb-1">
              {message.sender.fullName || message.sender.username}
            </div>
          )}

          {/* Reply Context Header */}
          {message.replyToId && (
            <div className="bg-black/20 p-2 rounded-lg mb-1.5 border-l-4 border-teal-400 text-xs">
              <span className="font-semibold block text-teal-300">
                {message.replyToSenderName || 'Reply'}
              </span>
              <p className="truncate opacity-80">{message.replyToContent}</p>
            </div>
          )}

          {/* Image Attachments Grid */}
          {renderImageGrid()}

          {/* Other Non-Image Attachments */}
          {otherAttachments.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {otherAttachments.map((att, attIdx) => {
                if (!att) return null;
                const attKey = att.id || attIdx;

                if (att.type === 'VIDEO') {
                  return (
                    <div key={attKey} className="relative rounded-lg overflow-hidden max-h-60 w-full my-1">
                      <video controls={!message.isSending} className={`rounded-lg max-h-60 w-full ${message.isSending ? 'opacity-60' : ''}`}>
                        <source src={att.url} type={att.mimeType || 'video/mp4'} />
                      </video>
                      {message.isSending && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-2">
                          <FiLoader size={26} className="animate-spin text-teal-400" />
                          <span className="text-xs font-semibold tracking-wide animate-pulse">Uploading Video...</span>
                        </div>
                      )}
                    </div>
                  );
                } else if (att.type === 'AUDIO') {
                  return (
                    <audio key={attKey} controls className="w-full my-1">
                      <source src={att.url} type={att.mimeType || 'audio/mpeg'} />
                    </audio>
                  );
                }
                return (
                  <div key={attKey} className="space-y-1 my-1">
                    <a
                      href={att.url}
                      onClick={(e) => !message.isSending && handleDownloadAttachment(e, att.url, att.fileName)}
                      download={att.fileName || 'document.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all group/file cursor-pointer select-none ${
                        isOwn
                          ? 'bg-black/10 dark:bg-black/30 hover:bg-black/20 dark:hover:bg-black/40 border-black/10 dark:border-white/10'
                          : 'bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/40 border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-teal-600/20 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-base shrink-0">
                        {message.isSending ? (
                          <FiLoader size={20} className="animate-spin text-teal-600 dark:text-teal-400" />
                        ) : (
                          <FiFileText size={20} />
                        )}
                      </div>
                      <div className="overflow-hidden flex-1 leading-tight">
                        <p className={`truncate font-semibold text-xs transition-colors ${
                          isOwn ? 'text-gray-900 dark:text-gray-100 group-hover/file:text-teal-700 dark:group-hover/file:text-teal-300' : 'text-gray-900 dark:text-gray-100 group-hover/file:text-teal-600 dark:group-hover/file:text-teal-300'
                        }`}>
                          {att.fileName || 'Document'}
                        </p>
                        <p className={`text-[10px] mt-0.5 font-medium ${
                          message.isSending
                            ? 'text-teal-600 dark:text-teal-400 animate-pulse'
                            : isOwn ? 'text-gray-700 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.isSending
                            ? 'Uploading document...'
                            : att.fileSize ? `${(att.fileSize / 1024 / 1024).toFixed(2)} MB` : 'PDF / Document'}
                        </p>
                      </div>
                      {!message.isSending && (
                        <FiDownload size={16} className={`${
                          isOwn ? 'text-gray-700 dark:text-gray-400 group-hover/file:text-gray-900 dark:group-hover/file:text-white' : 'text-gray-500 dark:text-gray-400 group-hover/file:text-gray-800 dark:group-hover/file:text-white'
                        } shrink-0 ml-1`} />
                      )}
                    </a>
                    {message.isSending && (
                      <div className="w-full bg-teal-200/40 dark:bg-teal-900/40 h-1 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full w-2/3 animate-pulse rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Location Card, Story Reply Card, or Text Content */}
          {renderMessageBody()}

          {/* Footer timestamp & status ticks */}
          <div className="flex items-center justify-end gap-1.5 mt-1 opacity-70 text-[11px] float-right ml-4">
            {message.isEdited && <span>(edited)</span>}
            <span>{formatTime(message.createdAt)}</span>
            {renderStatusTicks()}
          </div>

          {/* Reactions badge */}
          {(() => {
            const reactionEntries = reactionsObj && typeof reactionsObj === 'object' ? Object.entries(reactionsObj) : [];
            if (reactionEntries.length === 0) return null;
            return (
              <div className="absolute -bottom-3 left-2 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded-full text-xs flex gap-1 shadow-sm z-10">
                {reactionEntries.map(([emoji, users]) => {
                  const userList = Array.isArray(users) ? users : [];
                  if (userList.length === 0) return null;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReact && onReact(message.id, emoji)}
                      title="Click to add or remove this reaction"
                      className="hover:scale-110 transition-transform px-1 py-0.5 rounded-full cursor-pointer flex items-center gap-0.5 text-xs select-none"
                    >
                      <span>{emoji}</span>
                      {userList.length > 1 && <span className="text-[10px] opacity-80">{userList.length}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Hover quick action bar */}
        <div
          className={`absolute top-1 ${
            isOwn ? '-left-24' : '-right-24'
          } hidden group-hover:flex items-center gap-1 bg-[#111b21] p-1 rounded-lg border border-gray-700 shadow-md text-gray-300 z-10`}
        >
          <button onClick={() => onReply && onReply(message)} title="Reply" className="hover:text-white p-1 cursor-pointer">
            <BsReply size={14} />
          </button>
          <button onClick={() => onStar && onStar(message.id)} title="Star" className="hover:text-yellow-400 p-1 cursor-pointer">
            {message.isStarred ? <BsStarFill className="text-yellow-400" size={13} /> : <BsStar size={13} />}
          </button>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="React" className="hover:text-white p-1 cursor-pointer">
            😀
          </button>
          {onDelete && (
            <button onClick={() => onDelete(message)} title="Delete message" className="hover:text-red-400 p-1 cursor-pointer">
              <BsTrash size={13} />
            </button>
          )}
        </div>

        {/* Quick Emoji Reaction Popup & Full Picker */}
        {showEmojiPicker && (
          <div className="absolute -top-11 left-0 bg-[#111b21] border border-gray-700 px-2.5 py-1 rounded-full shadow-xl flex items-center gap-1.5 z-20 animate-fadeIn select-none">
            {['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '🙏', '💯', '🥳', '😍', '👀', '✨'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact && onReact(message.id, emoji);
                  setShowEmojiPicker(false);
                  setShowFullPicker(false);
                }}
                className="hover:scale-125 transition-transform text-base cursor-pointer p-0.5"
              >
                {emoji}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-gray-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setShowFullPicker(!showFullPicker)}
              title="More emojis"
              className="w-6 h-6 rounded-full bg-[#202c33] hover:bg-teal-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shrink-0 shadow-sm"
            >
              <BsPlusLg size={12} />
            </button>
          </div>
        )}

        {/* Full Emoji Picker Popover */}
        {showFullPicker && (
          <div className="absolute top-8 left-0 z-30 shadow-2xl">
            <EmojiPicker
              theme="dark"
              onEmojiClick={(emojiData) => {
                onReact && onReact(message.id, emojiData.emoji);
                setShowEmojiPicker(false);
                setShowFullPicker(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Lightbox Fullscreen Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 p-3 rounded-full cursor-pointer transition-all z-10"
            title="Close"
          >
            <BsXLg size={20} />
          </button>
          <img
            src={lightboxImg}
            alt="Full size view"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
  } catch (err) {
    console.error('Error rendering message bubble:', err, message);
    return (
      <div className={`flex w-full my-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="px-3.5 py-2 rounded-2xl text-xs bg-teal-100 dark:bg-[#005c4b] text-gray-900 dark:text-white border border-teal-200 dark:border-transparent">
          {typeof message?.content === 'string' ? message.content : 'Message unavailable'}
        </div>
      </div>
    );
  }
};

export default MessageBubble;
