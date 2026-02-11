// ==============================================
// Audit Log Service
// ==============================================
// Local audit log with localStorage persistence.
// All user actions (access grants/revokes, scans, exports, etc.)
// are recorded for compliance and review.

import type { AuditLogEntry, AuditAction } from '@/types';

const STORAGE_KEY = 'gitsecureops-audit-log';
const MAX_ENTRIES = 1000;

export const auditLogService = {
  /**
   * Record an action in the audit log.
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const existing = this.getAll();
    existing.unshift(fullEntry);
    if (existing.length > MAX_ENTRIES) existing.pop();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      // localStorage full — remove oldest entries
      const trimmed = existing.slice(0, MAX_ENTRIES / 2);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
    return fullEntry;
  },

  /**
   * Get all audit log entries (newest first).
   */
  getAll(): AuditLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Get filtered entries.
   */
  getFiltered(filters: {
    action?: AuditAction;
    actor?: string;
    org?: string;
    startDate?: string;
    endDate?: string;
  }): AuditLogEntry[] {
    let entries = this.getAll();
    if (filters.action) entries = entries.filter((e) => e.action === filters.action);
    if (filters.actor)
      entries = entries.filter((e) => e.actor.toLowerCase().includes(filters.actor!.toLowerCase()));
    if (filters.org) entries = entries.filter((e) => e.org === filters.org);
    if (filters.startDate) entries = entries.filter((e) => e.timestamp >= filters.startDate!);
    if (filters.endDate) entries = entries.filter((e) => e.timestamp <= filters.endDate!);
    return entries;
  },

  /**
   * Export all entries as CSV string.
   */
  exportCSV(): string {
    const entries = this.getAll();
    const header = 'Timestamp,Action,Actor,Target,Organization,Repository,Status,Details\n';
    const rows = entries
      .map(
        (e) =>
          `${e.timestamp},${e.action},${e.actor},${e.target || ''},${e.org || ''},${e.repo || ''},${e.status},"${JSON.stringify(e.details).replace(/"/g, '""')}"`
      )
      .join('\n');
    return header + rows;
  },

  /**
   * Get count of entries.
   */
  getCount(): number {
    return this.getAll().length;
  },

  /**
   * Clear all entries.
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default auditLogService;
