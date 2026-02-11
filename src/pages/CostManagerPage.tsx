import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  RefreshCw,
  Users,
  Bot,
  Zap,
  HardDrive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Monitor,
  Calendar,
  ArrowUpRight,
  Minus,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type ActionsBilling,
  type CopilotBilling,
  type CopilotSeat,
  type CopilotUsageDay,
  type StorageBilling,
  type PackagesBilling,
} from '../services/githubService';

// GitHub Enterprise Cloud pricing (per user / month)
const PRICING = {
  enterprise: 21, // $21/user/month for Enterprise Cloud
  copilotBusiness: 19, // $19/user/month for Copilot Business
  copilotEnterprise: 39, // $39/user/month for Copilot Enterprise
  actionsRatePerMin: {
    UBUNTU: 0.008,
    MACOS: 0.08,
    WINDOWS: 0.016,
  } as Record<string, number>,
  storagePricePerGB: 0.25, // $/GB/month for shared storage overage
  packagesBandwidthPerGB: 0.5, // $/GB for packages bandwidth overage
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface CostBreakdown {
  category: string;
  monthlyCost: number;
  icon: React.ElementType;
  detail: string;
  color: string;
}

export default function CostManagerPage() {
  const { token } = useAuth();
  const { error: showError } = useToast();

  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Billing data
  const [memberCount, setMemberCount] = useState(0);
  const [copilotBilling, setCopilotBilling] = useState<CopilotBilling | null>(null);
  const [copilotSeats, setCopilotSeats] = useState<CopilotSeat[]>([]);
  const [actionsBilling, setActionsBilling] = useState<ActionsBilling | null>(null);
  const [copilotUsage, setCopilotUsage] = useState<CopilotUsageDay[]>([]);
  const [storageBilling, setStorageBilling] = useState<StorageBilling | null>(null);
  const [packagesBilling, setPackagesBilling] = useState<PackagesBilling | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'copilot' | 'actions' | 'seats'>(
    'overview'
  );

  useEffect(() => {
    if (!token) return;
    githubService.setToken(token);
    githubService.getUserOrganizations().then((orgs) => {
      setOrganizations(orgs);
      if (orgs.length > 0) setSelectedOrg(orgs[0].login);
    });
  }, [token]);

  const loadBillingData = async (org: string) => {
    if (!org) return;
    setLoading(true);
    try {
      const [
        members,
        copBilling,
        copSeatsResult,
        actBilling,
        copUsageResult,
        storResult,
        pkgResult,
      ] = await Promise.allSettled([
        githubService.getOrgMembers(org),
        githubService.getCopilotBilling(org),
        githubService.getCopilotSeats(org),
        githubService.getActionsBilling(org),
        githubService.getCopilotUsageMetrics(org),
        githubService.getStorageBilling(org),
        githubService.getPackagesBilling(org),
      ]);

      if (members.status === 'fulfilled') setMemberCount(members.value.length);
      if (copBilling.status === 'fulfilled') setCopilotBilling(copBilling.value);
      if (copSeatsResult.status === 'fulfilled') setCopilotSeats(copSeatsResult.value.seats);
      if (actBilling.status === 'fulfilled') setActionsBilling(actBilling.value);
      if (copUsageResult.status === 'fulfilled') setCopilotUsage(copUsageResult.value);
      if (storResult.status === 'fulfilled') setStorageBilling(storResult.value);
      if (pkgResult.status === 'fulfilled') setPackagesBilling(pkgResult.value);
    } catch (err) {
      showError('Failed to load billing data', String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) loadBillingData(selectedOrg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrg]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBillingData(selectedOrg);
    setRefreshing(false);
  };

  // Computed costs
  const costs = useMemo((): CostBreakdown[] => {
    const items: CostBreakdown[] = [];

    // Enterprise seats cost
    items.push({
      category: 'Enterprise Seats',
      monthlyCost: memberCount * PRICING.enterprise,
      icon: Users,
      detail: `${memberCount} members × $${PRICING.enterprise}/mo`,
      color: 'text-blue-400',
    });

    // Copilot seats cost (PAYG = per seated user)
    const copilotTotal = copilotBilling?.seat_breakdown?.total || 0;
    items.push({
      category: 'Copilot Business',
      monthlyCost: copilotTotal * PRICING.copilotBusiness,
      icon: Bot,
      detail: `${copilotTotal} seats × $${PRICING.copilotBusiness}/mo`,
      color: 'text-purple-400',
    });

    // Actions minutes cost
    if (actionsBilling) {
      const actionsCost = Object.entries(actionsBilling.minutes_used_breakdown).reduce(
        (sum, [os, minutes]) => sum + (minutes || 0) * (PRICING.actionsRatePerMin[os] || 0.008),
        0
      );
      items.push({
        category: 'Actions Minutes',
        monthlyCost: actionsCost,
        icon: Zap,
        detail: `${Math.round(actionsBilling.total_minutes_used).toLocaleString()} min used (${Math.round(actionsBilling.total_paid_minutes_used || 0).toLocaleString()} paid)`,
        color: 'text-amber-400',
      });
    }

    // Storage cost
    if (storageBilling) {
      const storOverage = Math.max(0, storageBilling.estimated_paid_storage_for_month);
      items.push({
        category: 'Shared Storage',
        monthlyCost: storOverage * PRICING.storagePricePerGB,
        icon: HardDrive,
        detail: `${storageBilling.estimated_storage_for_month.toFixed(1)} GB used (${storOverage.toFixed(1)} GB paid overage)`,
        color: 'text-emerald-400',
      });
    }

    // Packages cost
    if (packagesBilling) {
      const pkgOverage = Math.max(0, packagesBilling.total_paid_gigabytes_bandwidth_used);
      items.push({
        category: 'Packages Bandwidth',
        monthlyCost: pkgOverage * PRICING.packagesBandwidthPerGB,
        icon: HardDrive,
        detail: `${packagesBilling.total_gigabytes_bandwidth_used.toFixed(1)} GB (${pkgOverage.toFixed(1)} GB paid overage)`,
        color: 'text-cyan-400',
      });
    }

    return items;
  }, [memberCount, copilotBilling, actionsBilling, storageBilling, packagesBilling]);

  const totalMonthlyCost = useMemo(() => costs.reduce((s, c) => s + c.monthlyCost, 0), [costs]);

  // Copilot utilization stats
  const copilotStats = useMemo(() => {
    const total = copilotBilling?.seat_breakdown?.total || 0;
    const active = copilotBilling?.seat_breakdown?.active_this_cycle || 0;
    const inactive = copilotBilling?.seat_breakdown?.inactive_this_cycle || 0;
    const pending = copilotBilling?.seat_breakdown?.pending_invitation || 0;
    const pendingCancel = copilotBilling?.seat_breakdown?.pending_cancellation || 0;
    const utilizationPct = total > 0 ? Math.round((active / total) * 100) : 0;
    const wasteCost = inactive * PRICING.copilotBusiness;
    return { total, active, inactive, pending, pendingCancel, utilizationPct, wasteCost };
  }, [copilotBilling]);

  // Actions cost by OS
  const actionsCostByOS = useMemo(() => {
    if (!actionsBilling) return [];
    return Object.entries(actionsBilling.minutes_used_breakdown)
      .map(([os, minutes]) => ({
        os,
        minutes: minutes || 0,
        cost: (minutes || 0) * (PRICING.actionsRatePerMin[os] || 0.008),
        rate: PRICING.actionsRatePerMin[os] || 0.008,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [actionsBilling]);

  // Copilot usage trend (from metrics API)
  const usageTrend = useMemo(() => {
    if (copilotUsage.length < 2) return { direction: 'neutral' as const, change: 0 };
    const recent = copilotUsage.slice(-7);
    const prior = copilotUsage.slice(-14, -7);
    const recentAvg = recent.reduce((s, d) => s + d.total_active_users, 0) / (recent.length || 1);
    const priorAvg = prior.reduce((s, d) => s + d.total_active_users, 0) / (prior.length || 1);
    if (priorAvg === 0) return { direction: 'neutral' as const, change: 0 };
    const pct = Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
    return {
      direction: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('neutral' as const),
      change: Math.abs(pct),
    };
  }, [copilotUsage]);

  // Inactive Copilot seat details
  const inactiveSeats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return copilotSeats.filter((s) => {
      if (!s.last_activity_at) return true;
      return new Date(s.last_activity_at) < thirtyDaysAgo;
    });
  }, [copilotSeats]);

  const tabs = [
    { id: 'overview' as const, label: 'Cost Overview' },
    { id: 'copilot' as const, label: 'Copilot Costs' },
    { id: 'actions' as const, label: 'Actions Costs' },
    { id: 'seats' as const, label: 'Seat Management' },
  ];

  if (loading && !organizations.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header controls */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {organizations.map((o) => (
              <option key={o.login} value={o.login}>
                {o.login}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            loading={refreshing}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>

        <Badge variant="brand">
          <Calendar className="w-3 h-3 mr-1" />
          Current billing cycle
        </Badge>
      </motion.div>

      {/* Total Cost Banner */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dark-text-muted mb-1">
                  Estimated Monthly Cost
                </p>
                <p className="text-4xl font-bold text-dark-text">
                  $
                  {totalMonthlyCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-dark-text-secondary mt-1">
                  ${(totalMonthlyCost * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  /year projected
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-6">
                {costs.slice(0, 3).map((c) => (
                  <div key={c.category} className="text-center">
                    <c.icon className={`w-5 h-5 ${c.color} mx-auto mb-1`} />
                    <p className="text-xs text-dark-text-muted">{c.category}</p>
                    <p className="text-sm font-semibold text-dark-text">
                      ${c.monthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tab navigation */}
      <motion.div variants={fadeUp} className="flex gap-1 border-b border-dark-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-dark-text-muted hover:text-dark-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        </div>
      ) : (
        <>
          {/* ─── OVERVIEW TAB ────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
              {/* Cost breakdown cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {costs.map((c) => (
                  <motion.div key={c.category} variants={fadeUp}>
                    <Card variant="elevated">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-lg bg-dark-hover flex items-center justify-center`}
                          >
                            <c.icon className={`w-5 h-5 ${c.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-text">{c.category}</p>
                            <p className="text-xs text-dark-text-muted truncate">{c.detail}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-dark-text">
                          $
                          {c.monthlyCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          <span className="text-xs font-normal text-dark-text-muted ml-1">/mo</span>
                        </p>
                        {/* Percentage of total */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-dark-text-muted">Share of total</span>
                            <span className="text-dark-text-secondary">
                              {totalMonthlyCost > 0
                                ? Math.round((c.monthlyCost / totalMonthlyCost) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 bg-dark-hover rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all"
                              style={{
                                width: `${totalMonthlyCost > 0 ? Math.round((c.monthlyCost / totalMonthlyCost) * 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Cost savings opportunities */}
              {copilotStats.wasteCost > 0 && (
                <motion.div variants={fadeUp}>
                  <Card variant="glass">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-dark-text mb-1">
                            Potential Savings: ${copilotStats.wasteCost.toLocaleString()}/mo
                          </h3>
                          <p className="text-xs text-dark-text-secondary">
                            {copilotStats.inactive} Copilot seats are inactive this billing cycle.
                            Reclaiming them would save ${copilotStats.wasteCost.toLocaleString()}
                            /month (${(copilotStats.wasteCost * 12).toLocaleString()}/year).
                          </p>
                          <Button
                            size="xs"
                            variant="outline"
                            className="mt-2"
                            onClick={() => setActiveTab('seats')}
                          >
                            View Inactive Seats
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Cost distribution chart (simple bar) */}
              <motion.div variants={fadeUp}>
                <Card variant="default">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-brand-400" />
                      Cost Distribution
                    </h3>
                    <div className="space-y-3">
                      {costs.map((c) => {
                        const pct =
                          totalMonthlyCost > 0 ? (c.monthlyCost / totalMonthlyCost) * 100 : 0;
                        return (
                          <div key={c.category}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-dark-text-secondary flex items-center gap-1.5">
                                <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                                {c.category}
                              </span>
                              <span className="text-dark-text font-medium">
                                $
                                {c.monthlyCost.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                                <span className="text-dark-text-muted ml-1">
                                  ({pct.toFixed(1)}%)
                                </span>
                              </span>
                            </div>
                            <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full bg-brand-500 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COPILOT COSTS TAB ───────────────────────────────── */}
          {activeTab === 'copilot' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
              {/* Copilot stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Total Seats
                      </p>
                      <p className="text-2xl font-bold text-dark-text mt-1">{copilotStats.total}</p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        ${(copilotStats.total * PRICING.copilotBusiness).toLocaleString()}/mo
                      </p>
                    </div>
                  </Card>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Active Seats
                      </p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {copilotStats.active}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {usageTrend.direction === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : usageTrend.direction === 'down' ? (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        ) : (
                          <Minus className="w-3 h-3 text-dark-text-muted" />
                        )}
                        <span
                          className={`text-xs ${usageTrend.direction === 'up' ? 'text-emerald-400' : usageTrend.direction === 'down' ? 'text-red-400' : 'text-dark-text-muted'}`}
                        >
                          {usageTrend.change}% vs prior week
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Utilization
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${copilotStats.utilizationPct >= 70 ? 'text-emerald-400' : copilotStats.utilizationPct >= 40 ? 'text-amber-400' : 'text-red-400'}`}
                      >
                        {copilotStats.utilizationPct}%
                      </p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        of assigned seats active
                      </p>
                    </div>
                  </Card>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Wasted Cost
                      </p>
                      <p className="text-2xl font-bold text-red-400 mt-1">
                        ${copilotStats.wasteCost.toLocaleString()}
                      </p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        {copilotStats.inactive} inactive seats
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Seat breakdown */}
              <motion.div variants={fadeUp}>
                <Card variant="default">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-dark-text mb-4">Seat Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Total', value: copilotStats.total, color: 'text-dark-text' },
                        { label: 'Active', value: copilotStats.active, color: 'text-emerald-400' },
                        { label: 'Inactive', value: copilotStats.inactive, color: 'text-red-400' },
                        {
                          label: 'Pending Invite',
                          value: copilotStats.pending,
                          color: 'text-amber-400',
                        },
                        {
                          label: 'Pending Cancel',
                          value: copilotStats.pendingCancel,
                          color: 'text-orange-400',
                        },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-3 bg-dark-hover rounded-lg">
                          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-dark-text-muted mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Copilot daily usage trend */}
              {copilotUsage.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Card variant="default">
                    <div className="p-5">
                      <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-purple-400" />
                        Daily Active Users (Last {copilotUsage.length} days)
                      </h3>
                      <div className="flex items-end gap-[2px] h-32">
                        {copilotUsage.map((day, i) => {
                          const max = Math.max(...copilotUsage.map((d) => d.total_active_users), 1);
                          const heightPct = (day.total_active_users / max) * 100;
                          return (
                            <div
                              key={day.date}
                              className="flex-1 group relative"
                              title={`${day.date}: ${day.total_active_users} active, ${day.total_engaged_users} engaged`}
                            >
                              <motion.div
                                className="bg-brand-500/60 hover:bg-brand-400 rounded-sm transition-colors cursor-default"
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPct}%` }}
                                transition={{ duration: 0.4, delay: i * 0.01 }}
                              />
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-card border border-dark-border rounded text-[10px] text-dark-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-elevated">
                                <div className="font-medium">{day.date}</div>
                                <div>{day.total_active_users} active</div>
                                <div>{day.total_engaged_users} engaged</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-dark-text-muted">
                        <span>{copilotUsage[0]?.date}</span>
                        <span>{copilotUsage[copilotUsage.length - 1]?.date}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Per-user cost analysis */}
              <motion.div variants={fadeUp}>
                <Card variant="default">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-dark-text mb-1">
                      Cost per Active User
                    </h3>
                    <p className="text-xs text-dark-text-muted mb-4">
                      Effective cost including wasted seats on inactive users
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-dark-hover rounded-lg text-center">
                        <p className="text-xs text-dark-text-muted">List Price / Seat</p>
                        <p className="text-xl font-bold text-dark-text mt-1">
                          ${PRICING.copilotBusiness}
                        </p>
                      </div>
                      <div className="p-4 bg-dark-hover rounded-lg text-center">
                        <p className="text-xs text-dark-text-muted">Effective / Active User</p>
                        <p className="text-xl font-bold text-amber-400 mt-1">
                          $
                          {copilotStats.active > 0
                            ? (
                                (copilotStats.total * PRICING.copilotBusiness) /
                                copilotStats.active
                              ).toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                      <div className="p-4 bg-dark-hover rounded-lg text-center">
                        <p className="text-xs text-dark-text-muted">Overpay per User</p>
                        <p className="text-xl font-bold text-red-400 mt-1">
                          +$
                          {copilotStats.active > 0
                            ? (
                                (copilotStats.total * PRICING.copilotBusiness) /
                                  copilotStats.active -
                                PRICING.copilotBusiness
                              ).toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* ─── ACTIONS COSTS TAB ───────────────────────────────── */}
          {activeTab === 'actions' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
              {/* Actions summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Total Minutes
                      </p>
                      <p className="text-2xl font-bold text-dark-text mt-1">
                        {Math.round(actionsBilling?.total_minutes_used || 0).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Included Minutes
                      </p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {(actionsBilling?.included_minutes || 0).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Paid Minutes
                      </p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        {Math.round(actionsBilling?.total_paid_minutes_used || 0).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Card variant="elevated">
                    <div className="p-4">
                      <p className="text-xs text-dark-text-muted uppercase tracking-wider">
                        Est. Cost
                      </p>
                      <p className="text-2xl font-bold text-dark-text mt-1">
                        $
                        {actionsCostByOS
                          .reduce((s, o) => s + o.cost, 0)
                          .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Cost by runner OS */}
              <motion.div variants={fadeUp}>
                <Card variant="default">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Cost by Runner OS
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-border">
                            <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Runner
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Minutes
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Rate/min
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Cost
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Share
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionsCostByOS.map((o) => {
                            const totalActionsCost = actionsCostByOS.reduce(
                              (s, x) => s + x.cost,
                              0
                            );
                            return (
                              <tr
                                key={o.os}
                                className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors"
                              >
                                <td className="py-2.5 px-3 font-medium text-dark-text">
                                  <Badge
                                    variant={
                                      o.os === 'UBUNTU'
                                        ? 'success'
                                        : o.os === 'MACOS'
                                          ? 'brand'
                                          : 'warning'
                                    }
                                  >
                                    {o.os}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right text-dark-text-secondary">
                                  {Math.round(o.minutes).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-right text-dark-text-secondary">
                                  ${o.rate.toFixed(3)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium text-dark-text">
                                  $
                                  {o.cost.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2.5 px-3 text-right text-dark-text-muted">
                                  {totalActionsCost > 0
                                    ? Math.round((o.cost / totalActionsCost) * 100)
                                    : 0}
                                  %
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Storage & Packages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storageBilling && (
                  <motion.div variants={fadeUp}>
                    <Card variant="default">
                      <div className="p-5">
                        <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-emerald-400" />
                          Shared Storage
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Estimated this month</span>
                            <span className="text-dark-text font-medium">
                              {storageBilling.estimated_storage_for_month.toFixed(1)} GB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Paid overage</span>
                            <span className="text-dark-text font-medium">
                              {storageBilling.estimated_paid_storage_for_month.toFixed(1)} GB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Days left in cycle</span>
                            <span className="text-dark-text font-medium">
                              {storageBilling.days_left_in_billing_cycle}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-dark-border/50">
                            <span className="text-dark-text-secondary font-medium">Est. Cost</span>
                            <span className="text-dark-text font-bold">
                              $
                              {(
                                storageBilling.estimated_paid_storage_for_month *
                                PRICING.storagePricePerGB
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {packagesBilling && (
                  <motion.div variants={fadeUp}>
                    <Card variant="default">
                      <div className="p-5">
                        <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-cyan-400" />
                          Packages Bandwidth
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Total bandwidth</span>
                            <span className="text-dark-text font-medium">
                              {packagesBilling.total_gigabytes_bandwidth_used.toFixed(1)} GB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Included allowance</span>
                            <span className="text-dark-text font-medium">
                              {packagesBilling.included_gigabytes_bandwidth} GB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-text-secondary">Paid overage</span>
                            <span className="text-dark-text font-medium">
                              {packagesBilling.total_paid_gigabytes_bandwidth_used.toFixed(1)} GB
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-dark-border/50">
                            <span className="text-dark-text-secondary font-medium">Est. Cost</span>
                            <span className="text-dark-text font-bold">
                              $
                              {(
                                packagesBilling.total_paid_gigabytes_bandwidth_used *
                                PRICING.packagesBandwidthPerGB
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── SEAT MANAGEMENT TAB ─────────────────────────────── */}
          {activeTab === 'seats' && (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
              {/* Enterprise seat summary */}
              <motion.div variants={fadeUp}>
                <Card variant="glass">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Enterprise Seat Costs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-dark-hover rounded-lg text-center">
                        <p className="text-xs text-dark-text-muted">Total Members</p>
                        <p className="text-2xl font-bold text-dark-text mt-1">{memberCount}</p>
                      </div>
                      <div className="p-4 bg-dark-hover rounded-lg text-center">
                        <p className="text-xs text-dark-text-muted">Monthly Cost</p>
                        <p className="text-2xl font-bold text-dark-text mt-1">
                          ${(memberCount * PRICING.enterprise).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-dark-hover rounded-lg text-center">
                        <p className="text-xs text-dark-text-muted">Annual Cost</p>
                        <p className="text-2xl font-bold text-dark-text mt-1">
                          ${(memberCount * PRICING.enterprise * 12).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Inactive Copilot seats table */}
              <motion.div variants={fadeUp}>
                <Card variant="default">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Inactive Copilot Seats ({inactiveSeats.length})
                      </h3>
                      <Badge variant="danger">
                        ${(inactiveSeats.length * PRICING.copilotBusiness).toLocaleString()}/mo
                        waste
                      </Badge>
                    </div>

                    {inactiveSeats.length === 0 ? (
                      <p className="text-sm text-dark-text-muted text-center py-6">
                        No inactive Copilot seats found — great utilization!
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-border">
                              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                                User
                              </th>
                              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                                Assigned Via
                              </th>
                              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                                Last Active
                              </th>
                              <th className="text-left py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                                Last Editor
                              </th>
                              <th className="text-right py-2.5 px-3 text-xs font-medium text-dark-text-muted uppercase">
                                Cost/mo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {inactiveSeats.slice(0, 25).map((seat) => (
                              <tr
                                key={seat.assignee.login}
                                className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors"
                              >
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={seat.assignee.avatar_url}
                                      alt={seat.assignee.login}
                                      className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-dark-text font-medium">
                                      {seat.assignee.login}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-dark-text-secondary">
                                  {seat.assigning_team ? (
                                    <Badge variant="outline">{seat.assigning_team.name}</Badge>
                                  ) : (
                                    <span className="text-dark-text-muted">Direct</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-dark-text-secondary">
                                  {seat.last_activity_at
                                    ? new Date(seat.last_activity_at).toLocaleDateString()
                                    : 'Never'}
                                </td>
                                <td className="py-2.5 px-3 text-dark-text-secondary">
                                  {seat.last_activity_editor || 'N/A'}
                                </td>
                                <td className="py-2.5 px-3 text-right text-red-400 font-medium">
                                  ${PRICING.copilotBusiness}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {inactiveSeats.length > 25 && (
                          <p className="text-xs text-dark-text-muted text-center py-2">
                            Showing 25 of {inactiveSeats.length} inactive seats
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* GitHub pricing reference */}
              <motion.div variants={fadeUp}>
                <Card variant="default">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-brand-400" />
                      GitHub Enterprise Pricing Reference
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-border">
                            <th className="text-left py-2 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Product
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Price
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-dark-text-muted uppercase">
                              Billing
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-text-secondary">
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Enterprise Cloud</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.enterprise}/user
                            </td>
                            <td className="py-2 px-3">Per month</td>
                          </tr>
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Copilot Business</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.copilotBusiness}/user
                            </td>
                            <td className="py-2 px-3">Per month, prorated daily</td>
                          </tr>
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Copilot Enterprise</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.copilotEnterprise}/user
                            </td>
                            <td className="py-2 px-3">Per month, prorated daily</td>
                          </tr>
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Actions (Ubuntu)</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.actionsRatePerMin.UBUNTU}/min
                            </td>
                            <td className="py-2 px-3">Per minute (overage)</td>
                          </tr>
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Actions (macOS)</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.actionsRatePerMin.MACOS}/min
                            </td>
                            <td className="py-2 px-3">10× Linux multiplier</td>
                          </tr>
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Actions (Windows)</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.actionsRatePerMin.WINDOWS}/min
                            </td>
                            <td className="py-2 px-3">2× Linux multiplier</td>
                          </tr>
                          <tr className="border-b border-dark-border/50">
                            <td className="py-2 px-3">Shared Storage</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.storagePricePerGB}/GB
                            </td>
                            <td className="py-2 px-3">Per month (overage)</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">Packages Bandwidth</td>
                            <td className="py-2 px-3 text-right text-dark-text font-medium">
                              ${PRICING.packagesBandwidthPerGB}/GB
                            </td>
                            <td className="py-2 px-3">Per GB (overage)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-dark-text-muted mt-3">
                      * Prices are approximate list prices for GitHub Enterprise Cloud as of 2025.
                      Actual costs may vary based on your agreement.
                      <a
                        href="https://github.com/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:underline ml-1 inline-flex items-center gap-0.5"
                      >
                        View latest pricing <ArrowUpRight className="w-3 h-3" aria-hidden />
                      </a>
                    </p>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
