import { useState } from 'react';
import githubService from '../services/githubService';
import notificationService from '../services/notificationService';
import ProgressBar from './ProgressBar';

interface ExportUsernamesProps {
  token: string;
  username: string;
  onBack: () => void;
  selectedScope?: 'user' | 'org' | 'all' | 'multi-org';
  selectedOrg?: string;
  selectedOrgs?: string[];
}

interface CollaboratorData {
  login: string;
  name: string | null;
  repositories: string[];
}

export default function ExportUsernames({ 
  token, 
  onBack, 
  selectedScope = 'user', 
  selectedOrg = '',
  selectedOrgs: _selectedOrgs = []
}: ExportUsernamesProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [totalRepos, setTotalRepos] = useState(0);
  const [processedRepos, setProcessedRepos] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');

  const loadAllUsers = async () => {
    setLoading(true);
    setError('');
    setCollaborators([]);
    setProgressValue(0);
    setProcessedRepos(0);
    githubService.setToken(token);

    try {
      // Phase 1: Load repositories
      setCurrentPhase('Loading Repositories');
      setProgress('🚀 Initializing repository discovery...');
      setProgressValue(5);
      
      let allRepos;
      if (selectedScope === 'user') {
        setProgress('Loading your personal repositories...');
        allRepos = await githubService.getUserRepositories();
        setProgress(`🚀 Loaded ${allRepos.length} personal repositories`);
      } else if (selectedScope === 'org' && selectedOrg) {
        setProgress(`Loading ${selectedOrg} organization repositories...`);
        allRepos = await githubService.getOrgRepositories(selectedOrg);
        setProgress(`🏢 Loaded ${allRepos.length} ${selectedOrg} organization repositories`);
      } else {
        setProgress('Loading all repositories + organizations...');
        setProgressValue(10);
        const userRepos = await githubService.getUserRepositories();
        
        setProgress(`🏢 Loading organization repositories...`);
        setProgressValue(15);
        const orgs = await githubService.getUserOrganizations();
        const orgRepoArrays = await Promise.all(
          orgs.map(org => githubService.getOrgRepositories(org.login).catch(() => []))
        );
        allRepos = [...userRepos, ...orgRepoArrays.flat()];
        setProgress(`🔍 Loaded ${allRepos.length} repositories from all sources`);
      }
      
      setTotalRepos(allRepos.length);
      setProgressValue(20);
      
      // Phase 2: Process collaborators
      setCurrentPhase('Processing Collaborators');
      setProgress(`🔍 Starting collaborator analysis for ${allRepos.length} repositories...`);
      
      const collaboratorMap = new Map<string, CollaboratorData>();
      let processed = 0;
      
      const BATCH_SIZE = 5; // Process repositories in smaller batches for better progress tracking
      
      for (let i = 0; i < allRepos.length; i += BATCH_SIZE) {
        const batch = allRepos.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (repo) => {
          try {
            const repoCollaborators = await githubService.getRepositoryCollaborators(
              repo.owner.login,
              repo.name
            );
            
            for (const collaborator of repoCollaborators) {
              const existing = collaboratorMap.get(collaborator.login);
              if (existing) {
                existing.repositories.push(repo.full_name);
              } else {
                collaboratorMap.set(collaborator.login, {
                  login: collaborator.login,
                  name: null,
                  repositories: [repo.full_name]
                });
              }
            }
            return { success: true, repo: repo.full_name };
          } catch (err) {
            console.warn(`Failed to load collaborators for ${repo.full_name}`);
            return { success: false, repo: repo.full_name };
          }
        });
        
        await Promise.all(batchPromises);
        processed += batch.length;
        setProcessedRepos(processed);
        
        // Calculate progress (20% for repo loading, 75% for processing, 5% for completion)
        const processingProgress = 20 + ((processed / allRepos.length) * 75);
        setProgressValue(processingProgress);
        
        const currentCollaborators = Array.from(collaboratorMap.values());
        setProgress(`🔍 Processed ${processed}/${allRepos.length} repositories - Found ${currentCollaborators.length} unique users`);
        
        // Update collaborators in real-time
        setCollaborators([...currentCollaborators]);
        
        // Small delay between batches to prevent API overwhelming
        if (i + BATCH_SIZE < allRepos.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Phase 3: Finalization
      setCurrentPhase('Finalizing');
      setProgressValue(98);
      const finalCollaborators = Array.from(collaboratorMap.values());
      setCollaborators(finalCollaborators);
      setProgressValue(100);
      setProgress(`✅ Analysis complete! Found ${finalCollaborators.length} unique users across ${allRepos.length} repositories`);
      
      // Send notification
      notificationService.success(
        'User Analysis Complete',
        `Found ${finalCollaborators.length} unique users across ${allRepos.length} repositories`,
        'user_analysis_completed',
        {
          userCount: finalCollaborators.length,
          repositoryCount: allRepos.length,
          scope: selectedScope,
          organization: selectedOrg || 'All'
        }
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setProgressValue(0);
      
      // Send error notification
      notificationService.error(
        'User Analysis Failed',
        err instanceof Error ? err.message : 'Failed to load users',
        'user_analysis_failed',
        {
          scope: selectedScope,
          organization: selectedOrg || 'All'
        }
      );
    } finally {
      setLoading(false);
      // Keep progress visible for a moment after completion
      setTimeout(() => {
        if (!loading) {
          setProgress('');
          setCurrentPhase('');
          setProgressValue(0);
        }
      }, 3000);
    }
  };

  const exportToExcel = () => {
    // Create CSV content (can be opened in Excel)
    const csvContent = [
      ['Username', 'Repository Count', 'Repositories'],
      ...collaborators.map(user => [
        user.login,
        user.repositories.length.toString(),
        user.repositories.join('; ')
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Send notification
    notificationService.success(
      'Export Complete',
      `Successfully exported ${collaborators.length} users with repository details to CSV`,
      'user_data_exported',
      {
        exportType: 'full',
        userCount: collaborators.length,
        fileName: a.download,
        scope: selectedScope,
        organization: selectedOrg || 'All'
      }
    );
  };

  const exportUsernamesOnly = () => {
    const csvContent = [
      ['Username'],
      ...collaborators.map(user => [user.login])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-usernames-only-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Send notification
    notificationService.success(
      'Usernames Export Complete',
      `Successfully exported ${collaborators.length} usernames to CSV`,
      'usernames_exported',
      {
        exportType: 'usernames-only',
        userCount: collaborators.length,
        fileName: a.download,
        scope: selectedScope,
        organization: selectedOrg || 'All'
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-teal-400 to-green-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-6 group inline-flex items-center px-4 py-2 text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 rounded-lg transition-all duration-300 transform hover:scale-[1.01] backdrop-blur-sm border border-white/20 hover:border-transparent"
              >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  📊 Export All Usernames
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Get all users with repository access</p>
                <div className="flex items-center mt-3 space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-600">DATA EXPORT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Scope Display */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-teal-200 rounded-xl blur opacity-50"></div>
          <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/30">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">📍</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                <span className="text-blue-700">Export Scope:</span> 
                {selectedScope === 'user' && <span className="ml-2 text-blue-600">👤 Your personal repositories</span>}
                {selectedScope === 'org' && <span className="ml-2 text-purple-600">🏢 {selectedOrg} organization</span>}
                {selectedScope === 'all' && <span className="ml-2 text-green-600">🌐 All repositories + organizations</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Load Button */}
        {collaborators.length === 0 && !loading && (
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Load All Users
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                This will scan all your repositories and collect usernames of all collaborators.
              </p>
              <button
                onClick={loadAllUsers}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <svg className="w-6 h-6 mr-3 group-hover:scale-105 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Start Loading Users
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-75"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🔄</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {currentPhase || 'Loading Data'}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Please wait while we process your request...</p>
                </div>
              </div>
              
              <ProgressBar 
                progress={progressValue}
                message={progress}
                subMessage={`This may take a few minutes for accounts with many repositories. ${processedRepos > 0 ? `Processing ${processedRepos}/${totalRepos} repositories.` : ''}`}
                color="emerald"
                size="lg"
                animated={true}
                showPercentage={true}
              />
              
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
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

        {/* Results */}
        {collaborators.length > 0 && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Summary
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative group text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/30">
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {collaborators.length}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold">Total Users</div>
                    </div>
                  </div>
                  <div className="relative group text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/30">
                      <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        {collaborators.reduce((total, user) => total + user.repositories.length, 0)}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold">Total Access Grants</div>
                    </div>
                  </div>
                  <div className="relative group text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/30">
                      <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        {Math.round(collaborators.reduce((total, user) => total + user.repositories.length, 0) / collaborators.length * 10) / 10}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold">Avg Repos per User</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-xl">📤</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Export Options
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={exportToExcel}
                    className="group relative flex-1 inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center">
                      <span className="text-xl mr-3">📊</span>
                      Export Full Details to Excel
                    </div>
                  </button>
                  <button
                    onClick={exportUsernamesOnly}
                    className="group relative flex-1 inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center">
                      <span className="text-xl mr-3">📝</span>
                      Export Usernames Only
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* User List Preview */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="px-6 py-6 sm:p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-xl">👥</span>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      User Preview
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {collaborators.slice(0, 50).map((user, index) => (
                        <div key={user.login} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                          <div className="relative flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/30 hover:border-indigo-200 transition-all duration-300">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="text-gray-900 font-medium">{user.login}</span>
                            </div>
                            <span className="text-sm px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold rounded-full">
                              {user.repositories.length} repo{user.repositories.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {collaborators.length > 50 && (
                      <div className="text-center py-6">
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-slate-200 rounded-xl opacity-50"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                            <span className="text-gray-600 font-medium">
                              ... and {collaborators.length - 50} more users
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
