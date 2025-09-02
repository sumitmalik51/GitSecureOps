import { useState } from 'react';
import githubService from '../services/githubService';
import type { GitHubOrg } from '../services/githubService';

interface GrantAccessProps {
  token: string;
  onBack: () => void;
}

type OrgRole = 'member' | 'admin';
type RepoRole = 'pull' | 'triage' | 'write' | 'maintain' | 'admin';

interface InviteResult {
  success: boolean;
  message: string;
  inviteUrl?: string;
}

export default function GrantAccess({ token, onBack }: GrantAccessProps) {
  const [step, setStep] = useState<'select-level' | 'org-flow' | 'repo-flow' | 'result'>('select-level');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Organization flow state
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [orgRole, setOrgRole] = useState<OrgRole>('member');
  
  // Repository flow state
  const [repositoryName, setRepositoryName] = useState('');
  const [repoRole, setRepoRole] = useState<RepoRole>('write');
  
  // Result state
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);

  // Utility functions
  const validateGitHubUsername = (username: string): boolean => {
    const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return regex.test(username) && username.length <= 39;
  };

  const handleAccessLevelSelect = (accessType: 'organization' | 'repository') => {
    if (accessType === 'organization') {
      loadOrganizations('org-flow');
    } else {
      loadOrganizations('repo-flow');
    }
  };

  const loadOrganizations = async (targetStep: 'org-flow' | 'repo-flow') => {
    setIsLoading(true);
    setError('');
    try {
      const orgs = await githubService.getUserOrganizations();
      setOrganizations(orgs);
      setStep(targetStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgInvite = async () => {
    if (!selectedOrg || !targetUsername) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateGitHubUsername(targetUsername)) {
      setError('Invalid GitHub username format');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`https://api.github.com/orgs/${selectedOrg}/memberships/${targetUsername}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: orgRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to invite user to organization');
      }

      const data = await response.json();
      
      setInviteResult({
        success: true,
        message: `Successfully invited ${targetUsername} to ${selectedOrg} as ${orgRole}`,
        inviteUrl: data.url
      });
      setStep('result');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setInviteResult({
        success: false,
        message: errorMessage
      });
      setStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoInvite = async () => {
    if (!selectedOrg || !repositoryName || !targetUsername) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateGitHubUsername(targetUsername)) {
      setError('Invalid GitHub username format');
      return;
    }

    setIsLoading(true);
    setError('');

    const fullRepoPath = `${selectedOrg}/${repositoryName}`;

    try {
      const response = await fetch(`https://api.github.com/repos/${fullRepoPath}/collaborators/${targetUsername}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permission: repoRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to invite user to repository');
      }

      setInviteResult({
        success: true,
        message: `Successfully invited ${targetUsername} to ${fullRepoPath} with ${repoRole} permission`
      });
      setStep('result');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setInviteResult({
        success: false,
        message: errorMessage
      });
      setStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('select-level');
    setError('');
    setInviteResult(null);
    setTargetUsername('');
    setRepositoryName('');
    setSelectedOrg('');
  };

  const roleDescriptions: Record<string, string> = {
    // Organization roles
    member: "Can see the organization and its public repositories",
    
    // Repository roles
    pull: "Can read and clone the repository",
    triage: "Can read, clone, and manage issues and pull requests",
    write: "Can read, clone, and push to the repository",
    maintain: "Can read, clone, push, and manage some repository settings"
  };

  const getAdminDescription = (context: 'org' | 'repo') => {
    return context === 'org' 
      ? "Full access to the organization and its repositories"
      : "Full administrative access to the repository";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grant GitHub Access</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Invite users to organizations or repositories
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

      {/* Step: Select Access Level */}
      {step === 'select-level' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Choose Access Level
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Do you want to assign access at the Organization level or Repository level?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => handleAccessLevelSelect('organization')}
              disabled={isLoading}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
            >
              <div className="text-2xl mb-3">🏢</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Organization Level
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Add users to entire organizations with member or admin roles
              </p>
            </button>

            <button
              onClick={() => handleAccessLevelSelect('repository')}
              disabled={isLoading}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
            >
              <div className="text-2xl mb-3">📁</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Repository Level
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Select organization and enter repository name manually
              </p>
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading organizations...</span>
            </div>
          )}
        </div>
      )}

      {/* Step: Organization Flow */}
      {step === 'org-flow' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Organization Invitation
            </h2>
            <button
              onClick={resetFlow}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Change Access Level
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Organization
              </label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Choose an organization...</option>
                {organizations.map((org) => (
                  <option key={org.login} value={org.login}>
                    {org.login}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="Enter GitHub username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Role
              </label>
              <div className="space-y-2">
                {(['member', 'admin'] as OrgRole[]).map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="radio"
                      name="orgRole"
                      value={role}
                      checked={orgRole === role}
                      onChange={(e) => setOrgRole(e.target.value as OrgRole)}
                      className="mr-3"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {role}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role === 'admin' ? getAdminDescription('org') : roleDescriptions[role] || `${role} permission level`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={resetFlow}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOrgInvite}
              disabled={isLoading || !selectedOrg || !targetUsername}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Repository Flow */}
      {step === 'repo-flow' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Repository Invitation
            </h2>
            <button
              onClick={resetFlow}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Change Access Level
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Select an organization and enter the repository name to grant access.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Organization
              </label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Choose an organization...</option>
                {organizations.map((org) => (
                  <option key={org.login} value={org.login}>
                    {org.login}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository Name
              </label>
              <input
                type="text"
                value={repositoryName}
                onChange={(e) => setRepositoryName(e.target.value)}
                placeholder="repository-name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Just the repository name (not the full path)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="Enter GitHub username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository Permission
              </label>
              <div className="space-y-2">
                {(['pull', 'triage', 'write', 'maintain', 'admin'] as RepoRole[]).map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="radio"
                      name="repoRole"
                      value={role}
                      checked={repoRole === role}
                      onChange={(e) => setRepoRole(e.target.value as RepoRole)}
                      className="mr-3"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {role}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role === 'admin' ? getAdminDescription('repo') : roleDescriptions[role] || `${role} permission level`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={resetFlow}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRepoInvite}
              disabled={isLoading || !selectedOrg || !repositoryName || !targetUsername}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && inviteResult && (
        <div className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${inviteResult.success ? '' : ''}`}>
              {inviteResult.success ? '✅' : '❌'}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {inviteResult.success ? 'Invitation Sent!' : 'Invitation Failed'}
            </h2>
            <p className={`text-lg ${inviteResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {inviteResult.message}
            </p>

            {inviteResult.inviteUrl && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">Invitation URL:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                    {inviteResult.inviteUrl}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteResult.inviteUrl!)}
                    className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={resetFlow}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Another Invitation
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
