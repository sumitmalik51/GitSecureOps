import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Shield, Users, Bot, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import type { AppNotification } from '../types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  security: <Shield size={14} className="text-red-400" />,
  access: <Users size={14} className="text-yellow-400" />,
  copilot: <Bot size={14} className="text-indigo-400" />,
  system: <Settings size={14} className="text-gray-400" />,
};

const TYPE_COLORS: Record<string, string> = {
  security: 'border-l-red-500',
  access: 'border-l-yellow-500',
  copilot: 'border-l-indigo-500',
  system: 'border-l-gray-500',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load & poll
  useEffect(() => {
    const load = () => setNotifications(notificationService.getAll());
    load();
    const interval = setInterval(load, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    notificationService.markAllRead();
    setNotifications(notificationService.getAll());
  };

  const handleClear = () => {
    notificationService.clear();
    setNotifications([]);
  };

  const handleClick = (n: AppNotification) => {
    notificationService.markRead(n.id);
    setNotifications(notificationService.getAll());
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setIsOpen(false);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    notificationService.remove(id);
    setNotifications(notificationService.getAll());
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-dark-text-muted" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-dark-surface border border-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-dark-border">
              <h3 className="text-dark-text font-semibold text-sm">
                Notifications {unread > 0 && `(${unread})`}
              </h3>
              <div className="flex gap-2">
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-dark-text-muted text-xs hover:text-red-400 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={24} className="text-dark-text-muted mx-auto mb-2 opacity-30" />
                  <p className="text-dark-text-muted text-sm">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`px-4 py-3 border-b border-dark-border/50 cursor-pointer hover:bg-white/5 transition-colors border-l-2 ${
                      TYPE_COLORS[n.type] || 'border-l-gray-500'
                    } ${!n.read ? 'bg-indigo-500/5' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="mt-0.5">{TYPE_ICONS[n.type]}</div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              n.read ? 'text-dark-text-muted' : 'text-dark-text'
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-dark-text-muted text-xs mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-dark-text-muted/60 text-[10px] mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                        <button
                          onClick={(e) => handleRemove(e, n.id)}
                          className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 text-dark-text-muted hover:text-red-400"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 20 && (
              <div className="px-4 py-2 border-t border-dark-border text-center">
                <p className="text-dark-text-muted text-xs">
                  Showing 20 of {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
