import { useState } from 'react';
import githubService from '../services/githubService';

interface DeleteUserAccessProps {
  token: string;
  username: string;
  onBack: () => void;
  selectedScope?: 'user' | 'org' | 'all';
  selectedOrg?: string;
}

export default function DeleteUserAccess({ 
  token, 
  onBack, 
  selectedScope = 'user', 
  selectedOrg = '' 
}: DeleteUserAccessProps) {
  const [targetUsername, setTargetUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRepos, setUserRepos] = useState<string[]>([]);
  const [searchProgress, setSearchProgress] = useState('');
  const [totalRepos, setTotalRepos] = useState(0);
  const [processedRepos, setProcessedRepos] = useState(0);
  const [removeErrors, setRemoveErrors] = useState<{ repo: string; error: string }[]>([]);

  const searchUserAccess = async () => {
    if (!targetUsername.trim()) {
      setError('Please enter a username to search');
      return;
    }

    setSearching(true);
    setError('');
    setSuccess('');
    setProcessedRepos(0);
    githubService.setToken(token);

    try {
      // Get repositories based on selected scope
      let allRepos;
      if (selectedScope === 'user') {
        // Only search user's own repositories
        allRepos = await githubService.getUserRepositories();
        setSearchProgress(`🚀 Loading your personal repositories...`);
      } else if (selectedScope === 'org' && selectedOrg) {
        // Search specific organization repositories
        allRepos = await githubService.getOrgRepositories(selectedOrg);
        setSearchProgress(`🏢 Loading ${selectedOrg} organization repositories...`);
      } else {
        // Search all repositories including organizations
        const userRepos = await githubService.getUserRepositories();
        const orgs = await githubService.getUserOrganizations();
        const orgRepoArrays = await Promise.all(
          orgs.map(org => githubService.getOrgRepositories(org.login).catch(() => []))
        );
        allRepos = [...userRepos, ...orgRepoArrays.flat()];
        setSearchProgress(`🔍 Loading all repositories + organizations...`);
      }
      
      setTotalRepos(allRepos.length);
      
      let searchMessage;
      if (selectedScope === 'user') {
        searchMessage = `🚀 Searching ${allRepos.length} personal repositories for "${targetUsername}"...`;
      } else if (selectedScope === 'org' && selectedOrg) {
        searchMessage = `🏢 Searching ${allRepos.length} ${selectedOrg} repositories for "${targetUsername}"...`;
      } else {
        searchMessage = `🔍 Searching ${allRepos.length} repositories + orgs for "${targetUsername}"...`;
      }
      setSearchProgress(searchMessage);
      
      // Find repositories where the target user has access - with batching
      const reposWithAccess: string[] = [];
      const BATCH_SIZE = 10; // Process 10 repos at a time to avoid overwhelming the API
      
      for (let i = 0; i < allRepos.length; i += BATCH_SIZE) {
        const batch = allRepos.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (repo) => {
          try {
            const collaborators = await githubService.getRepositoryCollaborators(
              repo.owner.login,
              repo.name
            );
            
            if (collaborators.some(collab => collab.login.toLowerCase() === targetUsername.toLowerCase())) {
              return repo.full_name;
            }
            return null;
          } catch (err) {
            console.warn(`Failed to check collaborators for ${repo.full_name}`);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const foundRepos = batchResults.filter(repo => repo !== null) as string[];
        reposWithAccess.push(...foundRepos);
        
        const newProcessed = i + batch.length;
        setProcessedRepos(newProcessed);
        
        let progressMessage;
        if (selectedScope === 'user') {
          progressMessage = `🚀 Processed ${newProcessed}/${allRepos.length} personal repositories... Found ${reposWithAccess.length} matches`;
        } else if (selectedScope === 'org' && selectedOrg) {
          progressMessage = `🏢 Processed ${newProcessed}/${allRepos.length} ${selectedOrg} repositories... Found ${reposWithAccess.length} matches`;
        } else {
          progressMessage = `🔍 Processed ${newProcessed}/${allRepos.length} repositories + orgs... Found ${reposWithAccess.length} matches`;
        }
        setSearchProgress(progressMessage);
        
        // Small delay between batches to be respectful to the API
        if (i + BATCH_SIZE < allRepos.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setUserRepos(reposWithAccess);
      
      if (reposWithAccess.length === 0) {
        setError(`User "${targetUsername}" does not have access to any of your ${allRepos.length} repositories`);
      } else {
        setSuccess(`Found ${reposWithAccess.length} repositories where "${targetUsername}" has access`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search user access');
    } finally {
      setSearching(false);
      setSearchProgress('');
    }
  };

  const removeUserAccess = async () => {
    if (userRepos.length === 0) return;
    
    setRemoving(true);
    setError('');
    setSuccess('');
    setRemoveErrors([]);
    
    const results = { success: 0, failed: 0 };
    const errors: { repo: string; error: string }[] = [];
    
    for (const repoFullName of userRepos) {
      const [owner, repoName] = repoFullName.split('/');
      try {
        await githubService.removeCollaborator(owner, repoName, targetUsername);
        results.success++;
      } catch (err) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ repo: repoFullName, error: errorMessage });
        console.error(`Failed to remove ${targetUsername} from ${repoFullName}:`, err);
      }
    }
    
    setRemoveErrors(errors);
    
    if (results.success > 0) {
      setSuccess(`Successfully removed "${targetUsername}" from ${results.success} repositories`);
      setUserRepos([]);
    }
    
    if (results.failed > 0) {
      setError(`Failed to remove access from ${results.failed} repositories. See details below.`);
    }
    
    setRemoving(false);
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
                className="mr-6 group inline-flex items-center px-4 py-2 text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 rounded-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20 hover:border-transparent"
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
                    {selectedScope === 'all' && <span className="ml-2 text-green-600">🌐 All repositories + organizations</span>}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  placeholder="Enter GitHub username to search..."
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
              <button
                onClick={searchUserAccess}
                disabled={searching}
                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </>
                  )}
                </div>
              </button>
            </div>
          
            {/* Search Progress */}
            {searching && (
              <div className="mt-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl blur opacity-50"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="flex items-center mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{searchProgress}</p>
                      {totalRepos > 0 && (
                        <div className="mt-3">
                          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-pink-600 h-3 rounded-full transition-all duration-500 shadow-sm" 
                              style={{width: `${(processedRepos / totalRepos) * 100}%`}}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 font-medium">
                            {processedRepos}/{totalRepos} repositories processed ({Math.round((processedRepos / totalRepos) * 100)}%)
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-red-600 mt-3 font-medium">
                        ⚠️ This process may take several minutes for accounts with many repositories
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
                      Repositories with "{targetUsername}" access
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">Found {userRepos.length} repositories with user access</p>
                  </div>
                </div>
                <button
                  onClick={removeUserAccess}
                  disabled={removing}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none overflow-hidden"
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
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove Access from All ({userRepos.length})
                      </>
                    )}
                  </div>
                </button>
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {userRepos.map((repo, index) => (
                  <div key={repo} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/30 hover:border-red-200 transition-all duration-300">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-gray-900 font-medium">{repo}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs px-3 py-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 font-semibold rounded-full">
                          HAS ACCESS
                        </span>
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
              setTargetUsername('');
              setUserRepos([]);
              setError('');
              setSuccess('');
              setRemoveErrors([]);
            }}
            className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
