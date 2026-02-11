import { describe, it, expect, beforeEach } from 'vitest';
import { auditLogService } from './auditLogService';

describe('auditLogService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with empty log', () => {
    expect(auditLogService.getAll()).toEqual([]);
    expect(auditLogService.getCount()).toBe(0);
  });

  it('should log an entry and return it with id and timestamp', () => {
    const entry = auditLogService.log({
      action: 'login',
      actor: 'testuser',
      details: {},
      status: 'success',
    });

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.action).toBe('login');
    expect(entry.actor).toBe('testuser');
    expect(entry.status).toBe('success');
  });

  it('should store entries newest first', () => {
    auditLogService.log({ action: 'login', actor: 'user1', details: {}, status: 'success' });
    auditLogService.log({ action: 'logout', actor: 'user2', details: {}, status: 'success' });

    const all = auditLogService.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].action).toBe('logout');
    expect(all[1].action).toBe('login');
  });

  it('should return count correctly', () => {
    auditLogService.log({ action: 'login', actor: 'a', details: {}, status: 'success' });
    auditLogService.log({ action: 'logout', actor: 'b', details: {}, status: 'success' });
    auditLogService.log({ action: '2fa_scan', actor: 'c', details: {}, status: 'failure' });
    expect(auditLogService.getCount()).toBe(3);
  });

  it('should filter by action', () => {
    auditLogService.log({ action: 'login', actor: 'a', details: {}, status: 'success' });
    auditLogService.log({ action: 'logout', actor: 'b', details: {}, status: 'success' });
    auditLogService.log({ action: 'login', actor: 'c', details: {}, status: 'success' });

    const filtered = auditLogService.getFiltered({ action: 'login' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.action === 'login')).toBe(true);
  });

  it('should filter by actor (case insensitive)', () => {
    auditLogService.log({ action: 'login', actor: 'Alice', details: {}, status: 'success' });
    auditLogService.log({ action: 'login', actor: 'Bob', details: {}, status: 'success' });

    const filtered = auditLogService.getFiltered({ actor: 'ali' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].actor).toBe('Alice');
  });

  it('should filter by org', () => {
    auditLogService.log({
      action: 'login',
      actor: 'a',
      org: 'org1',
      details: {},
      status: 'success',
    });
    auditLogService.log({
      action: 'login',
      actor: 'b',
      org: 'org2',
      details: {},
      status: 'success',
    });

    const filtered = auditLogService.getFiltered({ org: 'org1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].org).toBe('org1');
  });

  it('should export CSV with header', () => {
    auditLogService.log({
      action: 'login',
      actor: 'testuser',
      details: { key: 'val' },
      status: 'success',
    });
    const csv = auditLogService.exportCSV();
    expect(csv).toContain('Timestamp,Action,Actor');
    expect(csv).toContain('login');
    expect(csv).toContain('testuser');
  });

  it('should clear all entries', () => {
    auditLogService.log({ action: 'login', actor: 'a', details: {}, status: 'success' });
    auditLogService.log({ action: 'logout', actor: 'b', details: {}, status: 'success' });
    expect(auditLogService.getCount()).toBe(2);

    auditLogService.clear();
    expect(auditLogService.getCount()).toBe(0);
    expect(auditLogService.getAll()).toEqual([]);
  });

  it('should not exceed MAX_ENTRIES (1000)', () => {
    // Log 1005 entries
    for (let i = 0; i < 1005; i++) {
      auditLogService.log({ action: 'login', actor: `user${i}`, details: {}, status: 'success' });
    }
    expect(auditLogService.getCount()).toBeLessThanOrEqual(1000);
  });
});
