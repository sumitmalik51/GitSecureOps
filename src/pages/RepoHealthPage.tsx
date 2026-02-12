import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Shield,
  FileText,
  GitBranch,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
  ExternalLink,
  Eye,
  Lock,
  Users,
  Zap,
  BookOpen,
  Scale,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import githubService, { type GitHubRepo } from '@/services/githubService';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface HealthCheck {
  key: string;
  label: string;
  icon: React.ElementType;
  weight: number;
  check: (repo: GitHubRepo, extras: RepoExtras) => boolean;
  tip: string;
}

interface RepoExtras {
  hasReadme: boolean;
  hasLicense: boolean;
  hasCodeowners: boolean;
  hasCiCd: boolean;
  hasSecurityPolicy: boolean;
  hasBranchProtection: boolean;
  hasDescription: boolean;
  isNotStale: boolean;
}

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface RepoHealthResult {
  repo: GitHubRepo;
  score: number;
  grade: Grade;
  checks: { key: string; passed: boolean }[];
}

const healthChecks: HealthCheck[] = [
  {
    key: 'description',
    label: 'Has Description',
    icon: FileText,
    weight: 10,
    check: (repo) => !!repo.description && repo.description.length > 5,
    tip: 'Add a meaningful description to your repo',
  },
  {
    key: 'readme',
    label: 'Has README',
    icon: BookOpen,
    weight: 15,
    check: (_, extras) => extras.hasReadme,
    tip: 'Add a README.md file',
  },
  {
    key: 'license',
    label: 'Has LICENSE',
    icon: Scale,
    weight: 10,
    check: (_, extras) => extras.hasLicense,
    tip: 'Add a LICENSE file for clarity on usage terms',
  },
  {
    key: 'codeowners',
    label: 'Has CODEOWNERS',
    icon: Users,
    weight: 15,
    check: (_, extras) => extras.hasCodeowners,
    tip: 'Add CODEOWNERS to define review responsibilities',
  },
  {
    key: 'ci_cd',
    label: 'Has CI/CD',
    icon: Zap,
    weight: 15,
    check: (_, extras) => extras.hasCiCd,
    tip: 'Add GitHub Actions or CI/CD pipeline',
  },
  {
    key: 'security_policy',
    label: 'Security Policy',
    icon: Shield,
    weight: 10,
    check: (_, extras) => extras.hasSecurityPolicy,
    tip: 'Add SECURITY.md with vulnerability reporting info',
  },
  {
    key: 'branch_protection',
    label: 'Branch Protection',
    icon: Lock,
    weight: 15,
    check: (_, extras) => extras.hasBranchProtection,
    tip: 'Enable branch protection rules on the default branch',
  },
  {
    key: 'not_stale',
    label: 'Recently Active',
    icon: GitBranch,
    weight: 10,
    check: (_, extras) => extras.isNotStale,
    tip: 'Repo should have activity within the last 6 months',
  },
];

function getGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

