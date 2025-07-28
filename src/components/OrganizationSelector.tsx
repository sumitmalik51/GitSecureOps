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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Loading Organizations</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Fetching your GitHub data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="relative bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="py-6">
            {/* Back button positioned at far left */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="ml-2 inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
              >
                <span className="mr-2">←</span>
                <span className="font-medium">Back</span>
              </button>
            </div>
            
            {/* Title and description centered */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {title}
                  </h1>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium max-w-4xl mx-auto">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 max-w-md mx-auto">
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Error Loading Data</h3>
                    <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Choose Where to Perform This Action
              </h2>
              <div className="max-w-2xl mx-auto">
                <p className="text-xl text-gray-800 dark:text-gray-200 font-semibold mb-6">
                  Select the scope where you want to perform this operation.
                </p>
                <div className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-lg">
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
                    You can choose to search and manage user access in:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Your personal repositories</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <span className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">A specific GitHub organization</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">All accessible repositories (personal + orgs)</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Important Note</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          This selection determines where the application will scan for user access and apply changes.
                          For organization-level actions, make sure your token has the necessary permissions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* User's Personal Repositories */}
              {user && (
                <div 
                  onClick={() => onSelectScope('user')}
                  className="group relative bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <img
                        src={user.avatar_url}
                        alt={user.login}
                        className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-600 shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white dark:border-gray-600 flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-8 flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors duration-200">
                          {user.name || user.login}
                        </h3>
                        <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-semibold rounded-full">
                          Personal
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-lg mb-3 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                        Your personal repositories only • Fast & focused
                      </p>
                      <div className="flex items-center text-sm">
                        <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                          <span className="font-medium">Recommended for quick access</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 group-hover:scale-110 transition-all duration-200">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Organizations */}
              {organizations.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5a2 2 0 11-4 0 2 2 0 014 0zM9 7h6m-6 4h6m-6 4h6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h3>
                        <p className="text-gray-600 dark:text-gray-400">Select one or multiple organizations</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isMultiSelectMode && selectedOrgs.length > 0 && (
                        <button
                          onClick={handleMultiOrgConfirm}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          Continue with {selectedOrgs.length} org{selectedOrgs.length > 1 ? 's' : ''}
                        </button>
                      )}
                      <button
                        onClick={toggleMultiSelectMode}
                        className={`px-6 py-3 font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md ${
                          isMultiSelectMode 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                        }`}
                      >
                        {isMultiSelectMode ? (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-white">Cancel Selection</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span className="text-white">Multi-Select Mode</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {isMultiSelectMode && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl shadow-md">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-purple-800 dark:text-purple-200 font-bold text-lg">Multi-Select Mode Active</span>
                          <p className="text-purple-600 dark:text-purple-300 text-sm">Select multiple organizations for bulk operations</p>
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg border border-purple-100 dark:border-purple-600">
                        <p className="text-purple-700 dark:text-purple-300 font-medium">
                          💡 Click on the organizations you want to include, then hit "Continue" to proceed with all selected organizations.
                        </p>
                        {selectedOrgs.length > 0 && (
                          <div className="mt-3 flex items-center">
                            <span className="text-sm text-purple-600 dark:text-purple-300">Selected: </span>
                            <div className="ml-2 flex flex-wrap gap-1">
                              {selectedOrgs.map(orgName => (
                                <span key={orgName} className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-full font-medium">
                                  {orgName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {organizations.map((org, index) => {
                      const isSelected = selectedOrgs.includes(org.login);
                      return (
                        <div
                          key={org.id}
                          onClick={() => isMultiSelectMode ? toggleOrgSelection(org.login) : onSelectScope('org', org.login)}
                          className={`group relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                            isMultiSelectMode && isSelected
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-400 dark:border-green-500 shadow-xl transform scale-[1.02] ring-4 ring-green-100 dark:ring-green-800'
                              : isMultiSelectMode
                              ? 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg'
                              : 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg'
                          }`}
                          style={{
                            animationDelay: `${(index + 1) * 100}ms`
                          }}
                        >
                          <div className="flex items-center">
                            {isMultiSelectMode && (
                              <div className="mr-6">
                                <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 shadow-md ${
                                  isSelected 
                                    ? 'bg-green-500 border-green-500 scale-110' 
                                    : 'border-purple-300 dark:border-purple-600 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-gray-700'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="relative">
                              <img
                                src={org.avatar_url}
                                alt={org.login}
                                className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-600 shadow-lg"
                              />
                              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-3 border-white dark:border-gray-600 flex items-center justify-center shadow-md ${
                                isMultiSelectMode && isSelected ? 'bg-green-500' : 'bg-purple-500'
                              }`}>
                                {isMultiSelectMode && isSelected ? (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5a2 2 0 11-4 0 2 2 0 014 0zM9 7h6m-6 4h6m-6 4h6" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="ml-8 flex-1">
                              <div className="flex items-center mb-2">
                                <h4 className={`text-2xl font-bold transition-colors duration-200 ${
                                  isMultiSelectMode && isSelected 
                                    ? 'text-green-800 dark:text-green-300' 
                                    : 'text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300'
                                }`}>
                                  {org.login}
                                </h4>
                                {isMultiSelectMode && isSelected && (
                                  <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-bold rounded-full flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Selected
                                  </span>
                                )}
                              </div>
                              {org.description ? (
                                <p className="text-gray-700 dark:text-gray-300 text-lg mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-200">{org.description}</p>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2 italic">Organization workspace</p>
                              )}
                              <div className="bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-full flex items-center">
                                <span className={`w-3 h-3 rounded-full mr-2 animate-pulse ${
                                  isMultiSelectMode && isSelected ? 'bg-green-400' : 'bg-purple-400'
                                }`}></span>
                                <span className="text-sm font-medium">{isMultiSelectMode && isSelected ? 'Selected for operation' : 'Team collaboration space'}</span>
                              </div>
                            </div>
                            {!isMultiSelectMode && (
                              <div className="text-purple-600 dark:text-purple-400 group-hover:text-purple-800 dark:group-hover:text-purple-300 group-hover:scale-110 transition-all duration-200">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/60 shadow-md">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="mt-8">
                <div 
                  onClick={() => onSelectScope('all')}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-2xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                  <div className="relative bg-white dark:bg-gray-800 border-2 border-transparent rounded-2xl p-8 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 transform hover:scale-[1.02] shadow-xl group-hover:shadow-2xl">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="h-24 w-24 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">∞</span>
                        </div>
                      </div>
                      <div className="ml-6 flex-1">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                          All Repositories
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                          Search across all your personal and organization repositories
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="px-2 py-1 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                            GLOBAL ACCESS
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
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
                    <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 rounded-xl p-8 shadow-lg max-w-md mx-auto">
                      <div className="mb-4">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        Personal Account Only
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                        No organizations found. This could be due to:
                      </p>
                      <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2 mb-4 text-left">
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
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full inline-block">
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
      </div>
    </div>
  );
};

export default OrganizationSelector;
