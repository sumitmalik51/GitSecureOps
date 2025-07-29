import { useState, useEffect } from 'react';
import githubService from '../services/githubService';
import type { GitHubOrg } from '../services/githubService';

interface TwoFactorCheckerProps {
  token: string;
  onBack: () => void;
}

interface OrgMember {
  login: string;
  id: number;
  avatar_url: string;
  type: string;
  site_admin: boolean;
  role: 'admin' | 'member';
  two_factor_authentication: boolean;
  access_type: 'organization' | 'repository';
  repository_name?: string;
  permission?: string;
}

interface OrganizationData {
  org: GitHubOrg;
  requiresTwoFactor: boolean;
  members: OrgMember[];
  loading: boolean;
  error: string | null;
}

interface FilterOptions {
  showCompliant: boolean;
  showNonCompliant: boolean;
  roleFilter: 'all' | 'admin' | 'member';
}

export default function TwoFactorChecker({ token, onBack }: TwoFactorCheckerProps) {
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [orgData, setOrgData] = useState<Record<string, OrganizationData>>({});
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    showCompliant: true,
    showNonCompliant: true,
    roleFilter: 'all'
  });

  // Load user's organizations
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoadingOrgs(true);
    setError('');
    
    try {
      const orgs = await githubService.getUserOrganizations();
      setOrganizations(orgs);
      
      // Initialize org data
      const initialData: Record<string, OrganizationData> = {};
      orgs.forEach(org => {
        initialData[org.login] = {
          org,
          requiresTwoFactor: false,
          members: [],
          loading: false,
          error: null
        };
      });
      setOrgData(initialData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const fetchOrganizationData = async (orgLogin: string) => {
    setOrgData(prev => ({
      ...prev,
      [orgLogin]: {
        ...prev[orgLogin],
        loading: true,
        error: null
      }
    }));

    try {
      // Fetch organization details to check 2FA requirement
      const orgResponse = await fetch(`https://api.github.com/orgs/${orgLogin}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!orgResponse.ok) {
        throw new Error('Failed to fetch organization details');
      }

      const orgDetails = await orgResponse.json();
      const requiresTwoFactor = orgDetails.two_factor_requirement_enabled || false;

      // Fetch organization members with 2FA status
      const membersResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/members?filter=2fa_disabled&per_page=100`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      let nonCompliantMembers: OrgMember[] = [];
      if (membersResponse.ok) {
        nonCompliantMembers = await membersResponse.json();
        // Add 2FA status and access type
        nonCompliantMembers = nonCompliantMembers.map(member => ({
          ...member,
          role: 'member' as 'admin' | 'member', // Will be updated below
          two_factor_authentication: false,
          access_type: 'organization' as 'organization' | 'repository'
        }));
      }

      // Fetch all members to get complete list and roles
      const allMembersResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/members?per_page=100`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      let allMembers: OrgMember[] = [];
      if (allMembersResponse.ok) {
        const allMembersData = await allMembersResponse.json();
        
        // For each member, get their role and 2FA status
        const membersWithDetails = await Promise.all(
          allMembersData.map(async (member: any) => {
            // Check if user is in non-compliant list
            const isNonCompliant = nonCompliantMembers.some(nc => nc.login === member.login);
            
            // Get member role
            try {
              const membershipResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/memberships/${member.login}`, {
                headers: {
                  'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              });
              
              let role: 'admin' | 'member' = 'member';
              if (membershipResponse.ok) {
                const membershipData = await membershipResponse.json();
                role = membershipData.role === 'admin' ? 'admin' : 'member';
              }

              return {
                ...member,
                role,
                two_factor_authentication: !isNonCompliant,
                access_type: 'organization' as 'organization' | 'repository'
              };
            } catch {
              return {
                ...member,
                role: 'member' as 'admin' | 'member',
                two_factor_authentication: !isNonCompliant,
                access_type: 'organization' as 'organization' | 'repository'
              };
            }
          })
        );

        allMembers = membersWithDetails;
      }

      // Fetch organization repositories and their collaborators
      const reposResponse = await fetch(`https://api.github.com/orgs/${orgLogin}/repos?per_page=100`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        
        // For each repository, fetch collaborators
        for (const repo of repos) {
          try {
            const collaboratorsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/collaborators`, {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            });

            if (collaboratorsResponse.ok) {
              const collaborators = await collaboratorsResponse.json();
              
              for (const collaborator of collaborators) {
                // Only add if not already in organization members
                const existingMember = allMembers.find(m => m.login === collaborator.login);
                if (!existingMember) {
                  // Check 2FA status for this collaborator
                  let twoFactorEnabled = true; // Default to true
                  try {
                    const userResponse = await fetch(`https://api.github.com/users/${collaborator.login}`, {
                      headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                      },
                    });
                    
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      twoFactorEnabled = userData.two_factor_authentication !== false;
                    }
                  } catch {
                    // If we can't fetch 2FA status, assume it's enabled to be safe
                    twoFactorEnabled = true;
                  }

                  allMembers.push({
                    login: collaborator.login,
                    id: collaborator.id,
                    avatar_url: collaborator.avatar_url,
                    type: collaborator.type,
                    site_admin: collaborator.site_admin || false,
                    role: collaborator.permissions?.admin ? 'admin' : 'member',
                    two_factor_authentication: twoFactorEnabled,
                    access_type: 'repository',
                    repository_name: repo.name,
                    permission: collaborator.permissions?.admin ? 'admin' : 
                               collaborator.permissions?.push ? 'push' : 
                               collaborator.permissions?.pull ? 'pull' : 'unknown'
                  });
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch collaborators for ${repo.full_name}:`, err);
          }
        }
      }

      setOrgData(prev => ({
        ...prev,
        [orgLogin]: {
          ...prev[orgLogin],
          requiresTwoFactor,
          members: allMembers,
          loading: false,
          error: null
        }
      }));

    } catch (err) {
      setOrgData(prev => ({
        ...prev,
        [orgLogin]: {
          ...prev[orgLogin],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch organization data'
        }
      }));
    }
  };

  const getFilteredMembers = (members: OrgMember[]) => {
    return members.filter(member => {
      // Role filter
      if (filters.roleFilter !== 'all' && member.role !== filters.roleFilter) {
        return false;
      }

      // Compliance filter
      if (!filters.showCompliant && member.two_factor_authentication) {
        return false;
      }
      if (!filters.showNonCompliant && !member.two_factor_authentication) {
        return false;
      }

      return true;
    });
  };

  const exportToCSV = (name: string, data: OrgMember[]) => {
    const filteredMembers = getFilteredMembers(data);
    
    const headers = ['Username', 'Role', '2FA Enabled', 'Access Type', 'Repository', 'Permission', 'User ID'];
    const csvContent = [
      headers.join(','),
      ...filteredMembers.map(member => [
        `"${member.login}"`,
        `"${member.role}"`,
        member.two_factor_authentication ? 'Yes' : 'No',
        `"${member.access_type}"`,
        `"${member.repository_name || 'N/A'}"`,
        `"${member.permission || 'N/A'}"`,
        member.id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${name}-2fa-compliance-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getComplianceStats = (data: OrgMember[]) => {
    const total = data.length;
    const compliant = data.filter(item => item.two_factor_authentication).length;
    const nonCompliant = total - compliant;
    const compliancePercentage = total > 0 ? Math.round((compliant / total) * 100) : 0;

    return {
      total,
      compliant,
      nonCompliant,
      compliancePercentage
    };
  };

  const resetData = () => {
    setExpandedOrg(null);
    loadOrganizations();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication Checker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Scan organizations and their repositories for 2FA compliance
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

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={resetData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Reset Scan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Compliance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Show Members
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showCompliant}
                  onChange={(e) => setFilters(prev => ({ ...prev, showCompliant: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">2FA Enabled</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showNonCompliant}
                  onChange={(e) => setFilters(prev => ({ ...prev, showNonCompliant: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">2FA Disabled</span>
              </label>
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Filter
            </label>
            <select
              value={filters.roleFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, roleFilter: e.target.value as 'all' | 'admin' | 'member' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="member">Members Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      {isLoadingOrgs ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading organizations...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => {
            const data = orgData[org.login];
            const isExpanded = expandedOrg === org.login;
            const stats = data?.members ? getComplianceStats(data.members) : null;
            
            return (
              <div key={org.login} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Organization Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedOrg(null);
                    } else {
                      setExpandedOrg(org.login);
                      if (!data?.members.length && !data?.loading) {
                        fetchOrganizationData(org.login);
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={org.avatar_url} 
                        alt={org.login}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {org.login}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {org.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {data?.requiresTwoFactor && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded">
                          2FA Required
                        </span>
                      )}
                      {stats && (
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            stats.compliancePercentage >= 95 ? 'text-green-600 dark:text-green-400' :
                            stats.compliancePercentage >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {stats.compliancePercentage}% Compliant
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.compliant}/{stats.total} users
                          </div>
                        </div>
                      )}
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Organization Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {data?.loading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading organization data...</p>
                      </div>
                    ) : data?.error ? (
                      <div className="text-center py-4 text-red-600 dark:text-red-400">
                        Error: {data.error}
                        <button
                          onClick={() => fetchOrganizationData(org.login)}
                          className="block mx-auto mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : data?.members ? (
                      <div className="space-y-4">
                        {/* Compliance Overview */}
                        {(() => {
                          const overallStats = getComplianceStats(data.members);
                          const orgMembers = data.members.filter(m => m.access_type === 'organization');
                          const repoCollaborators = data.members.filter(m => m.access_type === 'repository');
                          const orgStats = getComplianceStats(orgMembers);
                          const repoStats = getComplianceStats(repoCollaborators);
                          
                          return (
                            <div className="space-y-4">
                              {/* Overall Stats */}
                              <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {overallStats.total}
                                  </div>
                                  <div className="text-sm text-blue-800 dark:text-blue-200">Total Users</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {overallStats.compliant}
                                  </div>
                                  <div className="text-sm text-green-800 dark:text-green-200">2FA Enabled</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {overallStats.nonCompliant}
                                  </div>
                                  <div className="text-sm text-red-800 dark:text-red-200">2FA Disabled</div>
                                </div>
                                <div className={`p-4 rounded-lg text-center ${
                                  overallStats.compliancePercentage >= 95 ? 'bg-green-50 dark:bg-green-900/20' :
                                  overallStats.compliancePercentage >= 80 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                                  'bg-red-50 dark:bg-red-900/20'
                                }`}>
                                  <div className={`text-2xl font-bold ${
                                    overallStats.compliancePercentage >= 95 ? 'text-green-600 dark:text-green-400' :
                                    overallStats.compliancePercentage >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {overallStats.compliancePercentage}%
                                  </div>
                                  <div className={`text-sm ${
                                    overallStats.compliancePercentage >= 95 ? 'text-green-800 dark:text-green-200' :
                                    overallStats.compliancePercentage >= 80 ? 'text-yellow-800 dark:text-yellow-200' :
                                    'text-red-800 dark:text-red-200'
                                  }`}>
                                    Compliance Rate
                                  </div>
                                </div>
                              </div>

                              {/* Breakdown by Access Type */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Organization Members</h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {orgStats.compliant}/{orgStats.total} compliant ({orgStats.compliancePercentage}%)
                                  </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Repository Collaborators</h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {repoStats.compliant}/{repoStats.total} compliant ({repoStats.compliancePercentage}%)
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center mb-4">
                          <button
                            onClick={() => fetchOrganizationData(org.login)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <span>🔄</span>
                            <span>Rescan Organization</span>
                          </button>
                          <button
                            onClick={() => exportToCSV(org.login, data.members)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <span>📊</span>
                            <span>Export CSV</span>
                          </button>
                        </div>

                        {/* Members List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {getFilteredMembers(data.members).map((member) => (
                            <div key={`${member.login}-${member.access_type}-${member.repository_name || 'org'}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={member.avatar_url} 
                                  alt={member.login}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {member.login}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      member.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                    }`}>
                                      {member.role}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      member.access_type === 'organization'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                    }`}>
                                      {member.access_type}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {member.access_type === 'repository' ? (
                                      <>Repository: {member.repository_name} ({member.permission})</>
                                    ) : (
                                      <>ID: {member.id}</>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 text-sm rounded-full ${
                                  member.two_factor_authentication
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {member.two_factor_authentication ? '🔒 2FA Enabled' : '⚠️ 2FA Disabled'}
                                </span>
                                <a
                                  href={`https://github.com/${member.login}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
                                >
                                  View Profile →
                                </a>
                              </div>
                            </div>
                          ))}
                          {getFilteredMembers(data.members).length === 0 && (
                            <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                              No users match the current filters
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <button
                          onClick={() => fetchOrganizationData(org.login)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Load Organization Data
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {organizations.length === 0 && !isLoadingOrgs && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No organizations found</p>
        </div>
      )}
    </div>
  );
}
