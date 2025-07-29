import { useState, useEffect } from 'react';
import githubService from '../services/githubService';
import type { GitHubRepo } from '../services/githubService';

interface ActionsManagerProps {
  token: string;
  onBack: () => void;
}

interface ActionPermissions {
  enabled: boolean;
  allowed_actions: 'all' | 'local_only' | 'selected';
  selected_actions_url?: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface SecretItem {
  name: string;
  created_at: string;
  updated_at: string;
}

interface TokenPermissions {
  actions: 'read' | 'write' | 'none';
  checks: 'read' | 'write' | 'none';
  contents: 'read' | 'write' | 'none';
  deployments: 'read' | 'write' | 'none';
  issues: 'read' | 'write' | 'none';
  packages: 'read' | 'write' | 'none';
  'pull-requests': 'read' | 'write' | 'none';
  'repository-projects': 'read' | 'write' | 'none';
  'security-events': 'read' | 'write' | 'none';
  statuses: 'read' | 'write' | 'none';
}

interface Runner {
  id: number;
  name: string;
  os: string;
  status: string;
  busy: boolean;
  labels: Array<{ name: string; type: string }>;
}

interface RepoActionsData {
  repo: GitHubRepo;
  permissions: ActionPermissions | null;
  workflows: WorkflowRun[];
  secrets: SecretItem[];
  runners: Runner[];
  tokenPermissions: TokenPermissions | null;
  loading: boolean;
  error: string | null;
}

export default function GitHubActionsManager({ token, onBack }: ActionsManagerProps) {
  const [selectedScope, setSelectedScope] = useState<'user' | 'org'>('user');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [actionsData, setActionsData] = useState<Record<string, RepoActionsData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      let repos: GitHubRepo[] = [];
      
      if (selectedScope === 'user') {
        repos = await githubService.getUserRepositories();
      } else if (selectedOrg) {
        repos = await githubService.getOrgRepositories(selectedOrg);
      }
      
      setRepositories(repos);
      
      // Initialize actions data for each repo
      const initialData: Record<string, RepoActionsData> = {};
      repos.forEach(repo => {
        initialData[repo.full_name] = {
          repo,
          permissions: null,
          workflows: [],
          secrets: [],
          runners: [],
          tokenPermissions: null,
          loading: false,
          error: null
        };
      });
      setActionsData(initialData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActionsData = async (repoFullName: string) => {
    setActionsData(prev => ({
      ...prev,
      [repoFullName]: {
        ...prev[repoFullName],
        loading: true,
        error: null
      }
    }));

    try {
      const [owner, repo] = repoFullName.split('/');
      
      // Fetch Actions permissions
      const permissionsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/permissions`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      let permissions: ActionPermissions | null = null;
      if (permissionsResponse.ok) {
        permissions = await permissionsResponse.json();
      }

      // Fetch recent workflow runs
      const workflowsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      let workflows: WorkflowRun[] = [];
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        workflows = workflowsData.workflow_runs || [];
      }

      // Fetch repository secrets
      const secretsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      let secrets: SecretItem[] = [];
      if (secretsResponse.ok) {
        const secretsData = await secretsResponse.json();
        secrets = secretsData.secrets || [];
      }

      // Fetch self-hosted runners
      const runnersResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runners`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      let runners: Runner[] = [];
      if (runnersResponse.ok) {
        const runnersData = await runnersResponse.json();
        runners = runnersData.runners || [];
      }

      setActionsData(prev => ({
        ...prev,
        [repoFullName]: {
          ...prev[repoFullName],
          permissions,
          workflows,
          secrets,
          runners,
          loading: false,
          error: null
        }
      }));

    } catch (err) {
      setActionsData(prev => ({
        ...prev,
        [repoFullName]: {
          ...prev[repoFullName],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch Actions data'
        }
      }));
    }
  };

  const updateActionsPermissions = async (repoFullName: string, enabled: boolean, allowedActions: 'all' | 'local_only' | 'selected') => {
    const [owner, repo] = repoFullName.split('/');
    
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          allowed_actions: allowedActions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update Actions permissions');
      }

      // Refresh the data
      await fetchActionsData(repoFullName);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  };

  const analyzeSecretSecurity = (secrets: SecretItem[]) => {
    const suspiciousPatterns = [
      'password', 'pwd', 'pass', 'secret', 'key', 'token', 'api',
      'aws_access', 'aws_secret', 'db_password', 'private_key'
    ];
    
    return secrets.filter(secret => 
      suspiciousPatterns.some(pattern => 
        secret.name.toLowerCase().includes(pattern)
      )
    );
  };

  const getRunnerSecurityStatus = (runners: Runner[]) => {
    const selfHosted = runners.filter(runner => 
      runner.labels.some(label => label.name === 'self-hosted')
    );
    
    return {
      total: runners.length,
      selfHosted: selfHosted.length,
      active: runners.filter(r => r.status === 'online').length,
      busy: runners.filter(r => r.busy).length
    };
  };

  useEffect(() => {
    if (selectedScope === 'user') {
      fetchRepositories();
    }
  }, [selectedScope]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GitHub Actions Security Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage GitHub Actions permissions, secrets, and runners
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Scope Selection */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Scope</h3>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="scope"
              value="user"
              checked={selectedScope === 'user'}
              onChange={(e) => setSelectedScope(e.target.value as 'user' | 'org')}
              className="mr-2"
            />
            <span className="text-gray-900 dark:text-white">Personal Repositories</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="scope"
              value="org"
              checked={selectedScope === 'org'}
              onChange={(e) => setSelectedScope(e.target.value as 'user' | 'org')}
              className="mr-2"
            />
            <span className="text-gray-900 dark:text-white">Organization Repositories</span>
          </label>
        </div>

        {selectedScope === 'org' && (
          <div className="mt-4">
            <input
              type="text"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              placeholder="Enter organization name"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-4"
            />
            <button
              onClick={fetchRepositories}
              disabled={!selectedOrg || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Loading...' : 'Load Repositories'}
            </button>
          </div>
        )}
      </div>

      {/* Repositories List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading repositories...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {repositories.map((repo) => {
            const repoData = actionsData[repo.full_name];
            const isExpanded = expandedRepo === repo.full_name;
            
            return (
              <div key={repo.full_name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Repository Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedRepo(null);
                    } else {
                      setExpandedRepo(repo.full_name);
                      if (!repoData?.permissions) {
                        fetchActionsData(repo.full_name);
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{repo.private ? '🔒' : '🌍'}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {repo.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {repo.full_name} • {repo.private ? 'Private' : 'Public'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {repoData?.permissions && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          repoData.permissions.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          Actions {repoData.permissions.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Repository Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {repoData?.loading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading Actions data...</p>
                      </div>
                    ) : repoData?.error ? (
                      <div className="text-center py-4 text-red-600 dark:text-red-400">
                        Error: {repoData.error}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Actions Permissions */}
                        {repoData?.permissions && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                              🛡️ Actions Permissions
                            </h4>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={repoData.permissions.enabled}
                                    onChange={(e) => updateActionsPermissions(
                                      repo.full_name, 
                                      e.target.checked, 
                                      repoData.permissions!.allowed_actions
                                    )}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-900 dark:text-white">Enable Actions</span>
                                </label>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Allowed Actions
                                </label>
                                <select
                                  value={repoData.permissions.allowed_actions}
                                  onChange={(e) => updateActionsPermissions(
                                    repo.full_name,
                                    repoData.permissions!.enabled,
                                    e.target.value as 'all' | 'local_only' | 'selected'
                                  )}
                                  disabled={!repoData.permissions.enabled}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="all">All actions and reusable workflows</option>
                                  <option value="local_only">Local actions only</option>
                                  <option value="selected">Selected actions</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recent Workflows */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            ⚡ Recent Workflow Runs ({repoData?.workflows.length || 0})
                          </h4>
                          {repoData?.workflows.length ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {repoData.workflows.slice(0, 5).map((workflow) => (
                                <div key={workflow.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                                  <div className="flex items-center space-x-3">
                                    <span className={`text-sm px-2 py-1 rounded ${
                                      workflow.conclusion === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                      workflow.conclusion === 'failure' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    }`}>
                                      {workflow.conclusion || workflow.status}
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                                      {workflow.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {workflow.head_branch}
                                    </span>
                                  </div>
                                  <a
                                    href={workflow.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
                                  >
                                    View →
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">No recent workflow runs</p>
                          )}
                        </div>

                        {/* Repository Secrets */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            🔐 Repository Secrets ({repoData?.secrets.length || 0})
                          </h4>
                          {repoData?.secrets.length ? (
                            <div className="space-y-2">
                              {repoData.secrets.map((secret) => {
                                const isSuspicious = analyzeSecretSecurity([secret]).length > 0;
                                return (
                                  <div key={secret.name} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                                    <div className="flex items-center space-x-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        isSuspicious ? 'bg-red-500' : 'bg-green-500'
                                      }`}></span>
                                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                                        {secret.name}
                                      </span>
                                      {isSuspicious && (
                                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded">
                                          Review Required
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Updated {new Date(secret.updated_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">No secrets configured</p>
                          )}
                        </div>

                        {/* Self-hosted Runners */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            🏃 Self-hosted Runners
                          </h4>
                          {repoData?.runners.length ? (
                            <div className="space-y-2">
                              {(() => {
                                const runnerStats = getRunnerSecurityStatus(repoData.runners);
                                return (
                                  <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {runnerStats.total}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                                    </div>
                                    <div className="text-center">
                                      <div className={`text-2xl font-bold ${
                                        runnerStats.selfHosted > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                      }`}>
                                        {runnerStats.selfHosted}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Self-hosted</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {runnerStats.active}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Online</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {runnerStats.busy}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">Busy</div>
                                    </div>
                                  </div>
                                );
                              })()}
                              {repoData.runners.map((runner) => {
                                const isSelfHosted = runner.labels.some(label => label.name === 'self-hosted');
                                return (
                                  <div key={runner.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                                    <div className="flex items-center space-x-3">
                                      <span className={`w-3 h-3 rounded-full ${
                                        runner.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                      }`}></span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {runner.name}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {runner.os}
                                      </span>
                                      {isSelfHosted && (
                                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded">
                                          ⚠️ Self-hosted
                                        </span>
                                      )}
                                      {runner.busy && (
                                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                                          Busy
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {runner.labels.map(label => label.name).join(', ')}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              No self-hosted runners configured
                              <span className="block text-xs mt-1">
                                ✅ Using GitHub-hosted runners only (recommended for security)
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {repositories.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedScope === 'org' && !selectedOrg
              ? 'Enter an organization name to load repositories'
              : 'No repositories found'}
          </p>
        </div>
      )}
    </div>
  );
}
