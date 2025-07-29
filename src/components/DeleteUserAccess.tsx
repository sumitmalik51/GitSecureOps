import { useState } from 'react';
import githubService, { type RepoAccess } from '../services/githubService';
import notificationService from '../services/notificationService';
import ProgressBar from './ProgressBar';

interface DeleteUserAccessProps {
  token: string;
  username: string;
  onBack: () => void;
  selectedScope?: 'user' | 'org' | 'all' | 'multi-org';
  selectedOrg?: string;
  selectedOrgs?: string[];
}

export default function DeleteUserAccess({ 
  token, 
  onBack, 
  selectedScope = 'user', 
  selectedOrg = '',
  selectedOrgs = []
}: DeleteUserAccessProps) {
  const [targetUsernames, setTargetUsernames] = useState<string[]>(['']);
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRepos, setUserRepos] = useState<RepoAccess[]>([]);
  const [searchProgress, setSearchProgress] = useState('');
  const [searchProgressValue, setSearchProgressValue] = useState(0);
  const [removeProgressValue, setRemoveProgressValue] = useState(0);
  const [totalRepos, setTotalRepos] = useState(0);
  const [processedRepos, setProcessedRepos] = useState(0);
  const [removeErrors, setRemoveErrors] = useState<{ repo: string; error: string }[]>([]);
  const [currentPhase, setCurrentPhase] = useState('');

  // Helper functions for multi-user management
  const addUserField = () => {
    setTargetUsernames([...targetUsernames, '']);
  };

  const removeUserField = (index: number) => {
    if (targetUsernames.length > 1) {
      const newUsernames = targetUsernames.filter((_, i) => i !== index);
      setTargetUsernames(newUsernames);
    }
  };

  const updateUsername = (index: number, value: string) => {
    const newUsernames = [...targetUsernames];
    newUsernames[index] = value;
    setTargetUsernames(newUsernames);
  };

  const getValidUsernames = () => {
    return targetUsernames.filter(username => username.trim() !== '');
  };

  const searchUserAccess = async () => {
    const validUsernames = getValidUsernames();
    if (validUsernames.length === 0) {
      setError('Please enter at least one username to search');
      return;
    }

    setSearching(true);
    setError('');
    setSuccess('');
    setProcessedRepos(0);
    setSearchProgressValue(0);
    githubService.setToken(token);

    try {
      // Phase 1: Load repositories
      setCurrentPhase('Loading Repositories');
      setSearchProgress('🚀 Initializing repository search...');
      setSearchProgressValue(5);
      
      let allRepos;
      if (selectedScope === 'user') {
        setSearchProgress(`🚀 Loading your personal repositories...`);
        allRepos = await githubService.getUserRepositories();
        setSearchProgress(`🚀 Loaded ${allRepos.length} personal repositories`);
      } else if (selectedScope === 'org' && selectedOrg) {
        setSearchProgress(`🏢 Loading ${selectedOrg} organization repositories...`);
        allRepos = await githubService.getOrgRepositories(selectedOrg);
        setSearchProgress(`🏢 Loaded ${allRepos.length} ${selectedOrg} organization repositories`);
      } else if (selectedScope === 'multi-org' && selectedOrgs && selectedOrgs.length > 0) {
        setSearchProgress(`🏢 Loading ${selectedOrgs.length} selected organizations...`);
        setSearchProgressValue(10);
        const orgRepoArrays = await Promise.all(
          selectedOrgs.map(orgLogin => 
            githubService.getOrgRepositories(orgLogin).catch(() => [])
          )
        );
        allRepos = orgRepoArrays.flat();
        setSearchProgress(`🏢 Loaded ${allRepos.length} repositories from ${selectedOrgs.length} organizations`);
      } else {
        setSearchProgress(`🔍 Loading all repositories + organizations...`);
        setSearchProgressValue(10);
        const userRepos = await githubService.getUserRepositories();
        const orgs = await githubService.getUserOrganizations();
        const orgRepoArrays = await Promise.all(
          orgs.map(org => githubService.getOrgRepositories(org.login).catch(() => []))
        );
        allRepos = [...userRepos, ...orgRepoArrays.flat()];
        setSearchProgress(`🔍 Loaded ${allRepos.length} repositories from all sources`);
      }
      
      setTotalRepos(allRepos.length);
      setSearchProgressValue(20);
      
      // Phase 2: Search for user access
      setCurrentPhase('Searching for User Access');
      const userList = validUsernames.join(', ');
      let searchMessage;
      if (selectedScope === 'user') {
        searchMessage = `🚀 Searching ${allRepos.length} personal repositories for users: ${userList}...`;
      } else if (selectedScope === 'org' && selectedOrg) {
        searchMessage = `🏢 Searching ${allRepos.length} ${selectedOrg} repositories for users: ${userList}...`;
      } else if (selectedScope === 'multi-org' && selectedOrgs && selectedOrgs.length > 0) {
        searchMessage = `🏢 Searching ${allRepos.length} repositories from ${selectedOrgs.length} orgs for users: ${userList}...`;
      } else {
        searchMessage = `🔍 Searching ${allRepos.length} repositories + orgs for users: ${userList}...`;
      }
      setSearchProgress(searchMessage);
      
      // Find repositories where any of the target users have access - with batching
      const reposWithAccess: RepoAccess[] = [];
      const BATCH_SIZE = 10; // Process 10 repos at a time to avoid overwhelming the API
      
      for (let i = 0; i < allRepos.length; i += BATCH_SIZE) {
        const batch = allRepos.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (repo) => {
          try {
            // First, only check if any target user is a direct collaborator
            const collaborators = await githubService.getRepositoryCollaborators(
              repo.owner.login,
              repo.name
            );
            
            const foundUsers = collaborators.filter(collab => 
              validUsernames.some(username => 
                collab.login.toLowerCase() === username.toLowerCase()
              )
            );
            
            // Return info for each found user
            const userAccesses = [];
            for (const user of foundUsers) {
              const repoAccess = await githubService.getUserPermissionForRepo(
                repo.owner.login,
                repo.name,
                user.login
              );
              
              userAccesses.push({
                repo: repo.full_name,
                hasAccess: true,
                permission: repoAccess.permission,
                permissionIcon: repoAccess.permissionIcon,
                permissionColor: repoAccess.permissionColor,
                user: user.login
              });
            }
            
            return userAccesses;
          } catch (err) {
            // If we can't check collaborators, the user likely doesn't have admin access to this repo
            console.warn(`Cannot check collaborators for ${repo.full_name} - likely no admin access:`, err);
            return [];
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const foundRepos = batchResults.flat().filter(repo => repo !== null) as RepoAccess[];
        reposWithAccess.push(...foundRepos);
        
        const newProcessed = i + batch.length;
        setProcessedRepos(newProcessed);
        
        // Calculate progress (20% for repo loading, 75% for searching, 5% for completion)
        const searchingProgress = 20 + ((newProcessed / allRepos.length) * 75);
        setSearchProgressValue(searchingProgress);
        
        let progressMessage;
        if (selectedScope === 'user') {
          progressMessage = `🚀 Processed ${newProcessed}/${allRepos.length} personal repositories... Found ${reposWithAccess.length} matches`;
        } else if (selectedScope === 'org' && selectedOrg) {
          progressMessage = `🏢 Processed ${newProcessed}/${allRepos.length} ${selectedOrg} repositories... Found ${reposWithAccess.length} matches`;
        } else if (selectedScope === 'multi-org' && selectedOrgs && selectedOrgs.length > 0) {
          progressMessage = `🏢 Processed ${newProcessed}/${allRepos.length} repositories from ${selectedOrgs.length} orgs... Found ${reposWithAccess.length} matches`;
        } else {
          progressMessage = `🔍 Processed ${newProcessed}/${allRepos.length} repositories + orgs... Found ${reposWithAccess.length} matches`;
        }
        setSearchProgress(progressMessage);
        
        // Small delay between batches to be respectful to the API
        if (i + BATCH_SIZE < allRepos.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Phase 3: Finalization
      setCurrentPhase('Finalizing Search');
      setSearchProgressValue(98);
      setUserRepos(reposWithAccess);
      setSearchProgressValue(100);
      
      if (reposWithAccess.length === 0) {
        setError(`None of the specified users (${userList}) have access to any of your ${allRepos.length} repositories`);
        setSearchProgress(`❌ Search complete - No access found for users: ${userList}`);
        
        // Send notification
        notificationService.warning(
          'No Access Found',
          `No repository access found for users: ${userList}`,
          'user_access_search',
          {
            usersSearched: userList,
            repositoriesScanned: allRepos.length,
            scope: selectedScope,
            organization: selectedOrg || 'All'
          }
        );
      } else {
        setSuccess(`Found ${reposWithAccess.length} repository access entries for users: ${userList}`);
        setSearchProgress(`✅ Search complete - Found ${reposWithAccess.length} access entries for users: ${userList}`);
        
        // Send notification
        notificationService.success(
          'Access Search Complete',
          `Found ${reposWithAccess.length} repository access entries for users: ${userList}`,
          'user_access_search',
          {
            usersSearched: userList,
            accessEntriesFound: reposWithAccess.length,
            repositoriesScanned: allRepos.length,
            scope: selectedScope,
            organization: selectedOrg || 'All'
          }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search user access');
      setSearchProgressValue(0);
    } finally {
      setSearching(false);
      // Keep progress visible for a moment after completion
      setTimeout(() => {
        if (!searching) {
          setSearchProgress('');
          setCurrentPhase('');
          setSearchProgressValue(0);
        }
      }, 3000);
    }
  };

  const removeUserAccess = async () => {
    if (userRepos.length === 0) return;
    
    setRemoving(true);
    setError('');
    setSuccess('');
    setRemoveErrors([]);
    setRemoveProgressValue(0);
    setCurrentPhase('Removing User Access');
    
    const results = { success: 0, failed: 0 };
    const errors: { repo: string; error: string }[] = [];
    let processed = 0;
    
    const uniqueUsers = [...new Set(userRepos.map(repo => repo.user))];
    const userList = uniqueUsers.join(', ');
    
    setSearchProgress(`🚨 Starting removal of users (${userList}) from ${userRepos.length} repository access entries...`);
    setRemoveProgressValue(5);
    
    for (const repoAccess of userRepos) {
      const [owner, repoName] = repoAccess.repo.split('/');
      if (!repoAccess.user) {
        console.warn(`No user specified for repository ${repoAccess.repo}`);
        continue;
      }
      
      try {
        setSearchProgress(`🗑️ Removing "${repoAccess.user}" from ${repoAccess.repo}...`);
        await githubService.removeCollaborator(owner, repoName, repoAccess.user);
        results.success++;
        setSearchProgress(`✅ Removed "${repoAccess.user}" from ${repoAccess.repo}`);
      } catch (err) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ repo: `${repoAccess.repo} (${repoAccess.user})`, error: errorMessage });
        console.error(`Failed to remove ${repoAccess.user} from ${repoAccess.repo}:`, err);
        setSearchProgress(`❌ Failed to remove "${repoAccess.user}" from ${repoAccess.repo}`);
      }
      
      processed++;
      const progress = (processed / userRepos.length) * 95; // Reserve 5% for finalization
      setRemoveProgressValue(5 + progress);
      setSearchProgress(`🔄 Progress: ${processed}/${userRepos.length} access entries processed (${results.success} successful, ${results.failed} failed)`);
      
      // Small delay between removals to be respectful to the API
      if (processed < userRepos.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Finalization
    setRemoveProgressValue(100);
    setRemoveErrors(errors);
    
    if (results.success > 0) {
      setSuccess(`Successfully removed user access from ${results.success} repository entries for users: ${userList}`);
      setUserRepos([]);
      setSearchProgress(`✅ Removal complete! Successfully removed access from ${results.success} repository entries`);
      
      // Send success notification
      notificationService.success(
        'Access Removal Complete',
        `Successfully removed user access from ${results.success} repository entries`,
        'user_access_removed',
        {
          usersAffected: userList,
          repositoriesModified: results.success,
          failedOperations: results.failed,
          scope: selectedScope,
          organization: selectedOrg || 'All'
        }
      );
    }
    
    if (results.failed > 0) {
      setError(`Failed to remove access from ${results.failed} repository entries. See details below.`);
      setSearchProgress(`⚠️ Removal completed with ${results.failed} failures. Check details below.`);
      
      // Send warning notification for failures
      notificationService.warning(
        'Some Access Removals Failed',
        `${results.failed} access removal operations failed. Check the error details.`,
        'user_access_removal_failed',
        {
          usersAffected: userList,
          successfulRemovals: results.success,
          failedRemovals: results.failed,
          scope: selectedScope,
          organization: selectedOrg || 'All'
        }
      );
    }
    
    setRemoving(false);
    
    // Keep progress visible for a moment after completion
    setTimeout(() => {
      if (!removing) {
        setSearchProgress('');
        setCurrentPhase('');
        setRemoveProgressValue(0);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-red-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-400 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-6 group inline-flex items-center px-4 py-2 text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 rounded-lg transition-all duration-300 transform hover:scale-[1.01] backdrop-blur-sm border border-white/20 hover:border-transparent"
              >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Delete User Access
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Remove a specific user's access from all repositories</p>
                <div className="flex items-center mt-3 space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-red-600">DANGER ZONE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Info Banner */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-xl blur opacity-40"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Enhanced User Access Verification
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  What We Verify
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Direct collaborator status only</li>
                  <li>• Explicit repository permissions</li>
                  <li>• Your admin access to each repo</li>
                  <li>• Actual removal capabilities</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <span className="text-red-500 mr-2">❌</span>
                  What We Filter Out
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Public repository visibility</li>
                  <li>• Organization-level access</li>
                  <li>• Team-inherited permissions</li>
                  <li>• Repos without your admin rights</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-3">🛡️</span>
                <div className="text-sm text-green-800">
                  <strong>Improved Accuracy:</strong> Now showing only repositories where the user is a direct collaborator and you have admin permissions to remove them.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-pink-500 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Search User Access
              </h2>
            </div>
            
            {/* Current Scope Display */}
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl blur opacity-50"></div>
              <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">📍</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="text-blue-700">Search Scope:</span> 
                    {selectedScope === 'user' && <span className="ml-2 text-blue-600">👤 Your personal repositories</span>}
                    {selectedScope === 'org' && <span className="ml-2 text-purple-600">🏢 {selectedOrg} organization</span>}
                    {selectedScope === 'multi-org' && selectedOrgs && (
                      <span className="ml-2 text-purple-600">
                        🏢 {selectedOrgs.length} organizations: {selectedOrgs.join(', ')}
                      </span>
                    )}
                    {selectedScope === 'all' && <span className="ml-2 text-green-600">🌐 All repositories + organizations</span>}
                  </p>
                </div>
              </div>
            </div>
            
            
            {/* Multi-User Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  <span className="text-red-600">👥</span> Target Users
                </h3>
                <button
                  onClick={addUserField}
                  className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  disabled={searching}
                >
                  + Add User
                </button>
              </div>
              
              {targetUsernames.map((username, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => updateUsername(index, e.target.value)}
                      placeholder={`Enter GitHub username ${index + 1}...`}
                      className="block w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500 text-gray-900 font-medium transition-all duration-300 hover:bg-white/90"
                      onKeyPress={(e) => e.key === 'Enter' && !searching && searchUserAccess()}
                      disabled={searching}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {targetUsernames.length > 1 && (
                    <button
                      onClick={() => removeUserField(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300"
                      disabled={searching}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 mt-6">
              <div className="flex-1">
                {/* Additional info or status */}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">💡 Tip:</span> You can search for multiple users at once to bulk manage their repository access.
                </p>
              </div>
              
              <button
                onClick={searchUserAccess}
                disabled={searching || getValidUsernames().length === 0}
                className="group relative px-8 py-3 bg-white border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center">
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 group-hover:scale-105 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search ({getValidUsernames().length} user{getValidUsernames().length !== 1 ? 's' : ''})
                    </>
                  )}
                </div>
              </button>
            </div>
          
            {/* Search/Remove Progress */}
            {(searching || removing) && (
              <div className="mt-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl blur opacity-50"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xl">{removing ? '🗑️' : '🔍'}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                        {currentPhase || (removing ? 'Removing User Access' : 'Searching User Access')}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">Please wait while we process your request...</p>
                    </div>
                  </div>
                  
                  <ProgressBar 
                    progress={removing ? removeProgressValue : searchProgressValue}
                    message={searchProgress}
                    subMessage={`⚠️ This process may take several minutes for accounts with many repositories. ${processedRepos > 0 && totalRepos > 0 ? `Processing ${processedRepos}/${totalRepos} repositories.` : ''}`}
                    color={removing ? "red" : "purple"}
                    size="lg"
                    animated={true}
                    showPercentage={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Permission Legend */}
        {userRepos.length > 0 && (
          <div className="mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl blur opacity-30"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🔑</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Permission Levels Explained
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-lg mr-3">🟢</span>
                  <div>
                    <div className="font-semibold text-green-800">ADMIN</div>
                    <div className="text-xs text-green-600">Can manage all settings</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-lg mr-3">🟡</span>
                  <div>
                    <div className="font-semibold text-yellow-800">WRITE</div>
                    <div className="text-xs text-yellow-600">Can push but not manage</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-lg mr-3">🔵</span>
                  <div>
                    <div className="font-semibold text-blue-800">READ</div>
                    <div className="text-xs text-blue-600">Can view but not modify</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-lg mr-3">🌍</span>
                  <div>
                    <div className="font-semibold text-green-800">PUBLIC</div>
                    <div className="text-xs text-green-600">Public repository access</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-3">💡</span>
                  <div className="text-sm text-yellow-800">
                    <strong>Note:</strong> You can only remove access from repositories where you have admin permissions (🟢).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {error && (
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl blur opacity-75"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-red-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">❌</span>
                </div>
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl blur opacity-75"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">✅</span>
                </div>
                <div className="text-green-700 font-medium">{success}</div>
              </div>
            </div>
          </div>
        )}

        {userRepos.length > 0 && (
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-pink-500 to-purple-600 rounded-2xl blur-lg opacity-75"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-xl">🚨</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                      Repositories with User Access
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">Found {userRepos.length} repositories with user access</p>
                  </div>
                </div>
                <button
                  onClick={removeUserAccess}
                  disabled={removing}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    {removing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Removing Access...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 group-hover:scale-105 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove Access from All ({userRepos.length})
                      </>
                    )}
                  </div>
                </button>
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {userRepos.map((repoAccess, index) => (
                  <div key={repoAccess.repo} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/30 hover:border-red-200 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{repoAccess.repo}</span>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center">
                              <span className="text-lg mr-1">{repoAccess.permissionIcon}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${repoAccess.permissionColor}`}>
                                {repoAccess.permission.toUpperCase()}
                              </span>
                            </div>
                            {repoAccess.user && (
                              <div className="text-xs text-gray-600 ml-2">
                                <span className="font-medium">User:</span> 
                                <span className="ml-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">
                                  {repoAccess.user}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {repoAccess.hasAccess ? (
                          <span className="text-xs px-3 py-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 font-semibold rounded-full">
                            HAS ACCESS
                          </span>
                        ) : (
                          <span className="text-xs px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 font-semibold rounded-full">
                            VISIBLE ONLY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {removeErrors.length > 0 && (
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl blur-lg opacity-75"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Removal Errors ({removeErrors.length})
                </h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {removeErrors.map((errorInfo, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-white/80 backdrop-blur-sm border border-red-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 flex items-center">
                            <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                              {index + 1}
                            </span>
                            {errorInfo.repo}
                          </p>
                          <p className="text-xs text-red-700 mt-2 ml-8">{errorInfo.error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-xl opacity-50"></div>
                <div className="relative bg-white/80 backdrop-blur-sm p-4 border border-yellow-300 rounded-xl">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-white text-sm">💡</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        Common reasons for failures:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                          You don't have admin access to the repository
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                          The user is the repository owner (cannot remove owner)
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                          The user is not actually a collaborator (might be org member)
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                          Repository doesn't exist or is private to you
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reset Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setTargetUsernames(['']);
              setUserRepos([]);
              setError('');
              setSuccess('');
              setRemoveErrors([]);
            }}
            className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Form
          </button>
        </div>
      </div>
    </div>
  );
}
