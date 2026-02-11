import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  GitBranch,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Bot,
  Plus,
  ArrowRight,
  Zap,
  UserX,
  ShieldAlert,
  Activity,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubRepo,
  type GitHubOrg,
  type CopilotBilling,
  type ActionsBilling,
} from '../services/githubService';
import type { LucideIcon } from 'lucide-react';

/* ---- types ---- */
interface ActivityItem {
  type: string;
  title: string;
  repo: string;
  user: string;
  time: string;
  icon: LucideIcon;
}

interface AlertItem {
  id: string;
  severity: 'danger' | 'warning' | 'brand';
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  route: string;
}

interface OrgInsight {
  org: string;
  members: number;
  outsideCollaborators: number;
  twoFaDisabled: number;
  copilot: CopilotBilling | null;
  actionsBilling: ActionsBilling | null;
  teams: number;
  pendingInvitations: number;
}

/* ---- helpers ---- */
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

const getEventTitle = (event: Record<string, unknown>) => {
  const payload = event.payload as Record<string, unknown> | undefined;
  switch (event.type) {
    case 'PushEvent': {
      const c = (payload?.commits as unknown[])?.length || 1;
      return `${c} commit${c > 1 ? 's' : ''} pushed`;
    }
    case 'PullRequestEvent':
      return `PR ${payload?.action || 'updated'}`;
    case 'IssuesEvent':
      return `Issue ${payload?.action || 'updated'}`;
    case 'CreateEvent':
      return `Created ${payload?.ref_type || 'repo'}`;
    case 'WatchEvent':
      return 'Starred repo';
    case 'ForkEvent':
      return 'Forked repo';
    default:
      return 'Activity';
  }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'PushEvent':
      return GitBranch;
    case 'PullRequestEvent':
      return CheckCircle;
    case 'IssuesEvent':
      return AlertTriangle;
    case 'CreateEvent':
      return Plus;
    case 'WatchEvent':
      return Eye;
    default:
      return Shield;
  }
};

