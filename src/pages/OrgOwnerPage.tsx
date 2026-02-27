import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  UserPlus,
  Users,
  RefreshCw,
  Shield,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Mail,
  Trash2,
  ArrowDownCircle,
  Info,
  ExternalLink,
  Search,
  Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type GitHubUser,
  type OrgInvitation,
} from '../services/githubService';
import { auditLogService } from '../services/auditLogService';

// ── animation ────────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface OwnerInfo {
  login: string;
  avatar_url: string;
  html_url: string;
  role: string;
  state: string;
}

type AddResultStatus = 'success' | 'invited' | 'error';
interface AddResult {
  username: string;
  status: AddResultStatus;
  message: string;
}

export default function OrgOwnerPage() {
  const { token, user } = useAuth();
  const toast = useToast();

  // ── state ──────────────────────────────────────────
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<OwnerInfo[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [callerIsAdmin, setCallerIsAdmin] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [isEmu, setIsEmu] = useState(false);

  // add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [addResults, setAddResults] = useState<AddResult[]>([]);
  const [addingInProgress, setAddingInProgress] = useState(false);

  // actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove' | 'demote';
    username: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // ── boot: load orgs ──────────────────────────────
  useEffect(() => {
    if (!token) return;
    githubService.setToken(token);
    githubService
      .getUserOrganizations()
      .then((orgs) => {
        setOrganizations(orgs);
        if (orgs.length > 0) setSelectedOrg(orgs[0].login);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // ── fetch data when org changes ──────────────────
  const fetchData = useCallback(async () => {
    if (!selectedOrg || !token) return;
    setLoading(true);
    setPermissionChecked(false);
    setAddResults([]);

    try {
      githubService.setToken(token);

      // Check caller's permission
      let isAdmin = false;
      try {
        const membership = await githubService.getOrgMembership(selectedOrg, user?.login || '');
        isAdmin = membership.role === 'admin';
      } catch {
        isAdmin = false;
      }
      setCallerIsAdmin(isAdmin);
      setPermissionChecked(true);

      // Detect EMU: org members with shortcode_ pattern
      const allMembers = await githubService.getOrgMembers(selectedOrg);
      const emuPattern = /^[a-z0-9]+-_/i;
      const emuCount = allMembers.filter((m: GitHubUser) => emuPattern.test(m.login)).length;
      setIsEmu(emuCount > allMembers.length * 0.5 && allMembers.length > 1);

      // Fetch owners (role=admin)
      const adminMembers = await fetchOrgAdmins(selectedOrg, token);
      setOwners(adminMembers);

      // Fetch pending invitations (admin role only)
      const inv = await githubService.getOrgInvitations(selectedOrg);
      setInvitations(inv.filter((i) => i.role === 'admin'));
    } catch (err) {
      console.error('Failed to fetch org data:', err);
      toast.error('Error', 'Failed to load organization data');
    }
    setLoading(false);
  }, [selectedOrg, token, user, toast]);

  useEffect(() => {
    if (selectedOrg) fetchData();
  }, [selectedOrg, fetchData]);

  // ── fetch admins via /members?role=admin ──────────
  async function fetchOrgAdmins(org: string, tkn: string): Promise<OwnerInfo[]> {
    const res = await fetch(`https://api.github.com/orgs/${org}/members?role=admin&per_page=100`, {
      headers: {
        Authorization: `token ${tkn}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return [];
    const data: GitHubUser[] = await res.json();
    return data.map((m) => ({
      login: m.login,
      avatar_url: m.avatar_url,
      html_url: m.html_url || `https://github.com/${m.login}`,
      role: 'admin',
      state: 'active',
    }));
  }

  // ── add owner ──────────────────────────────────────
  async function handleAddOwner() {
    if (!usernameInput.trim()) return;
    setAddingInProgress(true);
    setAddResults([]);

    const usernames = bulkMode
      ? usernameInput
          .split(/[,\n]+/)
          .map((u) => u.trim())
          .filter(Boolean)
      : [usernameInput.trim()];

    const results: AddResult[] = [];

    for (const username of usernames) {
      try {
        const result = await githubService.addOrgMember(selectedOrg, username, 'admin');
        if (result.state === 'active') {
          results.push({
            username,
            status: 'success',
            message: 'Added as owner immediately',
          });
          toast.success('Owner added', `${username} is now an org owner`);
        } else {
          results.push({
            username,
            status: 'invited',
            message: 'Invitation sent — awaiting acceptance',
          });
          toast.success('Invite sent', `Owner invitation sent to ${username}`);
        }
        auditLogService.log({
          action: 'add_org_owner',
          target: username,
          details: {
            description: `Added ${username} as owner to ${selectedOrg}`,
            state: result.state,
            org: selectedOrg,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ username, status: 'error', message });
        toast.error('Failed', `Could not add ${username}: ${message}`);
      }
    }

    setAddResults(results);
    setAddingInProgress(false);
    setUsernameInput('');
    // Refresh data
    await fetchData();
  }

  // ── demote to member ───────────────────────────────
  async function handleDemote(username: string) {
    setActionLoading(username);
    try {
      await githubService.addOrgMember(selectedOrg, username, 'member');
      toast.success('Demoted', `${username} is now a regular member`);
      auditLogService.log({
        action: 'demote_org_owner',
        target: username,
        details: { description: `Demoted ${username} from owner to member`, org: selectedOrg },
      });
      await fetchData();
    } catch (err) {
      toast.error('Failed', `Could not demote ${username}`);
      console.error(err);
    }
    setActionLoading(null);
    setConfirmAction(null);
  }

  // ── remove from org ────────────────────────────────
  async function handleRemove(username: string) {
    setActionLoading(username);
    try {
      await githubService.removeOrgMember(selectedOrg, username);
      toast.success('Removed', `${username} has been removed from ${selectedOrg}`);
      auditLogService.log({
        action: 'remove_org_owner',
        target: username,
        details: { description: `Removed ${username} from org`, org: selectedOrg },
      });
      await fetchData();
    } catch (err) {
      toast.error('Failed', `Could not remove ${username}`);
      console.error(err);
    }
    setActionLoading(null);
    setConfirmAction(null);
  }

  // ── cancel invitation ──────────────────────────────
  async function handleCancelInvite(inv: OrgInvitation) {
    setActionLoading(String(inv.id));
    try {
      await githubService.cancelOrgInvitation(selectedOrg, inv.id);
      toast.success('Cancelled', `Invitation to ${inv.login || inv.email} cancelled`);
      await fetchData();
    } catch (err) {
      toast.error('Failed', 'Could not cancel invitation');
      console.error(err);
    }
    setActionLoading(null);
  }

  // ── filter owners ──────────────────────────────────
  const filteredOwners = owners.filter(
    (o) => !searchQuery || o.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── render ─────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-dark-text-muted">Please log in to manage org owners.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 p-6 max-w-6xl mx-auto"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            Org Owner Management
          </h1>
          <p className="text-dark-text-muted mt-1">
            Add, remove, and manage organization owners across your GitHub orgs
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </motion.div>

      {/* Org Selector */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-dark-text-secondary">Organization:</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none min-w-[200px]"
            >
              {organizations.map((org) => (
                <option key={org.login} value={org.login}>
                  {org.login}
                </option>
              ))}
            </select>

            {/* Status badges */}
            <div className="flex items-center gap-2 ml-auto">
              {permissionChecked && (
                <Badge variant={callerIsAdmin ? 'success' : 'warning'}>
                  {callerIsAdmin ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" /> You are Owner
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" /> Read-only
                    </>
                  )}
                </Badge>
              )}
              {isEmu && (
                <Badge variant="brand">
                  <Users className="w-3 h-3 mr-1" /> EMU Org
                </Badge>
              )}
              <Badge variant="default">
                <Crown className="w-3 h-3 mr-1" /> {owners.length} owner
                {owners.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* EMU Notice */}
      {isEmu && (
        <motion.div variants={fadeUp}>
          <Card className="border-brand-500/30 bg-brand-500/5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-brand-400">Enterprise Managed Users Detected</p>
                <p className="text-dark-text-secondary mt-1">
                  This appears to be an EMU org. Users must exist in your enterprise before they can
                  be added. Consider using <strong>SCIM provisioning</strong> via your IdP (Entra ID
                  / Okta) for automated owner management. Invitations may not be required for
                  managed users.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Permission Warning */}
      {permissionChecked && !callerIsAdmin && (
        <motion.div variants={fadeUp}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-400">Limited Permissions</p>
                <p className="text-dark-text-secondary mt-1">
                  You are not an owner of <strong>{selectedOrg}</strong>. You can view current
                  owners but cannot add or remove them. Contact an existing org owner or authorize
                  your token with the <code>admin:org</code> scope.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-amber-400">{owners.length}</div>
          <div className="text-xs text-dark-text-muted mt-1">Current Owners</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-400">{invitations.length}</div>
          <div className="text-xs text-dark-text-muted mt-1">Pending Invites</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">{callerIsAdmin ? 'Yes' : 'No'}</div>
          <div className="text-xs text-dark-text-muted mt-1">Can Manage</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-400">{isEmu ? 'EMU' : 'Standard'}</div>
          <div className="text-xs text-dark-text-muted mt-1">Org Type</div>
        </Card>
      </motion.div>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
            <span className="text-dark-text-muted">Loading organization data…</span>
          </div>
        </Card>
      ) : (
        <>
          {/* Add Owner Section */}
          {callerIsAdmin && (
            <motion.div variants={fadeUp}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-400" />
                    Add Owner
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBulkMode(!bulkMode)}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        bulkMode
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'bg-dark-hover text-dark-text-muted hover:text-dark-text'
                      }`}
                    >
                      {bulkMode ? 'Bulk Mode' : 'Single'}
                    </button>
                    {!showAddForm && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<UserPlus className="w-4 h-4" />}
                        onClick={() => setShowAddForm(true)}
                      >
                        Add Owner
                      </Button>
                    )}
                  </div>
                </div>

                {showAddForm && (
                  <div className="space-y-4">
                    {bulkMode ? (
                      <div>
                        <label className="text-sm text-dark-text-secondary block mb-1">
                          Usernames (comma or newline separated)
                        </label>
                        <textarea
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder={'user1, user2, user3\nor one per line'}
                          rows={4}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder-dark-text-muted focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none font-mono"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm text-dark-text-secondary block mb-1">
                          GitHub Username
                        </label>
                        <input
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddOwner()}
                          placeholder="Enter GitHub username"
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder-dark-text-muted focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddOwner}
                        disabled={!usernameInput.trim() || addingInProgress}
                        icon={
                          addingInProgress ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Crown className="w-4 h-4" />
                          )
                        }
                      >
                        {addingInProgress ? 'Adding…' : `Add as Owner`}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddForm(false);
                          setUsernameInput('');
                          setAddResults([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Results */}
                    {addResults.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-medium text-dark-text-muted uppercase tracking-wider">
                          Results
                        </p>
                        {addResults.map((r) => (
                          <div
                            key={r.username}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              r.status === 'success'
                                ? 'bg-green-500/10 text-green-400'
                                : r.status === 'invited'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {r.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 shrink-0" />
                            ) : r.status === 'invited' ? (
                              <Mail className="w-4 h-4 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span className="font-medium">{r.username}</span>
                            <span className="text-xs opacity-75">{r.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card>
                <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Pending Owner Invitations
                  <Badge variant="brand">{invitations.length}</Badge>
                </h2>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50 border border-dark-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark-text">
                            {inv.login || inv.email || 'Unknown'}
                          </p>
                          <p className="text-xs text-dark-text-muted">
                            Invited by {inv.inviter.login} ·{' '}
                            {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {callerIsAdmin && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleCancelInvite(inv)}
                          disabled={actionLoading === String(inv.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Current Owners */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Current Owners
                  <Badge variant="default">{owners.length}</Badge>
                </h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter owners…"
                    className="pl-9 pr-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-text-muted focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-48"
                  />
                </div>
              </div>

              {filteredOwners.length === 0 ? (
                <div className="text-center py-8 text-dark-text-muted">
                  {owners.length === 0
                    ? 'No owners found (you may not have permission to view them)'
                    : 'No owners match your filter'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOwners.map((owner) => {
                    const isSelf = owner.login === user?.login;
                    return (
                      <div
                        key={owner.login}
                        className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50 border border-dark-border/50 hover:border-dark-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={owner.avatar_url}
                            alt={owner.login}
                            className="w-10 h-10 rounded-full ring-2 ring-amber-500/30"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <a
                                href={owner.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-dark-text hover:text-brand-400 transition-colors flex items-center gap-1"
                              >
                                {owner.login}
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                              {isSelf && <Badge variant="brand">You</Badge>}
                            </div>
                            <p className="text-xs text-dark-text-muted flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              Organization Owner
                            </p>
                          </div>
                        </div>

                        {/* Actions (only for admins, not for self) */}
                        {callerIsAdmin && !isSelf && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={<ArrowDownCircle className="w-3.5 h-3.5" />}
                              onClick={() =>
                                setConfirmAction({ type: 'demote', username: owner.login })
                              }
                              disabled={actionLoading === owner.login}
                            >
                              Demote
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              onClick={() =>
                                setConfirmAction({ type: 'remove', username: owner.login })
                              }
                              disabled={actionLoading === owner.login}
                            >
                              Remove
                            </Button>
                          </div>
                        )}

                        {actionLoading === owner.login && (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-md w-full mx-4 shadow-elevated-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmAction.type === 'remove' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                }`}
              >
                {confirmAction.type === 'remove' ? (
                  <Trash2 className="w-5 h-5 text-red-400" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-text">
                  {confirmAction.type === 'remove' ? 'Remove Owner' : 'Demote Owner'}
                </h3>
                <p className="text-sm text-dark-text-muted">
                  {confirmAction.type === 'remove'
                    ? `Remove ${confirmAction.username} from ${selectedOrg} entirely?`
                    : `Demote ${confirmAction.username} to regular member?`}
                </p>
              </div>
            </div>

            {confirmAction.type === 'remove' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <p className="text-xs text-red-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  This will remove the user from the organization completely. They will lose access
                  to all org repos and teams. This action cannot be undone.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmAction.type === 'remove' ? 'danger' : 'primary'}
                size="sm"
                onClick={() =>
                  confirmAction.type === 'remove'
                    ? handleRemove(confirmAction.username)
                    : handleDemote(confirmAction.username)
                }
                disabled={actionLoading === confirmAction.username}
                icon={
                  actionLoading === confirmAction.username ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : undefined
                }
              >
                {confirmAction.type === 'remove' ? 'Remove' : 'Demote to Member'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
