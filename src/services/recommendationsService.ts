// ==============================================
// Recommendations Service
// ==============================================
// Generates actionable security and cost recommendations
// by analyzing GitHub organization data.

import githubService from '@services/githubService';
import type { Recommendation } from '@/types';

export const recommendationsService = {
  /**
   * Generate all recommendations for the given organizations.
   */
  async generateAll(orgs: string[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const org of orgs) {
      try {
        const results = await Promise.allSettled([
          this.check2FACompliance(org),
          this.checkAdminSprawl(org),
          this.checkCopilotUtilization(org),
          this.checkPublicRepos(org),
        ]);

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            if (Array.isArray(result.value)) {
              recommendations.push(...result.value);
            } else {
              recommendations.push(result.value);
            }
          }
        }
      } catch {
        // Skip org on error
      }
    }

    return recommendations.sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority] - priority[b.priority];
    });
  },

  /**
   * Check 2FA compliance across org members.
   */
  async check2FACompliance(org: string): Promise<Recommendation | null> {
    try {
      const [members, noTwoFa] = await Promise.all([
        githubService.getOrgMembers(org),
        githubService.getOrgMembers2FADisabled(org),
      ]);

      if (noTwoFa.length === 0) return null;

      const complianceGap = Math.round((noTwoFa.length / members.length) * 100);

      return {
        id: `2fa-${org}`,
        priority: noTwoFa.length > 5 ? 'critical' : 'high',
        category: 'security',
        title: `${noTwoFa.length} members without 2FA in ${org}`,
        description: `${noTwoFa.length} out of ${members.length} members (${complianceGap}%) do not have two-factor authentication enabled. This is a significant security risk.`,
        action: 'enable_2fa',
        affectedEntities: noTwoFa.map((m) => ({ type: 'user', name: m.login })),
        estimatedImpact: `Improve security compliance by ${complianceGap}%`,
        autoFixAvailable: false,
      };
    } catch {
      return null;
    }
  },

  /**
   * Check for excessive admin accounts.
   */
  async checkAdminSprawl(org: string): Promise<Recommendation | null> {
    try {
      const members = await githubService.getOrgMembers(org);
      // GitHub API returns role info in member listings for orgs
      // We check permissions.admin if available
      const admins = members.filter((m) => m.permissions?.admin);

      // If permissions aren't returned, we can't determine admin count
      if (admins.length === 0) return null;

      const threshold = Math.max(3, Math.ceil(members.length * 0.2));
      if (admins.length <= threshold) return null;

      return {
        id: `admin-sprawl-${org}`,
        priority: 'high',
        category: 'access',
        title: `Too many admins in ${org}`,
        description: `${admins.length} admins out of ${members.length} members (${Math.round((admins.length / members.length) * 100)}%). Consider reducing admin count to minimize attack surface.`,
        action: 'reduce_admins',
        affectedEntities: admins.map((a) => ({ type: 'user', name: a.login })),
        estimatedImpact: 'Reduce attack surface by limiting privileged access',
        autoFixAvailable: false,
      };
    } catch {
      return null;
    }
  },

  /**
   * Check for unused Copilot seats.
   */
  async checkCopilotUtilization(org: string): Promise<Recommendation | null> {
    try {
      const billing = await githubService.getCopilotBilling(org);
      if (!billing?.seat_breakdown) return null;

      const inactive = billing.seat_breakdown.inactive_this_cycle || 0;
      if (inactive === 0) return null;

      const monthlyCost = inactive * 19; // $19/seat/month

      return {
        id: `copilot-unused-${org}`,
        priority: inactive > 10 ? 'high' : 'medium',
        category: 'copilot',
        title: `${inactive} unused Copilot seats in ${org}`,
        description: `You're paying for ${inactive} Copilot seats that haven't been used this billing cycle, costing approximately $${monthlyCost}/month.`,
        action: 'reclaim_copilot_seat',
        affectedEntities: [{ type: 'org', name: org }],
        estimatedImpact: `Save ~$${monthlyCost}/month ($${monthlyCost * 12}/year)`,
        autoFixAvailable: true,
      };
    } catch {
      return null; // Copilot not enabled
    }
  },

  /**
   * Check for public repositories that might need review.
   */
  async checkPublicRepos(org: string): Promise<Recommendation | null> {
    try {
      const repos = await githubService.getOrgRepos(org);
      const publicRepos = repos.filter((r) => !r.private);

      if (publicRepos.length === 0) return null;

      return {
        id: `public-repos-${org}`,
        priority: 'low',
        category: 'compliance',
        title: `${publicRepos.length} public repositories in ${org}`,
        description: `Review whether these ${publicRepos.length} repositories should remain public. Public repos may expose source code, configuration, or sensitive information.`,
        action: 'review_public_repos',
        affectedEntities: publicRepos
          .slice(0, 20)
          .map((r) => ({ type: 'repo', name: r.full_name })),
        estimatedImpact: 'Reduce potential data exposure',
        autoFixAvailable: false,
      };
    } catch {
      return null;
    }
  },
};

export default recommendationsService;
