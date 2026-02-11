import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  GitBranch,
  Lock,
  UserPlus,
  Download,
  Eye,
  Bookmark,
  Code2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Bot,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, { type GitHubRepo } from '../services/githubService';
import type { LucideIcon } from 'lucide-react';

interface ActivityItem {
  type: string;
  title: string;
  repo: string;
  user: string;
  time: string;
  icon: LucideIcon;
}

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { title: 'Copilot Management', description: 'Control Copilot access', icon: Bot, route: '/copilot', color: 'text-brand-400' },
  { title: 'Access Control', description: 'Manage user permissions', icon: UserPlus, route: '/access', color: 'text-success-400' },
  { title: 'Repositories', description: 'Browse your repos', icon: GitBranch, route: '/repositories', color: 'text-blue-400' },
  { title: '2FA Enforcement', description: 'Security compliance', icon: Lock, route: '/security', color: 'text-warning-400' },
  { title: 'Audit Logs', description: 'Track events', icon: Shield, route: '/audit', color: 'text-purple-400' },
  { title: 'Code Search', description: 'Search across repos', icon: Code2, route: '/search', color: 'text-cyan-400' },
  { title: 'Recommendations', description: 'Security insights', icon: TrendingUp, route: '/recommendations', color: 'text-emerald-400' },
  { title: 'Analytics', description: 'Performance metrics', icon: Bookmark, route: '/analytics', color: 'text-pink-400' },
];

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { success, error: showError, warning } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    totalRepos: 0,
    publicRepos: 0,
    privateRepos: 0,
    totalOrgs: 0,
  });
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);

  // Load GitHub data
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        setIsLoading(true);
        githubService.setToken(token);
        const [userRepos, userOrgs] = await Promise.all([
          githubService.getUserRepositories(),
          githubService.getUserOrganizations(),
        ]);
        setStats({
          totalRepos: userRepos.length,
          publicRepos: userRepos.filter((r) => !r.private).length,
          privateRepos: userRepos.filter((r) => r.private).length,
          totalOrgs: userOrgs.length,
        });
        setRepositories(userRepos.slice(0, 5));
        await loadRecentActivity();
      } catch {
        showError('Failed to load GitHub data', 'Please check your token permissions.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadRecentActivity = async () => {
    try {
      const events = await githubService.getUserEvents();
      if (events.length > 0) {
        setRecentActivity(
          events.slice(0, 8).map((event: Record<string, unknown>) => {
            const repo = event.repo as Record<string, unknown> | undefined;
            const actor = event.actor as Record<string, unknown> | undefined;
            return {
              type: event.type === 'PushEvent' ? 'commit' : event.type === 'PullRequestEvent' ? 'pr' : 'activity',
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
          { type: 'activity', title: 'Welcome to GitSecureOps', repo: 'Getting Started', user: user?.login || 'User', time: 'Just now', icon: Shield },
        ]);
      }
    } catch {
      setRecentActivity([
        { type: 'activity', title: 'Welcome to GitSecureOps', repo: 'Getting Started', user: user?.login || 'User', time: 'Just now', icon: Shield },
      ]);
    }
  };

  const getEventTitle = (event: Record<string, unknown>) => {
    const payload = event.payload as Record<string, unknown> | undefined;
    switch (event.type) {
      case 'PushEvent': { const c = (payload?.commits as unknown[])?.length || 1; return `${c} commit${c > 1 ? 's' : ''} pushed`; }
      case 'PullRequestEvent': return `PR ${payload?.action || 'updated'}`;
      case 'IssuesEvent': return `Issue ${payload?.action || 'updated'}`;
      case 'CreateEvent': return `Created ${payload?.ref_type || 'repo'}`;
      case 'WatchEvent': return 'Starred repo';
      case 'ForkEvent': return 'Forked repo';
      default: return 'Activity';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PushEvent': return GitBranch;
      case 'PullRequestEvent': return CheckCircle;
      case 'IssuesEvent': return AlertTriangle;
      case 'CreateEvent': return Plus;
      case 'WatchEvent': return Eye;
      default: return Shield;
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

  const exportRepositories = () => {
    if (repositories.length === 0) { warning('No repos', 'Fetch repos first.'); return; }
    try {
      const headers = ['Name', 'Private', 'Language', 'Stars', 'URL'];
      const csv = [headers.join(','), ...repositories.map((r) => [r.name, r.private, r.language || '', r.stargazers_count || 0, r.html_url].join(','))].join('\n');
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

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-text">
            Welcome back, {user?.name || user?.login}
          </h2>
          <p className="text-sm text-dark-text-muted">Here&apos;s your security overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportRepositories} icon={<Download className="w-3.5 h-3.5" />}>
          Export Repos
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Repos"
          value={isLoading ? '—' : stats.totalRepos}
          icon={GitBranch}
          change={`${stats.publicRepos} public`}
          trend="neutral"
        />
        <StatCard
          label="Private Repos"
          value={isLoading ? '—' : stats.privateRepos}
          icon={Lock}
          change={`${Math.round((stats.privateRepos / Math.max(stats.totalRepos, 1)) * 100)}% of total`}
          trend="up"
        />
        <StatCard
          label="Organizations"
          value={isLoading ? '—' : stats.totalOrgs}
          icon={Users}
          change={stats.totalOrgs > 0 ? 'Connected' : 'None'}
          trend={stats.totalOrgs > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Account"
          value={user ? 'Active' : 'Inactive'}
          icon={CheckCircle}
          change={user ? `@${user.login}` : '—'}
          trend={user ? 'up' : 'neutral'}
        />
      </motion.div>

      {/* Quick Actions + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-dark-text">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                variant="interactive"
                className="flex items-start gap-3 group"
                onClick={() => navigate(action.route)}
              >
                <div className={`w-9 h-9 rounded-lg bg-dark-hover flex items-center justify-center shrink-0 ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-dark-text truncate">{action.title}</p>
                    <ArrowUpRight className="w-3 h-3 text-dark-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-dark-text-muted mt-0.5">{action.description}</p>
                </div>
              </Card>
            ))}
          </div>
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
                <span className="text-2xs text-dark-text-muted whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
            <div className="px-4 py-3">
              <Button variant="ghost" size="xs" className="w-full" onClick={() => navigate('/audit')}>
                View all activity
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Repos */}
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
              <Card key={repo.id} variant="interactive" onClick={() => window.open(repo.html_url, '_blank')}>
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
