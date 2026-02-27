/**
 * AI Service — GitSecureOps Security Copilot
 *
 * Dual-mode AI engine:
 *   1. **Azure OpenAI** — If VITE_AZURE_OPENAI_ENDPOINT is set, routes to
 *      the `/api/ai-chat` Azure Function which proxies to Azure OpenAI.
 *   2. **Built-in Intelligence** — When no API key is configured, falls back
 *      to a sophisticated rule-based engine that analyses the user's live
 *      GitHub data and returns contextual security insights.
 *
 * The built-in engine is NOT a toy — it fetches real org data via the GitHub
 * API and builds structured analysis including risk scores, recommendations,
 * compliance percentages, and actionable remediation steps.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GitHubOrg {
  login: string;
  avatar_url: string;
  description: string | null;
}

interface OrgSecurityContext {
  orgName: string;
  totalRepos: number;
  publicRepos: number;
  privateRepos: number;
  totalMembers: number;
  members2FADisabled: number;
  outsideCollaborators: number;
  recentPushEvents: number;
  hasSecurityPolicy: boolean;
  forkedRepos: number;
  archivedRepos: number;
  topics: string[];
}

interface PRInfo {
  title: string;
  number: number;
  repo: string;
  user: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  draft: boolean;
  labels: string[];
}

interface RepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  updated_at: string;
  html_url: string;
  private: boolean;
  topics: string[];
}

/* ------------------------------------------------------------------ */
/*  GitHub data fetchers                                               */
/* ------------------------------------------------------------------ */

/** Fetch all orgs the user belongs to */
async function fetchUserOrgs(token: string): Promise<GitHubOrg[]> {
  try {
    const res = await fetch('https://api.github.com/user/orgs?per_page=100', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Fetch recent PRs across the org's repos (all states: open, closed, merged) */
async function fetchRecentPRs(
  token: string,
  orgName: string,
  hoursBack: number = 24
): Promise<PRInfo[]> {
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    // Use ISO date for the search query (GitHub search uses YYYY-MM-DDTHH:MM:SS format)
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    // Fetch ALL PRs (open + closed/merged) created since the cutoff
    const query = `org:${orgName} is:pr created:>=${since}`;
    const res = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=50`,
      { headers }
    );
    if (!res.ok) {
      console.warn('PR search failed:', res.status, await res.text().catch(() => ''));
      return [];
    }
    const data = await res.json();

    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
    return (data.items || [])
      .filter((pr: { created_at: string }) => new Date(pr.created_at).getTime() >= cutoff)
      .map(
        (pr: {
          title: string;
          number: number;
          repository_url: string;
          user: { login: string };
          state: string;
          created_at: string;
          updated_at: string;
          html_url: string;
          draft: boolean;
          pull_request?: { merged_at: string | null };
          labels: { name: string }[];
        }) => ({
          title: pr.title,
          number: pr.number,
          repo: pr.repository_url.split('/').slice(-1)[0],
          user: pr.user?.login || 'unknown',
          state: pr.pull_request?.merged_at ? 'merged' : pr.state,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          html_url: pr.html_url,
          draft: pr.draft || false,
          labels: (pr.labels || []).map((l: { name: string }) => l.name),
        })
      );
  } catch (err) {
    console.warn('fetchRecentPRs error:', err);
    return [];
  }
}

/** Search repos in org by keyword */
async function searchOrgRepos(
  token: string,
  orgName: string,
  keyword: string
): Promise<RepoInfo[]> {
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const query = `org:${orgName} ${keyword} in:name,description,topics`;
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=10`,
      { headers }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(
      (r: {
        name: string;
        full_name: string;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        open_issues_count: number;
        updated_at: string;
        html_url: string;
        private: boolean;
        topics: string[];
      }) => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        language: r.language,
        stargazers_count: r.stargazers_count,
        open_issues_count: r.open_issues_count,
        updated_at: r.updated_at,
        html_url: r.html_url,
        private: r.private,
        topics: r.topics || [],
      })
    );
  } catch {
    return [];
  }
}

