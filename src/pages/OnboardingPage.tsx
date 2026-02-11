import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  GitBranch,
  Users,
  RefreshCw,
  CheckCircle,
  Package,
  Send,
  X,
  Search,
  Shield,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, {
  type GitHubOrg,
  type GitHubRepo,
  type GitHubTeam,
} from '../services/githubService';

type Permission = 'pull' | 'push' | 'admin';

interface SelectedRepo {
  name: string;
  permission: Permission;
}

interface SelectedTeam {
  slug: string;
  name: string;
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function OnboardingPage() {
  const { token } = useAuth();
  const { success, error: showError } = useToast();

  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [teams, setTeams] = useState<GitHubTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [usernames, setUsernames] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<SelectedRepo[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<SelectedTeam[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [addCopilot, setAddCopilot] = useState(false);

  // Execution
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<{ action: string; ok: boolean; detail: string }[]>([]);
  const [step, setStep] = useState<'configure' | 'review' | 'done'>('configure');

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
    loadOrgData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrg]);

  const loadOrgData = async () => {
    setLoading(true);
    try {
      githubService.setToken(token!);
      const [repoData, teamData] = await Promise.all([
        githubService.getOrgRepositories(selectedOrg),
        githubService.getOrgTeams(selectedOrg).catch(() => []),
      ]);
      setRepos(repoData);
      setTeams(teamData);
    } catch {
      showError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(
    (r) => r.name.toLowerCase().includes(repoSearch.toLowerCase()) && !selectedRepos.some((sr) => sr.name === r.name)
  );
  const filteredTeams = teams.filter(
    (t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()) && !selectedTeams.some((st) => st.slug === t.slug)
  );

  const addRepo = (repo: GitHubRepo, perm: Permission = 'push') => {
    setSelectedRepos((prev) => [...prev, { name: repo.name, permission: perm }]);
  };
  const removeRepo = (name: string) => setSelectedRepos((prev) => prev.filter((r) => r.name !== name));
  const updateRepoPermission = (name: string, perm: Permission) => {
    setSelectedRepos((prev) => prev.map((r) => (r.name === name ? { ...r, permission: perm } : r)));
  };
  const addTeam = (team: GitHubTeam) => setSelectedTeams((prev) => [...prev, { slug: team.slug, name: team.name }]);
  const removeTeam = (slug: string) => setSelectedTeams((prev) => prev.filter((t) => t.slug !== slug));

  const parsedUsers = usernames.split(/[,\n]+/).map((u) => u.trim().replace(/^@/, '')).filter(Boolean);
  const canProceed = parsedUsers.length > 0 && (selectedRepos.length > 0 || selectedTeams.length > 0);

  const executeOnboarding = async () => {
    setExecuting(true);
    setResults([]);
    const log: typeof results = [];
    githubService.setToken(token!);

    for (const username of parsedUsers) {
      for (const repo of selectedRepos) {
        try {
          await githubService.addRepoCollaborator(selectedOrg, repo.name, username, repo.permission);
          log.push({ action: `${username} → ${repo.name} (${repo.permission})`, ok: true, detail: 'Invitation sent' });
        } catch (err) {
          log.push({ action: `${username} → ${repo.name}`, ok: false, detail: err instanceof Error ? err.message : 'Failed' });
        }
      }
      for (const team of selectedTeams) {
        try {
          await githubService.addTeamMember(selectedOrg, team.slug, username);
          log.push({ action: `${username} → team ${team.name}`, ok: true, detail: 'Added' });
        } catch (err) {
          log.push({ action: `${username} → team ${team.name}`, ok: false, detail: err instanceof Error ? err.message : 'Failed' });
        }
      }
      if (addCopilot) {
        try {
          await githubService.addCopilotUsers(selectedOrg, [username]);
          log.push({ action: `Copilot → ${username}`, ok: true, detail: 'Seat assigned' });
        } catch (err) {
          log.push({ action: `Copilot → ${username}`, ok: false, detail: err instanceof Error ? err.message : 'Failed' });
        }
      }
    }

    setResults(log);
    setStep('done');
    setExecuting(false);
    const fails = log.filter((l) => !l.ok).length;
    if (fails === 0) success(`Onboarding complete — ${log.length} actions succeeded`);
    else showError(`${fails} of ${log.length} actions failed`);
  };

  const permLabel: Record<Permission, string> = { pull: 'Read', push: 'Write', admin: 'Admin' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-5xl">
      {/* Org selector */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        {organizations.length > 0 && (
          <select
            value={selectedOrg}
            onChange={(e) => { setSelectedOrg(e.target.value); setStep('configure'); setResults([]); setSelectedRepos([]); setSelectedTeams([]); }}
            className="bg-dark-card border border-dark-border text-dark-text rounded-lg px-3 py-1.5 text-sm"
          >
            {organizations.map((org) => (
              <option key={org.login} value={org.login}>{org.login}</option>
            ))}
          </select>
        )}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : organizations.length === 0 ? (
        <Card className="p-10 text-center">
          <Package className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-dark-text mb-2">No Organizations</h2>
          <p className="text-dark-text-muted text-sm">Join a GitHub organization to use onboarding.</p>
        </Card>
      ) : (
        <>
          {/* Step indicator */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 text-sm">
            {(['configure', 'review', 'done'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-dark-border" />}
                <button
                  onClick={() => s !== 'done' && setStep(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    step === s
                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                      : 'text-dark-text-muted border-dark-border hover:text-dark-text'
                  }`}
                >
                  {i + 1}. {s === 'configure' ? 'Configure' : s === 'review' ? 'Review' : 'Results'}
                </button>
              </div>
            ))}
          </motion.div>

          {/* CONFIGURE */}
          {step === 'configure' && (
            <>
              {/* Usernames */}
              <motion.div variants={fadeUp}>
                <Card>
                  <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-brand-400" /> New Members
                  </h3>
                  <textarea
                    value={usernames}
                    onChange={(e) => setUsernames(e.target.value)}
                    placeholder="Enter GitHub usernames (comma or newline separated)"
                    rows={3}
                    className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50 resize-none"
                  />
                  {parsedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parsedUsers.map((u) => (
                        <span key={u} className="px-2 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20">@{u}</span>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Repos */}
              <motion.div variants={fadeUp}>
                <Card>
                  <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-success-400" /> Repository Access ({selectedRepos.length})
                  </h3>
                  {selectedRepos.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {selectedRepos.map((r) => (
                        <div key={r.name} className="flex items-center justify-between p-2 rounded-lg bg-dark-surface/50 border border-dark-border/50">
                          <span className="text-sm text-dark-text">{r.name}</span>
                          <div className="flex items-center gap-2">
                            <select value={r.permission} onChange={(e) => updateRepoPermission(r.name, e.target.value as Permission)} className="bg-dark-card border-dark-border text-dark-text rounded px-2 py-0.5 text-xs">
                              <option value="pull">Read</option>
                              <option value="push">Write</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button onClick={() => removeRepo(r.name)} className="p-1 text-dark-text-muted hover:text-danger-400"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Search className="w-4 h-4 text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search repos…" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} className="w-full bg-dark-surface border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50" />
                  </div>
                  {repoSearch && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {filteredRepos.slice(0, 15).map((repo) => (
                        <button key={repo.name} onClick={() => { addRepo(repo); setRepoSearch(''); }} className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-dark-text hover:bg-dark-hover/40 transition-colors text-left">
                          <span>{repo.name}</span>
                          <span className="text-xs text-dark-text-muted">{repo.private ? 'Private' : 'Public'}</span>
                        </button>
                      ))}
                      {filteredRepos.length === 0 && <p className="text-xs text-dark-text-muted px-3 py-2">No matching repos</p>}
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Teams */}
              <motion.div variants={fadeUp}>
                <Card>
                  <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Team Membership ({selectedTeams.length})
                  </h3>
                  {selectedTeams.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedTeams.map((t) => (
                        <span key={t.slug} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {t.name}
                          <button onClick={() => removeTeam(t.slug)} className="hover:text-danger-400"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Search className="w-4 h-4 text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search teams…" value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} className="w-full bg-dark-surface border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-brand-500/50" />
                  </div>
                  {teamSearch && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {filteredTeams.slice(0, 15).map((team) => (
                        <button key={team.slug} onClick={() => { addTeam(team); setTeamSearch(''); }} className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-dark-text hover:bg-dark-hover/40 transition-colors text-left">
                          <span>{team.name}</span>
                          <span className="text-xs text-dark-text-muted">{team.members_count ?? '?'} members</span>
                        </button>
                      ))}
                      {filteredTeams.length === 0 && <p className="text-xs text-dark-text-muted px-3 py-2">No matching teams</p>}
                    </div>
                  )}
                  {teams.length === 0 && <p className="text-xs text-dark-text-muted mt-2">No teams found — you may need org admin access.</p>}
                </Card>
              </motion.div>

              {/* Copilot toggle */}
              <motion.div variants={fadeUp}>
                <Card>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-sm font-semibold text-dark-text">Assign GitHub Copilot</p>
                        <p className="text-xs text-dark-text-muted">Grant a Copilot seat ($19/seat/mo)</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setAddCopilot(!addCopilot)}
                      className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${addCopilot ? 'bg-brand-500' : 'bg-dark-surface border border-dark-border'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${addCopilot ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </label>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp} className="flex justify-end">
                <Button onClick={() => setStep('review')} disabled={!canProceed}>Review Package →</Button>
              </motion.div>
            </>
          )}

          {/* REVIEW */}
          {step === 'review' && (
            <>
              <motion.div variants={fadeUp}>
                <Card variant="elevated">
                  <h3 className="text-sm font-semibold text-dark-text mb-4">Onboarding Summary</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-dark-text-muted mb-1">Users ({parsedUsers.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedUsers.map((u) => <span key={u} className="px-2 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20">@{u}</span>)}
                      </div>
                    </div>
                    {selectedRepos.length > 0 && (
                      <div>
                        <p className="text-xs text-dark-text-muted mb-1">Repositories ({selectedRepos.length})</p>
                        <div className="space-y-1">
                          {selectedRepos.map((r) => (
                            <div key={r.name} className="flex items-center justify-between text-sm">
                              <span className="text-dark-text">{r.name}</span>
                              <span className="text-xs text-dark-text-muted">{permLabel[r.permission]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedTeams.length > 0 && (
                      <div>
                        <p className="text-xs text-dark-text-muted mb-1">Teams ({selectedTeams.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTeams.map((t) => <span key={t.slug} className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">{t.name}</span>)}
                        </div>
                      </div>
                    )}
                    {addCopilot && (
                      <div className="flex items-center gap-2 text-sm text-purple-400">
                        <Shield className="w-4 h-4" /> Copilot seat will be assigned
                      </div>
                    )}
                    <div className="pt-3 border-t border-dark-border text-xs text-dark-text-muted">
                      Total actions: {parsedUsers.length * (selectedRepos.length + selectedTeams.length + (addCopilot ? 1 : 0))}
                    </div>
                  </div>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('configure')}>← Back</Button>
                <Button onClick={executeOnboarding} loading={executing} icon={<Send className="w-4 h-4" />}>Execute Onboarding</Button>
              </motion.div>
            </>
          )}

          {/* RESULTS */}
          {step === 'done' && results.length > 0 && (
            <>
              <motion.div variants={fadeUp}>
                <Card variant="elevated">
                  <h3 className="text-sm font-semibold text-dark-text mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-400" /> Results
                  </h3>
                  <div className="space-y-1.5">
                    {results.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${r.ok ? 'bg-success-500/5' : 'bg-danger-500/5'}`}>
                        {r.ok ? <CheckCircle className="w-4 h-4 text-success-400 shrink-0" /> : <X className="w-4 h-4 text-danger-400 shrink-0" />}
                        <span className="text-dark-text flex-1">{r.action}</span>
                        <span className={`text-xs ${r.ok ? 'text-success-400' : 'text-danger-400'}`}>{r.detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-dark-border text-xs text-dark-text-muted">
                    {results.filter((r) => r.ok).length} succeeded, {results.filter((r) => !r.ok).length} failed
                  </div>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} className="flex justify-between">
                <Button variant="ghost" onClick={() => { setStep('configure'); setResults([]); }}>← Onboard Another</Button>
              </motion.div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
