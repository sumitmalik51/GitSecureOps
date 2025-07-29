import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import notificationService, { type Notification } from '../services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNotifications(notificationService.getNotifications());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = notificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 99)]);
    });

    return unsubscribe;
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    notificationService.clearNotifications();
    setNotifications([]);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end pt-16 pr-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-96 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Action buttons */}
          {notifications.length > 0 && (
            <div className="flex space-x-2 mt-3">
              {unreadCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAll}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔕</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                You'll see notifications here when important events happen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border-l-4 ${getNotificationBorderColor(notification.type)} ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm font-medium ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      
                      {/* Action and metadata */}
                      {(notification.action || notification.metadata) && (
                        <div className="mt-2 space-y-1">
                          {notification.action && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Action:</span> {notification.action}
                            </div>
                          )}
                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {Object.entries(notification.metadata)
                                .filter(([key]) => !['test', 'timestamp'].includes(key))
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium capitalize">{key}:</span> {String(value)}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Notifications are stored locally and cleared when you refresh the page
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
