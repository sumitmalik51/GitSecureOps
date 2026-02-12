import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Lock,
  Eye,
  Users,
  GitBranch,
  Key,
  ExternalLink,
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

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface ThreatFinding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  repo?: string;
  icon: React.ElementType;
}

const severityConfig: Record<
  Severity,
  {
    label: string;
    color: string;
    bgColor: string;
    ring: number;
    badge: 'danger' | 'warning' | 'brand' | 'default' | 'success';
  }
> = {
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    ring: 0,
    badge: 'danger',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    ring: 1,
    badge: 'warning',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    ring: 2,
    badge: 'brand',
  },
  low: {
    label: 'Low',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    ring: 3,
    badge: 'default',
  },
  info: {
    label: 'Info',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    ring: 4,
    badge: 'success',
  },
};

function analyzeSecurity(
  repos: GitHubRepo[],
  members2FADisabled: string[],
  outsideCollabs: number
): ThreatFinding[] {
  const findings: ThreatFinding[] = [];
  let id = 0;

  // Check 2FA
  if (members2FADisabled.length > 0) {
    findings.push({
      id: `t-${id++}`,
      title: `${members2FADisabled.length} members without 2FA`,
      description: `Members: ${members2FADisabled.slice(0, 5).join(', ')}${members2FADisabled.length > 5 ? '...' : ''}`,
      severity: 'critical',
      category: 'Authentication',
      icon: Key,
    });
  }

  // Check public repos
  const publicRepos = repos.filter((r) => !r.private);
  if (publicRepos.length > 0) {
    findings.push({
      id: `t-${id++}`,
      title: `${publicRepos.length} public repositories`,
      description: publicRepos
        .slice(0, 3)
        .map((r) => r.name)
        .join(', '),
      severity: publicRepos.length > 10 ? 'high' : 'medium',
      category: 'Visibility',
      icon: Eye,
    });
  }

  // Check outside collaborators
  if (outsideCollabs > 0) {
    findings.push({
      id: `t-${id++}`,
      title: `${outsideCollabs} outside collaborators`,
      description: 'External users with access to org repositories',
      severity: outsideCollabs > 20 ? 'high' : 'medium',
      category: 'Access Control',
      icon: Users,
    });
  }

  // Check repos without descriptions
  const noDesc = repos.filter((r) => !r.description);
  if (noDesc.length > 3) {
    findings.push({
      id: `t-${id++}`,
      title: `${noDesc.length} repos without descriptions`,
      description: 'Repos lacking descriptions are harder to identify and audit',
      severity: 'low',
      category: 'Governance',
      icon: Info,
    });
  }

  // Check stale repos (no updates in 6+ months)
  const sixMonths = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const staleRepos = repos.filter(
    (r) => r.updated_at && new Date(r.updated_at).getTime() < sixMonths
  );
  if (staleRepos.length > 0) {
    findings.push({
      id: `t-${id++}`,
      title: `${staleRepos.length} stale repositories`,
      description: 'Not updated in 6+ months — potential candidates for archival',
      severity: staleRepos.length > 10 ? 'medium' : 'low',
      category: 'Hygiene',
      icon: GitBranch,
    });
  }

  // Check forked repos
  const forkedRepos = repos.filter((r) => (r as Record<string, unknown>).fork);
  if (forkedRepos.length > 5) {
    findings.push({
      id: `t-${id++}`,
      title: `${forkedRepos.length} forked repositories`,
      description: 'Forks may diverge and become maintenance burden',
      severity: 'info',
      category: 'Hygiene',
      icon: GitBranch,
    });
  }

  // Overall if everything looks good
  if (findings.length === 0) {
    findings.push({
      id: `t-${id++}`,
      title: 'No threats detected',
      description: 'Your organization security posture looks good!',
      severity: 'info',
      category: 'Status',
      icon: CheckCircle,
    });
  }

  return findings.sort(
    (a, b) =>
      Object.keys(severityConfig).indexOf(a.severity) -
      Object.keys(severityConfig).indexOf(b.severity)
  );
}

