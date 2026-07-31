import React from 'react';

const StoryRing = ({ user, hasUnviewed = true, onClick, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }[size];

  const borderGradient = hasUnviewed
    ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-500 p-[2.5px]'
    : 'bg-gray-300 dark:bg-gray-700 p-[2px]';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-full cursor-pointer transition-transform hover:scale-105 ${borderGradient} flex items-center justify-center`}
    >
      <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800`}>
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 uppercase">
            {user?.username?.charAt(0) || '?'}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryRing;
