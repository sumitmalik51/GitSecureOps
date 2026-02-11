import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserX,
  UserPlus,
  Shield,
  RefreshCw,
  ExternalLink,
  Filter,
  Mail,
  Clock,
  Crown,
  AlertTriangle,
  Search,
  XCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type GitHubUser,
  type GitHubTeam,
  type OrgInvitation,
} from '../services/githubService';

// ── animation ────────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type MemberCategory = 'all' | 'members' | 'outside' | 'invitations' | 'teams';

interface EnrichedMember {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  email?: string;
  category: 'member' | 'outside-collaborator' | 'pending-invite';
  role?: string;
  invitedAt?: string;
  invitedBy?: string;
  invitationId?: number;
}

export default function TeamMembersPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [teams, setTeams] = useState<GitHubTeam[]>([]);
  const [filter, setFilter] = useState<MemberCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');

  // ── boot ───────────────────────────────────────────
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
    if (selectedOrg) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrg]);

  // ── data fetch ─────────────────────────────────────
  async function fetchAll() {
    setLoading(true);
    try {
      const [orgMembers, outside, invitations, orgTeams] = await Promise.all([
        githubService.getOrgMembers(selectedOrg),
        githubService.getOutsideCollaborators(selectedOrg),
        githubService.getOrgInvitations(selectedOrg),
        githubService.getOrgTeams(selectedOrg).catch(() => [] as GitHubTeam[]),
      ]);

      const enriched: EnrichedMember[] = [
        ...orgMembers.map((m: GitHubUser) => ({
          login: m.login,
          avatarUrl: m.avatar_url,
          htmlUrl: m.html_url,
          email: m.email ?? undefined,
          category: 'member' as const,
          role: m.permissions?.admin ? 'admin' : 'member',
        })),
        ...outside.map((m: GitHubUser) => ({
          login: m.login,
          avatarUrl: m.avatar_url,
          htmlUrl: m.html_url,
          email: m.email ?? undefined,
          category: 'outside-collaborator' as const,
          role: 'collaborator',
        })),
        ...invitations.map((inv: OrgInvitation) => ({
          login: inv.login || inv.email || 'unknown',
          avatarUrl: inv.inviter?.avatar_url || '',
          htmlUrl: '',
          email: inv.email ?? undefined,
          category: 'pending-invite' as const,
          role: inv.role,
          invitedAt: inv.created_at,
          invitedBy: inv.inviter?.login,
          invitationId: inv.id,
        })),
      ];

      setMembers(enriched);
      setTeams(orgTeams);
    } catch (err) {
      toast.error('Failed to load members', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── actions ─────────────────────────────────────────
  async function handleRemoveMember(login: string) {
    if (!confirm(`Remove ${login} from ${selectedOrg}?`)) return;
    setActionLoading(login);
    try {
      await githubService.removeOrgMember(selectedOrg, login);
      toast.success('Member removed', `${login} has been removed from ${selectedOrg}`);
      setMembers((prev) => prev.filter((m) => m.login !== login));
    } catch (err) {
      toast.error('Failed to remove member', (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveOutside(login: string) {
    if (!confirm(`Remove outside collaborator ${login}?`)) return;
    setActionLoading(login);
    try {
      await githubService.removeOutsideCollaborator(selectedOrg, login);
      toast.success('Collaborator removed', `${login} removed from ${selectedOrg}`);
      setMembers((prev) => prev.filter((m) => m.login !== login));
    } catch (err) {
      toast.error('Remove failed', (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelInvitation(m: EnrichedMember) {
    if (!m.invitationId) return;
    setActionLoading(m.login);
    try {
      await githubService.cancelOrgInvitation(selectedOrg, m.invitationId);
      toast.success('Invitation cancelled', `Invitation for ${m.login} cancelled`);
      setMembers((prev) => prev.filter((x) => x.invitationId !== m.invitationId));
    } catch (err) {
      toast.error('Failed to cancel invite', (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInvite() {
    if (!inviteUsername.trim()) return;
    setActionLoading('invite');
    try {
      await githubService.addOrgMember(selectedOrg, inviteUsername.trim(), inviteRole);
      toast.success('Invitation sent', `${inviteUsername} invited as ${inviteRole}`);
      setInviteUsername('');
      setShowInvite(false);
      fetchAll();
    } catch (err) {
      toast.error('Invite failed', (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangeRole(login: string, newRole: 'member' | 'admin') {
    setActionLoading(login);
    try {
      await githubService.addOrgMember(selectedOrg, login, newRole);
      toast.success('Role updated', `${login} is now ${newRole}`);
      setMembers((prev) =>
        prev.map((m) => (m.login === login ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      toast.error('Role change failed', (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  // ── derived ─────────────────────────────────────────
  const counts = useMemo(() => {
    const m = members.filter((x) => x.category === 'member').length;
    const o = members.filter((x) => x.category === 'outside-collaborator').length;
    const i = members.filter((x) => x.category === 'pending-invite').length;
    return { members: m, outside: o, invitations: i, teams: teams.length, total: m + o + i };
  }, [members, teams]);

  const filtered = useMemo(() => {
    let list = members;
    if (filter === 'members') list = list.filter((x) => x.category === 'member');
    else if (filter === 'outside') list = list.filter((x) => x.category === 'outside-collaborator');
    else if (filter === 'invitations') list = list.filter((x) => x.category === 'pending-invite');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((x) => x.login.toLowerCase().includes(q) || x.email?.toLowerCase().includes(q));
    }
    return list;
  }, [members, filter, searchQuery]);

  // ── render ──────────────────────────────────────────
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-7xl">
      {/* Top row: org selector + actions */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          {organizations.map((o) => (
            <option key={o.login} value={o.login}>{o.login}</option>
          ))}
        </select>

        <Button size="sm" variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchAll()} loading={loading}>
          Refresh
        </Button>
        <Button size="sm" variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setShowInvite(!showInvite)}>
          Invite Member
        </Button>
      </motion.div>

      {/* Invite form */}
      {showInvite && (
        <motion.div variants={fadeUp}>
          <Card>
            <div className="p-4 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-dark-text-muted mb-1">GitHub Username</label>
                <input
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="octocat"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-text-muted mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button size="sm" variant="primary" loading={actionLoading === 'invite'} onClick={handleInvite}>
                Send Invite
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: counts.members, icon: Users, color: 'text-brand-400' },
          { label: 'Outside Collaborators', value: counts.outside, icon: AlertTriangle, color: 'text-warning-400' },
          { label: 'Pending Invites', value: counts.invitations, icon: Mail, color: 'text-blue-400' },
          { label: 'Teams', value: counts.teams, icon: Shield, color: 'text-purple-400' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-dark-bg ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-text">{loading ? '—' : s.value}</p>
                <p className="text-xs text-dark-text-muted">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-dark-text-muted mr-1" />
          {(['all', 'members', 'outside', 'invitations', 'teams'] as MemberCategory[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-dark-text-muted hover:bg-dark-hover hover:text-dark-text'
              }`}
            >
              {f === 'all' ? 'All' : f === 'members' ? 'Members' : f === 'outside' ? 'Outside' : f === 'invitations' ? 'Invites' : 'Teams'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Teams panel */}
      {filter === 'teams' ? (
        <motion.div variants={fadeUp}>
          <Card>
            <div className="divide-y divide-dark-border">
              {loading ? (
                <div className="p-8 text-center text-dark-text-muted">Loading teams…</div>
              ) : teams.length === 0 ? (
                <div className="p-8 text-center text-dark-text-muted">No teams found</div>
              ) : (
                teams.map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-dark-hover/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-dark-text">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-dark-text-muted mt-0.5">{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{t.permission}</Badge>
                      <span className="text-xs text-dark-text-muted">
                        {t.members_count ?? '?'} members · {t.repos_count ?? '?'} repos
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      ) : (
        /* Members table */
        <motion.div variants={fadeUp}>
          <Card>
            <div className="divide-y divide-dark-border">
              {loading ? (
                <div className="p-8 text-center text-dark-text-muted">Loading members…</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-dark-text-muted">No members match the current filter</div>
              ) : (
                filtered.map((m) => (
                  <div
                    key={`${m.category}-${m.login}`}
                    className="p-4 flex items-center justify-between hover:bg-dark-hover/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.login} className="w-9 h-9 rounded-full ring-1 ring-dark-border" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-dark-hover flex items-center justify-center">
                          <Users className="w-4 h-4 text-dark-text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-dark-text truncate">{m.login}</span>
                          {m.role === 'admin' && (
                            <Crown className="w-3.5 h-3.5 text-warning-400 shrink-0" />
                          )}
                          {m.htmlUrl && (
                            <a href={m.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-dark-text-muted hover:text-brand-400">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {m.email && (
                          <p className="text-xs text-dark-text-muted truncate">{m.email}</p>
                        )}
                        {m.invitedBy && (
                          <p className="text-xs text-dark-text-muted flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Invited by {m.invitedBy}
                            {m.invitedAt && <> · {new Date(m.invitedAt).toLocaleDateString()}</>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Category Badge */}
                      {m.category === 'member' && (
                        <Badge variant="success">Member</Badge>
                      )}
                      {m.category === 'outside-collaborator' && (
                        <Badge variant="warning">Outside</Badge>
                      )}
                      {m.category === 'pending-invite' && (
                        <Badge variant="brand">Pending</Badge>
                      )}

                      {/* Role Badge */}
                      {m.role && m.category === 'member' && (
                        <Badge variant={m.role === 'admin' ? 'danger' : 'outline'}>
                          {m.role}
                        </Badge>
                      )}

                      {/* Actions */}
                      {m.category === 'member' && (
                        <>
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.login, e.target.value as 'member' | 'admin')}
                            disabled={actionLoading === m.login}
                            className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                          <Button
                            size="xs"
                            variant="danger"
                            loading={actionLoading === m.login}
                            icon={<UserX className="w-3.5 h-3.5" />}
                            onClick={() => handleRemoveMember(m.login)}
                          >
                            Remove
                          </Button>
                        </>
                      )}

                      {m.category === 'outside-collaborator' && (
                        <Button
                          size="xs"
                          variant="danger"
                          loading={actionLoading === m.login}
                          icon={<UserX className="w-3.5 h-3.5" />}
                          onClick={() => handleRemoveOutside(m.login)}
                        >
                          Remove
                        </Button>
                      )}

                      {m.category === 'pending-invite' && (
                        <Button
                          size="xs"
                          variant="danger"
                          loading={actionLoading === m.login}
                          icon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleCancelInvitation(m)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Footer summary */}
      {!loading && filter !== 'teams' && (
        <motion.div variants={fadeUp}>
          <p className="text-xs text-dark-text-muted text-center">
            Showing {filtered.length} of {counts.total} people
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