export default function SecurityRadarPage() {
  const { token } = useAuth();
  const [findings, setFindings] = useState<ThreatFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanAngle, setScanAngle] = useState(0);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [orgName, setOrgName] = useState('');

  const runScan = useCallback(async () => {
    if (!token) return;
    setScanning(true);
    setLoading(true);

    try {
      const orgs = await githubService.getUserOrganizations();
      if (orgs.length === 0) {
        setFindings([]);
        setLoading(false);
        setScanning(false);
        return;
      }

      const org = orgs[0].login;
      setOrgName(org);

      // Fetch data in parallel
      const [repos, outsideCollabs, members2FA] = await Promise.all([
        githubService.getOrgRepositories(org).catch(() => []),
        githubService.getOutsideCollaborators(org).catch(() => []),
        githubService.getOrgMembers2FADisabled(org).catch(() => []),
      ]);

      const results = analyzeSecurity(
        repos,
        members2FA.map((m) => m.login),
        outsideCollabs.length
      );

      setFindings(results);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, [token]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  // Radar animation
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanAngle((a) => (a + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [scanning]);

  const filteredFindings =
    selectedSeverity === 'all' ? findings : findings.filter((f) => f.severity === selectedSeverity);

  const countBySeverity = (sev: Severity) => findings.filter((f) => f.severity === sev).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
            <Radar className="w-5 h-5 text-emerald-400" />
            Security Threat Radar
          </h2>
          <p className="text-sm text-dark-text-muted">
            Real-time security posture scan for {orgName || 'your organization'}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={runScan}
          loading={scanning}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          {scanning ? 'Scanning...' : 'Run Scan'}
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Critical"
          value={countBySeverity('critical')}
          icon={AlertCircle}
          trend={countBySeverity('critical') > 0 ? 'down' : 'up'}
          change={countBySeverity('critical') > 0 ? 'Needs attention' : 'All clear'}
        />
        <StatCard
          label="High"
          value={countBySeverity('high')}
          icon={AlertTriangle}
          trend={countBySeverity('high') > 0 ? 'down' : 'up'}
          change={countBySeverity('high') > 0 ? 'Review needed' : 'All clear'}
        />
        <StatCard
          label="Medium"
          value={countBySeverity('medium')}
          icon={Shield}
          trend="neutral"
          change="Monitor"
        />
        <StatCard
          label="Low"
          value={countBySeverity('low')}
          icon={Info}
          trend="neutral"
          change="Informational"
        />
        <StatCard
          label="Total Findings"
          value={findings.length}
          icon={Radar}
          trend="neutral"
          change={orgName}
        />
      </motion.div>

      {/* Radar Visualization + Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Visual */}
        <motion.div variants={fadeUp}>
          <Card variant="glass" className="h-full">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-dark-text mb-4">Threat Radar</h3>

              {/* Radar SVG */}
              <div className="relative w-full aspect-square max-w-[360px] mx-auto">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Background rings */}
                  {[160, 130, 100, 70, 40].map((r, i) => (
                    <circle
                      key={i}
                      cx="200"
                      cy="200"
                      r={r}
                      fill="none"
                      stroke="currentColor"
                      className="text-dark-border"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Cross lines */}
                  <line
                    x1="200"
                    y1="35"
                    x2="200"
                    y2="365"
                    stroke="currentColor"
                    className="text-dark-border/50"
                    strokeWidth="1"
                  />
                  <line
                    x1="35"
                    y1="200"
                    x2="365"
                    y2="200"
                    stroke="currentColor"
                    className="text-dark-border/50"
                    strokeWidth="1"
                  />

                  {/* Sweep line */}
                  {scanning && (
                    <line
                      x1="200"
                      y1="200"
                      x2={200 + 165 * Math.cos((scanAngle * Math.PI) / 180)}
                      y2={200 + 165 * Math.sin((scanAngle * Math.PI) / 180)}
                      stroke="rgb(52, 211, 153)"
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Sweep gradient trail */}
                  {scanning && (
                    <path
                      d={`M 200 200 L ${200 + 165 * Math.cos((scanAngle * Math.PI) / 180)} ${200 + 165 * Math.sin((scanAngle * Math.PI) / 180)} A 165 165 0 0 0 ${200 + 165 * Math.cos(((scanAngle - 30) * Math.PI) / 180)} ${200 + 165 * Math.sin(((scanAngle - 30) * Math.PI) / 180)} Z`}
                      fill="url(#sweepGradient)"
                      opacity="0.3"
                    />
                  )}

                  <defs>
                    <radialGradient id="sweepGradient">
                      <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Ring labels */}
                  {['Critical', 'High', 'Medium', 'Low', 'Info'].map((label, i) => (
                    <text
                      key={label}
                      x="205"
                      y={200 - [155, 125, 95, 65, 35][i]}
                      className="fill-dark-text-muted"
                      fontSize="9"
                    >
                      {label}
                    </text>
                  ))}

                  {/* Threat blips */}
                  {findings.map((finding, idx) => {
                    const ring = severityConfig[finding.severity].ring;
                    const radius = [155, 125, 95, 65, 35][ring];
                    // Place blips evenly around the ring
                    const sameRing = findings.filter(
                      (f) => severityConfig[f.severity].ring === ring
                    );
                    const posInRing = sameRing.indexOf(finding);
                    const angle =
                      (posInRing * (360 / Math.max(sameRing.length, 1)) + idx * 37) % 360;
                    const x = 200 + radius * Math.cos((angle * Math.PI) / 180);
                    const y = 200 + radius * Math.sin((angle * Math.PI) / 180);
                    const colors: Record<Severity, string> = {
                      critical: '#ef4444',
                      high: '#f97316',
                      medium: '#f59e0b',
                      low: '#3b82f6',
                      info: '#94a3b8',
                    };

                    return (
                      <g key={finding.id}>
                        {/* Glow */}
                        <circle cx={x} cy={y} r="8" fill={colors[finding.severity]} opacity="0.2">
                          <animate
                            attributeName="r"
                            values="6;10;6"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.2;0.4;0.2"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        {/* Dot */}
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill={colors[finding.severity]}
                          className="cursor-pointer"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Findings List */}
        <motion.div variants={fadeUp}>
          <Card variant="glass" className="h-full">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-dark-text">Findings</h3>
                <div className="flex gap-1">
                  {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`px-2 py-1 rounded text-2xs font-medium transition-colors ${
                        selectedSeverity === sev
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-hover'
                      }`}
                    >
                      {sev === 'all' ? 'All' : severityConfig[sev].label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-dark-card/50 border border-dark-border animate-pulse"
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded bg-dark-border" />
                        <div className="flex-1 space-y-1.5">
                          <div className="w-36 h-3 rounded bg-dark-border" />
                          <div className="w-48 h-2.5 rounded bg-dark-border" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredFindings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-dark-text font-medium">All clear!</p>
                  <p className="text-xs text-dark-text-muted">No findings for this filter</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto scrollbar-hide">
                  {filteredFindings.map((finding) => {
                    const sev = severityConfig[finding.severity];
                    const Icon = finding.icon;
                    return (
                      <motion.div
                        key={finding.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border transition-colors ${sev.bgColor} border-dark-border hover:border-dark-border-light`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sev.bgColor}`}
                          >
                            <Icon className={`w-4 h-4 ${sev.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-dark-text">{finding.title}</p>
                              <Badge variant={sev.badge} className="text-2xs">
                                {sev.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-dark-text-muted mt-0.5">
                              {finding.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-2xs text-dark-text-muted/70">
                                {finding.category}
                              </span>
                              {finding.repo && (
                                <a
                                  href={`https://github.com/${finding.repo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-2xs text-brand-400 hover:underline flex items-center gap-0.5"
                                >
                                  {finding.repo}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Security Score Summary */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-400" />
              Security Posture Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Overall Score',
                  value:
                    findings.length === 0
                      ? 'A+'
                      : countBySeverity('critical') > 0
                        ? 'D'
                        : countBySeverity('high') > 0
                          ? 'C'
                          : countBySeverity('medium') > 0
                            ? 'B'
                            : 'A',
                  color:
                    countBySeverity('critical') > 0
                      ? 'text-red-400'
                      : countBySeverity('high') > 0
                        ? 'text-orange-400'
                        : 'text-emerald-400',
                },
                {
                  label: 'Total Findings',
                  value: findings.length.toString(),
                  color: 'text-dark-text',
                },
                {
                  label: 'Actionable',
                  value: findings
                    .filter((f) => f.severity === 'critical' || f.severity === 'high')
                    .length.toString(),
                  color: 'text-amber-400',
                },
                {
                  label: 'Categories',
                  value: new Set(findings.map((f) => f.category)).size.toString(),
                  color: 'text-brand-400',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-4 rounded-lg bg-dark-card/50 border border-dark-border"
                >
                  <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-dark-text-muted mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
