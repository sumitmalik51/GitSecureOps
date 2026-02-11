import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  Building2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import githubService from '../services/githubService';
import analyticsService from '../services/analyticsService';
import type { OrgHealthScore, SecurityAlert } from '../types';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-red-500/30 bg-red-500/5',
  high: 'border-yellow-500/30 bg-yellow-500/5',
  medium: 'border-blue-500/30 bg-blue-500/5',
  low: 'border-gray-500/30 bg-gray-500/5',
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-yellow-500/20 text-yellow-400',
  medium: 'bg-blue-500/20 text-blue-400',
  low: 'bg-gray-500/20 text-gray-400',
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [healthScores, setHealthScores] = useState<OrgHealthScore[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'alerts'>('overview');

  const loadAnalytics = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const orgs = await githubService.getOrganizations();
      if (orgs.length === 0) {
        setHealthScores([]);
        setAlerts([]);
        setLoading(false);
        return;
      }
      const orgNames = orgs.map((o) => o.login);
      const [scores, allAlerts] = await Promise.all([
        analyticsService.calculateAllOrgHealth(orgNames),
        analyticsService.generateAllAlerts(orgNames),
      ]);
      setHealthScores(scores);
      setAlerts(allAlerts);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Computed stats
  const avgScore = useMemo(
    () =>
      healthScores.length > 0
        ? Math.round(healthScores.reduce((s, h) => s + h.overallScore, 0) / healthScores.length)
        : 0,
    [healthScores]
  );
  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === 'critical').length,
    [alerts]
  );
  const totalMembers = useMemo(
    () => healthScores.reduce((s, h) => s + h.totalMembers, 0),
    [healthScores]
  );

  // Chart data
  const compliancePieData = useMemo(
    () => healthScores.map((h) => ({ name: h.org, value: h.twoFactorCompliance })),
    [healthScores]
  );

  const radialData = useMemo(
    () =>
      healthScores.map((h, i) => ({
        name: h.org,
        score: h.overallScore,
        fill: COLORS[i % COLORS.length],
      })),
    [healthScores]
  );

  const handleExportAlerts = () => {
    const header = 'Severity,Type,Message,Organization,User,Created At\n';
    const rows = alerts
      .map((a) => `${a.severity},${a.type},"${a.message}",${a.org},${a.user || ''},${a.createdAt}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-dark-text">Security Analytics</h1>
              <p className="text-dark-text-muted">
                Organization health scores, compliance trends & security alerts
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-4" />
              <p className="text-dark-text-muted">Analyzing your organizations...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-dark-text mb-4">{error}</p>
            <Button onClick={loadAnalytics}>Try Again</Button>
          </Card>
        )}

        {/* No Orgs */}
        {!loading && !error && healthScores.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-dark-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-bold text-dark-text mb-2">No Organizations Found</h2>
            <p className="text-dark-text-muted mb-6">
              Join a GitHub organization to see analytics here.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </Card>
        )}

        {/* Main Content */}
        {!loading && !error && healthScores.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Summary Cards */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <SummaryCard
                icon={<Shield className="w-6 h-6" />}
                label="Avg Health Score"
                value={`${avgScore}%`}
                color={
                  avgScore >= 80
                    ? 'text-green-400'
                    : avgScore >= 60
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }
                bgColor={
                  avgScore >= 80
                    ? 'bg-green-500/10'
                    : avgScore >= 60
                      ? 'bg-yellow-500/10'
                      : 'bg-red-500/10'
                }
              />
              <SummaryCard
                icon={<AlertTriangle className="w-6 h-6" />}
                label="Critical Alerts"
                value={String(criticalCount)}
                color="text-red-400"
                bgColor="bg-red-500/10"
              />
              <SummaryCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Organizations"
                value={String(healthScores.length)}
                color="text-indigo-400"
                bgColor="bg-indigo-500/10"
              />
              <SummaryCard
                icon={<Users className="w-6 h-6" />}
                label="Total Members"
                value={String(totalMembers)}
                color="text-green-400"
                bgColor="bg-green-500/10"
              />
            </motion.div>

            {/* Tab navigation */}
            <motion.div variants={itemVariants} className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveSection('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'overview'
                    ? 'bg-brand-primary text-white'
                    : 'text-dark-text-muted hover:text-dark-text hover:bg-white/5'
                }`}
              >
                Overview Charts
              </button>
              <button
                onClick={() => setActiveSection('alerts')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeSection === 'alerts'
                    ? 'bg-brand-primary text-white'
                    : 'text-dark-text-muted hover:text-dark-text hover:bg-white/5'
                }`}
              >
                Security Alerts
                {alerts.length > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs">
                    {alerts.length}
                  </span>
                )}
              </button>
            </motion.div>

            {/* Charts Section */}
            {activeSection === 'overview' && (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              >
                {/* Health Score Bar Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Organization Health Scores
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={healthScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="org" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" domain={[0, 100]} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#e4e4e7',
                        }}
                        formatter={(value) => [`${value}%`, 'Health Score']}
                      />
                      <Bar dataKey="overallScore" radius={[4, 4, 0, 0]}>
                        {healthScores.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.overallScore >= 80
                                ? '#22c55e'
                                : entry.overallScore >= 60
                                  ? '#f59e0b'
                                  : '#ef4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* 2FA Compliance Pie */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    2FA Compliance by Organization
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={compliancePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={true}
                      >
                        {compliancePieData.map((_, i) => (
                          <Cell key={`pie-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#e4e4e7',
                        }}
                        formatter={(value) => [`${value}%`, 'Compliance']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Radial Score Chart */}
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    Overall Scores Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="20%"
                      outerRadius="90%"
                      barSize={20}
                      data={radialData}
                    >
                      <RadialBar
                        dataKey="score"
                        background={{ fill: '#1f2937' }}
                        label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                      />
                      <Legend
                        iconSize={10}
                        layout="horizontal"
                        verticalAlign="bottom"
                        wrapperStyle={{ color: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#e4e4e7',
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            )}

            {/* Alerts Section */}
            {activeSection === 'alerts' && (
              <motion.div variants={itemVariants}>
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-400" />
                      Security Alerts ({alerts.length})
                    </h3>
                    {alerts.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleExportAlerts}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </div>

                  {/* Severity summary */}
                  <div className="flex gap-4 mb-4">
                    {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                      const count = alerts.filter((a) => a.severity === sev).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={sev}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${SEVERITY_BADGE[sev]}`}
                        >
                          {sev.toUpperCase()}: {count}
                        </span>
                      );
                    })}
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${SEVERITY_STYLES[alert.severity]}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${SEVERITY_BADGE[alert.severity]}`}
                          >
                            {alert.severity}
                          </span>
                          <div>
                            <p className="text-dark-text text-sm">{alert.message}</p>
                            {alert.user && (
                              <a
                                href={`https://github.com/${alert.user}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 text-xs hover:underline"
                              >
                                @{alert.user}
                              </a>
                            )}
                          </div>
                        </div>
                        <span className="text-dark-text-muted text-sm flex-shrink-0">
                          {alert.org}
                        </span>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center text-green-400 py-12">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-semibold">All Clear!</p>
                        <p className="text-dark-text-muted text-sm">
                          No security alerts at this time.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// -- Sub-component --

function SummaryCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-3`}>
        <div className={color}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-dark-text">{value}</p>
      <p className="text-dark-text-muted text-sm">{label}</p>
    </Card>
  );
}
