// ==============================================
// Notification Service
// ==============================================
// In-app notification system with localStorage persistence.

import type { AppNotification } from '@/types';

const STORAGE_KEY = 'gitsecureops-notifications';
const MAX_NOTIFICATIONS = 100;

export const notificationService = {
  /**
   * Get all notifications (newest first).
   */
  getAll(): AppNotification[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Add a new notification.
   */
  add(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const full: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const all = this.getAll();
    all.unshift(full);
    if (all.length > MAX_NOTIFICATIONS) all.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return full;
  },

  /**
   * Mark a single notification as read.
   */
  markRead(id: string): void {
    const all = this.getAll();
    const entry = all.find((n) => n.id === id);
    if (entry) entry.read = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  /**
   * Mark all notifications as read.
   */
  markAllRead(): void {
    const all = this.getAll().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  /**
   * Get unread count.
   */
  getUnreadCount(): number {
    return this.getAll().filter((n) => !n.read).length;
  },

  /**
   * Remove a single notification.
   */
  remove(id: string): void {
    const all = this.getAll().filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  /**
   * Clear all notifications.
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default notificationService;
