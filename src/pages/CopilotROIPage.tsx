import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  DollarSign,
  TrendingDown,
  UserX,
  RefreshCw,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, { GitHubOrg, CopilotSeat, CopilotBilling } from '../services/githubService';

const COST_PER_SEAT_MONTH = 19; // USD

interface SeatAnalysis {
  seat: CopilotSeat;
  idleDays: number;
  status: 'active' | 'idle' | 'never-used';
}

export default function CopilotROIPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [billing, setBilling] = useState<CopilotBilling | null>(null);
  const [seats, setSeats] = useState<CopilotSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclaimLoading, setReclaimLoading] = useState<string[]>([]);
  const [idleThreshold, setIdleThreshold] = useState(30);

  useEffect(() => {
    if (!token) return;
    githubService.setToken(token);
    githubService.getUserOrganizations().then((orgs) => {
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0].login);
      } else {
        setLoading(false);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!selectedOrg) return;
    loadData();
  }, [selectedOrg]);

  const loadData = async () => {
    setLoading(true);
    try {
      githubService.setToken(token!);
      const [billingData, seatData] = await Promise.all([
        githubService.getCopilotBilling(selectedOrg).catch(() => null),
        githubService.getCopilotSeats(selectedOrg).catch(() => ({ seats: [], total_seats: 0 })),
      ]);
      setBilling(billingData);
      setSeats(seatData.seats);
    } catch {
      toast.error('Failed to load Copilot data');
    } finally {
      setLoading(false);
    }
  };

  const analysis: SeatAnalysis[] = useMemo(() => {
    const now = Date.now();
    return seats.map((seat) => {
      if (!seat.last_activity_at) {
        return { seat, idleDays: Infinity, status: 'never-used' as const };
      }
      const idleDays = Math.floor((now - new Date(seat.last_activity_at).getTime()) / 86_400_000);
      return {
        seat,
        idleDays,
        status: idleDays >= idleThreshold ? ('idle' as const) : ('active' as const),
      };
    });
  }, [seats, idleThreshold]);

  const activeSeats = analysis.filter((a) => a.status === 'active');
  const idleSeats = analysis.filter((a) => a.status === 'idle');
  const neverUsed = analysis.filter((a) => a.status === 'never-used');
  const wasteSeats = [...idleSeats, ...neverUsed];
  const monthlyWaste = wasteSeats.length * COST_PER_SEAT_MONTH;
  const yearlyWaste = monthlyWaste * 12;
  const utilization = seats.length > 0 ? Math.round((activeSeats.length / seats.length) * 100) : 0;

  const handleReclaim = async (seat: CopilotSeat) => {
    const username = seat.assignee.login;
    const viaTeam = seat.assigning_team;
    const confirmMsg = viaTeam
      ? `Remove ${username} from team "${viaTeam.name}" to revoke their Copilot seat?`
      : `Revoke Copilot seat from ${username}?`;
    if (!confirm(confirmMsg)) return;

    setReclaimLoading((prev) => [...prev, username]);
    try {
      githubService.setToken(token!);
      await githubService.revokeCopilotAccess(selectedOrg, seat);
      setSeats((prev) => prev.filter((s) => s.assignee.login !== username));
      toast.success(
        viaTeam
          ? `Removed ${username} from team "${viaTeam.name}"`
          : `Revoked Copilot seat from ${username}`
      );
    } catch {
      toast.error(
        `Failed to revoke seat from ${username}`,
        viaTeam ? 'Check team admin permissions' : undefined
      );
    } finally {
      setReclaimLoading((prev) => prev.filter((u) => u !== username));
    }
  };

  const handleBulkReclaim = async () => {
    const targets = wasteSeats;
    const directUsers = targets.filter((s) => !s.seat.assigning_team);
    const teamUsers = targets.filter((s) => s.seat.assigning_team);

    const parts: string[] = [];
    if (directUsers.length) parts.push(`${directUsers.length} directly assigned`);
    if (teamUsers.length) parts.push(`${teamUsers.length} team-assigned (will be removed from teams)`);
    if (!confirm(`Revoke Copilot from ${targets.length} idle users (${parts.join(', ')})? This will save ~$${monthlyWaste}/month.`)) return;

    const usernames = targets.map((s) => s.seat.assignee.login);
    setReclaimLoading(usernames);
    try {
      githubService.setToken(token!);
      // Handle each seat appropriately
      await Promise.all(
        targets.map((s) => githubService.revokeCopilotAccess(selectedOrg, s.seat))
      );
      setSeats((prev) => prev.filter((s) => !usernames.includes(s.assignee.login)));
      toast.success(`Revoked ${targets.length} idle Copilot seats`);
    } catch {
      toast.error('Bulk reclaim partially failed', 'Some seats may require manual action');
    } finally {
      setReclaimLoading([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-10 text-center max-w-md">
          <Bot className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Organizations</h2>
          <p className="text-dark-text-muted text-sm">Join a GitHub organization to analyze Copilot ROI.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Org selector + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="form-input bg-dark-card border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm"
          >
            {organizations.map((org) => (
              <option key={org.login} value={org.login}>{org.login}</option>
            ))}
          </select>

          <select
            value={idleThreshold}
            onChange={(e) => setIdleThreshold(Number(e.target.value))}
            className="form-input bg-dark-card border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm"
          >
            <option value={14}>Idle &gt; 14 days</option>
            <option value={30}>Idle &gt; 30 days</option>
            <option value={60}>Idle &gt; 60 days</option>
            <option value={90}>Idle &gt; 90 days</option>
          </select>
        </div>

        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Total Seats</span>
          </div>
          <p className="text-2xl font-bold">{billing?.seat_breakdown.total ?? seats.length}</p>
          <p className="text-xs text-dark-text-muted mt-1">
            ${(billing?.seat_breakdown.total ?? seats.length) * COST_PER_SEAT_MONTH}/month
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Active</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{activeSeats.length}</p>
          <p className="text-xs text-dark-text-muted mt-1">{utilization}% utilization</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Idle / Never Used</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{idleSeats.length + neverUsed.length}</p>
          <p className="text-xs text-dark-text-muted mt-1">
            {idleSeats.length} idle + {neverUsed.length} never used
          </p>
        </Card>

        <Card className="p-5 border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Wasted Spend</span>
          </div>
          <p className="text-2xl font-bold text-red-400">${monthlyWaste}/mo</p>
          <p className="text-xs text-red-400/70 mt-1">${yearlyWaste.toLocaleString()}/year potential savings</p>
        </Card>
      </div>

      {/* Utilization Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Seat Utilization</h3>
          <span className="text-sm font-mono text-dark-text-muted">
            {activeSeats.length}/{seats.length} seats active
          </span>
        </div>
        <div className="h-3 bg-dark-surface rounded-full overflow-hidden flex">
          <motion.div
            className="bg-emerald-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(activeSeats.length / Math.max(seats.length, 1)) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="bg-amber-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(idleSeats.length / Math.max(seats.length, 1)) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          <motion.div
            className="bg-red-500/70 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(neverUsed.length / Math.max(seats.length, 1)) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-dark-text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Idle</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/70" /> Never Used</span>
        </div>
      </Card>

      {/* Bulk Reclaim */}
      {wasteSeats.length > 0 && (
        <Card className="p-5 border-amber-500/20 bg-amber-500/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-semibold text-sm">
                  Reclaim {wasteSeats.length} idle seat{wasteSeats.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-dark-text-muted">
                  Save ${monthlyWaste}/month (${yearlyWaste.toLocaleString()}/year)
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkReclaim}
              disabled={reclaimLoading.length > 0}
            >
              <Zap className="w-4 h-4 mr-1" />
              Reclaim All
            </Button>
          </div>
        </Card>
      )}

      {/* Seat Table */}
      <Card className="overflow-hidden" noPadding>
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">All Seats ({seats.length})</h3>
        </div>

        <div className="divide-y divide-dark-border/50">
          {analysis.length === 0 ? (
            <div className="p-8 text-center text-dark-text-muted text-sm">
              No Copilot seats found for this organization.
            </div>
          ) : (
            analysis
              .sort((a, b) => {
                const order = { 'never-used': 0, idle: 1, active: 2 };
                return order[a.status] - order[b.status];
              })
              .map((item) => (
                <div
                  key={item.seat.assignee.login}
                  className="px-5 py-3 flex items-center justify-between hover:bg-dark-hover/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.seat.assignee.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.seat.assignee.login}</p>
                      <p className="text-xs text-dark-text-muted">
                        {item.status === 'never-used'
                          ? 'Never used'
                          : item.status === 'idle'
                          ? `Last active ${item.idleDays} days ago`
                          : `Active ${item.idleDays === 0 ? 'today' : `${item.idleDays}d ago`}`}
                        {item.seat.last_activity_editor && ` · ${item.seat.last_activity_editor}`}
                        {item.seat.assigning_team && (
                          <span className="ml-1 text-brand-400">· via {item.seat.assigning_team.name}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        item.status === 'active' ? 'success' : item.status === 'idle' ? 'warning' : 'danger'
                      }
                      dot
                    >
                      {item.status === 'never-used' ? 'Never Used' : item.status === 'idle' ? 'Idle' : 'Active'}
                    </Badge>

                    {item.status !== 'active' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleReclaim(item.seat)}
                        disabled={reclaimLoading.includes(item.seat.assignee.login)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1" />
                        {item.seat.assigning_team ? 'Remove from Team' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>
    </div>
  );
}