const getTimeAgo = (dateString: string) => {
  const ms = Date.now() - new Date(dateString).getTime();
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${Math.max(1, Math.floor(ms / 60000))}m ago`;
};

/* ---- Mini bar chart ---- */
function MiniBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const w = max === 0 ? 0 : Math.max(2, pct(value, max));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-dark-text-muted">{label}</span>
        <span className="text-dark-text font-medium tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-dark-hover overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

/* ---- Security Score Ring ---- */
function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80 ? 'stroke-success-400' : score >= 50 ? 'stroke-warning-400' : 'stroke-danger-400';
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" strokeWidth={6} className="stroke-dark-hover" />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          strokeWidth={6}
          className={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute mt-5 flex flex-col items-center">
        <span className="text-2xl font-bold text-dark-text tabular-nums">{score}</span>
        <span className="text-2xs text-dark-text-muted uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

/* ================================================================ */
export default function DashboardPage() {
  const { user, token } = useAuth();
  const { success, error: showError, warning } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core data
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Aggregate stats
  const [stats, setStats] = useState({
    totalRepos: 0,
    publicRepos: 0,
    privateRepos: 0,
    totalOrgs: 0,
  });
  const [orgInsights, setOrgInsights] = useState<OrgInsight[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  /* ---- data loading ---- */
  const loadOrgInsight = useCallback(async (org: GitHubOrg): Promise<OrgInsight> => {
    const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };
    const [members, outsideCollabs, twoFaDisabled, copilot, actionsBilling, teams, invitations] =
      await Promise.all([
        safe(() => githubService.getOrgMembers(org.login), []),
        safe(() => githubService.getOutsideCollaborators(org.login), []),
        safe(() => githubService.getOrgMembers2FADisabled(org.login), []),
        safe(() => githubService.getCopilotBilling(org.login), null),
        safe(() => githubService.getActionsBilling(org.login), null),
        safe(() => githubService.getOrgTeams(org.login), []),
        safe(() => githubService.getOrgInvitations(org.login), []),
      ]);
    return {
      org: org.login,
      members: members.length,
      outsideCollaborators: outsideCollabs.length,
      twoFaDisabled: twoFaDisabled.length,
      copilot,
      actionsBilling,
      teams: teams.length,
      pendingInvitations: invitations.length,
    };
  }, []);

  const loadRecentActivity = useCallback(async () => {
    try {
      const events = await githubService.getUserEvents();
      if (events.length > 0) {
        setRecentActivity(
          events.slice(0, 8).map((event: Record<string, unknown>) => {
            const repo = event.repo as Record<string, unknown> | undefined;
            const actor = event.actor as Record<string, unknown> | undefined;
            return {
              type:
                event.type === 'PushEvent'
                  ? 'commit'
                  : event.type === 'PullRequestEvent'
                    ? 'pr'
                    : 'activity',
              title: getEventTitle(event),
              repo: (repo?.name as string) || 'Unknown',
              user: (actor?.login as string) || 'Unknown',
              time: getTimeAgo(event.created_at as string),
              icon: getEventIcon(event.type as string),
            };
          })
        );
      } else {
        setRecentActivity([
          {
            type: 'activity',
            title: 'Welcome to GitSecureOps',
            repo: 'Getting Started',
            user: user?.login || 'User',
            time: 'Just now',
            icon: Shield,
          },
        ]);
      }
    } catch {
      setRecentActivity([
        {
          type: 'activity',
          title: 'Welcome to GitSecureOps',
          repo: 'Getting Started',
          user: user?.login || 'User',
          time: 'Just now',
          icon: Shield,
        },
      ]);
    }
  }, [user]);

  const buildAlerts = useCallback((insights: OrgInsight[], publicRepos: number) => {
    const items: AlertItem[] = [];
    for (const ins of insights) {
      // Idle Copilot seats
      const idle = ins.copilot?.seat_breakdown?.inactive_this_cycle ?? 0;
      if (idle > 0)
        items.push({
          id: `copilot-idle-${ins.org}`,
          severity: 'warning',
          icon: Bot,
          title: `${idle} idle Copilot seat${idle > 1 ? 's' : ''}`,
          description: `in ${ins.org} — not used this billing cycle`,
          action: 'Manage',
          route: '/copilot',
        });
      // 2FA disabled
      if (ins.twoFaDisabled > 0)
        items.push({
          id: `2fa-${ins.org}`,
          severity: 'danger',
          icon: ShieldAlert,
          title: `${ins.twoFaDisabled} member${ins.twoFaDisabled > 1 ? 's' : ''} without 2FA`,
          description: `in ${ins.org}`,
          action: 'Enforce',
          route: '/security',
        });
      // Outside collaborators
      if (ins.outsideCollaborators > 3)
        items.push({
          id: `collab-${ins.org}`,
          severity: 'warning',
          icon: UserX,
          title: `${ins.outsideCollaborators} outside collaborators`,
          description: `in ${ins.org} — review access`,
          action: 'Review',
          route: '/access',
        });
      // Pending invitations
      if (ins.pendingInvitations > 0)
        items.push({
          id: `inv-${ins.org}`,
          severity: 'brand',
          icon: Users,
          title: `${ins.pendingInvitations} pending invitation${ins.pendingInvitations > 1 ? 's' : ''}`,
          description: `in ${ins.org}`,
          action: 'View',
          route: '/team-members',
        });
    }
    // Public repo exposure
    if (publicRepos > 5)
      items.push({
        id: 'public-repos',
        severity: 'warning',
        icon: Eye,
        title: `${publicRepos} public repositories`,
        description: 'Ensure no sensitive code is exposed',
        action: 'Audit',
        route: '/repositories',
      });
    return items.slice(0, 6);
  }, []);

  const computeSecurityScore = useCallback(
    (insights: OrgInsight[], publicRepos: number, totalRepos: number) => {
      if (insights.length === 0) return 75; // Default for personal accounts
      let score = 100;
      for (const ins of insights) {
        const memberCount = Math.max(ins.members, 1);
        // 2FA compliance (up to -30)
        const twofaPct = pct(ins.twoFaDisabled, memberCount);
        score -= Math.min(30, twofaPct);
        // Outside collaborators risk (up to -15)
        if (ins.outsideCollaborators > 5) score -= Math.min(15, ins.outsideCollaborators - 5);
        // Idle Copilot waste (up to -10)
        const idle = ins.copilot?.seat_breakdown?.inactive_this_cycle ?? 0;
        const total = ins.copilot?.seat_breakdown?.total ?? 0;
        if (total > 0) score -= Math.min(10, pct(idle, total) / 5);
      }
      // Public repo exposure (up to -15)
      if (totalRepos > 0) {
        const publicPct = pct(publicRepos, totalRepos);
        if (publicPct > 50) score -= Math.min(15, Math.floor((publicPct - 50) / 5));
      }
      return Math.max(0, Math.min(100, Math.round(score)));
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      githubService.setToken(token);
      const [userRepos, userOrgs] = await Promise.all([
        githubService.getUserRepositories(),
        githubService.getUserOrganizations(),
      ]);
      const pubCount = userRepos.filter((r) => !r.private).length;
      const privCount = userRepos.filter((r) => r.private).length;
      setStats({
        totalRepos: userRepos.length,
        publicRepos: pubCount,
        privateRepos: privCount,
        totalOrgs: userOrgs.length,
      });
      setRepositories(userRepos.slice(0, 6));
      setOrgs(userOrgs);

      // Load org insights in parallel
      const insights = await Promise.all(userOrgs.map(loadOrgInsight));
      setOrgInsights(insights);

      // Build alerts from real data
      setAlerts(buildAlerts(insights, pubCount));
      setSecurityScore(computeSecurityScore(insights, pubCount, userRepos.length));

      await loadRecentActivity();
    } catch {
      showError('Failed to load dashboard', 'Please check your token permissions.');
    }
  }, [token, loadOrgInsight, loadRecentActivity, buildAlerts, computeSecurityScore, showError]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      await loadData();
      if (!cancelled) setIsLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    success('Dashboard refreshed', 'All data is up to date');
  };

  const exportRepositories = () => {
    if (repositories.length === 0) {
      warning('No repos', 'Fetch repos first.');
      return;
    }
    try {
      const headers = ['Name', 'Private', 'Language', 'Stars', 'URL'];
      const csv = [
        headers.join(','),
        ...repositories.map((r) =>
          [r.name, r.private, r.language || '', r.stargazers_count || 0, r.html_url].join(',')
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `repos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Exported', `${repositories.length} repos exported`);
    } catch {
      showError('Export failed', 'Could not export repos');
    }
  };

  /* ---- Aggregated totals across all orgs ---- */
  const totalMembers = orgInsights.reduce((s, i) => s + i.members, 0);
  const totalOutsideCollabs = orgInsights.reduce((s, i) => s + i.outsideCollaborators, 0);
  const total2FADisabled = orgInsights.reduce((s, i) => s + i.twoFaDisabled, 0);
  const totalTeams = orgInsights.reduce((s, i) => s + i.teams, 0);
  const copilotTotal = orgInsights.reduce((s, i) => s + (i.copilot?.seat_breakdown?.total ?? 0), 0);
  const copilotActive = orgInsights.reduce(
    (s, i) => s + (i.copilot?.seat_breakdown?.active_this_cycle ?? 0),
    0
  );
  const copilotIdle = orgInsights.reduce(
    (s, i) => s + (i.copilot?.seat_breakdown?.inactive_this_cycle ?? 0),
    0
  );
  const actionsMinutes = orgInsights.reduce(
    (s, i) => s + (i.actionsBilling?.total_minutes_used ?? 0),
    0
  );
  const actionsIncluded = orgInsights.reduce(
    (s, i) => s + (i.actionsBilling?.included_minutes ?? 0),
    0
  );
  const actionsUbuntu = orgInsights.reduce(
    (s, i) => s + (i.actionsBilling?.minutes_used_breakdown?.UBUNTU ?? 0),
    0
  );
  const actionsMacos = orgInsights.reduce(
    (s, i) => s + (i.actionsBilling?.minutes_used_breakdown?.MACOS ?? 0),
    0
  );
  const actionsWindows = orgInsights.reduce(
    (s, i) => s + (i.actionsBilling?.minutes_used_breakdown?.WINDOWS ?? 0),
    0
  );
  const hasCopilot = copilotTotal > 0;
  const hasActions = actionsMinutes > 0 || actionsIncluded > 0;
  const hasOrgData = orgs.length > 0;

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-text">
            Welcome back, {user?.name || user?.login}
          </h2>
          <p className="text-sm text-dark-text-muted">
            Here&apos;s your security &amp; operations overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportRepositories}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </motion.div>

      {/* ── Top Stats ── */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Repos"
          value={isLoading ? '—' : stats.totalRepos}
          icon={GitBranch}
          change={`${stats.publicRepos} public · ${stats.privateRepos} private`}
          trend="neutral"
        />
        <StatCard
          label="Organizations"
          value={isLoading ? '—' : stats.totalOrgs}
          icon={Users}
          change={totalMembers > 0 ? `${totalMembers} members` : 'Personal account'}
          trend={stats.totalOrgs > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Security Score"
          value={isLoading ? '—' : `${securityScore}/100`}
          icon={Shield}
          change={
            securityScore >= 80
              ? 'Good standing'
              : securityScore >= 50
                ? 'Needs attention'
                : 'Critical'
          }
          trend={securityScore >= 80 ? 'up' : securityScore >= 50 ? 'neutral' : 'down'}
        />
        <StatCard
          label="Copilot Seats"
          value={isLoading ? '—' : copilotTotal || 'N/A'}
          icon={Bot}
          change={hasCopilot ? `${copilotActive} active · ${copilotIdle} idle` : 'Not configured'}
          trend={hasCopilot ? (copilotIdle > 0 ? 'down' : 'up') : 'neutral'}
        />
      </motion.div>

      {/* ── Row 2: Security Posture + Copilot + Actions ── */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-3 gap-4">
        {/* Security Posture */}
        <Card className="relative overflow-visible">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-text">Security Posture</h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/security')}
              icon={<ArrowRight className="w-3 h-3" />}
            >
              Details
            </Button>
          </div>
          {!hasOrgData ? (
            <p className="text-xs text-dark-text-muted py-4">
              Connect an organization to view security insights.
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center">
                <ScoreRing score={isLoading ? 0 : securityScore} label="Score" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-text-muted">2FA Compliance</span>
                  <Badge variant={total2FADisabled === 0 ? 'success' : 'danger'} dot>
                    {totalMembers > 0
                      ? `${pct(totalMembers - total2FADisabled, totalMembers)}%`
                      : '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-text-muted">Outside Collaborators</span>
                  <Badge variant={totalOutsideCollabs > 5 ? 'warning' : 'success'}>
                    {totalOutsideCollabs}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-text-muted">Teams</span>
                  <span className="text-dark-text font-medium tabular-nums">{totalTeams}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-text-muted">Private Ratio</span>
                  <span className="text-dark-text font-medium tabular-nums">
                    {pct(stats.privateRepos, stats.totalRepos)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Copilot Utilization */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-text">Copilot Utilization</h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/copilot')}
              icon={<ArrowRight className="w-3 h-3" />}
            >
              Manage
            </Button>
          </div>
          {!hasCopilot ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Bot className="w-8 h-8 text-dark-text-muted mb-2" />
              <p className="text-xs text-dark-text-muted">
                No Copilot licenses found.
                <br />
                Set up Copilot for your org.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-dark-text tabular-nums">
                  {pct(copilotActive, copilotTotal)}%
                </span>
                <span className="text-xs text-dark-text-muted">utilization</span>
              </div>
              <MiniBar
                label="Active"
                value={copilotActive}
                max={copilotTotal}
                color="bg-success-400"
              />
              <MiniBar label="Idle" value={copilotIdle} max={copilotTotal} color="bg-warning-400" />
              <MiniBar
                label="Pending"
                value={copilotTotal - copilotActive - copilotIdle}
                max={copilotTotal}
                color="bg-dark-text-muted"
              />
              {copilotIdle > 0 && (
                <p className="text-2xs text-warning-400 mt-1">
                  ~${(copilotIdle * 19).toLocaleString()}/mo wasted on idle seats
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Actions Usage */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-text">Actions Usage</h3>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/actions-cost')}
              icon={<ArrowRight className="w-3 h-3" />}
            >
              Details
            </Button>
          </div>
          {!hasActions ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Zap className="w-8 h-8 text-dark-text-muted mb-2" />
              <p className="text-xs text-dark-text-muted">No Actions usage data available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-dark-text tabular-nums">
                  {actionsMinutes.toLocaleString()}
                </span>
                <span className="text-xs text-dark-text-muted">
                  / {actionsIncluded.toLocaleString()} min
                </span>
              </div>
              <div className="h-2 rounded-full bg-dark-hover overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pct(actionsMinutes, actionsIncluded) > 80 ? 'bg-danger-400' : 'bg-brand-400'}`}
                  style={{ width: `${Math.min(100, pct(actionsMinutes, actionsIncluded))}%` }}
                />
              </div>
              <p className="text-2xs text-dark-text-muted">
                {pct(actionsMinutes, actionsIncluded)}% of included minutes used
              </p>
              <div className="pt-2 space-y-2">
                <MiniBar
                  label="Linux"
                  value={actionsUbuntu}
                  max={actionsMinutes}
                  color="bg-brand-400"
                />
                <MiniBar
                  label="macOS"
                  value={actionsMacos}
                  max={actionsMinutes}
                  color="bg-purple-400"
                />
                <MiniBar
                  label="Windows"
                  value={actionsWindows}
                  max={actionsMinutes}
                  color="bg-blue-400"
                />
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Row 3: Smart Alerts + Recent Activity ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Smart Alerts */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-dark-text-muted" />
            <h3 className="text-sm font-semibold text-dark-text">Action Items</h3>
            {alerts.length > 0 && (
              <Badge variant="danger" className="ml-1">
                {alerts.length}
              </Badge>
            )}
          </div>
          {isLoading ? (
            <Card>
              <p className="text-xs text-dark-text-muted py-4">Scanning your organizations...</p>
            </Card>
          ) : alerts.length === 0 ? (
            <Card className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success-500/10 flex items-center justify-center text-success-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-dark-text">All clear</p>
                <p className="text-xs text-dark-text-muted">
                  No action items detected. Your environment looks healthy.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                const bgMap = {
                  danger: 'bg-danger-500/10 text-danger-400',
                  warning: 'bg-warning-500/10 text-warning-400',
                  brand: 'bg-brand-500/10 text-brand-400',
                };
                return (
                  <Card
                    key={alert.id}
                    variant="interactive"
                    className="flex items-center gap-3 group"
                    onClick={() => navigate(alert.route)}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bgMap[alert.severity]}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-text">{alert.title}</p>
                      <p className="text-xs text-dark-text-muted">{alert.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      className="opacity-70 group-hover:opacity-100 shrink-0"
                      icon={<ArrowRight className="w-3 h-3" />}
                    >
                      {alert.action}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-text">Recent Activity</h3>
          <Card className="divide-y divide-dark-border" noPadding>
            {recentActivity.length === 0 && !isLoading && (
              <div className="p-8 text-center text-sm text-dark-text-muted">No recent activity</div>
            )}
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 hover:bg-dark-hover/50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    activity.type === 'commit'
                      ? 'bg-success-500/10 text-success-400'
                      : activity.type === 'pr'
                        ? 'bg-brand-500/10 text-brand-400'
                        : 'bg-warning-500/10 text-warning-400'
                  }`}
                >
                  <activity.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-text truncate">{activity.title}</p>
                  <p className="text-xs text-dark-text-muted truncate">{activity.repo}</p>
                </div>
                <span className="text-2xs text-dark-text-muted whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
            <div className="px-4 py-3">
              <Button
                variant="ghost"
                size="xs"
                className="w-full"
                onClick={() => navigate('/audit')}
              >
                View all activity
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 4: Org Overview (multi-org) ── */}
      {orgInsights.length > 1 && (
        <motion.div variants={fadeUp} className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-text">Organization Overview</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orgInsights.map((ins) => (
              <Card key={ins.org} variant="interactive" onClick={() => navigate('/team-members')}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-dark-hover flex items-center justify-center text-brand-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-dark-text">{ins.org}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-dark-text-muted">Members</span>
                      <p className="text-dark-text font-medium tabular-nums">{ins.members}</p>
                    </div>
                    <div>
                      <span className="text-dark-text-muted">Teams</span>
                      <p className="text-dark-text font-medium tabular-nums">{ins.teams}</p>
                    </div>
                    <div>
                      <span className="text-dark-text-muted">Outside</span>
                      <p className="text-dark-text font-medium tabular-nums">
                        {ins.outsideCollaborators}
                      </p>
                    </div>
                    <div>
                      <span className="text-dark-text-muted">2FA Off</span>
                      <p
                        className={`font-medium tabular-nums ${ins.twoFaDisabled > 0 ? 'text-danger-400' : 'text-success-400'}`}
                      >
                        {ins.twoFaDisabled}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Row 5: Recent Repos ── */}
      {repositories.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-text">Recent Repositories</h3>
            <Button variant="ghost" size="xs" onClick={() => navigate('/repositories')}>
              View all
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {repositories.map((repo) => (
              <Card
                key={repo.id}
                variant="interactive"
                onClick={() => window.open(repo.html_url, '_blank')}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-dark-text truncate">{repo.name}</p>
                    <Badge variant={repo.private ? 'danger' : 'success'} className="shrink-0">
                      {repo.private ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                  <p className="text-xs text-dark-text-muted line-clamp-2">
                    {repo.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-dark-text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-brand-400" />
                        {repo.language}
                      </span>
                    )}
                    <span>★ {repo.stargazers_count || 0}</span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" /> {repo.forks_count || 0}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
