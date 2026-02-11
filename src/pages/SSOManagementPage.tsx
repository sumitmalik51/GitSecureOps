import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Users,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Link2,
  Unlink,
  Activity,
  Key,
  Terminal,
  Globe,
  Info,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type GitHubUser,
  type SAMLIdentity,
  type AuditLogEntry,
  type OrgSettings,
  type CredentialAuthorization,
} from '../services/githubService';

// ── animation ────────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type IdentityFilter = 'all' | 'linked' | 'unlinked' | 'scim' | 'no-2fa';

interface MemberSSOStatus {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  samlLinked: boolean;
  samlNameId: string | null;
  scimProvisioned: boolean;
  scimUsername: string | null;
  has2FA: boolean;
}

export default function SSOManagementPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'identities' | 'audit' | 'pat-auth'>('overview');

  // Data
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<MemberSSOStatus[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [samlAvailable, setSamlAvailable] = useState<boolean | null>(null);

  // PAT SSO Authorization
  const [credentialAuths, setCredentialAuths] = useState<CredentialAuthorization[]>([]);
  const [tokenSSOStatus, setTokenSSOStatus] = useState<{
    authorized: boolean;
    ssoRequired: boolean;
  } | null>(null);
  const [patLoading, setPatLoading] = useState(false);
  const [patSearchQuery, setPatSearchQuery] = useState('');
  const [patTypeFilter, setPatTypeFilter] = useState<
    'all' | 'personal access token' | 'SSH key' | 'SSH certificate' | 'GitHub App'
  >('all');

  // Filters
  const [filter, setFilter] = useState<IdentityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    setSamlAvailable(null);
    try {
      const [settings, samlIdentities, members2FA, audit] = await Promise.all([
        githubService.getOrgSettings(selectedOrg),
        githubService.getSAMLIdentities(selectedOrg),
        githubService.getMembers2FAStatus(selectedOrg),
        githubService.getSSO_AuditLog(selectedOrg).catch(() => [] as AuditLogEntry[]),
      ]);

      setOrgSettings(settings);
      setAuditEntries(audit);
      setSamlAvailable(samlIdentities.length > 0);

      // Build combined member status
      const allMembers = [...members2FA.enabled, ...members2FA.disabled];
      const disabledSet = new Set(members2FA.disabled.map((u) => u.login));
      const samlMap = new Map<string, SAMLIdentity>();
      for (const id of samlIdentities) {
        if (id.githubLogin) samlMap.set(id.githubLogin, id);
      }

      const statuses: MemberSSOStatus[] = allMembers.map((m: GitHubUser) => {
        const saml = samlMap.get(m.login);
        return {
          login: m.login,
          avatarUrl: m.avatar_url,
          htmlUrl: m.html_url,
          samlLinked: !!saml,
          samlNameId: saml?.samlNameId || null,
          scimProvisioned: !!saml?.scimUsername,
          scimUsername: saml?.scimUsername || null,
          has2FA: !disabledSet.has(m.login),
        };
      });

      setMemberStatuses(statuses);
    } catch (err) {
      toast.error('Failed to load SSO data', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPATAuth() {
    if (!selectedOrg) return;
    setPatLoading(true);
    try {
      const [creds, ssoStatus] = await Promise.all([
        githubService.getCredentialAuthorizations(selectedOrg),
        githubService.checkTokenSSOAuthorization(selectedOrg),
      ]);
      setCredentialAuths(creds);
      setTokenSSOStatus(ssoStatus);
    } catch (err) {
      toast.error('Failed to load PAT authorizations', (err as Error).message);
    } finally {
      setPatLoading(false);
    }
  }

  // ── derived ─────────────────────────────────────────
  const counts = useMemo(() => {
    const total = memberStatuses.length;
    const linked = memberStatuses.filter((m) => m.samlLinked).length;
    const unlinked = memberStatuses.filter((m) => !m.samlLinked).length;
    const scim = memberStatuses.filter((m) => m.scimProvisioned).length;
    const no2fa = memberStatuses.filter((m) => !m.has2FA).length;
    const complianceScore =
      total > 0 ? Math.round(((linked + (total - no2fa)) / (total * 2)) * 100) : 0;
    return { total, linked, unlinked, scim, no2fa, complianceScore };
  }, [memberStatuses]);

  const filtered = useMemo(() => {
    let list = memberStatuses;
    if (filter === 'linked') list = list.filter((m) => m.samlLinked);
    else if (filter === 'unlinked') list = list.filter((m) => !m.samlLinked);
    else if (filter === 'scim') list = list.filter((m) => m.scimProvisioned);
    else if (filter === 'no-2fa') list = list.filter((m) => !m.has2FA);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.login.toLowerCase().includes(q) ||
          m.samlNameId?.toLowerCase().includes(q) ||
          m.scimUsername?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [memberStatuses, filter, searchQuery]);

  // ── render ──────────────────────────────────────────
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl"
    >
      {/* Top row: org selector + actions */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
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
          onClick={() => fetchAll()}
          loading={loading}
        >
          Refresh
        </Button>

        <a
          href={`https://github.com/organizations/${selectedOrg}/settings/security`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto"
        >
          <Button size="sm" variant="ghost" icon={<ExternalLink className="w-4 h-4" />}>
            GitHub SSO Settings
          </Button>
        </a>
      </motion.div>

      {/* Tab bar */}
      <motion.div variants={fadeUp} className="flex gap-1 border-b border-dark-border pb-px">
        {(
          [
            { key: 'overview', label: 'Overview', icon: ShieldCheck },
            { key: 'identities', label: 'Identities', icon: Users },
            { key: 'pat-auth', label: 'PAT Authorization', icon: KeyRound },
            { key: 'audit', label: 'SSO Audit Log', icon: Activity },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.key
                ? 'bg-dark-card text-brand-400 border-b-2 border-brand-500'
                : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-hover/50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* ──────────── OVERVIEW TAB ──────────── */}
      {tab === 'overview' && (
        <>
          {/* Summary cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Members', value: counts.total, icon: Users, color: 'text-brand-400' },
              {
                label: 'SAML Linked',
                value: counts.linked,
                icon: Link2,
                color: 'text-success-400',
              },
              {
                label: 'Not Linked',
                value: counts.unlinked,
                icon: Unlink,
                color: counts.unlinked > 0 ? 'text-warning-400' : 'text-dark-text-muted',
              },
              {
                label: 'Auth Score',
                value: `${counts.complianceScore}%`,
                icon: ShieldCheck,
                color:
                  counts.complianceScore >= 80
                    ? 'text-success-400'
                    : counts.complianceScore >= 50
                      ? 'text-warning-400'
                      : 'text-danger-400',
              },
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

          {/* Org SSO Configuration */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-brand-400" />
                  Organization Security Configuration
                </h3>
                {loading ? (
                  <p className="text-sm text-dark-text-muted">Loading…</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 2FA Requirement */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg">
                      {orgSettings?.two_factor_requirement_enabled ? (
                        <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark-text">2FA Requirement</p>
                        <p className="text-xs text-dark-text-muted">
                          {orgSettings?.two_factor_requirement_enabled
                            ? 'Enforced for all members'
                            : 'Not enforced — security risk'}
                        </p>
                      </div>
                    </div>

                    {/* SAML SSO */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg">
                      {samlAvailable ? (
                        <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                      ) : samlAvailable === false ? (
                        <ShieldAlert className="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-dark-text-muted shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark-text">SAML SSO</p>
                        <p className="text-xs text-dark-text-muted">
                          {samlAvailable
                            ? `${counts.linked} of ${counts.total} identities linked`
                            : samlAvailable === false
                              ? 'No SAML identities found — configure in GitHub Enterprise settings'
                              : 'Checking…'}
                        </p>
                      </div>
                    </div>

                    {/* SCIM Provisioning */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg">
                      {counts.scim > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark-text">SCIM Provisioning</p>
                        <p className="text-xs text-dark-text-muted">
                          {counts.scim > 0
                            ? `${counts.scim} users provisioned via SCIM`
                            : 'No SCIM provisioning detected — users managed manually'}
                        </p>
                      </div>
                    </div>

                    {/* Members without 2FA */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg">
                      {counts.no2fa === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark-text">Members without 2FA</p>
                        <p className="text-xs text-dark-text-muted">
                          {counts.no2fa === 0
                            ? 'All members have 2FA enabled'
                            : `${counts.no2fa} member${counts.no2fa > 1 ? 's' : ''} without 2FA — compliance gap`}
                        </p>
                      </div>
                    </div>

                    {/* Default Repo Permission */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg">
                      {orgSettings?.default_repository_permission === 'none' ||
                      orgSettings?.default_repository_permission === 'read' ? (
                        <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-dark-text">Default Permission</p>
                        <p className="text-xs text-dark-text-muted">
                          Base:{' '}
                          <span className="font-medium text-dark-text">
                            {orgSettings?.default_repository_permission || 'unknown'}
                          </span>
                          {orgSettings?.default_repository_permission === 'write' ||
                          orgSettings?.default_repository_permission === 'admin'
                            ? ' — consider restricting'
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Plan */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg">
                      <KeyRound className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-dark-text">GitHub Plan</p>
                        <p className="text-xs text-dark-text-muted capitalize">
                          {orgSettings?.plan?.name || 'Unknown'}
                          {orgSettings?.plan?.name === 'free' &&
                            ' — SAML SSO requires Enterprise Cloud'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Compliance Gaps */}
          {!loading && (counts.unlinked > 0 || counts.no2fa > 0) && (
            <motion.div variants={fadeUp}>
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning-400" />
                    Compliance Gaps
                  </h3>
                  <div className="space-y-2">
                    {counts.unlinked > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-warning-400/5 border border-warning-400/20">
                        <div className="flex items-center gap-2">
                          <Unlink className="w-4 h-4 text-warning-400" />
                          <span className="text-sm text-dark-text">
                            <span className="font-semibold">{counts.unlinked}</span> member
                            {counts.unlinked > 1 ? 's' : ''} without SAML identity linked
                          </span>
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setTab('identities');
                            setFilter('unlinked');
                          }}
                        >
                          View
                        </Button>
                      </div>
                    )}
                    {counts.no2fa > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-danger-400/5 border border-danger-400/20">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-danger-400" />
                          <span className="text-sm text-dark-text">
                            <span className="font-semibold">{counts.no2fa}</span> member
                            {counts.no2fa > 1 ? 's' : ''} without two-factor authentication
                          </span>
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setTab('identities');
                            setFilter('no-2fa');
                          }}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Setup Guide (when no SAML detected) */}
          {!loading && samlAvailable === false && (
            <motion.div variants={fadeUp}>
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-400" />
                    How to Configure SAML SSO
                  </h3>
                  <div className="space-y-3 text-sm text-dark-text-secondary">
                    <p>
                      SAML SSO requires{' '}
                      <span className="text-dark-text font-medium">GitHub Enterprise Cloud</span>.
                      Here's how to set it up:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 pl-1">
                      <li>
                        Go to{' '}
                        <a
                          href={`https://github.com/organizations/${selectedOrg}/settings/security`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:underline"
                        >
                          Organization Settings → Authentication security
                        </a>
                      </li>
                      <li>
                        Under "SAML single sign-on", click{' '}
                        <span className="text-dark-text font-medium">
                          Enable SAML authentication
                        </span>
                      </li>
                      <li>
                        Configure your Identity Provider (Azure AD, Okta, OneLogin, PingIdentity)
                      </li>
                      <li>
                        Enter the <span className="text-dark-text font-medium">Sign on URL</span>,{' '}
                        <span className="text-dark-text font-medium">Issuer</span>, and{' '}
                        <span className="text-dark-text font-medium">Public certificate</span> from
                        your IdP
                      </li>
                      <li>
                        Test the configuration, then{' '}
                        <span className="text-dark-text font-medium">Require SAML SSO</span> for all
                        members
                      </li>
                      <li>
                        <span className="text-dark-text font-medium">Optional:</span> Enable SCIM
                        provisioning for automated user lifecycle management
                      </li>
                    </ol>
                    <div className="flex gap-2 pt-2">
                      <a
                        href="https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          GitHub SAML Docs
                        </Button>
                      </a>
                      <a
                        href="https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/about-scim-for-organizations"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          SCIM Setup Guide
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* ──────────── IDENTITIES TAB ──────────── */}
      {tab === 'identities' && (
        <>
          {/* Filter bar */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or SAML identity…"
                className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-dark-text-muted mr-1" />
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'linked', label: 'SAML Linked' },
                  { key: 'unlinked', label: 'Not Linked' },
                  { key: 'scim', label: 'SCIM' },
                  { key: 'no-2fa', label: 'No 2FA' },
                ] as { key: IdentityFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === f.key
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-dark-text-muted hover:bg-dark-hover hover:text-dark-text'
                  }`}
                >
                  {f.label}
                  {f.key !== 'all' && (
                    <span className="ml-1 opacity-60">
                      (
                      {f.key === 'linked'
                        ? counts.linked
                        : f.key === 'unlinked'
                          ? counts.unlinked
                          : f.key === 'scim'
                            ? counts.scim
                            : counts.no2fa}
                      )
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Members List */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="divide-y divide-dark-border">
                {/* Header */}
                <div className="px-5 py-3 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-dark-text-muted bg-dark-bg/50">
                  <span className="flex-1 min-w-[160px]">Member</span>
                  <span className="w-40 hidden sm:block">SAML Identity</span>
                  <span className="w-32 hidden md:block">SCIM</span>
                  <span className="w-20 text-center">2FA</span>
                  <span className="w-20 text-center">Status</span>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-dark-text-muted">Loading identity data…</div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-dark-text-muted">
                    No members match the current filter
                  </div>
                ) : (
                  filtered.map((m) => (
                    <div
                      key={m.login}
                      className="px-5 py-3 flex items-center gap-4 hover:bg-dark-hover/40 transition-colors"
                    >
                      {/* Avatar + Username */}
                      <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                        <img
                          src={m.avatarUrl}
                          alt={m.login}
                          className="w-8 h-8 rounded-full ring-1 ring-dark-border"
                        />
                        <div className="min-w-0">
                          <a
                            href={m.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-dark-text hover:text-brand-400 truncate block"
                          >
                            {m.login}
                          </a>
                        </div>
                      </div>

                      {/* SAML Name ID */}
                      <div className="w-40 hidden sm:block">
                        {m.samlLinked ? (
                          <span
                            className="text-xs text-dark-text truncate block"
                            title={m.samlNameId || ''}
                          >
                            {m.samlNameId || 'Linked'}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-text-muted">—</span>
                        )}
                      </div>

                      {/* SCIM */}
                      <div className="w-32 hidden md:block">
                        {m.scimProvisioned ? (
                          <span
                            className="text-xs text-dark-text truncate block"
                            title={m.scimUsername || ''}
                          >
                            {m.scimUsername || 'Yes'}
                          </span>
                        ) : (
                          <span className="text-xs text-dark-text-muted">—</span>
                        )}
                      </div>

                      {/* 2FA */}
                      <div className="w-20 flex justify-center">
                        {m.has2FA ? (
                          <CheckCircle2 className="w-4 h-4 text-success-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger-400" />
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="w-20 flex justify-center">
                        {m.samlLinked && m.has2FA ? (
                          <Badge variant="success">Secure</Badge>
                        ) : !m.has2FA ? (
                          <Badge variant="danger">At Risk</Badge>
                        ) : (
                          <Badge variant="warning">Partial</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          {/* Footer count */}
          {!loading && (
            <motion.div variants={fadeUp}>
              <p className="text-xs text-dark-text-muted text-center">
                Showing {filtered.length} of {counts.total} members
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* ──────────── PAT AUTHORIZATION TAB ──────────── */}
      {tab === 'pat-auth' &&
        (() => {
          // Load PAT data on first visit to this tab
          if (!patLoading && credentialAuths.length === 0 && tokenSSOStatus === null) {
            fetchPATAuth();
          }

          const credTypeIcon = (t: string) => {
            if (t.includes('personal access token')) return Key;
            if (t.includes('SSH')) return Terminal;
            return Globe;
          };

          const filteredCreds = credentialAuths.filter((c) => {
            if (patTypeFilter !== 'all' && c.credential_type !== patTypeFilter) return false;
            if (patSearchQuery) {
              const q = patSearchQuery.toLowerCase();
              return (
                c.login.toLowerCase().includes(q) ||
                (c.authorized_credential_title || '').toLowerCase().includes(q) ||
                (c.authorized_credential_note || '').toLowerCase().includes(q) ||
                (c.token_last_eight || '').includes(q)
              );
            }
            return true;
          });

          const credTypes = [...new Set(credentialAuths.map((c) => c.credential_type))];

          const timeAgo = (dateStr: string | null) => {
            if (!dateStr) return 'Never';
            const ms = Date.now() - new Date(dateStr).getTime();
            const d = Math.floor(ms / 86400000);
            if (d > 30) return `${Math.floor(d / 30)}mo ago`;
            if (d > 0) return `${d}d ago`;
            const h = Math.floor(ms / 3600000);
            return h > 0 ? `${h}h ago` : 'Just now';
          };

          return (
            <>
              {/* Current Token SSO Status Banner */}
              <motion.div variants={fadeUp}>
                <Card
                  className={`border ${
                    tokenSSOStatus === null
                      ? 'border-dark-border'
                      : tokenSSOStatus.ssoRequired && !tokenSSOStatus.authorized
                        ? 'border-danger-400/40 bg-danger-400/5'
                        : 'border-success-400/40 bg-success-400/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        tokenSSOStatus === null
                          ? 'bg-dark-hover text-dark-text-muted'
                          : tokenSSOStatus.ssoRequired && !tokenSSOStatus.authorized
                            ? 'bg-danger-500/10 text-danger-400'
                            : 'bg-success-500/10 text-success-400'
                      }`}
                    >
                      {tokenSSOStatus === null ? (
                        <Clock className="w-5 h-5" />
                      ) : tokenSSOStatus.ssoRequired && !tokenSSOStatus.authorized ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-dark-text mb-1">
                        {patLoading
                          ? 'Checking your token SSO authorization…'
                          : tokenSSOStatus?.ssoRequired && !tokenSSOStatus?.authorized
                            ? 'Your PAT is NOT authorized for SSO'
                            : 'Your PAT is authorized for this organization'}
                      </h3>
                      <p className="text-xs text-dark-text-muted">
                        {patLoading
                          ? 'Testing API access to the selected organization…'
                          : tokenSSOStatus?.ssoRequired && !tokenSSOStatus?.authorized
                            ? `Your personal access token needs SSO authorization for ${selectedOrg}. Without it, API calls to this org will fail with 403 errors.`
                            : tokenSSOStatus?.ssoRequired
                              ? `SSO is enabled for ${selectedOrg} and your token is authorized.`
                              : `${selectedOrg} does not appear to require SAML SSO for API access.`}
                      </p>
                      {tokenSSOStatus?.ssoRequired && !tokenSSOStatus?.authorized && (
                        <div className="mt-3 flex gap-2">
                          <a
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                            >
                              Authorize Token for SSO
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* How PAT SSO Authorization Works */}
              <motion.div variants={fadeUp}>
                <Card>
                  <div className="flex items-start gap-3 mb-4">
                    <Info className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-dark-text mb-2">
                        How PAT SSO Authorization Works
                      </h3>
                      <div className="space-y-2 text-xs text-dark-text-muted">
                        <p>
                          When an organization enforces{' '}
                          <span className="text-dark-text font-medium">SAML SSO</span>, personal
                          access tokens and SSH keys must be{' '}
                          <span className="text-dark-text font-medium">
                            individually authorized
                          </span>{' '}
                          for that org. Without authorization, API calls targeting the org will
                          return <span className="text-dark-text font-medium">403 Forbidden</span>.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-3 pt-2">
                          <div className="p-3 rounded-lg bg-dark-bg">
                            <p className="text-dark-text font-medium mb-1">Step 1</p>
                            <p>
                              Go to{' '}
                              <a
                                href="https://github.com/settings/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-400 hover:underline"
                              >
                                GitHub → Settings → Tokens
                              </a>
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-dark-bg">
                            <p className="text-dark-text font-medium mb-1">Step 2</p>
                            <p>
                              Find your token and click{' '}
                              <span className="text-dark-text font-medium">
                                &quot;Configure SSO&quot;
                              </span>{' '}
                              next to it
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-dark-bg">
                            <p className="text-dark-text font-medium mb-1">Step 3</p>
                            <p>
                              Click{' '}
                              <span className="text-dark-text font-medium">
                                &quot;Authorize&quot;
                              </span>{' '}
                              next to the org name to grant access
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Credential Authorizations List */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dark-text">
                    Authorized Credentials ({credentialAuths.length})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RefreshCw className={`w-4 h-4 ${patLoading ? 'animate-spin' : ''}`} />}
                    onClick={() => fetchPATAuth()}
                    loading={patLoading}
                  >
                    Refresh
                  </Button>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
                    <input
                      value={patSearchQuery}
                      onChange={(e) => setPatSearchQuery(e.target.value)}
                      placeholder="Search by user, title, or token suffix…"
                      className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Filter className="w-4 h-4 text-dark-text-muted mr-1" />
                    <button
                      onClick={() => setPatTypeFilter('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        patTypeFilter === 'all'
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'text-dark-text-muted hover:bg-dark-hover hover:text-dark-text'
                      }`}
                    >
                      All
                    </button>
                    {credTypes.map((ct) => (
                      <button
                        key={ct}
                        onClick={() => setPatTypeFilter(ct as typeof patTypeFilter)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          patTypeFilter === ct
                            ? 'bg-brand-500/20 text-brand-400'
                            : 'text-dark-text-muted hover:bg-dark-hover hover:text-dark-text'
                        }`}
                      >
                        {ct}
                        <span className="ml-1 opacity-60">
                          ({credentialAuths.filter((c) => c.credential_type === ct).length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {patLoading ? (
                  <Card>
                    <p className="text-sm text-dark-text-muted py-4">
                      Loading credential authorizations…
                    </p>
                  </Card>
                ) : credentialAuths.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <Key className="w-10 h-10 text-dark-text-muted mx-auto mb-3 opacity-40" />
                      <p className="text-sm text-dark-text-muted">
                        No SSO-authorized credentials found
                      </p>
                      <p className="text-xs text-dark-text-muted mt-1">
                        This can mean SSO isn&apos;t enforced, or you don&apos;t have admin access
                        to view credential authorizations.
                      </p>
                      <a
                        href={`https://github.com/organizations/${selectedOrg}/settings/security`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Check Org Security Settings
                        </Button>
                      </a>
                    </div>
                  </Card>
                ) : (
                  <Card noPadding>
                    <div className="divide-y divide-dark-border">
                      {/* Header */}
                      <div className="px-5 py-3 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-dark-text-muted bg-dark-bg/50">
                        <span className="w-8" />
                        <span className="flex-1 min-w-[120px]">User</span>
                        <span className="flex-1 min-w-[160px] hidden sm:block">Credential</span>
                        <span className="w-28 hidden md:block">Type</span>
                        <span className="w-24 hidden lg:block">Authorized</span>
                        <span className="w-24 hidden lg:block">Last Used</span>
                        <span className="w-20 text-center">Scopes</span>
                      </div>

                      {filteredCreds.map((cred) => {
                        const CredIcon = credTypeIcon(cred.credential_type);
                        const isExpired = cred.authorized_credential_expires_at
                          ? new Date(cred.authorized_credential_expires_at) < new Date()
                          : false;

                        return (
                          <div
                            key={`${cred.credential_id}-${cred.login}`}
                            className="px-5 py-3 flex items-center gap-4 hover:bg-dark-hover/40 transition-colors"
                          >
                            {/* Type Icon */}
                            <div className="w-8 flex justify-center">
                              <div className="p-1.5 rounded-lg bg-dark-bg">
                                <CredIcon className="w-3.5 h-3.5 text-dark-text-muted" />
                              </div>
                            </div>

                            {/* User */}
                            <div className="flex-1 min-w-[120px]">
                              <p className="text-sm font-medium text-dark-text">{cred.login}</p>
                              {cred.token_last_eight && (
                                <p className="text-xs text-dark-text-muted font-mono">
                                  •••{cred.token_last_eight}
                                </p>
                              )}
                            </div>

                            {/* Credential Title/Note */}
                            <div className="flex-1 min-w-[160px] hidden sm:block">
                              <p className="text-sm text-dark-text truncate">
                                {cred.authorized_credential_title ||
                                  cred.authorized_credential_note ||
                                  '(untitled)'}
                              </p>
                              {cred.fingerprint && (
                                <p className="text-xs text-dark-text-muted font-mono truncate">
                                  {cred.fingerprint}
                                </p>
                              )}
                            </div>

                            {/* Type */}
                            <div className="w-28 hidden md:block">
                              <Badge
                                variant={
                                  cred.credential_type.includes('personal') ? 'brand' : 'outline'
                                }
                              >
                                {cred.credential_type.includes('personal')
                                  ? 'PAT'
                                  : cred.credential_type.includes('SSH key')
                                    ? 'SSH Key'
                                    : cred.credential_type.includes('SSH cert')
                                      ? 'SSH Cert'
                                      : 'App'}
                              </Badge>
                              {isExpired && (
                                <Badge variant="danger" className="ml-1">
                                  Expired
                                </Badge>
                              )}
                            </div>

                            {/* Authorized date */}
                            <div className="w-24 hidden lg:block">
                              <p className="text-xs text-dark-text-muted">
                                {timeAgo(cred.credential_authorized_at)}
                              </p>
                            </div>

                            {/* Last accessed */}
                            <div className="w-24 hidden lg:block">
                              <p
                                className={`text-xs ${cred.credential_accessed_at ? 'text-dark-text-muted' : 'text-warning-400'}`}
                              >
                                {timeAgo(cred.credential_accessed_at)}
                              </p>
                            </div>

                            {/* Scopes */}
                            <div className="w-20 text-center">
                              {cred.scopes && cred.scopes.length > 0 ? (
                                <span
                                  className="text-xs text-dark-text-muted"
                                  title={cred.scopes.join(', ')}
                                >
                                  {cred.scopes.length} scope{cred.scopes.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-xs text-dark-text-muted">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Footer count */}
                    <div className="px-5 py-3 border-t border-dark-border">
                      <p className="text-xs text-dark-text-muted text-center">
                        Showing {filteredCreds.length} of {credentialAuths.length} authorized
                        credentials
                      </p>
                    </div>
                  </Card>
                )}

                {/* Summary Stats */}
                {!patLoading && credentialAuths.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-dark-text tabular-nums">
                          {credentialAuths.length}
                        </p>
                        <p className="text-xs text-dark-text-muted mt-1">Total Authorized</p>
                      </div>
                    </Card>
                    <Card>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-brand-400 tabular-nums">
                          {
                            credentialAuths.filter((c) => c.credential_type.includes('personal'))
                              .length
                          }
                        </p>
                        <p className="text-xs text-dark-text-muted mt-1">PATs</p>
                      </div>
                    </Card>
                    <Card>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-dark-text tabular-nums">
                          {credentialAuths.filter((c) => c.credential_type.includes('SSH')).length}
                        </p>
                        <p className="text-xs text-dark-text-muted mt-1">SSH Keys/Certs</p>
                      </div>
                    </Card>
                    <Card>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning-400 tabular-nums">
                          {credentialAuths.filter((c) => !c.credential_accessed_at).length}
                        </p>
                        <p className="text-xs text-dark-text-muted mt-1">Never Used</p>
                      </div>
                    </Card>
                  </div>
                )}
              </motion.div>
            </>
          );
        })()}

      {/* ──────────── AUDIT TAB ──────────── */}
      {tab === 'audit' && (
        <motion.div variants={fadeUp}>
          <Card>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                SSO-Related Audit Events
              </h3>
              {loading ? (
                <p className="text-sm text-dark-text-muted">Loading audit log…</p>
              ) : auditEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-dark-text-muted mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-dark-text-muted">No SSO audit events found</p>
                  <p className="text-xs text-dark-text-muted mt-1">
                    SSO audit events require GitHub Enterprise Cloud and SAML to be configured.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-dark-border/50">
                  {auditEntries.map((entry, idx) => {
                    const time = entry['@timestamp']
                      ? new Date(entry['@timestamp']).toLocaleString()
                      : entry.created_at
                        ? new Date(entry.created_at).toLocaleString()
                        : 'Unknown time';

                    const actionParts = entry.action.split('.');
                    const actionLabel = actionParts[actionParts.length - 1]
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                      <div key={`${entry.action}-${idx}`} className="py-3 flex items-start gap-3">
                        <div className="p-1.5 rounded bg-dark-bg mt-0.5">
                          {entry.action.includes('enable') ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success-400" />
                          ) : entry.action.includes('disable') ? (
                            <XCircle className="w-3.5 h-3.5 text-danger-400" />
                          ) : (
                            <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-dark-text">
                            <span className="font-medium">{actionLabel}</span>
                            {entry.actor && (
                              <span className="text-dark-text-muted"> by {entry.actor}</span>
                            )}
                            {entry.user && entry.user !== entry.actor && (
                              <span className="text-dark-text-muted"> on {entry.user}</span>
                            )}
                          </p>
                          <p className="text-xs text-dark-text-muted flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {time}
                            {entry.actor_location?.country_code && (
                              <span className="ml-2">📍 {entry.actor_location.country_code}</span>
                            )}
                          </p>
                        </div>
                        <Badge variant="outline">{entry.action}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
