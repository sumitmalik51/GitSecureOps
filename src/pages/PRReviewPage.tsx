import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  ExternalLink,
  Filter,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type PullRequest,
  type PullRequestReview,
} from '../services/githubService';

interface EnrichedPR extends PullRequest {
  repoName: string;
  reviews: PullRequestReview[];
  ageHours: number;
  ageDays: number;
  status: 'waiting' | 'changes-requested' | 'approved' | 'reviewed';
}

interface ReviewerLoad {
  login: string;
  avatar_url: string;
  assigned: number;
  completed: number;
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function PRReviewPage() {
  const { token } = useAuth();
  const { error: showError } = useToast();

  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [prs, setPrs] = useState<EnrichedPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<'all' | 'waiting' | 'changes-requested'>('all');

  useEffect(() => {
    if (!token) return;
    githubService.setToken(token);
    githubService.getUserOrganizations().then((orgs) => {
      setOrganizations(orgs);
      if (orgs.length > 0) setSelectedOrg(orgs[0].login);
      else setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (!selectedOrg) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrg]);

  const loadData = async () => {
    setLoading(true);
    try {
      githubService.setToken(token!);
      const repos = await githubService.getOrgRepositories(selectedOrg);
      const topRepos = repos.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()).slice(0, 10);

      const enriched: EnrichedPR[] = [];
      for (const repo of topRepos) {
        try {
          const openPRs = await githubService.getRepoPullRequests(selectedOrg, repo.name, 'open');
          for (const pr of openPRs) {
            const reviews = await githubService.getPullRequestReviews(selectedOrg, repo.name, pr.number).catch(() => []);
            const ageMs = Date.now() - new Date(pr.created_at).getTime();
            const lastReviewState = reviews.length > 0 ? reviews[reviews.length - 1].state : null;
            let status: EnrichedPR['status'] = 'waiting';
            if (lastReviewState === 'APPROVED') status = 'approved';
            else if (lastReviewState === 'CHANGES_REQUESTED') status = 'changes-requested';
            else if (reviews.length > 0) status = 'reviewed';

            enriched.push({
              ...pr,
              repoName: repo.name,
              reviews,
              ageHours: Math.floor(ageMs / 3600000),
              ageDays: Math.floor(ageMs / 86400000),
              status,
            });
          }
        } catch { /* skip repos we can't access */ }
      }
      setPrs(enriched);
    } catch {
      showError('Failed to load pull request data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (filterState === 'all') return prs;
    return prs.filter((pr) => pr.status === filterState);
  }, [prs, filterState]);

  const waitingCount = prs.filter((p) => p.status === 'waiting').length;
  const changesCount = prs.filter((p) => p.status === 'changes-requested').length;
  const staleCount = prs.filter((p) => p.ageDays >= 7).length;

  // Reviewer load
  const reviewerLoad = useMemo(() => {
    const map = new Map<string, ReviewerLoad>();
    for (const pr of prs) {
      for (const rv of pr.requested_reviewers) {
        const existing = map.get(rv.login) || { login: rv.login, avatar_url: rv.avatar_url, assigned: 0, completed: 0 };
        existing.assigned++;
        map.set(rv.login, existing);
      }
      for (const rv of pr.reviews) {
        const existing = map.get(rv.user.login) || { login: rv.user.login, avatar_url: rv.user.avatar_url, assigned: 0, completed: 0 };
        existing.completed++;
        map.set(rv.user.login, existing);
      }
    }
    return [...map.values()].sort((a, b) => b.assigned - a.assigned);
  }, [prs]);

  const fmtDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const statusBadge = (status: EnrichedPR['status']) => {
    switch (status) {
      case 'waiting': return <Badge variant="warning">Waiting</Badge>;
      case 'changes-requested': return <Badge variant="danger">Changes Requested</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'reviewed': return <Badge variant="brand">Reviewed</Badge>;
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-7xl">
      {/* Org selector + refresh */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {organizations.length > 0 && (
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="bg-dark-card border border-dark-border text-dark-text rounded-lg px-3 py-1.5 text-sm"
            >
              {organizations.map((org) => (
                <option key={org.login} value={org.login}>{org.login}</option>
              ))}
            </select>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadData} loading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <GitPullRequest className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Open PRs</span>
              </div>
              <p className="text-2xl font-bold text-dark-text">{prs.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-warning-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Waiting for Review</span>
              </div>
              <p className="text-2xl font-bold text-warning-400">{waitingCount}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-danger-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-danger-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Changes Requested</span>
              </div>
              <p className="text-2xl font-bold text-danger-400">{changesCount}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Stale (7d+)</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{staleCount}</p>
            </Card>
          </motion.div>

          {/* Reviewer load */}
          {reviewerLoad.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-400" />
                  Reviewer Load
                </h3>
                <div className="space-y-2">
                  {reviewerLoad.slice(0, 8).map((r) => (
                    <div key={r.login} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={r.avatar_url} alt={r.login} className="w-6 h-6 rounded-full" />
                        <span className="text-sm text-dark-text">{r.login}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-warning-400">{r.assigned} pending</span>
                        <span className="text-success-400">{r.completed} done</span>
                        {r.assigned >= 5 && <Badge variant="danger">Overloaded</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Filter bar */}
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-dark-text-muted" />
            {(['all', 'waiting', 'changes-requested'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterState(f)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filterState === f
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-dark-text-muted hover:text-dark-text border border-transparent'
                }`}
              >
                {f === 'all' ? 'All' : f === 'waiting' ? 'Waiting' : 'Changes Requested'}
              </button>
            ))}
          </motion.div>

          {/* PR list */}
          <motion.div variants={fadeUp}>
            <Card noPadding>
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-dark-text-muted">
                  {prs.length === 0 ? 'No open pull requests found' : 'No PRs match this filter'}
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {filtered.map((pr) => (
                    <div key={`${pr.repoName}-${pr.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-dark-hover/50 transition-colors">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img src={pr.user.avatar_url} alt={pr.user.login} className="w-7 h-7 rounded-full mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark-text truncate">{pr.title}</p>
                          <p className="text-xs text-dark-text-muted mt-0.5">
                            <span className="font-medium text-dark-text-secondary">{pr.repoName}</span>
                            {' · '}#{pr.number} by {pr.user.login}
                            {' · '}{fmtDuration(pr.ageHours)} ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {statusBadge(pr.status)}
                        {pr.ageDays >= 7 && <Badge variant="danger">{pr.ageDays}d old</Badge>}
                        <div className="flex -space-x-1.5">
                          {pr.requested_reviewers.slice(0, 3).map((rv) => (
                            <img key={rv.login} src={rv.avatar_url} alt={rv.login} title={rv.login} className="w-5 h-5 rounded-full border-2 border-dark-bg" />
                          ))}
                        </div>
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="p-1 text-dark-text-muted hover:text-brand-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
