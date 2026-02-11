// ==============================================
// Shared TypeScript Types
// ==============================================
// Central location for all application types.
// Service-specific types (GitHubUser, GitHubRepo, etc.) are exported
// from their respective service files and re-exported here for convenience.

// Re-export service types
export type {
  GitHubUser,
  GitHubRepo,
  GitHubOrg,
  RepoAccess,
  CopilotSeat,
  CopilotBilling,
} from '@services/githubService';

// ---------------------
// Analytics Types
// ---------------------

export interface OrgHealthScore {
  org: string;
  twoFactorCompliance: number; // 0–100
  averagePermissionLevel: number; // 1 (read) to 3 (admin)
  staleCollaboratorCount: number;
  publicRepoCount: number;
  totalMembers: number;
  overallScore: number; // 0–100
}

export interface AccessTrend {
  date: string;
  totalCollaborators: number;
  externalCollaborators: number;
  addedThisWeek: number;
  removedThisWeek: number;
}

export interface CopilotUsageTrend {
  date: string;
  activeUsers: number;
  totalSeats: number;
  utilizationPercent: number;
}

export interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'no_2fa' | 'admin_without_2fa' | 'stale_access' | 'public_repo' | 'unused_copilot_seat';
  message: string;
  org: string;
  user?: string;
  repo?: string;
  createdAt: string;
}

// ---------------------
// Audit Log Types
// ---------------------

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: string; // who performed the action
  target?: string; // affected user
  org?: string;
  repo?: string;
  details: Record<string, unknown>;
  status: 'success' | 'failure';
}

export type AuditAction =
  | 'access_granted'
  | 'access_revoked'
  | 'copilot_assigned'
  | 'copilot_removed'
  | '2fa_scan'
  | 'export_data'
  | 'bulk_removal'
  | 'login'
  | 'logout';

// ---------------------
// Notification Types
// ---------------------

export interface AppNotification {
  id: string;
  type: 'security' | 'access' | 'copilot' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

// ---------------------
// Recommendation Types
// ---------------------

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'access' | 'copilot' | 'compliance';
  title: string;
  description: string;
  action: string;
  affectedEntities: { type: string; name: string }[];
  estimatedImpact: string;
  autoFixAvailable: boolean;
}
