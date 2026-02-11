import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  RefreshCw,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertTriangle,
  Key,
  LogOut,
  Github,
  Globe,
  Users,
  Lock,
  ChevronRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import githubService, { type GitHubOrg } from '@/services/githubService';
import { oauthService } from '@/services/oauthService';
import { config } from '@/config';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function SettingsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Org access state
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [refreshingOrgs, setRefreshingOrgs] = useState(false);

  // Auth method detection
  const authMethod =
    token?.startsWith('ghp_') || token?.startsWith('github_pat_') ? 'pat' : 'oauth';

  // GitHub OAuth App settings URL
  const clientId = config.github.clientId;
  const githubOrgAccessUrl = `https://github.com/settings/connections/applications/${clientId}`;

  const loadOrgs = useCallback(async () => {
    try {
      const result = await githubService.getUserOrganizations();
      setOrgs(result);
    } catch {
      console.error('Failed to load organizations');
      setOrgs([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setOrgsLoading(true);
      await loadOrgs();
      setOrgsLoading(false);
    };
    init();
  }, [loadOrgs]);

  const handleRefreshOrgs = async () => {
    setRefreshingOrgs(true);
    await loadOrgs();
    setRefreshingOrgs(false);
    toast.success('Organizations refreshed', 'Org list updated from GitHub');
  };

  const handleReauthorize = () => {
    if (!oauthService.isConfigured()) {
      toast.error('OAuth not configured', 'Please contact your administrator');
      return;
    }
    // Re-initiate OAuth flow — GitHub will show the authorize page
    // where the user can grant access to additional orgs
    oauthService.initiateOAuthFlow();
  };

  const handleManageOnGitHub = () => {
    window.open(githubOrgAccessUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl"
    >
      {/* Page header */}
      <motion.div variants={fadeUp}>
        <h2 className="text-lg font-semibold text-dark-text mb-1">Settings</h2>
        <p className="text-sm text-dark-text-muted">
          Manage your account, authentication, and organization access
        </p>
      </motion.div>

      {/* Account Info */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Github className="w-4.5 h-4.5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-text">GitHub Account</h3>
                <p className="text-xs text-dark-text-muted">Your connected GitHub identity</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-14 h-14 rounded-full ring-2 ring-dark-border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xl font-bold">
                  {user?.login?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-text">{user?.name || user?.login}</p>
                <p className="text-xs text-dark-text-muted">@{user?.login}</p>
                {user?.email && <p className="text-xs text-dark-text-muted mt-0.5">{user.email}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={authMethod === 'oauth' ? 'brand' : 'warning'}>
                  {authMethod === 'oauth' ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      OAuth
                    </>
                  ) : (
                    <>
                      <Key className="w-3 h-3 mr-1" />
                      PAT
                    </>
                  )}
                </Badge>
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Organization Access — THE MAIN FEATURE */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-dark-text">Organization Access</h3>
                  <p className="text-xs text-dark-text-muted">
                    Manage which organizations GitSecureOps can access
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshOrgs}
                loading={refreshingOrgs}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
            </div>

            {/* Info banner */}
            <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-200 font-medium">
                    Not seeing all your organizations?
                  </p>
                  <p className="text-xs text-dark-text-muted mt-1">
                    When you first signed in with GitHub, you may have only granted access to some
                    of your organizations. You can grant access to additional organizations below.
                  </p>
                </div>
              </div>
            </div>

            {/* Accessible orgs list */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider mb-3">
                Currently Accessible ({orgs.length})
              </p>

              {orgsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-card/50 border border-dark-border animate-pulse"
                    >
                      <div className="w-8 h-8 rounded-lg bg-dark-border" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-24 h-3 rounded bg-dark-border" />
                        <div className="w-40 h-2.5 rounded bg-dark-border" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orgs.length === 0 ? (
                <div className="p-6 text-center rounded-lg bg-dark-card/30 border border-dark-border border-dashed">
                  <Building2 className="w-8 h-8 text-dark-text-muted mx-auto mb-2" />
                  <p className="text-sm text-dark-text-secondary font-medium">
                    No organizations accessible
                  </p>
                  <p className="text-xs text-dark-text-muted mt-1">
                    Grant access to your organizations using the buttons below
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {orgs.map((org) => (
                    <div
                      key={org.id || org.login}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-card/50 border border-dark-border hover:border-dark-border-light transition-colors"
                    >
                      {org.avatar_url ? (
                        <img
                          src={org.avatar_url}
                          alt={org.login}
                          className="w-8 h-8 rounded-lg ring-1 ring-dark-border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                          {org.login[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-text truncate">{org.login}</p>
                        {org.description && (
                          <p className="text-xs text-dark-text-muted truncate">{org.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-2xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Granted
                        </Badge>
                        <a
                          href={`https://github.com/${org.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark-text-muted hover:text-dark-text transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-5 pt-4 border-t border-dark-border space-y-3">
              <p className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider mb-3">
                Grant Access to More Organizations
              </p>

              {/* Method 1: Manage on GitHub (preferred) */}
              <button
                onClick={handleManageOnGitHub}
                className="w-full flex items-center gap-3 p-3.5 rounded-lg bg-dark-card border border-dark-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                  <Globe className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-dark-text">Manage on GitHub</p>
                  <p className="text-xs text-dark-text-muted">
                    Open GitHub Settings to grant or revoke org access for this app
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-dark-text-muted group-hover:text-brand-400 transition-colors" />
              </button>

              {/* Method 2: Re-authenticate */}
              {authMethod === 'oauth' && (
                <button
                  onClick={handleReauthorize}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg bg-dark-card border border-dark-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-dark-text">
                      Re-authenticate with GitHub
                    </p>
                    <p className="text-xs text-dark-text-muted">
                      Sign in again to update org permissions — you'll be redirected
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dark-text-muted group-hover:text-emerald-400 transition-colors" />
                </button>
              )}

              {/* Tip for PAT users */}
              {authMethod === 'pat' && (
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex gap-2">
                    <Key className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-200 font-medium">
                        Using a Personal Access Token
                      </p>
                      <p className="text-xs text-dark-text-muted mt-1">
                        PATs automatically have access to all your organizations. If you're not
                        seeing an org, ensure your token has the{' '}
                        <code className="px-1 py-0.5 rounded bg-dark-card text-brand-400 text-2xs">
                          read:org
                        </code>{' '}
                        scope, and that{' '}
                        <a
                          href="https://docs.github.com/en/organizations/managing-oauth-access-to-your-organization-data/approving-oauth-apps-for-your-organization"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          SSO authorization
                        </a>{' '}
                        is enabled if the org uses SAML SSO.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-step instructions */}
              <div className="mt-2 p-3 rounded-lg bg-dark-card/50 border border-dark-border">
                <p className="text-xs font-medium text-dark-text-secondary mb-2">
                  How to grant access to more organizations:
                </p>
                <ol className="text-xs text-dark-text-muted space-y-1.5 list-decimal list-inside">
                  <li>
                    Click <span className="text-brand-400 font-medium">"Manage on GitHub"</span>{' '}
                    above
                  </li>
                  <li>Find the organization you want to add</li>
                  <li>
                    Click <span className="text-emerald-400 font-medium">"Grant"</span> next to it
                  </li>
                  <li>
                    Come back here and click{' '}
                    <span className="text-brand-400 font-medium">"Refresh"</span> to see the updated
                    list
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Auth Scopes */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Lock className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-text">Permissions & Scopes</h3>
                <p className="text-xs text-dark-text-muted">
                  What GitSecureOps can access with your token
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  scope: 'repo',
                  label: 'Repository Access',
                  description: 'Read access to repositories, issues, PRs',
                  icon: GitBranchIcon,
                },
                {
                  scope: 'read:org',
                  label: 'Organization Read',
                  description: 'Read org members, teams, and settings',
                  icon: Users,
                },
                {
                  scope: 'user:email',
                  label: 'User Email',
                  description: 'Access your email addresses',
                  icon: MailIcon,
                },
                {
                  scope: 'manage_billing:copilot',
                  label: 'Copilot Billing',
                  description: 'Manage Copilot seat assignments',
                  icon: CreditCardIcon,
                },
              ].map(({ scope, label, description, icon: Icon }) => (
                <div
                  key={scope}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-dark-card/50 border border-dark-border"
                >
                  <Icon className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-dark-text">{label}</p>
                    <p className="text-2xs text-dark-text-muted">{description}</p>
                    <code className="text-2xs text-purple-400/80 mt-0.5 block">{scope}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fadeUp}>
        <Card variant="glass">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-danger-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-danger-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-danger-400">Danger Zone</h3>
                <p className="text-xs text-dark-text-muted">Actions that affect your session</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-danger-500/5 border border-danger-500/20">
              <div>
                <p className="text-sm font-medium text-dark-text">Revoke Access & Sign Out</p>
                <p className="text-xs text-dark-text-muted">
                  Remove all stored credentials and sign out of GitSecureOps
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<LogOut className="w-3.5 h-3.5" />}
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Inline mini-icons for the scope section
function GitBranchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