const gradeColors: Record<Grade, { text: string; bg: string; border: string }> = {
  A: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  B: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  C: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  D: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  F: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

type SortKey = 'score' | 'name' | 'grade';

export default function RepoHealthPage() {
  const { token } = useAuth();
  const [results, setResults] = useState<RepoHealthResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<Grade | 'all'>('all');
  const [orgName, setOrgName] = useState('');
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  const runHealthScan = useCallback(async () => {
    if (!token) return;
    setScanning(true);
    setLoading(true);
    setResults([]);

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
      setProgress({ current: 0, total: repos.length });

      const healthResults: RepoHealthResult[] = [];

      // Process repos in batches of 5 to avoid rate limits
      for (let i = 0; i < repos.length; i += 5) {
        const batch = repos.slice(i, i + 5);

        const batchResults = await Promise.all(
          batch.map(async (repo) => {
            try {
              // Check file existence in parallel
              const [readmeRes, licenseRes, codeownersRes, ciRes, securityRes, branchProtRes] =
                await Promise.all([
                  fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
                    headers: {
                      Authorization: `token ${token}`,
                      Accept: 'application/vnd.github.v3+json',
                    },
                  }).catch(() => ({ ok: false })),
                  fetch(`https://api.github.com/repos/${repo.full_name}/license`, {
                    headers: {
                      Authorization: `token ${token}`,
                      Accept: 'application/vnd.github.v3+json',
                    },
                  }).catch(() => ({ ok: false })),
                  fetch(`https://api.github.com/repos/${repo.full_name}/contents/CODEOWNERS`, {
                    headers: {
                      Authorization: `token ${token}`,
                      Accept: 'application/vnd.github.v3+json',
                    },
                  })
                    .then((r) =>
                      r.ok
                        ? r
                        : fetch(
                            `https://api.github.com/repos/${repo.full_name}/contents/.github/CODEOWNERS`,
                            {
                              headers: {
                                Authorization: `token ${token}`,
                                Accept: 'application/vnd.github.v3+json',
                              },
                            }
                          )
                    )
                    .catch(() => ({ ok: false })),
                  fetch(
                    `https://api.github.com/repos/${repo.full_name}/contents/.github/workflows`,
                    {
                      headers: {
                        Authorization: `token ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                      },
                    }
                  ).catch(() => ({ ok: false })),
                  fetch(`https://api.github.com/repos/${repo.full_name}/contents/SECURITY.md`, {
                    headers: {
                      Authorization: `token ${token}`,
                      Accept: 'application/vnd.github.v3+json',
                    },
                  })
                    .then((r) =>
                      r.ok
                        ? r
                        : fetch(
                            `https://api.github.com/repos/${repo.full_name}/contents/.github/SECURITY.md`,
                            {
                              headers: {
                                Authorization: `token ${token}`,
                                Accept: 'application/vnd.github.v3+json',
                              },
                            }
                          )
                    )
                    .catch(() => ({ ok: false })),
                  fetch(
                    `https://api.github.com/repos/${repo.full_name}/branches/${(repo as unknown as { default_branch?: string }).default_branch || 'main'}/protection`,
                    {
                      headers: {
                        Authorization: `token ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                      },
                    }
                  ).catch(() => ({ ok: false })),
                ]);

              const sixMonths = Date.now() - 180 * 24 * 60 * 60 * 1000;
              const extras: RepoExtras = {
                hasReadme: readmeRes.ok,
                hasLicense: licenseRes.ok,
                hasCodeowners: codeownersRes.ok,
                hasCiCd: ciRes.ok,
                hasSecurityPolicy: securityRes.ok,
                hasBranchProtection: branchProtRes.ok,
                hasDescription: !!repo.description && repo.description.length > 5,
                isNotStale: repo.updated_at
                  ? new Date(repo.updated_at).getTime() > sixMonths
                  : false,
              };

              const checks = healthChecks.map((hc) => ({
                key: hc.key,
                passed: hc.check(repo, extras),
              }));

              const score = healthChecks.reduce((total, hc, idx) => {
                return total + (checks[idx].passed ? hc.weight : 0);
              }, 0);

              return {
                repo,
                score,
                grade: getGrade(score),
                checks,
              };
            } catch {
              return {
                repo,
                score: 0,
                grade: 'F' as Grade,
                checks: healthChecks.map((hc) => ({ key: hc.key, passed: false })),
              };
            }
          })
        );

        healthResults.push(...batchResults);
        setResults([...healthResults]);
        setProgress({ current: Math.min(i + 5, repos.length), total: repos.length });
      }
    } catch (err) {
      console.error('Health scan failed:', err);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, [token]);

  useEffect(() => {
    runHealthScan();
  }, [runHealthScan]);

  // Sorting
  const sorted = [...results]
    .filter((r) => {
      if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
      if (searchQuery && !r.repo.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'score') cmp = b.score - a.score;
      else if (sortBy === 'name') cmp = a.repo.name.localeCompare(b.repo.name);
      else cmp = a.grade.localeCompare(b.grade);
      return sortAsc ? -cmp : cmp;
    });

  const gradeDistribution: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  results.forEach((r) => gradeDistribution[r.grade]++);
  const avgScore =
    results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Repository Health Scorecard
          </h2>
          <p className="text-sm text-dark-text-muted">
            {orgName
              ? `Grading ${results.length} repositories in ${orgName}`
              : 'Analyzing repository health'}
            {scanning && ` (${progress.current}/${progress.total})`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={runHealthScan}
          loading={scanning}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          {scanning ? `Scanning ${progress.current}/${progress.total}` : 'Run Scan'}
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Average Score"
          value={`${avgScore}%`}
          icon={Heart}
          trend={avgScore >= 70 ? 'up' : avgScore >= 50 ? 'neutral' : 'down'}
          change={`Grade ${getGrade(avgScore)}`}
        />
        <StatCard
          label="Healthy (A-B)"
          value={gradeDistribution.A + gradeDistribution.B}
          icon={CheckCircle}
          trend="up"
          change={`${results.length > 0 ? Math.round(((gradeDistribution.A + gradeDistribution.B) / results.length) * 100) : 0}%`}
        />
        <StatCard
          label="Needs Work (C-D)"
          value={gradeDistribution.C + gradeDistribution.D}
          icon={AlertTriangle}
          trend="neutral"
          change="Improve these"
        />
        <StatCard
          label="Critical (F)"
          value={gradeDistribution.F}
          icon={XCircle}
          trend={gradeDistribution.F > 0 ? 'down' : 'up'}
          change={gradeDistribution.F > 0 ? 'Needs attention' : 'None!'}
        />
      </motion.div>

      {/* Grade Distribution Bar */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-dark-text mb-3">Grade Distribution</h3>
            <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
              {(['A', 'B', 'C', 'D', 'F'] as Grade[]).map((grade) => {
                const count = gradeDistribution[grade];
                const pct = results.length > 0 ? (count / results.length) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <motion.div
                    key={grade}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`${gradeColors[grade].bg} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => setFilterGrade(filterGrade === grade ? 'all' : grade)}
                  >
                    <span className={`text-xs font-bold ${gradeColors[grade].text}`}>
                      {grade} ({count})
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-2">
              {(['A', 'B', 'C', 'D', 'F'] as Grade[]).map((grade) => (
                <div key={grade} className="flex items-center gap-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-sm ${gradeColors[grade].bg} ${gradeColors[grade].border} border`}
                  />
                  <span className="text-2xs text-dark-text-muted">
                    {grade}: {gradeDistribution[grade]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-dark-card border border-dark-border text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'A', 'B', 'C', 'D', 'F'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGrade(g)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterGrade === g
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-dark-text-muted hover:bg-dark-hover'
              }`}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (sortBy === 'score') setSortAsc(!sortAsc);
            else {
              setSortBy('score');
              setSortAsc(false);
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-dark-text-muted hover:bg-dark-hover transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          Score
        </button>
        <button
          onClick={() => {
            if (sortBy === 'name') setSortAsc(!sortAsc);
            else {
              setSortBy('name');
              setSortAsc(true);
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-dark-text-muted hover:bg-dark-hover transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          Name
        </button>
      </motion.div>

      {/* Repo List */}
      <motion.div variants={fadeUp} className="space-y-2">
        {loading && results.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-dark-card border border-dark-border animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-dark-border" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-3 rounded bg-dark-border" />
                    <div className="w-48 h-2.5 rounded bg-dark-border" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-10 h-10 text-dark-text-muted mx-auto mb-2" />
            <p className="text-sm text-dark-text-secondary">No repos match your filters</p>
          </div>
        ) : (
          sorted.map((result) => {
            const gc = gradeColors[result.grade];
            const isExpanded = expandedRepo === result.repo.full_name;
            return (
              <motion.div
                key={result.repo.id}
                layout
                className={`rounded-xl bg-dark-card border ${gc.border} hover:border-opacity-60 transition-all cursor-pointer`}
                onClick={() => setExpandedRepo(isExpanded ? null : result.repo.full_name)}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Grade badge */}
                  <div
                    className={`w-12 h-12 rounded-lg ${gc.bg} flex items-center justify-center shrink-0`}
                  >
                    <span className={`text-xl font-bold ${gc.text}`}>{result.grade}</span>
                  </div>

                  {/* Repo info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dark-text truncate">
                        {result.repo.name}
                      </span>
                      <Badge
                        variant={result.repo.private ? 'default' : 'warning'}
                        className="text-2xs"
                      >
                        {result.repo.private ? (
                          <>
                            <Lock className="w-2.5 h-2.5 mr-0.5" />
                            Private
                          </>
                        ) : (
                          <>
                            <Eye className="w-2.5 h-2.5 mr-0.5" />
                            Public
                          </>
                        )}
                      </Badge>
                      {result.repo.language && (
                        <span className="text-2xs text-dark-text-muted">
                          {result.repo.language}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-text-muted truncate mt-0.5">
                      {result.repo.description || 'No description'}
                    </p>
                  </div>

                  {/* Score bar */}
                  <div className="hidden md:flex items-center gap-3 w-40">
                    <div className="flex-1 h-2 rounded-full bg-dark-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          result.score >= 75
                            ? 'bg-emerald-500'
                            : result.score >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold text-dark-text tabular-nums w-8 text-right">
                      {result.score}%
                    </span>
                  </div>

                  {/* Health check icons */}
                  <div className="hidden lg:flex gap-1">
                    {result.checks.map((check) => {
                      const hc = healthChecks.find((h) => h.key === check.key)!;
                      const Icon = hc.icon;
                      return (
                        <div
                          key={check.key}
                          title={`${hc.label}: ${check.passed ? 'Pass' : 'Fail'}`}
                          className={`w-6 h-6 rounded flex items-center justify-center ${
                            check.passed
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-dark-border/50 text-dark-text-muted/40'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>

                  <a
                    href={result.repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark-text-muted hover:text-dark-text transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-4 border-t border-dark-border pt-3"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {result.checks.map((check) => {
                        const hc = healthChecks.find((h) => h.key === check.key)!;
                        const Icon = hc.icon;
                        return (
                          <div
                            key={check.key}
                            className={`p-2.5 rounded-lg border ${
                              check.passed
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-dark-card/50 border-dark-border'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  check.passed ? 'text-emerald-400' : 'text-dark-text-muted'
                                }`}
                              />
                              <span className="text-xs font-medium text-dark-text">{hc.label}</span>
                              {check.passed ? (
                                <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" />
                              ) : (
                                <XCircle className="w-3 h-3 text-dark-text-muted ml-auto" />
                              )}
                            </div>
                            {!check.passed && (
                              <p className="text-2xs text-dark-text-muted">{hc.tip}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Scan progress */}
      {scanning && (
        <motion.div variants={fadeUp}>
          <div className="w-full h-1.5 rounded-full bg-dark-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
              className="h-full rounded-full bg-brand-500"
            />
          </div>
          <p className="text-xs text-dark-text-muted text-center mt-1">
            Scanning {progress.current} of {progress.total} repositories...
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
