// ==============================================
// Analytics Service
// ==============================================
// Computes org health scores, security alerts, and trends
// from live GitHub API data.

import githubService from '@services/githubService';
import type { OrgHealthScore, SecurityAlert } from '@/types';

export const analyticsService = {
  /**
   * Calculate health score for a single organization.
   */
  async calculateOrgHealth(org: string): Promise<OrgHealthScore> {
    const [members, noTwoFa, repos] = await Promise.allSettled([
      githubService.getOrgMembers(org),
      githubService.getOrgMembers2FADisabled(org),
      githubService.getOrgRepos(org),
    ]);

    const memberList = members.status === 'fulfilled' ? members.value : [];
    const noTwoFaList = noTwoFa.status === 'fulfilled' ? noTwoFa.value : [];
    const repoList = repos.status === 'fulfilled' ? repos.value : [];

    const totalMembers = memberList.length;
    const twoFactorCompliance =
      totalMembers > 0
        ? Math.round(((totalMembers - noTwoFaList.length) / totalMembers) * 100)
        : 100;

    const publicRepoCount = repoList.filter((r) => !r.private).length;
    const publicRepoRatio = repoList.length > 0 ? publicRepoCount / repoList.length : 0;

    // Weighted score: 2FA (40%), public repos (30%), general health (30%)
    const overallScore = Math.round(
      twoFactorCompliance * 0.4 + (1 - publicRepoRatio) * 100 * 0.3 + 100 * 0.3 // baseline for other factors
    );

    return {
      org,
      twoFactorCompliance,
      averagePermissionLevel: 1,
      staleCollaboratorCount: 0,
      publicRepoCount,
      totalMembers,
      overallScore: Math.min(100, Math.max(0, overallScore)),
    };
  },

  /**
   * Calculate health scores for multiple organizations.
   */
  async calculateAllOrgHealth(orgs: string[]): Promise<OrgHealthScore[]> {
    const results = await Promise.allSettled(orgs.map((org) => this.calculateOrgHealth(org)));

    return results
      .filter((r): r is PromiseFulfilledResult<OrgHealthScore> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  /**
   * Generate security alerts from organization data.
   */
  async generateSecurityAlerts(org: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    // Check 2FA compliance
    try {
      const [members, noTwoFa] = await Promise.all([
        githubService.getOrgMembers(org),
        githubService.getOrgMembers2FADisabled(org),
      ]);

      for (const member of noTwoFa) {
        // Check if admin without 2FA (critical)
        const isAdmin = members.find((m) => m.login === member.login && m.permissions?.admin);

        alerts.push({
          id: `2fa-${org}-${member.login}`,
          severity: isAdmin ? 'critical' : 'high',
          type: isAdmin ? 'admin_without_2fa' : 'no_2fa',
          message: isAdmin
            ? `Admin ${member.login} does not have 2FA enabled`
            : `${member.login} does not have 2FA enabled`,
          org,
          user: member.login,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // org admin access required for 2FA check
    }

    // Check public repos
    try {
      const repos = await githubService.getOrgRepos(org);
      const publicRepos = repos.filter((r) => !r.private);

      if (publicRepos.length > 0) {
        alerts.push({
          id: `public-repos-${org}`,
          severity: 'low',
          type: 'public_repo',
          message: `${publicRepos.length} public repositories in ${org}`,
          org,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // access error
    }

    // Check Copilot seat utilization
    try {
      const billing = await githubService.getCopilotBilling(org);
      if (billing?.seat_breakdown) {
        const inactive = billing.seat_breakdown.inactive_this_cycle || 0;
        if (inactive > 0) {
          alerts.push({
            id: `copilot-inactive-${org}`,
            severity: 'medium',
            type: 'unused_copilot_seat',
            message: `${inactive} unused Copilot seats in ${org} (~$${inactive * 19}/month)`,
            org,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Copilot not enabled for this org
    }

    return alerts;
  },

  /**
   * Generate alerts for all organizations.
   */
  async generateAllAlerts(orgs: string[]): Promise<SecurityAlert[]> {
    const results = await Promise.allSettled(orgs.map((org) => this.generateSecurityAlerts(org)));

    return results
      .filter((r): r is PromiseFulfilledResult<SecurityAlert[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => {
        const priority = { critical: 0, high: 1, medium: 2, low: 3 };
        return priority[a.severity] - priority[b.severity];
      });
  },
};

export default analyticsService;
