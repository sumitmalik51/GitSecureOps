import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  GitCommit,
  GitPullRequest,
  Star,
  GitFork,
  Eye,
  MessageSquare,
  AlertCircle,
  Users,
  RefreshCw,
  Pause,
  Play,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import githubService from '@/services/githubService';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// Map GitHub event types to display info
const eventConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  PushEvent: {
    icon: GitCommit,
    label: 'Push',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  PullRequestEvent: {
    icon: GitPullRequest,
    label: 'Pull Request',
    color: 'text-brand-400',
    bgColor: 'bg-brand-500/10',
  },
  PullRequestReviewEvent: {
    icon: Eye,
    label: 'PR Review',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  PullRequestReviewCommentEvent: {
    icon: MessageSquare,
    label: 'Review Comment',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/10',
  },
  IssuesEvent: {
    icon: AlertCircle,
    label: 'Issue',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  IssueCommentEvent: {
    icon: MessageSquare,
    label: 'Comment',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/10',
  },
  WatchEvent: {
    icon: Star,
    label: 'Starred',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  ForkEvent: {
    icon: GitFork,
    label: 'Fork',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  CreateEvent: {
    icon: Zap,
    label: 'Created',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/10',
  },
  DeleteEvent: {
    icon: AlertCircle,
    label: 'Deleted',
    color: 'text-danger-400',
    bgColor: 'bg-danger-500/10',
  },
  MemberEvent: {
    icon: Users,
    label: 'Member',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  ReleaseEvent: {
    icon: Zap,
    label: 'Release',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
};

const defaultEvent = {
  icon: Activity,
  label: 'Event',
  color: 'text-dark-text-muted',
  bgColor: 'bg-dark-hover',
};

interface OrgEvent {
  id: string;
  type: string;
  actor: { login: string; avatar_url: string };
  repo: { name: string };
  payload: Record<string, unknown>;
  created_at: string;
  org?: { login: string; avatar_url: string };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getEventDescription(event: OrgEvent): string {
  const payload = event.payload;
  switch (event.type) {
    case 'PushEvent': {
      const commits = (payload.commits as Array<{ message: string }>) || [];
      return commits.length > 0
        ? commits[0].message.split('\n')[0].slice(0, 80)
        : `Pushed ${payload.size || 0} commits`;
    }
    case 'PullRequestEvent': {
      const pr = payload.pull_request as { title: string } | undefined;
      return `${payload.action} — ${pr?.title?.slice(0, 60) || 'PR'}`;
    }
    case 'IssuesEvent': {
      const issue = payload.issue as { title: string } | undefined;
      return `${payload.action} — ${issue?.title?.slice(0, 60) || 'Issue'}`;
    }
    case 'IssueCommentEvent':
    case 'PullRequestReviewCommentEvent': {
      const comment = payload.comment as { body: string } | undefined;
      return comment?.body?.slice(0, 80) || 'Comment added';
    }
    case 'PullRequestReviewEvent':
      return `Review ${(payload.review as { state: string })?.state || 'submitted'}`;
    case 'CreateEvent':
      return `Created ${payload.ref_type}${payload.ref ? ` "${payload.ref}"` : ''}`;
    case 'DeleteEvent':
      return `Deleted ${payload.ref_type} "${payload.ref}"`;
    case 'ForkEvent':
      return 'Forked this repository';
    case 'WatchEvent':
      return 'Starred this repository';
    case 'ReleaseEvent':
      return `Released ${(payload.release as { tag_name: string })?.tag_name || ''}`;
    default:
      return event.type.replace('Event', '');
  }
}

export default function OrgPulsePage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [orgName, setOrgName] = useState('');

  // Hourly activity for the heartbeat chart
  const [hourlyActivity, setHourlyActivity] = useState<number[]>(new Array(24).fill(0));

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      // Get org events
      const orgs = await githubService.getUserOrganizations();
      if (orgs.length > 0) {
        setOrgName(orgs[0].login);
        const response = await fetch(
          `https://api.github.com/orgs/${orgs[0].login}/events?per_page=100`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (response.ok) {
          const data = (await response.json()) as OrgEvent[];
          setEvents(data);

          // Calculate hourly activity
          const hours = new Array(24).fill(0);
          data.forEach((e) => {
            const hour = new Date(e.created_at).getHours();
            hours[hour]++;
          });
          setHourlyActivity(hours);

          // Pulse intensity = events in last hour
          const oneHourAgo = Date.now() - 3600000;
          const recentCount = data.filter(
            (e) => new Date(e.created_at).getTime() > oneHourAgo
          ).length;
          setPulseIntensity(Math.min(recentCount / 10, 1));
          return;
        }
      }

      // Fallback to user events
      const userEvents = (await githubService.getUserEvents()) as unknown as OrgEvent[];
      setEvents(userEvents);

      const hours = new Array(24).fill(0);
      userEvents.forEach((e) => {
        const hour = new Date(e.created_at).getHours();
        hours[hour]++;
      });
      setHourlyActivity(hours);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh every 30 seconds when not paused
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(fetchEvents, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, fetchEvents]);

  // Aggregate stats
  const eventCounts: Record<string, number> = {};
  const uniqueActors = new Set<string>();
  const uniqueRepos = new Set<string>();
  events.forEach((e) => {
    eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
    uniqueActors.add(e.actor.login);
    uniqueRepos.add(e.repo.name);
  });

  const maxHourly = Math.max(...hourlyActivity, 1);
  const currentHour = new Date().getHours();

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
            Organization Pulse
            {/* Live heartbeat dot */}
            {!isPaused && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </h2>
          <p className="text-sm text-dark-text-muted">
            Live activity feed for {orgName || 'your organizations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            icon={isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={events.length}
          icon={Activity}
          change="Last 100 events"
          trend="neutral"
        />
        <StatCard
          label="Active Contributors"
          value={uniqueActors.size}
          icon={Users}
          change="Unique actors"
          trend="up"
        />
        <StatCard
          label="Repos Touched"
          value={uniqueRepos.size}
          icon={GitFork}
          change="Active repos"
          trend="up"
        />
        <StatCard
          label="Pushes"
          value={eventCounts['PushEvent'] || 0}
          icon={GitCommit}
          change={`${eventCounts['PullRequestEvent'] || 0} PRs`}
          trend="up"
        />
      </motion.div>

      {/* Heartbeat Chart */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-dark-text">24-Hour Heartbeat</h3>
              </div>
              <Badge
                variant={
                  pulseIntensity > 0.5 ? 'success' : pulseIntensity > 0.2 ? 'warning' : 'default'
                }
              >
                {pulseIntensity > 0.5
                  ? 'High Activity'
                  : pulseIntensity > 0.2
                    ? 'Moderate'
                    : 'Low Activity'}
              </Badge>
            </div>

            {/* Bar chart with glow effect */}
            <div className="flex items-end gap-[3px] h-24">
              {hourlyActivity.map((count, i) => {
                const height = maxHourly > 0 ? (count / maxHourly) * 100 : 0;
                const isCurrent = i === currentHour;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 4)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.02 }}
                      className={`w-full rounded-t-sm transition-colors ${
                        isCurrent
                          ? 'bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                          : count > 0
                            ? 'bg-brand-500/40 hover:bg-brand-500/60'
                            : 'bg-dark-border/50'
                      }`}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-dark-card border border-dark-border rounded px-1.5 py-0.5 text-2xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {i}:00 — {count} events
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-2xs text-dark-text-muted">0:00</span>
              <span className="text-2xs text-dark-text-muted">6:00</span>
              <span className="text-2xs text-dark-text-muted">12:00</span>
              <span className="text-2xs text-dark-text-muted">18:00</span>
              <span className="text-2xs text-dark-text-muted">Now</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Event Type Breakdown + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Breakdown */}
        <motion.div variants={fadeUp}>
          <Card variant="glass" className="h-full">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                Event Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(eventCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([type, count]) => {
                    const cfg = eventConfig[type] || defaultEvent;
                    const Icon = cfg.icon;
                    const pct = Math.round((count / events.length) * 100);
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center ${cfg.bgColor}`}
                        >
                          <Icon className={`w-3 h-3 ${cfg.color}`} />
                        </div>
                        <span className="text-xs text-dark-text flex-1 truncate">{cfg.label}</span>
                        <div className="w-20 h-1.5 rounded-full bg-dark-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500/60"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-dark-text-muted w-8 text-right tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card variant="glass">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Live Activity Feed
                </h3>
                <span className="text-2xs text-dark-text-muted">Auto-refreshes every 30s</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-dark-card/50 border border-dark-border animate-pulse"
                    >
                      <div className="w-8 h-8 rounded-full bg-dark-border" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-32 h-3 rounded bg-dark-border" />
                        <div className="w-48 h-2.5 rounded bg-dark-border" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-hide">
                  <AnimatePresence initial={false}>
                    {events.slice(0, 50).map((event, idx) => {
                      const cfg = eventConfig[event.type] || defaultEvent;
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={event.id || idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-dark-card/50 transition-colors group"
                        >
                          {/* Avatar */}
                          {event.actor.avatar_url ? (
                            <img
                              src={event.actor.avatar_url}
                              alt={event.actor.login}
                              className="w-7 h-7 rounded-full ring-1 ring-dark-border shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">
                              {event.actor.login[0]?.toUpperCase()}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-dark-text">
                                {event.actor.login}
                              </span>
                              <div
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs ${cfg.bgColor} ${cfg.color}`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {cfg.label}
                              </div>
                            </div>
                            <p className="text-xs text-dark-text-muted truncate mt-0.5">
                              {getEventDescription(event)}
                            </p>
                            <p className="text-2xs text-dark-text-muted/60 mt-0.5">
                              {event.repo.name} · {timeAgo(event.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Contributors */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Top Contributors (Recent Activity)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
              {Array.from(
                events.reduce((map, e) => {
                  const key = e.actor.login;
                  if (!map.has(key)) {
                    map.set(key, { login: key, avatar: e.actor.avatar_url, count: 0 });
                  }
                  map.get(key)!.count++;
                  return map;
                }, new Map<string, { login: string; avatar: string; count: number }>())
              )
                .map(([, v]) => v)
                .sort((a, b) => b.count - a.count)
                .slice(0, 16)
                .map((contributor) => (
                  <div
                    key={contributor.login}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-dark-card/50 transition-colors"
                  >
                    {contributor.avatar ? (
                      <img
                        src={contributor.avatar}
                        alt={contributor.login}
                        className="w-9 h-9 rounded-full ring-1 ring-dark-border"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                        {contributor.login[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-2xs text-dark-text font-medium truncate w-full text-center">
                      {contributor.login}
                    </span>
                    <span className="text-2xs text-dark-text-muted">
                      {contributor.count} events
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
