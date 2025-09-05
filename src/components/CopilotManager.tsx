import { useState, useEffect } from 'react';
import githubService from '../services/githubService';
import type { GitHubOrg, CopilotSeat, CopilotBilling } from '../services/githubService';
import { validateGitHubUsernames } from '../utils/validation';

interface CopilotManagerProps {
  onBack: () => void;
}

type ViewMode = 'organization-selection' | 'copilot-overview' | 'manage-users' | 'add-users' | 'remove-users';

export default function CopilotManager({ onBack }: CopilotManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('organization-selection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Organization state
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  
  // Copilot data state
  const [copilotBilling, setCopilotBilling] = useState<CopilotBilling | null>(null);
  const [copilotSeats, setCopilotSeats] = useState<CopilotSeat[]>([]);
  
  // User management state
  const [newUsernames, setNewUsernames] = useState('');
  const [selectedUsersForRemoval, setSelectedUsersForRemoval] = useState<string[]>([]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError('');
    try {
      const orgs = await githubService.getUserOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCopilotData = async (orgLogin: string) => {
    setIsLoading(true);
    setError('');
    try {
      console.log('🔍 Loading Copilot data for org:', orgLogin);
      const [billing, seatsResponse] = await Promise.all([
        githubService.getCopilotBilling(orgLogin),
        githubService.getCopilotSeats(orgLogin)
      ]);
      
      console.log('📊 Copilot billing data:', billing);
      console.log('👥 Copilot seats data:', seatsResponse);
      console.log('⚠️ Users with pending cancellation:', 
        seatsResponse.seats.filter(seat => seat.pending_cancellation_date)
      );
      
      setCopilotBilling(billing);
      setCopilotSeats(seatsResponse.seats);
    } catch (err) {
      console.error('❌ Failed to load Copilot data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Copilot data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSelection = async (orgLogin: string) => {
    setSelectedOrg(orgLogin);
    setViewMode('copilot-overview');
    await loadCopilotData(orgLogin);
  };

  const handleAddUsers = async () => {
    if (!newUsernames.trim()) {
      setError('Please enter at least one username');
      return;
    }

    const inputUsernames = newUsernames
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (inputUsernames.length === 0) {
      setError('Please enter valid usernames');
      return;
    }

    // Validate all usernames before processing
    const { validUsernames, errors } = validateGitHubUsernames(inputUsernames);

    if (errors.length > 0) {
      setError('Invalid usernames detected:\n' + errors.join('\n'));
      return;
    }

    if (validUsernames.length === 0) {
      setError('No valid usernames found. Please enter GitHub usernames, not email addresses.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await githubService.addCopilotUsersWithInvite(selectedOrg, validUsernames);
      
      if (result.success) {
        const inviteCount = result.results.filter(r => r.status === 'invited_and_added').length;
        const addedCount = result.results.filter(r => r.status === 'added').length;
        const failedCount = result.results.filter(r => r.status === 'failed').length;
        
        let successMessage = result.message;
        if (inviteCount > 0) {
          successMessage += `\n• ${inviteCount} user(s) were invited to the organization and added to Copilot`;
        }
        if (addedCount > 0) {
          successMessage += `\n• ${addedCount} existing member(s) were added to Copilot`;
        }
        if (failedCount > 0) {
          successMessage += `\n• ${failedCount} user(s) failed to be processed`;
          
          // Show detailed failure information
          const failedUsers = result.results.filter(r => r.status === 'failed');
          if (failedUsers.length > 0) {
            successMessage += '\n\nFailures:';
            failedUsers.forEach(user => {
              successMessage += `\n• ${user.username}: ${user.message}`;
            });
          }
        }
        
        setSuccess(successMessage);
        
        // Show invite URLs if any
        const invitedUsers = result.results.filter(r => r.inviteUrl);
        if (invitedUsers.length > 0) {
          console.log('Invitation URLs:', invitedUsers.map(u => ({ username: u.username, url: u.inviteUrl })));
        }
      } else {
        setError(result.message);
      }
      
      setNewUsernames('');
      // Refresh copilot data
      await loadCopilotData(selectedOrg);
      setViewMode('copilot-overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add users to Copilot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUsers = async () => {
    if (selectedUsersForRemoval.length === 0) {
      setError('Please select at least one user to remove');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await githubService.removeCopilotUsers(selectedOrg, selectedUsersForRemoval);
      setSuccess(`Successfully removed ${result.seats_cancelled.length} user(s) from Copilot`);
      setSelectedUsersForRemoval([]);
      // Refresh copilot data
      await loadCopilotData(selectedOrg);
      setViewMode('copilot-overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove users from Copilot');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (username: string) => {
    setSelectedUsersForRemoval(prev => 
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GitHub Copilot Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage GitHub Copilot access and permissions for organization members
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

      {/* Success Banner */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <pre className="text-green-800 dark:text-green-200 whitespace-pre-wrap text-sm">{success}</pre>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mb-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
        </div>
      )}

      {/* Organization Selection View */}
      {viewMode === 'organization-selection' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Organization
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose the organization where you want to manage GitHub Copilot access
            </p>
          </div>

          {organizations.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No organizations found or insufficient permissions</p>
            </div>
          ) : (
            <div className="grid gap-4 max-w-2xl mx-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSelection(org.login)}
                  disabled={isLoading}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img
                    src={org.avatar_url}
                    alt={org.login}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{org.login}</h3>
                    {org.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{org.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Copilot Overview View */}
      {viewMode === 'copilot-overview' && copilotBilling && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Copilot Overview - {selectedOrg}
            </h2>
            <button
              onClick={() => {
                setViewMode('organization-selection');
                clearMessages();
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Change Organization
            </button>
          </div>

          {/* Billing Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {copilotBilling.seat_breakdown.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Seats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {copilotBilling.seat_breakdown.active_this_cycle}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active This Cycle</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {copilotBilling.seat_breakdown.pending_invitation}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending Invitation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {copilotBilling.seat_breakdown.pending_cancellation}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending Cancellation</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Seat Management:</strong> {copilotBilling.seat_management_setting.replace('_', ' ')}</p>
              <p><strong>Public Code Suggestions:</strong> {copilotBilling.public_code_suggestions}</p>
              {copilotBilling.seat_breakdown.pending_cancellation > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                    ⚠️ {copilotBilling.seat_breakdown.pending_cancellation} user(s) have pending cancellations
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                    Cancelled users will lose access at the beginning of the next billing cycle (typically the 1st of the month)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setViewMode('add-users');
                clearMessages();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Users to Copilot
            </button>
            <button
              onClick={() => {
                setViewMode('remove-users');
                clearMessages();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove Users from Copilot
            </button>
          </div>

          {/* Pending Cancellations Alert */}
          {copilotSeats.some(seat => seat.pending_cancellation_date) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Users with Pending Cancellations
              </h3>
              <div className="space-y-2">
                {copilotSeats
                  .filter(seat => seat.pending_cancellation_date)
                  .map(seat => (
                    <div key={seat.assignee.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center">
                        <img
                          src={seat.assignee.avatar_url}
                          alt={seat.assignee.login}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {seat.assignee.login}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Cancelled on: {formatDate(seat.pending_cancellation_date!)}
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full">
                        Access ends next billing cycle
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> Cancelled users will lose Copilot access at the beginning of the next billing cycle (typically the 1st of the month). 
                  They currently still have access until that date.
                </p>
              </div>
            </div>
          )}

          {/* Current Copilot Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Copilot Users ({copilotSeats.length})
              </h3>
              {copilotSeats.length > 0 && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Active: {copilotSeats.filter(seat => !seat.pending_cancellation_date).length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Pending Cancellation: {copilotSeats.filter(seat => seat.pending_cancellation_date).length}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {copilotSeats.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No users currently have Copilot access</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">User</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Added</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Last Activity</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copilotSeats.map((seat) => (
                      <tr key={seat.assignee.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3">
                          <div className="flex items-center">
                            <img
                              src={seat.assignee.avatar_url}
                              alt={seat.assignee.login}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {seat.assignee.login}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(seat.created_at)}
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                          {seat.last_activity_at ? formatDate(seat.last_activity_at) : 'No activity'}
                        </td>
                        <td className="py-3">
                          {seat.pending_cancellation_date ? (
                            <div className="flex flex-col">
                              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full mb-1">
                                Pending Cancellation
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Cancelled on: {formatDate(seat.pending_cancellation_date)}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Users View */}
      {viewMode === 'add-users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Add Users to Copilot - {selectedOrg}
            </h2>
            <button
              onClick={() => {
                setViewMode('copilot-overview');
                clearMessages();
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Usernames
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter GitHub usernames (not email addresses), one per line. Users who are not organization members will be automatically invited before being added to Copilot.
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-500">Example: octocat, not user@example.com</span>
            </p>
            <textarea
              value={newUsernames}
              onChange={(e) => setNewUsernames(e.target.value)}
              placeholder="octocat&#10;github-user&#10;username123"
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleAddUsers}
                disabled={isLoading || !newUsernames.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding Users...' : 'Add Users to Copilot'}
              </button>
              <button
                onClick={() => setNewUsernames('')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Users View */}
      {viewMode === 'remove-users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Remove Users from Copilot - {selectedOrg}
            </h2>
            <button
              onClick={() => {
                setViewMode('copilot-overview');
                setSelectedUsersForRemoval([]);
                clearMessages();
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Overview
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Users to Remove ({selectedUsersForRemoval.length} selected)
            </h3>
            
            {copilotSeats.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No users currently have Copilot access</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {copilotSeats.map((seat) => (
                    <label
                      key={seat.assignee.id}
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsersForRemoval.includes(seat.assignee.login)}
                        onChange={() => toggleUserSelection(seat.assignee.login)}
                        className="mr-3"
                      />
                      <img
                        src={seat.assignee.avatar_url}
                        alt={seat.assignee.login}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {seat.assignee.login}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Added: {formatDate(seat.created_at)}
                          {seat.last_activity_at && ` • Last activity: ${formatDate(seat.last_activity_at)}`}
                        </div>
                      </div>
                      {seat.pending_cancellation_date && (
                        <div className="flex flex-col">
                          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full">
                            Pending Cancellation
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Cancelled: {formatDate(seat.pending_cancellation_date)}
                          </span>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleRemoveUsers}
                    disabled={isLoading || selectedUsersForRemoval.length === 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Removing Users...' : `Remove ${selectedUsersForRemoval.length} User(s)`}
                  </button>
                  <button
                    onClick={() => setSelectedUsersForRemoval([])}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}