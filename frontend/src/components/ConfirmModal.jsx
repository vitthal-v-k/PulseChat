import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Remove',
  cancelText = 'Cancel',
  isDanger = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222d34] w-full max-w-md rounded-2xl p-6 shadow-2xl relative transform transition-all scale-100 text-gray-900 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <FiX size={18} />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-2">
          <div
            className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
            }`}
          >
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">{title || 'Are you sure?'}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#222d34]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 dark:bg-[#202c33] hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-gray-200 dark:border-transparent"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                : 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
