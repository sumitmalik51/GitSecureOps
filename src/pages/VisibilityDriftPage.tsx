import { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Globe,
  RefreshCw,
  AlertTriangle,
  Search,
  ArrowUpDown,
  GitFork,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import githubService, { GitHubOrg, GitHubRepo } from '../services/githubService';

type SortKey = 'name' | 'visibility' | 'updated' | 'stars';

export default function VisibilityDriftPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [visFilter, setVisFilter] = useState<'all' | 'public' | 'private'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('visibility');
  const [sortAsc, setSortAsc] = useState(true);

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
      const data = await githubService.getOrgReposWithVisibility(selectedOrg);
      setRepos(data);
    } catch {
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (repo: GitHubRepo) => {
    const newPrivate = !repo.private;
    const action = newPrivate ? 'private' : 'public';
    if (!confirm(`Change ${repo.name} to ${action}? This affects all collaborators.`)) return;

    setToggling((prev) => [...prev, repo.name]);
    try {
      githubService.setToken(token!);
      await githubService.updateRepoVisibility(selectedOrg, repo.name, newPrivate);
      setRepos((prev) =>
        prev.map((r) => (r.name === repo.name ? { ...r, private: newPrivate } : r))
      );
      toast.success(`${repo.name} is now ${action}`);
    } catch {
      toast.error(`Failed to update ${repo.name}`);
    } finally {
      setToggling((prev) => prev.filter((n) => n !== repo.name));
    }
  };

  const publicRepos = repos.filter((r) => !r.private);
  const privateRepos = repos.filter((r) => r.private);
  const publicPct = repos.length > 0 ? Math.round((publicRepos.length / repos.length) * 100) : 0;

  const filtered = useMemo(() => {
    let result = repos;
    if (visFilter === 'public') result = result.filter((r) => !r.private);
    if (visFilter === 'private') result = result.filter((r) => r.private);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'visibility':
          cmp = Number(a.private) - Number(b.private);
          break;
        case 'updated':
          cmp = new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
          break;
        case 'stars':
          cmp = (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [repos, visFilter, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
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
          <Eye className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Organizations</h2>
          <p className="text-dark-text-muted text-sm">Join a GitHub organization to detect visibility drift.</p>
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

          <div className="relative">
            <Search className="w-4 h-4 text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search repos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input bg-dark-card border-dark-border text-dark-text rounded-lg pl-9 pr-3 py-2 text-sm w-52"
            />
          </div>

          <div className="flex items-center gap-1 bg-dark-surface rounded-lg p-0.5">
            {(['all', 'public', 'private'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setVisFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  visFilter === f
                    ? 'bg-dark-card text-dark-text shadow-sm'
                    : 'text-dark-text-muted hover:text-dark-text'
                }`}
              >
                {f === 'all' ? 'All' : f === 'public' ? 'Public' : 'Private'}
              </button>
            ))}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <GitFork className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Total Repos</span>
          </div>
          <p className="text-2xl font-bold">{repos.length}</p>
        </Card>

        <Card className={`p-5 ${publicRepos.length > 0 ? 'border-amber-500/20' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Public</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{publicRepos.length}</p>
          <p className="text-xs text-dark-text-muted mt-1">{publicPct}% exposure</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-dark-text-muted">Private</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{privateRepos.length}</p>
        </Card>
      </div>

      {/* Alert for public repos */}
      {publicRepos.length > 0 && (
        <Card className="p-5 border-amber-500/20 bg-amber-500/[0.03]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {publicRepos.length} public repo{publicRepos.length > 1 ? 's' : ''} detected
              </p>
              <p className="text-xs text-dark-text-muted">
                Public repositories are accessible to everyone. Review each repo to ensure this is intentional.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Visibility distribution bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Visibility Distribution</h3>
          <div className="flex gap-4 text-xs text-dark-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Public ({publicRepos.length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Private ({privateRepos.length})
            </span>
          </div>
        </div>
        <div className="h-3 bg-dark-surface rounded-full overflow-hidden flex">
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${publicPct}%` }}
          />
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${100 - publicPct}%` }}
          />
        </div>
      </Card>

      {/* Repo Table */}
      <Card className="overflow-hidden" noPadding>
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Repositories ({filtered.length})</h3>
          <div className="flex items-center gap-2 text-xs text-dark-text-muted">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort by
            {(['name', 'visibility', 'updated'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`px-2 py-1 rounded transition-colors ${
                  sortKey === key ? 'bg-dark-card text-dark-text' : 'hover:text-dark-text'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-dark-border/50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-dark-text-muted text-sm">No repos match this filter.</div>
          ) : (
            filtered.map((repo) => (
              <div
                key={repo.name}
                className={`px-5 py-3 flex items-center justify-between hover:bg-dark-hover/40 transition-colors ${
                  !repo.private ? 'bg-amber-500/[0.02]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      repo.private ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}
                  >
                    {repo.private ? (
                      <Lock className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{repo.name}</p>
                      <Badge variant={repo.private ? 'success' : 'warning'}>
                        {repo.private ? 'Private' : 'Public'}
                      </Badge>

                    </div>
                    <p className="text-xs text-dark-text-muted truncate">
                      {repo.description || 'No description'}
                      {' · '}Updated {new Date(repo.updated_at || 0).toLocaleDateString()}
                      {repo.stargazers_count ? ` · ★ ${repo.stargazers_count}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!repo.private && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleToggleVisibility(repo)}
                      disabled={toggling.includes(repo.name)}
                    >
                      <EyeOff className="w-3.5 h-3.5 mr-1" />
                      Make Private
                    </Button>
                  )}
                  {repo.private && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleToggleVisibility(repo)}
                      disabled={toggling.includes(repo.name)}
                      className="text-dark-text-muted"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Make Public
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