async function fetchOrgContext(
  token: string,
  orgName?: string
): Promise<OrgSecurityContext | null> {
  try {
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // Use provided org or fall back to first org
    let resolvedOrgName: string | undefined = orgName;
    if (!resolvedOrgName) {
      const orgsRes = await fetch('https://api.github.com/user/orgs?per_page=1', { headers });
      if (!orgsRes.ok) return null;
      const orgs = await orgsRes.json();
      if (!orgs.length) return null;
      resolvedOrgName = orgs[0].login as string;
    }

    if (!resolvedOrgName) return null;
    const finalOrgName: string = resolvedOrgName;

    // Parallel fetch: repos, members, events
    const [reposRes, membersRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/orgs/${finalOrgName}/repos?per_page=100&sort=updated`, {
        headers,
      }),
      fetch(`https://api.github.com/orgs/${finalOrgName}/members?per_page=100`, { headers }),
      fetch(`https://api.github.com/orgs/${finalOrgName}/events?per_page=30`, { headers }),
    ]);

    const repos = reposRes.ok ? await reposRes.json() : [];
    const members = membersRes.ok ? await membersRes.json() : [];
    const events = eventsRes.ok ? await eventsRes.json() : [];

    // Try 2FA filter (needs org admin)
    let members2FA = 0;
    try {
      const twoFaRes = await fetch(
        `https://api.github.com/orgs/${finalOrgName}/members?filter=2fa_disabled&per_page=100`,
        { headers }
      );
      if (twoFaRes.ok) {
        const twoFaMembers = await twoFaRes.json();
        members2FA = twoFaMembers.length;
      }
    } catch {
      // Non-admin can't access this — that's fine
    }

    // Outside collaborators
    let outsideCollabs = 0;
    try {
      const collabRes = await fetch(
        `https://api.github.com/orgs/${finalOrgName}/outside_collaborators?per_page=100`,
        { headers }
      );
      if (collabRes.ok) {
        const collabs = await collabRes.json();
        outsideCollabs = collabs.length;
      }
    } catch {
      /* ignore */
    }

    const publicRepos = repos.filter((r: { private: boolean }) => !r.private).length;
    const forkedRepos = repos.filter((r: { fork: boolean }) => r.fork).length;
    const archivedRepos = repos.filter((r: { archived: boolean }) => r.archived).length;
    const pushEvents = events.filter((e: { type: string }) => e.type === 'PushEvent').length;

    // Collect topics
    const topicsSet = new Set<string>();
    repos.forEach((r: { topics?: string[] }) => {
      r.topics?.forEach((t: string) => topicsSet.add(t));
    });

    // Check if org has a .github repo with SECURITY.md
    let hasSecurityPolicy = false;
    try {
      const secRes = await fetch(
        `https://api.github.com/repos/${finalOrgName}/.github/contents/SECURITY.md`,
        { headers }
      );
      hasSecurityPolicy = secRes.ok;
    } catch {
      /* ignore */
    }

    return {
      orgName: finalOrgName,
      totalRepos: repos.length,
      publicRepos,
      privateRepos: repos.length - publicRepos,
      totalMembers: members.length,
      members2FADisabled: members2FA,
      outsideCollaborators: outsideCollabs,
      recentPushEvents: pushEvents,
      hasSecurityPolicy,
      forkedRepos,
      archivedRepos,
      topics: Array.from(topicsSet).slice(0, 20),
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Built-in AI Engine (no external API needed)                        */
/* ------------------------------------------------------------------ */
class BuiltInAIEngine {
  private context: OrgSecurityContext | null = null;
  private contextFetchPromise: Promise<OrgSecurityContext | null> | null = null;
  private currentOrg: string | null = null;

  async ensureContext(token: string, orgName?: string): Promise<OrgSecurityContext | null> {
    // Refetch if org changed
    if (orgName && orgName !== this.currentOrg) {
      this.context = null;
      this.contextFetchPromise = null;
      this.currentOrg = orgName;
    }
    if (this.context) return this.context;
    if (!this.contextFetchPromise) {
      this.contextFetchPromise = fetchOrgContext(token, orgName);
    }
    this.context = await this.contextFetchPromise;
    return this.context;
  }

  clearContext() {
    this.context = null;
    this.contextFetchPromise = null;
    this.currentOrg = null;
  }

  async generateResponse(
    messages: ChatMessage[],
    token: string,
    orgName?: string
  ): Promise<string> {
    const ctx = await this.ensureContext(token, orgName);
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

    // Add a small delay to feel more natural
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    if (!ctx) {
      return this.noContextResponse(lastMsg);
    }

    // Route to the right analysis
    if (
      this.matches(lastMsg, [
        'security posture',
        'risk score',
        'overall',
        'how secure',
        'overview',
        'security score',
        'assess',
      ])
    ) {
      return this.securityPosture(ctx);
    }
    if (
      this.matches(lastMsg, [
        '2fa',
        'two factor',
        'two-factor',
        'mfa',
        'authentication',
        'compliance',
      ])
    ) {
      return this.twoFactorAnalysis(ctx);
    }
    if (
      this.matches(lastMsg, [
        'repo risk',
        'risky repo',
        'riskiest',
        'dangerous repo',
        'vulnerable repo',
        'repo security',
      ])
    ) {
      return this.repoRiskAnalysis(ctx);
    }
    if (
      this.matches(lastMsg, [
        'quick win',
        'easy fix',
        'low hanging',
        'improve',
        'recommend',
        'suggestion',
        'what should',
      ])
    ) {
      return this.quickWins(ctx);
    }
    if (this.matches(lastMsg, ['collaborator', 'outside', 'external', 'third party', 'vendor'])) {
      return this.collaboratorAnalysis(ctx);
    }
    if (this.matches(lastMsg, ['public repo', 'visibility', 'exposed', 'open source', 'public'])) {
      return this.publicRepoAnalysis(ctx);
    }
    // PR queries — extract hours if mentioned
    if (this.matches(lastMsg, ['pr', 'pull request', 'open pr', 'recent pr', 'merge request'])) {
      const hoursMatch = lastMsg.match(/(\d+)\s*(?:hr|hour|hrs|hours|h)/);
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 24;
      return this.recentPRsAnalysis(ctx, token, hours);
    }
    // Repo search — "which repo", "find repo", "repo related to", "repo for"
    if (
      this.matches(lastMsg, [
        'which repo',
        'find repo',
        'repo related',
        'repo for',
        'search repo',
        'repo about',
        'repo named',
      ])
    ) {
      const rawMsg = messages[messages.length - 1]?.content || '';
      return this.repoSearchAnalysis(ctx, token, rawMsg);
    }
    if (
      this.matches(lastMsg, ['owner', 'admin', 'org owner', 'add owner', 'who owns', 'org admin'])
    ) {
      return this.ownerAnalysis(ctx);
    }
    if (this.matches(lastMsg, ['member', 'team', 'people', 'user', 'who', 'headcount'])) {
      return this.memberAnalysis(ctx);
    }
    if (this.matches(lastMsg, ['activity', 'event', 'push', 'commit', 'active', 'recent'])) {
      return this.activityAnalysis(ctx);
    }
    if (this.matches(lastMsg, ['fork', 'forked', 'clone'])) {
      return this.forkAnalysis(ctx);
    }
    if (this.matches(lastMsg, ['policy', 'security.md', 'governance', 'standard'])) {
      return this.policyAnalysis(ctx);
    }
    if (this.matches(lastMsg, ['help', 'what can you', 'capabilities', 'how to use'])) {
      return this.helpResponse(ctx);
    }
    if (this.matches(lastMsg, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
      return this.greetingResponse(ctx);
    }

    // General fallback with context
    return this.generalAnalysis(ctx, lastMsg);
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some((k) => text.includes(k));
  }

  private riskScore(ctx: OrgSecurityContext): { score: number; grade: string; color: string } {
    return computeRiskScore(ctx);
  }

  private securityPosture(ctx: OrgSecurityContext): string {
    const { score, grade, color } = this.riskScore(ctx);
    const twoFaPct =
      ctx.totalMembers > 0
        ? Math.round(((ctx.totalMembers - ctx.members2FADisabled) / ctx.totalMembers) * 100)
        : 100;
    const publicPct = ctx.totalRepos > 0 ? Math.round((ctx.publicRepos / ctx.totalRepos) * 100) : 0;

    return `## ${color} Security Posture Analysis — ${ctx.orgName}

### Overall Risk Score: ${score}/100 (Grade ${grade})

Here's a breakdown of your organization's security health:

### Key Metrics
- **Total Repositories:** ${ctx.totalRepos} (${ctx.publicRepos} public, ${ctx.privateRepos} private)
- **Team Size:** ${ctx.totalMembers} members, ${ctx.outsideCollaborators} outside collaborators
- **2FA Compliance:** ${twoFaPct}% (${ctx.members2FADisabled} members without 2FA)
- **Public Exposure:** ${publicPct}% of repos are public
- **Security Policy:** ${ctx.hasSecurityPolicy ? '✅ Present' : '❌ Missing'}

### Risk Factors
${ctx.members2FADisabled > 0 ? `- 🔴 **Critical:** ${ctx.members2FADisabled} member(s) without 2FA — this is the #1 account takeover risk` : '- ✅ All members have 2FA enabled'}
${ctx.publicRepos > 5 ? `- 🟡 **Warning:** ${ctx.publicRepos} public repositories could expose sensitive code` : ctx.publicRepos > 0 ? `- 🟡 **Note:** ${ctx.publicRepos} public repo(s) — verify no secrets are exposed` : '- ✅ No public repositories'}
${!ctx.hasSecurityPolicy ? '- 🟠 **Moderate:** No organization-level SECURITY.md policy found' : '- ✅ Security Policy is in place'}
${ctx.outsideCollaborators > 10 ? `- 🟡 **Warning:** ${ctx.outsideCollaborators} outside collaborators — review access regularly` : ''}

### Recommendations
1. ${ctx.members2FADisabled > 0 ? 'Enforce 2FA for all organization members immediately' : 'Maintain your 2FA enforcement — great job!'}
2. ${!ctx.hasSecurityPolicy ? 'Create a SECURITY.md in your .github repository' : 'Keep your security policy updated'}
3. ${ctx.publicRepos > 3 ? 'Audit public repositories for accidental secret exposure' : 'Continue keeping most repositories private'}
4. Review outside collaborator access quarterly
5. Enable branch protection rules on all active repositories`;
  }

  private twoFactorAnalysis(ctx: OrgSecurityContext): string {
    const twoFaPct =
      ctx.totalMembers > 0
        ? Math.round(((ctx.totalMembers - ctx.members2FADisabled) / ctx.totalMembers) * 100)
        : 100;
    const status = twoFaPct === 100 ? '🟢' : twoFaPct >= 80 ? '🟡' : '🔴';

    return `## ${status} 2FA Compliance Report — ${ctx.orgName}

### Compliance Rate: ${twoFaPct}%

- **Total Members:** ${ctx.totalMembers}
- **2FA Enabled:** ${ctx.totalMembers - ctx.members2FADisabled}
- **2FA Disabled:** ${ctx.members2FADisabled}

${
  ctx.members2FADisabled > 0
    ? `### ⚠️ Action Required

${ctx.members2FADisabled} member(s) do NOT have two-factor authentication enabled. This is a **critical security risk** — compromised passwords without 2FA can lead to:

- Unauthorized code commits and repository access
- Supply chain attacks via malicious code injection
- Data exfiltration from private repositories
- Lateral movement to connected CI/CD systems

### Remediation Steps
1. **Immediate:** Navigate to your GitHub org settings → Member privileges → Require 2FA
2. **Enforcement:** Members who don't enable 2FA within the grace period are automatically removed
3. **Communication:** Send a team notice with setup instructions for [GitHub 2FA](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication)
4. **Preferred method:** Recommend hardware keys (FIDO2/WebAuthn) over TOTP apps for maximum security`
    : `### ✅ Excellent!

All ${ctx.totalMembers} members have 2FA enabled. Your organization meets the security baseline for authentication.

### Best Practices to Maintain
- Keep the "Require 2FA" setting enabled in org settings
- Encourage hardware security keys for admin accounts
- Review new member 2FA status during onboarding
- Consider requiring SAML SSO for enterprise-grade authentication`
}`;
  }

  private repoRiskAnalysis(ctx: OrgSecurityContext): string {
    const riskFactors: string[] = [];
    if (ctx.publicRepos > 0)
      riskFactors.push(`${ctx.publicRepos} public repos (potential data exposure)`);
    if (ctx.forkedRepos > 0)
      riskFactors.push(`${ctx.forkedRepos} forked repos (dependency on external code)`);
    if (ctx.archivedRepos > 0)
      riskFactors.push(
        `${ctx.archivedRepos} archived repos (unmaintained, may have vulnerabilities)`
      );

    return `## 🔍 Repository Risk Analysis — ${ctx.orgName}

### Repository Inventory
- **Total:** ${ctx.totalRepos} repositories
- **Public:** ${ctx.publicRepos} | **Private:** ${ctx.privateRepos}
- **Forked:** ${ctx.forkedRepos} | **Archived:** ${ctx.archivedRepos}

### Identified Risk Factors
${riskFactors.length > 0 ? riskFactors.map((r) => `- 🔶 ${r}`).join('\n') : '- ✅ No major repository risk factors detected'}

### Risk Categories

**🔴 High Risk — Public Repositories**
${
  ctx.publicRepos > 0
    ? `You have ${ctx.publicRepos} public repositories. Each should be audited for:
- Hardcoded secrets, API keys, or credentials
- Internal documentation or architecture details
- Customer data or PII in test fixtures
- Overly permissive \`.gitignore\` files`
    : 'No public repositories — excellent!'
}

**🟡 Medium Risk — Forked Repositories**
${
  ctx.forkedRepos > 0
    ? `${ctx.forkedRepos} forked repositories may contain:
- Outdated dependencies from upstream
- Unreviewed code from external contributors
- Divergent branches with unknown security patches`
    : 'No forked repositories.'
}

**🟠 Low Risk — Archived Repositories**
${
  ctx.archivedRepos > 0
    ? `${ctx.archivedRepos} archived repositories may still contain:
- Valid credentials that were never rotated
- Vulnerable dependency versions
- Consider deleting archives with sensitive data`
    : 'No archived repositories.'
}

### Recommendations
1. Run secret scanning on all public repositories
2. Enable Dependabot alerts across the organization
3. Set up branch protection rules on all active repos
4. Archive or delete inactive repositories (no commits in 6+ months)
5. Review forked repos for upstream security patches`;
  }

  private quickWins(ctx: OrgSecurityContext): string {
    const wins: string[] = [];

    if (ctx.members2FADisabled > 0) {
      wins.push(
        `**Enforce 2FA** — ${ctx.members2FADisabled} members lack 2FA. Go to Org Settings → Member Privileges → check "Require 2FA." Impact: 🔴 Critical`
      );
    }
    if (!ctx.hasSecurityPolicy) {
      wins.push(
        '**Add SECURITY.md** — Create a `.github/SECURITY.md` with vulnerability reporting instructions. Takes 5 minutes. Impact: 🟡 Moderate'
      );
    }
    if (ctx.publicRepos > 0) {
      wins.push(
        `**Audit ${ctx.publicRepos} public repos** — Run \`git log --all --oneline | grep -i secret\` and check for accidentally committed credentials. Impact: 🔴 High`
      );
    }
    if (ctx.outsideCollaborators > 0) {
      wins.push(
        `**Review ${ctx.outsideCollaborators} outside collaborators** — Verify each external user still needs access. Remove any stale accounts. Impact: 🟡 Moderate`
      );
    }
    wins.push(
      '**Enable branch protection** — Require PR reviews + status checks on `main`/`master` for all repos. Prevents force-push attacks. Impact: 🟡 Moderate'
    );
    wins.push(
      '**Enable Dependabot** — Auto-detect vulnerable dependencies across all repos. Free feature, zero maintenance. Impact: 🟢 Easy Win'
    );
    wins.push(
      '**Enable secret scanning** — GitHub can detect leaked tokens automatically. Enable it org-wide in security settings. Impact: 🔴 High'
    );

    return `## ⚡ Quick Security Wins — ${ctx.orgName}

Here are actionable improvements ordered by impact:

${wins.map((w, i) => `${i + 1}. ${w}`).join('\n\n')}

### Time Estimate
Most of these can be completed in **under 30 minutes** and immediately improve your security posture by 15-30 points.`;
  }

  private collaboratorAnalysis(ctx: OrgSecurityContext): string {
    return `## 👥 Outside Collaborator Analysis — ${ctx.orgName}

### Current State
- **Outside Collaborators:** ${ctx.outsideCollaborators}
- **Organization Members:** ${ctx.totalMembers}
- **Ratio:** ${ctx.totalMembers > 0 ? Math.round((ctx.outsideCollaborators / ctx.totalMembers) * 100) : 0}% external

${
  ctx.outsideCollaborators > 5
    ? `### ⚠️ Elevated External Access

${ctx.outsideCollaborators} outside collaborators have access to your organization. This increases your attack surface:

- External accounts are outside your 2FA enforcement policies
- Collaborator permissions may be overly broad
- Former vendors/contractors may still have access

### Recommendations
1. Audit each collaborator's current access level and active status
2. Remove collaborators who haven't contributed in 90+ days
3. Prefer team-based access over individual collaborator invites
4. Implement quarterly access reviews for all external users
5. Use GitHub's repository-level permissions instead of org-level`
    : `### ✅ Manageable External Access

With ${ctx.outsideCollaborators} outside collaborators, your external attack surface is limited. Continue with regular access reviews to maintain this status.`
}`;
  }

  private publicRepoAnalysis(ctx: OrgSecurityContext): string {
    const exposurePct =
      ctx.totalRepos > 0 ? Math.round((ctx.publicRepos / ctx.totalRepos) * 100) : 0;

    return `## 🌐 Public Repository Analysis — ${ctx.orgName}

### Visibility Breakdown
- **Public:** ${ctx.publicRepos} repos (${exposurePct}%)
- **Private:** ${ctx.privateRepos} repos (${100 - exposurePct}%)

${
  ctx.publicRepos > 0
    ? `### Security Considerations for Public Repos

Each public repository is visible to the entire internet. Verify:

1. **No secrets** — API keys, passwords, tokens in code or history
2. **No internal docs** — Architecture diagrams, internal URLs, infra details
3. **No PII** — Customer data, email addresses, test data with real info
4. **License compliance** — Ensure proper LICENSE file exists
5. **Dependency safety** — Public repos attract automated attacks on known CVEs

### Secret Scanning Checklist
- \`AWS_ACCESS_KEY_ID\` / \`AWS_SECRET_ACCESS_KEY\`
- \`GITHUB_TOKEN\` / \`GH_TOKEN\`
- Database connection strings
- \`.env\` files committed accidentally
- Private SSH keys

### Tools to Help
- **GitHub Secret Scanning** — Enable in org security settings
- **git-secrets** — Pre-commit hook to prevent secret commits
- **truffleHog** — Scan git history for high-entropy strings`
    : `### ✅ Zero Public Exposure

All ${ctx.totalRepos} repositories are private. This is the most secure configuration for organizations handling sensitive code.`
}`;
  }

  private ownerAnalysis(ctx: OrgSecurityContext): string {
    return `## 👑 Organization Owners — ${ctx.orgName}

### Overview
- **Total Members:** ${ctx.totalMembers}
- **Outside Collaborators:** ${ctx.outsideCollaborators}
- **2FA Compliance:** ${ctx.totalMembers > 0 ? Math.round(((ctx.totalMembers - ctx.members2FADisabled) / ctx.totalMembers) * 100) : 100}%

### Managing Org Owners
Use the **Org Owners** page in the sidebar (Management → Org Owners) to:

1. **View current owners** — See all users with admin role
2. **Add new owners** — Single or bulk add by GitHub username
3. **Demote owners** — Change an owner to a regular member
4. **Remove owners** — Remove a user from the org entirely
5. **Manage invitations** — View and cancel pending owner invites

### Security Best Practices for Owners
- 🔴 **Minimize owners** — Only 2-3 trusted admins should have owner access
- 🔴 **Require 2FA** — All owners must have 2FA enabled (hardware keys preferred)
- 🟡 **Review quarterly** — Audit who has owner access every quarter
- 🟡 **Use SSO/SAML** — Centralize identity management through your IdP
- 🟢 **Enable audit log** — Monitor all admin-level actions

### EMU Organizations
If using Enterprise Managed Users:
- Owners should be provisioned via **SCIM groups** in your IdP
- Map an IdP group (e.g., "GitHub Org Admins") to the owner role
- Deprovisioning in IdP automatically removes owner access

Navigate to **Org Owners** in the sidebar to manage owners directly.`;
  }

  private memberAnalysis(ctx: OrgSecurityContext): string {
    return `## 👤 Member Analysis — ${ctx.orgName}

### Team Overview
- **Organization Members:** ${ctx.totalMembers}
- **Outside Collaborators:** ${ctx.outsideCollaborators}
- **Total with Access:** ${ctx.totalMembers + ctx.outsideCollaborators}
- **2FA Compliance:** ${ctx.totalMembers > 0 ? Math.round(((ctx.totalMembers - ctx.members2FADisabled) / ctx.totalMembers) * 100) : 100}%

### Security Recommendations
1. Implement **least-privilege access** — use team-based repo permissions
2. Conduct **quarterly access reviews** to remove inactive accounts
3. Require **2FA for all members** without exception
4. Use **SSO/SAML** for centralized identity management
5. Monitor **audit log** for suspicious authentication events
6. Set up **IP allow lists** for sensitive operations`;
  }

  private activityAnalysis(ctx: OrgSecurityContext): string {
    return `## 📊 Activity Analysis — ${ctx.orgName}

### Recent Activity
- **Push Events (last 30):** ${ctx.recentPushEvents}
- **Activity Level:** ${ctx.recentPushEvents > 20 ? '🟢 High' : ctx.recentPushEvents > 5 ? '🟡 Moderate' : '🔴 Low'}

### What This Means
${ctx.recentPushEvents > 20 ? 'Your org is very active — ensure CI/CD pipelines and branch protection are properly configured to handle the volume of changes.' : ctx.recentPushEvents > 5 ? 'Moderate activity level — a good balance. Ensure all pushes go through proper review processes.' : 'Low activity — check if this is expected. Low activity repos may have stale dependencies and unpatched vulnerabilities.'}

### Security Monitoring Tips
1. Enable **audit log streaming** to your SIEM
2. Set up **alerts for sensitive events** (member removal, repo deletion, settings changes)
3. Review **failed authentication attempts** regularly
4. Monitor for **unusual push patterns** (off-hours, large commits)`;
  }

  private forkAnalysis(ctx: OrgSecurityContext): string {
    const forkPct = ctx.totalRepos > 0 ? Math.round((ctx.forkedRepos / ctx.totalRepos) * 100) : 0;

    return `## 🔀 Fork Analysis — ${ctx.orgName}

### Fork Statistics
- **Forked Repos:** ${ctx.forkedRepos} (${forkPct}% of total)
- **Original Repos:** ${ctx.totalRepos - ctx.forkedRepos}

### Security Implications
${
  ctx.forkedRepos > 0
    ? `Forked repositories inherit code from external sources:

1. **Supply chain risk** — upstream changes may introduce vulnerabilities
2. **Patch lag** — your forks may miss critical security updates
3. **License compliance** — ensure fork licenses are compatible

### Recommendations
- Keep forks synchronized with upstream repositories
- Review upstream security advisories regularly
- Consider using GitHub's dependency graph to track fork health`
    : 'No forked repositories — your codebase is fully self-contained.'
}`;
  }

  private policyAnalysis(ctx: OrgSecurityContext): string {
    return `## 📋 Security Policy Analysis — ${ctx.orgName}

### Organization Security Policy
${ctx.hasSecurityPolicy ? '✅ **SECURITY.md found** in the .github repository' : '❌ **No SECURITY.md found** — this is recommended for all organizations'}

### Recommended Policy Contents
${
  !ctx.hasSecurityPolicy
    ? `Create a \`.github/SECURITY.md\` file with:

1. **Supported versions** — which releases receive security patches
2. **Reporting process** — how to report vulnerabilities (email, HackerOne, etc.)
3. **Response timeline** — expected SLA for security issue triage
4. **Disclosure policy** — coordinated disclosure timeline
5. **Security contacts** — team members responsible for security

### Template
\`\`\`markdown
# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities to security@yourorg.com.
Do NOT create public GitHub issues for security vulnerabilities.

## Response Timeline
- Acknowledgment: 24 hours
- Triage: 72 hours  
- Fix: Based on severity
\`\`\``
    : `Your policy is in place! Ensure it includes:
- Clear reporting instructions
- Expected response timeline
- Disclosure policy
- Contact information`
}`;
  }

  private helpResponse(ctx: OrgSecurityContext): string {
    return `## 🤖 Security Copilot — Capabilities

I can analyze your GitHub organization **${ctx.orgName}** in real-time. Try asking:

- **"Analyze my security posture"** — Full risk assessment with score
- **"Check 2FA compliance"** — Authentication security audit
- **"Find risky repositories"** — Identify vulnerable repos
- **"Give me quick security wins"** — Actionable improvements
- **"Show PRs opened in last 12 hours"** — Recent pull request activity
- **"Which repo is related to auth?"** — Search repos by keyword
- **"Who are the org owners?"** — View and manage org owners
- **"Review outside collaborators"** — External access analysis
- **"Check public repo exposure"** — Visibility risk assessment
- **"Analyze team members"** — Member security overview
- **"Show recent activity"** — Activity monitoring insights
- **"Review security policy"** — Governance analysis

💡 **Tip:** Use the org selector in the header to switch between organizations.

I analyze live data from your GitHub organization to provide contextual, actionable security intelligence.`;
  }

  private greetingResponse(ctx: OrgSecurityContext): string {
    const { score, grade, color } = this.riskScore(ctx);
    return `${color} Hello! I'm your **Security Copilot** for the **${ctx.orgName}** organization.

Your current security score is **${score}/100 (Grade ${grade})**. I'm monitoring ${ctx.totalRepos} repositories and ${ctx.totalMembers} team members.

How can I help you today? I can analyze your security posture, check 2FA compliance, identify risky repos, or suggest quick security improvements.`;
  }

  private generalAnalysis(ctx: OrgSecurityContext, query: string): string {
    const { score, grade, color } = this.riskScore(ctx);

    return `## ${color} Analysis — ${ctx.orgName}

Based on your question about "${query.slice(0, 60)}${query.length > 60 ? '…' : ''}", here's what I found:

### Organization Snapshot
- **Security Score:** ${score}/100 (Grade ${grade})
- **Repos:** ${ctx.totalRepos} (${ctx.publicRepos} public)
- **Members:** ${ctx.totalMembers} (${ctx.members2FADisabled} without 2FA)
- **External Access:** ${ctx.outsideCollaborators} outside collaborators
- **Security Policy:** ${ctx.hasSecurityPolicy ? '✅' : '❌'}

### Top Priorities
${ctx.members2FADisabled > 0 ? `1. 🔴 Enforce 2FA for ${ctx.members2FADisabled} non-compliant member(s)` : '1. ✅ 2FA is fully enforced'}
${ctx.publicRepos > 0 ? `2. 🟡 Audit ${ctx.publicRepos} public repos for secrets` : '2. ✅ All repos are private'}
${!ctx.hasSecurityPolicy ? '3. 🟠 Create organization SECURITY.md' : '3. ✅ Security policy exists'}

Try asking me something more specific! I can deep-dive into 2FA compliance, repository risks, member access patterns, or provide quick-win recommendations.`;
  }

  private noContextResponse(query: string): string {
    if (this.matches(query, ['help', 'what can you', 'capabilities'])) {
      return `## 🤖 Security Copilot

I'm an AI security assistant for GitSecureOps. I can analyze your GitHub organization's security posture, but I need access to your org data first.

**To get started:**
1. Make sure you're logged in with GitHub OAuth
2. Ensure you have access to at least one GitHub organization
3. Try asking "analyze my security posture"

I'll fetch your org data in real-time and provide actionable insights.`;
    }

    return `I'd love to analyze your GitHub organization, but I couldn't access your org data. This might be because:

- You're not logged in yet — please authenticate with GitHub first
- Your account isn't part of any GitHub organization
- The OAuth token doesn't have the \`read:org\` scope

Once connected, I can provide real-time security analysis, 2FA compliance reports, repository risk assessments, and actionable recommendations.`;
  }

  /* ---- Recent PRs ---- */
  private async recentPRsAnalysis(
    ctx: OrgSecurityContext,
    token: string,
    hours: number
  ): Promise<string> {
    const prs = await fetchRecentPRs(token, ctx.orgName, hours);

    if (prs.length === 0) {
      return `## 📭 No Open PRs — ${ctx.orgName}

No new pull requests were opened in the last **${hours} hours**.

This could mean:
- The team is focused on reviews/merges rather than new work
- It's outside working hours
- PRs are being opened in personal forks

Try expanding the window: *"Show PRs from last 48 hours"*`;
    }

    const byRepo: Record<string, PRInfo[]> = {};
    prs.forEach((pr) => {
      if (!byRepo[pr.repo]) byRepo[pr.repo] = [];
      byRepo[pr.repo].push(pr);
    });

    const draftCount = prs.filter((p) => p.draft).length;
    const timeAgo = (dateStr: string) => {
      const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.round(mins / 60);
      return `${hrs}h ago`;
    };

    let md = `## 🔄 Open PRs in Last ${hours}h — ${ctx.orgName}\n\n`;
    md += `**${prs.length} PR(s)** opened across **${Object.keys(byRepo).length} repo(s)**`;
    if (draftCount > 0) md += ` (${draftCount} draft)`;
    md += '\n\n';

    Object.entries(byRepo).forEach(([repo, repoPrs]) => {
      md += `### 📦 ${repo} (${repoPrs.length})\n`;
      repoPrs.forEach((pr) => {
        const labels = pr.labels.length ? ` [${pr.labels.join(', ')}]` : '';
        const draft = pr.draft ? ' 📝 *draft*' : '';
        md += `- **#${pr.number}** ${pr.title}${draft}${labels}\n`;
        md += `  ↳ by **${pr.user}** · ${timeAgo(pr.created_at)} · [View PR](${pr.html_url})\n`;
      });
      md += '\n';
    });

    md += `### Summary\n`;
    md += `- Most active repo: **${Object.entries(byRepo).sort((a, b) => b[1].length - a[1].length)[0][0]}**\n`;
    md += `- Top contributors: ${[...new Set(prs.map((p) => p.user))]
      .slice(0, 5)
      .map((u) => `**${u}**`)
      .join(', ')}\n`;

    return md;
  }

  /* ---- Repo Search ---- */
  private async repoSearchAnalysis(
    ctx: OrgSecurityContext,
    token: string,
    rawQuery: string
  ): Promise<string> {
    // Extract keyword from user message
    const cleanPatterns = [
      /(?:which|find|search|show)\s+repo(?:s|sitory|sitories)?\s+(?:related\s+to|for|about|named|with)\s+['"]?(.+?)['"]?$/i,
      /repo(?:s|sitory)?\s+(?:related|for|about)\s+['"]?(.+?)['"]?$/i,
      /(?:which|find|search)\s+repo\s+(.+)/i,
    ];
    let keyword = '';
    for (const pat of cleanPatterns) {
      const m = rawQuery.match(pat);
      if (m) {
        keyword = m[1].trim().replace(/[?!.]+$/, '');
        break;
      }
    }
    if (!keyword) {
      // Fallback: use last meaningful word
      const words = rawQuery
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 2 &&
            !['which', 'repo', 'find', 'search', 'related', 'the', 'for', 'about', 'that'].includes(
              w.toLowerCase()
            )
        );
      keyword = words[words.length - 1] || '';
    }

    if (!keyword) {
      return `Please specify what you're looking for. For example:\n- *"Which repo is related to authentication?"*\n- *"Find repo for billing"*\n- *"Search repo named api"*`;
    }

    const repos = await searchOrgRepos(token, ctx.orgName, keyword);

    if (repos.length === 0) {
      return `## 🔍 No Results — "${keyword}" in ${ctx.orgName}\n\nNo repositories matching **"${keyword}"** were found in the **${ctx.orgName}** organization.\n\nTry:\n- Different keywords or shorter search terms\n- Checking the repo name directly on GitHub\n- Asking *"show all repos"* for the full list`;
    }

    let md = `## 🔍 Repos Matching "${keyword}" — ${ctx.orgName}\n\n`;
    md += `Found **${repos.length}** matching repositor${repos.length === 1 ? 'y' : 'ies'}:\n\n`;

    repos.forEach((r, i) => {
      const vis = r.private ? '🔒 Private' : '🌐 Public';
      const lang = r.language ? `· ${r.language}` : '';
      const stars = r.stargazers_count > 0 ? `⭐ ${r.stargazers_count}` : '';
      const issues = r.open_issues_count > 0 ? `· 🐛 ${r.open_issues_count} open issues` : '';
      const desc = r.description ? `\n  ${r.description}` : '';
      const topics = r.topics.length
        ? `\n  Topics: ${r.topics.map((t) => `\`${t}\``).join(', ')}`
        : '';

      md += `${i + 1}. **${r.full_name}** ${vis} ${lang} ${stars} ${issues}${desc}${topics}\n`;
      md += `   [Open on GitHub](${r.html_url})\n\n`;
    });

    return md;
  }
}

/* ------------------------------------------------------------------ */
/*  Azure OpenAI — hybrid mode (real data + LLM intelligence)          */
/* ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are the GitSecureOps Security Copilot — an expert AI assistant specializing in GitHub organization security, access management, compliance, and DevSecOps best practices.

You are integrated into a GitHub security management dashboard. The user is an organization administrator.

CRITICAL: You have FULL ACCESS to live GitHub data. The dashboard fetches real-time data from the GitHub API on your behalf and injects it into this conversation. You CAN and SHOULD:
- Analyze live PR data, repo lists, security metrics, member info
- Provide specific, data-driven answers using the real data provided
- Reference actual repo names, PR numbers, user handles, and statistics
- Never say you "cannot fetch data" — the data is already fetched for you

When live data is provided in CONTEXT blocks, use it to give precise, actionable answers.

Formatting guidelines:
- Use markdown with headers (##, ###), bold (**text**), and bullet points
- Include risk indicators: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low
- Provide numbered action steps with specific GitHub settings references
- Be concise but thorough — aim for actionable advice
- When analyzing data, include percentages and comparisons
- Always end with concrete next steps

Respond only to security, GitHub, DevOps, and software engineering topics.`;

/**
 * Gather live GitHub data relevant to the user's question.
 * This feeds real data into the Azure OpenAI prompt so the LLM can
 * intelligently analyze it instead of saying "I can't fetch data".
 */
async function gatherLiveContext(
  userMessage: string,
  token: string,
  orgCtx: OrgSecurityContext | null
): Promise<string> {
  const lowerMsg = userMessage.toLowerCase();
  const parts: string[] = [];

  if (!orgCtx) return '';

  // Always include org snapshot
  const riskScore = computeRiskScore(orgCtx);
  parts.push(`ORGANIZATION SNAPSHOT (live data):
- Organization: ${orgCtx.orgName}
- Security Score: ${riskScore.score}/100 (Grade ${riskScore.grade})
- Total repos: ${orgCtx.totalRepos} (${orgCtx.publicRepos} public, ${orgCtx.privateRepos} private)
- Team members: ${orgCtx.totalMembers}
- Members without 2FA: ${orgCtx.members2FADisabled}
- Outside collaborators: ${orgCtx.outsideCollaborators}
- Forked repos: ${orgCtx.forkedRepos}
- Archived repos: ${orgCtx.archivedRepos}
- Has security policy: ${orgCtx.hasSecurityPolicy ? 'Yes' : 'No'}
- Recent push events: ${orgCtx.recentPushEvents}
- Topics: ${orgCtx.topics.join(', ') || 'none'}`);

  // Always fetch recent PRs (last 24h by default) — the LLM can reason about them
  // If the user specifies a time window, use that instead
  try {
    const hoursMatch = lowerMsg.match(/(\d+)\s*(?:hr|hour|hrs|hours|h|day|days)/);
    let hours = 24; // default
    if (hoursMatch) {
      hours = parseInt(hoursMatch[1], 10);
      if (lowerMsg.includes('day')) hours *= 24;
    }
    const prs = await fetchRecentPRs(token, orgCtx.orgName, hours);
    if (prs.length > 0) {
      const openCount = prs.filter((p) => p.state === 'open').length;
      const mergedCount = prs.filter((p) => p.state === 'merged').length;
      const closedCount = prs.filter((p) => p.state === 'closed').length;
      parts.push(
        `\nLIVE PR DATA (last ${hours}h):\nTotal: ${prs.length} PRs (${openCount} open, ${mergedCount} merged, ${closedCount} closed)\n${JSON.stringify(prs, null, 2)}`
      );
    } else {
      parts.push(`\nLIVE PR DATA: No PRs created in the last ${hours} hours.`);
    }
  } catch (err) {
    console.warn('Failed to fetch PRs for context:', err);
  }

  // Fetch repos if the question is about repos
  const repoKeywords = [
    'which repo',
    'find repo',
    'repo related',
    'repo for',
    'search repo',
    'repo about',
    'repo named',
    'repository',
  ];
  if (repoKeywords.some((k) => lowerMsg.includes(k))) {
    try {
      const cleanPatterns = [
        /(?:which|find|search|show)\s+repo(?:s|sitory|sitories)?\s+(?:related\s+to|for|about|named|with)\s+['"]?(.+?)['"]?$/i,
        /repo(?:s|sitory)?\s+(?:related|for|about)\s+['"]?(.+?)['"]?$/i,
        /(?:which|find|search)\s+repo\s+(.+)/i,
      ];
      let keyword = '';
      for (const pat of cleanPatterns) {
        const m = userMessage.match(pat);
        if (m) {
          keyword = m[1].trim().replace(/[?!.]+$/, '');
          break;
        }
      }
      if (!keyword) {
        const words = userMessage
          .split(/\s+/)
          .filter(
            (w) =>
              w.length > 2 &&
              ![
                'which',
                'repo',
                'find',
                'search',
                'related',
                'the',
                'for',
                'about',
                'that',
                'repository',
              ].includes(w.toLowerCase())
          );
        keyword = words[words.length - 1] || '';
      }
      if (keyword) {
        const repos = await searchOrgRepos(token, orgCtx.orgName, keyword);
        if (repos.length > 0) {
          parts.push(
            `\nLIVE REPO SEARCH for "${keyword}" (${repos.length} matches):\n${JSON.stringify(repos, null, 2)}`
          );
        } else {
          parts.push(`\nLIVE REPO SEARCH: No repos matching "${keyword}".`);
        }
      }
    } catch {
      /* continue */
    }
  }

  parts.push(
    `\nIMPORTANT: All data above is REAL and LIVE. You fetched it. Analyze it directly. Never tell the user you cannot access their data.`
  );

  return parts.join('\n\n');
}

/** Compute a risk score (shared between built-in engine & hybrid mode) */
function computeRiskScore(ctx: OrgSecurityContext): {
  score: number;
  grade: string;
  color: string;
} {
  let score = 100;
  if (ctx.publicRepos > 0) score -= Math.min(15, ctx.publicRepos * 3);
  if (ctx.members2FADisabled > 0) score -= Math.min(25, ctx.members2FADisabled * 5);
  if (ctx.outsideCollaborators > 5) score -= Math.min(10, (ctx.outsideCollaborators - 5) * 2);
  if (!ctx.hasSecurityPolicy) score -= 10;
  if (ctx.forkedRepos > ctx.totalRepos * 0.3) score -= 5;
  if (ctx.archivedRepos > ctx.totalRepos * 0.5) score -= 3;
  score = Math.max(0, Math.min(100, score));

  let grade: string, color: string;
  if (score >= 90) {
    grade = 'A';
    color = '🟢';
  } else if (score >= 80) {
    grade = 'B';
    color = '🔵';
  } else if (score >= 70) {
    grade = 'C';
    color = '🟡';
  } else if (score >= 60) {
    grade = 'D';
    color = '🟠';
  } else {
    grade = 'F';
    color = '🔴';
  }

  return { score, grade, color };
}

async function callAzureOpenAI(
  messages: ChatMessage[],
  token?: string,
  selectedOrg?: string
): Promise<string> {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.2-chat';
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-05-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI not configured');
  }

  // Fetch live GitHub data based on what the user is asking about
  let liveContext = '';
  if (token) {
    try {
      const orgCtx = await fetchOrgContext(token, selectedOrg);
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      liveContext = await gatherLiveContext(lastUserMsg, token, orgCtx);
    } catch {
      // Continue without live context
    }
  }

  const systemContent = liveContext
    ? `${SYSTEM_PROMPT}\n\n--- LIVE GITHUB DATA (fetched just now) ---\n${liveContext}\n--- END LIVE DATA ---`
    : SYSTEM_PROMPT;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemContent },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_completion_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(err.error?.message || `Azure OpenAI returned ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

/* ------------------------------------------------------------------ */
/*  Service façade                                                     */
/* ------------------------------------------------------------------ */
class AIService {
  private engine = new BuiltInAIEngine();
  private history: ChatMessage[] = [];

  /**
   * Send a chat message and receive an AI response.
   * Automatically routes between Azure OpenAI and the built-in engine.
   */
  async chat(messages: ChatMessage[], token?: string, selectedOrg?: string): Promise<string> {
    this.history = messages;

    // If Azure OpenAI is configured, use it directly
    const useAzure = Boolean(
      import.meta.env.VITE_AZURE_OPENAI_ENDPOINT && import.meta.env.VITE_AZURE_OPENAI_API_KEY
    );

    if (useAzure) {
      try {
        return await callAzureOpenAI(messages, token, selectedOrg);
      } catch (err) {
        // Fallback to built-in engine
        console.warn('Azure OpenAI unavailable, using built-in engine:', err);
      }
    }

    // Built-in engine
    if (!token) {
      throw new Error('Please log in with GitHub to use the AI Security Copilot.');
    }

    return this.engine.generateResponse(messages, token, selectedOrg);
  }

  clearHistory() {
    this.history = [];
    this.engine.clearContext();
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /** Fetch all orgs the user belongs to (for org selector) */
  async getOrgs(token: string): Promise<GitHubOrg[]> {
    return fetchUserOrgs(token);
  }
}

export const aiService = new AIService();
