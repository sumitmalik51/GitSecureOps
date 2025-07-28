import React, { useState, useEffect } from 'react';
import githubService from '../services/githubService';

interface GitHubOrg {
  id: number;
  login: string;
  avatar_url: string;
  description?: string | null;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name?: string;
}

interface OrganizationSelectorProps {
  onBack: () => void;
  onSelectScope: (scope: 'user' | 'org' | 'all', orgLogin?: string) => void;
  title: string;
  description: string;
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  onBack,
  onSelectScope,
  title,
  description
}) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user info and organizations in parallel
      const [userData, orgsData] = await Promise.all([
        githubService.getAuthenticatedUser(),
        githubService.getUserOrganizations()
      ]);

      setUser(userData);
      setOrganizations(orgsData);
    } catch (err) {
      setError('Failed to load organizations. Please check your token permissions.');
      console.error('Error loading organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading organizations...</p>
          <p className="text-sm text-gray-500 mt-2">Discovering your GitHub workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-6 inline-flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <span className="mr-2">←</span>
                <span className="font-medium">Back</span>
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  <p className="mt-1 text-gray-600 font-medium">{description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-red-100 rounded-2xl animate-pulse opacity-50"></div>
            <div className="relative bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">⚠️</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">Oops! Something went wrong</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Select Your Scope
            </h2>
            <p className="text-gray-600 mt-2">Choose where you'd like to perform this action</p>
          </div>
          
          <div className="space-y-6">
            {/* User's Personal Repositories */}
            {user && (
              <div 
                onClick={() => onSelectScope('user')}
                className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-2xl p-6 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
              >
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="h-16 w-16 rounded-full border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs">👤</span>
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                      ✨ {user.name || user.login} (Personal)
                    </h3>
                    <p className="text-gray-600 mt-1 group-hover:text-gray-700">
                      Your personal repositories only • Fast & focused
                    </p>
                    <div className="flex items-center mt-2 text-sm text-blue-600">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      <span>Recommended for quick access</span>
                    </div>
                  </div>
                  <div className="text-blue-600 group-hover:text-blue-700 group-hover:scale-105 transition-all duration-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organizations */}
            {organizations.length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🏢</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Organizations</h3>
                </div>
                <div className="space-y-4">
                  {organizations.map((org, index) => (
                    <div
                      key={org.id}
                      onClick={() => onSelectScope('org', org.login)}
                      className="group relative bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200/50 rounded-2xl p-6 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                      style={{
                        animationDelay: `${(index + 1) * 100}ms`
                      }}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <img
                            src={org.avatar_url}
                            alt={org.login}
                            className="h-16 w-16 rounded-full border-4 border-white shadow-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs">🏢</span>
                          </div>
                        </div>
                        <div className="ml-6 flex-1">
                          <h4 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200">
                            🏢 {org.login}
                          </h4>
                          {org.description ? (
                            <p className="text-gray-600 mt-1 group-hover:text-gray-700">{org.description}</p>
                          ) : (
                            <p className="text-gray-500 mt-1 italic">Organization workspace</p>
                          )}
                          <div className="flex items-center mt-2 text-sm text-purple-600">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                            <span>Team collaboration space</span>
                          </div>
                        </div>
                        <div className="text-purple-600 group-hover:text-purple-700 group-hover:scale-105 transition-all duration-200">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Repositories Option */}
            <div 
              onClick={() => onSelectScope('all')}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/95 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl group-hover:shadow-2xl">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-14 w-14 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl animate-pulse">🌐</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">∞</span>
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      All Repositories
                    </h3>
                    <p className="text-gray-600 mt-1 font-medium">
                      Search across all your personal and organization repositories
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="px-2 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 text-xs font-semibold rounded-full">
                        GLOBAL ACCESS
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-600 group-hover:text-purple-600 transition-colors duration-300">
                    <svg className="w-8 h-8 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {organizations.length === 0 && !loading && (
            <div className="mt-8 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-lg opacity-30"></div>
                <div className="relative bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-8 shadow-lg">
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-3xl">👤</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Personal Account Only
                  </h3>
                  <p className="text-gray-600">
                    No organizations found. You only have access to personal repositories.
                  </p>
                  <div className="mt-4">
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold rounded-full inline-block">
                      PERSONAL ACCESS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationSelector;
