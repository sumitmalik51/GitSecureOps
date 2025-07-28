import { useState, useEffect } from 'react';
import githubService from '../services/githubService';
import type { GitHubRepo } from '../services/githubService';

interface RepositoryListViewProps {
  token: string;
  username: string;
  onBack: () => void;
  repoType: 'private' | 'public';
  selectedScope?: 'user' | 'org' | 'all';
  selectedOrg?: string;
}

export default function RepositoryListView({ 
  token, 
  onBack, 
  repoType, 
  selectedScope = 'user', 
  selectedOrg = '' 
}: RepositoryListViewProps) {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRepositories();
  }, [token, repoType]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError('');
      githubService.setToken(token);
      
      // Get repositories based on selected scope
      let allRepos;
      if (selectedScope === 'user') {
        // Only load user's personal repositories
        allRepos = await githubService.getUserRepositories();
      } else if (selectedScope === 'org' && selectedOrg) {
        // Load specific organization repositories
        allRepos = await githubService.getOrgRepositories(selectedOrg);
      } else {
        // Load all repositories including organizations
        const userRepos = await githubService.getUserRepositories();
        const orgs = await githubService.getUserOrganizations();
        const orgRepoArrays = await Promise.all(
          orgs.map(org => githubService.getOrgRepositories(org.login).catch(() => []))
        );
        allRepos = [...userRepos, ...orgRepoArrays.flat()];
      }
      
      // Filter by repo type
      const filteredRepos = allRepos.filter(repo => {
        if (repoType === 'private') return repo.private;
        if (repoType === 'public') return !repo.private;
        return true;
      });
      
      setRepositories(filteredRepos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvContent = [
      ['Repository Name', 'Full Name', 'Type', 'Description', 'URL'],
      ...filteredRepositories.map(repo => [
        repo.name,
        repo.full_name,
        repo.private ? 'Private' : 'Public',
        repo.description || '',
        repo.html_url
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoType}-repositories-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative text-center">
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative w-32 h-32 mx-auto">
              <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-indigo-500 border-l-blue-500"></div>
            </div>
          </div>
          <p className="text-gray-600 text-xl font-semibold mb-2">Loading {repoType} repositories...</p>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-6 group inline-flex items-center px-4 py-2 text-gray-600 hover:text-white bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-lg transition-all duration-300 transform hover:scale-[1.01] backdrop-blur-sm border border-white/20 hover:border-transparent"
              >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {repoType === 'private' ? '🔒 Private' : '🌍 Public'} Repositories
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  {filteredRepositories.length} {repoType} repositories found
                </p>
                <div className="flex items-center mt-3 space-x-2">
                  <div className={`w-2 h-2 ${repoType === 'private' ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                  <span className={`text-sm font-semibold ${repoType === 'private' ? 'text-red-600' : 'text-green-600'}`}>
                    {repoType === 'private' ? 'PRIVATE REPOS' : 'PUBLIC REPOS'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredRepositories.length === 0}
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <span className="text-xl mr-2">📊</span>
                Export to CSV
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Scope Display */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl blur opacity-50"></div>
          <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/30">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">📍</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                <span className="text-blue-700">Repository Scope:</span> 
                {selectedScope === 'user' && <span className="ml-2 text-blue-600">👤 Your personal repositories</span>}
                {selectedScope === 'org' && <span className="ml-2 text-purple-600">🏢 {selectedOrg} organization</span>}
                {selectedScope === 'all' && <span className="ml-2 text-green-600">🌐 All repositories + organizations</span>}
              </p>
            </div>
          </div>
        </div>

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

        {/* Search */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-xl blur opacity-50"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">🔍</span>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Search Repositories
              </h3>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 text-gray-900 font-medium transition-all duration-300 hover:bg-white/90"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Repository List */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">{repoType === 'private' ? '🔒' : '🌍'}</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Repository Collection
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRepositories.map((repo, index) => (
                  <div key={repo.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-gray-50/60 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:border-blue-200 transition-all duration-300 transform group-hover:scale-[1.01]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{repo.name}</h3>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          repo.private 
                            ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700' 
                            : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                        }`}>
                          {repo.private ? '🔒 Private' : '🌍 Public'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 font-medium">{repo.full_name}</p>
                      
                      {repo.description && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{repo.description}</p>
                      )}
                      
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-white bg-blue-50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-[1.01]"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on GitHub
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredRepositories.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-2xl">🔍</span>
                  </div>
                  <p className="text-gray-600 text-lg font-medium">No {repoType} repositories found matching your search.</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting your search terms or check a different scope.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
