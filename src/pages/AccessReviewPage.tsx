import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  UserX,
  Users,
  Mail,
  RefreshCw,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, { GitHubOrg, GitHubUser, OrgInvitation } from '../services/githubService';

interface ReviewEntry {
  type: 'member' | 'outside-collaborator' | 'pending-invite';
  login: string;
  avatarUrl: string;
  email?: string;
  role: string;
  addedAt?: string;
  reviewed: boolean;
  decision: 'keep' | 'revoke' | null;
}

export default function AccessReviewPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'member' | 'outside-collaborator' | 'pending-invite'>('all');
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] = useState(false);

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
  }, [selectedOrg]);

  const loadData = async () => {
    setLoading(true);
    try {
      githubService.setToken(token!);
      const [members, outsiders, invitations] = await Promise.all([
        githubService.getOrgMembers(selectedOrg),
        githubService.getOutsideCollaborators(selectedOrg),
        githubService.getOrgInvitations(selectedOrg),
      ]);

      const memberEntries: ReviewEntry[] = members.map((m: GitHubUser) => ({
        type: 'member',
        login: m.login,
        avatarUrl: m.avatar_url,
        role: 'member',
        reviewed: false,
        decision: null,
      }));

      const outsiderEntries: ReviewEntry[] = outsiders.map((o: GitHubUser) => ({
        type: 'outside-collaborator',
        login: o.login,
        avatarUrl: o.avatar_url,
        role: 'outside collaborator',
        reviewed: false,
        decision: null,
      }));

      const inviteEntries: ReviewEntry[] = invitations.map((i: OrgInvitation) => ({
        type: 'pending-invite',
        login: i.login || i.email || 'unknown',
        avatarUrl: i.inviter?.avatar_url || '',
        email: i.email ?? undefined,
        role: i.role,
        addedAt: i.created_at,
        reviewed: false,
        decision: null,
      }));

      setEntries([...outsiderEntries, ...inviteEntries, ...memberEntries]);
    } catch {
      toast.error('Failed to load access data');
    } finally {
      setLoading(false);
    }
  };

  const updateDecision = (login: string, decision: 'keep' | 'revoke') => {
    setEntries((prev) =>
      prev.map((e) => (e.login === login ? { ...e, decision, reviewed: true } : e))
    );
  };

  const filtered = useMemo(() => {
    let result = entries;
    if (filter !== 'all') result = result.filter((e) => e.type === filter);
    if (showOnlyUnreviewed) result = result.filter((e) => !e.reviewed);
    return result;
  }, [entries, filter, showOnlyUnreviewed]);

  const stats = useMemo(() => {
    const total = entries.length;
    const reviewed = entries.filter((e) => e.reviewed).length;
    const toRevoke = entries.filter((e) => e.decision === 'revoke').length;
    const outsiders = entries.filter((e) => e.type === 'outside-collaborator').length;
    const pending = entries.filter((e) => e.type === 'pending-invite').length;
    return { total, reviewed, toRevoke, outsiders, pending };
  }, [entries]);

  const handleExport = () => {
    const csv = [
      ['Login', 'Type', 'Role', 'Decision', 'Reviewed'].join(','),
      ...entries.map((e) =>
        [e.login, e.type, e.role, e.decision || 'pending', e.reviewed ? 'yes' : 'no'].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-review-${selectedOrg}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Access review exported as CSV');
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
          <ShieldCheck className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Organizations</h2>
          <p className="text-dark-text-muted text-sm">Join a GitHub organization to run access reviews.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex items-center gap-1 bg-dark-surface rounded-lg p-0.5">
            {(['all', 'member', 'outside-collaborator', 'pending-invite'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filter === f
                    ? 'bg-dark-card text-dark-text shadow-sm'
                    : 'text-dark-text-muted hover:text-dark-text'
                }`}
              >
                {f === 'all' ? 'All' : f === 'member' ? 'Members' : f === 'outside-collaborator' ? 'Outside' : 'Invites'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowOnlyUnreviewed(!showOnlyUnreviewed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              showOnlyUnreviewed
                ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-400'
                : 'border-dark-border text-dark-text-muted hover:text-dark-text'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Unreviewed only
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-5 h-5 text-brand-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-dark-text-muted">Total Users</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-400">{stats.reviewed}</p>
          <p className="text-xs text-dark-text-muted">Reviewed</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-400">{stats.toRevoke}</p>
          <p className="text-xs text-dark-text-muted">Flagged for Revoke</p>
        </Card>
        <Card className="p-4 text-center">
          <ExternalLink className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-400">{stats.outsiders}</p>
          <p className="text-xs text-dark-text-muted">Outside Collaborators</p>
        </Card>
        <Card className="p-4 text-center">
          <Mail className="w-5 h-5 text-sky-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-sky-400">{stats.pending}</p>
          <p className="text-xs text-dark-text-muted">Pending Invites</p>
        </Card>
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Review Progress</h3>
          <span className="text-xs text-dark-text-muted font-mono">
            {stats.reviewed}/{stats.total} reviewed
          </span>
        </div>
        <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.reviewed / stats.total) * 100 : 0}%` }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden" noPadding>
        <div className="px-5 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-sm">
            {filter === 'all' ? 'All Users' : filter === 'member' ? 'Members' : filter === 'outside-collaborator' ? 'Outside Collaborators' : 'Pending Invitations'}{' '}
            ({filtered.length})
          </h3>
        </div>

        <div className="divide-y divide-dark-border/50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-dark-text-muted text-sm">No users match this filter.</div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.login + entry.type}
                className={`px-5 py-3 flex items-center justify-between hover:bg-dark-hover/40 transition-colors ${
                  entry.decision === 'revoke' ? 'bg-red-500/[0.03]' : entry.decision === 'keep' ? 'bg-emerald-500/[0.03]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-dark-surface flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-dark-text-muted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{entry.login}</p>
                    <div className="flex items-center gap-2 text-xs text-dark-text-muted">
                      <Badge
                        variant={
                          entry.type === 'member'
                            ? 'default'
                            : entry.type === 'outside-collaborator'
                            ? 'warning'
                            : 'brand'
                        }
                      >
                        {entry.type === 'member'
                          ? 'Member'
                          : entry.type === 'outside-collaborator'
                          ? 'Outside'
                          : 'Invite'}
                      </Badge>
                      <span>{entry.role}</span>
                      {entry.addedAt && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.addedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {entry.reviewed && (
                    <Badge variant={entry.decision === 'keep' ? 'success' : 'danger'} dot>
                      {entry.decision === 'keep' ? 'Approved' : 'Revoke'}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateDecision(entry.login, 'keep')}
                      className={`p-1.5 rounded-md transition-colors ${
                        entry.decision === 'keep'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-dark-text-muted hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title="Keep access"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateDecision(entry.login, 'revoke')}
                      className={`p-1.5 rounded-md transition-colors ${
                        entry.decision === 'revoke'
                          ? 'bg-red-500/20 text-red-400'
                          : 'text-dark-text-muted hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title="Revoke access"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
