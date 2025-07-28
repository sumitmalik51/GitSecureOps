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
  onSelectScope: (scope: 'user' | 'org' | 'all' | 'multi-org', orgLogin?: string, selectedOrgs?: string[]) => void;
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
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user info first (this usually works)
      const userData = await githubService.getAuthenticatedUser();
      setUser(userData);

      // Then try to get organizations (this might be flaky)
      try {
        const orgsData = await githubService.getUserOrganizations();
        setOrganizations(orgsData);
        
        if (orgsData.length === 0) {
          console.log('No organizations found or organization access limited');
        }
      } catch (orgError: any) {
        console.warn('Failed to load organizations:', orgError);
        // Don't set error state - just continue with empty organizations
        setOrganizations([]);
      }
    } catch (err: any) {
      // Only set error for critical failures (like invalid token)
      if (err.message?.includes('401') || err.message?.includes('invalid') || err.message?.includes('expired')) {
        setError('GitHub token is invalid or expired. Please check your token.');
      } else {
        setError('Failed to load GitHub data. Please try again.');
      }
      console.error('Error loading GitHub data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrgSelection = (orgLogin: string) => {
    setSelectedOrgs(prev => 
      prev.includes(orgLogin) 
        ? prev.filter(org => org !== orgLogin)
        : [...prev, orgLogin]
    );
  };

  const handleMultiOrgConfirm = () => {
    if (selectedOrgs.length > 0) {
      onSelectScope('multi-org', undefined, selectedOrgs);
    }
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedOrgs([]);
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
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Choose Where to Perform This Action
            </h2>
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 font-medium mb-4">
                Select the scope where you want GitSecureOps to operate.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <p className="text-gray-600 mb-4">
                  You can choose to search and manage user access in:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700">Your personal repositories</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="text-gray-700">A specific GitHub organization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700">All accessible repositories (personal + orgs)</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">💡 Note:</span> This selection determines where GitSecureOps will scan for user access and apply changes.
                    For organization-level actions, make sure your token has the necessary permissions.
                  </p>
                </div>
              </div>
            </div>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">🏢</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Organizations</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isMultiSelectMode && selectedOrgs.length > 0 && (
                      <button
                        onClick={handleMultiOrgConfirm}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Continue with {selectedOrgs.length} org{selectedOrgs.length > 1 ? 's' : ''}
                      </button>
                    )}
                    <button
                      onClick={toggleMultiSelectMode}
                      className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md ${
                        isMultiSelectMode 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-black hover:from-red-600 hover:to-red-700' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-black hover:from-purple-600 hover:to-pink-600'
                      }`}
                    >
                      {isMultiSelectMode ? '✕ Cancel' : '📋 Multi-Select'}
                    </button>
                  </div>
                </div>
                
                {isMultiSelectMode && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-purple-600 text-lg">📋</span>
                      <span className="text-purple-800 font-semibold">Multi-Select Mode</span>
                    </div>
                    <p className="text-purple-700 text-sm">
                      Click multiple organizations to select them, then click "Continue" to proceed with all selected organizations.
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  {organizations.map((org, index) => {
                    const isSelected = selectedOrgs.includes(org.login);
                    return (
                      <div
                        key={org.id}
                        onClick={() => isMultiSelectMode ? toggleOrgSelection(org.login) : onSelectScope('org', org.login)}
                        className={`group relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                          isMultiSelectMode && isSelected
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 shadow-lg transform scale-[1.01]'
                            : isMultiSelectMode
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300'
                            : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300'
                        }`}
                        style={{
                          animationDelay: `${(index + 1) * 100}ms`
                        }}
                      >
                        <div className="flex items-center">
                          {isMultiSelectMode && (
                            <div className="mr-4">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-purple-300 hover:border-purple-500'
                              }`}>
                                {isSelected && <span className="text-white text-sm">✓</span>}
                              </div>
                            </div>
                          )}
                          <div className="relative">
                            <img
                              src={org.avatar_url}
                              alt={org.login}
                              className="h-16 w-16 rounded-full border-4 border-white shadow-lg"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                              isMultiSelectMode && isSelected ? 'bg-green-500' : 'bg-purple-500'
                            }`}>
                              <span className="text-xs">{isMultiSelectMode && isSelected ? '✓' : '🏢'}</span>
                            </div>
                          </div>
                          <div className="ml-6 flex-1">
                            <h4 className={`text-xl font-bold transition-colors duration-200 ${
                              isMultiSelectMode && isSelected 
                                ? 'text-green-800' 
                                : 'text-gray-900 group-hover:text-purple-700'
                            }`}>
                              🏢 {org.login}
                              {isMultiSelectMode && isSelected && <span className="ml-2 text-green-600">✓ Selected</span>}
                            </h4>
                            {org.description ? (
                              <p className="text-gray-600 mt-1 group-hover:text-gray-700">{org.description}</p>
                            ) : (
                              <p className="text-gray-500 mt-1 italic">Organization workspace</p>
                            )}
                            <div className={`flex items-center mt-2 text-sm ${
                              isMultiSelectMode && isSelected ? 'text-green-600' : 'text-purple-600'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                                isMultiSelectMode && isSelected ? 'bg-green-400' : 'bg-purple-400'
                              }`}></span>
                              <span>{isMultiSelectMode && isSelected ? 'Selected for operation' : 'Team collaboration space'}</span>
                            </div>
                          </div>
                          {!isMultiSelectMode && (
                            <div className="text-purple-600 group-hover:text-purple-700 group-hover:scale-105 transition-all duration-200">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

          {organizations.length === 0 && !loading && !error && (
            <div className="mt-8 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-lg opacity-30"></div>
                <div className="relative bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-8 shadow-lg max-w-md mx-auto">
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-3xl">👤</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    Personal Account Only
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    No organizations found. This could be due to:
                  </p>
                  <ul className="text-gray-600 text-sm space-y-2 mb-4 text-left">
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">•</span>
                      You only have personal repositories
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">•</span>
                      Organization membership is private
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">•</span>
                      Limited token permissions for organizations
                    </li>
                  </ul>
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
