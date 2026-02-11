import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type ActionsBilling,
} from '../services/githubService';

const RATE_PER_MINUTE: Record<string, number> = {
  UBUNTU: 0.008,
  MACOS: 0.08,
  WINDOWS: 0.016,
};

interface RepoUsage {
  repo: string;
  runs: number;
  totalMinutes: number;
  estimatedCost: number;
  lastRun: string;
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ActionsCostPage() {
  const { token } = useAuth();
  const { error: showError } = useToast();

  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [billing, setBilling] = useState<ActionsBilling | null>(null);
  const [repoUsages, setRepoUsages] = useState<RepoUsage[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [billingData, repos] = await Promise.all([
        githubService.getActionsBilling(selectedOrg).catch(() => null),
        githubService.getOrgRepositories(selectedOrg),
      ]);

      setBilling(billingData);

      const topRepos = repos
        .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
        .slice(0, 15);

      const usages: RepoUsage[] = [];
      for (const repo of topRepos) {
        try {
          const { workflow_runs } = await githubService.getWorkflowRuns(selectedOrg, repo.name);
          if (workflow_runs.length === 0) continue;

          const totalMinutes = workflow_runs.reduce((sum, run) => {
            const start = new Date(run.run_started_at || run.created_at).getTime();
            const end = new Date(run.updated_at).getTime();
            return sum + Math.max(1, Math.round((end - start) / 60000));
          }, 0);

          usages.push({
            repo: repo.name,
            runs: workflow_runs.length,
            totalMinutes,
            estimatedCost: totalMinutes * RATE_PER_MINUTE.UBUNTU,
            lastRun: workflow_runs[0].created_at,
          });
        } catch { /* skip */ }
      }
      setRepoUsages(usages.sort((a, b) => b.estimatedCost - a.estimatedCost));
    } catch {
      showError('Failed to load Actions data');
    } finally {
      setLoading(false);
    }
  };

  const totalEstCost = useMemo(() => {
    if (billing) {
      const b = billing.minutes_used_breakdown;
      return (b.UBUNTU * RATE_PER_MINUTE.UBUNTU) + (b.MACOS * RATE_PER_MINUTE.MACOS) + (b.WINDOWS * RATE_PER_MINUTE.WINDOWS);
    }
    return repoUsages.reduce((s, r) => s + r.estimatedCost, 0);
  }, [billing, repoUsages]);

  const totalMinutes = billing?.total_minutes_used ?? repoUsages.reduce((s, r) => s + r.totalMinutes, 0);
  const includedMinutes = billing?.included_minutes ?? 0;
  const usagePct = includedMinutes > 0 ? Math.round((totalMinutes / includedMinutes) * 100) : 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-7xl">
      {/* Header */}
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
                  <Zap className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Total Minutes</span>
              </div>
              <p className="text-2xl font-bold text-dark-text">{totalMinutes.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-success-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-success-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Included Minutes</span>
              </div>
              <p className="text-2xl font-bold text-success-400">{includedMinutes.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-warning-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-warning-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Usage</span>
              </div>
              <p className="text-2xl font-bold text-warning-400">{usagePct}%</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-danger-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-danger-400" />
                </div>
                <span className="text-xs text-dark-text-muted">Est. Cost</span>
              </div>
              <p className="text-2xl font-bold text-danger-400">${totalEstCost.toFixed(2)}</p>
            </Card>
          </motion.div>

          {/* OS breakdown */}
          {billing && (
            <motion.div variants={fadeUp}>
              <Card>
                <h3 className="text-sm font-semibold text-dark-text mb-3">Runner Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(billing.minutes_used_breakdown).map(([os, mins]) => (
                    <div key={os} className="text-center">
                      <p className="text-lg font-bold text-dark-text">{mins.toLocaleString()}</p>
                      <p className="text-xs text-dark-text-muted">{os} min</p>
                      <p className="text-xs text-brand-400">${(mins * (RATE_PER_MINUTE[os] || 0.008)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Repo usage table */}
          <motion.div variants={fadeUp}>
            <Card noPadding>
              <div className="px-5 py-3 border-b border-dark-border">
                <h3 className="text-sm font-semibold text-dark-text">Cost by Repository</h3>
              </div>
              {repoUsages.length === 0 ? (
                <div className="p-10 text-center text-sm text-dark-text-muted">No workflow runs found</div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {repoUsages.map((r) => (
                    <div key={r.repo} className="flex items-center justify-between px-5 py-3 hover:bg-dark-hover/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark-text">{r.repo}</p>
                        <p className="text-xs text-dark-text-muted">{r.runs} runs · {r.totalMinutes} min</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-dark-text">${r.estimatedCost.toFixed(2)}</span>
                        {r.estimatedCost > 10 && <Badge variant="warning">High</Badge>}
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
