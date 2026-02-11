import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from './notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with empty notifications', () => {
    expect(notificationService.getAll()).toEqual([]);
    expect(notificationService.getUnreadCount()).toBe(0);
  });

  it('should add a notification with id, timestamp, and read=false', () => {
    const n = notificationService.add({
      type: 'security',
      title: 'Test Alert',
      message: '2FA disabled',
    });

    expect(n.id).toBeDefined();
    expect(n.timestamp).toBeDefined();
    expect(n.read).toBe(false);
    expect(n.title).toBe('Test Alert');
    expect(n.type).toBe('security');
  });

  it('should store notifications newest first', () => {
    notificationService.add({ type: 'security', title: 'First', message: '' });
    notificationService.add({ type: 'access', title: 'Second', message: '' });

    const all = notificationService.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].title).toBe('Second');
    expect(all[1].title).toBe('First');
  });

  it('should track unread count', () => {
    notificationService.add({ type: 'security', title: 'A', message: '' });
    notificationService.add({ type: 'access', title: 'B', message: '' });
    notificationService.add({ type: 'system', title: 'C', message: '' });

    expect(notificationService.getUnreadCount()).toBe(3);
  });

  it('should mark individual notification as read', () => {
    const n1 = notificationService.add({ type: 'security', title: 'A', message: '' });
    notificationService.add({ type: 'access', title: 'B', message: '' });

    notificationService.markRead(n1.id);

    expect(notificationService.getUnreadCount()).toBe(1);
    const all = notificationService.getAll();
    const read = all.find((n) => n.id === n1.id);
    expect(read?.read).toBe(true);
  });

  it('should mark all notifications as read', () => {
    notificationService.add({ type: 'security', title: 'A', message: '' });
    notificationService.add({ type: 'access', title: 'B', message: '' });
    notificationService.add({ type: 'system', title: 'C', message: '' });

    notificationService.markAllRead();

    expect(notificationService.getUnreadCount()).toBe(0);
    expect(notificationService.getAll().every((n) => n.read)).toBe(true);
  });

  it('should remove a specific notification', () => {
    const n1 = notificationService.add({ type: 'security', title: 'A', message: '' });
    notificationService.add({ type: 'access', title: 'B', message: '' });

    notificationService.remove(n1.id);

    const all = notificationService.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('B');
  });

  it('should clear all notifications', () => {
    notificationService.add({ type: 'system', title: 'A', message: '' });
    notificationService.add({ type: 'system', title: 'B', message: '' });
    expect(notificationService.getAll()).toHaveLength(2);

    notificationService.clear();
    expect(notificationService.getAll()).toEqual([]);
  });

  it('should not exceed MAX_NOTIFICATIONS (100)', () => {
    for (let i = 0; i < 105; i++) {
      notificationService.add({ type: 'system', title: `N${i}`, message: '' });
    }
    expect(notificationService.getAll().length).toBeLessThanOrEqual(100);
  });
});
