import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  GitPullRequest,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Timer,
  CheckCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import githubService, { type PullRequest } from '@/services/githubService';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface PRMetrics {
  pr: PullRequest;
  repo: string;
  timeToFirstReview: number | null; // hours
  cycleTime: number | null; // hours (created_at → merged/closed)
  reviewCount: number;
  commentCount: number;
}

interface ReviewerStats {
  login: string;
  avatar_url: string;
  reviewsGiven: number;
  avgResponseTime: number; // hours
  approvals: number;
  changesRequested: number;
}

interface VelocityData {
  prMetrics: PRMetrics[];
  reviewerStats: ReviewerStats[];
  mergeRate: number; // pct of merged vs closed
  avgCycleTime: number; // hours
  avgReviewTime: number; // hours
  prThroughput: number; // PRs merged per week
  weeklyTrend: { week: string; merged: number; opened: number }[];
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return `${start.getMonth() + 1}/${start.getDate()}`;
}

type Tab = 'overview' | 'prs' | 'reviewers';

export default function DevVelocityPage() {
  const { token } = useAuth();
  const [data, setData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [tab, setTab] = useState<Tab>('overview');
  const [orgName, setOrgName] = useState('');

  const analyze = useCallback(async () => {
    if (!token) return;
    setScanning(true);
    setLoading(true);

    try {
      const orgs = await githubService.getUserOrganizations();
      if (orgs.length === 0) {
        setLoading(false);
        setScanning(false);
        return;
      }

      const org = orgs[0].login;
      setOrgName(org);

      const repos = await githubService.getOrgRepositories(org);
      // Take top 10 most-recently-pushed repos for velocity analysis
      const activeRepos = repos
        .sort(
          (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        )
        .slice(0, 10);

      setProgress({ current: 0, total: activeRepos.length });

      const allMetrics: PRMetrics[] = [];
      const reviewerMap = new Map<string, ReviewerStats>();

      for (let i = 0; i < activeRepos.length; i++) {
        const repo = activeRepos[i];
        try {
          // Get closed PRs (completed cycle)
          const closedPRs = await githubService.getRepoPullRequests(org, repo.name, 'closed');

          // Also get open PRs for current state
          const openPRs = await githubService.getRepoPullRequests(org, repo.name, 'open');

          const recentPRs = [...closedPRs, ...openPRs]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 20);

          for (const pr of recentPRs) {
            try {
              const reviews = await githubService.getPullRequestReviews(org, repo.name, pr.number);

              const firstReview = reviews
                .filter((r) => r.state !== 'PENDING')
                .sort(
                  (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
                )[0];

              const createdAt = new Date(pr.created_at).getTime();
              const closedAt =
                pr.state === 'closed' && pr.updated_at ? new Date(pr.updated_at).getTime() : null;

              const timeToFirstReview = firstReview
                ? (new Date(firstReview.submitted_at).getTime() - createdAt) / 3600000
                : null;

              const cycleTime = closedAt ? (closedAt - createdAt) / 3600000 : null;

              allMetrics.push({
                pr,
                repo: repo.name,
                timeToFirstReview,
                cycleTime,
                reviewCount: reviews.length,
                commentCount: reviews.filter((r) => r.state === 'COMMENTED').length,
              });

              // Track reviewer stats
              for (const review of reviews) {
                if (!review.user?.login) continue;
                if (!reviewerMap.has(review.user.login)) {
                  reviewerMap.set(review.user.login, {
                    login: review.user.login,
                    avatar_url: review.user.avatar_url,
                    reviewsGiven: 0,
                    avgResponseTime: 0,
                    approvals: 0,
                    changesRequested: 0,
                  });
                }
                const stats = reviewerMap.get(review.user.login)!;
                stats.reviewsGiven++;
                if (review.state === 'APPROVED') stats.approvals++;
                if (review.state === 'CHANGES_REQUESTED') stats.changesRequested++;

                const responseTime =
                  (new Date(review.submitted_at).getTime() - createdAt) / 3600000;
                stats.avgResponseTime =
                  (stats.avgResponseTime * (stats.reviewsGiven - 1) + responseTime) /
                  stats.reviewsGiven;
              }
            } catch {
              // Skip individual PR errors
            }
          }
        } catch {
          // Skip repo errors
        }
        setProgress({ current: i + 1, total: activeRepos.length });
      }

      // Compute weekly trend
      const weekMap = new Map<string, { merged: number; opened: number }>();
      const now = new Date();
      for (let w = 7; w >= 0; w--) {
        const d = new Date(now);
        d.setDate(d.getDate() - w * 7);
        weekMap.set(getWeekLabel(d), { merged: 0, opened: 0 });
      }

      for (const m of allMetrics) {
        const weekLabel = getWeekLabel(new Date(m.pr.created_at));
        if (weekMap.has(weekLabel)) {
          weekMap.get(weekLabel)!.opened++;
          if (m.pr.state === 'closed' && m.cycleTime !== null) {
            weekMap.get(weekLabel)!.merged++;
          }
        }
      }

      const weeklyTrend = Array.from(weekMap.entries()).map(([week, v]) => ({
        week,
        ...v,
      }));

      // Compute aggregates
      const withCycle = allMetrics.filter((m) => m.cycleTime !== null);
      const withReview = allMetrics.filter((m) => m.timeToFirstReview !== null);
      const mergedCount = allMetrics.filter(
        (m) => m.pr.state === 'closed' && m.cycleTime !== null
      ).length;
      const closedCount = allMetrics.filter((m) => m.pr.state === 'closed').length;

      const avgCycleTime =
        withCycle.length > 0
          ? withCycle.reduce((s, m) => s + m.cycleTime!, 0) / withCycle.length
          : 0;
      const avgReviewTime =
        withReview.length > 0
          ? withReview.reduce((s, m) => s + m.timeToFirstReview!, 0) / withReview.length
          : 0;

      // PR throughput: merged per week (last 4 weeks)
      const last4 = weeklyTrend.slice(-4);
      const prThroughput =
        last4.length > 0 ? last4.reduce((s, w) => s + w.merged, 0) / last4.length : 0;

      setData({
        prMetrics: allMetrics,
        reviewerStats: Array.from(reviewerMap.values()).sort(
          (a, b) => b.reviewsGiven - a.reviewsGiven
        ),
        mergeRate: closedCount > 0 ? (mergedCount / closedCount) * 100 : 0,
        avgCycleTime,
        avgReviewTime,
        prThroughput,
        weeklyTrend,
      });
    } catch (err) {
      console.error('Velocity analysis failed:', err);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, [token]);

  useEffect(() => {
    analyze();
  }, [analyze]);

  const maxBarValue = data
    ? Math.max(...data.weeklyTrend.map((w) => Math.max(w.merged, w.opened)), 1)
    : 1;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
            <Rocket className="w-5 h-5 text-violet-400" />
            Developer Velocity Metrics
          </h2>
          <p className="text-sm text-dark-text-muted">
            {orgName ? `Analyzing engineering speed across ${orgName}` : 'Measuring team velocity'}
            {scanning && ` (${progress.current}/${progress.total} repos)`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={analyze}
          loading={scanning}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          {scanning ? 'Analyzing...' : 'Refresh'}
        </Button>
      </motion.div>

      {/* Stats */}
      {data && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Avg Cycle Time"
            value={formatDuration(data.avgCycleTime)}
            icon={Clock}
            trend={data.avgCycleTime <= 48 ? 'up' : data.avgCycleTime <= 96 ? 'neutral' : 'down'}
            change={
              data.avgCycleTime <= 48 ? 'Fast' : data.avgCycleTime <= 96 ? 'Moderate' : 'Slow'
            }
          />
          <StatCard
            label="Time to Review"
            value={formatDuration(data.avgReviewTime)}
            icon={Timer}
            trend={data.avgReviewTime <= 12 ? 'up' : data.avgReviewTime <= 24 ? 'neutral' : 'down'}
            change={data.avgReviewTime <= 12 ? 'Excellent' : 'Needs improvement'}
          />
          <StatCard
            label="Merge Rate"
            value={`${Math.round(data.mergeRate)}%`}
            icon={GitPullRequest}
            trend={data.mergeRate >= 80 ? 'up' : data.mergeRate >= 60 ? 'neutral' : 'down'}
            change={`${data.prMetrics.length} total PRs`}
          />
          <StatCard
            label="PRs / Week"
            value={Math.round(data.prThroughput)}
            icon={TrendingUp}
            trend="up"
            change="Last 4 weeks avg"
          />
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 border-b border-dark-border pb-0.5">
        {(
          [
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'prs', label: 'Pull Requests', icon: GitPullRequest },
            { key: 'reviewers', label: 'Reviewers', icon: Users },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === key
                ? 'text-brand-400 border-b-2 border-brand-400 -mb-[1px]'
                : 'text-dark-text-muted hover:text-dark-text'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Loading state */}
      {loading && !data ? (
        <motion.div variants={fadeUp} className="text-center py-16">
          <Rocket className="w-10 h-10 text-violet-400 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-dark-text-muted">
            Analyzing {progress.current}/{progress.total} repositories...
          </p>
          <div className="w-48 h-1.5 rounded-full bg-dark-border mx-auto mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
              className="h-full rounded-full bg-violet-500"
            />
          </div>
        </motion.div>
      ) : data ? (
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Weekly Trend Chart */}
              <Card variant="glass">
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-dark-text mb-4">Weekly PR Activity</h3>
                  <div className="flex items-end gap-2 h-40">
                    {data.weeklyTrend.map((week) => (
                      <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end h-32">
                          <div className="flex-1 relative group">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${(week.opened / maxBarValue) * 100}%`,
                              }}
                              transition={{ duration: 0.4, delay: 0.1 }}
                              className="w-full bg-blue-500/30 rounded-t-sm absolute bottom-0"
                            />
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-card border border-dark-border rounded px-1.5 py-0.5 text-2xs text-dark-text whitespace-nowrap z-10 transition-opacity">
                              Opened: {week.opened}
                            </div>
                          </div>
                          <div className="flex-1 relative group">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${(week.merged / maxBarValue) * 100}%`,
                              }}
                              transition={{ duration: 0.4, delay: 0.2 }}
                              className="w-full bg-emerald-500/40 rounded-t-sm absolute bottom-0"
                            />
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-card border border-dark-border rounded px-1.5 py-0.5 text-2xs text-dark-text whitespace-nowrap z-10 transition-opacity">
                              Merged: {week.merged}
                            </div>
                          </div>
                        </div>
                        <span className="text-2xs text-dark-text-muted">{week.week}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-blue-500/30" />
                      <span className="text-2xs text-dark-text-muted">Opened</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
                      <span className="text-2xs text-dark-text-muted">Merged</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Cycle Time Distribution */}
              <Card variant="glass">
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-dark-text mb-3">
                    Cycle Time Distribution
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '< 1 day', max: 24, color: 'bg-emerald-500' },
                      { label: '1-3 days', max: 72, color: 'bg-blue-500' },
                      { label: '3-7 days', max: 168, color: 'bg-amber-500' },
                      { label: '> 7 days', max: Infinity, color: 'bg-red-500' },
                    ].map(({ label, max, color }, idx) => {
                      const prev = idx === 0 ? 0 : [24, 72, 168][idx - 1];
                      const count = data.prMetrics.filter(
                        (m) => m.cycleTime !== null && m.cycleTime >= prev && m.cycleTime < max
                      ).length;
                      const pct =
                        data.prMetrics.length > 0
                          ? Math.round((count / data.prMetrics.length) * 100)
                          : 0;
                      return (
                        <div key={label} className="text-center">
                          <div className="h-20 flex items-end justify-center mb-1">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(pct, 2)}%` }}
                              transition={{ duration: 0.5 }}
                              className={`w-10 ${color}/30 rounded-t-md`}
                            />
                          </div>
                          <p className="text-xs font-bold text-dark-text">{pct}%</p>
                          <p className="text-2xs text-dark-text-muted">{label}</p>
                          <p className="text-2xs text-dark-text-muted">({count})</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* PRs Tab */}
          {tab === 'prs' && (
            <motion.div
              key="prs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              {data.prMetrics.slice(0, 30).map((m) => (
                <div
                  key={`${m.repo}-${m.pr.number}`}
                  className="p-3 rounded-xl bg-dark-card border border-dark-border hover:border-dark-border-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={m.pr.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={m.pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-dark-text hover:text-brand-400 truncate"
                        >
                          {m.pr.title}
                        </a>
                        <Badge
                          variant={m.pr.state === 'closed' ? 'success' : 'brand'}
                          className="shrink-0 text-2xs"
                        >
                          {m.pr.state === 'closed' ? 'Merged' : 'Open'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-2xs text-dark-text-muted">
                          {m.repo} #{m.pr.number}
                        </span>
                        <span className="text-2xs text-dark-text-muted">by {m.pr.user.login}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex gap-4 text-right">
                      <div>
                        <p className="text-2xs text-dark-text-muted">Cycle</p>
                        <p className="text-xs font-semibold text-dark-text">
                          {m.cycleTime !== null ? formatDuration(m.cycleTime) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xs text-dark-text-muted">1st Review</p>
                        <p className="text-xs font-semibold text-dark-text">
                          {m.timeToFirstReview !== null ? formatDuration(m.timeToFirstReview) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-dark-text-muted" />
                        <span className="text-xs text-dark-text">{m.reviewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.prMetrics.length === 0 && (
                <div className="text-center py-12">
                  <GitPullRequest className="w-10 h-10 text-dark-text-muted mx-auto mb-2" />
                  <p className="text-sm text-dark-text-secondary">No PR data found</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Reviewers Tab */}
          {tab === 'reviewers' && (
            <motion.div
              key="reviewers"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {data.reviewerStats.map((reviewer, idx) => (
                <Card key={reviewer.login} variant="glass">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <img src={reviewer.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                          <span className="text-2xs font-bold text-dark-text">#{idx + 1}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-text">{reviewer.login}</p>
                        <p className="text-2xs text-dark-text-muted">
                          {reviewer.reviewsGiven} reviews
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-dark-bg/50">
                        <Timer className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-dark-text">
                          {formatDuration(reviewer.avgResponseTime)}
                        </p>
                        <p className="text-2xs text-dark-text-muted">Avg Response</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-bg/50">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-dark-text">{reviewer.approvals}</p>
                        <p className="text-2xs text-dark-text-muted">Approvals</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-bg/50">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-dark-text">
                          {reviewer.changesRequested}
                        </p>
                        <p className="text-2xs text-dark-text-muted">Changes Req</p>
                      </div>
                    </div>
                    {/* Review load bar */}
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-dark-border overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              data.reviewerStats.length > 0
                                ? (reviewer.reviewsGiven / data.reviewerStats[0].reviewsGiven) * 100
                                : 0
                            }%`,
                          }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full bg-violet-500/60"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {data.reviewerStats.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Users className="w-10 h-10 text-dark-text-muted mx-auto mb-2" />
                  <p className="text-sm text-dark-text-secondary">No reviewer data</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}
    </motion.div>
  );
}
