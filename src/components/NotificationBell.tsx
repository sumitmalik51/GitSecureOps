import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    // Initialize unread count
    const notifications = notificationService.getNotifications();
    setUnreadCount(notifications.filter(n => !n.read).length);

    // Listen for new notifications
    const unsubscribe = notificationService.onNotification(() => {
      setUnreadCount(prev => prev + 1);
      setHasNewNotification(true);
      
      // Remove the "new" indicator after animation
      setTimeout(() => setHasNewNotification(false), 1000);
    });

    return unsubscribe;
  }, []);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
      title="View notifications"
    >
      {/* Bell Icon */}
      <svg 
        className={`w-6 h-6 ${hasNewNotification ? 'animate-bounce' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-3.5-3.5v-5.5c0-3.038-2.462-5.5-5.5-5.5S5.5 4.962 5.5 8v5.5L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" 
        />
      </svg>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] h-[18px]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* New Notification Pulse */}
      {hasNewNotification && (
        <span className="absolute -top-1 -right-1 inline-flex rounded-full h-3 w-3 bg-red-600">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
