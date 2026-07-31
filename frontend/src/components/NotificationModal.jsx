import React, { useEffect } from 'react';
import { BsStars, BsX, BsInfoCircle } from 'react-icons/bs';

const NotificationModal = ({
  isOpen,
  onClose,
  title = 'Notification',
  message = '',
  iconType = 'story', // 'story', 'info', 'warning'
  buttonText = 'Got it',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] w-full max-w-sm rounded-3xl p-6 shadow-2xl relative transform transition-all scale-100 text-gray-900 dark:text-gray-100 flex flex-col items-center text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#202c33] transition-colors cursor-pointer"
          title="Close"
        >
          <BsX size={22} />
        </button>

        {/* Decorative Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-teal-500/20 dark:from-amber-500/30 dark:to-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner border border-teal-500/20">
            {iconType === 'story' ? (
              <BsStars size={32} className="text-amber-500 dark:text-amber-400 animate-pulse" />
            ) : (
              <BsInfoCircle size={30} className="text-teal-600 dark:text-teal-400" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white dark:border-[#111b21] flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
            !
          </span>
        </div>

        {/* Content */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all cursor-pointer transform active:scale-98"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
